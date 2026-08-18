// backend/modules/section/section.service.js  ── FULL V3
// Handles: promote, demote, FYE split, snapshot, rollback
import prisma from "../../utils/prisma.js";

// ── Section label formatter (used in all templates) ──────────
// Format: "Program Name > Branch Name > Section Name (Sem X)"
const fmtSection = (s) => {
  if (!s) return "";
  const prog = s.branch?.program?.name || "";
  const branch = s.branch?.name || "";
  const sec = s.name || s.code || "";
  const sem = s.semester ? `Sem ${s.semester}` : "";
  const ay = s.academic_year || s.batch || "";
  const parts = [prog, branch, [sec, sem].filter(Boolean).join(" "), ay].filter(Boolean);
  return parts.join(" › ");
};

// Short format for narrow columns
const fmtSectionShort = (s) => {
  if (!s) return "";
  return [s.branch?.name, s.name, s.semester ? `S${s.semester}` : ""].filter(Boolean).join(" › ");
};

import xlsx from "xlsx";
import {
  logSectionHistory, logEnrollmentHistory,
  createSectionSnapshot,
} from "../../utils/historyLogger.js";
import { changeStudentSection } from "../student/student.service.js";

// ── Include ───────────────────────────────────────────────────
const sectionInclude = {
  branch: {
    select: {
      id: true, name: true, code: true,
      program: {
        select: {
          id: true, name: true, code: true,
          department: { select: { id: true, name: true, code: true } },
        },
      },
    },
  },
  class_coordinator: {
    select: {
      id: true, name: true, emp_id: true, designation: true, phone: true,
      user: { select: { email: true } }
    },
  },
  sectionSubjects: {
    where: { status: "ACTIVE" },
    include: {
      subject: {
        select: {
          id: true, name: true, code: true, category: true, credits: true, nickname: true,
        },
      },
      faculty: { select: { id: true, name: true, emp_id: true, designation: true } },
      session: { select: { id: true, name: true, is_current: true } },
    },
    orderBy: [{ subject: { category: "asc" } }, { subject: { name: "asc" } }],
  },
  _count: { select: { students: true, enrollments: true, sectionSubjects: true } },
};

// ── Get current session ───────────────────────────────────────
const getCurrentSessionId = async () => {
  const s = await prisma.academicSession.findFirst({ where: { is_current: true } });
  if (!s) throw Object.assign(new Error("No active academic session. Please set a current session first."), { status: 400 });
  return s.id;
};

// ── List ──────────────────────────────────────────────────────
export const getAllSections = async ({
  page = 1, limit = 20, search, branch_id, program_id,
  dept_id, semester, status, academic_year,
} = {}) => {
  const _page = parseInt(page, 10) || 1;
  const _limit = parseInt(limit, 10) || 20;
  const skip = (_page - 1) * _limit;
  const where = { deleted_at: null };
  if (branch_id) where.branch_id = branch_id;
  if (semester) where.semester = parseInt(semester);
  if (status) where.status = status;
  if (academic_year) where.academic_year = academic_year;
  if (program_id) where.branch = { program_id };
  if (dept_id) where.branch = { program: { dept_id } };
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { code: { contains: search, mode: "insensitive" } },
  ];
  const [sections, total] = await Promise.all([
    prisma.section.findMany({ where, skip, take: _limit, include: sectionInclude, orderBy: [{ semester: "asc" }, { name: "asc" }] }),
    prisma.section.count({ where }),
  ]);
  return { sections, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};


// ── Assign subject to section ─────────────────────────────────
export const assignSubjectToSection = async (section_id, data, actingUser = {}) => {
  const { subject_id, faculty_id, type = "REGULAR", session_id } = data;
  if (!subject_id) throw Object.assign(new Error("subject_id required"), { status: 400 });

  const session = session_id
    ? { id: session_id }
    : await prisma.academicSession.findFirst({ where: { is_current: true } });
  if (!session) throw Object.assign(new Error("No active session"), { status: 400 });

  const section = await prisma.section.findUnique({ where: { id: section_id } });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });

  // Check if already assigned
  const existing = await prisma.sectionSubject.findUnique({
    where: { session_id_section_id_subject_id: { session_id: session.id, section_id, subject_id } },
  }).catch(() => null);

  if (existing) {
    // Reactivate if deactivated, or update faculty
    return prisma.sectionSubject.update({
      where: { session_id_section_id_subject_id: { session_id: session.id, section_id, subject_id } },
      data: { status: "ACTIVE", faculty_id: faculty_id || null, type },
      include: {
        subject: { select: { id: true, name: true, code: true, category: true, credits: true } },
        faculty: { select: { id: true, name: true, emp_id: true } },
      },
    });
  }

  const ss = await prisma.sectionSubject.create({
    data: { session_id: session.id, section_id, subject_id, faculty_id: faculty_id || null, type },
    include: {
      subject: { select: { id: true, name: true, code: true, category: true, credits: true } },
      faculty: { select: { id: true, name: true, emp_id: true } },
    },
  });

  // Log to history
  await prisma.sectionSubjectHistory.create({
    data: {
      session_id: session.id, section_id, subject_id,
      faculty_id: faculty_id || null,
      action: "ASSIGN", reason: "Manual assignment",
      changed_by: actingUser.id || null,
      new_data: { type, faculty_id },
    },
  }).catch(() => { });

  return ss;
};

// ── Update section subject faculty ────────────────────────────
export const updateSectionSubjectFaculty = async (section_id, subject_id, data, actingUser = {}) => {
  const { faculty_id, type, session_id } = data;

  const session = session_id
    ? { id: session_id }
    : await prisma.academicSession.findFirst({ where: { is_current: true } });
  if (!session) throw Object.assign(new Error("No active session"), { status: 400 });

  const ss = await prisma.sectionSubject.findUnique({
    where: { session_id_section_id_subject_id: { session_id: session.id, section_id, subject_id } },
  });
  if (!ss) throw Object.assign(new Error("Subject not assigned to this section"), { status: 404 });

  const updated = await prisma.sectionSubject.update({
    where: { session_id_section_id_subject_id: { session_id: session.id, section_id, subject_id } },
    data: {
      ...(faculty_id !== undefined && { faculty_id: faculty_id || null }),
      ...(type !== undefined && { type }),
    },
    include: {
      subject: { select: { id: true, name: true, code: true, category: true } },
      faculty: { select: { id: true, name: true, emp_id: true } },
    },
  });

  await prisma.sectionSubjectHistory.create({
    data: {
      session_id: session.id, section_id, subject_id,
      faculty_id: faculty_id || null,
      action: "FACULTY_CHANGED",
      changed_by: actingUser.id || null,
      prev_data: { faculty_id: ss.faculty_id, type: ss.type },
      new_data: { faculty_id, type },
    },
  }).catch(() => { });

  return updated;
};

// ── Remove subject from section ───────────────────────────────
export const removeSubjectFromSection = async (section_id, subject_id, actingUser = {}) => {
  const session = await prisma.academicSession.findFirst({ where: { is_current: true } });
  if (!session) throw Object.assign(new Error("No active session"), { status: 400 });

  await prisma.sectionSubject.update({
    where: { session_id_section_id_subject_id: { session_id: session.id, section_id, subject_id } },
    data: { status: "INACTIVE" },
  }).catch(() => {
    throw Object.assign(new Error("Subject not found in this section"), { status: 404 });
  });

  await prisma.sectionSubjectHistory.create({
    data: {
      session_id: session.id, section_id, subject_id,
      action: "REMOVE", changed_by: actingUser.id || null,
    },
  }).catch(() => { });
};

