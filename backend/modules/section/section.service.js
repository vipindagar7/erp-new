import xlsx from "xlsx";
import { sectionTemplate, sectionSubjectTemplate } from "../shared/template.helper.js";
import prisma from "../../utils/prisma.js";


// ── Includes ───────────────────────────────────────────────────
const STATUS_SORT = { ACTIVE: 0, COMPLETED: 1, ARCHIVED: 2, ALUMNI: 3, SUSPENDED: 4 };

const sectionInclude = {
  course: {
    include: {
      program: { include: { department: { select: { id: true, name: true } } } },
    },
  },
  class_coordinator: {
    select: { id: true, name: true, emp_id: true, designation: true },
  },
  sectionSubjects: {
    include: {
      subject: true,
      faculty: { select: { id: true, name: true, emp_id: true } },
    },
    orderBy: [{ status: "asc" }, { subject: { name: "asc" } }],  // ACTIVE < COMPLETED < REMOVED alphabetically
  },
  _count: { select: { students: true } },
};

// ══════════════════════════════════════════════════════════════
// CRUD
// ══════════════════════════════════════════════════════════════
export const getAllSections = async ({
  page = 1, limit = 20, search, course_id, program_id, dept_id, semester, status,
} = {}) => {
  const _page = parseInt(page) || 1;
  const _limit = parseInt(limit) || 20;
  const skip = (_page - 1) * _limit;
  const where = {
    ...(course_id && { course_id }),
    ...(semester && { semester: parseInt(semester) }),
    ...(status && status !== "all" && { status }),
    ...(program_id && { course: { program_id } }),
    ...(dept_id && { course: { program: { dept_id } } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { batch: { contains: search, mode: "insensitive" } },
        { room_no: { contains: search, mode: "insensitive" } },
      ],
    }),
  };
  const [sections, total] = await Promise.all([
    prisma.section.findMany({
      where, skip, take: _limit,
      // ACTIVE first, then by semester, then by name
      orderBy: [{ semester: "asc" }, { name: "asc" }],
      include: sectionInclude
    }),
    prisma.section.count({ where }),
  ]);
  sections.sort((a, b) => {
    const sa = STATUS_SORT[a.status] ?? 99;
    const sb = STATUS_SORT[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.name.localeCompare(b.name);
  });
  return { sections, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

export const getSectionById = (id) =>
  prisma.section.findUnique({ where: { id }, include: sectionInclude });

export const createSection = (data) =>
  prisma.section.create({
    data: {
      name: data.name,
      course_id: data.course_id,
      semester: data.semester,
      batch: data.batch,
      status: data.status || "ACTIVE",
      room_no: data.room_no || null,
      class_coordinator_id: data.class_coordinator_id || null,
    },
    include: sectionInclude,
  });

export const updateSection = (id, data) => {
  // Only include fields that are explicitly provided — safe for partial updates (status-only, etc.)
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.course_id !== undefined) update.course_id = data.course_id;
  if (data.semester !== undefined) update.semester = data.semester;
  if (data.batch !== undefined) update.batch = data.batch;
  if (data.status !== undefined) update.status = data.status;
  if (data.room_no !== undefined) update.room_no = data.room_no || null;
  if (data.class_coordinator_id !== undefined) update.class_coordinator_id = data.class_coordinator_id || null;
  return prisma.section.update({ where: { id }, data: update, include: sectionInclude });
};

export const deleteSection = async (id) => {
  const count = await prisma.sectionSubject.count({ where: { section_id: id } });
  if (count > 0) {
    const err = new Error(`Cannot delete: this section has ${count} subject${count !== 1 ? "s" : ""} assigned. Remove them first.`);
    err.status = 400; throw err;
  }
  return prisma.section.delete({ where: { id } });
};

// ══════════════════════════════════════════════════════════════
// SUBJECT ASSIGNMENT
// ══════════════════════════════════════════════════════════════
export const assignSubjectToSection = async (section_id, subject_id, faculty_id, type, status) => {
  return prisma.$transaction(async (tx) => {
    await tx.sectionSubject.upsert({
      where: { section_id_subject_id: { section_id, subject_id } },
      create: { section_id, subject_id, faculty_id: faculty_id || null, type: type || "REGULAR", status: status || "ACTIVE" },
      update: { faculty_id: faculty_id || null, type: type || "REGULAR", status: status || "ACTIVE" },
    });
    if (faculty_id) {
      await tx.facultySubject.upsert({
        where: { faculty_id_subject_id: { faculty_id, subject_id } },
        create: { faculty_id, subject_id },
        update: {},
      });
    }
    const result = await tx.section.findUnique({ where: { id: section_id }, include: sectionInclude });
    return result;
  });
};

export const updateSectionSubject = async (section_id, subject_id, data) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.sectionSubject.findUnique({
      where: { section_id_subject_id: { section_id, subject_id } },
    });
    await tx.sectionSubject.update({
      where: { section_id_subject_id: { section_id, subject_id } },
      data: {
        faculty_id: data.faculty_id ?? existing?.faculty_id,
        type: data.type ?? existing?.type,
        status: data.status ?? existing?.status,
      },
    });
    if (data.faculty_id !== undefined && data.faculty_id !== existing?.faculty_id) {
      if (data.faculty_id) {
        await tx.facultySubject.upsert({
          where: { faculty_id_subject_id: { faculty_id: data.faculty_id, subject_id } },
          create: { faculty_id: data.faculty_id, subject_id },
          update: {},
        });
      }
      if (existing?.faculty_id) {
        const others = await tx.sectionSubject.count({
          where: { subject_id, faculty_id: existing.faculty_id, NOT: { section_id } },
        });
        if (others === 0) {
          await tx.facultySubject.deleteMany({ where: { faculty_id: existing.faculty_id, subject_id } });
        }
      }
    }
    return tx.section.findUnique({ where: { id: section_id }, include: sectionInclude });
  });
};

