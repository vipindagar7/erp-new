// backend/modules/faculty/faculty.service.js
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";
import { saveFile, deleteFile, validateImage } from "../../utils/fileStorage.js";
import { safeEncrypt, safeDecrypt } from "../../utils/encryption.js";
import { verifyActionToken, consumeActionToken } from "../otp/otp.service.js";

// ── Include ───────────────────────────────────────────────────
const facultyInclude = {
  user: { select: { id: true, email: true, role: true, isBlocked: true, createdAt: true, extra_roles: true } },
  department: { select: { id: true, name: true } },
  subjects: { include: { subject: { select: { id: true, name: true, code: true, category: true } } } },
  coordinating_sections: {
    select: {
      id: true, name: true, semester: true, batch: true, academic_year: true,
      branch: { select: { id: true, name: true, program: { select: { name: true } } } },
    },
  },
  sectionSubjects: {
    include: {
      section: {
        select: {
          id: true, name: true, semester: true, batch: true,
          branch: { select: { id: true, name: true } }
        }
      },
      subject: { select: { id: true, name: true, code: true } },
    },
    where: { status: "ACTIVE" },
  },
};

// ── Get All ───────────────────────────────────────────────────
export const getAllFaculty = async ({ limit = 20, page = 1, search, dept_id, designation, employee_type, gender, status } = {}) => {
  const skip = (page - 1) * limit;
  const where = { deleted_at: null };
  if (dept_id) where.dept_id = dept_id;
  if (designation) where.designation = designation;
  if (employee_type) where.employee_type = employee_type;
  if (gender) where.gender = gender;
  if (status === "BLOCKED") {
    where.user = { isBlocked: true };
  } else if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { emp_id: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  const [faculty, total] = await Promise.all([
    prisma.faculty.findMany({ where, skip, take: limit, orderBy: [{ name: "asc" }], include: facultyInclude }),
    prisma.faculty.count({ where }),
  ]);
  return { faculty, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

// ── Get By ID ─────────────────────────────────────────────────
export const getFacultyById = async (id) => {
  return prisma.faculty.findUnique({ where: { id }, include: facultyInclude });
};

// ── Get By User ID ────────────────────────────────────────────
export const getFacultyByUserId = (user_id) =>
  prisma.faculty.findUnique({ where: { user_id }, include: facultyInclude });

// ── Create ────────────────────────────────────────────────────
export const createFaculty = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) throw Object.assign(new Error(`Email "${data.email}" is already registered`), { status: 409 });

  // NEW: set primary/secondary roles
  const { primary_role_id, secondary_role_id, qualifications, ...facultyData } = data;
  data = facultyData;

  if (data.emp_id) {
    const dupEmp = await prisma.faculty.findUnique({ where: { emp_id: data.emp_id }, select: { id: true } });
    if (dupEmp) throw Object.assign(new Error(`Employee ID "${data.emp_id}" is already in use`), { status: 409 });
  }

  if (data.employee_code) {
    const dupCode = await prisma.faculty.findUnique({ where: { employee_code: data.employee_code }, select: { id: true } });
    if (dupCode) throw Object.assign(new Error(`Employee code "${data.employee_code}" is already in use`), { status: 409 });
  }

  const hash = await bcrypt.hash(data.password || "Faculty@123", 12);
  const p = (v) => (v !== undefined && v !== null && v !== "" ? v : undefined);
  const strip = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

  return prisma.$transaction(async (tx) => {
    const faculty = await tx.faculty.create({
      data: strip({
        name: data.name || [data.first_name, data.last_name].filter(Boolean).join(" ") || data.email?.split("@")[0],
        first_name: p(data.first_name),
        last_name: p(data.last_name),
        nick_name: p(data.nick_name),
        emp_id: p(data.emp_id),
        employee_code: p(data.employee_code),
        designation: p(data.designation),
        employee_type: p(data.employee_type),
        phone: p(data.phone),
        personal_email: p(data.personal_email),
        gender: p(data.gender),
        dob: data.dob ? new Date(data.dob) : undefined,
        joining_date: data.joining_date ? new Date(data.joining_date) : undefined,
        religion: p(data.religion),
        category: p(data.category),
        aadhar_no: p(data.aadhar_no),
        pan_no: p(data.pan_no),
        blood_group: p(data.blood_group),
        qualification: p(data.qualification),
        specialization: p(data.specialization),
        experience_years: data.experience_years ? Number(data.experience_years) : undefined,
        salary_grade: p(data.salary_grade),
        pf_number: p(data.pf_number),
        esi_number: p(data.esi_number),
        bank_name: p(data.bank_name),
        bank_ifsc: p(data.bank_ifsc),
        emergency_contact: p(data.emergency_contact),
        emergency_phone: p(data.emergency_phone),
        emergency_relation: p(data.emergency_relation),
        salary_encrypted: data.salary ? safeEncrypt(data.salary) : undefined,
        bank_account_encrypted: data.bank_account ? safeEncrypt(data.bank_account) : undefined,
        status: data.status || "ACTIVE",
        ...(data.dept_id && { department: { connect: { id: data.dept_id } } }),
        user: { create: { email: data.email, passwordHash: hash, role: "FACULTY" } },
        ...(data.subject_ids?.length && {
          subjects: { create: data.subject_ids.map((subject_id) => ({ subject_id })) },
        }),
      }),
      include: facultyInclude,
    });
    return faculty;
  });
};

// ── Update ────────────────────────────────────────────────────
export const updateFaculty = async (id, data) => {
  const updateData = {};
  const opt = (v) => v || null;

  const fields = [
    "name", "first_name", "last_name", "nick_name", "designation", "employee_type",
    "phone", "personal_email", "gender", "religion", "category", "aadhar_no", "pan_no",
    "status", "blood_group", "qualification", "specialization", "salary_grade",
    "pf_number", "esi_number", "bank_name", "bank_ifsc", "employee_code",
    "emergency_contact", "emergency_phone", "emergency_relation",
    "is_teaching", "address", "city", "state", "pincode",
  ];
  const boolFields = ["is_teaching", "lives_on_campus"];
  fields.forEach((f) => {
    if (data[f] !== undefined) {
      if (boolFields.includes(f)) {
        // Boolean fields cannot be null — convert to true/false
        updateData[f] = data[f] === true || data[f] === "true" || data[f] === 1;
      } else {
        updateData[f] = opt(data[f]);
      }
    }
  });

  if (data.dob !== undefined) updateData.dob = data.dob ? new Date(data.dob) : null;
  if (data.joining_date !== undefined) updateData.joining_date = data.joining_date ? new Date(data.joining_date) : null;
  if (data.retirement_date !== undefined) updateData.retirement_date = data.retirement_date ? new Date(data.retirement_date) : null;
  if (data.experience_years !== undefined) updateData.experience_years = data.experience_years ? Number(data.experience_years) : null;

  if (data.dept_id !== undefined) {
    updateData.department = data.dept_id ? { connect: { id: data.dept_id } } : { disconnect: true };
  }

  if (data.emp_id !== undefined) {
    const val = data.emp_id || null;
    if (val) {
      const dup = await prisma.faculty.findFirst({ where: { emp_id: val, NOT: { id } }, select: { id: true } });
      if (dup) throw Object.assign(new Error(`Employee ID "${val}" already in use`), { status: 409 });
    }
    updateData.emp_id = val;
  }

  if (data.subject_ids !== undefined) {
    await prisma.facultySubject.deleteMany({ where: { faculty_id: id } });
    if (data.subject_ids.length > 0) {
      await prisma.facultySubject.createMany({
        data: data.subject_ids.map((subject_id) => ({ faculty_id: id, subject_id })),
        skipDuplicates: true,
      });
    }
  }

  return prisma.faculty.update({ where: { id }, data: updateData, include: facultyInclude });
};

// ── Delete ────────────────────────────────────────────────────
export const deleteFaculty = async (id) => {
  const sections = await prisma.sectionSubject.count({ where: { faculty_id: id, status: "ACTIVE" } });
  if (sections > 0) throw Object.assign(new Error(`Cannot delete: faculty is actively teaching ${sections} section subject(s). Remove assignments first.`), { status: 400 });

  const faculty = await prisma.faculty.findUnique({ where: { id }, select: { id: true, user_id: true, photo_url: true } });
  if (!faculty) throw Object.assign(new Error("Faculty not found"), { status: 404 });

  if (faculty.photo_url) deleteFile(faculty.photo_url);
  await prisma.faculty.delete({ where: { id } });
  if (faculty.user_id) await prisma.user.delete({ where: { id: faculty.user_id } }).catch(() => { });

  return { success: true, message: "Faculty and linked user deleted successfully" };
};

// ── Restore ───────────────────────────────────────────────────
export const restoreFaculty = async (id) => {
  return prisma.faculty.update({ where: { id }, data: { deleted_at: null }, include: facultyInclude });
};

// ── Block / Unblock ───────────────────────────────────────────
export const toggleFacultyBlock = async (id) => {
  const faculty = await prisma.faculty.findUnique({ where: { id }, select: { user: { select: { isBlocked: true } } } });
  if (!faculty) throw Object.assign(new Error("Faculty not found"), { status: 404 });
  const isBlocked = !faculty.user.isBlocked;
  return prisma.faculty.update({
    where: { id },
    data: { user: { update: { isBlocked } } },
    include: facultyInclude,
  });
};

// ── Assign Subjects ───────────────────────────────────────────
export const assignSubjects = async (id, subject_ids) => {
  await prisma.facultySubject.deleteMany({ where: { faculty_id: id } });
  if (subject_ids.length > 0) {
    await prisma.facultySubject.createMany({
      data: subject_ids.map((subject_id) => ({ faculty_id: id, subject_id })),
      skipDuplicates: true,
    });
  }
  return prisma.faculty.findUnique({ where: { id }, include: facultyInclude });
};

// ── Photo Upload ──────────────────────────────────────────────
export const uploadFacultyPhoto = async (facultyId, file) => {
  validateImage(file);
  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
  if (!faculty) throw Object.assign(new Error("Faculty not found"), { status: 404 });
  if (faculty.photo_url) deleteFile(faculty.photo_url);
  const { url } = await saveFile(file.buffer, file.originalname, "faculty");
  return prisma.faculty.update({ where: { id: facultyId }, data: { photo_url: url } });
};

// ── Update HR (salary encrypted) ─────────────────────────────
export const updateFacultyHR = async (facultyId, data) => {
  const updateData = {};
  const hrFields = ["salary_grade", "bank_name", "bank_ifsc", "pf_number", "esi_number", "blood_group",
    "emergency_contact", "emergency_phone", "emergency_relation", "qualification", "specialization", "employee_code"];
  hrFields.forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });
  if (data.experience_years !== undefined) updateData.experience_years = Number(data.experience_years);
  if (data.salary !== undefined) updateData.salary_encrypted = safeEncrypt(data.salary);
  if (data.bank_account !== undefined) updateData.bank_account_encrypted = safeEncrypt(data.bank_account);
  return prisma.faculty.update({ where: { id: facultyId }, data: updateData });
};

