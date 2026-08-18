// backend/modules/leave/leave.routes.js
import { Router } from "express";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as svc from "./leave.service.js";

const router = Router();
router.use(authenticate);

const ok   = (res, data, msg = "OK") => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message, data: e.pending_lectures })
  : next(e);

// ── Leave Types (HR/Admin manages) ────────────────────────────
router.get("/types",         authenticate,   async (req, res, next) => { try { ok(res, await svc.getLeaveTypes()); } catch(e) { fail(res,e,next); } });
router.post("/types",        superAdminOnly, async (req, res, next) => { try { ok(res, await svc.createLeaveType(req.body), "Created"); } catch(e) { fail(res,e,next); } });
router.patch("/types/:id",   superAdminOnly, async (req, res, next) => { try { ok(res, await svc.updateLeaveType(req.params.id, req.body)); } catch(e) { fail(res,e,next); } });
router.delete("/types/:id",  superAdminOnly, async (req, res, next) => { try { ok(res, await svc.deleteLeaveType(req.params.id), "Deleted"); } catch(e) { fail(res,e,next); } });

// ── Faculty leave balance ──────────────────────────────────────
router.get("/balance",       authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    if (!fac) return res.status(404).json({ success: false, message: "Faculty profile not found" });
    ok(res, await svc.getFacultyBalances(fac.id));
  } catch(e) { fail(res,e,next); }
});

// ── Lectures on dates (for transfer check) ────────────────────
router.get("/lectures",      authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    const { from_date, to_date } = req.query;
    ok(res, await svc.getLecturesOnDates(fac.id, from_date, to_date));
  } catch(e) { fail(res,e,next); }
});

// ── Substitution requests ──────────────────────────────────────
router.post("/substitution",       authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.requestSubstitution(
      req.body.entry_id, req.body.date, fac.id,
      req.body.substitute_faculty_id, req.body.reason, req.body.leave_id
    ), "Transfer request sent");
  } catch(e) { fail(res,e,next); }
});

router.post("/substitution/:id/respond", authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.respondSubstitution(
      req.params.id, fac.id, req.body.accept, req.body.note
    ), req.body.accept ? "Accepted" : "Rejected");
  } catch(e) { fail(res,e,next); }
});

router.get("/substitution/pending",   authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.getMySubstitutionRequests(fac.id));
  } catch(e) { fail(res,e,next); }
});

// ── Apply leave ────────────────────────────────────────────────
router.post("/apply",        authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.applyLeave({ ...req.body, faculty_id: fac.id }), "Leave application submitted");
  } catch(e) { fail(res,e,next); }
});

// ── My applications ────────────────────────────────────────────
router.get("/my",            authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.getMyApplications(fac.id, req.query.status));
  } catch(e) { fail(res,e,next); }
});

router.post("/cancel/:id",   authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.cancelLeave(req.params.id, fac.id), "Cancelled");
  } catch(e) { fail(res,e,next); }
});

// ── HOD approval ───────────────────────────────────────────────
router.get("/pending",       authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.getPendingForHod(fac.id));
  } catch(e) { fail(res,e,next); }
});

router.post("/:id/approve",  authenticate, async (req, res, next) => {
  try {
    const fac = await import("../../utils/prisma.js").then(m =>
      m.default.faculty.findUnique({ where: { user_id: req.user.id }, select: { id: true } })
    );
    ok(res, await svc.approveLeave(req.params.id, fac.id, req.body.approve, req.body.remarks),
       req.body.approve ? "Approved" : "Rejected");
  } catch(e) { fail(res,e,next); }
});

// ── Attendance mark ────────────────────────────────────────────
router.post("/attendance/mark", authenticate, async (req, res, next) => {
  try {
    ok(res, await svc.markAttendance(req.body), "Attendance saved");
  } catch(e) { fail(res,e,next); }
});

router.get("/attendance/summary", authenticate, async (req, res, next) => {
  try {
    const { section_id, from_date, to_date } = req.query;
    ok(res, await svc.getAttendanceSummary(section_id, from_date, to_date));
  } catch(e) { fail(res,e,next); }
});

export default router;