export const removeSubjectFromSection = async (section_id, subject_id) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.sectionSubject.findUnique({
      where: { section_id_subject_id: { section_id, subject_id } },
    });
    await tx.sectionSubject.delete({ where: { section_id_subject_id: { section_id, subject_id } } });
    if (existing?.faculty_id) {
      const others = await tx.sectionSubject.count({
        where: { subject_id, faculty_id: existing.faculty_id, NOT: { section_id } },
      });
      if (others === 0) {
        await tx.facultySubject.deleteMany({ where: { faculty_id: existing.faculty_id, subject_id } });
      }
    }
    return tx.section.findUnique({ where: { id: section_id }, include: sectionInclude });
  });
};

// ── Kept for backwards compat with old controller ─────────────
export const updateSectionSubjectFaculty = (section_id, subject_id, data) =>
  updateSectionSubject(section_id, subject_id, typeof data === "string" ? { faculty_id: data } : data);

// ══════════════════════════════════════════════════════════════
// BULK CREATE SECTIONS
// ══════════════════════════════════════════════════════════════
export const bulkCreateSections = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], total: rows.length };
  for (const row of rows) {
    const name = String(row["Name*"] || row.name || "").trim();
    const course_id = String(row["Course ID*"] || row.course_id || "").trim();
    const semester = parseInt(row["Semester* (1-8)"] || row.semester || 0);
    const batch = String(row["Batch*"] || row.batch || "").trim();
    if (!name || !course_id || !semester || !batch) { results.failed.push({ row, reason: "Name, Course ID, Semester and Batch required" }); continue; }
    if (semester < 1 || semester > 8) { results.failed.push({ row, reason: "Semester must be 1–8" }); continue; }
    try {
      const course = await prisma.course.findUnique({ where: { id: course_id } });
      if (!course) { results.failed.push({ row, reason: `Course not found: ${course_id}` }); continue; }
      const coordinator_id = String(row["Class Coordinator ID"] || "").trim() || null;
      if (coordinator_id) {
        const fac = await prisma.faculty.findUnique({ where: { id: coordinator_id } });
        if (!fac) { results.failed.push({ row, reason: `Faculty not found: ${coordinator_id}` }); continue; }
      }
      const section = await prisma.section.create({
        data: { name, course_id, semester, batch, room_no: String(row["Room No"] || "").trim() || null, class_coordinator_id: coordinator_id },
      });
      results.created.push({ id: section.id, name: section.name });
    } catch (e) { results.failed.push({ row, reason: e.message }); }
  }
  return results;
};

