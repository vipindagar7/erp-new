// backend/modules/reports/reports.service.js
import ExcelJS from "exceljs";
import prisma from "../../utils/prisma.js";

// ── Helpers ───────────────────────────────────────────────────
const wb = () => new ExcelJS.Workbook();
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "";
const buf = async (workbook) => {
  const b = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(b) ? b : Buffer.from(b);
};
const styleHeader = (row, argb = "FF1E3A5F") => {
  row.eachCell(c => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.border = { bottom: { style: "thin" } };
  });
  row.height = 20;
};
const styleSubHeader = (row) => {
  row.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF7" } }; c.font = { bold: true }; });
};
const addSummarySheet = (wb, title, filters, rows, extraRows = []) => {
  const ws = wb.addWorksheet("Summary");
  ws.addRow([title]);
  ws.addRow(["Generated:", new Date().toLocaleString("en-IN")]);
  ws.addRow(["Total Records:", rows]);
  if (filters && Object.keys(filters).length) {
    ws.addRow(["Filters:"]);
    Object.entries(filters).forEach(([k, v]) => v && ws.addRow([k + ":", v]));
  }
  ws.addRow([]);
  extraRows.forEach(r => ws.addRow(r));
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 30;
  return ws;
};

// ═══════════════════════════════════════════════════════════════
// CATALOG
// ═══════════════════════════════════════════════════════════════
export const REPORT_CATALOG = [
  // Students
  { id: "students_all", label: "All Students", module: "students", desc: "Complete list with all personal, academic, contact, family details" },
  { id: "students_by_section", label: "Students by Section", module: "students", desc: "All students in a specific section" },
  { id: "students_by_dept", label: "Students by Department", module: "students", desc: "All students in a department" },
  { id: "students_by_branch", label: "Students by Branch", module: "students", desc: "All students in a branch" },
  { id: "students_by_program", label: "Students by Program", module: "students", desc: "All students in a program" },
  { id: "students_by_status", label: "Students by Status", module: "students", desc: "Filter by ACTIVE/DETAINED/LEFT/SUSPENDED/PASSED" },
  { id: "students_hosteller", label: "Hostellers", module: "students", desc: "Students staying in hostel" },
  { id: "students_transport", label: "Transport Users", module: "students", desc: "Students using transport" },
  // Faculty
  { id: "faculty_all", label: "All Faculty", module: "faculty", desc: "Complete faculty list with all details" },
  { id: "faculty_by_dept", label: "Faculty by Department", module: "faculty", desc: "All faculty in a department" },
  { id: "faculty_teaching", label: "Teaching Faculty", module: "faculty", desc: "Faculty with is_teaching=true" },
  { id: "faculty_non_teaching", label: "Non-Teaching Staff", module: "faculty", desc: "Faculty with is_teaching=false" },
  { id: "faculty_workload", label: "Faculty Workload", module: "faculty", desc: "Weekly teaching hours per faculty" },
  // Departments
  { id: "departments_all", label: "All Departments", module: "departments", desc: "All departments with program, branch, section, student counts" },
  { id: "dept_detail", label: "Department Detail", module: "departments", desc: "Single department full report" },
  // Programs
  { id: "programs_all", label: "All Programs", module: "programs", desc: "All programs with branch and student counts" },
  { id: "program_detail", label: "Program Detail", module: "programs", desc: "Single program full report" },
  // Branches
  { id: "branches_all", label: "All Branches", module: "branches", desc: "All branches with section and student counts" },
  { id: "branch_detail", label: "Branch Detail", module: "branches", desc: "Single branch with all sections and students" },
  // Sections
  { id: "sections_all", label: "All Sections", module: "sections", desc: "All sections with subject and student counts" },
  { id: "section_detail", label: "Section Detail", module: "sections", desc: "Single section with students and subjects" },
  { id: "section_subjects", label: "Section-Subject Mapping", module: "sections", desc: "Which subjects taught in which section by which faculty" },
  // Enrollments
  { id: "enrollments_current", label: "Current Enrollments", module: "enrollments", desc: "All active current semester enrollments" },
  { id: "enrollments_history", label: "Enrollment History", module: "enrollments", desc: "Full enrollment history with promotions" },
];

