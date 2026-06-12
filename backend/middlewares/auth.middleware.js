// backend/middlewares/auth.middleware.js
import jwt    from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const impersonateToken = req.headers["x-impersonate-token"];
    if (impersonateToken) {
      let payload;
      try { payload = jwt.verify(impersonateToken, process.env.JWT_ACCESS_SECRET); }
      catch { return res.status(401).json({ success: false, message: "Impersonation token expired." }); }
      if (!payload.impersonatedBy)
        return res.status(401).json({ success: false, message: "Invalid impersonation token" });
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user)          return res.status(401).json({ success: false, message: "User not found" });
      if (user.isBlocked) return res.status(403).json({ success: false, message: "Account is blocked" });
      req.user = { ...user, extra_roles: user.extra_roles || [], permissions: user.permissions || [], impersonatedBy: payload.impersonatedBy };
      return next();
    }
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET); }
    catch { return res.status(401).json({ success: false, message: "Session expired. Please log in again." }); }
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user)          return res.status(401).json({ success: false, message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ success: false, message: "Account blocked. Contact admin." });
    req.user = { ...user, extra_roles: user.extra_roles || [], permissions: user.permissions || [] };
    next();
  } catch (e) { next(e); }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  const userRoles = [req.user.role, ...(req.user.extra_roles || [])];
  if (userRoles.includes("SUPER_ADMIN")) return next();
  if (roles.some(r => userRoles.includes(r))) return next();
  return res.status(403).json({ success: false, message: "Access denied" });
};

export const requirePerm = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  const userRoles = [req.user.role, ...(req.user.extra_roles || [])];
  if (userRoles.includes("SUPER_ADMIN")) return next();
  if (req.user.permissions?.includes(permission)) return next();
  return res.status(403).json({ success: false, message: `Permission denied: ${permission}`, required: permission });
};

export const requireAnyPerm = (...permissions) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  const userRoles = [req.user.role, ...(req.user.extra_roles || [])];
  if (userRoles.includes("SUPER_ADMIN")) return next();
  if (permissions.some(p => req.user.permissions?.includes(p))) return next();
  return res.status(403).json({ success: false, message: "Permission denied", required: permissions });
};

export const superAdminOnly = (req, res, next) => {
  const userRoles = [req.user?.role, ...(req.user?.extra_roles || [])];
  if (!userRoles.includes("SUPER_ADMIN"))
    return res.status(403).json({ success: false, message: "Super Admin only" });
  next();
};
