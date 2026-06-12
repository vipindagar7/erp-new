import bcrypt from "bcrypt";
import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";
import { saveFile, deleteFile, validateImage } from "../../utils/fileStorage.js";
import { encrypt, decrypt, safeEncrypt, safeDecrypt } from "../../utils/encryption.js";
import { verifyActionToken, consumeActionToken } from "../otp/otp.service.js";


// ── Include ────────────────────────────────────────────────────
const facultyInclude = {
  user: { select: { id: true, email: true, role: true, isBlocked: true } },
  department: { select: { id: true, name: true } },
  subjects: { include: { subject: { select: { id: true, name: true, code: true, category: true } } } },
  coordinating_sections: {
    select: {
      id: true, name: true, semester: true, batch: true,
      course: { select: { id: true, name: true } }
    },
  },
  sectionSubjects: {
    include: {
      section: {
        select: {
          id: true, name: true, semester: true, batch: true,
          course: { select: { id: true, name: true } }
        }
      },
      subject: { select: { id: true, name: true, code: true } },
    },
    where: { status: "ACTIVE" },
  },
};

// ══════════════════════════════════════════════════════════════
// GET ALL
// ══════════════════════════════════════════════════════════════
export const getAllFaculty = async ({ limit = 200, page = 1, search, dept_id } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (dept_id) where.dept_id = dept_id;
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { emp_id: { contains: search, mode: "insensitive" } },
    { user: { email: { contains: search, mode: "insensitive" } } },
  ];
  const [faculty, total] = await Promise.all([
    prisma.faculty.findMany({ where, skip, take: limit, orderBy: [{ name: "asc" }], include: facultyInclude }),
    prisma.faculty.count({ where }),
  ]);
  return { faculty, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};


// ══════════════════════════════════════════════════════════════
// GET BY ID
// ══════════════════════════════════════════════════════════════

export const getFacultyByUserId = (user_id) =>
  prisma.faculty.findUnique({ where: { user_id }, include: facultyInclude });

// ══════════════════════════════════════════════════════════════
// CREATE
// ══════════════════════════════════════════════════════════════
export const createFaculty = async (data) => {
  // Email uniqueness check
  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) throw Object.assign(new Error(`Email "${data.email}" is already registered`), { status: 409 });

  // Emp ID uniqueness check
  if (data.emp_id) {
    const dupEmp = await prisma.faculty.findUnique({ where: { emp_id: data.emp_id }, select: { id: true } });
    if (dupEmp) throw Object.assign(new Error(`Employee ID "${data.emp_id}" is already in use`), { status: 409 });
  }

  const hash = await bcrypt.hash(data.password || "Faculty@123", 12);

  return prisma.$transaction(async (tx) => {
    const p = (v) => (v && v !== "" ? v : undefined);
    const faculty = await tx.faculty.create({
      data: {
        name: data.name,
        ...(p(data.first_name) && { first_name: data.first_name }),
        ...(p(data.last_name) && { last_name: data.last_name }),
        ...(p(data.nick_name) && { nick_name: data.nick_name }),
        ...(p(data.emp_id) && { emp_id: data.emp_id }),
        ...(p(data.designation) && { designation: data.designation }),
        ...(p(data.employee_type) && { employee_type: data.employee_type }),
        ...(p(data.phone) && { phone: data.phone }),
        ...(p(data.personal_email) && { personal_email: data.personal_email }),
        ...(p(data.gender) && { gender: data.gender }),
        ...(data.dob && { dob: data.dob }),
        ...(data.joining_date && { joining_date: data.joining_date }),
        ...(p(data.religion) && { religion: data.religion }),
        ...(p(data.category) && { category: data.category }),
        ...(p(data.aadhar_no) && { aadhar_no: data.aadhar_no }),
        ...(p(data.pan_no) && { pan_no: data.pan_no }),
        status: data.status || "ACTIVE",
        ...(data.dept_id && { department: { connect: { id: data.dept_id } } }),
        user: { create: { email: data.email, passwordHash: hash, role: "FACULTY" } },
        ...(data.subject_ids?.length && {
          subjects: { create: data.subject_ids.map((subject_id) => ({ subject_id })) },
        }),
      },
      include: facultyInclude,
    });
    return faculty;
  });
};

