// backend/modules/hr/leave-rules.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./leave-rules.service.js";

const router = Router();
router.use(authenticate);

const ok   = (res, data, msg = "OK") => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => next ? next(e) : res.status(500).json({ success: false, message: e.message });

// ── Policies ──────────────────────────────────────────────────
router.get("/policies",     requirePerm("hr:view"),   async (req, res, next) => {
  try { ok(res, await svc.getPolicies(req.query)); } catch(e) { fail(res,e,next); }
});
router.get("/policies/:id", requirePerm("hr:view"),   async (req, res, next) => {
  try { ok(res, await svc.getPolicyById(req.params.id)); } catch(e) { fail(res,e,next); }
});
router.post("/policies",    requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.createPolicy({ ...req.body, created_by: req.user.id })); } catch(e) { fail(res,e,next); }
});
router.patch("/policies/:id", requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.updatePolicy(req.params.id, req.body)); } catch(e) { fail(res,e,next); }
});

// ── Rules within policy ────────────────────────────────────────
router.post("/policies/:id/rules",    requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.upsertRule(req.params.id, req.body)); } catch(e) { fail(res,e,next); }
});
router.delete("/rules/:id",           requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.deleteRule(req.params.id)); } catch(e) { fail(res,e,next); }
});

// ── Balance initialization ────────────────────────────────────
router.post("/policies/:id/init-balances", requirePerm("hr:manage"), async (req, res, next) => {
  try {
    const { session_id, dept_id } = req.body;
    ok(res, await svc.initBalances({ policy_id: req.params.id, session_id, dept_id }));
  } catch(e) { fail(res,e,next); }
});

// ── Faculty balance ────────────────────────────────────────────
router.get("/balance/:faculty_id",    requirePerm("hr:view"),   async (req, res, next) => {
  try {
    const { session_id } = req.query;
    ok(res, await svc.getFacultyBalance(req.params.faculty_id, session_id));
  } catch(e) { fail(res,e,next); }
});
// Faculty self-view
router.get("/my-balance", authenticate, async (req, res, next) => {
  try {
    const { session_id } = req.query;
    const faculty = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findFirst({ where: { user_id: req.user.id }, select: { id: true } })
    );
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty record not found" });
    ok(res, await svc.getFacultyBalance(faculty.id, session_id));
  } catch(e) { fail(res,e,next); }
});

// ── Validate leave application ────────────────────────────────
router.post("/validate-leave", authenticate, async (req, res, next) => {
  try { ok(res, await svc.validateLeaveApplication(req.body)); } catch(e) { fail(res,e,next); }
});

// ── Leave Slots ───────────────────────────────────────────────
router.get("/slots",         requirePerm("hr:view"),   async (req, res, next) => {
  try { ok(res, await svc.getSlots(req.query)); } catch(e) { fail(res,e,next); }
});
router.post("/slots",        requirePerm("hr:manage"), async (req, res, next) => {
  try { ok(res, await svc.createSlot({ ...req.body, created_by: req.user.id })); } catch(e) { fail(res,e,next); }
});
router.patch("/slots/:id",   requirePerm("hr:manage"), async (req, res, next) => {
  try {
    const prisma = (await import("../../utils/prisma.js")).default;
    ok(res, await prisma.leaveSlot.update({ where: { id: req.params.id }, data: req.body }));
  } catch(e) { fail(res,e,next); }
});

export default router;
