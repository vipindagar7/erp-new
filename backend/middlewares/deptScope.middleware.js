// backend/middlewares/deptScope.middleware.js
import prisma from "../utils/prisma.js";

// Attach dept scope to req
export const attachDeptScope = async (req, res, next) => {
  if (!req.user) return next();
  if (req.user.is_root || req.user.role === "SUPER_ADMIN") {
    req.deptScope = null;
    return next();
  }
  try {
    const scopes = await prisma.adminDeptScope.findMany({
      where: { user_id: req.user.id, is_active: true },
      include: { dept: { select: { id: true, name: true } } },
    });
    if (!scopes.length) { req.deptScope = null; return next(); }
    req.deptScope = {
      dept_ids: scopes.map(s => s.dept_id),
      depts:    scopes.map(s => s.dept),
      modules:  [...new Set(scopes.flatMap(s => s.modules))],
    };
  } catch { req.deptScope = null; }
  next();
};

export const requireDeptScope = (req, res, next) => {
  if (!req.deptScope) return next();
  const dept_id = req.params.dept_id || req.query.dept_id || req.body.dept_id;
  if (dept_id && !req.deptScope.dept_ids.includes(dept_id))
    return res.status(403).json({ success: false, message: "Access denied: outside your department scope" });
  next();
};

export const scopeQuery = (req, baseWhere = {}) => {
  if (!req.deptScope) return baseWhere;
  return { ...baseWhere, dept_id: { in: req.deptScope.dept_ids } };
};

export const requireModuleAccess = (module) => (req, res, next) => {
  if (!req.deptScope) return next();
  const { modules } = req.deptScope;
  if (!modules.length || modules.includes(module)) return next();
  return res.status(403).json({ success: false, message: `No access to module: ${module}` });
};
