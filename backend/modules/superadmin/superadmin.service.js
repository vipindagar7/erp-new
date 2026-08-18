// backend/modules/superadmin/superadmin.service.js
import prisma  from "../../utils/prisma.js";
import bcrypt  from "bcrypt";
import { generateDefaultPassword } from "../erpSettings/erp.settings.service.js";

const saSelect = {
  id: true, email: true, role: true, isBlocked: true,
  is_root: true, first_login_completed: true, must_change_password: true,
  createdAt: true, updatedAt: true,
  admin: { select: { id: true, name: true } },
  _count: { select: { auditLogs: true, userSessions: true } },
};

// ── List ──────────────────────────────────────────────────────
export const getAllSuperAdmins = async ({ page = 1, limit = 20, search, status } = {}) => {
  const skip  = (Math.max(1, page) - 1) * limit;
  const where = {
    role: "SUPER_ADMIN",
    ...(status === "active"   && { isBlocked: false }),
    ...(status === "blocked"  && { isBlocked: true  }),
    ...(search && { OR: [
      { email:         { contains: search, mode: "insensitive" } },
      { admin:         { name: { contains: search, mode: "insensitive" } } },
    ]}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, select: saSelect, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);
  return { superAdmins: users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

// ── Get one ───────────────────────────────────────────────────
export const getSuperAdminById = (id) =>
  prisma.user.findFirst({
    where: { id, role: "SUPER_ADMIN" },
    select: {
      ...saSelect,
      permissions: true, extra_roles: true,
      loginHistory: { orderBy: { createdAt: "desc" }, take: 10,
        select: { status: true, ip_address: true, browser: true, os: true, location: true, createdAt: true } },
      userSessions: { where: { is_active: true },
        select: { id: true, device_type: true, browser: true, os: true, ip_address: true, last_active_at: true, is_locked: true } },
    },
  });

// ── Stats ─────────────────────────────────────────────────────
export const getSuperAdminStats = async () => {
  const [total, active, blocked] = await Promise.all([
    prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN", isBlocked: false } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN", isBlocked: true  } }),
  ]);
  return { total, active, blocked };
};

// ── Create ────────────────────────────────────────────────────
export const createSuperAdmin = async ({ email, name, permissions = [] }, actingUserId) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error(`User with email "${email}" already exists`), { status: 409 });

  const firstName   = name.split(" ")[0];
  const lastName    = name.split(" ").slice(1).join(" ") || "";
  const rawPassword = await generateDefaultPassword("superadmin", { email, first_name: firstName, last_name: lastName });
  const hash        = await bcrypt.hash(rawPassword, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email, passwordHash: hash, role: "SUPER_ADMIN",
        permissions, must_change_password: true, first_login_completed: false,
      },
    });
    await tx.admin.create({ data: { user_id: u.id, name } });
    return u;
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_email: email, user_role: "ROOT",
      action: "CREATE", module: "superadmin", record_id: user.id,
      record_label: name, new_data: { email, name, role: "SUPER_ADMIN" },
      changed_fields: ["email", "name", "role"],
    },
  });

  return { user: await getSuperAdminById(user.id), tempPassword: rawPassword };
};

// ── Update ────────────────────────────────────────────────────
export const updateSuperAdmin = async (id, { name, permissions }, actingUserId) => {
  const prev = await prisma.user.findUnique({ where: { id }, select: { email: true, permissions: true, admin: { select: { name: true } } } });
  const changed = [];
  await prisma.$transaction(async (tx) => {
    if (permissions !== undefined) { await tx.user.update({ where: { id }, data: { permissions } }); changed.push("permissions"); }
    if (name !== undefined)        { await tx.admin.update({ where: { user_id: id }, data: { name } }); changed.push("name"); }
  });
  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_role: "ROOT", action: "UPDATE",
      module: "superadmin", record_id: id, record_label: prev?.admin?.name || prev?.email,
      prev_data: { name: prev?.admin?.name, permissions: prev?.permissions },
      new_data:  { name, permissions }, changed_fields: changed,
    },
  });
  return getSuperAdminById(id);
};

// ── Block ─────────────────────────────────────────────────────
export const blockSuperAdmin = async (id, reason, actingUserId) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { is_root: true, email: true, admin: { select: { name: true } } } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.is_root) throw Object.assign(new Error("Cannot block the root account"), { status: 403 });

  await prisma.user.update({ where: { id }, data: { isBlocked: true } });
  // Revoke all active sessions
  await prisma.userSession.updateMany({ where: { user_id: id, is_active: true }, data: { is_active: false, revoked_at: new Date(), revoked_reason: "BLOCKED_BY_ROOT" } });

  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_role: "ROOT", action: "BLOCK",
      module: "superadmin", record_id: id,
      record_label: user.admin?.name || user.email,
      new_data: { reason }, changed_fields: ["isBlocked"],
    },
  });
  return getSuperAdminById(id);
};

// ── Unblock ───────────────────────────────────────────────────
export const unblockSuperAdmin = async (id, actingUserId) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, admin: { select: { name: true } } } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  await prisma.user.update({ where: { id }, data: { isBlocked: false } });
  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_role: "ROOT", action: "UNBLOCK",
      module: "superadmin", record_id: id,
      record_label: user.admin?.name || user.email,
      changed_fields: ["isBlocked"],
    },
  });
  return getSuperAdminById(id);
};

// ── Demote to Admin ───────────────────────────────────────────
export const demoteSuperAdmin = async (id, actingUserId) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { is_root: true, email: true, admin: { select: { name: true } } } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.is_root) throw Object.assign(new Error("Cannot demote the root account"), { status: 403 });
  await prisma.user.update({ where: { id }, data: { role: "ADMIN" } });
  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_role: "ROOT", action: "DEMOTE",
      module: "superadmin", record_id: id,
      record_label: user.admin?.name || user.email,
      prev_data: { role: "SUPER_ADMIN" }, new_data: { role: "ADMIN" },
      changed_fields: ["role"],
    },
  });
  return getSuperAdminById(id);
};

// ── Reset password ────────────────────────────────────────────
export const resetSuperAdminPassword = async (id, actingUserId) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { email: true, admin: { select: { name: true } } } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  const firstName   = user.admin?.name?.split(" ")[0] || "";
  const rawPassword = await generateDefaultPassword("superadmin", { email: user.email, first_name: firstName });
  const hash        = await bcrypt.hash(rawPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash: hash, must_change_password: true } });
  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_role: "ROOT", action: "RESET_PASSWORD",
      module: "superadmin", record_id: id, record_label: user.admin?.name || user.email,
      changed_fields: ["passwordHash"],
    },
  });
  return { tempPassword: rawPassword };
};

// ── Hard delete — root only, only if zero audit logs ─────────
export const deleteSuperAdmin = async (id, actingUserId) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { is_root: true, email: true, admin: { select: { name: true } }, _count: { select: { auditLogs: true } } },
  });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.is_root) throw Object.assign(new Error("Cannot delete the root account"), { status: 403 });
  if (user._count.auditLogs > 0)
    throw Object.assign(new Error(`Cannot delete — ${user._count.auditLogs} audit log entries exist. Deactivate instead.`), { status: 400 });
  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_role: "ROOT", action: "DELETE",
      module: "superadmin", record_id: id, record_label: user.admin?.name || user.email,
      changed_fields: [],
    },
  });
  await prisma.user.delete({ where: { id } });
};

// ── Activity (what this SA has done across ERP) ───────────────
export const getSuperAdminActivity = async (id, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where: { user_id: id }, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.auditLog.count({ where: { user_id: id } }),
  ]);
  return { logs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};