// backend/modules/admin/admin.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";
import { createNotification } from "../notification/notification.js";

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
export const getDashboardStats = async () => {
  const [
    totalStudents, totalFaculty, totalDepts, totalSections,
    totalSubjects, totalCourses, totalPrograms,
    activeEnrollments, detainedEnrollments, passedEnrollments,
    activeForms, totalResponses,
    blockedStudents, blockedFaculty,
    recentStudents, recentFaculty,
    genderStats, sectionStats,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.department.count(),
    prisma.section.count(),
    prisma.subject.count(),
    prisma.course.count(),
    prisma.program.count(),
    prisma.studentEnrollment.count({ where: { is_current: true, status: "ACTIVE" } }),
    prisma.studentEnrollment.count({ where: { is_current: true, status: "DETAINED" } }),
    prisma.studentEnrollment.count({ where: { is_current: true, status: "PASSED" } }),
    prisma.feedbackForm.count({ where: { is_active: true, end_date: { gte: new Date() } } }),
    prisma.feedbackResponse.count(),
    prisma.user.count({ where: { isBlocked: true, role: "STUDENT" } }),
    prisma.user.count({ where: { isBlocked: true, role: "FACULTY" } }),
    prisma.student.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, createdAt: true,
        section: { select: { name: true, semester: true } },
        department: { select: { name: true } },
      },
    }),
    prisma.faculty.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, designation: true, createdAt: true,
        department: { select: { name: true } },
      },
    }),
    prisma.student.groupBy({ by: ["gender"], _count: true }),
    prisma.section.findMany({
      take: 5,
      select: {
        id: true, name: true, semester: true, batch: true,
        course: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { students: { _count: "desc" } },
    }),
  ]);

  return {
    counts: { students: totalStudents, faculty: totalFaculty, departments: totalDepts, sections: totalSections, subjects: totalSubjects, courses: totalCourses, programs: totalPrograms },
    enrollments: { active: activeEnrollments, detained: detainedEnrollments, passed: passedEnrollments, total: activeEnrollments + detainedEnrollments + passedEnrollments },
    feedback: { active_forms: activeForms, total_responses: totalResponses },
    blocked: { students: blockedStudents, faculty: blockedFaculty },
    gender: genderStats.map((g) => ({ gender: g.gender || "Not specified", count: g._count })),
    top_sections: sectionStats.map((s) => ({ id: s.id, name: s.name, course: s.course?.name, semester: s.semester, batch: s.batch, students: s._count.students })),
    recent: { students: recentStudents, faculty: recentFaculty },
  };
};

export const getActivityFeed = async () => {
  const [students, faculty, responses, enrollments] = await Promise.all([
    prisma.student.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true } }),
    prisma.faculty.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true } }),
    prisma.feedbackResponse.findMany({
      take: 5, orderBy: { submittedAt: "desc" },
      select: { id: true, submittedAt: true, form: { select: { title: true } }, student: { select: { name: true } } },
    }),
    prisma.studentEnrollment.findMany({
      take: 5, orderBy: { enrolled_at: "desc" },
      where: { status: { in: ["PROMOTED", "PASSED", "DETAINED"] } },
      select: { id: true, status: true, semester: true, enrolled_at: true, student: { select: { name: true } } },
    }),
  ]);

  const items = [
    ...students.map((s) => ({ type: "student_added", label: `${s.name} enrolled`, time: s.createdAt, id: s.id })),
    ...faculty.map((f) => ({ type: "faculty_added", label: `${f.name} joined faculty`, time: f.createdAt, id: f.id })),
    ...responses.map((r) => ({ type: "feedback_submit", label: `${r.student?.name} submitted "${r.form?.title}"`, time: r.submittedAt, id: r.id })),
    ...enrollments.map((e) => ({ type: `enrollment_${e.status.toLowerCase()}`, label: `${e.student?.name} ${e.status.toLowerCase()} to Sem ${e.semester}`, time: e.enrolled_at, id: e.id })),
  ];
  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);
};