// ═══════════════════════════════════════════════════════════════
// STUDENT REPORTS — ALL FIELDS
// ═══════════════════════════════════════════════════════════════
const STUDENT_COLS = [
  { header: "#", key: "idx", width: 5 },
  { header: "Name", key: "name", width: 26 },
  { header: "First Name", key: "first_name", width: 16 },
  { header: "Last Name", key: "last_name", width: 16 },
  { header: "Roll No", key: "roll_no", width: 14 },
  { header: "University Roll No", key: "univ_roll", width: 20 },
  { header: "Enrollment No", key: "enrollment_no", width: 20 },
  { header: "Email (Login)", key: "email", width: 30 },
  { header: "Personal Email", key: "personal_email", width: 30 },
  { header: "Phone", key: "phone", width: 14 },
  { header: "Alt Contact", key: "alt_contact", width: 14 },
  { header: "Department", key: "dept", width: 24 },
  { header: "Program", key: "program", width: 22 },
  { header: "Branch", key: "branch", width: 24 },
  { header: "Section", key: "section", width: 14 },
  { header: "Semester", key: "semester", width: 10 },
  { header: "Academic Year", key: "ay", width: 14 },
  { header: "Batch", key: "batch", width: 14 },
  { header: "Batch Year", key: "batch_year", width: 12 },
  { header: "Status", key: "status", width: 12 },
  { header: "Gender", key: "gender", width: 10 },
  { header: "DOB", key: "dob", width: 14 },
  { header: "Category", key: "category", width: 12 },
  { header: "Religion", key: "religion", width: 14 },
  { header: "Blood Group", key: "blood_group", width: 12 },
  { header: "Aadhar No", key: "aadhar_no", width: 16 },
  { header: "PAN No", key: "pan_no", width: 14 },
  { header: "Group No", key: "group_no", width: 10 },
  { header: "Father Name", key: "father", width: 22 },
  { header: "Father Phone", key: "father_phone", width: 14 },
  { header: "Father Occupation", key: "father_occ", width: 18 },
  { header: "Father Aadhar", key: "father_aadhar", width: 16 },
  { header: "Mother Name", key: "mother", width: 22 },
  { header: "Mother Phone", key: "mother_phone", width: 14 },
  { header: "Mother Occupation", key: "mother_occ", width: 18 },
  { header: "Mother Aadhar", key: "mother_aadhar", width: 16 },
  { header: "Address", key: "address", width: 30 },
  { header: "City", key: "city", width: 16 },
  { header: "State", key: "state", width: 16 },
  { header: "Pincode", key: "pincode", width: 10 },
  { header: "Emergency Contact", key: "emer_contact", width: 22 },
  { header: "Emergency Phone", key: "emer_phone", width: 14 },
  { header: "Emergency Relation", key: "emer_relation", width: 16 },
  { header: "Mode of Admission", key: "mode_admission", width: 18 },
  { header: "Admission Year", key: "adm_year", width: 14 },
  { header: "Admission Date", key: "adm_date", width: 14 },
  { header: "Lateral Entry", key: "lateral", width: 12 },
  { header: "Is Hosteller", key: "hosteller", width: 12 },
  { header: "Is Transport", key: "transport", width: 12 },
  { header: "Biometric ID", key: "biometric_id", width: 14 },
  { header: "10th %", key: "tenth_pct", width: 10 },
  { header: "12th %", key: "twelfth_pct", width: 10 },
  { header: "Is Alumni", key: "is_alumni", width: 10 },
  { header: "Login Blocked", key: "blocked", width: 13 },
];

const mapStudent = (s, i) => {
  const sec = s.section;
  return {
    idx: i + 1,
    name: s.name || "",
    first_name: s.first_name || "",
    last_name: s.last_name || "",
    roll_no: s.roll_no || "",
    univ_roll: s.university_roll_no || "",
    enrollment_no: s.enrollment_no || "",
    email: s.user?.email || "",
    personal_email: s.personal_email || "",
    phone: s.phone || "",
    alt_contact: s.alt_contact_number || "",
    dept: s.department?.name || sec?.branch?.program?.department?.name || "",
    program: s.program?.name || sec?.branch?.program?.name || "",
    branch: s.branch?.name || sec?.branch?.name || "",
    section: sec?.name || "",
    semester: sec?.semester || "",
    ay: sec?.academic_year || "",
    batch: sec?.batch || "",
    batch_year: s.batch_year || "",
    status: s.status || "",
    gender: s.gender || "",
    dob: fmt(s.dob),
    category: s.category || "",
    religion: s.religion || "",
    blood_group: s.blood_group || "",
    aadhar_no: s.aadhar_no || "",
    pan_no: s.pan_no || "",
    group_no: s.group_no || "",
    father: s.father_name || "",
    father_phone: s.father_phone || "",
    father_occ: s.father_occupation || "",
    father_aadhar: s.father_aadhar || "",
    mother: s.mother_name || "",
    mother_phone: s.mother_phone || "",
    mother_occ: s.mother_occupation || "",
    mother_aadhar: s.mother_aadhar || "",
    address: s.address || "",
    city: s.city || "",
    state: s.state || "",
    pincode: s.pincode || "",
    emer_contact: s.emergency_contact || "",
    emer_phone: s.emergency_phone || "",
    emer_relation: s.emergency_relation || "",
    mode_admission: s.mode_of_admission || "",
    adm_year: s.admission_year || "",
    adm_date: s.admission_date || "",
    lateral: s.lateral_entry ? "Yes" : "No",
    hosteller: s.is_hosteller ? "Yes" : "No",
    transport: s.is_using_transport ? "Yes" : "No",
    biometric_id: s.biometric_id || "",
    tenth_pct: s.tenth_percentage || "",
    twelfth_pct: s.twelfth_percentage || "",
    is_alumni: s.is_alumni ? "Yes" : "No",
    blocked: s.user?.isBlocked ? "Yes" : "No",
  };
};

