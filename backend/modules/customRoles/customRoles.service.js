// backend/modules/customRoles/customRoles.service.js
import prisma from "../../utils/prisma.js";

// ── List all dynamic (non-system) roles ─────────────────────────
// Returns _count.rolePermissions / _count.userRoles directly via
// Prisma's relation count — matches AccessRolesPage's expected shape.
export const listRoles = () =>
  prisma.role.findMany({
    where: { is_system: false },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { rolePermissions: true, userRoles: true } } },
  });

// ── Get one role with full permission list (for edit pre-fill) ──
export const getRole = (id) =>
  prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { rolePermissions: true, userRoles: true } },
    },
  });

// ── Create a new custom role with a permission set ───────────────
export const createRole = async ({ name, label, description, permissionKeys = [] }) => {
  const normalizedName = name.trim().toUpperCase().replace(/\s+/g, "_");

  const existing = await prisma.role.findUnique({ where: { name: normalizedName } });
  if (existing) throw Object.assign(new Error(`A role named "${normalizedName}" already exists`), { status: 409 });

  const permissions = permissionKeys.length
    ? await prisma.permission.findMany({ where: { key: { in: permissionKeys } } })
    : [];

  // Defensive — if the caller sent keys that don't exist in Permission
  // table yet, surface that clearly instead of silently creating a
  // role with zero permissions (this is exactly the "can't assign
  // permissions" symptom if Permission rows were never seeded).
  if (permissionKeys.length && permissions.length !== permissionKeys.length) {
    const found = new Set(permissions.map((p) => p.key));
    const missing = permissionKeys.filter((k) => !found.has(k));
    throw Object.assign(
      new Error(`These permission keys don't exist yet: ${missing.join(", ")}. Seed the Permission table first.`),
      { status: 400 }
    );
  }

  return prisma.role.create({
    data: {
      name: normalizedName,
      label: label || normalizedName,
      description: description || null,
      is_system: false,
      is_active: true,
      rolePermissions: { create: permissions.map((p) => ({ permission_id: p.id })) },
    },
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { rolePermissions: true, userRoles: true } },
    },
  });
};

// ── Update a role's label/description/permissions/active state ──
export const updateRole = async (id, { label, description, permissionKeys, is_active }) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  if (role.is_system) throw Object.assign(new Error("System roles cannot be edited"), { status: 403 });

  await prisma.role.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active }),
    },
  });

  if (Array.isArray(permissionKeys)) {
    const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role_id: id } }),
      prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ role_id: id, permission_id: p.id })),
        skipDuplicates: true,
      }),
    ]);
  }

  return getRole(id);
};

// ── Delete a dynamic role (only if no one currently holds it) ────
export const deleteRole = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { userRoles: true } } },
  });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  if (role.is_system) throw Object.assign(new Error("System roles cannot be deleted"), { status: 403 });
  if (role._count.userRoles > 0)
    throw Object.assign(new Error(`Cannot delete — ${role._count.userRoles} user(s) still hold this role. Revoke it first.`), { status: 400 });

  await prisma.role.delete({ where: { id } });
};

// ── List all permissions as a flat array (frontend groups by module) ──
export const listAllPermissions = () =>
  prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });

// ── Assign a dynamic role to a user as an EXTRA role ──────────────
// Additive only — never touches the user's primary `role` field.
export const assignRoleToUser = async (userId, roleId, grantedByUserId) => {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.role.findUnique({ where: { id: roleId } }),
  ]);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  if (!role.is_active) throw Object.assign(new Error("This role is inactive and cannot be assigned"), { status: 400 });

  await prisma.userRole.upsert({
    where: {
      user_id_role_id_dept_id_section_id: { user_id: userId, role_id: roleId, dept_id: null, section_id: null },
    },
    update: { is_active: true, granted_by: grantedByUserId, granted_at: new Date() },
    create: { user_id: userId, role_id: roleId, granted_by: grantedByUserId },
  });

  const currentExtra = user.extra_roles || [];
  if (!currentExtra.includes(role.name)) {
    await prisma.user.update({ where: { id: userId }, data: { extra_roles: [...currentExtra, role.name] } });
  }

  return { success: true };
};

// ── Revoke a dynamic role from a user ─────────────────────────────
export const revokeRoleFromUser = async (userId, roleId) => {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.role.findUnique({ where: { id: roleId } }),
  ]);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });

  await prisma.userRole.updateMany({
    where: { user_id: userId, role_id: roleId },
    data: { is_active: false },
  });

  const currentExtra = user.extra_roles || [];
  await prisma.user.update({
    where: { id: userId },
    data: { extra_roles: currentExtra.filter((r) => r !== role.name) },
  });

  return { success: true };
};

// ── List every user holding a given role — shape matches AssignModal:
// { user: { id, email, role, admin: {name}, faculty: {name, department: {name}} } }
export const listUsersWithRole = async (roleId) => {
  const userRoles = await prisma.userRole.findMany({
    where: { role_id: roleId, is_active: true },
    include: {
      user: {
        select: {
          id: true, email: true, role: true,
          admin: { select: { name: true } },
          faculty: { select: { name: true, department: { select: { name: true } } } },
        },
      },
    },
  });
  return userRoles.map((ur) => ({ user: ur.user }));
};