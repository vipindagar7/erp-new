// backend/modules/student/student.controller.js
import * as svc from "./student.service.js";

const ok = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message })
  : next(e);
const sendXlsx = (res, raw, name) => {
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  res.setHeader("Content-Length", buf.length);
  res.end(buf);
};

// ── CRUD ──────────────────────────────────────────────────────
export const getAll = async (req, res, next) => { try { ok(res, await svc.getAllStudents(req.validatedData ?? req.query)); } catch (e) { fail(res, e, next); } };
export const getById = async (req, res, next) => { try { const s = await svc.getStudentById(req.params.id); if (!s) return res.status(404).json({ success: false, message: "Student not found" }); ok(res, s); } catch (e) { fail(res, e, next); } };
export const create = async (req, res, next) => { try { ok(res, await svc.createStudent(req.validatedData ?? req.body), "Student created", 201); } catch (e) { fail(res, e, next); } };
export const update = async (req, res, next) => { try { ok(res, await svc.updateStudent(req.params.id, req.validatedData ?? req.body), "Updated"); } catch (e) { fail(res, e, next); } };
export const remove = async (req, res, next) => { try { await svc.deleteStudent(req.params.id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };
export const restore = async (req, res, next) => { try { ok(res, await svc.restoreStudent?.(req.params.id) ?? null, "Restored"); } catch (e) { fail(res, e, next); } };

// ── Stats ─────────────────────────────────────────────────────
export const getStats = async (req, res, next) => { try { ok(res, await svc.getStudentStats?.()); } catch (e) { fail(res, e, next); } };

// ── Block / Unblock ───────────────────────────────────────────
export const toggleBlock = async (req, res, next) => {
  try {
    const isBlocked = req.body.isBlocked ?? (req.path.includes("block") && !req.path.includes("unblock"));
    const result = await svc.toggleStudentBlock(req.params.id, isBlocked);
    ok(res, result, isBlocked ? "Student blocked" : "Student unblocked");
  } catch (e) { fail(res, e, next); }
};
export const blockStudent = async (req, res, next) => { try { ok(res, await svc.toggleStudentBlock(req.params.id, true), "Blocked"); } catch (e) { fail(res, e, next); } };
export const unblockStudent = async (req, res, next) => { try { ok(res, await svc.toggleStudentBlock(req.params.id, false), "Unblocked"); } catch (e) { fail(res, e, next); } };

// ── Status change ─────────────────────────────────────────────
export const changeStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "status required" });
    ok(res, await svc.changeStudentStatus(req.params.id, status, reason, req.user), "Status updated");
  } catch (e) { fail(res, e, next); }
};

// ── Promote / Demote ──────────────────────────────────────────
export const promote = async (req, res, next) => { try { ok(res, await svc.promoteStudent(req.params.id), "Promoted"); } catch (e) { fail(res, e, next); } };
export const demote = async (req, res, next) => { try { ok(res, await svc.demoteStudent?.(req.params.id), "Demoted"); } catch (e) { fail(res, e, next); } };

export const bulkPromoteSection = async (req, res, next) => {
  try {
    const { ids, section_id, parity } = req.body;
    if (Array.isArray(ids) && ids.length) {
      const results = { promoted: [], skipped: [], failed: [], total: ids.length };
      for (const id of ids) {
        try { results.promoted.push({ id, ...(await svc.promoteStudent(id)) }); }
        catch (e) { (e.message?.includes("max") || e.message?.includes("No active") ? results.skipped : results.failed).push({ id, reason: e.message }); }
      }
      ok(res, results, `${results.promoted.length} promoted`);
    } else if (section_id) {
      ok(res, await svc.bulkPromoteSection(section_id, parity), "Bulk promoted");
    } else {
      res.status(400).json({ success: false, message: "ids or section_id required" });
    }
  } catch (e) { fail(res, e, next); }
};

export const bulkPromoteInstitution = async (req, res, next) => {
  try {
    const { fromParity, section_ids = [] } = req.body;
    if (!fromParity || !["ODD", "EVEN"].includes(fromParity))
      return res.status(400).json({ success: false, message: "fromParity must be ODD or EVEN" });
    ok(res, await svc.bulkPromoteInstitution?.(fromParity, section_ids), "Promoted");
  } catch (e) { fail(res, e, next); }
};

export const bulkDemote = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    ok(res, await svc.bulkDemoteStudents?.(ids), "Demoted");
  } catch (e) { fail(res, e, next); }
};

// ── Section change ────────────────────────────────────────────
export const changeSection = async (req, res, next) => {
  try {
    const { section_id } = req.body;
    if (!section_id) return res.status(400).json({ success: false, message: "section_id required" });
    ok(res, await svc.changeStudentSection(req.params.id, section_id), "Section changed");
  } catch (e) { fail(res, e, next); }
};

export const bulkChangeSection = async (req, res, next) => {
  try {
    const { student_ids, section_id } = req.body;
    if (!student_ids?.length) return res.status(400).json({ success: false, message: "student_ids required" });
    if (!section_id) return res.status(400).json({ success: false, message: "section_id required" });
    ok(res, await svc.bulkChangeSection?.(student_ids, section_id), "Sections changed");
  } catch (e) { fail(res, e, next); }
};

// ── Bulk ops ──────────────────────────────────────────────────
export const bulkBlock = async (req, res, next) => {
  try {
    const { ids, isBlocked } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    const results = { updated: [], failed: [] };
    for (const id of ids) {
      try { await svc.toggleStudentBlock(id, isBlocked); results.updated.push(id); }
      catch (e) { results.failed.push({ id, reason: e.message }); }
    }
    ok(res, results, `${results.updated.length} updated`);
  } catch (e) { fail(res, e, next); }
};