const STATUS_COLORS = { ACTIVE: "FF92D050", DETAINED: "FFFFC000", LEFT: "FFFF0000", SUSPENDED: "FFFF0000", PASSED: "FF00B0F0" };

const buildStudentSheet = (wb, students, sheetName = "Students") => {
  const ws = wb.addWorksheet(sheetName);
  ws.columns = STUDENT_COLS;
  styleHeader(ws.getRow(1));
  students.forEach((s, i) => ws.addRow(mapStudent(s, i)));
  ws.getColumn("status").eachCell((cell, row) => {
    if (row > 1) {
      const argb = STATUS_COLORS[cell.value];
      if (argb) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    }
  });
  return ws;
};

const studentInclude = {
  user: { select: { email: true, isBlocked: true } },
  department: { select: { name: true } },
  program: { select: { name: true } },
  branch: { select: { name: true } },
  section: {
    select: {
      name: true, semester: true, academic_year: true, batch: true, batch_year: true,
      branch: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } }
    }
  },
};

const fetchStudents = async (where) => prisma.student.findMany({
  where: { deleted_at: null, ...where },
  include: studentInclude,
  orderBy: [{ section: { name: "asc" } }, { name: "asc" }],
});

export const buildStudentsAllReport = async (filters = {}) => {
  const where = {};
  if (filters.dept_id) where.dept_id = filters.dept_id;
  if (filters.program_id) where.program_id = filters.program_id;
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.section_id) where.section_id = filters.section_id;
  if (filters.status) where.status = filters.status;
  if (filters.batch_year) where.batch_year = parseInt(filters.batch_year);
  if (filters.is_hosteller === "true") where.is_hosteller = true;
  if (filters.is_using_transport === "true") where.is_using_transport = true;

  const students = await fetchStudents(where);
  const workbook = wb();
  buildStudentSheet(workbook, students);

  const byStatus = {};
  const byBranch = {};
  students.forEach(s => {
    byStatus[s.status || "UNKNOWN"] = (byStatus[s.status || "UNKNOWN"] || 0) + 1;
    const b = s.branch?.name || "Unknown";
    byBranch[b] = (byBranch[b] || 0) + 1;
  });
  const sum = workbook.addWorksheet("Summary");
  sum.addRow(["Report: Students"]);
  sum.addRow(["Generated:", new Date().toLocaleString("en-IN")]);
  sum.addRow(["Total:", students.length]);
  if (filters.dept_id) sum.addRow(["Department Filter:", filters.dept_id]);
  if (filters.section_id) sum.addRow(["Section Filter:", filters.section_id]);
  sum.addRow([]);
  sum.addRow(["BY STATUS", "Count"]); styleSubHeader(sum.getRow(sum.rowCount));
  Object.entries(byStatus).forEach(([k, v]) => sum.addRow([k, v]));
  sum.addRow([]);
  sum.addRow(["BY BRANCH", "Count"]); styleSubHeader(sum.getRow(sum.rowCount));
  Object.entries(byBranch).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => sum.addRow([k, v]));
  return buf(workbook);
};

export const buildStudentsBySectionReport = async (f) => buildStudentsAllReport({ ...f, section_id: f.section_id || f.id });
export const buildStudentsByDeptReport = async (f) => buildStudentsAllReport({ ...f, dept_id: f.dept_id || f.id });
export const buildStudentsByBranchReport = async (f) => buildStudentsAllReport({ ...f, branch_id: f.branch_id || f.id });
export const buildStudentsByProgramReport = async (f) => buildStudentsAllReport({ ...f, program_id: f.program_id || f.id });
export const buildStudentsByStatusReport = async (f) => buildStudentsAllReport(f);
export const buildStudentsHostellerReport = async (f) => buildStudentsAllReport({ ...f, is_hosteller: "true" });
export const buildStudentsTransportReport = async (f) => buildStudentsAllReport({ ...f, is_using_transport: "true" });

