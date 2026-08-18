// backend/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
// Permission key aliases — normalizes old colon format to dot notation
// e.g. "faculty:view" → "faculty.view"
const PERM_ALIASES = {
  "student:view": "students.view", "student:create": "students.create", "student:update": "students.update",
  "student:block": "students.block", "student:promote": "students.promote", "student:bulk_promote": "students.promote",
  "student:change_section": "students.update", "student:export": "students.export",
  "faculty:view": "faculty.view", "faculty:update": "faculty.update", "faculty:block": "faculty.block",
  "faculty:unblock": "faculty.block", "faculty:export": "faculty.export", "faculty:manage": "faculty.manage",
  "academic.create": "academic.create", "academic:view": "academic.view", "academic:edit": "academic.update",
  "course:view": "curriculum.view", "course:create": "curriculum.create", "course:update": "curriculum.update",
  "subject:view": "curriculum.view", "subject:create": "curriculum.create", "subject:update": "curriculum.update",
  "subject:bulk_upload": "curriculum.create",
  "attendance:view": "attendance.view", "attendance:mark": "attendance.manage", "attendance:edit": "attendance.manage",
  "attendance:report": "attendance.report", "attendance:freeze": "attendance.freeze",
  "assignment:view": "assignments.view", "assignment:create": "assignments.create",
  "assignment:edit": "assignments.update", "assignment:grade": "assignments.grade",
  "audit:view": "audit.view", "audit:export": "audit.export",
};

const normalizeKey = (key) => PERM_ALIASES[key] || key;

// ── Load effectivePermissions from UserRole + UserPermission ──
const loadEffectivePermissions = async (user) => {
  try {
    const [userRoles, userPerms] = await Promise.all([
      prisma.userRole.findMany({
        where: { user_id: user.id, is_active: true },
        include: { role: { include: { rolePermissions: { include: { permission: { select: { key: true } } } } } } },
      }),
      prisma.userPermission.findMany({
        where: { user_id: user.id, type: "GRANT" },
        include: { permission: { select: { key: true } } },
      }),
    ]);

    const rolePerms = userRoles.flatMap(ur => ur.role?.rolePermissions?.map(rp => rp.permission.key) || []);
    const directPerms = userPerms.map(up => up.permission.key);
    const legacy = user.permissions || [];

    return [...new Set([...legacy, ...directPerms, ...rolePerms])];
  } catch (e) {
    console.warn("[auth] loadEffectivePermissions:", e.message);
    return user.permissions || [];
  }
};

// ── Load dept/branch scope for user ───────────────────────────
const loadUserScope = async (user_id) => {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { user_id, is_active: true },
      select: { dept_id: true, section_id: true },
    });
    const dept_ids = [...new Set(userRoles.map(r => r.dept_id).filter(Boolean))];
    const section_ids = [...new Set(userRoles.map(r => r.section_id).filter(Boolean))];
    return { dept_ids, section_ids };
  } catch {
    return { dept_ids: [], section_ids: [] };
  }
};

// ── Main authenticate middleware ───────────────────────────────
export const authenticate = async (req, res, next) => {
  const token = req.cookies?.access_token
    || req.headers?.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "secret");
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.isBlocked)
      return res.status(401).json({ success: false, message: "Account unavailable" });

    // Login block check (root-controlled)
    const isRootUser = user.is_root === true || user.role === "SUPER_ADMIN";
    if (!isRootUser) {
      if (user.role === "STUDENT") {
        const block = await prisma.erpSetting.findUnique({ where: { key: "student_login_blocked" } }).catch(() => null);
        if (block?.value === "true")
          return res.status(403).json({ success: false, message: "Student portal is currently unavailable." });
      } else {
        const block = await prisma.erpSetting.findUnique({ where: { key: "faculty_login_blocked" } }).catch(() => null);
        if (block?.value === "true")
          return res.status(403).json({ success: false, message: "Staff login is currently disabled." });
      }
    }

    const effectivePermissions = await loadEffectivePermissions(user);
    const scope = await loadUserScope(user.id);

    req.user = {
      ...user,
      jti: payload.jti,
      effectivePermissions,
      ...scope,
    };

    next();
  } catch (e) {
    if (e.name === "TokenExpiredError")
      return res.status(401).json({ success: false, message: "Session expired", code: "TOKEN_EXPIRED" });
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ── requirePerm — checks effectivePermissions ─────────────────
// Normalizes old colon format to dot format automatically
export const requirePerm = (...keys) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if (req.user.role === "SUPER_ADMIN") return next(); // super admin bypasses all

  const normalizedKeys = keys.map(normalizeKey);
  const perms = req.user.effectivePermissions || req.user.permissions || [];
  const allowed = normalizedKeys.some(k => perms.includes(k));

  if (!allowed) {
    // Audit log the denied access
    logDeniedAccess(req, normalizedKeys).catch(() => { });
    return res.status(403).json({
      success: false,
      message: "Access denied",
      required: normalizedKeys,
    });
  }
  next();
};

// Alias
export const requireAnyPerm = requirePerm;

// ── Dept-scoped permission check ──────────────────────────────
// Checks permission AND if user has access to given dept
export const requirePermInDept = (permKey, getDeptId) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if (req.user.role === "SUPER_ADMIN" || req.user.is_root) return next();

  const perms = req.user.effectivePermissions || [];
  const normalized = normalizeKey(permKey);
  if (!perms.includes(normalized))
    return res.status(403).json({ success: false, message: "Access denied" });

  // Check dept scope
  if (req.user.dept_ids?.length) {
    const deptId = typeof getDeptId === "function" ? await getDeptId(req) : getDeptId;
    if (deptId && !req.user.dept_ids.includes(deptId))
      return res.status(403).json({ success: false, message: "Access denied — outside your department scope" });
  }
  next();
};

// ── Convenience guards ────────────────────────────────────────
export const superAdminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if (req.user.role !== "SUPER_ADMIN")
    return res.status(403).json({ success: false, message: "Super Admin only" });
  next();
};

export const rootOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if (!req.user.is_root && req.user.role !== "SUPER_ADMIN")
    return res.status(403).json({ success: false, message: "Root access only" });
  next();
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if (roles.includes(req.user.role)) return next();
  return res.status(403).json({ success: false, message: "Insufficient role" });
};

// ── Log denied access to audit ────────────────────────────────
const logDeniedAccess = async (req, permissions) => {
  await prisma.auditLog.create({
    data: {
      user_id: req.user?.id,
      user_role: req.user?.role,
      action: "ACCESS_DENIED",
      module: req.path.split("/")[1] || "unknown",
      route: req.path,
      method: req.method,
      ip: req.ip,
      user_agent: req.headers?.["user-agent"],
      meta: { required_permissions: permissions },
    },
  }).catch(() => { });
};