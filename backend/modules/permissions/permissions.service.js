// backend/modules/permissions/permissions.service.js
// Uses EXISTING schema models: Role, Permission, RolePermission, UserRole, UserPermission
// NO new tables needed - works with what's already in DB

import prisma from "../../utils/prisma.js";

// ─────────────────────────────────────────────────────────────
// ALL AVAILABLE PERMISSIONS — seeded into Permission table
// ─────────────────────────────────────────────────────────────
export const ALL_PERMISSIONS = [
  { key: "students.view", module: "Students", action: "view", label: "View Students", description: "See student list and profiles" },
  { key: "students.create", module: "Students", action: "create", label: "Add Students", description: "Create and bulk upload students" },
  { key: "students.update", module: "Students", action: "update", label: "Edit Students", description: "Edit student records" },
  { key: "students.block", module: "Students", action: "block", label: "Block/Unblock Students", description: "Block or unblock student accounts" },
  { key: "students.promote", module: "Students", action: "promote", label: "Promote Students", description: "Bulk promote/demote students" },
  { key: "students.export", module: "Students", action: "export", label: "Export Students", description: "Download student data" },
  { key: "faculty.view", module: "Faculty", action: "view", label: "View Faculty", description: "See faculty list and profiles" },
  { key: "faculty.create", module: "Faculty", action: "create", label: "Add Faculty", description: "Create and bulk upload faculty" },
  { key: "faculty.update", module: "Faculty", action: "update", label: "Edit Faculty", description: "Edit faculty records" },
  { key: "faculty.export", module: "Faculty", action: "export", label: "Export Faculty", description: "Download faculty data" },
  { key: "academic.view", module: "Academic", action: "view", label: "View Academic", description: "View departments, programs, courses" },
  { key: "academic.create", module: "Academic", action: "create", label: "Manage Academic", description: "Create/edit departments, programs" },
  { key: "sections.view", module: "Academic", action: "view", label: "View Sections", description: "View sections and enrollments" },
  { key: "sections.create", module: "Academic", action: "create", label: "Manage Sections", description: "Create/edit sections" },
  { key: "section.assign_subject", module: "Academic", action: "assign", label: "Assign Subjects", description: "Assign subjects to sections" },
  { key: "curriculum.view", module: "Academic", action: "view", label: "View Curriculum", description: "View curriculum mapping" },
  { key: "curriculum.create", module: "Academic", action: "create", label: "Manage Curriculum", description: "Create and edit curriculum" },
  { key: "timetable.view", module: "Timetable", action: "view", label: "View Timetable", description: "See class schedules" },
  { key: "timetable.manage", module: "Timetable", action: "manage", label: "Manage Timetable", description: "Create/edit/generate timetable" },
  { key: "attendance.view", module: "Attendance", action: "view", label: "View Attendance", description: "See attendance records" },
  { key: "attendance.manage", module: "Attendance", action: "manage", label: "Mark Attendance", description: "Mark and edit attendance" },
  { key: "leave.view", module: "Leave", action: "view", label: "View Leave", description: "See leave applications" },
  { key: "leave.apply", module: "Leave", action: "apply", label: "Apply Leave", description: "Submit leave applications" },
  { key: "leave.approve", module: "Leave", action: "approve", label: "Approve Leave", description: "Approve/reject leave requests" },
  { key: "leave.manage", module: "Leave", action: "manage", label: "Manage Leave Rules", description: "Configure leave types and rules" },
  { key: "exam.view", module: "Exam", action: "view", label: "View Exams", description: "See exam schedule and results" },
  { key: "exam.manage", module: "Exam", action: "manage", label: "Manage Exams", description: "Create exams, seating, hall tickets" },
  { key: "marks.view", module: "Exam", action: "view", label: "View Marks", description: "See student marks" },
  { key: "marks.manage", module: "Exam", action: "manage", label: "Enter Marks", description: "Enter and edit student marks" },
  { key: "assignment.view", module: "Assignments", action: "view", label: "View Assignments", description: "See assignments" },
  { key: "assignment.manage", module: "Assignments", action: "manage", label: "Manage Assignments", description: "Create and grade assignments" },
  { key: "fee.view", module: "Fee", action: "view", label: "View Fee", description: "See student fee records" },
  { key: "fee.manage", module: "Fee", action: "manage", label: "Manage Fee", description: "Collect fee, manage structures" },
  { key: "hr.view", module: "HR", action: "view", label: "View HR", description: "See salary slips and attendance" },
  { key: "hr.manage", module: "HR", action: "manage", label: "Manage HR & Payroll", description: "Generate slips, manage leave rules" },
  { key: "training.view", module: "Training", action: "view", label: "View Training", description: "See training sessions" },
  { key: "training.manage", module: "Training", action: "manage", label: "Manage Training", description: "Create and manage training" },
  { key: "skillcard.view", module: "Training", action: "view", label: "View Skill Cards", description: "See student skill cards" },
  { key: "skillcard.manage", module: "Training", action: "manage", label: "Manage Skill Cards", description: "Update and export skill cards" },
  { key: "feedback.view", module: "Feedback", action: "view", label: "View Feedback", description: "See feedback forms" },
  { key: "feedback.create", module: "Feedback", action: "create", label: "Create Feedback", description: "Create feedback forms" },
  { key: "feedback.results", module: "Feedback", action: "results", label: "View Feedback Results", description: "See responses and reports" },
  { key: "groups.view", module: "System", action: "view", label: "View Groups", description: "See student and faculty groups" },
  { key: "groups.create", module: "System", action: "create", label: "Manage Groups", description: "Create and manage groups" },
  { key: "reports.students", module: "Reports", action: "view", label: "Student Reports", description: "Access student analytics" },
  { key: "reports.faculty", module: "Reports", action: "view", label: "Faculty Reports", description: "Access faculty reports" },
  { key: "audit.view", module: "System", action: "view", label: "View Audit Trail", description: "See system audit logs" },
  { key: "admins.view", module: "System", action: "view", label: "View Admins", description: "See admin accounts" },
  { key: "admins.create", module: "System", action: "create", label: "Manage Admins", description: "Create and edit admin accounts" },
];