// ── Get Salary (OTP required) ─────────────────────────────────
export const getFacultySalary = async (facultyId, requestingUserId, actionToken) => {
  const valid = await verifyActionToken(requestingUserId, "salary_view", actionToken);
  if (!valid) throw Object.assign(new Error("Invalid or expired action token. Please verify OTP again."), { status: 403 });
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
    select: { salary_encrypted: true, salary_grade: true, name: true },
  });
  if (!faculty) throw Object.assign(new Error("Not found"), { status: 404 });
  await consumeActionToken(requestingUserId, "salary_view", actionToken);
  return { salary: safeDecrypt(faculty.salary_encrypted), salary_grade: faculty.salary_grade, faculty_name: faculty.name };
};

// ── Get Bank (OTP required) ───────────────────────────────────
export const getFacultyBank = async (facultyId, requestingUserId, actionToken) => {
  const valid = await verifyActionToken(requestingUserId, "bank_view", actionToken);
  if (!valid) throw Object.assign(new Error("Invalid or expired action token."), { status: 403 });
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
    select: { bank_account_encrypted: true, bank_name: true, bank_ifsc: true, pf_number: true, esi_number: true },
  });
  if (!faculty) throw Object.assign(new Error("Not found"), { status: 404 });
  await consumeActionToken(requestingUserId, "bank_view", actionToken);
  return {
    bank_account: safeDecrypt(faculty.bank_account_encrypted),
    bank_name: faculty.bank_name,
    bank_ifsc: faculty.bank_ifsc,
    pf_number: faculty.pf_number,
    esi_number: faculty.esi_number,
  };
};