// ── Auto assign from curriculum ───────────────────────────────
export const autoAssignSubjectsToSection = async (section_id, actingUser = {}) => {
  const section = await prisma.section.findUnique({
    where: { id: section_id },
    include: { branch: { include: { program: true } } },
  });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });

  const session = await prisma.academicSession.findFirst({ where: { is_current: true } });
  if (!session) throw Object.assign(new Error("No active session"), { status: 400 });

  const curriculum = await prisma.curriculumSubject.findMany({
    where: {
      program_id: section.branch?.program_id,
      semester: section.semester,
      session_id: session.id,
    },
    include: { subject: { select: { id: true, name: true, code: true, category: true } } },
  });

  if (!curriculum.length) {
    return { assigned: [], skipped: [], message: `No curriculum defined for Sem ${section.semester}` };
  }

  const results = { assigned: [], skipped: [], total: curriculum.length };
  for (const cs of curriculum) {
    try {
      const existing = await prisma.sectionSubject.findUnique({
        where: { session_id_section_id_subject_id: { session_id: session.id, section_id, subject_id: cs.subject_id } },
      }).catch(() => null);

      if (existing?.status === "ACTIVE") {
        results.skipped.push({ subject: cs.subject?.name, reason: "Already assigned" });
        continue;
      }

      await prisma.sectionSubject.upsert({
        where: { session_id_section_id_subject_id: { session_id: session.id, section_id, subject_id: cs.subject_id } },
        update: { status: "ACTIVE", type: cs.type || "REGULAR" },
        create: { session_id: session.id, section_id, subject_id: cs.subject_id, type: cs.type || "REGULAR" },
      });
      results.assigned.push({ subject: cs.subject?.name, code: cs.subject?.code });
    } catch (e) {
      results.skipped.push({ subject: cs.subject?.name, reason: e.message });
    }
  }
  return results;
};

export const getSectionById = (id) =>
  prisma.section.findUnique({ where: { id }, include: sectionInclude });

// ── Create ────────────────────────────────────────────────────
export const createSection = async (data, actingUser = {}) => {
  const {
    name, branch_id, semester, batch, academic_year,
    class_coordinator_id, room_no, capacity, description,
    is_combined = false, session_id,
  } = data;

  if (!name?.trim()) throw Object.assign(new Error("Section name required"), { status: 400 });
  if (!branch_id) throw Object.assign(new Error("branch_id required"), { status: 400 });
  if (!semester) throw Object.assign(new Error("Semester required"), { status: 400 });
  if (!batch?.trim()) throw Object.assign(new Error("Batch required"), { status: 400 });

  const branch = await prisma.branch.findUnique({ where: { id: branch_id } });
  if (!branch) throw Object.assign(new Error("Branch not found"), { status: 404 });

  // Auto-generate code
  const batchShort = batch.replace(/[^0-9]/g, "").slice(0, 4);
  const rawCode = `${branch.code}-S${semester}-${name.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6)}-${batchShort}`;

  const sid = session_id || await getCurrentSessionId();

  const section = await prisma.section.create({
    data: {
      name: name.trim(),
      code: rawCode,
      branch_id,
      semester: parseInt(semester),
      batch: batch.trim(),
      batch_year: parseInt(batch.slice(0, 4)) || null,
      academic_year: academic_year || null,
      is_combined,
      class_coordinator_id: class_coordinator_id || null,
      room_no: room_no || null,
      capacity: capacity ? parseInt(capacity) : null,
      description: description || null,
      status: "ACTIVE",
    },
    include: sectionInclude,
  });

  await logSectionHistory(section.id, sid, {
    action: "CREATE", next: section,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return section;
};

// ── Update ────────────────────────────────────────────────────
export const updateSection = async (id, data, actingUser = {}) => {
  const prev = await prisma.section.findUnique({ where: { id }, include: sectionInclude });
  if (!prev) throw Object.assign(new Error("Section not found"), { status: 404 });

  const next = await prisma.section.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.class_coordinator_id !== undefined && { class_coordinator_id: data.class_coordinator_id || null }),
      ...(data.room_no !== undefined && { room_no: data.room_no || null }),
      ...(data.capacity !== undefined && { capacity: data.capacity ? parseInt(data.capacity) : null }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.is_combined !== undefined && { is_combined: !!data.is_combined }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: sectionInclude,
  });

  const sid = await getCurrentSessionId().catch(() => "DEFAULT");
  await logSectionHistory(id, sid, {
    action: "UPDATE", prev, next, reason: data.reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return next;
};

// ══════════════════════════════════════════════════════════════
// PROMOTE SECTION
// Snapshot → Update section semester/session → Update enrollments
// ══════════════════════════════════════════════════════════════
export const promoteSection = async (section_id, {
  reason, to_session_id, new_academic_year,
}, actingUser = {}) => {
  const section = await prisma.section.findUnique({ where: { id: section_id }, include: sectionInclude });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });
  if (section.status !== "ACTIVE") throw Object.assign(new Error(`Cannot promote a ${section.status} section`), { status: 400 });

  const currentSid = to_session_id || await getCurrentSessionId();
  const newSemester = section.semester + 1;

  // 1. SNAPSHOT — full backup before change
  const snapshot = await createSectionSnapshot(section_id, "PROMOTE", actingUser, reason);

  // 2. Update section
  const updatedSection = await prisma.section.update({
    where: { id: section_id },
    data: {
      semester: newSemester,
      academic_year: new_academic_year || section.academic_year,
    },
    include: sectionInclude,
  });

  // 3. Get all ACTIVE students in this section
  const students = await prisma.student.findMany({
    where: { section_id, deleted_at: null, status: "ACTIVE" },
    select: { id: true, name: true, roll_no: true, status: true },
  });

  const promoted = [];
  const failed = [];

  for (const student of students) {
    try {
      // Close current enrollment
      await prisma.studentEnrollment.updateMany({
        where: { student_id: student.id, is_current: true },
        data: { is_current: false, completed_at: new Date(), status: "PROMOTED" },
      });

      // Create new enrollment for next semester
      const newEnrollment = await prisma.studentEnrollment.create({
        data: {
          session_id: currentSid,
          student_id: student.id,
          section_id: section_id,
          academic_year: new_academic_year || section.academic_year || "",
          semester: newSemester,
          batch_year: section.batch_year || 0,
          dept_id: section.branch.program.dept_id,
          program_id: section.branch.program_id,
          branch_id: section.branch_id,
          status: "ACTIVE",
          is_current: true,
          promoted_from_section_id: section_id,
          promoted_by: actingUser.id || null,
          promoted_at: new Date(),
        },
      });

      await logEnrollmentHistory(student.id, {
        action: "PROMOTE",
        enrollment_id: newEnrollment.id,
        section_id,
        session_id: currentSid,
        from_semester: section.semester,
        to_semester: newSemester,
        from_status: "ACTIVE",
        to_status: "ACTIVE",
        from_section_id: section_id,
        to_section_id: section_id,
        from_section_code: section.code,
        to_section_code: section.code,
        reason,
        snapshot_id: snapshot?.id,
        by: actingUser.id,
        byName: actingUser.email,
        byRole: actingUser.role,
      });

      promoted.push({ id: student.id, name: student.name, roll_no: student.roll_no });
    } catch (err) {
      failed.push({ id: student.id, name: student.name, reason: err.message });
    }
  }

  // Log section history
  await logSectionHistory(section_id, currentSid, {
    action: "PROMOTE", prev: section, next: updatedSection,
    reason, by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return {
    section: updatedSection,
    snapshot_id: snapshot?.id,
    promoted, failed,
    detained_count: students.length - promoted.length - failed.length,
    total: students.length,
  };
};

// ══════════════════════════════════════════════════════════════
// DEMOTE SECTION
// Snapshot → Decrease semester → Update enrollments
// ══════════════════════════════════════════════════════════════
export const demoteSection = async (section_id, { reason, to_session_id }, actingUser = {}) => {
  const section = await prisma.section.findUnique({ where: { id: section_id }, include: sectionInclude });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });
  if (section.semester <= 1) throw Object.assign(new Error("Already at semester 1, cannot demote"), { status: 400 });

  const currentSid = to_session_id || await getCurrentSessionId();
  const newSemester = section.semester - 1;

  // 1. Snapshot
  const snapshot = await createSectionSnapshot(section_id, "DEMOTE", actingUser, reason);

  // 2. Update section
  const updatedSection = await prisma.section.update({
    where: { id: section_id },
    data: { semester: newSemester },
    include: sectionInclude,
  });

  // 3. Update all student enrollments
  const students = await prisma.student.findMany({
    where: { section_id, deleted_at: null },
    select: { id: true, name: true, roll_no: true, status: true },
  });

  for (const student of students) {
    await prisma.studentEnrollment.updateMany({
      where: { student_id: student.id, is_current: true },
      data: { semester: newSemester, status: "DEMOTED" },
    });
    await logEnrollmentHistory(student.id, {
      action: "DEMOTE", section_id,
      from_semester: section.semester, to_semester: newSemester,
      from_status: student.status, to_status: "DEMOTED",
      reason, snapshot_id: snapshot?.id,
      by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
    });
  }

  await logSectionHistory(section_id, currentSid, {
    action: "DEMOTE", prev: section, next: updatedSection,
    reason, by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return { section: updatedSection, snapshot_id: snapshot?.id, students_updated: students.length };
};

// ══════════════════════════════════════════════════════════════
// DETAIN STUDENTS IN SECTION
// Mark selected students as DETAINED — they stay in same section
// Section still promotes but detained students don't move
// ══════════════════════════════════════════════════════════════
export const detainStudents = async (section_id, student_ids, reason, actingUser = {}) => {
  const section = await prisma.section.findUnique({ where: { id: section_id } });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });

  const results = { detained: [], failed: [] };

  for (const student_id of student_ids) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: student_id },
        select: { id: true, name: true, roll_no: true, status: true },
      });
      if (!student) { results.failed.push({ id: student_id, reason: "Not found" }); continue; }

      await prisma.student.update({
        where: { id: student_id },
        data: { status: "DETAINED" },
      });

      await prisma.studentEnrollment.updateMany({
        where: { student_id, is_current: true },
        data: { status: "DETAINED" },
      });

      // Log student history
      await prisma.studentHistory.create({
        data: {
          student_id,
          action: "DETAIN",
          changed_fields: ["status"],
          prev_data: { status: student.status },
          new_data: { status: "DETAINED" },
          changed_by: actingUser.id || null,
          changed_by_name: actingUser.email || null,
        },
      });

      await logEnrollmentHistory(student_id, {
        action: "DETAIN", section_id,
        from_status: student.status, to_status: "DETAINED",
        reason,
        by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
      });

      results.detained.push({ id: student.id, name: student.name, roll_no: student.roll_no });
    } catch (err) {
      results.failed.push({ id: student_id, reason: err.message });
    }
  }

  return results;
};