// ═══════════════════════════════════════════════════════════════
// ADMIN CRUD
// ═══════════════════════════════════════════════════════════════
export const listAdmins = async ({ page = 1, limit = 20, search } = {}) => {
  const skip = (page - 1) * limit;
  const where = {
    role: { in: ["ADMIN", "SUPER_ADMIN"] },
    ...(search && {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { admin: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { admin: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip, take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    admins: users.map((u) => ({
      id: u.admin?.id ?? u.id,
      user_id: u.id,
      name: u.admin?.name ?? "—",
      email: u.email,
      role: u.role,
      permissions: u.permissions,
      isBlocked: u.isBlocked,
      createdAt: u.createdAt,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAdminById = async (id) => {
  const admin = await prisma.admin.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, role: true, permissions: true, isBlocked: true, createdAt: true } } },
  });
  if (!admin) return null;
  return {
    id: admin.id, user_id: admin.user_id, name: admin.name,
    email: admin.user.email, role: admin.user.role,
    permissions: admin.user.permissions, isBlocked: admin.user.isBlocked, createdAt: admin.user.createdAt,
  };
};

export const createAdmin = async ({ name, email, password, permissions = [] }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "email_taken" };

  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 10), role: "ADMIN", permissions, admin: { create: { name } } },
    include: { admin: true },
  });
  return {
    admin: { id: user.admin.id, user_id: user.id, name: user.admin.name, email: user.email, role: user.role, permissions: user.permissions, isBlocked: user.isBlocked, createdAt: user.createdAt },
  };
};

export const updateAdmin = async (id, { name, permissions }) => {
  const admin = await prisma.admin.findUnique({ where: { id }, include: { user: true } });
  if (!admin) return null;

  await prisma.$transaction([
    ...(name !== undefined ? [prisma.admin.update({ where: { id }, data: { name } })] : []),
    ...(permissions !== undefined ? [prisma.user.update({ where: { id: admin.user_id }, data: { permissions } })] : []),
  ]);
  return getAdminById(id);
};

export const updatePermissions = async (id, permissions) => {
  const admin = await prisma.admin.findUnique({ where: { id }, include: { user: true } });
  if (!admin) return null;
  await prisma.user.update({ where: { id: admin.user_id }, data: { permissions } });
  return getAdminById(id);
};

export const toggleBlock = async (id) => {
  const admin = await prisma.admin.findUnique({ where: { id }, include: { user: true } });
  if (!admin) return null;

  const updated = await prisma.user.update({ where: { id: admin.user_id }, data: { isBlocked: !admin.user.isBlocked } });
  createNotification({
    user_id: admin.user_id,
    type: updated.isBlocked ? "ACCOUNT_BLOCKED" : "ACCOUNT_UNBLOCKED",
    title: updated.isBlocked ? "Account Blocked" : "Account Unblocked",
    message: updated.isBlocked ? "Your admin account has been blocked." : "Your admin account has been unblocked.",
  });
  return { isBlocked: updated.isBlocked };
};

export const deleteAdmin = async (id, requestingUserId) => {
  const admin = await prisma.admin.findUnique({ where: { id }, include: { user: true } });
  if (!admin) return { error: "not_found" };
  if (admin.user.role === "SUPER_ADMIN") return { error: "cannot_delete_super_admin" };
  if (admin.user_id === requestingUserId) return { error: "cannot_delete_self" };

  await prisma.admin.delete({ where: { id } });
  await prisma.user.delete({ where: { id: admin.user_id } });
  return { success: true };
};

// ── Reset any user's password ────────────────────────────────
export const resetUserPassword = async (userId, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  return { email: user.email };
};