// ── Analytics ─────────────────────────────────────────────────
export const getFacultyAnalytics = async () => {
  const [total, active, blocked, genderStats, deptStats, designationStats, employeeTypeStats,
    monthlyJoining, subjectLoad, sectionLoad, qualificationStats, experienceStats] = await Promise.all([
      prisma.faculty.count({ where: { deleted_at: null } }),
      prisma.faculty.count({ where: { deleted_at: null, status: "ACTIVE" } }),
      prisma.user.count({ where: { isBlocked: true, faculty: { deleted_at: null } } }),
      prisma.faculty.groupBy({ by: ["gender"], where: { deleted_at: null }, _count: true }),
      prisma.faculty.groupBy({ by: ["dept_id"], where: { deleted_at: null }, _count: true }),
      prisma.faculty.groupBy({ by: ["designation"], where: { deleted_at: null }, _count: true }),
      prisma.faculty.groupBy({ by: ["employee_type"], where: { deleted_at: null }, _count: true }),
      prisma.$queryRaw`SELECT TO_CHAR(DATE_TRUNC('month', "joining_date"), 'YYYY-MM') AS month, COUNT(*)::int AS count FROM "Faculty" WHERE "joining_date" IS NOT NULL AND "deleted_at" IS NULL GROUP BY month ORDER BY month ASC`,
      prisma.faculty.findMany({ where: { deleted_at: null }, select: { id: true, name: true, emp_id: true, _count: { select: { subjects: true, sectionSubjects: true } } }, orderBy: { subjects: { _count: "desc" } }, take: 10 }),
      prisma.faculty.findMany({ where: { deleted_at: null }, select: { id: true, name: true, _count: { select: { coordinating_sections: true } } }, orderBy: { coordinating_sections: { _count: "desc" } }, take: 10 }),
      prisma.faculty.groupBy({ by: ["qualification"], where: { deleted_at: null, qualification: { not: null } }, _count: true }),
      prisma.faculty.groupBy({ by: ["experience_years"], where: { deleted_at: null, experience_years: { not: null } }, _count: true, orderBy: { experience_years: "asc" } }),
    ]);

  const depts = await prisma.department.findMany({ select: { id: true, name: true } });
  const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]));

  return {
    overview: { total, active, blocked, inactive: total - active },
    gender: genderStats.map((g) => ({ name: g.gender || "Not Specified", value: g._count })),
    byDept: deptStats.map((d) => ({ name: deptMap[d.dept_id] || "Unknown", faculty: d._count })).sort((a, b) => b.faculty - a.faculty),
    designation: designationStats.map((d) => ({ name: d.designation || "Not Set", value: d._count })),
    employeeType: employeeTypeStats.map((e) => ({ name: e.employee_type || "Not Set", value: e._count })),
    monthlyJoining,
    subjectLoad: subjectLoad.map((f) => ({ name: f.name, subjects: f._count.subjects, sections: f._count.sectionSubjects })),
    sectionLoad: sectionLoad.map((f) => ({ name: f.name, sections: f._count.coordinating_sections })),
    qualification: qualificationStats.map((q) => ({ name: q.qualification, value: q._count })),
    experience: experienceStats.map((e) => ({ years: e.experience_years, count: e._count })),
  };
};