// ══════════════════════════════════════════════════════════════
// FYE SPLIT — Move students from combined section to branch sections
// Admin decides which student goes to which section
// ══════════════════════════════════════════════════════════════
export const fyeSplit = async (section_id, assignments, reason, actingUser = {}) => {
  // assignments = [{ student_id, to_section_id }, ...]
  const section = await prisma.section.findUnique({ where: { id: section_id }, include: sectionInclude });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });
  if (!section.is_combined) throw Object.assign(new Error("Section is not marked as combined"), { status: 400 });

  // 1. Snapshot before split
  const snapshot = await createSectionSnapshot(section_id, "FYE_SPLIT", actingUser, reason);
  const currentSid = await getCurrentSessionId();

  const results = { moved: [], failed: [] };

  for (const { student_id, to_section_id } of assignments) {
    try {
      const student = await prisma.student.findUnique({ where: { id: student_id }, select: { id: true, name: true, roll_no: true, branch_id: true, dept_id: true, program_id: true } });
      const toSection = await prisma.section.findUnique({ where: { id: to_section_id }, include: { branch: { include: { program: true } } } });

      if (!student) { results.failed.push({ student_id, reason: "Student not found" }); continue; }
      if (!toSection) { results.failed.push({ student_id, reason: "Target section not found" }); continue; }

      // Update student's section, branch, program, dept
      await prisma.student.update({
        where: { id: student_id },
        data: {
          section_id: to_section_id,
          branch_id: toSection.branch_id,
          program_id: toSection.branch.program_id,
          dept_id: toSection.branch.program.dept_id,
        },
      });

      // Update enrollment
      await prisma.studentEnrollment.updateMany({
        where: { student_id, is_current: true },
        data: {
          section_id: to_section_id,
          branch_id: toSection.branch_id,
          program_id: toSection.branch.program_id,
          dept_id: toSection.branch.program.dept_id,
        },
      });

      // Section history
      await prisma.studentSectionHistory.create({
        data: {
          student_id,
          from_section_id: section_id,
          to_section_id,
          from_section_code: section.code,
          to_section_code: toSection.code,
          reason: reason || "FYE Split",
          changed_by: actingUser.id || null,
          changed_by_name: actingUser.email || null,
        },
      });

      await logEnrollmentHistory(student_id, {
        action: "SECTION_CHANGE",
        from_section_id: section_id,
        to_section_id,
        from_section_code: section.code,
        to_section_code: toSection.code,
        reason: reason || "FYE Split",
        snapshot_id: snapshot?.id,
        by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
      });

      results.moved.push({ id: student.id, name: student.name, roll_no: student.roll_no, to: toSection.code });
    } catch (err) {
      results.failed.push({ student_id, reason: err.message });
    }
  }

  // Log on source section
  await logSectionHistory(section_id, currentSid, {
    action: "FYE_SPLIT",
    prev: section,
    next: section,
    reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return { snapshot_id: snapshot?.id, moved: results.moved, failed: results.failed, total: assignments.length };
};

// ══════════════════════════════════════════════════════════════
// PROMOTE SINGLE STUDENT (to different section)
// ══════════════════════════════════════════════════════════════
export const promoteStudent = async (student_id, to_section_id, reason, actingUser = {}) => {
  const student = await prisma.student.findUnique({ where: { id: student_id }, select: { id: true, name: true, roll_no: true, section_id: true, status: true, branch_id: true, dept_id: true, program_id: true } });
  if (!student) throw Object.assign(new Error("Student not found"), { status: 404 });
  const toSection = await prisma.section.findUnique({ where: { id: to_section_id }, include: { branch: { include: { program: true } } } });
  if (!toSection) throw Object.assign(new Error("Target section not found"), { status: 404 });

  const fromSection = student.section_id
    ? await prisma.section.findUnique({ where: { id: student.section_id } })
    : null;

  const sid = await getCurrentSessionId();

  // Close current enrollment
  await prisma.studentEnrollment.updateMany({
    where: { student_id, is_current: true },
    data: { is_current: false, completed_at: new Date(), status: "PROMOTED" },
  });

  // New enrollment
  const newEnrollment = await prisma.studentEnrollment.create({
    data: {
      session_id: sid,
      student_id,
      section_id: to_section_id,
      academic_year: toSection.academic_year || "",
      semester: toSection.semester,
      batch_year: toSection.batch_year || 0,
      dept_id: toSection.branch.program.dept_id,
      program_id: toSection.branch.program_id,
      branch_id: toSection.branch_id,
      status: "ACTIVE",
      is_current: true,
      promoted_from_section_id: student.section_id || null,
      promoted_to_section_id: to_section_id,
      promoted_by: actingUser.id || null,
      promoted_at: new Date(),
    },
  });

  // Update student
  await prisma.student.update({
    where: { id: student_id },
    data: {
      section_id: to_section_id,
      branch_id: toSection.branch_id,
      program_id: toSection.branch.program_id,
      dept_id: toSection.branch.program.dept_id,
    },
  });

  // Section history
  await prisma.studentSectionHistory.create({
    data: {
      student_id,
      from_section_id: student.section_id || null,
      to_section_id,
      from_section_code: fromSection?.code || null,
      to_section_code: toSection.code,
      reason,
      changed_by: actingUser.id || null,
      changed_by_name: actingUser.email || null,
    },
  });

  await logEnrollmentHistory(student_id, {
    action: "PROMOTE",
    enrollment_id: newEnrollment.id,
    from_semester: fromSection?.semester || null,
    to_semester: toSection.semester,
    from_section_id: student.section_id || null,
    to_section_id,
    from_section_code: fromSection?.code || null,
    to_section_code: toSection.code,
    reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return { student_id, moved_to: toSection.code, semester: toSection.semester };
};

// ══════════════════════════════════════════════════════════════
// ROLLBACK SECTION to a snapshot
// ══════════════════════════════════════════════════════════════
export const rollbackSection = async (section_id, snapshot_id, reason, actingUser = {}) => {
  const snapshot = await prisma.sectionSnapshot.findUnique({ where: { id: snapshot_id } });
  if (!snapshot) throw Object.assign(new Error("Snapshot not found"), { status: 404 });
  if (snapshot.section_id !== section_id) throw Object.assign(new Error("Snapshot does not belong to this section"), { status: 400 });

  const prevState = snapshot.section_data;
  const sid = await getCurrentSessionId();

  // 1. Take a new snapshot of current state (so we can undo the rollback too)
  await createSectionSnapshot(section_id, "ROLLBACK", actingUser, `Before rollback to snapshot ${snapshot_id}`);

  // 2. Restore section state
  await prisma.section.update({
    where: { id: section_id },
    data: {
      semester: prevState.semester,
      status: prevState.status,
      academic_year: prevState.academic_year || null,
      class_coordinator_id: prevState.class_coordinator_id || null,
    },
  });

  // 3. Restore student statuses
  const prevStudents = snapshot.students_data;
  for (const s of prevStudents) {
    await prisma.student.update({ where: { id: s.id }, data: { status: s.status } }).catch(() => { });
  }

  // 4. Restore enrollments (close current, reopen from snapshot)
  const prevEnrollments = snapshot.enrollments_data;
  await prisma.studentEnrollment.updateMany({
    where: { section_id, is_current: true },
    data: { is_current: false },
  });
  for (const e of prevEnrollments) {
    await prisma.studentEnrollment.upsert({
      where: { id: e.id },
      update: { semester: e.semester, status: e.status, is_current: true },
      create: {
        id: e.id,
        session_id: e.session_id || sid,
        student_id: e.student_id,
        section_id,
        academic_year: e.academic_year || "",
        semester: e.semester,
        batch_year: e.batch_year || 0,
        dept_id: e.dept_id || prevState.branch?.program?.dept_id || "",
        program_id: e.program_id || prevState.branch?.program_id || "",
        branch_id: e.branch_id || prevState.branch_id || null,
        status: e.status,
        is_current: true,
      },
    }).catch(() => { });
  }

  // 5. Mark snapshot as used for rollback
  await prisma.sectionSnapshot.update({
    where: { id: snapshot_id },
    data: { rolled_back_at: new Date(), rolled_back_by: actingUser.id || null },
  });

  await logSectionHistory(section_id, sid, {
    action: "ROLLBACK",
    prev: { semester: prevState.semester + 1 },
    next: { semester: prevState.semester },
    reason: reason || `Rolled back to snapshot from ${snapshot.createdAt.toISOString()}`,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return { rolled_back_to: snapshot.createdAt, semester_restored: prevState.semester };
};

// ── History + Snapshots ───────────────────────────────────────
export const getSectionHistory = (section_id, { page = 1, limit = 50 } = {}) => {
  const _page = parseInt(page, 10) || 1;
  const _limit = parseInt(limit, 10) || 50;
  return prisma.sectionHistory.findMany({
    where: { section_id },
    orderBy: { createdAt: "desc" },
    skip: (_page - 1) * _limit,
    take: _limit,
  });
};

export const getSectionSnapshots = async (section_id) => {
  try {
    if (!prisma.sectionSnapshot) return [];
    return await prisma.sectionSnapshot.findMany({
      where: { section_id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, trigger: true, from_semester: true, to_semester: true,
        reason: true, triggered_by_name: true, rolled_back_at: true, createdAt: true,
        students_data: true,
      },
    });
  } catch (e) {
    console.error("[SNAPSHOT:LIST]", e.message);
    return [];
  }
};

export const getSnapshotDetail = async (snapshot_id) => {
  try {
    if (!prisma.sectionSnapshot) return null;
    return await prisma.sectionSnapshot.findUnique({ where: { id: snapshot_id } });
  } catch (e) {
    console.error("[SNAPSHOT:DETAIL]", e.message);
    return null;
  }
};

// ── Template + Bulk ───────────────────────────────────────────
export const getSectionTemplate = async () => {
  const branches = await prisma.branch.findMany({
    where: { deleted_at: null },
    select: { code: true, name: true, program: { select: { name: true, department: { select: { name: true } } } } },
    orderBy: { name: "asc" },
  });
  const faculty = await prisma.faculty.findMany({
    where: { deleted_at: null, status: "ACTIVE" },
    select: { emp_id: true, name: true, department: { select: { name: true } } },
    take: 100, orderBy: { name: "asc" },
  });

  const YEAR = new Date().getFullYear();
  const wb = xlsx.utils.book_new();
  const HEADERS = ["name*", "branch_code*", "semester* (1-8)", "batch* (e.g. 2024-2028)", "academic_year (e.g. 2024-25)", "room_no", "capacity", "class_coordinator_emp_id", "is_combined (true/false)", "description"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ["CSE-A", branches[0]?.code || "BTECH-CSE", 1, `${YEAR}-${YEAR + 4}`, `${YEAR}-${String(YEAR + 1).slice(2)}`, "101", 60, faculty[0]?.emp_id || "", "false", "Section A"],
    ["FYE-A", branches[0]?.code || "BTECH-CSE", 1, `${YEAR}-${YEAR + 4}`, `${YEAR}-${String(YEAR + 1).slice(2)}`, "201", 120, "", "true", "Combined FYE section"],
  ]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 28 }));
  xlsx.utils.book_append_sheet(wb, ws, "Sections");

  const wsB = xlsx.utils.aoa_to_sheet([["branch_code", "branch_name", "program", "department"], ...branches.map((b) => [b.code, b.name, b.program?.name, b.program?.department?.name])]);
  xlsx.utils.book_append_sheet(wb, wsB, "Branches (Reference)");
  const wsF = xlsx.utils.aoa_to_sheet([["emp_id", "name", "department"], ...faculty.map((f) => [f.emp_id || "", f.name, f.department?.name])]);
  xlsx.utils.book_append_sheet(wb, wsF, "Faculty (Reference)");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const bulkCreateSections = async (buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Sections"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });

  const [branches, faculty] = await Promise.all([
    prisma.branch.findMany({ where: { deleted_at: null }, select: { id: true, code: true } }),
    prisma.faculty.findMany({ where: { deleted_at: null }, select: { id: true, emp_id: true } }),
  ]);
  const branchMap = Object.fromEntries(branches.map((b) => [b.code.toUpperCase(), b.id]));
  const facultyMap = Object.fromEntries(faculty.filter((f) => f.emp_id).map((f) => [f.emp_id.toUpperCase(), f.id]));

  const results = { created: [], failed: [], skipped: [], total: 0 };
  const data = rows.filter((r) => String(r["name*"] || r.name || "").trim());
  results.total = data.length;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const label = `Row ${i + 2}`;
    const name = String(row["name*"] || "").trim();
    const branchCode = String(row["branch_code*"] || "").trim().toUpperCase();
    const semester = parseInt(row["semester* (1-8)"] || 0);
    const batch = String(row["batch* (e.g. 2024-2028)"] || "").trim();
    const acYear = String(row["academic_year (e.g. 2024-25)"] || "").trim() || null;
    const roomNo = String(row.room_no || "").trim() || null;
    const capacity = row.capacity ? parseInt(row.capacity) : null;
    const empId = String(row.class_coordinator_emp_id || "").trim().toUpperCase() || null;
    const combined = String(row["is_combined (true/false)"] || "false").toLowerCase() === "true";
    const description = String(row.description || "").trim() || null;

    if (!name) { results.failed.push({ row: label, reason: "name required" }); continue; }
    if (!branchCode) { results.failed.push({ row: label, reason: "branch_code required" }); continue; }
    if (!semester || semester < 1 || semester > 8) { results.failed.push({ row: label, reason: "semester must be 1-8" }); continue; }
    if (!batch) { results.failed.push({ row: label, reason: "batch required" }); continue; }

    const branch_id = branchMap[branchCode];
    if (!branch_id) { results.failed.push({ row: label, reason: `Branch not found: "${branchCode}"` }); continue; }

    let coordinator_id = null;
    if (empId) {
      coordinator_id = facultyMap[empId];
      if (!coordinator_id) { results.failed.push({ row: label, reason: `Faculty emp_id not found: "${empId}"` }); continue; }
    }

    try {
      const section = await createSection({
        name, branch_id, semester, batch,
        academic_year: acYear, room_no: roomNo, capacity,
        class_coordinator_id: coordinator_id,
        is_combined: combined, description,
      }, actingUser);
      results.created.push({ row: label, id: section.id, name: section.name, code: section.code });
    } catch (err) {
      if (err.code === "P2002") results.skipped.push({ row: label, name, reason: "Section code already exists" });
      else results.failed.push({ row: label, name, reason: err.message });
    }
  }
  return results;
};

// ═══════════════════════════════════════════════════════════════
// BULK PROMOTE / DEMOTE / GRADUATE / STUDENT STATUS
// (merged from section.promote.service.js)
// ═══════════════════════════════════════════════════════════════
// backend/modules/section/section.promote.service.js
// Bulk promote / demote / graduate sections
// Session logic: 2 sems per session
//   Sem 1 → Sem 2: same session
//   Sem 2 → Sem 3: new session (e.g. 2024-25 → 2025-26)
//   Sem 3 → Sem 4: same session
//   ...even→odd = same session change

// ── Session helpers ───────────────────────────────────────────
const getSessionId = async () => {
  const s = await prisma.academicSession.findFirst({ where: { is_current: true } });
  return s?.id || null;
};

// Session changes when moving from even sem to odd sem
// Sem 1→2 same, Sem 2→3 NEW session, Sem 3→4 same, Sem 4→5 NEW...
const sessionChangesOnPromote = (currentSem) => currentSem % 2 === 0;
const sessionChangesOnDemote = (currentSem) => currentSem % 2 === 1;

// Parse "2024-25" → next session "2025-26"
const nextSessionLabel = (label) => {
  if (!label) return null;
  const match = label.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) return null;
  const start = parseInt(match[1]);
  return `${start + 1}-${String(start + 2).slice(-2)}`;
};
const prevSessionLabel = (label) => {
  if (!label) return null;
  const match = label.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) return null;
  const start = parseInt(match[1]);
  return `${start - 1}-${String(start).slice(-2)}`;
};