// ══════════════════════════════════════════════════════════════
// BULK ASSIGN SUBJECTS
// ══════════════════════════════════════════════════════════════
export const bulkAssignSubjects = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });

  // Build lookup maps: subject code → id, faculty email → id
  const [allSubjects, allFaculty] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, code: true } }),
    prisma.faculty.findMany({ select: { id: true, user: { select: { email: true } } } }),
  ]);
  const subjectByCode = Object.fromEntries(allSubjects.map((s) => [s.code.toLowerCase().trim(), s.id]));
  const facultyByEmail = Object.fromEntries(allFaculty.map((f) => [f.user?.email?.toLowerCase().trim(), f.id]));

  // Find section by name — build lookup: sheetName → section_id
  const allSections = await prisma.section.findMany({
    select: { id: true, name: true, semester: true, course: { select: { name: true, program: { select: { name: true } } } } },
  });
  // Map each sheet name to a section (match on sheet name = generated template sheet name)
  const usedNames = new Set();
  const safeSheet = (sec) => {
    const prog = sec.course?.program?.name || "";
    const course = sec.course?.name || "";
    const base = `${prog} ${course}–${sec.name} Sem${sec.semester}`.replace(/[\[\]:*?/\\]/g, "").trim().slice(0, 31);
    let n = base;
    if (usedNames.has(n)) { let i = 2; while (usedNames.has(n)) { const s = `(${i++})`; n = base.slice(0, 31 - s.length) + s; } }
    usedNames.add(n); return n;
  };
  const sheetToSectionId = {};
  for (const sec of allSections) sheetToSectionId[safeSheet(sec)] = sec.id;

  const SKIP_SHEETS = new Set(["subjects (reference)", "faculty (reference)", "instructions"]);
  const results = { created: [], updated: [], failed: [], total: 0, sheets_processed: 0 };

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName.toLowerCase())) continue;

    const section_id = sheetToSectionId[sheetName];
    if (!section_id) {
      results.failed.push({ sheet: sheetName, reason: "No matching section found for this sheet name" });
      continue;
    }
    results.sheets_processed++;

    // rows: skip header rows until we find "Subject Code *" column
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });

    // Find data rows — skip info rows, find rows that have Subject Code * header
    let dataRows = rows.filter((row) => {
      const keys = Object.keys(row).map((k) => k.toLowerCase());
      return keys.some((k) => k.includes("subject code"));
    });

    // If no header match, treat all non-empty rows after row 5 as data
    if (!dataRows.length) {
      const allRows = xlsx.utils.sheet_to_json(ws, { defval: "", header: 1 });
      // Find the row index where "Subject Code" appears
      const headerIdx = allRows.findIndex((r) => r.some((c) => String(c).toLowerCase().includes("subject code")));
      if (headerIdx === -1) { results.failed.push({ sheet: sheetName, reason: "Could not find header row with 'Subject Code'" }); continue; }
      const headers = allRows[headerIdx].map((h) => String(h).trim());
      dataRows = allRows.slice(headerIdx + 1)
        .filter((r) => r.some((c) => c !== ""))
        .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
    }

    results.total += dataRows.length;

    for (const row of dataRows) {
      // Support both "Subject Code *" and "Subject Code" column names
      const rawCode = String(row["Subject Code *"] || row["Subject Code"] || "").trim();
      const rawEmail = String(row["Faculty Email"] || row["Faculty Email (optional)"] || "").trim();
      const type = String(row["Type"] || "REGULAR").trim().toUpperCase() || "REGULAR";
      const status = String(row["Status"] || "ACTIVE").trim().toUpperCase() || "ACTIVE";

      if (!rawCode) { results.failed.push({ sheet: sheetName, row: rawCode || "(empty)", reason: "Subject Code is required" }); continue; }

      const subject_id = subjectByCode[rawCode.toLowerCase()];
      if (!subject_id) { results.failed.push({ sheet: sheetName, row: rawCode, reason: `Subject code "${rawCode}" not found` }); continue; }

      let faculty_id = null;
      if (rawEmail) {
        faculty_id = facultyByEmail[rawEmail.toLowerCase()];
        if (!faculty_id) { results.failed.push({ sheet: sheetName, row: rawCode, reason: `Faculty email "${rawEmail}" not found` }); continue; }
      }

      try {
        await assignSubjectToSection(section_id, subject_id, faculty_id, type, status);
        results.created.push({ sheet: sheetName, subject_code: rawCode, faculty_email: rawEmail || null });
      } catch (e) {
        if (e.code === "P2002") {
          // Already exists — update faculty/type/status
          try {
            await prisma.sectionSubject.update({
              where: { section_id_subject_id: { section_id, subject_id } },
              data: { faculty_id: faculty_id || undefined, type, status },
            });
            results.updated.push({ sheet: sheetName, subject_code: rawCode });
          } catch (ue) { results.failed.push({ sheet: sheetName, row: rawCode, reason: ue.message }); }
        } else { results.failed.push({ sheet: sheetName, row: rawCode, reason: e.message }); }
      }
    }
  }

  return results;
};