// ── Advanced Export ───────────────────────────────────────────
export const exportFacultyAdvanced = async (filters = {}) => {
  const where = { deleted_at: null };
  if (filters.dept_id) where.dept_id = filters.dept_id;

  const faculty = await prisma.faculty.findMany({
    where,
    include: {
      user: { select: { email: true, isBlocked: true, createdAt: true, role: true } },
      department: { select: { name: true } },
      subjects: { include: { subject: { select: { name: true, code: true } } } },
      coordinating_sections: { select: { name: true, semester: true } },
    },
    orderBy: [{ dept_id: "asc" }, { name: "asc" }],
  });

  const wb = xlsx.utils.book_new();
  const HEADERS = ["Name", "First Name", "Last Name", "Emp ID", "Employee Code", "Email", "Phone", "Personal Email",
    "Gender", "DOB", "Blood Group", "Department", "Designation", "Employee Type", "Status", "Joining Date",
    "Experience Years", "Qualification", "Specialization", "Salary Grade", "PF Number", "ESI Number",
    "Bank Name", "IFSC", "Emergency Contact", "Emergency Phone", "Emergency Relation",
    "Subjects Assigned", "Sections Coordinating", "Aadhar No", "PAN No", "Account Status", "System Role", "Created At"];

  const rows = faculty.map((f) => [
    f.name, f.first_name || "", f.last_name || "", f.emp_id || "", f.employee_code || "",
    f.user?.email || "", f.phone || "", f.personal_email || "",
    f.gender || "", f.dob ? new Date(f.dob).toLocaleDateString("en-IN") : "",
    f.blood_group || "", f.department?.name || "", f.designation || "", f.employee_type || "", f.status || "ACTIVE",
    f.joining_date ? new Date(f.joining_date).toLocaleDateString("en-IN") : "", f.experience_years || "",
    f.qualification || "", f.specialization || "", f.salary_grade || "", f.pf_number || "", f.esi_number || "",
    f.bank_name || "", f.bank_ifsc || "",
    f.emergency_contact || "", f.emergency_phone || "", f.emergency_relation || "",
    f.subjects.map((s) => `${s.subject.name} (${s.subject.code})`).join(", "),
    f.coordinating_sections.map((s) => `${s.name} Sem${s.semester}`).join(", "),
    f.aadhar_no || "", f.pan_no || "",
    f.user?.isBlocked ? "Blocked" : "Active", f.user?.role || "",
    f.user?.createdAt ? new Date(f.user.createdAt).toLocaleDateString("en-IN") : "",
  ]);

  // Summary sheet
  const deptCounts = {}, desCounts = {};
  faculty.forEach((f) => { const d = f.department?.name || "Unknown"; deptCounts[d] = (deptCounts[d] || 0) + 1; });
  faculty.forEach((f) => { const d = f.designation || "Unknown"; desCounts[d] = (desCounts[d] || 0) + 1; });
  const summaryRows = [
    ["EIT FARIDABAD — FACULTY EXPORT SUMMARY"],
    ["Generated On", new Date().toLocaleString("en-IN")],
    ["Total Faculty", faculty.length], [],
    ["─── BY DEPARTMENT ───"], ["Department", "Count"],
    ...Object.entries(deptCounts).sort((a, b) => b[1] - a[1]), [],
    ["─── BY DESIGNATION ───"], ["Designation", "Count"],
    ...Object.entries(desCounts).sort((a, b) => b[1] - a[1]),
  ];
  const wsSummary = xlsx.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");

  const wsAll = xlsx.utils.aoa_to_sheet([HEADERS, ...rows]);
  wsAll["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, wsAll, "All Faculty");

  const deptGroups = {};
  faculty.forEach((f) => {
    const key = f.dept_id || "no-dept";
    const name = f.department?.name || "Unknown";
    if (!deptGroups[key]) deptGroups[key] = { name, faculty: [] };
    deptGroups[key].faculty.push(f);
  });
  const usedNames = new Set(["Summary", "All Faculty"]);
  for (const { name, faculty: df } of Object.values(deptGroups)) {
    let sheetName = name.replace(/[\\/:*?[\]]/g, "").slice(0, 31);
    if (usedNames.has(sheetName)) sheetName = sheetName.slice(0, 28) + " 2";
    usedNames.add(sheetName);
    const ws = xlsx.utils.aoa_to_sheet([HEADERS, ...df.map((f) => rows[faculty.indexOf(f)])]);
    ws["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
  }

  try {
    const depts = await prisma.department.findMany({ where: { deleted_at: null }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } });
    const wsDepts = xlsx.utils.aoa_to_sheet([
      ["dept_name (use this in template)", "dept_id (alternative)", "code"],
      ...depts.map((d) => [d.name, d.id, d.code || ""]),
    ]);
    wsDepts["!cols"] = [{ wch: 40 }, { wch: 38 }, { wch: 10 }];
    xlsx.utils.book_append_sheet(wb, wsDepts, "Departments (Reference)");
  } catch { }

  const _raw = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(_raw) ? _raw : Buffer.from(_raw);
};

// ── Basic Export ──────────────────────────────────────────────
export const exportFacultyReport = async () => exportFacultyAdvanced();

// ── Template Download ─────────────────────────────────────────
export const getFacultyTemplate = async () => {
  const HEADERS = [
    "email*", "password*", "first_name*", "last_name*",
    "dept_name* (from Departments sheet)", "dept_id (leave blank if using dept_name)",
    "designation* (from Designations sheet)",
    "employee_type (from Valid Values sheet)",
    "emp_id", "employee_code",
    "joining_date (YYYY-MM-DD)",
    "gender (MALE/FEMALE/OTHER)",
    "dob (YYYY-MM-DD)",
    "phone", "personal_email",
    "qualification", "specialization", "experience_years",
    "blood_group (from Valid Values sheet)",
    "category (from Valid Values sheet)",
    "religion", "aadhar_no", "pan_no", "nick_name", "salary_grade",
    "pf_number", "esi_number", "bank_name", "bank_ifsc",
    "emergency_contact", "emergency_phone", "emergency_relation",
  ];
  const SAMPLE = [
    "john.doe@eit.edu", "Password@123", "John", "Doe",
    "Computer Science & Engineering", "", "Assistant Professor", "PERMANENT",
    "EIT001", "EMP001", "2024-07-01", "MALE", "1990-05-15",
    "9876543210", "john@gmail.com", "M.Tech", "Computer Science", "5",
    "B+", "General", "Hindu", "123456789012", "ABCDE1234F",
    "Johnny", "L4", "PF123456", "ESI123456", "SBI", "SBIN0001234",
    "Jane Doe", "9876543211", "Spouse",
  ];

  const wb = xlsx.utils.book_new();

  // Instructions
  const wsNotes = xlsx.utils.aoa_to_sheet([
    ["EIT FARIDABAD — FACULTY BULK UPLOAD TEMPLATE"], [""],
    ["INSTRUCTIONS:"],
    ["1. Fields marked * are required."],
    ["2. dept_name: Copy exactly from the Departments sheet."],
    ["3. designation: Copy exactly from the Designations sheet."],
    ["4. Dates: YYYY-MM-DD format (e.g. 2024-07-01)."],
    ["5. Do NOT modify column headers in Faculty Template sheet."],
  ]);
  wsNotes["!cols"] = [{ wch: 80 }];
  xlsx.utils.book_append_sheet(wb, wsNotes, "Instructions");

  // Template
  const wsT = xlsx.utils.aoa_to_sheet([HEADERS, SAMPLE]);
  wsT["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 18) }));
  xlsx.utils.book_append_sheet(wb, wsT, "Faculty Template");

  // Departments
  try {
    const depts = await prisma.department.findMany({ where: { deleted_at: null }, select: { name: true, id: true, code: true }, orderBy: { name: "asc" } });
    const wsD = xlsx.utils.aoa_to_sheet([
      ["dept_name (copy to template)", "dept_id (alternative)", "code"],
      ...depts.map((d) => [d.name, d.id, d.code || ""]),
    ]);
    wsD["!cols"] = [{ wch: 45 }, { wch: 38 }, { wch: 10 }];
    xlsx.utils.book_append_sheet(wb, wsD, "Departments");
  } catch { xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([["dept_name", "dept_id"]]), "Departments"); }

  // Designations
  try {
    const existing = await prisma.faculty.groupBy({ by: ["designation"], where: { deleted_at: null, designation: { not: null } }, _count: true, orderBy: { _count: { designation: "desc" } } });
    const wsDesig = xlsx.utils.aoa_to_sheet([
      ["designation (copy to template)", "count"],
      ["Professor", "—"], ["Associate Professor", "—"], ["Assistant Professor", "—"],
      ["Lecturer", "—"], ["Lab Assistant", "—"], ["HOD", "—"], ["Visiting Faculty", "—"], [""],
      ["— Currently in system —", ""],
      ...existing.map((d) => [d.designation, d._count]),
    ]);
    wsDesig["!cols"] = [{ wch: 30 }, { wch: 16 }];
    xlsx.utils.book_append_sheet(wb, wsDesig, "Designations");
  } catch { xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([["designation"]]), "Designations"); }

  // Valid Values
  const wsV = xlsx.utils.aoa_to_sheet([
    ["FIELD", "VALID VALUES", "NOTES"],
    ["employee_type", "PERMANENT / CONTRACT / VISITING / PART_TIME", ""],
    ["gender", "MALE / FEMALE / OTHER", ""],
    ["blood_group", "A+ / A- / B+ / B- / AB+ / AB- / O+ / O-", ""],
    ["category", "General / OBC / SC / ST / EWS", ""],
    ["salary_grade", "L1 / L2 / L3 / L4 / L5 / L6 / L7 / L8", ""],
  ]);
  wsV["!cols"] = [{ wch: 18 }, { wch: 50 }, { wch: 35 }];
  xlsx.utils.book_append_sheet(wb, wsV, "Valid Values");

  const _raw = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(_raw) ? _raw : Buffer.from(_raw);
};

