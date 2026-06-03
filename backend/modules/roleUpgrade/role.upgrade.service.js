import prisma from "../../utils/prisma.js";


const VALID_EXTRA_ROLES = ["ADMIN", "FACULTY", "STUDENT"];

// ── Grant an extra role ────────────────────────────────────────
export const grantRole = async (userId, role) => {
  if (!VALID_EXTRA_ROLES.includes(role))
    throw Object.assign(new Error(`Invalid role "${role}"`), { statusCode: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { admin: true, faculty: true, student: true },
  });
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
  if (user.role === role)
    throw Object.assign(new Error(`User's primary role is already ${role}`), { statusCode: 400 });
  if ((user.extra_roles || []).includes(role))
    throw Object.assign(new Error(`User already has ${role} access`), { statusCode: 400 });

  // Create the Admin record if granting ADMIN and it doesn't exist
  if (role === "ADMIN" && !user.admin) {
    await prisma.admin.create({
      data: { user_id: userId, name: user.faculty?.name || user.student?.name || user.email },
    });
  }

  return prisma.user.update({
    where: { id: userId },
    data:  { extra_roles: { push: role } },
    select: { id: true, email: true, role: true, extra_roles: true },
  });
};

// ── Revoke an extra role ───────────────────────────────────────
export const revokeRole = async (userId, role) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  const extra = (user.extra_roles || []).filter((r) => r !== role);
  return prisma.user.update({
    where: { id: userId },
    data:  { extra_roles: extra },
    select: { id: true, email: true, role: true, extra_roles: true },
  });
};

// ── Promote primary role (full upgrade) ───────────────────────
// Changes the user's PRIMARY role — they lose their old role home
export const promotePrimaryRole = async (userId, newRole) => {
  const VALID = ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"];
  if (!VALID.includes(newRole))
    throw Object.assign(new Error(`Invalid role "${newRole}"`), { statusCode: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { admin: true },
  });
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  // Create Admin record if upgrading to ADMIN/SUPER_ADMIN
  if ((newRole === "ADMIN" || newRole === "SUPER_ADMIN") && !user.admin) {
    await prisma.admin.create({
      data: { user_id: userId, name: user.email },
    });
  }

  // Remove the new primary role from extra_roles if it was there
  const extra = (user.extra_roles || []).filter((r) => r !== newRole);

  return prisma.user.update({
    where: { id: userId },
    data:  { role: newRole, extra_roles: extra },
    select: { id: true, email: true, role: true, extra_roles: true },
  });
};

// ── Get all users with extra roles ────────────────────────────
export const getUsersWithExtraRoles = async () => {
  return prisma.user.findMany({
    where:   { extra_roles: { isEmpty: false } },
    select:  { id: true, email: true, role: true, extra_roles: true,
               faculty: { select: { name: true } },
               student: { select: { name: true, roll_no: true } },
               admin:   { select: { name: true } } },
    orderBy: { role: "asc" },
  });
};