// ── Issue a short-lived impersonation token ───────────────────
export const impersonateUser = async (targetUserId, adminId) => {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true, extra_roles: true, permissions: true, isBlocked: true },
  });
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  if (user.isBlocked) throw Object.assign(new Error("Cannot impersonate a blocked user"), { statusCode: 403 });

  // 15-minute token — carries impersonatedBy so auth middleware can verify it
  const token = jwt.sign(
    { id: user.id, impersonatedBy: adminId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  return { access: token, user };
};

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════
export const exportStudentsBySection = async (section_id) => {
  const where = section_id ? { section_id } : {};
  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { email: true } },
      department: { select: { name: true } },
      program: { select: { name: true } },
      course: { select: { name: true } },
      section: {
        select: {
          name: true, semester: true, batch: true,
          course: { select: { name: true, program: { select: { name: true } } } }
        },
      },
      enrollments: { where: { is_current: true }, select: { status: true, semester: true, academic_year: true } },
    },
    orderBy: [{ section_id: "asc" }, { name: "asc" }],
  });

  const headers = ["Name", "Roll No", "Enrollment No", "Email", "Phone", "Gender", "DOB", "Department", "Program", "Course", "Section", "Semester", "Batch", "Academic Year", "Enrollment Status", "Father Name", "Mother Name", "City", "State"];
  const rows = students.map((s) => {
    const enr = s.enrollments[0];
    return [s.name, s.roll_no || "", s.enrollment_no || "", s.user?.email || "", s.phone || "", s.gender || "", s.dob ? new Date(s.dob).toLocaleDateString() : "", s.department?.name || "", s.program?.name || "", s.course?.name || "", s.section?.name || "", enr?.semester || "", s.section?.batch || "", enr?.academic_year || "", enr?.status || "", s.father_name || "", s.mother_name || "", s.city || "", s.state || ""];
  });
  return _writeXlsx("Students", headers, rows);
};

export const exportFacultyReport = async () => {
  const faculty = await prisma.faculty.findMany({
    include: {
      user: { select: { email: true, isBlocked: true } },
      department: { select: { name: true } },
      subjects: { include: { subject: { select: { name: true, code: true } } } },
      _count: { select: { sectionSubjects: true, coordinating_sections: true } },
    },
    orderBy: { name: "asc" },
  });

  const headers = ["Name", "Emp ID", "Email", "Phone", "Designation", "Department", "Gender", "Joining Date", "Employee Type", "Status", "Subjects", "Active Sections", "Account Status"];
  const rows = faculty.map((f) => [f.name, f.emp_id || "", f.user?.email || "", f.phone || "", f.designation || "", f.department?.name || "", f.gender || "", f.joining_date ? new Date(f.joining_date).toLocaleDateString() : "", f.employee_type || "", f.status || "ACTIVE", f.subjects.map((s) => `${s.subject.name} (${s.subject.code})`).join(", "), f._count.sectionSubjects, f.user?.isBlocked ? "Blocked" : "Active"]);
  return _writeXlsx("Faculty", headers, rows);
};

export const exportEnrollmentReport = async () => {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { is_current: true },
    include: {
      student: { select: { name: true, roll_no: true, enrollment_no: true, department: { select: { name: true } }, course: { select: { name: true } }, program: { select: { name: true } } } },
      section: { select: { name: true, batch: true } },
    },
    orderBy: [{ dept_id: "asc" }, { semester: "asc" }],
  });

  const headers = ["Student Name", "Roll No", "Enrollment No", "Department", "Program", "Course", "Section", "Semester", "Academic Year", "Batch", "Status", "Remarks"];
  const rows = enrollments.map((e) => [e.student?.name || "", e.student?.roll_no || "", e.student?.enrollment_no || "", e.student?.department?.name || "", e.student?.program?.name || "", e.student?.course?.name || "", e.section?.name || "", e.semester, e.academic_year, e.section?.batch || "", e.status, e.remarks || ""]);
  return _writeXlsx("Enrollments", headers, rows);
};

