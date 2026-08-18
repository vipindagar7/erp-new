// backend/modules/faculty/faculty.subject.routes.js
import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./faculty.subject.service.js";

const router = Router();
const ok   = (res, data, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success:false, message:e.message })
  : next(e);

router.use(authenticate);

// Faculty requests a subject preference
router.post("/request", async (req, res, next) => {
  try { ok(res, await svc.requestSubjectPreference(req.user?.faculty?.id || req.body.faculty_id, req.body, req.user), "Preference requested", 201); }
  catch(e) { fail(res, e, next); }
});

// List requests (dept admin sees all in dept, faculty sees own)
router.get("/requests", async (req, res, next) => {
  try {
    const filters = { ...req.query };
    // If faculty role — restrict to own
    if (req.user?.role === "FACULTY" && !req.user?.is_root) {
      filters.faculty_id = req.user?.faculty?.id;
    }
    ok(res, await svc.listRequests(filters));
  } catch(e) { fail(res, e, next); }
});

// Dept admin review (approve/reject)
router.patch("/requests/:id/review", requirePerm("faculty.manage"), async (req, res, next) => {
  try { ok(res, await svc.reviewRequest(req.params.id, req.body.action, req.user, req.body.note)); }
  catch(e) { fail(res, e, next); }
});

// Bulk review
router.post("/requests/bulk-review", requirePerm("faculty.manage"), async (req, res, next) => {
  try { ok(res, await svc.bulkReview(req.body.request_ids, req.body.action, req.user, req.body.note)); }
  catch(e) { fail(res, e, next); }
});

export default router;