// ══════════════════════════════════════════════════════════════
// UPDATE
// ══════════════════════════════════════════════════════════════
export const updateFaculty = async (id, data) => {
  const updateData = {};
  const opt = (v) => v || null;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.first_name !== undefined) updateData.first_name = opt(data.first_name);
  if (data.last_name !== undefined) updateData.last_name = opt(data.last_name);
  if (data.nick_name !== undefined) updateData.nick_name = opt(data.nick_name);
  if (data.designation !== undefined) updateData.designation = opt(data.designation);
  if (data.employee_type !== undefined) updateData.employee_type = opt(data.employee_type);
  if (data.phone !== undefined) updateData.phone = opt(data.phone);
  if (data.personal_email !== undefined) updateData.personal_email = opt(data.personal_email);
  if (data.gender !== undefined) updateData.gender = opt(data.gender);
  if (data.dob !== undefined) updateData.dob = data.dob || null;
  if (data.joining_date !== undefined) updateData.joining_date = data.joining_date || null;
  if (data.religion !== undefined) updateData.religion = opt(data.religion);
  if (data.category !== undefined) updateData.category = opt(data.category);
  if (data.aadhar_no !== undefined) updateData.aadhar_no = opt(data.aadhar_no);
  if (data.pan_no !== undefined) updateData.pan_no = opt(data.pan_no);
  if (data.status !== undefined) updateData.status = data.status || "ACTIVE";
  if (data.dept_id !== undefined) {
    if (data.dept_id) {
      updateData.department = { connect: { id: data.dept_id } };
    } else {
      updateData.department = { disconnect: true };
    }
  }

  // Emp ID — check uniqueness
  if (data.emp_id !== undefined) {
    const val = data.emp_id || null;
    if (val) {
      const dup = await prisma.faculty.findFirst({ where: { emp_id: val, NOT: { id } }, select: { id: true } });
      if (dup) throw Object.assign(new Error(`Employee ID "${val}" is already in use`), { status: 409 });
    }
    updateData.emp_id = val;
  }

  // Subjects — full replace if provided
  if (data.subject_ids !== undefined) {
    // Delete existing then re-create
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

// ══════════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════════
export const deleteFaculty = async (id) => {
  // Check active assignments
  const sections = await prisma.sectionSubject.count({
    where: {
      faculty_id: id,
      status: "ACTIVE",
    },
  });

  if (sections > 0) {
    throw Object.assign(
      new Error(
        `Cannot delete: faculty is actively teaching ${sections} section subject(s). Remove assignments first.`
      ),
      { status: 400 }
    );
  }

  // Find faculty with linked user
  const faculty = await prisma.faculty.findUnique({
    where: { id },
    select: {
      id: true,
      user_id: true,
    },
  });

  if (!faculty) {
    throw Object.assign(
      new Error("Faculty not found"),
      { status: 404 }
    );
  }

  // Delete faculty
  await prisma.faculty.delete({
    where: { id },
  });

  // Delete linked user
  if (faculty.user_id) {
    await prisma.user.delete({
      where: {
        id: faculty.user_id,
      },
    });
  }

  return {
    success: true,
    message: "Faculty and linked user deleted successfully",
  };
};
// ══════════════════════════════════════════════════════════════
// BLOCK / UNBLOCK
// ══════════════════════════════════════════════════════════════
export const toggleBlock = async (id, isBlocked) => {
  const f = await prisma.faculty.findUnique({ where: { id } });
  if (!f) throw Object.assign(new Error("Faculty not found"), { status: 404 });
  return prisma.faculty.update({
    where: { id },
    data: { user: { update: { isBlocked } } },
    include: facultyInclude,
  });
};

// ══════════════════════════════════════════════════════════════
// ASSIGN SUBJECTS
// ══════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════
// BULK CREATE
// ══════════════════════════════════════════════════════════════
export const bulkCreateFaculty = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], total: rows.length };

  for (const row of rows) {
    const email = String(row["Email*"] || row.email || "").trim();
    const name = String(row["Name*"] || row.name || "").trim();
    if (!email || !name) { results.failed.push({ row, reason: "Email and Name required" }); continue; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { results.failed.push({ row, reason: `Invalid email: ${email}` }); continue; }

    try {
      const f = await createFaculty({
        email, name,
        password: String(row["Password"] || "Faculty@123").trim(),
        emp_id: String(row["Emp ID"] || "").trim() || undefined,
        designation: String(row["Designation"] || "").trim() || undefined,
        phone: String(row["Phone"] || "").trim() || undefined,
      });
      results.created.push({ id: f.id, email, name: f.name });
    } catch (e) { results.failed.push({ row, reason: e.message }); }
  }
  return results;
};

// ══════════════════════════════════════════════════════════════
// TEMPLATE
// ══════════════════════════════════════════════════════════════
export const generateTemplate = () => {
  const headers = ["Email*", "Password", "Name*", "Emp ID", "Designation", "Phone"];
  const sample = ["faculty@college.edu", "Faculty@123", "Dr. John Doe", "EMP001", "Assistant Professor", "9876543210"];
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};