// ═══════════════════════════════════════════════════════════════
// FACULTY REPORTS — ALL FIELDS
// ═══════════════════════════════════════════════════════════════
const FACULTY_COLS = [
  { header: "#", key: "idx", width: 5 },
  { header: "Name", key: "name", width: 26 },
  { header: "Emp ID", key: "emp_id", width: 14 },
  { header: "Email (Login)", key: "email", width: 30 },
  { header: "Phone", key: "phone", width: 14 },
  { header: "Personal Email", key: "personal_email", width: 28 },
  { header: "Department", key: "dept", width: 24 },
  { header: "Designation", key: "desig", width: 22 },
  { header: "Employee Type", key: "emp_type", width: 16 },
  { header: "Is Teaching", key: "teaching", width: 12 },
  { header: "Status", key: "status", width: 12 },
  { header: "Joining Date", key: "joining", width: 14 },
  { header: "Experience (Yrs)", key: "exp", width: 16 },
  { header: "Qualification", key: "qual", width: 18 },
  { header: "Specialization", key: "spec", width: 22 },
  { header: "Gender", key: "gender", width: 10 },
  { header: "DOB", key: "dob", width: 14 },
  { header: "Category", key: "category", width: 12 },
  { header: "Religion", key: "religion", width: 12 },
  { header: "Blood Group", key: "blood", width: 12 },
  { header: "Aadhar No", key: "aadhar", width: 16 },
  { header: "PAN No", key: "pan", width: 14 },
  { header: "Salary Grade", key: "grade", width: 14 },
  { header: "PF Number", key: "pf", width: 14 },
  { header: "ESI Number", key: "esi", width: 14 },
  { header: "Bank Name", key: "bank", width: 16 },
  { header: "Bank IFSC", key: "ifsc", width: 14 },
  { header: "Employee Code", key: "emp_code", width: 14 },
  { header: "Emergency Contact", key: "emer", width: 22 },
  { header: "Emergency Phone", key: "emer_phone", width: 14 },
  { header: "Emergency Relation", key: "emer_rel", width: 16 },
  { header: "Subjects", key: "subjects", width: 40 },
  { header: "Sections Teaching", key: "sections", width: 30 },
  { header: "Login Blocked", key: "blocked", width: 13 },
];

const mapFaculty = (f, i) => ({
  idx: i + 1,
  name: f.name || "",
  emp_id: f.emp_id || "",
  email: f.user?.email || "",
  phone: f.phone || "",
  personal_email: f.personal_email || "",
  dept: f.department?.name || "",
  desig: f.designation || "",
  emp_type: f.employee_type || "",
  teaching: f.is_teaching === false ? "No" : "Yes",
  status: f.status || "",
  joining: fmt(f.joining_date),
  exp: f.experience_years != null ? `${f.experience_years} yrs` : "",
  qual: f.qualification || "",
  spec: f.specialization || "",
  gender: f.gender || "",
  dob: fmt(f.dob),
  category: f.category || "",
  religion: f.religion || "",
  blood: f.blood_group || "",
  aadhar: f.aadhar_no || "",
  pan: f.pan_no || "",
  grade: f.salary_grade || "",
  pf: f.pf_number || "",
  esi: f.esi_number || "",
  bank: f.bank_name || "",
  ifsc: f.bank_ifsc || "",
  emp_code: f.employee_code || "",
  emer: f.emergency_contact || "",
  emer_phone: f.emergency_phone || "",
  emer_rel: f.emergency_relation || "",
  subjects: (f.subjects || []).map(fs => `${fs.subject?.code} - ${fs.subject?.name}`).join(", "),
  sections: (f.sectionSubjects || []).map(ss => `${ss.section?.name} (S${ss.section?.semester})`).join(", "),
  blocked: f.user?.isBlocked ? "Yes" : "No",
});

const facultyInclude = {
  user: { select: { email: true, isBlocked: true } },
  department: { select: { name: true } },
  subjects: { include: { subject: { select: { name: true, code: true } } } },
  sectionSubjects: { where: { status: "ACTIVE" }, include: { section: { select: { name: true, semester: true } } } },
};

const fetchFaculty = async (where) => prisma.faculty.findMany({
  where: { deleted_at: null, ...where },
  include: facultyInclude,
  orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
});

export const buildFacultyAllReport = async (filters = {}) => {
  const where = {};
  if (filters.dept_id) where.dept_id = filters.dept_id;
  if (filters.status) where.status = filters.status;
  if (filters.employee_type) where.employee_type = filters.employee_type;
  if (filters.is_teaching === "true") where.is_teaching = true;
  if (filters.is_teaching === "false") where.is_teaching = false;

  const faculty = await fetchFaculty(where);
  const workbook = wb();
  const ws = workbook.addWorksheet("Faculty");
  ws.columns = FACULTY_COLS;
  styleHeader(ws.getRow(1));
  faculty.forEach((f, i) => ws.addRow(mapFaculty(f, i)));

  // Summary
  const byDept = {};
  const byDesig = {};
  const byType = {};
  faculty.forEach(f => {
    const d = f.department?.name || "Unknown";
    byDept[d] = (byDept[d] || 0) + 1;
    const des = f.designation || "Unknown";
    byDesig[des] = (byDesig[des] || 0) + 1;
    const t = f.employee_type || "Unknown";
    byType[t] = (byType[t] || 0) + 1;
  });
  const sum = workbook.addWorksheet("Summary");
  sum.addRow(["Report: Faculty"]);
  sum.addRow(["Generated:", new Date().toLocaleString("en-IN")]);
  sum.addRow(["Total:", faculty.length]);
  sum.addRow(["Teaching:", faculty.filter(f => f.is_teaching !== false).length]);
  sum.addRow(["Non-Teaching:", faculty.filter(f => f.is_teaching === false).length]);
  sum.addRow([]);
  sum.addRow(["BY DEPARTMENT", "Count"]); styleSubHeader(sum.getRow(sum.rowCount));
  Object.entries(byDept).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => sum.addRow([k, v]));
  sum.addRow([]);
  sum.addRow(["BY DESIGNATION", "Count"]); styleSubHeader(sum.getRow(sum.rowCount));
  Object.entries(byDesig).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => sum.addRow([k, v]));
  sum.addRow([]);
  sum.addRow(["BY TYPE", "Count"]); styleSubHeader(sum.getRow(sum.rowCount));
  Object.entries(byType).forEach(([k, v]) => sum.addRow([k, v]));
  return buf(workbook);
};