// ── Bulk Upload Faculty ───────────────────────────────────────
export const bulkUploadFaculty = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const wsName = wb.SheetNames.find((n) => n === "Faculty Template") || wb.SheetNames.find((n) => n !== "Instructions") || wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wsName], { defval: "" });

  const created = [], failed = [], skipped = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const email = String(row["email*"] || row.email || "").trim();
    const password = String(row["password*"] || row.password || "").trim();
    const first_name = String(row["first_name*"] || row.first_name || "").trim();
    const last_name = String(row["last_name*"] || row.last_name || "").trim();
    const designation = String(row["designation* (from Designations sheet)"] || row["designation*"] || row.designation || "").trim();
    const employee_type = String(row["employee_type (from Valid Values sheet)"] || row.employee_type || "").trim() || null;

    if (!email && !first_name && !last_name) { skipped.push({ row: rowNum, reason: "Empty row" }); continue; }

    let dept_id = String(row["dept_id (leave blank if using dept_name)"] || row.dept_id || "").trim();
    const dept_name_raw = String(row["dept_name* (from Departments sheet)"] || row.dept_name || "").trim();
    if (!dept_id && dept_name_raw) {
      const dept = await prisma.department.findFirst({ where: { name: { contains: dept_name_raw, mode: "insensitive" }, deleted_at: null }, select: { id: true } });
      if (dept) dept_id = dept.id;
    }

    if (!email || !password || !first_name || !last_name || !dept_id || !designation) {
      failed.push({
        row: rowNum, email: email || "",
        reason: `Missing: ${[!email && "email", !password && "password", !first_name && "first_name", !last_name && "last_name", !dept_id && "dept", !designation && "designation"].filter(Boolean).join(", ")}`
      });
      continue;
    }

    try {
      const result = await createFaculty({
        email, password, first_name, last_name, dept_id, designation, employee_type,
        emp_id: String(row.emp_id || "").trim() || null,
        employee_code: String(row.employee_code || "").trim() || null,
        joining_date: row["joining_date (YYYY-MM-DD)"] ? new Date(row["joining_date (YYYY-MM-DD)"]) : null,
        gender: String(row["gender (MALE/FEMALE/OTHER)"] || row.gender || "").trim() || null,
        dob: row["dob (YYYY-MM-DD)"] ? new Date(row["dob (YYYY-MM-DD)"]) : null,
        phone: row.phone ? String(row.phone).trim() : null,
        personal_email: String(row.personal_email || "").trim() || null,
        qualification: String(row.qualification || "").trim() || null,
        specialization: String(row.specialization || "").trim() || null,
        experience_years: row.experience_years ? Number(row.experience_years) : null,
        blood_group: String(row["blood_group (from Valid Values sheet)"] || row.blood_group || "").trim() || null,
        category: String(row["category (from Valid Values sheet)"] || row.category || "").trim() || null,
        religion: String(row.religion || "").trim() || null,
        aadhar_no: row.aadhar_no ? String(row.aadhar_no).trim() : null,
        pan_no: String(row.pan_no || "").trim() || null,
        nick_name: String(row.nick_name || "").trim() || null,
        salary_grade: String(row.salary_grade || "").trim() || null,
        pf_number: String(row.pf_number || "").trim() || null,
        esi_number: String(row.esi_number || "").trim() || null,
        bank_name: String(row.bank_name || "").trim() || null,
        bank_ifsc: String(row.bank_ifsc || "").trim() || null,
        emergency_contact: String(row.emergency_contact || "").trim() || null,
        emergency_phone: row.emergency_phone ? String(row.emergency_phone).trim() : null,
        emergency_relation: String(row.emergency_relation || "").trim() || null,
      });
      created.push({ row: rowNum, email: result.user?.email || email, id: result.id, name: `${first_name} ${last_name}` });
    } catch (err) {
      failed.push({ row: rowNum, email, reason: err.message });
    }
  }

  return { created, failed, skipped, total: rows.length };
};