// ── Get session by label (creates if not exists for promote) ─
const getOrCreateSession = async (label) => {
  if (!label) return null;
  let s = await prisma.academicSession.findFirst({ where: { code: label } });
  if (s) return s.id;
  // Auto-create session for next year
  const [y1] = label.split("-").map(Number);
  s = await prisma.academicSession.create({
    data: {
      name: label,
      code: label,
      label: `Academic Session ${label}`,
      start_date: new Date(`${y1}-07-01`),
      end_date: new Date(`${y1 + 1}-06-30`),
      is_current: false,
      is_locked: false,
    },
  });
  return s.id;
};

// ─────────────────────────────────────────────────────────────
// BULK PROMOTE SECTIONS
// sections: [{ id, current_semester, current_session_label }]
// ─────────────────────────────────────────────────────────────
export const bulkPromoteSections = async (section_ids, reason, actingUser = {}) => {
  const results = {
    sections: { promoted: [], failed: [], skipped: [] },
    students: { promoted: 0, skipped: 0, failed: 0 },
    snapshots: [],
    total_sections: section_ids.length,
  };

  for (const section_id of section_ids) {
    try {
      const section = await prisma.section.findUnique({
        where: { id: section_id },
        include: {
          branch: true,
          sectionHistory: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      if (!section) { results.sections.skipped.push({ id: section_id, reason: "Not found" }); continue; }
      if (section.status !== "ACTIVE") { results.sections.skipped.push({ id: section_id, name: section.name, reason: `Status is ${section.status}` }); continue; }

      const currentSem = section.semester;
      const newSem = currentSem + 1;
      const currentSession = await prisma.academicSession.findFirst({ where: { is_current: true } });
      const currentLabel = currentSession?.code || section.academic_year;

      // Determine new session
      const sessionChanges = sessionChangesOnPromote(currentSem);
      const newSessionLabel = sessionChanges ? nextSessionLabel(currentLabel) : currentLabel;
      const newSessionId = sessionChanges
        ? await getOrCreateSession(newSessionLabel)
        : (currentSession?.id || null);

      // 1. Snapshot
      const snapshot = await createSectionSnapshot(section_id, "PROMOTE", actingUser, reason);
      results.snapshots.push(snapshot?.id);

      // 2. Update section
      await prisma.section.update({
        where: { id: section_id },
        data: {
          semester: newSem,
          academic_year: newSessionLabel || section.academic_year,
        },
      });

      // 3. Get active students
      const students = await prisma.student.findMany({
        where: { section_id, deleted_at: null, status: "ACTIVE" },
        select: { id: true, name: true, roll_no: true },
      });

      // 4. Update each student's enrollment
      for (const student of students) {
        try {
          // Close current enrollment
          await prisma.studentEnrollment.updateMany({
            where: { student_id: student.id, is_current: true },
            data: { is_current: false, completed_at: new Date(), status: "PROMOTED" },
          });

          // New enrollment
          const existingEnroll = await prisma.studentEnrollment.findFirst({
            where: { student_id: student.id, is_current: false },
            orderBy: { enrolled_at: "desc" },
          });

          await prisma.studentEnrollment.create({
            data: {
              session_id: newSessionId || existingEnroll?.session_id || currentSession?.id || "",
              student_id: student.id,
              section_id: section_id,
              academic_year: newSessionLabel || section.academic_year || "",
              semester: newSem,
              batch_year: section.batch_year || existingEnroll?.batch_year || 0,
              dept_id: existingEnroll?.dept_id || section.branch?.program_id || "",
              program_id: existingEnroll?.program_id || section.branch?.program_id || "",
              branch_id: existingEnroll?.branch_id || section.branch_id || null,
              status: "ACTIVE",
              is_current: true,
              promoted_from_section_id: section_id,
              promoted_by: actingUser.id || null,
              promoted_at: new Date(),
            },
          });

          await logEnrollmentHistory(student.id, {
            action: "PROMOTE",
            section_id,
            from_semester: currentSem,
            to_semester: newSem,
            from_status: "ACTIVE",
            to_status: "ACTIVE",
            from_session: currentLabel,
            to_session: newSessionLabel,
            reason,
            snapshot_id: snapshot?.id,
            by: actingUser.id,
            byName: actingUser.email,
          });

          results.students.promoted++;
        } catch { results.students.failed++; }
      }

      // DETAINED students — stay in same section, enrollment stays current
      const detainedCount = await prisma.student.count({
        where: { section_id, deleted_at: null, status: "DETAINED" },
      });
      results.students.skipped += detainedCount;

      // Log section history
      await logSectionHistory(section_id, currentSession?.id || "DEFAULT", {
        action: "PROMOTE",
        prev: { semester: currentSem, academic_year: currentLabel },
        next: { semester: newSem, academic_year: newSessionLabel },
        reason,
        by: actingUser.id,
        byName: actingUser.email,
      });

      results.sections.promoted.push({
        id: section_id,
        name: section.name,
        code: section.code,
        from_sem: currentSem,
        to_sem: newSem,
        from_session: currentLabel,
        to_session: newSessionLabel,
        session_changed: sessionChanges,
        students_promoted: students.length,
        students_detained: detainedCount,
      });

    } catch (err) {
      results.sections.failed.push({ id: section_id, reason: err.message });
    }
  }

  return results;
};

// ─────────────────────────────────────────────────────────────
// BULK DEMOTE SECTIONS
// ─────────────────────────────────────────────────────────────
export const bulkDemoteSections = async (section_ids, reason, actingUser = {}) => {
  const results = {
    sections: { demoted: [], failed: [], skipped: [] },
    students: { demoted: 0, failed: 0 },
    total_sections: section_ids.length,
  };

  for (const section_id of section_ids) {
    try {
      const section = await prisma.section.findUnique({ where: { id: section_id } });
      if (!section) { results.sections.skipped.push({ id: section_id, reason: "Not found" }); continue; }
      if (section.semester <= 1) { results.sections.skipped.push({ id: section_id, name: section.name, reason: "Already at Semester 1" }); continue; }

      const currentSem = section.semester;
      const newSem = currentSem - 1;
      const currentSession = await prisma.academicSession.findFirst({ where: { is_current: true } });
      const currentLabel = currentSession?.code || section.academic_year;
      const sessionChanges = sessionChangesOnDemote(currentSem);
      const newSessionLabel = sessionChanges ? prevSessionLabel(currentLabel) : currentLabel;

      const snapshot = await createSectionSnapshot(section_id, "DEMOTE", actingUser, reason);

      await prisma.section.update({
        where: { id: section_id },
        data: { semester: newSem, academic_year: newSessionLabel || section.academic_year },
      });

      const students = await prisma.student.findMany({
        where: { section_id, deleted_at: null },
        select: { id: true, name: true, roll_no: true },
      });

      for (const student of students) {
        try {
          await prisma.studentEnrollment.updateMany({
            where: { student_id: student.id, is_current: true },
            data: { semester: newSem, status: "DEMOTED", academic_year: newSessionLabel || section.academic_year },
          });
          await logEnrollmentHistory(student.id, {
            action: "DEMOTE", section_id,
            from_semester: currentSem, to_semester: newSem,
            from_session: currentLabel, to_session: newSessionLabel,
            reason, snapshot_id: snapshot?.id,
            by: actingUser.id, byName: actingUser.email,
          });
          results.students.demoted++;
        } catch { results.students.failed++; }
      }

      await logSectionHistory(section_id, currentSession?.id || "DEFAULT", {
        action: "DEMOTE",
        prev: { semester: currentSem }, next: { semester: newSem },
        reason, by: actingUser.id, byName: actingUser.email,
      });

      results.sections.demoted.push({
        id: section_id, name: section.name, code: section.code,
        from_sem: currentSem, to_sem: newSem,
        from_session: currentLabel, to_session: newSessionLabel,
        session_changed: sessionChanges,
        students_demoted: students.length,
      });

    } catch (err) {
      results.sections.failed.push({ id: section_id, reason: err.message });
    }
  }

  return results;
};

// ─────────────────────────────────────────────────────────────
// GRADUATE SECTIONS — mark final sem sections as PASSED
// All ACTIVE students → PASSED + is_alumni=true
// Section → COMPLETED
// ─────────────────────────────────────────────────────────────
export const graduateSections = async (section_ids, reason, actingUser = {}) => {
  const results = {
    sections: { graduated: [], failed: [], skipped: [] },
    students: { passed: 0, failed: 0 },
    total_sections: section_ids.length,
  };

  const currentSession = await prisma.academicSession.findFirst({ where: { is_current: true } });

  for (const section_id of section_ids) {
    try {
      const section = await prisma.section.findUnique({
        where: { id: section_id },
        include: { branch: { include: { program: true } } },
      });
      if (!section) { results.sections.skipped.push({ id: section_id, reason: "Not found" }); continue; }
      if (section.status === "COMPLETED") { results.sections.skipped.push({ id: section_id, name: section.name, reason: "Already graduated" }); continue; }

      const snapshot = await createSectionSnapshot(section_id, "MANUAL", actingUser, reason || "Graduation");

      // Get all ACTIVE students
      const students = await prisma.student.findMany({
        where: { section_id, deleted_at: null, status: "ACTIVE" },
        select: { id: true, name: true, roll_no: true, user_id: true },
      });

      for (const student of students) {
        try {
          // Update student status
          await prisma.student.update({
            where: { id: student.id },
            data: { status: "PASSED", is_alumni: true },
          });

          // Update user — don't block alumni
          // Close enrollment as PASSED
          await prisma.studentEnrollment.updateMany({
            where: { student_id: student.id, is_current: true },
            data: { status: "PASSED", is_current: false, completed_at: new Date() },
          });

          // Log
          await prisma.studentHistory.create({
            data: {
              student_id: student.id,
              action: "STATUS_CHANGE",
              changed_fields: ["status", "is_alumni"],
              prev_data: { status: "ACTIVE", is_alumni: false },
              new_data: { status: "PASSED", is_alumni: true },
              changed_by: actingUser.id || null,
              changed_by_name: actingUser.email || null,
            },
          }).catch(() => { });

          // Notify student
          await prisma.notification.create({
            data: {
              user_id: student.user_id,
              type: "STATUS_CHANGED",
              title: "Congratulations! You have graduated.",
              message: `Your status has been updated to PASSED. You are now an alumni of the institution.`,
              data: { status: "PASSED", section: section.name },
            },
          }).catch(() => { });

          results.students.passed++;
        } catch { results.students.failed++; }
      }

      // Mark section COMPLETED
      await prisma.section.update({
        where: { id: section_id },
        data: { status: "COMPLETED" },
      });

      await logSectionHistory(section_id, currentSession?.id || "DEFAULT", {
        action: "GRADUATE",
        prev: { status: "ACTIVE", semester: section.semester },
        next: { status: "COMPLETED" },
        reason: reason || "Graduation",
        by: actingUser.id, byName: actingUser.email,
      });

      results.sections.graduated.push({
        id: section_id, name: section.name, code: section.code,
        semester: section.semester,
        students_passed: students.length,
      });

    } catch (err) {
      results.sections.failed.push({ id: section_id, reason: err.message });
    }
  }

  return results;
};

// ─────────────────────────────────────────────────────────────
// STUDENT BULK STATUS — template + upload
// ─────────────────────────────────────────────────────────────

export const getStudentStatusTemplate = async ({ section_id, branch_id, program_id, dept_id } = {}) => {
  const where = { deleted_at: null };
  if (section_id) where.section_id = section_id;
  if (branch_id) where.branch_id = branch_id;
  if (program_id) where.program_id = program_id;
  if (dept_id) where.dept_id = dept_id;

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true, roll_no: true, enrollment_no: true, name: true, status: true,
      user: { select: { email: true } },
      section: { select: { name: true, semester: true } },
      branch: { select: { name: true } },
    },
    orderBy: [{ section_id: "asc" }, { name: "asc" }],
    // No limit — fetch all matching students
  });

  const wb = xlsx.utils.book_new();
  const HEADERS = [
    "uid* (roll_no or enrollment_no)",
    "new_status*",
    "reason",
    // info only — not read on upload
    "student_name (info)",
    "email (info)",
    "current_status (info)",
    "section (info)",
    "semester (info)",
  ];

  const VALID_STATUSES = "ACTIVE | DETAINED | ON_HOLD | LEFT | TRANSFERRED | SUSPENDED | PASSED";

  const rows = students.map((s) => [
    s.roll_no || s.enrollment_no || "",
    "",   // new_status — admin fills this
    "",   // reason
    s.name,
    s.user?.email || "",
    s.status,
    s.section?.name || "",
    s.section?.semester || "",
  ]);

  const ws = xlsx.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 10 }];

  // Protect info columns (mark as read-only hint)
  xlsx.utils.book_append_sheet(wb, ws, "Students");

  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["VALID STATUSES:", VALID_STATUSES],
    [""],
    ["uid*", "Required", "Roll No or Enrollment No"],
    ["new_status*", "Required", VALID_STATUSES],
    ["reason", "Optional", "Reason for status change"],
    ["All other columns are info-only — do not edit"],
  ]), "Instructions");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const bulkUpdateStudentStatus = async (buffer, globalStatus, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(
    wb.Sheets["Students"] || wb.Sheets[wb.SheetNames[0]],
    { defval: "" }
  );

  const VALID = new Set(["ACTIVE", "DETAINED", "ON_HOLD", "LEFT", "TRANSFERRED", "SUSPENDED", "PASSED"]);
  const BLOCK_ON = new Set(["ON_HOLD", "LEFT", "TRANSFERRED", "SUSPENDED", "PASSED"]);
  const UNBLOCK_ON = new Set(["ACTIVE", "DETAINED"]);

  const results = { created: [], failed: [], skipped: [], total: 0 };
  const dataRows = rows.filter((r) => String(r["uid* (roll_no or enrollment_no)"] || r.uid || "").trim());
  results.total = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const label = `Row ${i + 2}`;
    const uid = String(row["uid* (roll_no or enrollment_no)"] || row.uid || "").trim();
    const status = globalStatus || String(row["new_status*"] || row.new_status || "").trim().toUpperCase();
    const reason = String(row.reason || "").trim() || undefined;

    if (!uid) { results.failed.push({ row: label, reason: "uid required" }); continue; }
    if (!status) { results.failed.push({ row: label, uid, reason: "new_status required" }); continue; }
    if (!VALID.has(status)) { results.failed.push({ row: label, uid, reason: `Invalid status: "${status}". Valid: ${[...VALID].join(", ")}` }); continue; }

    // Find student by roll_no or enrollment_no
    const student = await prisma.student.findFirst({
      where: { OR: [{ roll_no: uid }, { enrollment_no: uid }], deleted_at: null },
      select: { id: true, name: true, roll_no: true, enrollment_no: true, status: true, user_id: true },
    });

    if (!student) { results.failed.push({ row: label, uid, reason: "Student not found" }); continue; }
    if (student.status === status) { results.skipped.push({ row: label, uid, name: student.name, reason: `Already ${status}` }); continue; }

    try {
      const prevStatus = student.status;
      await prisma.student.update({ where: { id: student.id }, data: { status, ...(status === "PASSED" ? { is_alumni: true } : {}) } });

      if (BLOCK_ON.has(status)) await prisma.user.update({ where: { id: student.user_id }, data: { isBlocked: true } }).catch(() => { });
      if (UNBLOCK_ON.has(status)) await prisma.user.update({ where: { id: student.user_id }, data: { isBlocked: false } }).catch(() => { });

      await prisma.studentEnrollment.updateMany({ where: { student_id: student.id, is_current: true }, data: { status } });

      await prisma.studentHistory.create({
        data: {
          student_id: student.id, action: "STATUS_CHANGE",
          changed_fields: ["status"],
          prev_data: { status: prevStatus }, new_data: { status, reason },
          changed_by: actingUser.id || null, changed_by_name: actingUser.email || null,
        },
      }).catch(() => { });

      await prisma.notification.create({
        data: {
          user_id: student.user_id, type: "STATUS_CHANGED",
          title: "Account Status Updated",
          message: `Your status has changed from ${prevStatus} to ${status}.${reason ? ` Reason: ${reason}` : ""}`,
        },
      }).catch(() => { });

      results.created.push({ row: label, uid, name: student.name, from: prevStatus, to: status });
    } catch (err) {
      results.failed.push({ row: label, uid, name: student.name, reason: err.message });
    }
  }

  return results;
};


