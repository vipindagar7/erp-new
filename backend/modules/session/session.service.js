// backend/modules/session/session.service.js
import prisma from "../../utils/prisma.js";

// ── Get current active session ────────────────────────────────
export const getCurrentSession = async () => {
  if (!prisma.academicSession) {
    throw Object.assign(new Error("Run: npx prisma generate (AcademicSession model not in client yet)"), { statusCode: 503 });
  }
  const session = await prisma.academicSession.findFirst({
    where: { is_current: true },
  });
  if (!session) throw Object.assign(new Error("No active academic session. Create one first."), { statusCode: 404 });
  return session;
};

// ── Get current session id (helper used by other services) ────
export const getCurrentSessionId = async () => {
  const s = await getCurrentSession();
  return s.id;
};

// ── List all sessions ─────────────────────────────────────────
export const listSessions = async () => {
  if (!prisma.academicSession) {
    return [];  // prisma generate not run yet — run: npx prisma generate
  }
  return prisma.academicSession.findMany({
    orderBy: { start_date: "desc" },
    include: {
      _count: {
        select: {
          enrollments: true,
          sectionSubjects: true,
          curriculumSubjects: true,
        },
      },
    },
  });
};

// ── Get session by id ─────────────────────────────────────────
export const getSessionById = async (id) => {
  const session = await prisma.academicSession.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          enrollments: true,
          sectionSubjects: true,
          curriculumSubjects: true,
          sectionHistories: true,
          sectionSubjectHistory: true,
        },
      },
    },
  });
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });
  return session;
};

// ── Create session ────────────────────────────────────────────
export const createSession = async ({ name, label, start_date, end_date, notes, created_by }) => {
  if (!prisma.academicSession) throw Object.assign(new Error("Run: npx prisma generate"), { statusCode: 503 });
  const existing = await prisma.academicSession.findUnique({ where: { name } });
  if (existing) throw Object.assign(new Error(`Session "${name}" already exists`), { statusCode: 409 });

  return prisma.academicSession.create({
    data: { name, label: label || `Session ${name}`, start_date: new Date(start_date), end_date: new Date(end_date), notes, created_by },
  });
};

// ── Set a session as current (only one can be current) ────────
export const setCurrentSession = async (id) => {
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });
  if (session.is_locked) throw Object.assign(new Error("Cannot activate a locked session"), { statusCode: 400 });

  // Deactivate all others, activate this one
  await prisma.$transaction([
    prisma.academicSession.updateMany({ where: { is_current: true }, data: { is_current: false } }),
    prisma.academicSession.update({ where: { id }, data: { is_current: true } }),
  ]);
  return prisma.academicSession.findUnique({ where: { id } });
};

// ── Lock / unlock a session ───────────────────────────────────
export const toggleLock = async (id) => {
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });
  if (session.is_current && !session.is_locked)
    throw Object.assign(new Error("Cannot lock the currently active session"), { statusCode: 400 });

  return prisma.academicSession.update({
    where: { id },
    data: { is_locked: !session.is_locked },
  });
};

// ── Update session ────────────────────────────────────────────
export const updateSession = async (id, data) => {
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });
  if (session.is_locked) throw Object.assign(new Error("Session is locked"), { statusCode: 400 });

  const update = {};
  if (data.label !== undefined) update.label = data.label;
  if (data.start_date !== undefined) update.start_date = new Date(data.start_date);
  if (data.end_date !== undefined) update.end_date = new Date(data.end_date);
  if (data.notes !== undefined) update.notes = data.notes;

  return prisma.academicSession.update({ where: { id }, data: update });
};

// ── Session summary — counts across all scoped tables ─────────
export const getSessionSummary = async (id) => {
  const session = await prisma.academicSession.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });

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