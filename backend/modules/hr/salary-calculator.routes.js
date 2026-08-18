// backend/modules/hr/salary-calculator.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./salary-calculator.service.js";

const router = Router();
router.use(authenticate);
const ok   = (res, data, msg="OK") => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => next ? next(e) : res.status(500).json({ success: false, message: e.message });

// ── Cycles ────────────────────────────────────────────────────
router.get("/cycles",         requirePerm("hr:view"),   async (req, res, next) => {
  try { ok(res, await svc.getCycles(req.query)); } catch(e) { fail(res,e,next); }
});
router.post("/cycles",        requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.createCycle(req.body)); } catch(e) { fail(res,e,next); }
});
router.post("/cycles/:id/lock", requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.lockCycle(req.params.id, req.user.id)); } catch(e) { fail(res,e,next); }
});

// ── Preview salary for any date range ─────────────────────────
router.post("/preview", requirePerm("hr:view"), async (req, res, next) => {
  try { ok(res, await svc.previewSalary(req.body)); } catch(e) { fail(res,e,next); }
});

// ── Calculate single faculty salary ──────────────────────────
router.post("/calculate", requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.calculateSalary(req.body)); } catch(e) { fail(res,e,next); }
});

// ── Bulk generate ─────────────────────────────────────────────
router.post("/bulk-generate", requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.bulkGenerate(req.body)); } catch(e) { fail(res,e,next); }
});

// ── Report ────────────────────────────────────────────────────
router.get("/report", requirePerm("hr:view"), async (req, res, next) => {
  try { ok(res, await svc.getSalaryReport(req.query)); } catch(e) { fail(res,e,next); }
});

export default router;
