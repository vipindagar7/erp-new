import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as svc from "./role.upgrade.service.js";
import { createAuditLog } from "../../middlewares/audit.middleware.js";

const router = Router();
const ok   = (res, data, msg) => res.json({ success: true, message: msg, data });
const fail = (res, e, next)   => { if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); };

// GET all users with extra roles
router.get("/", authenticate, authorize("SUPER_ADMIN", "ADMIN"), async (req, res, next) => {
  try { ok(res, await svc.getUsersWithExtraRoles(), "OK"); } catch (e) { fail(res, e, next); }
});

// POST /role-upgrade/:userId/grant  { role: "ADMIN" }
router.post("/:userId/grant", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const result = await svc.grantRole(req.params.userId, req.body.role);
    createAuditLog({ user_id: req.user.id, user_email: req.user.email, user_role: req.user.role,
      action: "ASSIGN", module: "user", record_id: req.params.userId,
      record_label: result.email, new_data: result, ip: req.ip });
    ok(res, result, `${req.body.role} access granted`);
  } catch (e) { fail(res, e, next); }
});

// POST /role-upgrade/:userId/revoke  { role: "ADMIN" }
router.post("/:userId/revoke", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const result = await svc.revokeRole(req.params.userId, req.body.role);
    createAuditLog({ user_id: req.user.id, user_email: req.user.email, user_role: req.user.role,
      action: "REMOVE", module: "user", record_id: req.params.userId,
      record_label: result.email, new_data: result, ip: req.ip });
    ok(res, result, `${req.body.role} access revoked`);
  } catch (e) { fail(res, e, next); }
});

// POST /role-upgrade/:userId/promote  { role: "ADMIN" }  — changes PRIMARY role
router.post("/:userId/promote", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const result = await svc.promotePrimaryRole(req.params.userId, req.body.role);
    createAuditLog({ user_id: req.user.id, user_email: req.user.email, user_role: req.user.role,
      action: "UPDATE", module: "user", record_id: req.params.userId,
      record_label: result.email, new_data: result, ip: req.ip });
    ok(res, result, `Primary role changed to ${req.body.role}`);
  } catch (e) { fail(res, e, next); }
});

export default router;
