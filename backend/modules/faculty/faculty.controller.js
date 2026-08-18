// backend/modules/faculty/faculty.controller.js
// ─────────────────────────────────────────────────────────────
// Single import, all exports explicitly named
// ─────────────────────────────────────────────────────────────
import * as svc    from "./faculty.service.js";
import prisma      from "../../utils/prisma.js";
import { logExportEvent } from "../../middlewares/audit.middleware.js";
import multer      from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const ok   = (res, data, msg="OK", s=200) =>
  res.status(s).json({ success:true, message:msg, data });
const fail = (res, e, next) =>
  e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);
const sendXlsx = (res, raw, name) => {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition",`attachment; filename="${name}"`);
  res.setHeader("Content-Length", buf.length);
  res.end(buf);
};

// ── List / Get ────────────────────────────────────────────────
export async function getAll(req, res, next) {
  try {
    const { page=1, limit=50, search, dept_id, designation, employee_type, gender, status } = req.query;
    const result = await svc.getAllFaculty({ page:Number(page), limit:Number(limit), search, dept_id, designation, employee_type, gender, status });
    // Service returns { data: { faculty, pagination } } — unwrap to keep frontend working
    const payload = result?.data ?? result;
    res.json({ success: true, message: "OK", data: payload });
  } catch(e) { fail(res,e,next); }
}

export async function getOne(req, res, next) {
  try {
    const data = await svc.getFacultyById(req.params.id);
    if (!data) return res.status(404).json({ success:false, message:"Faculty not found" });
    ok(res, data);
  } catch(e) { fail(res,e,next); }
}

export async function getMe(req, res, next) {
  try {
    const faculty = await svc.getFacultyByUserId(req.user.id);
    if (!faculty) return res.status(404).json({ success:false, message:"Faculty profile not found" });
    ok(res, faculty);
  } catch(e) { fail(res,e,next); }
}

// ── CRUD ──────────────────────────────────────────────────────
export async function create(req, res, next) {
  try { ok(res, await svc.createFaculty(req.validatedData ?? req.body), "Faculty created", 201); }
  catch(e) { fail(res,e,next); }
}

export async function update(req, res, next) {
  try { ok(res, await svc.updateFaculty(req.params.id, req.validatedData ?? req.body), "Updated"); }
  catch(e) { fail(res,e,next); }
}

export async function remove(req, res, next) {
  try { await svc.deleteFaculty(req.params.id); ok(res,null,"Deleted"); }
  catch(e) { fail(res,e,next); }
}

export async function restore(req, res, next) {
  try { ok(res, await svc.restoreFaculty(req.params.id), "Restored"); }
  catch(e) { fail(res,e,next); }
}

// ── Block ─────────────────────────────────────────────────────
export async function block(req, res, next) {
  try {
    const f = await prisma.faculty.findUnique({ where:{ id:req.params.id }, select:{ user_id:true } });
    if (!f) return res.status(404).json({ success:false, message:"Not found" });
    const user = await prisma.user.findUnique({ where:{ id:f.user_id } });
    const isBlocked = !user.isBlocked;
    await prisma.user.update({ where:{ id:f.user_id }, data:{ isBlocked } });
    ok(res, { isBlocked }, isBlocked ? "Faculty blocked" : "Faculty unblocked");
  } catch(e) { fail(res,e,next); }
}

// ── Change login email ────────────────────────────────────────
export async function changeEmail(req, res, next) {
  try {
    const { new_email } = req.body;
    if (!new_email?.trim()) return res.status(400).json({ success:false, message:"new_email required" });
    if (!/\S+@\S+\.\S+/.test(new_email)) return res.status(400).json({ success:false, message:"Invalid email" });

    const f = await prisma.faculty.findUnique({ where:{ id:req.params.id }, select:{ user_id:true } });
    if (!f) return res.status(404).json({ success:false, message:"Faculty not found" });

    const dup = await prisma.user.findUnique({ where:{ email:new_email.toLowerCase().trim() } });
    if (dup && dup.id !== f.user_id) return res.status(409).json({ success:false, message:"Email already in use" });

    await prisma.user.update({ where:{ id:f.user_id }, data:{ email:new_email.toLowerCase().trim() } });
    ok(res, { email:new_email.toLowerCase().trim() }, "Email updated");
  } catch(e) { fail(res,e,next); }
}

