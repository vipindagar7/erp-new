// backend/modules/rbac/rbac.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { rootOnly, superAdminOnly, checkPerm, loadUserRoles } from "./rbac.middleware.js";
import * as svc from "./rbac.service.js";
import { ROLES, ROLE_PERMISSIONS, PERMISSION_MODULES } from "./rbac.constants.js";

const router = Router();
const ok   = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success: false, message: e.message }) : next(e);

// ── Get constants for UI ──────────────────────────────────────
router.get("/roles", authenticate, async (req, res, next) => {
  try { ok(res, { roles: ROLES, permissions: PERMISSION_MODULES }); }
  catch(e) { fail(res, e, next); }
});

// ── Get all assignments ───────────────────────────────────────
router.get("/assignments", authenticate, superAdminOnly, async (req, res, next) => {
  try { ok(res, await svc.getAllRoleAssignments(req.query)); }
  catch(e) { fail(res, e, next); }
});

// ── Assign role ───────────────────────────────────────────────
// POST /api/rbac/assign
// body: { user_id?, faculty_id?, role_name, dept_id?, program_id?, branch_id?, section_id?, expires_at? }
router.post("/assign", authenticate, superAdminOnly, async (req, res, next) => {
  try {
    const { faculty_id, user_id, role_name, dept_id, program_id, branch_id, section_id, expires_at } = req.body;
    if (!role_name) return res.status(400).json({ success: false, message: "role_name required" });

    let result;
    if (faculty_id) {
      result = await svc.assignFacultyRole({ faculty_id, role_name, dept_id, program_id, branch_id, section_id, expires_at }, req.user);
    } else if (user_id) {
      result = await svc.assignRole({ user_id, role_name, dept_id, program_id, branch_id, section_id, expires_at }, req.user);
    } else {
      return res.status(400).json({ success: false, message: "faculty_id or user_id required" });
    }
    ok(res, result, "Role assigned", 201);
  } catch(e) { fail(res, e, next); }
});

// ── Revoke role ───────────────────────────────────────────────
router.delete("/assignments/:id", authenticate, superAdminOnly, async (req, res, next) => {
  try { ok(res, await svc.revokeRole(req.params.id, req.user), "Role revoked"); }
  catch(e) { fail(res, e, next); }
});

// ── Get a user's roles ────────────────────────────────────────
router.get("/user/:user_id", authenticate, superAdminOnly, async (req, res, next) => {
  try { ok(res, await svc.getUserRoles(req.params.user_id)); }
  catch(e) { fail(res, e, next); }
});

// ── Get faculty's roles (by faculty_id) ──────────────────────
router.get("/faculty/:faculty_id", authenticate, async (req, res, next) => {
  try {
    const faculty = await (await import("../../utils/prisma.js")).default.faculty.findUnique({
      where: { id: req.params.faculty_id },
      select: { user_id: true },
    });
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });
    ok(res, await svc.getUserRoles(faculty.user_id));
  } catch(e) { fail(res, e, next); }
});

// ── Initialize system roles (root only) ──────────────────────
router.post("/init", authenticate, rootOnly, async (req, res, next) => {
  try { await svc.initializeRoles(); ok(res, null, "System roles initialized"); }
  catch(e) { fail(res, e, next); }
});

export default router;