export const buildFacultyByDeptReport = async (f) => buildFacultyAllReport({ ...f, dept_id: f.dept_id || f.id });
export const buildFacultyTeachingReport = async (f) => buildFacultyAllReport({ ...f, is_teaching: "true" });
export const buildFacultyNonTeachingReport = async (f) => buildFacultyAllReport({ ...f, is_teaching: "false" });

export const buildFacultyWorkloadReport = async ({ session_id }) => {
  const workloads = prisma.facultyWorkload
    ? await prisma.facultyWorkload.findMany({
      where: session_id ? { session_id } : {},
      include: { faculty: { select: { name: true, emp_id: true, department: { select: { name: true } } } }, subject: { select: { name: true, code: true } }, section: { select: { name: true, semester: true } } },
      orderBy: [{ faculty: { name: "asc" } }],
    }).catch(() => [])
    : [];
  const workbook = wb();
  const ws = workbook.addWorksheet("Workload");
  ws.columns = [
    { header: "Faculty", key: "faculty", width: 24 },
    { header: "Emp ID", key: "emp_id", width: 12 },
    { header: "Department", key: "dept", width: 22 },
    { header: "Subject", key: "subject", width: 26 },
    { header: "Code", key: "code", width: 12 },
    { header: "Section", key: "section", width: 14 },
    { header: "Semester", key: "sem", width: 10 },
    { header: "Type", key: "type", width: 12 },
    { header: "Hrs/Week", key: "hours", width: 10 },
  ];
  styleHeader(ws.getRow(1));
  workloads.forEach(w => ws.addRow({ faculty: w.faculty?.name || "", emp_id: w.faculty?.emp_id || "", dept: w.faculty?.department?.name || "", subject: w.subject?.name || "", code: w.subject?.code || "", section: w.section?.name || "", sem: w.section?.semester || "", type: w.entry_type || "LECTURE", hours: w.weekly_hours || 0 }));
  return buf(workbook);
};

// ═══════════════════════════════════════════════════════════════
// DEPARTMENT REPORT
// ═══════════════════════════════════════════════════════════════
export const buildDepartmentsReport = async (filters = {}) => {
  const where = {};
  if (filters.id || filters.dept_id) where.id = filters.id || filters.dept_id;

  const depts = await prisma.department.findMany({
    where: { deleted_at: null, ...where },
    include: {
      programs: {
        include: {
          branches: {
            include: {
              sections: { where: { deleted_at: null }, include: { _count: { select: { students: true } } } },
              _count: { select: { sections: true } },
            },
          },
          _count: { select: { branches: true } },
        },
      },
      faculty: { where: { deleted_at: null }, select: { id: true } },
      students: { where: { deleted_at: null }, select: { id: true, status: true } },
    },
    orderBy: { name: "asc" },
  }).catch(() => []);

  const workbook = wb();
  // Sheet 1: Dept overview
  const ws = workbook.addWorksheet("Departments");
  ws.columns = [
    { header: "Department", key: "name", width: 30 },
    { header: "Code", key: "code", width: 12 },
    { header: "Programs", key: "programs", width: 12 },
    { header: "Branches", key: "branches", width: 12 },
    { header: "Sections", key: "sections", width: 12 },
    { header: "Total Students", key: "students", width: 16 },
    { header: "Active Students", key: "active", width: 16 },
    { header: "Faculty", key: "faculty", width: 12 },
  ];
  styleHeader(ws.getRow(1));
  depts.forEach(d => {
    const allSections = d.programs.flatMap(p => p.branches.flatMap(b => b.sections));
    ws.addRow({
      name: d.name,
      code: d.code || "",
      programs: d.programs.length,
      branches: d.programs.reduce((s, p) => s + p.branches.length, 0),
      sections: allSections.length,
      students: d.students.length,
      active: d.students.filter(s => s.status === "ACTIVE").length,
      faculty: d.faculty.length,
    });
  });

  // Sheet 2: Programs under dept
  const wsP = workbook.addWorksheet("Programs");
  wsP.columns = [
    { header: "Department", key: "dept", width: 26 },
    { header: "Program", key: "prog", width: 26 },
    { header: "Code", key: "code", width: 12 },
    { header: "Branches", key: "branches", width: 12 },
    { header: "Sections", key: "sections", width: 12 },
    { header: "Students", key: "students", width: 12 },
  ];
  styleHeader(wsP.getRow(1));
  depts.forEach(d => d.programs.forEach(p => {
    wsP.addRow({ dept: d.name, prog: p.name, code: p.code || "", branches: p.branches.length, sections: p.branches.reduce((s, b) => s + b.sections.length, 0), students: p.branches.reduce((s, b) => s + b.sections.reduce((ss, sec) => ss + (sec._count?.students || 0), 0), 0) });
  }));

  addSummarySheet(workbook, "Departments Report", {}, depts.length, [
    ["Total Departments:", depts.length],
    ["Total Programs:", depts.reduce((s, d) => s + d.programs.length, 0)],
    ["Total Students:", depts.reduce((s, d) => s + d.students.length, 0)],
    ["Total Faculty:", depts.reduce((s, d) => s + d.faculty.length, 0)],
  ]);
  return buf(workbook);
};

