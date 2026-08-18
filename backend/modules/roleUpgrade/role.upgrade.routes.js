import { Router } from "express";
import { authenticate, authorize, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./role.upgrade.service.js";
import { createAuditLog } from "../../middlewares/audit.middleware.js";

const router = Router();
const ok = (res, data, msg) => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => { if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); };
const canManageRoles = (req, res, next) => {
  const userRoles = [req.user.role, ...(req.user.extra_roles || [])];
  if (userRoles.includes("SUPER_ADMIN")) return next();
  if (req.params.userId === req.user.id) {
    return res.status(403).json({ success: false, message: "You cannot change your own role." });
  }
  return requirePerm("admin.manage_roles")(req, res, next);
};

// GET all users with extra roles
router.get("/", authenticate, authorize("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
  try { ok(res, await svc.getUsersWithExtraRoles(), "OK"); } catch (e) { fail(res, e, next); }
});

// POST /role-upgrade/:userId/grant  { role: "ADMIN" }
router.post("/:userId/grant", authenticate, canManageRoles, async (req, res, next) => {
  try {
    const result = await svc.grantRole(req.params.userId, req.body.role);
    createAuditLog({
      user_id: req.user.id, user_email: req.user.email, user_role: req.user.role,
      action: "ASSIGN", module: "user", record_id: req.params.userId,
      record_label: result.email, new_data: result, ip: req.ip
    });
    ok(res, result, `${req.body.role} access granted`);
  } catch (e) { fail(res, e, next); }
});

// POST /role-upgrade/:userId/revoke  { role: "ADMIN" }
router.post("/:userId/revoke", authenticate, canManageRoles, async (req, res, next) => {
  try {
    const result = await svc.revokeRole(req.params.userId, req.body.role);
    createAuditLog({
      user_id: req.user.id, user_email: req.user.email, user_role: req.user.role,
      action: "REMOVE", module: "user", record_id: req.params.userId,
      record_label: result.email, new_data: result, ip: req.ip
    });
    ok(res, result, `${req.body.role} access revoked`);
  } catch (e) { fail(res, e, next); }
});

// POST /role-upgrade/:userId/promote  { role: "ADMIN" }  — changes PRIMARY role
router.post("/:userId/promote", authenticate, canManageRoles, async (req, res, next) => {
  try {
    const result = await svc.promotePrimaryRole(req.params.userId, req.body.role);
    createAuditLog({
      user_id: req.user.id, user_email: req.user.email, user_role: req.user.role,
      action: "UPDATE", module: "user", record_id: req.params.userId,
      record_label: result.email, new_data: result, ip: req.ip
    });
    ok(res, result, `Primary role changed to ${req.body.role}`);
  } catch (e) { fail(res, e, next); }
});

export default router;
