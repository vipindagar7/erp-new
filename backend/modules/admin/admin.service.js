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