// ═══════════════════════════════════════════════════════════════
// PROGRAM REPORT
// ═══════════════════════════════════════════════════════════════
export const buildProgramsReport = async (filters = {}) => {
  const where = {};
  if (filters.id || filters.program_id) where.id = filters.id || filters.program_id;
  if (filters.dept_id) where.dept_id = filters.dept_id;

  const programs = await prisma.program.findMany({
    where: { deleted_at: null, ...where },
    include: {
      department: { select: { name: true } },
      branches: {
        include: {
          sections: { where: { deleted_at: null }, include: { _count: { select: { students: true } } } },
        },
      },
    },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  }).catch(() => []);

  const workbook = wb();
  const ws = workbook.addWorksheet("Programs");
  ws.columns = [
    { header: "Department", key: "dept", width: 26 },
    { header: "Program", key: "name", width: 28 },
    { header: "Code", key: "code", width: 12 },
    { header: "Duration", key: "duration", width: 12 },
    { header: "Branches", key: "branches", width: 12 },
    { header: "Sections", key: "sections", width: 12 },
    { header: "Students", key: "students", width: 12 },
  ];
  styleHeader(ws.getRow(1));
  programs.forEach(p => {
    ws.addRow({
      dept: p.department?.name || "",
      name: p.name,
      code: p.code || "",
      duration: p.duration_years ? `${p.duration_years} yr` : "",
      branches: p.branches.length,
      sections: p.branches.reduce((s, b) => s + b.sections.length, 0),
      students: p.branches.reduce((s, b) => s + b.sections.reduce((ss, sec) => ss + (sec._count?.students || 0), 0), 0),
    });
  });

  // Branch breakdown sheet
  const wsB = workbook.addWorksheet("Branches");
  wsB.columns = [
    { header: "Department", key: "dept", width: 24 },
    { header: "Program", key: "prog", width: 24 },
    { header: "Branch", key: "name", width: 26 },
    { header: "Code", key: "code", width: 12 },
    { header: "Sections", key: "secs", width: 10 },
    { header: "Students", key: "stds", width: 10 },
  ];
  styleHeader(wsB.getRow(1));
  programs.forEach(p => p.branches.forEach(b => {
    wsB.addRow({ dept: p.department?.name || "", prog: p.name, name: b.name, code: b.code || "", secs: b.sections.length, stds: b.sections.reduce((s, sec) => s + (sec._count?.students || 0), 0) });
  }));

  addSummarySheet(workbook, "Programs Report", {}, programs.length);
  return buf(workbook);
};

