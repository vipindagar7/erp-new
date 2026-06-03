import * as svc from "./section.service.js";

const ok = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => {
  if (e.status || e.statusCode) return res.status(e.status || e.statusCode).json({ success: false, message: e.message });
  next(e);
};

export const getAll = async (req, res, next) => { try { ok(res, await svc.getAllSections(req.validatedData ?? req.query)); } catch (e) { fail(res, e, next); } };
export const getById = async (req, res, next) => { try { const r = await svc.getSectionById(req.params.id); if (!r) return res.status(404).json({ success: false, message: "Section not found" }); ok(res, r); } catch (e) { fail(res, e, next); } };
export const create = async (req, res, next) => { try { ok(res, await svc.createSection(req.validatedData), "Section created", 201); } catch (e) { fail(res, e, next); } };
export const update = async (req, res, next) => { try { ok(res, await svc.updateSection(req.params.id, req.validatedData ?? req.body), "Section updated"); } catch (e) { fail(res, e, next); } };
export const remove = async (req, res, next) => { try { await svc.deleteSection(req.params.id); ok(res, null, "Section deleted"); } catch (e) { fail(res, e, next); } };

export const assignSubjectToSection = async (req, res, next) => {
  try {
    const { subject_id, faculty_id, type, status } = req.validatedData ?? req.body;
    const r = await svc.assignSubjectToSection(req.params.id, subject_id, faculty_id || null, type, status);
    ok(res, r, "Subject assigned");
  } catch (e) { fail(res, e, next); }
};

export const updateSectionSubjectFaculty = async (req, res, next) => {
  try {
    const r = await svc.updateSectionSubject(req.params.id, req.params.subject_id, req.validatedData ?? req.body);
    ok(res, r, "Subject assignment updated");
  } catch (e) { fail(res, e, next); }
};

export const removeSubject = async (req, res, next) => {
  try {
    const r = await svc.removeSubjectFromSection(req.params.id, req.params.subject_id);
    ok(res, r, "Subject removed");
  } catch (e) { fail(res, e, next); }
};

export const promote = async (req, res, next) => {
  try {
    const { remarks } = req.validatedData ?? req.body;
    ok(res, await svc.promoteSection(req.params.id, remarks), "Section promoted");
  } catch (e) { fail(res, e, next); }
};

export const promoteMultiple = async (req, res, next) => {
  try {
    const { section_ids, remarks } = req.validatedData ?? req.body;
    ok(res, await svc.promoteMultipleSections(section_ids, remarks), "Sections promoted");
  } catch (e) { fail(res, e, next); }
};

export const bulkStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.validatedData ?? req.body;
    ok(res, await svc.setSectionStatus(req.params.id, status, remarks), "Status updated");
  } catch (e) { fail(res, e, next); }
};

export const getStudentCounts = async (req, res, next) => {
  try {
    const { section_ids } = req.validatedData ?? req.body;
    ok(res, await svc.getSectionStudentCounts(section_ids));
  } catch (e) { fail(res, e, next); }
};

// ── Subject template download ─────────────────────────────────
export const getSubjectTemplate = async (req, res, next) => {
  try {
    const { buffer, filename } = await svc.getSectionSubjectTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) { fail(res, e, next); }
};

// ── Bulk assign subjects from Excel ──────────────────────────
export const bulkAssignSubjects = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Excel file required" });
    const results = await svc.bulkAssignSubjects(req.file.buffer);
    ok(res, results, `${results.created.length} assigned, ${results.updated?.length || 0} updated, ${results.failed.length} failed`);
  } catch (e) { fail(res, e, next); }
};