// ═══════════════════════════════════════════════════════════════
// SECTION STUDENTS — add / remove / group
// ═══════════════════════════════════════════════════════════════

// ── Get students in section with full filters ────────────────
export const getSectionStudents = async (section_id, {
  search, status, group_no, semester, batch_year, page = 1, limit = 200
} = {}) => {
  const _page = parseInt(page, 10) || 1;
  const _limit = parseInt(limit, 10) || 200;
  const where = { section_id, deleted_at: null };
  if (status) where.status = status;
  if (group_no) where.group_no = String(group_no);
  if (batch_year) where.batch_year = parseInt(batch_year);
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { roll_no: { contains: search, mode: "insensitive" } },
    { enrollment_no: { contains: search, mode: "insensitive" } },
  ];
  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where, skip: (_page - 1) * _limit, take: _limit,
      orderBy: [{ group_no: "asc" }, { roll_no: "asc" }],
      select: {
        id: true, name: true, roll_no: true, enrollment_no: true,
        status: true, group_no: true, batch_year: true, gender: true,
        branch: { select: { name: true, code: true } },
        program: { select: { name: true } },
        department: { select: { name: true } },
        user: { select: { email: true, isBlocked: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);
  return { students, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

// ── Add students to section (bulk) ───────────────────────────
export const addStudentsToSection = async (section_id, student_ids, actingUser = {}) => {
  const section = await prisma.section.findUnique({
    where: { id: section_id },
    include: { branch: { include: { program: true } } },
  });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });

  const sid = await getSessionId();
  const results = { added: [], already_in: [], failed: [], total: student_ids.length };

  for (const student_id of student_ids) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: student_id },
        select: { id: true, name: true, roll_no: true, section_id: true },
      });
      if (!student) { results.failed.push({ id: student_id, reason: "Not found" }); continue; }
      if (student.section_id === section_id) {
        results.already_in.push({ id: student_id, name: student.name }); continue;
      }

      await prisma.student.update({
        where: { id: student_id },
        data: {
          section_id,
          branch_id: section.branch_id,
          program_id: section.branch?.program_id,
          dept_id: section.branch?.program?.dept_id,
        },
      });

      // Update OR create enrollment
      const existingEnroll = await prisma.studentEnrollment.findFirst({
        where: { student_id, is_current: true },
      });

      const enrollData = {
        session_id: sid || existingEnroll?.session_id || "",
        student_id,
        section_id,
        branch_id: section.branch_id,
        program_id: section.branch?.program_id || existingEnroll?.program_id || "",
        dept_id: section.branch?.program?.dept_id || existingEnroll?.dept_id || "",
        semester: section.semester,
        academic_year: section.academic_year || existingEnroll?.academic_year || "",
        batch_year: existingEnroll?.batch_year ?? 0,
        status: "ACTIVE",
        is_current: true,
      };

      if (existingEnroll) {
        // Update existing current enrollment
        await prisma.studentEnrollment.update({
          where: { id: existingEnroll.id },
          data: {
            section_id,
            branch_id: enrollData.branch_id,
            program_id: enrollData.program_id,
            dept_id: enrollData.dept_id,
            semester: enrollData.semester,
            academic_year: enrollData.academic_year,
            ...(sid ? { session_id: sid } : {}),
          },
        });
      } else {
        // No enrollment exists — create one
        await prisma.studentEnrollment.create({ data: enrollData });
      }

      // Log
      await prisma.studentSectionHistory.create({
        data: {
          student_id,
          to_section_id: section_id,
          to_section_code: section.code,
          reason: "Manual add to section",
          changed_by: actingUser.id || null,
          changed_by_name: actingUser.email || null,
        },
      }).catch(() => { });

      results.added.push({ id: student_id, name: student.name, roll_no: student.roll_no });
    } catch (err) { results.failed.push({ id: student_id, reason: err.message }); }
  }
  return results;
};