// ═══════════════════════════════════════════════════════════════
// BRANCH REPORT
// ═══════════════════════════════════════════════════════════════
export const buildBranchesReport = async (filters = {}) => {
  const where = {};
  if (filters.id || filters.branch_id) where.id = filters.id || filters.branch_id;
  if (filters.program_id) where.program_id = filters.program_id;
  if (filters.dept_id) where.program = { dept_id: filters.dept_id };

  const branches = await prisma.branch.findMany({
    where: { deleted_at: null, ...where },
    include: {
      program: { include: { department: { select: { name: true } } } },
      sections: {
        where: { deleted_at: null },
        include: {
          _count: { select: { students: true, sectionSubjects: true } },
          class_coordinator: { select: { name: true, emp_id: true } },
        },
        orderBy: [{ semester: "asc" }, { name: "asc" }],
      },
    },
    orderBy: [{ program: { name: "asc" } }, { name: "asc" }],
  }).catch(() => []);

  const workbook = wb();
  const ws = workbook.addWorksheet("Branches");
  ws.columns = [
    { header: "Department", key: "dept", width: 26 },
    { header: "Program", key: "prog", width: 24 },
    { header: "Branch", key: "name", width: 26 },
    { header: "Code", key: "code", width: 12 },
    { header: "Sections", key: "sections", width: 10 },
    { header: "Students", key: "students", width: 10 },
  ];
  styleHeader(ws.getRow(1));
  branches.forEach(b => {
    ws.addRow({ dept: b.program?.department?.name || "", prog: b.program?.name || "", name: b.name, code: b.code || "", sections: b.sections.length, students: b.sections.reduce((s, sec) => s + (sec._count?.students || 0), 0) });
  });

  // Section detail per branch
  const wsS = workbook.addWorksheet("Sections");
  wsS.columns = [
    { header: "Branch", key: "branch", width: 24 },
    { header: "Section", key: "name", width: 16 },
    { header: "Code", key: "code", width: 16 },
    { header: "Semester", key: "sem", width: 10 },
    { header: "Batch", key: "batch", width: 14 },
    { header: "Acad Year", key: "ay", width: 14 },
    { header: "Students", key: "students", width: 10 },
    { header: "Subjects", key: "subjects", width: 10 },
    { header: "Status", key: "status", width: 12 },
    { header: "Coordinator", key: "coord", width: 22 },
  ];
  styleHeader(wsS.getRow(1));
  branches.forEach(b => b.sections.forEach(s => {
    wsS.addRow({ branch: b.name, name: s.name, code: s.code || "", sem: s.semester, batch: s.batch || "", ay: s.academic_year || "", students: s._count?.students || 0, subjects: s._count?.sectionSubjects || 0, status: s.status, coord: s.class_coordinator?.name || "" });
  }));

  addSummarySheet(workbook, "Branches Report", {}, branches.length);
  return buf(workbook);
};

// ═══════════════════════════════════════════════════════════════
// SECTION REPORT — full detail
// ═══════════════════════════════════════════════════════════════
export const buildSectionsReport = async (filters = {}) => {
  const where = { deleted_at: null };
  if (filters.id || filters.section_id) where.id = filters.id || filters.section_id;
  if (filters.dept_id) where.branch = { program: { dept_id: filters.dept_id } };
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.program_id) where.branch = { program_id: filters.program_id };
  if (filters.semester) where.semester = parseInt(filters.semester);
  if (filters.status) where.status = filters.status;

  const sections = await prisma.section.findMany({
    where,
    include: {
      branch: { include: { program: { include: { department: { select: { name: true } } } } } },
      class_coordinator: { select: { name: true, emp_id: true, designation: true } },
      sectionSubjects: {
        where: { status: "ACTIVE" },
        include: { subject: { select: { name: true, code: true, category: true } }, faculty: { select: { name: true, emp_id: true } } },
        orderBy: { subject: { name: "asc" } },
      },
      _count: { select: { students: true } },
    },
    orderBy: [{ branch: { name: "asc" } }, { semester: "asc" }, { name: "asc" }],
  }).catch(() => []);

  const workbook = wb();

  // Sheet 1: Section overview
  const ws = workbook.addWorksheet("Sections");
  ws.columns = [
    { header: "Department", key: "dept", width: 24 },
    { header: "Program", key: "prog", width: 22 },
    { header: "Branch", key: "branch", width: 22 },
    { header: "Section", key: "name", width: 14 },
    { header: "Code", key: "code", width: 16 },
    { header: "Semester", key: "sem", width: 10 },
    { header: "Batch", key: "batch", width: 14 },
    { header: "Acad Year", key: "ay", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Capacity", key: "cap", width: 10 },
    { header: "Students", key: "students", width: 10 },
    { header: "Subjects", key: "subjects", width: 10 },
    { header: "Room", key: "room", width: 12 },
    { header: "Coordinator", key: "coord", width: 24 },
  ];
  styleHeader(ws.getRow(1));
  sections.forEach(s => ws.addRow({
    dept: s.branch?.program?.department?.name || "", prog: s.branch?.program?.name || "", branch: s.branch?.name || "",
    name: s.name, code: s.code || "", sem: s.semester, batch: s.batch || "", ay: s.academic_year || "",
    status: s.status, cap: s.capacity || "", students: s._count?.students || 0, subjects: s.sectionSubjects?.length || 0,
    room: s.room_no || "", coord: s.class_coordinator?.name || "",
  }));

  // Sheet 2: Subject mapping
  const wsSubj = workbook.addWorksheet("Subject Mapping");
  wsSubj.columns = [
    { header: "Section", key: "section", width: 14 },
    { header: "Branch", key: "branch", width: 22 },
    { header: "Semester", key: "sem", width: 10 },
    { header: "Subject", key: "subject", width: 28 },
    { header: "Code", key: "code", width: 12 },
    { header: "Category", key: "cat", width: 14 },
    { header: "Type", key: "type", width: 12 },
    { header: "Faculty", key: "faculty", width: 24 },
    { header: "Faculty Emp ID", key: "emp_id", width: 12 },
  ];
  styleHeader(wsSubj.getRow(1));
  sections.forEach(s => (s.sectionSubjects || []).forEach(ss => {
    wsSubj.addRow({ section: s.name, branch: s.branch?.name || "", sem: s.semester, subject: ss.subject?.name || "", code: ss.subject?.code || "", cat: ss.subject?.category || "", type: ss.type || "", faculty: ss.faculty?.name || "", emp_id: ss.faculty?.emp_id || "" });
  }));

  // Sheet 3: Per-section student list (if single section or small result)
  if (sections.length === 1 || (filters.section_id && sections.length > 0)) {
    const sec = sections[0];
    const students = await fetchStudents({ section_id: sec.id });
    buildStudentSheet(workbook, students, `Students - ${sec.name}`);
  }

  addSummarySheet(workbook, "Sections Report", filters, sections.length);
  return buf(workbook);
};

