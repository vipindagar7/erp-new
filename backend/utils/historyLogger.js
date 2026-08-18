// backend/utils/historyLogger.js
// Centralized history logging utility for all modules.
// Each module has its own dedicated history table.
import prisma from "./prisma.js";

// ── Generic logger factory ────────────────────────────────────
const _log = (model) => async ({
  id, action, prev, next, changedFields, reason,
  by, byName, byRole, isRollback = false, rolledBackTo,
}) => {
  const changed = changedFields || _diff(prev, next);
  try {
    await model.create({
      data: {
        action,
        changed_fields:  changed,
        prev_data:       prev  ? _clean(prev)  : null,
        new_data:        next  ? _clean(next)  : null,
        reason:          reason       || null,
        changed_by:      by           || null,
        changed_by_name: byName       || null,
        changed_by_role: byRole       || null,
        is_rollback:     isRollback,
        rolled_back_to:  rolledBackTo || null,
        ...id,
      },
    });
  } catch (e) {
    console.error(`[HISTORY] Failed to log:`, e.message);
  }
};

// ── Diff helper — which fields changed ───────────────────────
const SKIP = new Set(["updatedAt", "createdAt", "deleted_at"]);
const _diff = (prev, next) => {
  if (!prev || !next) return [];
  return Object.keys(next).filter(
    (k) => !SKIP.has(k) && JSON.stringify(prev[k]) !== JSON.stringify(next[k])
  );
};

// ── Clean sensitive fields ────────────────────────────────────
const REDACT = new Set(["passwordHash", "pin_hash", "otp_hash", "salary_encrypted", "bank_account_encrypted"]);
const _clean = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  for (const k of REDACT) if (k in out) out[k] = "[REDACTED]";
  return out;
};

// ── Per-module loggers ────────────────────────────────────────

export const logDepartment = _log({
  create: (data) => prisma.departmentHistory.create({
    data: { dept_id: data.id, ...data },
  }),
});

// Cleaner approach — dedicated per-model function
export const logDeptHistory = async (dept_id, payload) => {
  try {
    await prisma.departmentHistory.create({
      data: {
        dept_id,
        action:          payload.action,
        changed_fields:  payload.changedFields  || _diff(payload.prev, payload.next) || [],
        prev_data:       payload.prev  ? _clean(payload.prev)  : null,
        new_data:        payload.next  ? _clean(payload.next)  : null,
        reason:          payload.reason       || null,
        changed_by:      payload.by           || null,
        changed_by_name: payload.byName       || null,
        changed_by_role: payload.byRole       || null,
        is_rollback:     payload.isRollback   || false,
        rolled_back_to:  payload.rolledBackTo || null,
      },
    });
  } catch (e) { console.error("[HISTORY:DEPT]", e.message); }
};

export const logProgramHistory = async (program_id, payload) => {
  try {
    await prisma.programHistory.create({
      data: {
        program_id,
        action:          payload.action,
        changed_fields:  payload.changedFields  || _diff(payload.prev, payload.next) || [],
        prev_data:       payload.prev  ? _clean(payload.prev)  : null,
        new_data:        payload.next  ? _clean(payload.next)  : null,
        reason:          payload.reason       || null,
        changed_by:      payload.by           || null,
        changed_by_name: payload.byName       || null,
        changed_by_role: payload.byRole       || null,
        is_rollback:     payload.isRollback   || false,
        rolled_back_to:  payload.rolledBackTo || null,
      },
    });
  } catch (e) { console.error("[HISTORY:PROGRAM]", e.message); }
};

export const logBranchHistory = async (branch_id, payload) => {
  try {
    await prisma.branchHistory.create({
      data: {
        branch_id,
        action:          payload.action,
        changed_fields:  payload.changedFields  || _diff(payload.prev, payload.next) || [],
        prev_data:       payload.prev  ? _clean(payload.prev)  : null,
        new_data:        payload.next  ? _clean(payload.next)  : null,
        reason:          payload.reason       || null,
        changed_by:      payload.by           || null,
        changed_by_name: payload.byName       || null,
        changed_by_role: payload.byRole       || null,
        is_rollback:     payload.isRollback   || false,
        rolled_back_to:  payload.rolledBackTo || null,
      },
    });
  } catch (e) { console.error("[HISTORY:BRANCH]", e.message); }
};