// ─────────────────────────────────────────────────────────────
// SEED permissions into Permission table
// ─────────────────────────────────────────────────────────────
export const seedPermissions = async () => {
  for (const p of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: p,
      update: { label: p.label, description: p.description },
    }).catch(() => { });
  }
  return { seeded: ALL_PERMISSIONS.length };
};

// ─────────────────────────────────────────────────────────────
// PERMISSION GROUPS = ROLES in our schema
// A "Permission Group" is just a Role with is_system=false
// ─────────────────────────────────────────────────────────────
export const listGroups = async () => {
  const roles = await prisma.role.findMany({
    where: { is_active: true },
    include: {
      rolePermissions: { include: { permission: { select: { key: true, label: true, module: true } } } },
      _count: { select: { userRoles: true } },
    },
    orderBy: { name: "asc" },
  });

  return roles.map(r => ({
    id: r.id,
    name: r.label || r.name,
    description: r.description,
    color: "blue",
    permissions: r.rolePermissions.map(rp => rp.permission.key),
    user_count: r._count.userRoles,
    is_system: r.is_system,
    is_active: r.is_active,
  }));
};

export const createGroup = async ({ name, description, color, permissions }, created_by) => {
  // Ensure permissions are seeded first
  await seedPermissions();

  const roleName = name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

  // Get permission records
  const permRecords = await prisma.permission.findMany({
    where: { key: { in: permissions || [] } },
  });

  const role = await prisma.role.create({
    data: {
      name: roleName,
      label: name,
      description: description || null,
      is_system: false,
      is_active: true,
      rolePermissions: {
        create: permRecords.map(p => ({ permission_id: p.id })),
      },
    },
    include: { rolePermissions: { include: { permission: true } } },
  });

  return {
    id: role.id,
    name: role.label,
    description: role.description,
    permissions: role.rolePermissions.map(rp => rp.permission.key),
  };
};

export const updateGroup = async (id, { name, description, permissions, is_active }) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw Object.assign(new Error("Group not found"), { status: 404 });

  // Update basic fields
  await prisma.role.update({
    where: { id },
    data: {
      ...(name && { label: name }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active }),
    },
  });

  // Update permissions if provided
  if (permissions) {
    await seedPermissions();
    const permRecords = await prisma.permission.findMany({ where: { key: { in: permissions } } });
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role_id: id } }),
      prisma.rolePermission.createMany({
        data: permRecords.map(p => ({ role_id: id, permission_id: p.id })),
        skipDuplicates: true,
      }),
    ]);
  }

  return getGroupById(id);
};

const getGroupById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { rolePermissions: { include: { permission: true } } },
  });
  if (!role) return null;
  return {
    id: role.id,
    name: role.label || role.name,
    description: role.description,
    permissions: role.rolePermissions.map(rp => rp.permission.key),
  };
};

export const deleteGroup = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { userRoles: true } } },
  });
  if (!role) throw Object.assign(new Error("Group not found"), { status: 404 });
  if (role.is_system) throw Object.assign(new Error("Cannot delete system roles"), { status: 403 });
  if (role._count.userRoles > 0)
    throw Object.assign(new Error(`Cannot delete — ${role._count.userRoles} user(s) assigned`), { status: 400 });

  await prisma.rolePermission.deleteMany({ where: { role_id: id } });
  await prisma.role.delete({ where: { id } });
  return { deleted: id };
};

// ─────────────────────────────────────────────────────────────
// ASSIGN GROUPS (Roles) TO USER
// ─────────────────────────────────────────────────────────────
export const assignGroupsToUser = async (user_id, group_ids, assigned_by) => {
  const results = [];
  for (const role_id of group_ids) {
    const r = await prisma.userRole.upsert({
      where: { user_id_role_id_dept_id_section_id: { user_id, role_id, dept_id: "", section_id: "" } },
      create: { user_id, role_id, granted_by: assigned_by, is_active: true },
      update: { is_active: true, granted_by: assigned_by },
    });
    results.push(r);
  }
  return results;
};