// ── Upload faculty photo ──────────────────────────────────────
export const uploadFacultyPhoto = async (facultyId, file) => {
  validateImage(file);
  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
  if (!faculty) throw Object.assign(new Error("Faculty not found"), { statusCode: 404 });

  // Delete old photo
  if (faculty.photo_url) deleteFile(faculty.photo_url);

  const { url } = await saveFile(file.buffer, file.originalname, "faculty");
  return prisma.faculty.update({ where: { id: facultyId }, data: { photo_url: url } });
};

// ── Update HR fields (salary encrypted) ──────────────────────
export const updateFacultyHR = async (facultyId, data) => {
  const {
    salary, bank_account,
    salary_grade, bank_name, bank_ifsc, pf_number, esi_number,
    blood_group, emergency_contact, emergency_phone, emergency_relation,
    qualification, specialization, experience_years, employee_code,
    ...rest
  } = data;

  const updateData = { ...rest };

  // Encrypt sensitive fields
  if (salary !== undefined) updateData.salary_encrypted = safeEncrypt(salary);
  if (bank_account !== undefined) updateData.bank_account_encrypted = safeEncrypt(bank_account);

  // Non-sensitive HR fields
  if (salary_grade !== undefined) updateData.salary_grade = salary_grade;
  if (bank_name !== undefined) updateData.bank_name = bank_name;
  if (bank_ifsc !== undefined) updateData.bank_ifsc = bank_ifsc;
  if (pf_number !== undefined) updateData.pf_number = pf_number;
  if (esi_number !== undefined) updateData.esi_number = esi_number;
  if (blood_group !== undefined) updateData.blood_group = blood_group;
  if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;
  if (emergency_phone !== undefined) updateData.emergency_phone = emergency_phone;
  if (emergency_relation !== undefined) updateData.emergency_relation = emergency_relation;
  if (qualification !== undefined) updateData.qualification = qualification;
  if (specialization !== undefined) updateData.specialization = specialization;
  if (experience_years !== undefined) updateData.experience_years = Number(experience_years);
  if (employee_code !== undefined) updateData.employee_code = employee_code;

  return prisma.faculty.update({ where: { id: facultyId }, data: updateData });
};

// ── Get salary (requires valid action token) ──────────────────
export const getFacultySalary = async (facultyId, requestingUserId, actionToken) => {
  const valid = await verifyActionToken(requestingUserId, "salary_view", actionToken);
  if (!valid) throw Object.assign(new Error("Invalid or expired action token. Please verify OTP again."), { statusCode: 403 });

  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
    select: { salary_encrypted: true, salary_grade: true, name: true },
  });
  if (!faculty) throw Object.assign(new Error("Not found"), { statusCode: 404 });

  await consumeActionToken(requestingUserId, "salary_view", actionToken);

  return {
    salary: safeDecrypt(faculty.salary_encrypted),
    salary_grade: faculty.salary_grade,
    faculty_name: faculty.name,
  };
};

// ── Get bank details (requires valid action token) ────────────
export const getFacultyBank = async (facultyId, requestingUserId, actionToken) => {
  const valid = await verifyActionToken(requestingUserId, "bank_view", actionToken);
  if (!valid) throw Object.assign(new Error("Invalid or expired action token."), { statusCode: 403 });

  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
    select: { bank_account_encrypted: true, bank_name: true, bank_ifsc: true, pf_number: true, esi_number: true },
  });
  if (!faculty) throw Object.assign(new Error("Not found"), { statusCode: 404 });

  await consumeActionToken(requestingUserId, "bank_view", actionToken);

  return {
    bank_account: safeDecrypt(faculty.bank_account_encrypted),
    bank_name: faculty.bank_name,
    bank_ifsc: faculty.bank_ifsc,
    pf_number: faculty.pf_number,
    esi_number: faculty.esi_number,
  };
};

// ── Get full faculty by ID (safe — no encrypted fields) ───────
export const getFacultyById = async (id) => {
  return prisma.faculty.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, isBlocked: true, role: true, extra_roles: true, createdAt: true } },
      department: { select: { id: true, name: true } },
      subjects: { include: { subject: { select: { id: true, name: true, code: true, category: true } } } },
      coordinating_sections: {
        select: {
          id: true, name: true, semester: true, batch: true,
          course: { select: { name: true, program: { select: { name: true } } } },
        },
      },
      sectionSubjects: {
        select: {
          section: { select: { id: true, name: true, semester: true } },
          subject: { select: { name: true, code: true } },
          status: true,
        },
        where: { status: "ACTIVE" },
      },
    },
  });
};