export const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    const results = { deleted: [], failed: [] };
    for (const id of ids) {
      try { await svc.deleteStudent(id); results.deleted.push(id); }
      catch (e) { results.failed.push({ id, reason: e.message }); }
    }
    ok(res, results, `${results.deleted.length} deleted`);
  } catch (e) { fail(res, e, next); }
};

export const bulkHardDelete = async (req, res, next) => {
  try {
    const { ids, reason } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    const results = { deleted: [], failed: [] };
    for (const id of ids) {
      try { await svc.hardDeleteStudent?.(id, reason, req.user); results.deleted.push(id); }
      catch (e) { results.failed.push({ id, reason: e.message }); }
    }
    ok(res, results, `${results.deleted.length} permanently deleted`);
  } catch (e) { fail(res, e, next); }
};

export const bulkEnrollmentStatus = async (req, res, next) => {
  try {
    const { ids, status, remarks } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    if (!status) return res.status(400).json({ success: false, message: "status required" });
    const results = { updated: [], failed: [] };
    for (const id of ids) {
      try { await svc.updateEnrollmentStatus(id, { status, remarks }); results.updated.push(id); }
      catch (e) { results.failed.push({ id, reason: e.message }); }
    }
    ok(res, results, `${results.updated.length} updated`);
  } catch (e) { fail(res, e, next); }
};

// ── Template / Export ─────────────────────────────────────────
export const getTemplate = async (req, res, next) => {
  try {
    const raw = await svc.generateStudentTemplate(req.query);
    sendXlsx(res, raw, `student-template-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) { fail(res, e, next); }
};

export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    ok(res, await svc.bulkCreateStudents(req.file.buffer));
  } catch (e) { fail(res, e, next); }
};

export const exportStudents = async (req, res, next) => {
  try {
    const raw = await svc.exportStudents?.(req.query);
    if (!raw) return res.status(404).json({ success: false, message: "Export not available" });
    sendXlsx(res, raw, `students-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) { fail(res, e, next); }
};

export const sectionAssignTemplate = async (req, res, next) => {
  try {
    const raw = await svc.getSectionAssignTemplate?.(req.query);
    if (!raw) return res.status(404).json({ success: false, message: "Not available" });
    sendXlsx(res, raw, `section-assign-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) { fail(res, e, next); }
};

export const sectionAssignUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    ok(res, await svc.bulkAssignSection?.(req.file.buffer, req.user));
  } catch (e) { fail(res, e, next); }
};

// ── History / Rollback ────────────────────────────────────────
export const getHistory = async (req, res, next) => {
  try {
    const history = await svc.getStudentHistory?.(req.params.id) ?? [];
    ok(res, history);
  } catch (e) { fail(res, e, next); }
};

export const getEnrollmentHistory = async (req, res, next) => {
  try {
    const history = await svc.getStudentEnrollmentHistory?.(req.params.id) ?? [];
    ok(res, history);
  } catch (e) { fail(res, e, next); }
};

export const rollback = async (req, res, next) => {
  try {
    ok(res, await svc.rollbackStudentHistory?.(req.params.id, req.params.history_id, req.body.reason, req.user), "Rolled back");
  } catch (e) { fail(res, e, next); }
};

// ── Photo upload ──────────────────────────────────────────────
export const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const result = await svc.uploadStudentPhoto?.(req.params.id, req.file);
    res.json({ success: true, data: result });
  } catch (e) { fail(res, e, next); }
};

// ── Bulk photo upload (zip file with roll_no.jpg files) ───────
export const bulkPhotoUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No zip file" });
    const result = await svc.bulkUploadStudentPhotos?.(req.file);
    res.json({ success: true, data: result || { message: "Bulk photo upload processed" } });
  } catch (e) { fail(res, e, next); }
};

// ── Change login email (student) ─────────────────────────────
export const changeEmail = async (req, res, next) => {
  try {
    const { new_email } = req.body;
    if (!new_email?.trim()) return res.status(400).json({ success: false, message: "new_email required" });
    if (!/\S+@\S+\.\S+/.test(new_email)) return res.status(400).json({ success: false, message: "Invalid email" });
    const student = await svc.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    const existing = await (await import("../../utils/prisma.js")).default.user.findUnique({ where: { email: new_email.toLowerCase().trim() } });
    if (existing && existing.id !== student.user_id) return res.status(409).json({ success: false, message: "Email already in use" });
    const prisma = (await import("../../utils/prisma.js")).default;
    await prisma.user.update({ where: { id: student.user_id }, data: { email: new_email.toLowerCase().trim() } });
    ok(res, { email: new_email.toLowerCase().trim() }, "Email updated");
  } catch (e) { fail(res, e, next); }
};

// ── Reset password (root) ─────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    if (!new_password) return res.status(400).json({ success: false, message: "new_password required" });
    const student = await svc.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.default.hash(new_password, 12);
    const prisma = (await import("../../utils/prisma.js")).default;
    await prisma.user.update({ where: { id: student.user_id }, data: { passwordHash: hash, must_change_password: req.body.force_change ?? true } });
    ok(res, null, "Password reset");
  } catch (e) { fail(res, e, next); }
};

// GET /students/all — no pagination, for dropdowns/selects
export const getAllNoPaginate = async (req, res, next) => {
  try {
    const { section_id, status, dept_id } = req.query;
    const where = { deleted_at: null };
    if (section_id) where.section_id = section_id;
    if (status) where.status = status;
    if (dept_id) where.dept_id = dept_id;
    const students = await prisma.student.findMany({
      where,
      select: {
        id: true, name: true, roll_no: true, enrollment_no: true, status: true,
        section: { select: { id: true, name: true } }
      },
      orderBy: { roll_no: 'asc' },
      take: 500,
    });
    res.json({ success: true, data: students });
  } catch (e) { next(e); }
};