// ── internal xlsx helper ───────────────────────────────────────
const _writeXlsx = (sheet, headers, rows) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, ws, sheet);
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ═══════════════════════════════════════════════════════════════
// STUDENT ANALYTICS
// ═══════════════════════════════════════════════════════════════
export const getStudentAnalytics = async () => {
  const [
    totalStudents, totalFaculty,
    enrollmentsByStatus,
    genderStats,
    deptStats,
    semesterStats,
    admissionModeStats,
    hostellerStats,
    transportStats,
    monthlyEnrollments,
    sectionStrength,
    batchStats,
    programStats,
    courseStats,
    categoryStats,
    religionStats,
    topSections,
    recentEnrollments,
    detainedByDept,
    passedByYear,
  ] = await Promise.all([
    prisma.student.count({ where: { deleted_at: null } }),
    prisma.faculty.count({ where: { deleted_at: null } }),

    // Enrollment status breakdown
    prisma.studentEnrollment.groupBy({
      by: ["status"],
      where: { is_current: true },
      _count: true,
    }),

    // Gender
    prisma.student.groupBy({
      by: ["gender"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Per department
    prisma.student.groupBy({
      by: ["dept_id"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Per semester (current enrollments)
    prisma.studentEnrollment.groupBy({
      by: ["semester"],
      where: { is_current: true },
      _count: true,
    }),

    // Admission mode
    prisma.student.groupBy({
      by: ["mode_of_admission"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Hosteller count
    prisma.student.groupBy({
      by: ["is_hosteller"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Transport count
    prisma.student.groupBy({
      by: ["is_using_transport"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Monthly enrollments (last 12 months)
    prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "enrolled_at"), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM "StudentEnrollment"
      WHERE "enrolled_at" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `,

    // Section strength (top 15)
    prisma.section.findMany({
      where: { deleted_at: null },
      select: {
        id: true, name: true, semester: true, batch: true,
        course: { select: { name: true, program: { select: { name: true } } } },
        _count: { select: { students: true } },
      },
      orderBy: { students: { _count: "desc" } },
      take: 15,
    }),

    // Batch year distribution
    prisma.student.groupBy({
      by: ["batch_year"],
      where: { deleted_at: null, batch_year: { not: null } },
      _count: true,
      orderBy: { batch_year: "asc" },
    }),

    // Program distribution
    prisma.student.groupBy({
      by: ["program_id"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Course distribution
    prisma.student.groupBy({
      by: ["course_id"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Category (general/obc/sc/st)
    prisma.student.groupBy({
      by: ["category"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Religion
    prisma.student.groupBy({
      by: ["religion"],
      where: { deleted_at: null },
      _count: true,
    }),

    // Top sections by student count with details
    prisma.section.findMany({
      where: { deleted_at: null },
      select: {
        id: true, name: true, semester: true, batch: true,
        course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } },
        _count: { select: { students: true } },
      },
      orderBy: { students: { _count: "desc" } },
      take: 10,
    }),

    // Recent 10 enrollments
    prisma.studentEnrollment.findMany({
      where: { is_current: true },
      orderBy: { enrolled_at: "desc" },
      take: 10,
      include: {
        student: { select: { name: true, first_name: true, last_name: true, roll_no: true } },
        section: { select: { name: true, semester: true } },
        department: { select: { name: true } },
      },
    }),

    // Detained by dept
    prisma.studentEnrollment.groupBy({
      by: ["dept_id"],
      where: { is_current: true, status: "DETAINED" },
      _count: true,
    }),

    // Passed by academic year
    prisma.studentEnrollment.groupBy({
      by: ["academic_year"],
      where: { status: "PASSED" },
      _count: true,
      orderBy: { academic_year: "asc" },
    }),
  ]);

  // Enrich dept stats with names
  const depts = await prisma.department.findMany({ select: { id: true, name: true } });
  const programs = await prisma.program.findMany({ select: { id: true, name: true } });
  const courses = await prisma.course.findMany({ select: { id: true, name: true } });
  const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]));
  const programMap = Object.fromEntries(programs.map((p) => [p.id, p.name]));
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.name]));

  const statusMap = Object.fromEntries(enrollmentsByStatus.map((e) => [e.status, e._count]));

  return {
    overview: {
      total: totalStudents,
      active: statusMap["ACTIVE"] ?? 0,
      detained: statusMap["DETAINED"] ?? 0,
      passed: statusMap["PASSED"] ?? 0,
      left: statusMap["LEFT"] ?? 0,
      transferred: statusMap["TRANSFERRED"] ?? 0,
      faculty: totalFaculty,
    },
    gender: genderStats.map((g) => ({
      name: g.gender || "Not Specified",
      value: g._count,
    })),
    byDepartment: deptStats.map((d) => ({
      name: deptMap[d.dept_id] || "Unknown",
      students: d._count,
      detained: detainedByDept.find((x) => x.dept_id === d.dept_id)?._count ?? 0,
    })).sort((a, b) => b.students - a.students),
    bySemester: semesterStats.map((s) => ({
      name: `Sem ${s.semester}`,
      students: s._count,
    })).sort((a, b) => a.name.localeCompare(b.name)),
    byProgram: programStats.map((p) => ({
      name: programMap[p.program_id] || "Unknown",
      students: p._count,
    })).sort((a, b) => b.students - a.students),
    byCourse: courseStats.map((c) => ({
      name: courseMap[c.course_id] || "Unknown",
      students: c._count,
    })).sort((a, b) => b.students - a.students),
    admissionMode: admissionModeStats.map((a) => ({
      name: a.mode_of_admission || "Not Specified",
      value: a._count,
    })),
    hosteller: {
      hostellers: hostellerStats.find((h) => h.is_hosteller === true)?._count ?? 0,
      dayScholars: hostellerStats.find((h) => h.is_hosteller === false)?._count ?? 0,
    },
    transport: {
      using: transportStats.find((t) => t.is_using_transport === true)?._count ?? 0,
      notUsing: transportStats.find((t) => t.is_using_transport === false)?._count ?? 0,
    },
    monthlyEnrollments: monthlyEnrollments,
    sectionStrength: sectionStrength.map((s) => ({
      id: s.id,
      name: `${s.course?.program?.name || ""} ${s.course?.name || ""} Sem ${s.semester} ${s.name}`.trim(),
      students: s._count.students,
      batch: s.batch,
    })),
    topSections: topSections.map((s) => ({
      id: s.id,
      name: s.name,
      course: s.course?.name,
      program: s.course?.program?.name,
      dept: s.course?.program?.department?.name,
      semester: s.semester,
      batch: s.batch,
      students: s._count.students,
    })),
    batchDistribution: batchStats.map((b) => ({
      name: String(b.batch_year),
      students: b._count,
    })),
    category: categoryStats.map((c) => ({
      name: c.category || "Not Specified",
      value: c._count,
    })),
    religion: religionStats.map((r) => ({
      name: r.religion || "Not Specified",
      value: r._count,
    })),
    recentEnrollments: recentEnrollments.map((e) => ({
      name: e.student?.first_name + " " + e.student?.last_name,
      roll: e.student?.roll_no,
      dept: e.department?.name,
      section: e.section?.name,
      semester: e.semester,
      enrolledAt: e.enrolled_at,
    })),
    passedByYear: passedByYear.map((p) => ({
      year: p.academic_year,
      count: p._count,
    })),
  };
};

// ═══════════════════════════════════════════════════════════════
// ADVANCED EXPORT — multi-sheet Excel
// ═══════════════════════════════════════════════════════════════
export const exportStudentsAdvanced = async (filters = {}) => {
  const where = { deleted_at: null };
  if (filters.dept_id)     where.dept_id     = filters.dept_id;
  if (filters.section_id)  where.section_id  = filters.section_id;
  if (filters.program_id)  where.program_id  = filters.program_id;
  if (filters.course_id)   where.course_id   = filters.course_id;
  if (filters.batch_year)  where.batch_year  = Number(filters.batch_year);

  const students = await prisma.student.findMany({
    where,
    include: {
      user:       { select: { email: true, isBlocked: true, createdAt: true } },
      department: { select: { name: true } },
      program:    { select: { name: true } },
      course:     { select: { name: true } },
      section: {
        select: {
          name: true, semester: true, batch: true,
          course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } },
        },
      },
      enrollments: {
        orderBy: { enrolled_at: "desc" },
        include: { section: { select: { name: true, semester: true } } },
      },
    },
    orderBy: [{ dept_id: "asc" }, { section_id: "asc" }, { name: "asc" }],
  });

  const wb = xlsx.utils.book_new();

  // ── Helper: safe sheet name (Excel max 31 chars, no special chars) ──
  const safeSheet = (name) =>
    (name || "Sheet").replace(/[\\/:*?[\]]/g, "").slice(0, 31);

  // ── Full row builder ──
  const fullRow = (s) => {
    const cur = s.enrollments.find((e) => e.is_current);
    return [
      s.name, s.first_name, s.last_name,
      s.roll_no || "", s.enrollment_no || "",
      s.user?.email || "",
      s.phone || "", s.alt_contact_number || "",
      s.personal_email || "",
      s.gender || "", s.dob ? new Date(s.dob).toLocaleDateString("en-IN") : "",
      s.aadhar_no || "", s.pan_no || "",
      s.father_name || "", s.father_phone || "",
      s.mother_name || "", s.mother_phone || "",
      s.department?.name || "", s.program?.name || "",
      s.course?.name || "", s.section?.name || "",
      cur?.semester ?? s.section?.semester ?? "",
      s.section?.batch || "", cur?.academic_year || "",
      cur?.status || "ACTIVE",
      s.mode_of_admission || "", s.admission_year || "",
      s.batch_year || "", s.session || "",
      s.is_hosteller ? "Yes" : "No",
      s.is_using_transport ? "Yes" : "No",
      s.category || "", s.religion || "", s.group || "",
      s.address || "", s.city || "", s.state || "", s.pincode || "",
      s.biometric_id || "", s.group_no || "",
      s.user?.isBlocked ? "Blocked" : "Active",
      s.user?.createdAt ? new Date(s.user.createdAt).toLocaleDateString("en-IN") : "",
    ];
  };

  const FULL_HEADERS = [
    "Full Name", "First Name", "Last Name",
    "Roll Number", "Enrollment No",
    "Login Email", "Phone", "Alt Phone", "Personal Email",
    "Gender", "Date of Birth",
    "Aadhar No", "PAN No",
    "Father Name", "Father Phone",
    "Mother Name", "Mother Phone",
    "Department", "Program", "Course", "Section",
    "Semester", "Batch", "Academic Year", "Enrollment Status",
    "Admission Mode", "Admission Year",
    "Batch Year", "Session",
    "Hosteller", "Transport",
    "Category", "Religion", "Group",
    "Address", "City", "State", "Pincode",
    "Biometric ID", "House No",
    "Account Status", "Created At",
  ];

  // ── 1. SUMMARY SHEET ──────────────────────────────────────────
  const statusCounts = {};
  students.forEach((s) => {
    const cur = s.enrollments.find((e) => e.is_current);
    const st = cur?.status || "ACTIVE";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });

  const deptCounts = {};
  students.forEach((s) => {
    const d = s.department?.name || "Unknown";
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  const semCounts = {};
  students.forEach((s) => {
    const cur = s.enrollments.find((e) => e.is_current);
    const sem = cur?.semester ?? s.section?.semester ?? "?";
    semCounts[sem] = (semCounts[sem] || 0) + 1;
  });

  const genderCounts = {};
  students.forEach((s) => {
    const g = s.gender || "Not Specified";
    genderCounts[g] = (genderCounts[g] || 0) + 1;
  });

  const courseCounts = {};
  students.forEach((s) => {
    const c = s.course?.name || "Unknown";
    courseCounts[c] = (courseCounts[c] || 0) + 1;
  });

  const summaryRows = [
    ["EIT FARIDABAD — STUDENT EXPORT SUMMARY"],
    ["Generated On", new Date().toLocaleString("en-IN")],
    ["Total Students Exported", students.length],
    [],
    ["─── ENROLLMENT STATUS ───"],
    ["Status", "Count"],
    ...Object.entries(statusCounts).map(([k, v]) => [k, v]),
    [],
    ["─── BY DEPARTMENT ───"],
    ["Department", "Students"],
    ...Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
    [],
    ["─── BY SEMESTER ───"],
    ["Semester", "Students"],
    ...Object.entries(semCounts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => [`Semester ${k}`, v]),
    [],
    ["─── BY GENDER ───"],
    ["Gender", "Count"],
    ...Object.entries(genderCounts).map(([k, v]) => [k, v]),
    [],
    ["─── BY COURSE ───"],
    ["Course", "Students"],
    ...Object.entries(courseCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
    [],
    ["─── HOSTEL & TRANSPORT ───"],
    ["Hostellers", students.filter((s) => s.is_hosteller).length],
    ["Day Scholars", students.filter((s) => !s.is_hosteller).length],
    ["Using Transport", students.filter((s) => s.is_using_transport).length],
    ["Not Using Transport", students.filter((s) => !s.is_using_transport).length],
  ];

  const wsSummary = xlsx.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── 2. ALL STUDENTS ───────────────────────────────────────────
  const wsAll = xlsx.utils.aoa_to_sheet([FULL_HEADERS, ...students.map(fullRow)]);
  wsAll["!cols"] = FULL_HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, wsAll, "All Students");

  // ── 3. STATUS SHEETS ─────────────────────────────────────────
  const STATUS_SHEETS = ["ACTIVE", "DETAINED", "PASSED", "LEFT", "TRANSFERRED"];
  for (const status of STATUS_SHEETS) {
    const filtered = students.filter((s) => {
      const cur = s.enrollments.find((e) => e.is_current);
      return (cur?.status || "ACTIVE") === status;
    });
    if (filtered.length === 0) continue;
    const ws = xlsx.utils.aoa_to_sheet([FULL_HEADERS, ...filtered.map(fullRow)]);
    ws["!cols"] = FULL_HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    xlsx.utils.book_append_sheet(wb, ws, label);
  }

  // ── 4. PROMOTED SHEET (students who have >1 enrollment = were promoted) ──
  const promoted = students.filter((s) => s.enrollments.length > 1);
  if (promoted.length > 0) {
    const promHeaders = ["Name", "Roll No", "Email", "Department", "Course",
      "Current Sem", "Previous Sem", "Academic Year", "Section"];
    const promRows = promoted.map((s) => {
      const cur  = s.enrollments.find((e) => e.is_current);
      const prev = s.enrollments.filter((e) => !e.is_current).sort((a, b) => b.semester - a.semester)[0];
      return [
        s.name, s.roll_no || "", s.user?.email || "",
        s.department?.name || "", s.course?.name || "",
        cur?.semester ?? "", prev?.semester ?? "",
        cur?.academic_year || "", s.section?.name || "",
      ];
    });
    const wsPromoted = xlsx.utils.aoa_to_sheet([promHeaders, ...promRows]);
    wsPromoted["!cols"] = promHeaders.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    xlsx.utils.book_append_sheet(wb, wsPromoted, "Promoted");
  }

  // ── 5. GENDER ANALYSIS SHEET ─────────────────────────────────
  const genderAnalysis = [];
  const depts = [...new Set(students.map((s) => s.department?.name || "Unknown"))].sort();
  genderAnalysis.push(["Department", "Male", "Female", "Other", "Not Specified", "Total"]);
  for (const dept of depts) {
    const ds = students.filter((s) => (s.department?.name || "Unknown") === dept);
    genderAnalysis.push([
      dept,
      ds.filter((s) => s.gender === "MALE").length,
      ds.filter((s) => s.gender === "FEMALE").length,
      ds.filter((s) => s.gender === "OTHER").length,
      ds.filter((s) => !s.gender).length,
      ds.length,
    ]);
  }
  genderAnalysis.push([
    "TOTAL",
    students.filter((s) => s.gender === "MALE").length,
    students.filter((s) => s.gender === "FEMALE").length,
    students.filter((s) => s.gender === "OTHER").length,
    students.filter((s) => !s.gender).length,
    students.length,
  ]);
  const wsGender = xlsx.utils.aoa_to_sheet(genderAnalysis);
  wsGender["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 10 }];
  xlsx.utils.book_append_sheet(wb, wsGender, "Gender Analysis");

  // ── 6. DEPARTMENT-WISE SHEET ──────────────────────────────────
  const deptAnalysis = [["Department", "Program", "Course", "Semester", "Section", "Active", "Detained", "Passed", "Total"]];
  const sections = await prisma.section.findMany({
    where: { deleted_at: null },
    include: {
      course: { include: { program: { include: { department: true } } } },
      _count: { select: { students: true } },
    },
    orderBy: [{ course: { program: { department: { name: "asc" } } } }, { semester: "asc" }],
  });
  for (const sec of sections) {
    const secStudents = students.filter((s) => s.section_id === sec.id);
    deptAnalysis.push([
      sec.course?.program?.department?.name || "",
      sec.course?.program?.name || "",
      sec.course?.name || "",
      sec.semester,
      sec.name,
      secStudents.filter((s) => {
        const cur = s.enrollments.find((e) => e.is_current);
        return (cur?.status || "ACTIVE") === "ACTIVE";
      }).length,
      secStudents.filter((s) => {
        const cur = s.enrollments.find((e) => e.is_current);
        return cur?.status === "DETAINED";
      }).length,
      secStudents.filter((s) => {
        const cur = s.enrollments.find((e) => e.is_current);
        return cur?.status === "PASSED";
      }).length,
      secStudents.length,
    ]);
  }
  const wsDept = xlsx.utils.aoa_to_sheet(deptAnalysis);
  wsDept["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  xlsx.utils.book_append_sheet(wb, wsDept, "Department-wise");

  // ── 7. PER-SECTION SHEETS (using export format) ───────────────
  const sectionGroups = {};
  students.forEach((s) => {
    const key = s.section_id || "no-section";
    if (!sectionGroups[key]) sectionGroups[key] = { section: s.section, students: [] };
    sectionGroups[key].students.push(s);
  });

  // Section-wise summary sheet first
  const secSummaryRows = [["Program", "Course", "Section", "Semester", "Batch", "Total", "Active", "Detained", "Passed", "Hostellers", "Transport"]];
  for (const { section: sec, students: ss } of Object.values(sectionGroups)) {
    const curStatus = (s) => s.enrollments.find((e) => e.is_current)?.status || "ACTIVE";
    secSummaryRows.push([
      sec?.course?.program?.name || "", sec?.course?.name || "",
      sec?.name || "Unknown", sec?.semester || "", sec?.batch || "",
      ss.length,
      ss.filter((s) => curStatus(s) === "ACTIVE").length,
      ss.filter((s) => curStatus(s) === "DETAINED").length,
      ss.filter((s) => curStatus(s) === "PASSED").length,
      ss.filter((s) => s.is_hosteller).length,
      ss.filter((s) => s.is_using_transport).length,
    ]);
  }
  const wsSecSummary = xlsx.utils.aoa_to_sheet(secSummaryRows);
  wsSecSummary["!cols"] = secSummaryRows[0].map((h) => ({ wch: Math.max(String(h).length + 2, 12) }));
  xlsx.utils.book_append_sheet(wb, wsSecSummary, "Section-wise Summary");

  // Individual section sheets
  const usedNames = new Set(["Summary", "All Students", "Active", "Detained", "Passed", "Left", "Transferred", "Promoted", "Gender Analysis", "Department-wise", "Section-wise Summary"]);

  for (const { section: sec, students: ss } of Object.values(sectionGroups)) {
    if (!sec) continue;
    // Use fmtSection export format
    const prog   = sec.course?.program?.name || "";
    const course = sec.course?.name || "";
    const raw    = [prog, course, sec.semester ? `${sec.semester} Sem` : "", sec.name].filter(Boolean).join(" ");
    let sheetName = raw.replace(/[\\/:*?[\]]/g, "").slice(0, 31);

    // Deduplicate sheet names
    if (usedNames.has(sheetName)) {
      let i = 2;
      while (usedNames.has(`${sheetName.slice(0, 28)} ${i}`)) i++;
      sheetName = `${sheetName.slice(0, 28)} ${i}`;
    }
    usedNames.add(sheetName);

    const secHeaders = [
      "Roll No", "Name", "Email", "Phone",
      "Gender", "DOB", "Father", "Father Phone", "Mother", "Mother Phone",
      "Enrollment Status", "Academic Year", "Semester",
      "Hosteller", "Transport", "Category", "Aadhar No",
      "City", "State", "Account Status",
    ];
    const secRows = ss.map((s) => {
      const cur = s.enrollments.find((e) => e.is_current);
      return [
        s.roll_no || "", s.name, s.user?.email || "", s.phone || "",
        s.gender || "", s.dob ? new Date(s.dob).toLocaleDateString("en-IN") : "",
        s.father_name || "", s.father_phone || "",
        s.mother_name || "", s.mother_phone || "",
        cur?.status || "ACTIVE", cur?.academic_year || "", cur?.semester ?? sec.semester,
        s.is_hosteller ? "Yes" : "No",
        s.is_using_transport ? "Yes" : "No",
        s.category || "", s.aadhar_no || "",
        s.city || "", s.state || "",
        s.user?.isBlocked ? "Blocked" : "Active",
      ];
    });

    const ws = xlsx.utils.aoa_to_sheet([secHeaders, ...secRows]);
    ws["!cols"] = secHeaders.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
  }

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};