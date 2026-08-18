// backend/modules/attendance/attendance.routes.js
// MERGED: existing routes + consecutive check + faculty biometric + extra
import { Router } from "express";
import multer     from "multer";
import { authenticate, requirePerm, superAdminOnly, rootOnly } from "../../middlewares/auth.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c    from "./attendance.controller.js";
import * as svc  from "./attendance.service.js";
import {
  markAttendanceSchema, updateSingleSchema,
  backEntrySchema, freezeSchema, attendanceQuerySchema,
} from "./attendance.validator.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ok     = (res, data, msg="OK") => res.json({ success:true, message:msg, data });
const fail   = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);
router.use(authenticate);

// ── Student attendance — mark ──────────────────────────────────
router.post("/mark",        requirePerm("attendance.manage"), validate(markAttendanceSchema), c.markAttendance);
router.patch("/record/:id", requirePerm("attendance.manage"), validate(updateSingleSchema),   c.updateRecord);
router.post("/back-entry",  superAdminOnly,                   validate(backEntrySchema),       c.backEntry);

// ── Student attendance — fetch ────────────────────────────────
router.get("/lecture",      requirePerm("attendance.view"), validate(attendanceQuerySchema,"query"), c.getLecture);
router.get("/daily",        requirePerm("attendance.view"), validate(attendanceQuerySchema,"query"), c.getDaily);

// ── Section students (for attendance marking UI) ───────────────
router.get("/students",     requirePerm("attendance.view"), async (req,res,next) => {
  try { ok(res, await svc.getSectionStudents(req.query.section_id)); } catch(e){fail(res,e,next);}
});

// ── Consecutive period check ──────────────────────────────────
router.get("/consecutive",  requirePerm("attendance.view"), async (req,res,next) => {
  try {
    const { timetable_id, period_config_id, day } = req.query;
    ok(res, await svc.checkConsecutive(timetable_id, period_config_id, day));
  } catch(e){fail(res,e,next);}
});

// ── Summary ───────────────────────────────────────────────────
router.get("/summary/student/:student_id", requirePerm("attendance.view"), c.getStudentSummary);
router.get("/summary/my",                                                   c.getStudentSummary);
router.get("/summary/degree/:student_id",  requirePerm("attendance.view"), c.getDegreeSummary);
router.get("/summary/degree/my",                                            c.getDegreeSummary);
router.get("/summary/section",             requirePerm("attendance.report"), validate(attendanceQuerySchema,"query"), c.getSectionSummary);

// ── Freeze / Unfreeze ─────────────────────────────────────────
router.post("/freeze",         requirePerm("attendance.freeze"), validate(freezeSchema), c.freeze);
router.post("/unfreeze",       requirePerm("attendance.freeze"), validate(freezeSchema), c.unfreeze);
router.get( "/freeze-status",  requirePerm("attendance.view"),         c.getFreezeStatus);
router.post("/auto-freeze",    rootOnly,                                c.autoFreeze);

// ── Faculty biometric ─────────────────────────────────────────
router.post("/biometric/upload", superAdminOnly, upload.single("file"), c.biometricUpload);
router.get( "/faculty/my",                                               c.getFacultyAtt);
router.get( "/faculty/:faculty_id", requirePerm("faculty.view"),        c.getFacultyAtt);

export default router;