// backend/modules/rbac/rbac.middleware.js
// Scope-aware permission middleware
// Checks: role permission + scope (dept/program/branch/section)
import prisma from "../../utils/prisma.js";
import { ROLE_PERMISSIONS, ROLE_SCOPE, ROLES } from "./rbac.constants.js";

// ── Load user's scoped roles from DB ─────────────────────────
export const loadUserRoles = async (req, res, next) => {
  if (!req.user) return next();
  try {
    // Check root
    const isRoot = req.user.is_root === true;
    if (isRoot) { req.user._rbac = { isRoot: true, roles: [], scopes: {} }; return next(); }

    // Load UserRole entries
    const userRoles = await prisma.userRole.findMany({
      where:   { user_id: req.user.id, is_active: true, OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }] },
      include: { role: { select: { name: true } } },
    }).catch(() => []);

    const roles  = userRoles.map((ur) => ur.role.name);
    const scopes = {};

    for (const ur of userRoles) {
      const roleName = ur.role.name;
      if (!scopes[roleName]) scopes[roleName] = [];
      scopes[roleName].push({
        dept_id:    ur.dept_id    || null,
        program_id: ur.program_id || null,
        branch_id:  ur.branch_id  || null,
        section_id: ur.section_id || null,
      });
    }

    // Also include legacy role from user.role field
    if (req.user.role && !roles.includes(req.user.role)) {
      roles.push(req.user.role);
    }

    // Compute all permissions from all roles
    const permissions = new Set();
    for (const role of roles) {
      const rolePerms = ROLE_PERMISSIONS[role] || [];
      rolePerms.forEach((p) => permissions.add(p));
    }

    // Also add direct user.permissions (legacy)
    (req.user.permissions || []).forEach((p) => permissions.add(p));

    req.user._rbac = {
      isRoot:      false,
      isSuperAdmin:roles.includes(ROLES.SUPER_ADMIN),
      roles,
      scopes,       // { HOD: [{ dept_id: "xyz" }], CLASS_COORDINATOR: [{ section_id: "abc" }] }
      permissions:  [...permissions],
    };
  } catch (e) {
    console.error("[RBAC] loadUserRoles error:", e.message);
    req.user._rbac = { isRoot: false, roles: [], scopes: {}, permissions: req.user.permissions || [] };
  }
  next();
};

// ── Check permission (with optional scope) ───────────────────
export const checkPerm = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  const rbac = req.user._rbac || {};
  if (rbac.isRoot)      return next();
  if (rbac.isSuperAdmin)return next();

  const hasPerm = rbac.permissions?.includes(permission) || req.user.permissions?.includes(permission);
  if (!hasPerm) return res.status(403).json({ success: false, message: `Permission denied: ${permission}` });
  next();
};

// ── Scope filter — add to queries automatically ───────────────
// Usage: req.scopeFilter gives { dept_id, program_id, branch_id, section_id } or {} for institute-wide
export const attachScope = (req, res, next) => {
  if (!req.user) return next();
  const rbac   = req.user._rbac || {};
  if (rbac.isRoot || rbac.isSuperAdmin) { req.scopeFilter = {}; return next(); }

  // Check module admin roles — institute wide, no scope
  const instituteRoles = [ROLES.STUDENT_ADMIN, ROLES.FACULTY_ADMIN, ROLES.ACADEMIC_ADMIN, ROLES.CURRICULUM_ADMIN, ROLES.EXAM_ADMIN, ROLES.FINANCE_ADMIN];
  if (rbac.roles?.some((r) => instituteRoles.includes(r))) { req.scopeFilter = {}; return next(); }

  // HOD — scope to their dept(s)
  if (rbac.scopes?.[ROLES.HOD]?.length) {
    const deptIds = rbac.scopes[ROLES.HOD].map((s) => s.dept_id).filter(Boolean);
    req.scopeFilter = { dept_id: { in: deptIds } };
    req.allowedDeptIds = deptIds;
    return next();
  }

  // PROGRAM_HEAD
  if (rbac.scopes?.[ROLES.PROGRAM_HEAD]?.length) {
    const programIds = rbac.scopes[ROLES.PROGRAM_HEAD].map((s) => s.program_id).filter(Boolean);
    req.scopeFilter = { program_id: { in: programIds } };
    req.allowedProgramIds = programIds;
    return next();
  }

  // BRANCH_HEAD
  if (rbac.scopes?.[ROLES.BRANCH_HEAD]?.length) {
    const branchIds = rbac.scopes[ROLES.BRANCH_HEAD].map((s) => s.branch_id).filter(Boolean);
    req.scopeFilter = { branch_id: { in: branchIds } };
    req.allowedBranchIds = branchIds;
    return next();
  }

  // CLASS_COORDINATOR
  if (rbac.scopes?.[ROLES.CLASS_COORDINATOR]?.length) {
    const sectionIds = rbac.scopes[ROLES.CLASS_COORDINATOR].map((s) => s.section_id).filter(Boolean);
    req.scopeFilter = { section_id: { in: sectionIds } };
    req.allowedSectionIds = sectionIds;
    return next();
  }

  // FACULTY — scope to their sections via SectionSubject
  if (rbac.roles?.includes(ROLES.FACULTY)) {
    req.scopeFilter  = { _faculty: true }; // special marker — resolved per endpoint
    req.isFacultyScope = true;
    return next();
  }

  req.scopeFilter = {};
  next();
};

// ── Assert scope — check if a specific resource is accessible ─
export const assertScope = async (req, resource) => {
  const rbac = req.user?._rbac || {};
  if (rbac.isRoot || rbac.isSuperAdmin) return true;

  const { dept_id, program_id, branch_id, section_id } = resource;

  if (req.allowedDeptIds    && dept_id    && !req.allowedDeptIds.includes(dept_id))       return false;
  if (req.allowedProgramIds && program_id && !req.allowedProgramIds.includes(program_id)) return false;
  if (req.allowedBranchIds  && branch_id  && !req.allowedBranchIds.includes(branch_id))   return false;
  if (req.allowedSectionIds && section_id && !req.allowedSectionIds.includes(section_id)) return false;

  return true;
};

// ── Role guards ───────────────────────────────────────────────
export const rootOnly = (req, res, next) => {
  if (!req.user?._rbac?.isRoot && !req.user?.is_root)
    return res.status(403).json({ success: false, message: "Root admin only" });
  next();
};

export const superAdminOnly = (req, res, next) => {
  const rbac = req.user?._rbac || {};
  if (rbac.isRoot || rbac.isSuperAdmin || req.user?.role === "SUPER_ADMIN") return next();
  return res.status(403).json({ success: false, message: "Super Admin only" });
};

export const requireRole = (...roles) => (req, res, next) => {
  const rbac = req.user?._rbac || {};
  if (rbac.isRoot || rbac.isSuperAdmin) return next();
  if (roles.some((r) => rbac.roles?.includes(r))) return next();
  return res.status(403).json({ success: false, message: `Required role: ${roles.join(" or ")}` });
};