export const removeGroupFromUser = async (user_id, group_id) => {
  await prisma.userRole.updateMany({
    where: { user_id, role_id: group_id, is_active: true },
    data: { is_active: false },
  });
  return { removed: true };
};

// ─────────────────────────────────────────────────────────────
// INDIVIDUAL PERMISSIONS (UserPermission table)
// ─────────────────────────────────────────────────────────────
export const setUserPermissions = async (user_id, permission_keys) => {
  await seedPermissions();

  const perms = await prisma.permission.findMany({ where: { key: { in: permission_keys } } });

  // Remove old ones, add new ones
  await prisma.userPermission.deleteMany({ where: { user_id } });
  if (perms.length) {
    await prisma.userPermission.createMany({
      data: perms.map(p => ({
        user_id,
        permission_id: p.id,
        type: "GRANT",
      })),
      skipDuplicates: true,
    });
  }

  return { user_id, permissions: permission_keys };
};

// ─────────────────────────────────────────────────────────────
// GET EFFECTIVE PERMISSIONS FOR USER
// ─────────────────────────────────────────────────────────────
export const getUserPermissionSummary = async (user_id) => {
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    select: {
      id: true, email: true, role: true,
      admin: { select: { name: true } },
      faculty: { select: { name: true, department: { select: { name: true } } } },
      userRoles: {
        where: { is_active: true },
        include: {
          role: {
            include: { rolePermissions: { include: { permission: { select: { key: true, label: true } } } } },
          },
        },
      },
      userPermissions: {
        include: { permission: { select: { key: true, label: true } } },
      },
    },
  });

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const groups = user.userRoles.map(ur => ({
    id: ur.role_id,
    name: ur.role.label || ur.role.name,
    dept_id: ur.dept_id,
    section_id: ur.section_id,
    permissions: ur.role.rolePermissions.map(rp => rp.permission.key),
  }));

  const groupPerms = groups.flatMap(g => g.permissions);
  const ownPerms = user.userPermissions
    .filter(up => up.type === "GRANT")
    .map(up => up.permission.key);

  const effective = [...new Set([...ownPerms, ...groupPerms])];

  return {
    user_id: user.id,
    email: user.email,
    role: user.role,
    name: user.admin?.name || user.faculty?.name,
    department: user.faculty?.department?.name,
    own_permissions: ownPerms,
    groups,
    effective_permissions: effective,
  };
};

// ─────────────────────────────────────────────────────────────
// SEARCH USERS
// ─────────────────────────────────────────────────────────────
export const searchUsers = async (q, limit = 15) => {
  const where = q ? {
    OR: [
      { email: { contains: q, mode: "insensitive" } },
      { admin: { name: { contains: q, mode: "insensitive" } } },
      { faculty: { name: { contains: q, mode: "insensitive" } } },
    ],
  } : {};

  return prisma.user.findMany({
    where,
    take: parseInt(limit) || 15,
    select: {
      id: true, email: true, role: true,
      admin: { select: { name: true } },
      faculty: { select: { name: true, emp_id: true, department: { select: { name: true } } } },
      userRoles: {
        where: { is_active: true },
        include: { role: { select: { id: true, label: true, name: true } } },
      },
      userPermissions: { include: { permission: { select: { key: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─────────────────────────────────────────────────────────────
// DEPT-SCOPED ROLE ASSIGNMENT
// faculty ko specific dept ke liye TT Coordinator assign karna
// ─────────────────────────────────────────────────────────────
export const assignGroupWithScope = async (user_id, role_id, { dept_ids = [], section_ids = [] }, assigned_by) => {
  const results = [];

  if (dept_ids.length) {
    for (const dept_id of dept_ids) {
      const r = await prisma.userRole.upsert({
        where: { user_id_role_id_dept_id_section_id: { user_id, role_id, dept_id, section_id: "" } },
        create: { user_id, role_id, dept_id, granted_by: assigned_by, is_active: true },
        update: { is_active: true, granted_by: assigned_by },
      });
      results.push(r);
    }
  } else if (section_ids.length) {
    for (const section_id of section_ids) {
      const r = await prisma.userRole.upsert({
        where: { user_id_role_id_dept_id_section_id: { user_id, role_id, dept_id: "", section_id } },
        create: { user_id, role_id, section_id, granted_by: assigned_by, is_active: true },
        update: { is_active: true, granted_by: assigned_by },
      });
      results.push(r);
    }
  } else {
    // Institute-wide (no scope)
    const r = await prisma.userRole.upsert({
      where: { user_id_role_id_dept_id_section_id: { user_id, role_id, dept_id: "", section_id: "" } },
      create: { user_id, role_id, granted_by: assigned_by, is_active: true },
      update: { is_active: true, granted_by: assigned_by },
    });
    results.push(r);
  }

  return results;
};