// ── Section-subject mapping only ──────────────────────────────
export const buildSectionSubjectReport = async (filters = {}) => buildSectionsReport(filters);

// ═══════════════════════════════════════════════════════════════
// ENROLLMENT REPORT
// ═══════════════════════════════════════════════════════════════
export const buildEnrollmentReport = async ({ session_id, is_current } = {}) => {
  const where = {};
  if (session_id) where.session_id = session_id;
  if (is_current !== undefined) where.is_current = is_current === "true" || is_current === true;

  const enrollments = await prisma.studentEnrollment.findMany({
    where,
    include: {
      student: { select: { name: true, roll_no: true, enrollment_no: true } },
      section: { select: { name: true, semester: true } },
      program: { select: { name: true } },
      department: { select: { name: true } },
      session: { select: { name: true } },
    },
    orderBy: [{ student: { name: "asc" } }],
  }).catch(() => []);

  const workbook = wb();
  const ws = workbook.addWorksheet("Enrollments");
  ws.columns = [
    { header: "Student", key: "student", width: 24 },
    { header: "Roll No", key: "roll_no", width: 14 },
    { header: "Enrollment No", key: "enr_no", width: 18 },
    { header: "Session", key: "session", width: 16 },
    { header: "Academic Year", key: "ay", width: 14 },
    { header: "Semester", key: "sem", width: 10 },
    { header: "Section", key: "section", width: 14 },
    { header: "Department", key: "dept", width: 22 },
    { header: "Program", key: "program", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Is Current", key: "current", width: 12 },
    { header: "Enrolled At", key: "enrolled", width: 16 },
  ];
  styleHeader(ws.getRow(1));
  enrollments.forEach(e => ws.addRow({ student: e.student?.name || "", roll_no: e.student?.roll_no || "", enr_no: e.student?.enrollment_no || "", session: e.session?.name || "", ay: e.academic_year || "", sem: e.semester, section: e.section?.name || "", dept: e.department?.name || "", program: e.program?.name || "", status: e.status, current: e.is_current ? "Yes" : "No", enrolled: fmt(e.enrolled_at) }));
  addSummarySheet(workbook, "Enrollments Report", {}, enrollments.length);
  return buf(workbook);
};

// ═══════════════════════════════════════════════════════════════
// DISPATCHER
// ═══════════════════════════════════════════════════════════════
export const generateReport = async (report_id, filters = {}) => {
  switch (report_id) {
    case "students_all": return buildStudentsAllReport(filters);
    case "students_by_section": return buildStudentsBySectionReport(filters);
    case "students_by_dept": return buildStudentsByDeptReport(filters);
    case "students_by_branch": return buildStudentsByBranchReport(filters);
    case "students_by_program": return buildStudentsByProgramReport(filters);
    case "students_by_status": return buildStudentsByStatusReport(filters);
    case "students_hosteller": return buildStudentsHostellerReport(filters);
    case "students_transport": return buildStudentsTransportReport(filters);
    case "faculty_all": return buildFacultyAllReport(filters);
    case "faculty_by_dept": return buildFacultyByDeptReport(filters);
    case "faculty_teaching": return buildFacultyTeachingReport(filters);
    case "faculty_non_teaching": return buildFacultyNonTeachingReport(filters);
    case "faculty_workload": return buildFacultyWorkloadReport(filters);
    case "departments_all": return buildDepartmentsReport(filters);
    case "dept_detail": return buildDepartmentsReport(filters);
    case "programs_all": return buildProgramsReport(filters);
    case "program_detail": return buildProgramsReport(filters);
    case "branches_all": return buildBranchesReport(filters);
    case "branch_detail": return buildBranchesReport(filters);
    case "sections_all": return buildSectionsReport(filters);
    case "section_detail": return buildSectionsReport(filters);
    case "section_subjects": return buildSectionSubjectReport(filters);
    case "enrollments_current": return buildEnrollmentReport({ ...filters, is_current: true });
    case "enrollments_history": return buildEnrollmentReport(filters);
    default: throw Object.assign(new Error(`Unknown report: ${report_id}`), { status: 400 });
  }
};