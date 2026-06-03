import xlsx  from "xlsx";
import prisma from "../../utils/prisma.js";

// ── Include helper ─────────────────────────────────────────────
const enrollInclude = {
  student: {
    select: {
      id: true, name: true, roll_no: true, enrollment_no: true,
      department: { select: { id: true, name: true } },
    },
  },
  section: { select: { id: true, name: true, semester: true, batch: true } },
};

// ══════════════════════════════════════════════════════════════
// LIST — all enrollments for one student
// ══════════════════════════════════════════════════════════════
export const getStudentEnrollments = async (student_id) => {
  return prisma.studentEnrollment.findMany({
    where:   { student_id },
    include: enrollInclude,
    orderBy: [{ is_current: "desc" }, { enrolled_at: "desc" }],
  });
};

// ══════════════════════════════════════════════════════════════
// LIST ALL — paginated, with filters
// ══════════════════════════════════════════════════════════════
export const getAllEnrollments = async ({
  page = 1, limit = 20, search, section_id, dept_id,
  status, semester, academic_year, is_current,
} = {}) => {
  const where = {
    ...(section_id              && { section_id }),
    ...(dept_id                 && { dept_id }),
    ...(status                  && { status }),
    ...(semester                && { semester: parseInt(semester) }),
    ...(academic_year           && { academic_year }),
    ...(is_current !== undefined && { is_current }),
    ...(search && {
      student: {
        OR: [
          { name:          { contains: search, mode: "insensitive" } },
          { roll_no:       { contains: search, mode: "insensitive" } },
          { enrollment_no: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };
  const [enrollments, total] = await Promise.all([
    prisma.studentEnrollment.findMany({
      where, skip: (page - 1) * limit, take: limit,
      include: enrollInclude,
      orderBy: [{ is_current: "desc" }, { enrolled_at: "desc" }],
    }),
    prisma.studentEnrollment.count({ where }),
  ]);
  return { enrollments, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

// ══════════════════════════════════════════════════════════════
// CREATE — add enrollment for a student
// ══════════════════════════════════════════════════════════════
export const createEnrollment = async (student_id, data) => {
  const student = await prisma.student.findUnique({
    where:  { id: student_id },
    select: { id: true, dept_id: true, course_id: true, program_id: true, section_id: true },
  });
  if (!student) throw Object.assign(new Error("Student not found"), { status: 404 });

  // If marking new one as current, unset previous current
  if (data.is_current) {
    await prisma.studentEnrollment.updateMany({
      where: { student_id, is_current: true },
      data:  { is_current: false },
    });
  }

  return prisma.studentEnrollment.create({
    data: {
      student_id,
      section_id:    data.section_id    || student.section_id,
      dept_id:       data.dept_id       || student.dept_id,
      course_id:     data.course_id     || student.course_id,
      program_id:    data.program_id    || student.program_id,
      academic_year: data.academic_year,
      semester:      parseInt(data.semester),
      batch_year:    parseInt(data.batch_year) || 0,
      status:        data.status        || "ACTIVE",
      is_current:    data.is_current    ?? false,
      remarks:       data.remarks       || null,
      enrolled_at:   data.enrolled_at   ? new Date(data.enrolled_at) : new Date(),
    },
    include: enrollInclude,
  });
};

// ══════════════════════════════════════════════════════════════
// UPDATE — edit an enrollment record
// ══════════════════════════════════════════════════════════════
export const updateEnrollment = async (enrollment_id, data) => {
  const enrollment = await prisma.studentEnrollment.findUnique({ where: { id: enrollment_id } });
  if (!enrollment) throw Object.assign(new Error("Enrollment not found"), { status: 404 });

  // If setting as current, unset others for this student
  if (data.is_current && !enrollment.is_current) {
    await prisma.studentEnrollment.updateMany({
      where: { student_id: enrollment.student_id, is_current: true },
      data:  { is_current: false },
    });
  }

  const updateData = {};
  if (data.section_id    !== undefined) updateData.section_id    = data.section_id;
  if (data.academic_year !== undefined) updateData.academic_year = data.academic_year;
  if (data.semester      !== undefined) updateData.semester      = parseInt(data.semester);
  if (data.batch_year    !== undefined) updateData.batch_year    = parseInt(data.batch_year);
  if (data.status        !== undefined) updateData.status        = data.status;
  if (data.is_current    !== undefined) updateData.is_current    = data.is_current;
  if (data.remarks       !== undefined) updateData.remarks       = data.remarks || null;
  if (data.enrolled_at   !== undefined) updateData.enrolled_at   = new Date(data.enrolled_at);
  if (data.completed_at  !== undefined) updateData.completed_at  = data.completed_at ? new Date(data.completed_at) : null;

  return prisma.studentEnrollment.update({
    where: { id: enrollment_id },
    data:  updateData,
    include: enrollInclude,
  });
};

// ══════════════════════════════════════════════════════════════
// DELETE — remove an enrollment record
// ══════════════════════════════════════════════════════════════
export const deleteEnrollment = async (enrollment_id) => {
  const e = await prisma.studentEnrollment.findUnique({ where: { id: enrollment_id } });
  if (!e) throw Object.assign(new Error("Enrollment not found"), { status: 404 });
  if (e.is_current) throw Object.assign(
    new Error("Cannot delete the current enrollment. Set another as current first or change status."),
    { status: 400 }
  );
  return prisma.studentEnrollment.delete({ where: { id: enrollment_id } });
};

// ══════════════════════════════════════════════════════════════
// SET CURRENT — make an enrollment the active one
// ══════════════════════════════════════════════════════════════
export const setCurrentEnrollment = async (enrollment_id) => {
  const e = await prisma.studentEnrollment.findUnique({ where: { id: enrollment_id } });
  if (!e) throw Object.assign(new Error("Enrollment not found"), { status: 404 });
  await prisma.studentEnrollment.updateMany({
    where: { student_id: e.student_id, is_current: true },
    data:  { is_current: false },
  });
  return prisma.studentEnrollment.update({
    where: { id: enrollment_id },
    data:  { is_current: true },
    include: enrollInclude,
  });
};

// ══════════════════════════════════════════════════════════════
// BULK CREATE — from xlsx upload
// ══════════════════════════════════════════════════════════════
export const bulkCreateEnrollments = async (buffer) => {
  const wb   = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], skipped: [], total: rows.length };

  for (const row of rows) {
    const student_id   = String(row["Student ID*"] || row.student_id || "").trim();
    const academic_year= String(row["Academic Year*"] || row.academic_year || "").trim();
    const semester     = parseInt(row["Semester*"] || row.semester || 0);
    const status       = String(row["Status"] || row.status || "ACTIVE").trim().toUpperCase();
    const is_current   = String(row["Is Current"] || "").trim().toLowerCase() === "true";
    const section_id   = String(row["Section ID"] || "").trim() || null;
    const batch_year   = parseInt(row["Batch Year"] || 0) || 0;
    const remarks      = String(row["Remarks"] || "").trim() || null;

    if (!student_id)    { results.failed.push({ row, reason: "Student ID required" }); continue; }
    if (!academic_year) { results.failed.push({ row, reason: "Academic Year required" }); continue; }
    if (!semester)      { results.failed.push({ row, reason: "Semester required" }); continue; }

    try {
      const student = await prisma.student.findUnique({
        where:  { id: student_id },
        select: { id: true, name: true, roll_no: true, dept_id: true, course_id: true, program_id: true, section_id: true },
      });
      if (!student) { results.failed.push({ row, reason: `Student not found: ${student_id}` }); continue; }

      // Check duplicate
      const dup = await prisma.studentEnrollment.findFirst({
        where: { student_id, academic_year, semester },
      });
      if (dup) { results.skipped.push({ student_id, name: student.name, reason: `Already enrolled for Sem ${semester} ${academic_year}` }); continue; }

      if (is_current) {
        await prisma.studentEnrollment.updateMany({
          where: { student_id, is_current: true },
          data:  { is_current: false },
        });
      }

      const enrollment = await prisma.studentEnrollment.create({
        data: {
          student_id,
          section_id:  section_id || student.section_id,
          dept_id:     student.dept_id,
          course_id:   student.course_id,
          program_id:  student.program_id,
          academic_year, semester, batch_year,
          status, is_current, remarks,
        },
      });
      results.created.push({ id: enrollment.id, student_id, name: student.name });
    } catch (e) { results.failed.push({ row, reason: e.message }); }
  }
  return results;
};

// ══════════════════════════════════════════════════════════════
// BULK UPDATE STATUS — update status for multiple enrollments
// ══════════════════════════════════════════════════════════════
export const bulkUpdateStatus = async (enrollment_ids, status, remarks) => {
  const result = await prisma.studentEnrollment.updateMany({
    where: { id: { in: enrollment_ids } },
    data:  { status, ...(remarks && { remarks }) },
  });
  return { updated: result.count };
};

// ══════════════════════════════════════════════════════════════
// BULK DELETE
// ══════════════════════════════════════════════════════════════
export const bulkDeleteEnrollments = async (enrollment_ids) => {
  // Don't delete current enrollments
  const currents = await prisma.studentEnrollment.findMany({
    where: { id: { in: enrollment_ids }, is_current: true },
    select: { id: true },
  });
  if (currents.length > 0) {
    throw Object.assign(
      new Error(`Cannot delete ${currents.length} current enrollment(s). Change their status first.`),
      { status: 400 }
    );
  }
  const result = await prisma.studentEnrollment.deleteMany({
    where: { id: { in: enrollment_ids } },
  });
  return { deleted: result.count };
};

// ══════════════════════════════════════════════════════════════
// TEMPLATE — xlsx template for bulk upload
// ══════════════════════════════════════════════════════════════
export const generateTemplate = async () => {
  const students = await prisma.student.findMany({
    take: 5,
    select: {
      id: true, name: true, roll_no: true,
      section: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Student ID*", "Student Name (ref)", "Roll No (ref)",
    "Academic Year*", "Semester*", "Batch Year",
    "Status (ACTIVE/DETAINED/PASSED/LEFT/TRANSFERRED/PROMOTED)",
    "Is Current (true/false)", "Section ID", "Remarks",
  ];

  const currentYear = new Date().getFullYear();
  const sampleRows = students.map((s) => [
    s.id, s.name, s.roll_no || "",
    `${currentYear}-${currentYear + 1}`, 1, currentYear,
    "ACTIVE", "false", s.section?.id || "", "",
  ]);

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");

  // Status reference
  const refWs = xlsx.utils.aoa_to_sheet([
    ["Status", "Meaning"],
    ["ACTIVE",      "Currently enrolled and attending"],
    ["DETAINED",    "Not allowed to appear in exams"],
    ["PROMOTED",    "Moved to next semester (historical)"],
    ["PASSED",      "Completed the course/program"],
    ["LEFT",        "Dropped out"],
    ["TRANSFERRED", "Moved to another institution"],
  ]);
  refWs["!cols"] = [{ wch: 16 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(wb, refWs, "Status Reference");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ══════════════════════════════════════════════════════════════
// EXPORT — download all enrollments as xlsx
// ══════════════════════════════════════════════════════════════
export const exportEnrollments = async (filters = {}) => {
  const where = {
    ...(filters.section_id    && { section_id:    filters.section_id }),
    ...(filters.status        && { status:         filters.status }),
    ...(filters.semester      && { semester:        parseInt(filters.semester) }),
    ...(filters.academic_year && { academic_year:  filters.academic_year }),
    ...(filters.is_current !== undefined && { is_current: filters.is_current }),
  };

  const enrollments = await prisma.studentEnrollment.findMany({
    where,
    include: {
      student: {
        select: {
          name: true, roll_no: true, enrollment_no: true,
          department: { select: { name: true } },
          program:    { select: { name: true } },
          course:     { select: { name: true } },
        },
      },
      section: { select: { name: true, batch: true } },
    },
    orderBy: [{ academic_year: "desc" }, { semester: "asc" }, { student: { name: "asc" } }],
  });

  const headers = [
    "Student ID", "Name", "Roll No", "Enrollment No",
    "Department", "Program", "Course",
    "Section", "Semester", "Academic Year", "Batch Year",
    "Status", "Is Current", "Enrolled At", "Completed At", "Remarks",
  ];

  const rows = enrollments.map((e) => [
    e.student_id, e.student?.name || "", e.student?.roll_no || "", e.student?.enrollment_no || "",
    e.student?.department?.name || "", e.student?.program?.name || "", e.student?.course?.name || "",
    e.section?.name || "", e.semester, e.academic_year, e.batch_year,
    e.status, e.is_current ? "Yes" : "No",
    new Date(e.enrolled_at).toLocaleDateString(),
    e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "",
    e.remarks || "",
  ]);

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, ws, "Enrollments");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};
