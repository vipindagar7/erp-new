// backend/modules/attendance/attendance.controller.js
import * as svc from "./attendance.service.js";

const ok   = (res, data, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success:false, message:e.message })
  : next(e);

// ── Mark attendance ───────────────────────────────────────────
export const markAttendance  = async (req,res,next) => { try { ok(res, await svc.markAttendance(req.validatedData, req.user), "Attendance marked"); } catch(e) { fail(res,e,next); } };
export const updateRecord    = async (req,res,next) => { try { ok(res, await svc.updateAttendanceRecord(req.params.id, req.validatedData, req.user)); } catch(e) { fail(res,e,next); } };
export const backEntry       = async (req,res,next) => { try { ok(res, await svc.backEntryAttendance(req.validatedData, req.user), "Back entry saved"); } catch(e) { fail(res,e,next); } };

// ── Fetch ─────────────────────────────────────────────────────
export const getLecture      = async (req,res,next) => { try { ok(res, await svc.getLectureAttendance(req.query)); } catch(e) { fail(res,e,next); } };
export const getDaily        = async (req,res,next) => { try { ok(res, await svc.getDailyAttendance(req.query)); } catch(e) { fail(res,e,next); } };

// ── Summary ───────────────────────────────────────────────────
export const getStudentSummary = async (req,res,next) => {
  try {
    const student_id = req.params.student_id || req.user?.student?.id;
    ok(res, await svc.getStudentSubjectSummary(student_id, req.query.session_id));
  } catch(e) { fail(res,e,next); }
};
export const getDegreeSummary = async (req,res,next) => {
  try {
    const student_id = req.params.student_id || req.user?.student?.id;
    ok(res, await svc.getStudentDegreeSummary(student_id));
  } catch(e) { fail(res,e,next); }
};
export const getSectionSummary = async (req,res,next) => { try { ok(res, await svc.getSectionAttendanceSummary(req.query)); } catch(e) { fail(res,e,next); } };

// ── Freeze / Unfreeze ─────────────────────────────────────────
export const freeze          = async (req,res,next) => { try { ok(res, await svc.freezeAttendance(req.validatedData, req.user), "Attendance frozen"); } catch(e) { fail(res,e,next); } };
export const unfreeze        = async (req,res,next) => { try { ok(res, await svc.unfreezeAttendance(req.validatedData, req.user), "Attendance unfrozen"); } catch(e) { fail(res,e,next); } };
export const getFreezeStatus = async (req,res,next) => { try { ok(res, await svc.getFreezeStatus(req.query.session_id)); } catch(e) { fail(res,e,next); } };
export const autoFreeze      = async (req,res,next) => { try { ok(res, await svc.autoFreezeYesterday(), "Auto-freeze complete"); } catch(e) { fail(res,e,next); } };

// ── Faculty biometric ─────────────────────────────────────────
export const biometricUpload = async (req,res,next) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:"No file" });
    ok(res, await svc.processBiometricUpload(req.file.buffer, req.body.format || "AUTO"));
  } catch(e) { fail(res,e,next); }
};
export const getFacultyAtt   = async (req,res,next) => {
  try {
    const faculty_id = req.params.faculty_id || req.user?.faculty?.id;
    ok(res, await svc.getFacultyAttendance({ faculty_id, ...req.query }));
  } catch(e) { fail(res,e,next); }
};