export const logSectionHistory = async (section_id, session_id, payload) => {
  try {
    // Uses existing SectionHistory model
    await prisma.sectionHistory.create({
      data: {
        section_id,
        session_id:               session_id || "DEFAULT-SESSION",
        action:                   payload.action,
        semester:                 payload.next?.semester   || payload.prev?.semester   || 0,
        status:                   payload.next?.status     || payload.prev?.status     || "ACTIVE",
        batch:                    payload.next?.batch      || payload.prev?.batch      || "",
        academic_year:            payload.next?.academic_year || payload.prev?.academic_year || null,
        class_coordinator_id:     payload.next?.class_coordinator_id || null,
        coordinator_name:         payload.next?.class_coordinator?.name || null,
        prev_semester:            payload.prev?.semester   || null,
        prev_status:              payload.prev?.status     || null,
        prev_batch:               payload.prev?.batch      || null,
        prev_class_coordinator_id:payload.prev?.class_coordinator_id || null,
        prev_coordinator_name:    payload.prev?.class_coordinator?.name || null,
        reason:                   payload.reason           || null,
        changed_by:               payload.by               || null,
        changed_by_name:          payload.byName           || null,
        changed_by_role:          payload.byRole           || null,
      },
    });
  } catch (e) { console.error("[HISTORY:SECTION]", e.message); }
};

export const logEnrollmentHistory = async (student_id, payload) => {
  try {
    await prisma.enrollmentHistory.create({
      data: {
        student_id,
        enrollment_id:    payload.enrollment_id   || null,
        section_id:       payload.section_id       || null,
        session_id:       payload.session_id       || null,
        action:           payload.action,
        from_semester:    payload.from_semester    || null,
        to_semester:      payload.to_semester      || null,
        from_status:      payload.from_status      || null,
        to_status:        payload.to_status        || null,
        from_section_id:  payload.from_section_id  || null,
        to_section_id:    payload.to_section_id    || null,
        from_section_code:payload.from_section_code|| null,
        to_section_code:  payload.to_section_code  || null,
        from_session:     payload.from_session     || null,
        to_session:       payload.to_session       || null,
        prev_data:        payload.prev ? _clean(payload.prev) : null,
        new_data:         payload.next ? _clean(payload.next) : null,
        reason:           payload.reason           || null,
        changed_by:       payload.by               || null,
        changed_by_name:  payload.byName           || null,
        changed_by_role:  payload.byRole           || null,
        is_rollback:      payload.isRollback        || false,
        snapshot_id:      payload.snapshot_id      || null,
      },
    });
  } catch (e) { console.error("[HISTORY:ENROLLMENT]", e.message); }
};

// ── Section Snapshot (full backup before promote/demote) ──────
export const createSectionSnapshot = async (section_id, trigger, actingUser, reason) => {
  try {
    // Fetch full section state
    const section = await prisma.section.findUnique({
      where: { id: section_id },
      include: {
        branch: { include: { program: { include: { department: true } } } },
        class_coordinator: { select: { id: true, name: true, emp_id: true } },
        sectionSubjects: { include: { subject: true, faculty: { select: { id: true, name: true } } } },
      },
    });
    if (!section) return null;

    // Fetch all students in this section
    const students = await prisma.student.findMany({
      where: { section_id, deleted_at: null },
      select: {
        id: true, name: true, roll_no: true, enrollment_no: true,
        status: true, dept_id: true, program_id: true, branch_id: true,
        admission_year: true, batch_year: true,
      },
    });

    // Fetch current enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { section_id, is_current: true },
      select: {
        id: true, student_id: true, session_id: true, semester: true,
        academic_year: true, status: true, batch_year: true,
      },
    });

    const snapshot = await prisma.sectionSnapshot.create({
      data: {
        section_id,
        section_code:     section.code,
        trigger,
        triggered_by:     actingUser?.id   || null,
        triggered_by_name:actingUser?.email || null,
        section_data:     section,
        students_data:    students,
        enrollments_data: enrollments,
        subjects_data:    section.sectionSubjects || [],
        from_semester:    section.semester,
        reason:           reason || null,
      },
    });

    return snapshot;
  } catch (e) {
    console.error("[SNAPSHOT]", e.message);
    return null;
  }
};

// ── Diff export for services ──────────────────────────────────
export const diffObjects = _diff;
export const cleanObject = _clean;
