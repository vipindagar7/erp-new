// backend/modules/academicSession/session.service.js  ── FINAL
// Merged: existing session.service.js + new period support
import prisma from "../../utils/prisma.js";

const sessionInclude = {
  _count: {
    select: {
      enrollments: true,
      sectionSubjects: true,
      curriculumSubjects: true,
      sectionHistories: true,
      sectionSubjectHistory: true,
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────
const guard = () => {
  if (!prisma.academicSession) {
    throw Object.assign(new Error("Run: npx prisma generate (AcademicSession model not in client)"), { status: 503 });
  }
};

// Auto-generate code from name: "2025-26" → "2025-26", "2025-2026" → "2025-26"
const autoCode = (name) => {
  // If already short (2024-25 format) use as-is
  const short = name?.trim().replace(/^(\d{4})-(\d{4})$/, (_, a, b) => `${a}-${b.slice(2)}`);
  return short?.toUpperCase().replace(/[^A-Z0-9\-]/g, "") || name?.toUpperCase() || "SESSION";
};

// ── getCurrentSessionId — used by other services ──────────────
export const getCurrentSessionId = async () => {
  guard();
  const s = await prisma.academicSession.findFirst({ where: { is_current: true } });
  return s?.id || null;
};

export const getCurrentSession = async () => {
  guard();
  const s = await prisma.academicSession.findFirst({
    where: { is_current: true },
    include: sessionInclude,
  });
  if (!s) throw Object.assign(new Error("No active academic session. Create one first."), { status: 404 });
  return s;
};

// ── List — exposed as both getAllSessions and listSessions ────
export const getAllSessions = async ({ include_locked } = {}) => {
  guard();
  return prisma.academicSession.findMany({
    orderBy: { start_date: "desc" },
    include: sessionInclude,
  });
};
// alias — keeps old callers working
export const listSessions = getAllSessions;

// ── Get one ───────────────────────────────────────────────────
export const getSessionById = async (id) => {
  guard();
  const s = await prisma.academicSession.findUnique({
    where: { id },
    include: sessionInclude,
  });
  if (!s) throw Object.assign(new Error("Session not found"), { status: 404 });
  return s;
};

// ── Create ────────────────────────────────────────────────────
export const createSession = async (data, actingUser = {}) => {
  guard();
  const { name, code, label, start_date, end_date, notes, periods = [] } = data;

  if (!name?.trim()) throw Object.assign(new Error("Session name required"), { status: 400 });
  if (!start_date) throw Object.assign(new Error("start_date required"), { status: 400 });
  if (!end_date) throw Object.assign(new Error("end_date required"), { status: 400 });

  const finalCode = (code?.trim().toUpperCase() || autoCode(name));

  // Check unique
  const dup = await prisma.academicSession.findFirst({
    where: { OR: [{ name: name.trim() }, { code: finalCode }] },
  });
  if (dup) throw Object.assign(new Error(`Session "${dup.name}" already exists`), { status: 409 });

  return prisma.$transaction(async (tx) => {
    const session = await tx.academicSession.create({
      data: {
        name: name.trim(),
        code: finalCode,
        label: label?.trim() || name.trim(),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        notes: notes || null,
        created_by: actingUser?.id || data.created_by || null,
      },
      include: sessionInclude,
    });

    // Create calendar periods if provided
    if (periods.length > 0) {
      await tx.academicPeriod.createMany({
        data: periods.map((p, i) => ({
          session_id: session.id,
          type: p.type || "ACADEMIC",
          label: p.label,
          start_date: new Date(p.start_date),
          end_date: new Date(p.end_date),
          order: i,
          notes: p.notes || null,
        })),
      }).catch(() => { }); // graceful — AcademicPeriod may not exist yet
    }

    return session;
  });
};

// ── Update ────────────────────────────────────────────────────
export const updateSession = async (id, data, actingUser = {}) => {
  guard();
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Session not found"), { status: 404 });
  if (session.is_locked) throw Object.assign(new Error("Session is locked — unlock first"), { status: 400 });

  const { periods, ...fields } = data;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.academicSession.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name.trim() }),
        ...(fields.code !== undefined && { code: fields.code.trim().toUpperCase() }),
        ...(fields.label !== undefined && { label: fields.label || null }),
        ...(fields.start_date !== undefined && { start_date: new Date(fields.start_date) }),
        ...(fields.end_date !== undefined && { end_date: new Date(fields.end_date) }),
        ...(fields.notes !== undefined && { notes: fields.notes || null }),
      },
      include: sessionInclude,
    });

    // Replace periods if provided
    if (periods !== undefined) {
      await tx.academicPeriod.deleteMany({ where: { session_id: id } }).catch(() => { });
      if (periods.length > 0) {
        await tx.academicPeriod.createMany({
          data: periods.map((p, i) => ({
            session_id: id,
            type: p.type || "ACADEMIC",
            label: p.label,
            start_date: new Date(p.start_date),
            end_date: new Date(p.end_date),
            order: i,
            notes: p.notes || null,
          })),
        }).catch(() => { });
      }
    }

    return updated;
  });
};

// ── Set current ───────────────────────────────────────────────
export const setCurrentSession = async (id) => {
  guard();
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Session not found"), { status: 404 });
  if (session.is_locked) throw Object.assign(new Error("Cannot activate a locked session"), { status: 400 });

  await prisma.$transaction([
    prisma.academicSession.updateMany({ where: { is_current: true }, data: { is_current: false } }),
    prisma.academicSession.update({ where: { id }, data: { is_current: true } }),
  ]);
  return prisma.academicSession.findUnique({ where: { id }, include: sessionInclude });
};

// ── Lock / Unlock ─────────────────────────────────────────────
export const lockSession = async (id) => {
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Not found"), { status: 404 });
  if (session.is_current) throw Object.assign(new Error("Cannot lock the active session"), { status: 400 });
  return prisma.academicSession.update({ where: { id }, data: { is_locked: true }, include: sessionInclude });
};

export const unlockSession = async (id) =>
  prisma.academicSession.update({ where: { id }, data: { is_locked: false }, include: sessionInclude });

// alias from old toggleLock
export const toggleLock = async (id) => {
  const s = await prisma.academicSession.findUnique({ where: { id } });
  if (!s) throw Object.assign(new Error("Not found"), { status: 404 });
  return s.is_locked ? unlockSession(id) : lockSession(id);
};

// ── Period helpers ────────────────────────────────────────────
export const getCurrentPeriod = async (session_id) => {
  const now = new Date();
  return prisma.academicPeriod?.findFirst({
    where: { session_id, start_date: { lte: now }, end_date: { gte: now } },
  }).catch(() => null);
};

export const isAcademicPeriod = async (session_id) => {
  const p = await getCurrentPeriod(session_id);
  return p?.type === "ACADEMIC";
};

// ── Summary ───────────────────────────────────────────────────
export const getSessionSummary = async (id) => {
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Not found"), { status: 404 });

  const [enrollments, active, subjects, curriculum, secHistory] = await Promise.all([
    prisma.studentEnrollment.count({ where: { session_id: id } }),
    prisma.studentEnrollment.count({ where: { session_id: id, is_current: true } }),
    prisma.sectionSubject.count({ where: { session_id: id } }),
    prisma.curriculumSubject.count({ where: { session_id: id } }),
    prisma.sectionHistory.count({ where: { session_id: id } }),
  ]);

  return {
    session,
    summary: {
      enrollments: { total: enrollments, active },
      section_subjects: subjects,
      curriculum_entries: curriculum,
      section_changes: secHistory,
    },
  };
};