// ── Faculty analytics ─────────────────────────────────────────
export const getFacultyAnalytics = async () => {
  const [
    total, active, blocked,
    genderStats, deptStats, designationStats,
    employeeTypeStats, monthlyJoining,
    subjectLoad, sectionLoad,
    qualificationStats, experienceStats,
  ] = await Promise.all([
    prisma.faculty.count({ where: { deleted_at: null } }),
    prisma.faculty.count({ where: { deleted_at: null, status: "ACTIVE" } }),
    prisma.user.count({ where: { isBlocked: true, faculty: { deleted_at: null } } }),

    prisma.faculty.groupBy({ by: ["gender"], where: { deleted_at: null }, _count: true }),
    prisma.faculty.groupBy({ by: ["dept_id"], where: { deleted_at: null }, _count: true }),
    prisma.faculty.groupBy({ by: ["designation"], where: { deleted_at: null }, _count: true }),
    prisma.faculty.groupBy({ by: ["employee_type"], where: { deleted_at: null }, _count: true }),

    // Monthly joining trend
    prisma.$queryRaw`
      SELECT TO_CHAR(DATE_TRUNC('month', "joining_date"), 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM "Faculty"
      WHERE "joining_date" IS NOT NULL AND "deleted_at" IS NULL
      GROUP BY month ORDER BY month ASC
    `,

    // Subject load per faculty (top 10)
    prisma.faculty.findMany({
      where: { deleted_at: null },
      select: {
        id: true, name: true, emp_id: true,
        _count: { select: { subjects: true, sectionSubjects: true } },
      },
      orderBy: { subjects: { _count: "desc" } },
      take: 10,
    }),

    // Section coordination load
    prisma.faculty.findMany({
      where: { deleted_at: null },
      select: {
        id: true, name: true,
        _count: { select: { coordinating_sections: true } },
      },
      orderBy: { coordinating_sections: { _count: "desc" } },
      take: 10,
    }),

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

// ── Advanced faculty export ───────────────────────────────────
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

  // Summary
  const summaryRows = [
    ["EIT FARIDABAD — FACULTY EXPORT SUMMARY"],
    ["Generated On", new Date().toLocaleString("en-IN")],
    ["Total Faculty", faculty.length],
    [],
    ["─── BY DEPARTMENT ───"],
    ["Department", "Count"],
  ];
  const deptCounts = {};
  faculty.forEach((f) => { const d = f.department?.name || "Unknown"; deptCounts[d] = (deptCounts[d] || 0) + 1; });
  Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => summaryRows.push([k, v]));
  summaryRows.push([], ["─── BY DESIGNATION ───"], ["Designation", "Count"]);
  const desCounts = {};
  faculty.forEach((f) => { const d = f.designation || "Unknown"; desCounts[d] = (desCounts[d] || 0) + 1; });
  Object.entries(desCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => summaryRows.push([k, v]));
  const wsSummary = xlsx.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");

  // All Faculty
  const HEADERS = [
    "Name", "First Name", "Last Name", "Emp ID", "Employee Code",
    "Email", "Phone", "Personal Email",
    "Gender", "DOB", "Blood Group",
    "Department", "Designation", "Employee Type", "Status",
    "Joining Date", "Experience Years",
    "Qualification", "Specialization",
    "Salary Grade", "PF Number", "ESI Number",
    "Bank Name", "IFSC",
    "Emergency Contact", "Emergency Phone", "Emergency Relation",
    "Subjects Assigned", "Sections Coordinating",
    "Aadhar No", "PAN No",
    "Account Status", "System Role",
    "Created At",
  ];
  const rows = faculty.map((f) => [
    f.name, f.first_name || "", f.last_name || "",
    f.emp_id || "", f.employee_code || "",
    f.user?.email || "", f.phone || "", f.personal_email || "",
    f.gender || "", f.dob ? new Date(f.dob).toLocaleDateString("en-IN") : "",
    f.blood_group || "",
    f.department?.name || "", f.designation || "", f.employee_type || "", f.status || "ACTIVE",
    f.joining_date ? new Date(f.joining_date).toLocaleDateString("en-IN") : "",
    f.experience_years || "",
    f.qualification || "", f.specialization || "",
    f.salary_grade || "", f.pf_number || "", f.esi_number || "",
    f.bank_name || "", f.bank_ifsc || "",
    f.emergency_contact || "", f.emergency_phone || "", f.emergency_relation || "",
    f.subjects.map((s) => `${s.subject.name} (${s.subject.code})`).join(", "),
    f.coordinating_sections.map((s) => `${s.name} Sem${s.semester}`).join(", "),
    f.aadhar_no || "", f.pan_no || "",
    f.user?.isBlocked ? "Blocked" : "Active",
    f.user?.role || "",
    f.user?.createdAt ? new Date(f.user.createdAt).toLocaleDateString("en-IN") : "",
  ]);
  const wsAll = xlsx.utils.aoa_to_sheet([HEADERS, ...rows]);
  wsAll["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, wsAll, "All Faculty");

  // Per-department sheets
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

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};