// ── Remove students from section ──────────────────────────────
export const removeStudentsFromSection = async (section_id, student_ids, actingUser = {}) => {
  const results = { removed: [], failed: [], total: student_ids.length };
  for (const student_id of student_ids) {
    try {
      await prisma.student.update({
        where: { id: student_id },
        data: { section_id: null },
      });
      results.removed.push({ id: student_id });
    } catch (err) { results.failed.push({ id: student_id, reason: err.message }); }
  }
  return results;
};

// ── Assign groups (G1/G2/G3) ─────────────────────────────────
export const assignGroups = async (section_id, assignments, actingUser = {}) => {
  // assignments: [{ student_id, group_no }]
  const results = { assigned: [], failed: [], total: assignments.length };
  for (const { student_id, group_no } of assignments) {
    try {
      await prisma.student.update({
        where: { id: student_id },
        data: { group_no: group_no ? String(group_no) : null },
      });
      results.assigned.push({ student_id, group_no });
    } catch (err) { results.failed.push({ student_id, reason: err.message }); }
  }
  return results;
};

// ── Group assign template ─────────────────────────────────────
export const getGroupAssignTemplate = async (section_id) => {
  const students = await prisma.student.findMany({
    where: { section_id, deleted_at: null },
    select: { roll_no: true, enrollment_no: true, name: true, group_no: true, status: true },
    orderBy: [{ group_no: "asc" }, { roll_no: "asc" }],
  });

  const section = await prisma.section.findUnique({ where: { id: section_id }, select: { name: true, code: true, semester: true } });

  const wb = xlsx.utils.book_new();
  const HEADERS = ["uid* (roll_no or enrollment_no)", "group_no (G1/G2/G3 or blank to remove)", "student_name (info)", "current_group (info)", "status (info)"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ...students.map((s) => [s.roll_no || s.enrollment_no || "", "", s.name, s.group_no || "", s.status]),
  ]);
  ws["!cols"] = [{ wch: 26 }, { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 12 }];
  xlsx.utils.book_append_sheet(wb, ws, `${section?.code || "Section"}`);
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["uid*", "Required", "Roll No or Enrollment No"],
    ["group_no", "Optional", "G1, G2, G3 or any label. Leave blank to remove from group."],
  ]), "Instructions");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Group assign bulk upload ──────────────────────────────────
