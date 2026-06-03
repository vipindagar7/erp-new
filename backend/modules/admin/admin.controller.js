// backend/modules/admin/admin.controller.js
import * as svc from "./admin.service.js";

const ok       = (res, data, status = 200)    => res.status(status).json({ success: true, ...data });
const fail     = (res, e, next)               => { if (e?.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); };
const notFound = (res, msg = "Not found")     => res.status(404).json({ success: false, message: msg });
const sendXlsx = (res, buf, name)             => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${name}`);
  return res.send(buf);
};

// ── Dashboard ────────────────────────────────────────────────
export const getDashboardStats    = async (req, res, next) => { try { ok(res, { data: await svc.getDashboardStats() }); } catch (e) { fail(res, e, next); } };
export const getDashboardActivity = async (req, res, next) => { try { ok(res, { data: await svc.getActivityFeed() }); } catch (e) { fail(res, e, next); } };

// ── Admin CRUD ───────────────────────────────────────────────
export const listAdmins = async (req, res, next) => {
  try {
    const { page, limit, search } = req.validated ?? req.query;
    ok(res, await svc.listAdmins({ page, limit, search }));
  } catch (e) { fail(res, e, next); }
};

export const getAdminById = async (req, res, next) => {
  try {
    const data = await svc.getAdminById(req.params.id);
    if (!data) return notFound(res);
    ok(res, { admin: data });
  } catch (e) { fail(res, e, next); }
};

export const createAdmin = async (req, res, next) => {
  try {
    const result = await svc.createAdmin(req.body);
    if (result.error === "email_taken")
      return res.status(409).json({ success: false, message: "Email already in use" });
    ok(res, result, 201);
  } catch (e) { fail(res, e, next); }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const data = await svc.updateAdmin(req.params.id, req.body);
    if (!data) return notFound(res);
    ok(res, { admin: data });
  } catch (e) { fail(res, e, next); }
};

export const updatePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions))
      return res.status(400).json({ success: false, message: "permissions must be an array" });
    const data = await svc.updatePermissions(req.params.id, permissions);
    if (!data) return notFound(res);
    ok(res, { admin: data });
  } catch (e) { fail(res, e, next); }
};

export const toggleBlock = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ success: false, message: "Cannot block yourself" });
    const data = await svc.toggleBlock(req.params.id);
    if (!data) return notFound(res);
    ok(res, data);
  } catch (e) { fail(res, e, next); }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const result = await svc.deleteAdmin(req.params.id, req.user.id);
    if (result.error === "not_found")                return notFound(res);
    if (result.error === "cannot_delete_super_admin") return res.status(403).json({ success: false, message: "Cannot delete a Super Admin" });
    if (result.error === "cannot_delete_self")        return res.status(403).json({ success: false, message: "You cannot delete your own account" });
    ok(res, { message: "Admin deleted" });
  } catch (e) { fail(res, e, next); }
};

// ── Reports ──────────────────────────────────────────────────
export const exportStudents   = async (req, res, next) => { try { sendXlsx(res, await svc.exportStudentsBySection(req.query.section_id), "students_report.xlsx"); } catch (e) { fail(res, e, next); } };
export const exportFaculty    = async (req, res, next) => { try { sendXlsx(res, await svc.exportFacultyReport(), "faculty_report.xlsx"); } catch (e) { fail(res, e, next); } };
export const exportEnrollments= async (req, res, next) => { try { sendXlsx(res, await svc.exportEnrollmentReport(), "enrollment_report.xlsx"); } catch (e) { fail(res, e, next); } };

// ── User actions ──────────────────────────────────────────────
export const resetUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    const result = await svc.resetUserPassword(req.params.userId, password);
    ok(res, { message: `Password reset for ${result.email}` });
  } catch (e) { fail(res, e, next); }
};

export const impersonateUser = async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id)
      return res.status(400).json({ success: false, message: "Cannot impersonate yourself" });
    const result = await svc.impersonateUser(req.params.userId, req.user.id);
    if (result.user.role === "SUPER_ADMIN")
      return res.status(403).json({ success: false, message: "Cannot impersonate a Super Admin" });
    ok(res, { data: result, message: "Impersonation token issued" });
  } catch (e) { fail(res, e, next); }
};