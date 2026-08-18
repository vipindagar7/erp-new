// backend/modules/role/role.service.js
import prisma from "../../utils/prisma.js";

const PREDEFINED_ROLES = [
  { name: "SUPER_ADMIN", label: "Super Admin", is_system: true },
  { name: "ADMIN", label: "Admin", is_system: true },
  { name: "FACULTY", label: "Faculty", is_system: true },
  { name: "NON_TEACHING", label: "Non-Teaching Staff", is_system: true },
  { name: "STUDENT", label: "Student", is_system: true },
  { name: "HOD", label: "Head of Department", is_system: true },
  { name: "DEPT_ADMIN", label: "Department Admin", is_system: true },
  { name: "EXAM_COORDINATOR", label: "Exam Coordinator", is_system: false },
  { name: "ACCOUNT", label: "Account Officer", is_system: false },
  { name: "LIBRARIAN", label: "Librarian", is_system: false },
  { name: "LAB_INCHARGE", label: "Lab In-Charge", is_system: false },
  { name: "HOSTEL_WARDEN", label: "Hostel Warden", is_system: false },
  { name: "PLACEMENT", label: "Placement Officer", is_system: false },
  { name: "IT_ADMIN", label: "IT Admin", is_system: false },
  { name: "TRANSPORT", label: "Transport Officer", is_system: false },
  { name: "CLASS_COORDINATOR", label: "Class Coordinator", is_system: false },
];

export const seedRoles = async () => {
  const results = [];
  for (const role of PREDEFINED_ROLES) {
    try {
      const r = await prisma.role.upsert({
        where: { name: role.name },
        update: { label: role.label, is_system: role.is_system },
        create: { ...role, description: `${role.label} role`, is_active: true },
      });
      results.push({ name: r.name, id: r.id });
    } catch (e) { results.push({ name: role.name, error: e.message }); }
  }
  return results;
};

export const getRoles = async ({ include_inactive = false } = {}) => {
  const where = include_inactive ? {} : { is_active: true };
  return prisma.role.findMany({
    where,
    include: {
      rolePermissions: { include: { permission: { select: { key: true, label: true, module: true } } } },
      _count: { select: { userRoles: true } },
    },
    orderBy: [{ is_system: "desc" }, { name: "asc" }],
  });
};

export const getRoleById = async (id) =>
  prisma.role.findUnique({
    where: { id },
    include: { rolePermissions: { include: { permission: true } }, _count: { select: { userRoles: true } } },
  });

export const createRole = async (data) => {
  const name = data.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return prisma.role.create({
    data: { name, label: data.label, description: data.description || null, is_system: false, is_active: data.is_active !== false },
  });
};

export const updateRole = async (id, data) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  const u = {};
  if (data.label !== undefined) u.label = data.label;
  if (data.description !== undefined) u.description = data.description;
  if (data.is_active !== undefined) u.is_active = Boolean(data.is_active);
  if (!role.is_system && data.name) u.name = data.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return prisma.role.update({ where: { id }, data: u });
};

export const deleteRole = async (id) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  if (role.is_system) throw Object.assign(new Error("Cannot delete system roles"), { status: 403 });
  const count = await prisma.userRole.count({ where: { role_id: id, is_active: true } });
  if (count) throw Object.assign(new Error(`${count} users have this role`), { status: 400 });
  return prisma.role.delete({ where: { id } });
};

export const setRolePermissions = async (role_id, permission_keys, replace = true) => {
  if (replace) await prisma.rolePermission.deleteMany({ where: { role_id } });
  if (!permission_keys?.length) return { set: 0 };
  for (const k of permission_keys) {
    const [module, ...rest] = k.split(":");
    await prisma.permission.upsert({
      where: { key: k }, update: {},
      create: { key: k, module, action: rest.join(":"), label: `${module} ${rest.join(":")}` },
    }).catch(() => { });
  }
  const perms = await prisma.permission.findMany({ where: { key: { in: permission_keys } } });
  await prisma.rolePermission.createMany({
    data: perms.map(p => ({ role_id, permission_id: p.id })),
    skipDuplicates: true,
  });
  return { set: perms.length };
};

export const assignRoleToUser = async (user_id, role_name, opts = {}) => {
  const role = await prisma.role.findUnique({ where: { name: role_name } });
  if (!role) throw Object.assign(new Error(`Role ${role_name} not found`), { status: 404 });
  if (!opts.dept_id && !opts.section_id) {
    await prisma.user.update({ where: { id: user_id }, data: { role: role_name } });
    await prisma.faculty.updateMany({ where: { user_id }, data: { erp_role: role_name } }).catch(() => { });
  }
  return prisma.userRole.upsert({
    where: { user_id_role_id_dept_id_section_id: { user_id, role_id: role.id, dept_id: opts.dept_id || "", section_id: opts.section_id || "" } },
    update: { is_active: true, granted_by: opts.granted_by || null },
    create: { user_id, role_id: role.id, dept_id: opts.dept_id || null, section_id: opts.section_id || null, granted_by: opts.granted_by || null, is_active: true },
  });
};