// ═══════════════════════════════════════════════════════════════
// V3 — CAREER HISTORY, STATUS CHANGE, ROLLBACK, STATS
// ═══════════════════════════════════════════════════════════════

export const getFacultyCareerHistory = async (faculty_id) => {
  const faculty = await prisma.faculty.findUnique({ where: { id: faculty_id } });
  if (!faculty) throw Object.assign(new Error("Faculty not found"), { status: 404 });
  return prisma.facultyCareerHistory.findMany({
    where: { faculty_id },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);
};

export const changeFacultyStatus = async (faculty_id, status, reason, actingUser = {}) => {
  const VALID = ["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED", "RETIRED", "SUSPENDED"];
  if (!VALID.includes(status)) throw Object.assign(new Error(`Invalid status: ${status}`), { status: 400 });

  const faculty = await prisma.faculty.findUnique({ where: { id: faculty_id } });
  if (!faculty) throw Object.assign(new Error("Faculty not found"), { status: 404 });

  const BLOCK_ON = new Set(["INACTIVE", "TERMINATED", "RESIGNED", "RETIRED", "SUSPENDED"]);
  const UNBLOCK_ON = new Set(["ACTIVE", "ON_LEAVE"]);

  const updated = await prisma.faculty.update({ where: { id: faculty_id }, data: { status } });

  if (BLOCK_ON.has(status)) await prisma.user.update({ where: { id: faculty.user_id }, data: { isBlocked: true } }).catch(() => { });
  if (UNBLOCK_ON.has(status)) await prisma.user.update({ where: { id: faculty.user_id }, data: { isBlocked: false } }).catch(() => { });

  await prisma.facultyCareerHistory.create({
    data: {
      faculty_id,
      action: "STATUS_CHANGE",
      prev_status: faculty.status,
      new_status: status,
      reason: reason || null,
      changed_by: actingUser.id || null,
      changed_by_name: actingUser.email || null,
    },
  }).catch(() => { });

  return updated;
};

export const rollbackFaculty = async (faculty_id, history_id, reason, actingUser = {}) => {
  const history = await prisma.facultyCareerHistory.findUnique({ where: { id: history_id } }).catch(() => null);
  if (!history) throw Object.assign(new Error("History record not found"), { status: 404 });

  const updated = await prisma.faculty.update({
    where: { id: faculty_id },
    data: {
      ...(history.prev_designation && { designation: history.prev_designation }),
      ...(history.prev_status && { status: history.prev_status }),
    },
  });

  await prisma.facultyCareerHistory.create({
    data: {
      faculty_id,
      action: "ROLLBACK",
      reason: reason || `Rolled back to history ${history_id}`,
      changed_by: actingUser.id || null,
      changed_by_name: actingUser.email || null,
    },
  }).catch(() => { });

  return updated;
};

export const getFacultyStats = async () => {
  const sc = async (fn) => { try { return await fn(); } catch { return 0; } };
  const [total, active, blocked, byDept, byDesig, byType] = await Promise.all([
    sc(() => prisma.faculty.count({ where: { deleted_at: null } })),
    sc(() => prisma.faculty.count({ where: { deleted_at: null, status: "ACTIVE" } })),
    sc(() => prisma.user.count({ where: { isBlocked: true, role: "FACULTY" } })),
    prisma.faculty.groupBy({ by: ["dept_id"], where: { deleted_at: null }, _count: true }).catch(() => []),
    prisma.faculty.groupBy({ by: ["designation"], where: { deleted_at: null }, _count: true }).catch(() => []),
    prisma.faculty.groupBy({ by: ["employee_type"], where: { deleted_at: null }, _count: true }).catch(() => []),
  ]);
  return { total, active, blocked, by_dept: byDept, by_designation: byDesig, by_type: byType };
};

// ── Update campus + role fields (called from update controller) ──
export const updateFacultyExtras = async (id, data) => {
  const allowed = [
    "lives_on_campus", "accommodation_type", "campus_quarter_no", "campus_address",
    "erp_role", "biometric_device_id", "is_teaching",
  ];
  const u = {};
  for (const f of allowed) {
    if (data[f] !== undefined) {
      u[f] = f === "lives_on_campus" || f === "is_teaching"
        ? Boolean(data[f])
        : data[f] || null;
    }
  }
  if (!Object.keys(u).length) return null;
  return prisma.faculty.update({ where: { id }, data: u });
};
// ── Subject Preference Requests (merged from faculty.subject.service.js) ──

const guard = () => {
  if (!prisma.facultySubjectRequest) throw Object.assign(new Error("Run migration"), { status: 503 });
};

// Faculty requests a subject preference
export const requestSubjectPreference = async (faculty_id, data, actingUser = {}) => {
  guard();
  const { subject_id, session_id, preference = 1 } = data;
  if (!subject_id || !session_id) throw Object.assign(new Error("subject_id and session_id required"), { status: 400 });
  if (![1, 2].includes(parseInt(preference))) throw Object.assign(new Error("preference must be 1 or 2"), { status: 400 });

  // Check faculty already has 2 approved/pending preferences
  const existing = await prisma.facultySubjectRequest.findMany({
    where: { faculty_id, session_id, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing.length >= 2) throw Object.assign(new Error("You can only request up to 2 subject preferences"), { status: 400 });

  return prisma.facultySubjectRequest.upsert({
    where: { faculty_id_subject_id_session_id: { faculty_id, subject_id, session_id } },
    update: { preference: parseInt(preference), status: "PENDING", reviewed_by: null, reviewed_at: null, review_note: null },
    create: { faculty_id, subject_id, session_id, preference: parseInt(preference) },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      faculty: { select: { id: true, name: true, emp_id: true } },
    },
  });
};

// List requests — for dept admin (all) or faculty (own)
export const listRequests = async (filters = {}) => {
  guard();
  const { faculty_id, session_id, dept_id, status } = filters;
  const where = {};
  if (faculty_id) where.faculty_id = faculty_id;
  if (session_id) where.session_id = session_id;
  if (status) where.status = status;
  if (dept_id) where.faculty = { dept_id };

  return prisma.facultySubjectRequest.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, code: true, category: true } },
      faculty: {
        select: {
          id: true, name: true, emp_id: true, designation: true,
          department: { select: { id: true, name: true } }
        },
      },
    },
    orderBy: [{ faculty: { name: "asc" } }, { preference: "asc" }],
  });
};