// ══════════════════════════════════════════════════════════════
// PROMOTE
// ══════════════════════════════════════════════════════════════
const getNextSemester = (sem, academic_year) => {
  if (sem >= 8) return null;
  const next = sem + 1;
  let year = academic_year;
  if (sem % 2 === 0) {
    const [, e] = academic_year.split("-").map(Number);
    year = `${e}-${e + 1}`;
  }
  return { semester: next, academic_year: year };
};

export const promoteSection = async (section_id, remarks) => {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { section_id, is_current: true },
    include: { student: { select: { id: true, name: true, roll_no: true } } },
  });
  const results = { section_id, promoted: [], skipped: [], failed: [], total: enrollments.length };
  for (const enrollment of enrollments) {
    try {
      if (["DETAINED", "PASSED", "LEFT"].includes(enrollment.status)) {
        results.skipped.push({ id: enrollment.student_id, name: enrollment.student?.name, reason: `Already ${enrollment.status.toLowerCase()}` });
        continue;
      }
      const next = getNextSemester(enrollment.semester, enrollment.academic_year);
      if (!next) { results.skipped.push({ id: enrollment.student_id, name: enrollment.student?.name, reason: "Already in final semester" }); continue; }
      await prisma.$transaction(async (tx) => {
        await tx.studentEnrollment.update({ where: { id: enrollment.id }, data: { status: "PROMOTED", is_current: false } });
        await tx.studentEnrollment.create({
          data: {
            student_id: enrollment.student_id,
            section_id: enrollment.section_id,
            course_id: enrollment.course_id,
            program_id: enrollment.program_id,
            dept_id: enrollment.dept_id,
            academic_year: next.academic_year,
            semester: next.semester,
            batch_year: enrollment.batch_year,
            status: "ACTIVE",
            is_current: true,
            remarks: remarks || null,
          },
        });
      });
      results.promoted.push({ id: enrollment.student_id, name: enrollment.student?.name, from: `Sem ${enrollment.semester}`, to: `Sem ${next.semester}` });
    } catch (e) { results.failed.push({ id: enrollment.student_id, name: enrollment.student?.name, reason: e.message }); }
  }
  return results;
};

export const promoteMultipleSections = async (section_ids, remarks) => {
  const allResults = [];
  for (const section_id of section_ids) {
    const section = await prisma.section.findUnique({
      where: { id: section_id },
      select: { id: true, name: true, semester: true, batch: true, course: { select: { name: true } } },
    });
    const result = await promoteSection(section_id, remarks);
    allResults.push({ ...result, section_name: section?.name, course_name: section?.course?.name });
  }
  return allResults;
};

export const setSectionStatus = async (section_id, status, remarks) => {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { section_id, is_current: true },
    include: { student: { select: { id: true, name: true } } },
  });
  const results = { updated: [], failed: [], total: enrollments.length };
  for (const e of enrollments) {
    try {
      await prisma.studentEnrollment.update({ where: { id: e.id }, data: { status, remarks: remarks || null } });
      results.updated.push({ id: e.student_id, name: e.student?.name });
    } catch (err) { results.failed.push({ id: e.student_id, name: e.student?.name, reason: err.message }); }
  }
  return results;
};

export const getSectionStudentCounts = async (section_ids) => {
  return Promise.all(section_ids.map(async (id) => {
    const section = await prisma.section.findUnique({
      where: { id },
      select: { id: true, name: true, semester: true, batch: true, course: { select: { name: true, program: { select: { name: true } } } } },
    });
    const [total, active, detained] = await Promise.all([
      prisma.studentEnrollment.count({ where: { section_id: id, is_current: true } }),
      prisma.studentEnrollment.count({ where: { section_id: id, is_current: true, status: "ACTIVE" } }),
      prisma.studentEnrollment.count({ where: { section_id: id, is_current: true, status: "DETAINED" } }),
    ]);
    return { id, name: section?.name, course: section?.course?.name, program: section?.course?.program?.name, semester: section?.semester, batch: section?.batch, total, active, detained };
  }));
};

export const getSectionTemplate = sectionTemplate;
export const getSectionSubjectTemplate = sectionSubjectTemplate;