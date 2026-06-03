// backend/modules/reports/reports.service.js
import ExcelJS from "exceljs";
import prisma from "../../utils/prisma.js";

// ─── Shared helpers ──────────────────────────────────────────────────────────

export const createWorkbook = () => new ExcelJS.Workbook();

export const styleHeaderRow = (row) => {
  row.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border    = { bottom: { style: "thin", color: { argb: "FF000000" } } };
  });
  row.height = 20;
};

// ─── Students by Section ─────────────────────────────────────────────────────

export const buildStudentsBySectionWorkbook = async (section_id) => {
  const students = await prisma.student.findMany({
    where: section_id ? { section_id } : {},
    include: {
      section:    { select: { name: true } },
      department: { select: { name: true } },
      course:     { select: { name: true } },
      program:    { select: { name: true } },
      user:       { select: { email: true, isBlocked: true } },
      enrollments: { where: { is_current: true }, take: 1 },
    },
    orderBy: [{ section: { name: "asc" } }, { name: "asc" }],
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Students by Section");

  ws.columns = [
    { header: "Roll No",       key: "roll_no",       width: 14 },
    { header: "Enrollment No", key: "enrollment_no", width: 18 },
    { header: "Name",          key: "name",          width: 24 },
    { header: "Email",         key: "email",         width: 28 },
    { header: "Department",    key: "dept",          width: 20 },
    { header: "Course",        key: "course",        width: 20 },
    { header: "Program",       key: "program",       width: 20 },
    { header: "Section",       key: "section",       width: 14 },
    { header: "Semester",      key: "semester",      width: 10 },
    { header: "Academic Year", key: "academic_year", width: 16 },
    { header: "Status",        key: "status",        width: 12 },
    { header: "Blocked",       key: "blocked",       width: 10 },
  ];
  styleHeaderRow(ws.getRow(1));

  for (const s of students) {
    const cur = s.enrollments[0];
    ws.addRow({
      roll_no:       s.roll_no        ?? "",
      enrollment_no: s.enrollment_no  ?? "",
      name:          s.name,
      email:         s.user.email,
      dept:          s.department?.name  ?? "",
      course:        s.course?.name      ?? "",
      program:       s.program?.name     ?? "",
      section:       s.section?.name     ?? "",
      semester:      cur?.semester        ?? "",
      academic_year: cur?.academic_year   ?? "",
      status:        cur?.status          ?? "",
      blocked:       s.user.isBlocked ? "Yes" : "No",
    });
  }

  return wb;
};

// ─── Students by Department ──────────────────────────────────────────────────

export const buildStudentsByDeptWorkbook = async (dept_id) => {
  const students = await prisma.student.findMany({
    where: dept_id ? { dept_id } : {},
    include: {
      section:    { select: { name: true } },
      department: { select: { name: true } },
      course:     { select: { name: true } },
      user:       { select: { email: true } },
      enrollments: { where: { is_current: true }, take: 1 },
    },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Students by Department");

  ws.columns = [
    { header: "Roll No",       key: "roll_no",       width: 14 },
    { header: "Name",          key: "name",          width: 24 },
    { header: "Email",         key: "email",         width: 28 },
    { header: "Department",    key: "dept",          width: 20 },
    { header: "Course",        key: "course",        width: 20 },
    { header: "Section",       key: "section",       width: 14 },
    { header: "Semester",      key: "semester",      width: 10 },
    { header: "Academic Year", key: "academic_year", width: 16 },
  ];
  styleHeaderRow(ws.getRow(1));

  for (const s of students) {
    const cur = s.enrollments[0];
    ws.addRow({
      roll_no:       s.roll_no       ?? "",
      name:          s.name,
      email:         s.user.email,
      dept:          s.department?.name ?? "",
      course:        s.course?.name     ?? "",
      section:       s.section?.name    ?? "",
      semester:      cur?.semester       ?? "",
      academic_year: cur?.academic_year  ?? "",
    });
  }

  return wb;
};

// ─── Faculty List ─────────────────────────────────────────────────────────────

export const buildFacultyWorkbook = async () => {
  const faculty = await prisma.faculty.findMany({
    include: {
      department: { select: { name: true } },
      user:       { select: { email: true, isBlocked: true } },
      subjects:   { include: { subject: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Faculty List");

  ws.columns = [
    { header: "Emp ID",       key: "emp_id",       width: 14 },
    { header: "Name",         key: "name",         width: 24 },
    { header: "Email",        key: "email",        width: 28 },
    { header: "Department",   key: "dept",         width: 20 },
    { header: "Designation",  key: "designation",  width: 18 },
    { header: "Phone",        key: "phone",        width: 14 },
    { header: "Gender",       key: "gender",       width: 10 },
    { header: "Joining Date", key: "joining_date", width: 14 },
    { header: "Subjects",     key: "subjects",     width: 40 },
    { header: "Blocked",      key: "blocked",      width: 10 },
  ];
  styleHeaderRow(ws.getRow(1));

  for (const f of faculty) {
    ws.addRow({
      emp_id:       f.emp_id       ?? "",
      name:         f.name,
      email:        f.user.email,
      dept:         f.department?.name  ?? "",
      designation:  f.designation        ?? "",
      phone:        f.phone              ?? "",
      gender:       f.gender             ?? "",
      joining_date: f.joining_date
        ? new Date(f.joining_date).toLocaleDateString()
        : "",
      subjects: f.subjects.map((s) => s.subject.name).join(", "),
      blocked:  f.user.isBlocked ? "Yes" : "No",
    });
  }

  return wb;
};

// ─── Enrollment Summary ───────────────────────────────────────────────────────

export const buildEnrollmentWorkbook = async (academic_year) => {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      is_current: true,
      ...(academic_year && { academic_year }),
    },
    include: {
      student:    { select: { name: true, roll_no: true } },
      section:    { select: { name: true } },
      course:     { select: { name: true } },
      program:    { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: [{ academic_year: "desc" }, { semester: "asc" }],
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Enrollment Summary");

  ws.columns = [
    { header: "Roll No",       key: "roll_no",       width: 14 },
    { header: "Student Name",  key: "name",          width: 24 },
    { header: "Department",    key: "dept",          width: 20 },
    { header: "Course",        key: "course",        width: 18 },
    { header: "Program",       key: "program",       width: 18 },
    { header: "Section",       key: "section",       width: 14 },
    { header: "Semester",      key: "semester",      width: 10 },
    { header: "Academic Year", key: "academic_year", width: 16 },
    { header: "Batch Year",    key: "batch_year",    width: 12 },
    { header: "Status",        key: "status",        width: 12 },
    { header: "Remarks",       key: "remarks",       width: 24 },
  ];
  styleHeaderRow(ws.getRow(1));

  for (const e of enrollments) {
    ws.addRow({
      roll_no:       e.student?.roll_no      ?? "",
      name:          e.student?.name         ?? "",
      dept:          e.department?.name      ?? "",
      course:        e.course?.name          ?? "",
      program:       e.program?.name         ?? "",
      section:       e.section?.name         ?? "",
      semester:      e.semester              ?? "",
      academic_year: e.academic_year         ?? "",
      batch_year:    e.batch_year            ?? "",
      status:        e.status                ?? "",
      remarks:       e.remarks               ?? "",
    });
  }

  return wb;
};

// ─── Feedback Summary ─────────────────────────────────────────────────────────

export const buildFeedbackWorkbook = async (formId) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: formId },
    include: {
      category: true,
      faculty:  { select: { name: true } },
      subject:  { select: { name: true } },
      section:  { select: { name: true } },
      responses: {
        include: {
          answers: { include: { question: true } },
        },
      },
    },
  });

  if (!form) return null;

  const questions = await prisma.feedbackQuestion.findMany({
    where:   { category_id: form.category_id },
    orderBy: { order: "asc" },
  });

  const wb = createWorkbook();
  const ws = wb.addWorksheet("Feedback Summary");

  // Metadata
  ws.addRow(["Form Title", form.title]);
  ws.addRow(["Faculty",    form.faculty?.name  ?? "N/A"]);
  ws.addRow(["Subject",    form.subject?.name  ?? "N/A"]);
  ws.addRow(["Section",    form.section?.name  ?? "N/A"]);
  ws.addRow(["Total Responses", form.responses.length]);
  ws.addRow([]);

  // Header
  const headerRow = ws.addRow(["Response #", ...questions.map((q) => q.question)]);
  styleHeaderRow(headerRow);

  // Responses
  form.responses.forEach((resp, i) => {
    const answerMap = Object.fromEntries(
      resp.answers.map((a) => [a.question_id, a.rating ?? a.answer_text ?? a.selected ?? ""])
    );
    ws.addRow([i + 1, ...questions.map((q) => answerMap[q.id] ?? "")]);
  });

  // Averages row
  ws.addRow([]);
  const avgRow = ["AVERAGES"];
  for (const q of questions) {
    if (q.type === "RATING") {
      const ratings = form.responses
        .flatMap((r) => r.answers)
        .filter((a) => a.question_id === q.id && a.rating != null)
        .map((a) => a.rating);
      avgRow.push(
        ratings.length
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
          : "N/A"
      );
    } else {
      avgRow.push("—");
    }
  }
  const avgExcelRow = ws.addRow(avgRow);
  avgExcelRow.font = { bold: true, italic: true };

  return wb;
};
