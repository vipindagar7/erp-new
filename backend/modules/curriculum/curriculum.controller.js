// backend/modules/curriculum/curriculum.controller.js
import * as svc from "./curriculum.service.js";

const ok = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, err) => res.status(err.status || err.statusCode || 500).json({ success: false, message: err.message });

export const getAll = async (req, res) => {
  try { ok(res, await svc.getCurriculum(req.query)); }
  catch (e) { fail(res, e); }
};

export const addSubject = async (req, res) => {
  try { ok(res, await svc.addCurriculumSubject(req.validatedData ?? req.body, req.user), "Added", 201); }
  catch (e) { fail(res, e); }
};

export const removeSubject = async (req, res) => {
  try { ok(res, await svc.removeCurriculumSubject(req.params.id), "Removed"); }
  catch (e) { fail(res, e); }
};

export const getTemplate = async (req, res) => {
  try {
    const { buffer, filename } = await svc.getCurriculumTemplate();
    const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", b.length);
    res.end(b);
  } catch (e) { fail(res, e); }
};

export const bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    ok(res, await svc.bulkUploadCurriculum(req.file.buffer, req.user));
  } catch (e) { fail(res, e); }
};

export const autoAssignSection = async (req, res) => {
  try {
    ok(res, await svc.autoAssignSubjectsToSection(
      req.params.section_id,
      { reason: req.body?.reason || "manual", changed_by: req.user?.id }
    ));
  } catch (e) { fail(res, e); }
};

export const bulkAutoAssign = async (req, res) => {
  try {
    let section_ids = req.body?.section_ids || [];
    if (!section_ids.length) {
      // Auto-assign to ALL active sections
      const { default: prisma } = await import("../../utils/prisma.js");
      const secs = await prisma.section.findMany({ where: { status: "ACTIVE", deleted_at: null }, select: { id: true } });
      section_ids = secs.map(s => s.id);
    }
    ok(res, await svc.bulkAutoAssign(section_ids));
  } catch (e) { fail(res, e); }
};

// ── Faculty assignment ────────────────────────────────────────
export const assignFaculty = async (req, res) => {
  try {
    const { section_id, subject_id, faculty_id } = req.body;
    if (!section_id || !subject_id || !faculty_id)
      return res.status(400).json({ success: false, message: "section_id, subject_id, faculty_id required" });
    ok(res, await svc.assignFacultyToSubject({ section_id, subject_id, faculty_id }, req.user));
  } catch (e) { fail(res, e); }
};

export const getFacultyAssignmentTemplate = async (req, res) => {
  try {
    const buffer = await svc.getFacultyAssignmentTemplate();
    const bf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="faculty-assignment-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.setHeader("Content-Length", bf.length);
    res.end(bf);
  } catch (e) { fail(res, e); }
};

export const bulkAssignFaculty = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    ok(res, await svc.bulkAssignFaculty(req.file.buffer, req.user));
  } catch (e) { fail(res, e); }
};

export const getSectionAssignments = async (req, res) => {
  try { ok(res, await svc.getSectionSubjectAssignments(req.params.section_id)); }
  catch (e) { fail(res, e); }
};

export const getHistory = async (req, res) => {
  try { ok(res, await svc.getCurriculumHistory(req.params.section_id)); }
  catch (e) { fail(res, e); }
};