// Dept admin approves or rejects
export const reviewRequest = async (request_id, action, reviewer, note) => {
  guard();
  if (!["APPROVED", "REJECTED"].includes(action))
    throw Object.assign(new Error("action must be APPROVED or REJECTED"), { status: 400 });

  const req = await prisma.facultySubjectRequest.findUnique({
    where: { id: request_id },
    include: { faculty: true, subject: true },
  });
  if (!req) throw Object.assign(new Error("Request not found"), { status: 404 });

  const updated = await prisma.facultySubjectRequest.update({
    where: { id: request_id },
    data: {
      status: action,
      reviewed_by: reviewer?.id || null,
      reviewed_at: new Date(),
      review_note: note || null,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      faculty: { select: { id: true, name: true, emp_id: true } },
    },
  });

  // If approved — auto-assign to FacultySubject
  if (action === "APPROVED") {
    await prisma.facultySubject.upsert({
      where: { faculty_id_subject_id: { faculty_id: req.faculty_id, subject_id: req.subject_id } },
      update: {},
      create: { faculty_id: req.faculty_id, subject_id: req.subject_id },
    }).catch(() => { });
  }

  return updated;
};

// Bulk review
export const bulkReview = async (request_ids, action, reviewer, note) => {
  const results = [];
  for (const id of request_ids) {
    try { results.push(await reviewRequest(id, action, reviewer, note)); }
    catch (e) { results.push({ id, error: e.message }); }
  }
  return results;
};