// ── Reset password ────────────────────────────────────────────
export async function resetPassword(req, res, next) {
  try {
    const { new_password, force_change = true } = req.body;
    if (!new_password) return res.status(400).json({ success:false, message:"new_password required" });

    const f = await prisma.faculty.findUnique({ where:{ id:req.params.id }, select:{ user_id:true } });
    if (!f) return res.status(404).json({ success:false, message:"Faculty not found" });

    const bcrypt = await import("bcrypt");
    const hash   = await bcrypt.default.hash(new_password, 12);
    await prisma.user.update({ where:{ id:f.user_id }, data:{ passwordHash:hash, must_change_password:force_change } });
    ok(res, null, "Password reset");
  } catch(e) { fail(res,e,next); }
}

// ── Change status ─────────────────────────────────────────────
export async function changeStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ success:false, message:"status required" });
    ok(res, await svc.changeFacultyStatus?.(req.params.id, status, reason, req.user) ?? null, "Status updated");
  } catch(e) { fail(res,e,next); }
}

// ── Career history ────────────────────────────────────────────
export async function getCareerHistory(req, res, next) {
  try { ok(res, await svc.getFacultyCareerHistory?.(req.params.id) ?? []); }
  catch(e) { fail(res,e,next); }
}

// ── Rollback ──────────────────────────────────────────────────
export async function rollback(req, res, next) {
  try { ok(res, await svc.rollbackFaculty?.(req.params.id, req.params.history_id, req.body.reason, req.user), "Rolled back"); }
  catch(e) { fail(res,e,next); }
}

// ── Assign subjects ───────────────────────────────────────────
export async function assignSubjects(req, res, next) {
  try { ok(res, await svc.assignSubjects(req.params.id, req.body.subject_ids || [])); }
  catch(e) { fail(res,e,next); }
}

// ── Photo ─────────────────────────────────────────────────────
export async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:"No file" });
    const data = await svc.uploadFacultyPhoto(req.params.id, req.file);
    ok(res, { photo_url: data.photo_url });
  } catch(e) { fail(res,e,next); }
}

// ── Analytics ─────────────────────────────────────────────────
export async function getAnalytics(req, res, next) {
  try { ok(res, await svc.getFacultyAnalytics?.(req.params.id) ?? {}); }
  catch(e) { fail(res,e,next); }
}

// ── Template + Bulk upload ────────────────────────────────────
export async function getTemplate(req, res, next) {
  try {
    const raw = await svc.getFacultyTemplate();
    if (!raw) return res.status(500).json({ success:false, message:"Template generation failed" });
    sendXlsx(res, raw, "faculty-template.xlsx");
  } catch(e) { fail(res,e,next); }
}

export async function bulkUpload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:"No file" });
    ok(res, await svc.bulkUploadFaculty(req.file.buffer));
  } catch(e) { fail(res,e,next); }
}

// ── Export ────────────────────────────────────────────────────
export async function exportBasic(req, res, next) {
  try {
    await logExportEvent(req, "faculty", {});
    const raw = await svc.exportFacultyReport();
    sendXlsx(res, raw, `faculty-export-${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch(e) { fail(res,e,next); }
}

export async function exportAdvanced(req, res, next) {
  try {
    await logExportEvent(req, "faculty", req.query);
    const raw = await svc.exportFacultyAdvanced(req.query);
    sendXlsx(res, raw, `faculty-advanced-${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch(e) { fail(res,e,next); }
}

// ── Sensitive fields (salary / bank) ─────────────────────────
export async function getSalary(req, res, next) {
  try { ok(res, await svc.getFacultySalary(req.params.id)); }
  catch(e) { fail(res,e,next); }
}

export async function getBankDetails(req, res, next) {
  try { ok(res, await svc.getFacultyBank(req.params.id)); }
  catch(e) { fail(res,e,next); }
}

// ── ID card PDF ───────────────────────────────────────────────
export async function getIdCardPdf(req, res, next) {
  try {
    const faculty = await svc.getFacultyById(req.params.id);
    res.json({ success:true, message:"ID card not implemented yet", data:{ faculty_id:req.params.id } });
  } catch(e) { fail(res,e,next); }
}