export const bulkAssignGroups = async (section_id, buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { assigned: [], failed: [], total: 0 };
  const data = rows.filter((r) => String(r["uid* (roll_no or enrollment_no)"] || r.uid || "").trim());
  results.total = data.length;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const uid = String(row["uid* (roll_no or enrollment_no)"] || row.uid || "").trim();
    const group = String(row["group_no (G1/G2/G3 or blank to remove)"] || row.group_no || "").trim() || null;
    const label = `Row ${i + 2}`;
    if (!uid) { results.failed.push({ row: label, reason: "uid required" }); continue; }

    const student = await prisma.student.findFirst({
      where: { OR: [{ roll_no: uid }, { enrollment_no: uid }], section_id, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!student) { results.failed.push({ row: label, uid, reason: "Student not found in this section" }); continue; }

    try {
      await prisma.student.update({ where: { id: student.id }, data: { group_no: group } });
      results.assigned.push({ row: label, uid, name: student.name, group_no: group || "(removed)" });
    } catch (err) { results.failed.push({ row: label, uid, reason: err.message }); }
  }
  return results;
};

// ═══════════════════════════════════════════════════════════════
// FYE SPLIT TEMPLATE — download after promoting combined section
// Template: uid | name | current_section | branch | target_section_code (blank)
// ═══════════════════════════════════════════════════════════════
export const getFyeSplitTemplate = async (section_id) => {
  const section = await prisma.section.findUnique({
    where: { id: section_id },
    include: { branch: { include: { program: { include: { department: true } } } } },
  });
  if (!section) throw Object.assign(new Error("Section not found"), { status: 404 });
  if (!section.is_combined) throw Object.assign(new Error("Section is not combined"), { status: 400 });

  const students = await prisma.student.findMany({
    where: { section_id, deleted_at: null, status: "ACTIVE" },
    select: {
      roll_no: true, enrollment_no: true, name: true, gender: true, batch_year: true,
      branch: { select: { name: true, code: true } },
      program: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Available target sections — same semester, not combined
  const targetSections = await prisma.section.findMany({
    where: {
      deleted_at: null, status: "ACTIVE",
      semester: section.semester,
      is_combined: false,
    },
    select: { code: true, name: true, branch: { select: { name: true, program: { select: { name: true } } } } },
    orderBy: { code: "asc" },
  });

  const wb = xlsx.utils.book_new();
  const HEADERS = [
    "uid* (roll_no or enrollment_no)",
    "target_section_code*",
    "student_name (info)",
    "current_section (info)",
    "branch (info)",
    "program (info)",
    "gender (info)",
    "batch_year (info)",
  ];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ...students.map((s) => [
      s.roll_no || s.enrollment_no || "",
      "",
      s.name,
      section.code,
      s.branch?.name || section.branch?.name || "",
      s.program?.name || section.branch?.program?.name || "",
      s.gender || "",
      s.batch_year || "",
    ]),
  ]);
  ws["!cols"] = [{ wch: 26 }, { wch: 20 }, { wch: 30 }, { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 8 }, { wch: 10 }];
  xlsx.utils.book_append_sheet(wb, ws, "Students");

  // Target sections reference
  const wsRef = xlsx.utils.aoa_to_sheet([
    ["section_code", "section_name", "branch", "program"],
    ...targetSections.map((s) => [s.code, s.name, s.branch?.name, s.branch?.program?.name]),
  ]);
  wsRef["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 24 }, { wch: 24 }];
  xlsx.utils.book_append_sheet(wb, wsRef, "Target Sections (Reference)");

  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["INSTRUCTIONS"],
    [""],
    ["Fill target_section_code for each student from the Target Sections sheet"],
    ["All students must be assigned before upload"],
    ["Upload via: Section Detail → FYE Split → Upload Filled Template"],
  ]), "Instructions");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── FYE Split from template ───────────────────────────────────
export const fyeSplitFromTemplate = async (section_id, buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Students"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });

  const sections = await prisma.section.findMany({
    where: { deleted_at: null },
    include: { branch: { include: { program: true } } },
  });
  const sectionByCode = Object.fromEntries(sections.map((s) => [s.code.toUpperCase(), s]));

  const assignments = [];
  const parseErrors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const uid = String(row["uid* (roll_no or enrollment_no)"] || row.uid || "").trim();
    const code = String(row["target_section_code*"] || row.target_section_code || "").trim().toUpperCase();
    if (!uid) continue;
    if (!code) { parseErrors.push({ row: `Row ${i + 2}`, uid, reason: "target_section_code required" }); continue; }

    const student = await prisma.student.findFirst({
      where: { OR: [{ roll_no: uid }, { enrollment_no: uid }], deleted_at: null },
      select: { id: true },
    });
    if (!student) { parseErrors.push({ row: `Row ${i + 2}`, uid, reason: "Student not found" }); continue; }

    const targetSection = sectionByCode[code];
    if (!targetSection) { parseErrors.push({ row: `Row ${i + 2}`, uid, reason: `Section not found: "${code}"` }); continue; }

    assignments.push({ student_id: student.id, to_section_id: targetSection.id });
  }

  if (parseErrors.length > 0 && assignments.length === 0) {
    return { moved: [], failed: parseErrors, skipped: [], total: rows.length };
  }

  const result = await fyeSplit(section_id, assignments, "FYE Split via template", actingUser);
  return { ...result, parse_errors: parseErrors };
};

