// backend/modules/rbac/rbac.service.js
import prisma from "../../utils/prisma.js";
import { ROLES, ROLE_PERMISSIONS, ROLE_SCOPE } from "./rbac.constants.js";

// ── Get or create Role record ─────────────────────────────────
const getOrCreateRole = async (roleName) => {
  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({
      data: { name: roleName, label: roleName.replace(/_/g, " "), is_system: true },
    });
  }
  return role;
};

// ── Assign role to a faculty/user ────────────────────────────
export const assignRole = async ({
  user_id, role_name, dept_id, program_id, branch_id, section_id,
  expires_at, granted_by,
}, actingUser = {}) => {
  // Validate role
  if (!Object.values(ROLES).includes(role_name))
    throw Object.assign(new Error(`Invalid role: ${role_name}`), { status: 400 });

  // Root cannot be assigned via this API — only via is_root flag
  if (role_name === ROLES.ROOT)
    throw Object.assign(new Error("ROOT role cannot be assigned via API"), { status: 403 });

  // Validate scope
  const scopeType = ROLE_SCOPE[role_name];
  if (scopeType === "dept"    && !dept_id)    throw Object.assign(new Error(`dept_id required for ${role_name}`),    { status: 400 });
  if (scopeType === "program" && !program_id) throw Object.assign(new Error(`program_id required for ${role_name}`),{ status: 400 });
  if (scopeType === "branch"  && !branch_id)  throw Object.assign(new Error(`branch_id required for ${role_name}`), { status: 400 });
  if (scopeType === "section" && !section_id) throw Object.assign(new Error(`section_id required for ${role_name}`),{ status: 400 });

  // Get or create the Role
  const role = await getOrCreateRole(role_name);

  // Upsert UserRole
  const userRole = await prisma.userRole.upsert({
    where: {
      user_id_role_id_dept_id_section_id: {
        user_id,
        role_id:    role.id,
        dept_id:    dept_id    || null,
        section_id: section_id || null,
      },
    },
    update: {
      is_active:  true,
      expires_at: expires_at ? new Date(expires_at) : null,
      granted_by: actingUser.id || null,
    },
    create: {
      user_id,
      role_id:    role.id,
      dept_id:    dept_id     || null,
      program_id: program_id  || null,
      branch_id:  branch_id   || null,
      section_id: section_id  || null,
      expires_at: expires_at  ? new Date(expires_at) : null,
      granted_by: actingUser.id || null,
      is_active:  true,
    },
  });

  // Also update legacy role field on user if it's a primary assignment
  const LEGACY_MAP = {
    [ROLES.SUPER_ADMIN]:   "SUPER_ADMIN",
    [ROLES.HOD]:           "HOD",
    [ROLES.CLASS_COORDINATOR]: "CLASS_COORDINATOR",
    [ROLES.FACULTY]:       "FACULTY",
  };
  if (LEGACY_MAP[role_name]) {
    await prisma.user.update({
      where: { id: user_id },
      data: {
        extra_roles:  { push: LEGACY_MAP[role_name] },
        permissions: { set: ROLE_PERMISSIONS[role_name] || [] },
      },
    }).catch(() => {});
  }

  return userRole;
};

// ── Revoke role from user ─────────────────────────────────────
export const revokeRole = async (user_role_id, actingUser = {}) => {
  return prisma.userRole.update({
    where: { id: user_role_id },
    data:  { is_active: false },
  });
};

// ── Get user's roles ──────────────────────────────────────────
export const getUserRoles = async (user_id) => {
  return prisma.userRole.findMany({
    where: { user_id, is_active: true },
    include: {
      role: { select: { id: true, name: true, label: true } },
    },
    orderBy: { granted_at: "desc" },
  });
};

// ── Get all role assignments (for admin view) ─────────────────
export const getAllRoleAssignments = async ({ role_name, dept_id, section_id, page = 1, limit = 50 } = {}) => {
  const _page  = parseInt(page)  || 1;
  const _limit = parseInt(limit) || 50;
  const where  = { is_active: true };
  if (dept_id)    where.dept_id    = dept_id;
  if (section_id) where.section_id = section_id;
  if (role_name)  where.role = { name: role_name };

  const [assignments, total] = await Promise.all([
    prisma.userRole.findMany({
      where,
      include: {
        role: { select: { name: true, label: true } },
        user: {
          select: {
            id: true, email: true,
            faculty:  { select: { id: true, name: true, emp_id: true, dept_id: true, department: { select: { name: true } } } },
            admin:    { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ role: { name: "asc" } }, { granted_at: "desc" }],
      skip: (_page - 1) * _limit,
      take: _limit,
    }),
    prisma.userRole.count({ where }),
  ]);

  return { assignments, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

// ── Assign role to faculty directly (convenience) ─────────────
export const assignFacultyRole = async ({
  faculty_id, role_name, dept_id, program_id, branch_id, section_id, expires_at,
}, actingUser = {}) => {
  const faculty = await prisma.faculty.findUnique({
    where: { id: faculty_id },
    select: { user_id: true, name: true, dept_id: true },
  });
  if (!faculty) throw Object.assign(new Error("Faculty not found"), { status: 404 });

  // Auto-fill dept_id from faculty if HOD and not provided
  if (role_name === ROLES.HOD && !dept_id && faculty.dept_id) {
    dept_id = faculty.dept_id;
  }

  return assignRole({
    user_id:    faculty.user_id,
    role_name, dept_id, program_id, branch_id, section_id, expires_at,
    granted_by: actingUser.id,
  }, actingUser);
};

// ── Get scope label for display ───────────────────────────────
export const getScopeLabel = async (assignment) => {
  if (assignment.section_id) {
    const s = await prisma.section.findUnique({ where: { id: assignment.section_id }, select: { name: true, code: true } }).catch(() => null);
    return `Section: ${s?.name || assignment.section_id}`;
  }
  if (assignment.branch_id) {
    const b = await prisma.branch.findUnique({ where: { id: assignment.branch_id }, select: { name: true } }).catch(() => null);
    return `Branch: ${b?.name || assignment.branch_id}`;
  }
  if (assignment.program_id) {
    const p = await prisma.program.findUnique({ where: { id: assignment.program_id }, select: { name: true } }).catch(() => null);
    return `Program: ${p?.name || assignment.program_id}`;
  }
  if (assignment.dept_id) {
    const d = await prisma.department.findUnique({ where: { id: assignment.dept_id }, select: { name: true } }).catch(() => null);
    return `Dept: ${d?.name || assignment.dept_id}`;
  }
  return "Institute-wide";
};

// ── Initialize system roles in DB ────────────────────────────
export const initializeRoles = async () => {
  for (const [roleName] of Object.entries(ROLES)) {
    await prisma.role.upsert({
      where:  { name: roleName },
      update: {},
      create: { name: roleName, label: roleName.replace(/_/g, " "), is_system: true, is_active: true },
    }).catch(() => {});
  }
  console.log("[RBAC] System roles initialized");
};