export const revokeRole = async (user_id, role_id) =>
  prisma.userRole.updateMany({ where: { user_id, role_id }, data: { is_active: false } });

export const getUserRolesList = async (user_id) =>
  prisma.userRole.findMany({
    where: { user_id, is_active: true },
    include: { role: { include: { rolePermissions: { include: { permission: { select: { key: true } } } } } } },
  });

export const getPermissions = async () => {
  const STD = [
    ["students:view", "students", "view", "View Students"],
    ["students:create", "students", "create", "Create Students"],
    ["students:edit", "students", "edit", "Edit Students"],
    ["students:export", "students", "export", "Export Students"],
    ["faculty:view", "faculty", "view", "View Faculty"],
    ["faculty:create", "faculty", "create", "Create Faculty"],
    ["faculty:edit", "faculty", "edit", "Edit Faculty"],
    ["faculty:manage", "faculty", "manage", "Manage Faculty"],
    ["section:view", "section", "view", "View Sections"],
    ["section:create", "section", "create", "Create Sections"],
    ["timetable:view", "timetable", "view", "View Timetable"],
    ["timetable:edit", "timetable", "edit", "Edit Timetable"],
    ["timetable:generate", "timetable", "generate", "Generate Timetable"],
    ["timetable:lock", "timetable", "lock", "Lock Timetable"],
    ["attendance:view", "attendance", "view", "View Attendance"],
    ["attendance:mark", "attendance", "mark", "Mark Attendance"],
    ["attendance:edit", "attendance", "edit", "Edit Attendance"],
    ["attendance:export", "attendance", "export", "Export Attendance"],
    ["attendance:freeze", "attendance", "freeze", "Freeze Attendance"],
    ["curriculum:view", "curriculum", "view", "View Curriculum"],
    ["curriculum:edit", "curriculum", "edit", "Edit Curriculum"],
    ["curriculum:upload", "curriculum", "upload", "Upload Curriculum"],
    ["feedback:view", "feedback", "view", "View Feedback"],
    ["feedback:create", "feedback", "create", "Create Feedback"],
    ["feedback:manage", "feedback", "manage", "Manage Feedback"],
    ["leave:view", "leave", "view", "View Leave"],
    ["leave:apply", "leave", "apply", "Apply Leave"],
    ["leave:approve", "leave", "approve", "Approve Leave"],
    ["leave:manage", "leave", "manage", "Manage Leave"],
    ["reports:view", "reports", "view", "View Reports"],
    ["reports:export", "reports", "export", "Export Reports"],
    ["settings:view", "settings", "view", "View Settings"],
    ["settings:edit", "settings", "edit", "Edit Settings"],
    ["roles:view", "roles", "view", "View Roles"],
    ["roles:manage", "roles", "manage", "Manage Roles"],
    ["audit:view", "audit", "view", "View Audit"],
    ["sections:promote", "sections", "promote", "Promote Students"],

    ["training:view", "training", "view", "View Trainings"],
    ["training:create", "training", "create", "Create Trainings"],
    ["training:edit", "training", "edit", "Edit Trainings"],
    ["training:enroll", "training", "enroll", "Enroll Students"],
    ["training:fee", "training", "fee", "Manage Training Fees"],
    ["training:attendance", "training", "attendance", "Mark Training Attendance"],
    ["training:update", "training", "update", "Post Training Updates"],
    ["training:report", "training", "report", "View Training Reports"],
    ["training:manage", "training", "manage", "Manage Training Team"],

  ];
  for (const [key, module, action, label] of STD) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key, module, action, label } }).catch(() => { });
  }
  return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
};

// Assign multiple roles by ID — replaces all existing active roles for the user
export const assignRolesByIds = async (user_id, role_ids = [], opts = {}) => {
  // 1. Deactivate all current roles for this user
  await prisma.userRole.updateMany({
    where: { user_id, is_active: true },
    data: { is_active: false },
  });

  if (!role_ids.length) return { assigned: 0 };

  // 2. Fetch role records to validate and get names
  const roles = await prisma.role.findMany({
    where: { id: { in: role_ids }, is_active: true },
  });

  if (!roles.length) throw Object.assign(new Error("No valid roles found"), { status: 404 });

  // 3. Upsert each role
  const results = [];
  for (const role of roles) {
    const ur = await prisma.userRole.upsert({
      where: {
        user_id_role_id_dept_id_section_id: {
          user_id,
          role_id: role.id,
          dept_id: opts.dept_id || "",
          section_id: opts.section_id || "",
        },
      },
      update: { is_active: true, granted_by: opts.granted_by || null },
      create: {
        user_id,
        role_id: role.id,
        dept_id: opts.dept_id || null,
        section_id: opts.section_id || null,
        granted_by: opts.granted_by || null,
        is_active: true,
      },
    });
    results.push({ role_id: role.id, name: role.name });
  }

  // 4. Update user.role to the first (primary) role name
  const primary = roles.find(r => r.is_system) || roles[0];
  await prisma.user.update({
    where: { id: user_id },
    data: { extra_roles: roles.map(r => r.name) },
  }).catch(() => { }); // extra_roles may not exist on all schemas

  return { assigned: results.length, roles: results };
};