// ═══════════════════════════════════════════════════════════════
// TRANSFER TEMPLATE — move students between sections
// Template: uid | name | current_section_code | target_section_code | reason
// ═══════════════════════════════════════════════════════════════
export const getTransferTemplate = async ({ section_id, branch_id, dept_id, semester } = {}) => {
  const where = { deleted_at: null, status: { in: ["ACTIVE", "DETAINED"] } };
  if (section_id) where.section_id = section_id;
  if (branch_id) where.branch_id = branch_id;
  if (dept_id) where.dept_id = dept_id;

  const students = await prisma.student.findMany({
    where,
    select: {
      roll_no: true, enrollment_no: true, name: true, status: true, group_no: true,
      section: { select: { code: true, name: true, semester: true } },
      branch: { select: { name: true } },
    },
    orderBy: [{ section_id: "asc" }, { name: "asc" }],
    // No limit — fetch all matching students
  });

  const allSections = await prisma.section.findMany({
    where: {
      deleted_at: null, status: "ACTIVE",
      ...(semester ? { semester: parseInt(semester) } : {}),
    },
    select: { code: true, name: true, semester: true, branch: { select: { name: true } } },
    orderBy: { code: "asc" },
  });

  const wb = xlsx.utils.book_new();
  const HEADERS = [
    "uid* (roll_no or enrollment_no)",
    "target_section_code*",
    "reason",
    "student_name (info)",
    "current_section_code (info)",
    "current_sem (info)",
    "branch (info)",
    "group (info)",
    "status (info)",
  ];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ...students.map((s) => [
      s.roll_no || s.enrollment_no || "",
      "",
      "",
      s.name,
      s.section?.code || "",
      s.section?.semester || "",
      s.branch?.name || "",
      s.group_no || "",
      s.status,
    ]),
  ]);
  ws["!cols"] = [{ wch: 26 }, { wch: 20 }, { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 22 }, { wch: 8 }, { wch: 12 }];
  xlsx.utils.book_append_sheet(wb, ws, "Students");

  const wsRef = xlsx.utils.aoa_to_sheet([
    ["section_code", "section_name", "semester", "branch"],
    ...allSections.map((s) => [s.code, s.name, s.semester, s.branch?.name]),
  ]);
  wsRef["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 10 }, { wch: 24 }];
  xlsx.utils.book_append_sheet(wb, wsRef, "Sections (Reference)");

  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["uid*", "Required", "Roll No or Enrollment No"],
    ["target_section_code*", "Required", "From Sections reference sheet"],
    ["reason", "Optional", "Reason for transfer"],
    ["All other columns are info-only"],
  ]), "Instructions");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Transfer upload ───────────────────────────────────────────
export const bulkTransferStudents = async (buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Students"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });

  const sections = await prisma.section.findMany({
    where: { deleted_at: null },
    include: { branch: { include: { program: true } } },
  });
  const sectionByCode = Object.fromEntries(sections.map((s) => [s.code.toUpperCase(), s]));

  const results = { transferred: [], failed: [], skipped: [], total: 0 };
  const data = rows.filter((r) => String(r["uid* (roll_no or enrollment_no)"] || r.uid || "").trim());
  results.total = data.length;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const label = `Row ${i + 2}`;
    const uid = String(row["uid* (roll_no or enrollment_no)"] || row.uid || "").trim();
    const code = String(row["target_section_code*"] || row.target_section_code || "").trim().toUpperCase();
    const reason = String(row.reason || "").trim() || "Template transfer";

    if (!uid) { results.failed.push({ row: label, reason: "uid required" }); continue; }
    if (!code) { results.failed.push({ row: label, uid, reason: "target_section_code required" }); continue; }

    const targetSection = sectionByCode[code];
    if (!targetSection) { results.failed.push({ row: label, uid, reason: `Section not found: "${code}"` }); continue; }

    const student = await prisma.student.findFirst({
      where: { OR: [{ roll_no: uid }, { enrollment_no: uid }], deleted_at: null },
      select: { id: true, name: true, section_id: true, section: { select: { code: true } } },
    });
    if (!student) { results.failed.push({ row: label, uid, reason: "Student not found" }); continue; }

    if (student.section_id === targetSection.id) {
      results.skipped.push({ row: label, uid, name: student.name, reason: `Already in ${code}` }); continue;
    }

    try {
      // changeStudentSection handles all updates + logging
      await changeStudentSection(student.id, targetSection.id, actingUser);
      results.transferred.push({
        row: label, uid, name: student.name,
        from: student.section?.code || "—", to: code,
      });
    } catch (err) { results.failed.push({ row: label, uid, name: student.name, reason: err.message }); }
  }
  return results;
};