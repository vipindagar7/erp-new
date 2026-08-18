// backend/modules/section/section.controller.js
// FIXED: restore function uses correct svc import
import prisma from "../../utils/prisma.js";
import * as svc from "./section.service.js";

const ok = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => {
  if (e.status || e.statusCode) return res.status(e.status || e.statusCode).json({ success: false, message: e.message });
  next(e);
};

export const getAll = async (req, res, next) => { try { ok(res, await svc.getAllSections(req.validatedData ?? req.query)); } catch (e) { fail(res, e, next); } };
export const getById = async (req, res, next) => { try { const r = await svc.getSectionById(req.params.id); if (!r) return res.status(404).json({ success: false, message: "Section not found" }); ok(res, r); } catch (e) { fail(res, e, next); } };
export const create = async (req, res, next) => { try { ok(res, await svc.createSection(req.validatedData ?? req.body, req.user), "Section created", 201); } catch (e) { fail(res, e, next); } };
export const update = async (req, res, next) => { try { ok(res, await svc.updateSection(req.params.id, req.validatedData ?? req.body, req.user), "Section updated"); } catch (e) { fail(res, e, next); } };
export const remove = async (req, res, next) => { try { await svc.deleteSection(req.params.id); ok(res, null, "Section deleted"); } catch (e) { fail(res, e, next); } };

export const restore = async (req, res, next) => {
  try {
    const data = await svc.restoreSection(req.params.id);
    ok(res, data, "Section restored");
  } catch (e) { fail(res, e, next); }
};

export const assignSubjectToSection = async (req, res, next) => {
  try {
    const { subject_id, faculty_id, type, status } = req.validatedData ?? req.body;
    
    console.log(req.params.id)
     
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

export const getSubjectTemplate = async (req, res, next) => {
  try {
    const { buffer, filename } = await svc.getSectionSubjectTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) { fail(res, e, next); }
};

export const bulkAssignSubjects = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Excel file required" });
    const results = await svc.bulkAssignSubjects(req.file.buffer);
    ok(res, results, `${results.created.length} assigned, ${results.updated?.length || 0} updated, ${results.failed.length} failed`);
  } catch (e) { fail(res, e, next); }
};

export const getSectionHistory = async (req, res, next) => {
  try {
    if (!prisma.sectionHistory) return res.json({ success: true, data: [] });
    const { limit = 100, action } = req.query;
    const history = await prisma.sectionHistory.findMany({
      where: {
        section_id: req.params.id,
        ...(action && action !== "all" && { action }),
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });
    ok(res, history);
  } catch (e) { fail(res, e, next); }
};

export const getAllSectionHistory = async (req, res, next) => {
  try {
    const data = await svc.getAllSectionHistory(req.query);
    ok(res, data);
  } catch (e) { fail(res, e, next); }
};

// ── V3 additions ──────────────────────────────────────────────

export const getSnapshots   = async (req, res, next) => { try { ok(res, await svc.getSectionSnapshots(req.params.id));         } catch(e) { fail(res,e,next); } };
export const getSnapshotOne = async (req, res, next) => { try { ok(res, await svc.getSnapshotDetail(req.params.snap_id));      } catch(e) { fail(res,e,next); } };

export const getStudents    = async (req, res, next) => { try { ok(res, await svc.getSectionStudents(req.params.id, req.query)); } catch(e) { fail(res,e,next); } };
export const addStudents    = async (req, res, next) => { try { ok(res, await svc.addStudentsToSection(req.params.id, req.body.student_ids || [], req.user)); } catch(e) { fail(res,e,next); } };
export const removeStudents = async (req, res, next) => { try { ok(res, await svc.removeStudentsFromSection(req.params.id, req.body.student_ids || [], req.user)); } catch(e) { fail(res,e,next); } };

export const getGroupTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getGroupAssignTemplate(req.params.id);
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",`attachment; filename="group-assign-${req.params.id}.xlsx"`);
    res.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
  } catch(e) { fail(res,e,next); }
};
export const uploadGroups    = async (req, res, next) => { try { if (!req.file) return res.status(400).json({success:false,message:"No file"}); ok(res, await svc.bulkAssignGroups(req.params.id, req.file.buffer, req.user)); } catch(e) { fail(res,e,next); } };
export const assignGroups    = async (req, res, next) => { try { ok(res, await svc.assignGroups(req.params.id, req.body.assignments || [], req.user));             } catch(e) { fail(res,e,next); } };

export const getFyeTemplate  = async (req, res, next) => {
  try {
    const buf = await svc.getFyeSplitTemplate(req.params.id);
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",`attachment; filename="fye-split-${req.params.id}.xlsx"`);
    res.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
  } catch(e) { fail(res,e,next); }
};
export const uploadFyeSplit  = async (req, res, next) => { try { if (!req.file) return res.status(400).json({success:false,message:"No file"}); ok(res, await svc.fyeSplitFromTemplate(req.params.id, req.file.buffer, req.user)); } catch(e) { fail(res,e,next); } };

export const promoteSection  = async (req, res, next) => { try { ok(res, await svc.promoteSection(req.params.id, req.body, req.user),  "Section promoted"); } catch(e) { fail(res,e,next); } };
export const demoteSection   = async (req, res, next) => { try { ok(res, await svc.demoteSection(req.params.id, req.body, req.user),   "Section demoted");  } catch(e) { fail(res,e,next); } };
export const detainStudents  = async (req, res, next) => { try { ok(res, await svc.detainStudents(req.params.id, req.body.student_ids, req.body.reason, req.user)); } catch(e) { fail(res,e,next); } };
export const fyeSplit        = async (req, res, next) => { try { ok(res, await svc.fyeSplit(req.params.id, req.body.assignments, req.body.reason, req.user), "FYE split complete"); } catch(e) { fail(res,e,next); } };
export const promoteStudent  = async (req, res, next) => { try { ok(res, await svc.promoteStudent(req.body.student_id, req.body.to_section_id, req.body.reason, req.user)); } catch(e) { fail(res,e,next); } };
export const rollback        = async (req, res, next) => { try { ok(res, await svc.rollbackSection(req.params.id, req.params.snap_id, req.body.reason, req.user), "Rolled back"); } catch(e) { fail(res,e,next); } };

// Bulk promote/demote/graduate
export const bulkPromote     = async (req, res, next) => { try { const { section_ids, reason } = req.body; if (!section_ids?.length) return res.status(400).json({success:false,message:"section_ids required"}); ok(res, await svc.bulkPromoteSections(section_ids, reason, req.user), "Sections promoted"); } catch(e) { fail(res,e,next); } };
export const bulkDemote      = async (req, res, next) => { try { const { section_ids, reason } = req.body; if (!section_ids?.length) return res.status(400).json({success:false,message:"section_ids required"}); ok(res, await svc.bulkDemoteSections(section_ids, reason, req.user), "Sections demoted");  } catch(e) { fail(res,e,next); } };
export const graduate        = async (req, res, next) => { try { const { section_ids, reason } = req.body; if (!section_ids?.length) return res.status(400).json({success:false,message:"section_ids required"}); ok(res, await svc.graduateSections(section_ids, reason, req.user), "Sections graduated"); } catch(e) { fail(res,e,next); } };

// Student status bulk
export const statusTemplate  = async (req, res, next) => {
  try {
    const buf = await svc.getStudentStatusTemplate(req.query);
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",`attachment; filename="student-status-${new Date().toISOString().slice(0,10)}.xlsx"`);
    res.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
  } catch(e) { fail(res,e,next); }
};
export const statusUpload    = async (req, res, next) => { try { if (!req.file) return res.status(400).json({success:false,message:"No file"}); ok(res, await svc.bulkUpdateStudentStatus(req.file.buffer, req.body?.global_status?.toUpperCase()||null, req.user)); } catch(e) { fail(res,e,next); } };

// Transfer
export const transferTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getTransferTemplate(req.query);
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",`attachment; filename="transfer-template-${new Date().toISOString().slice(0,10)}.xlsx"`);
    res.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
  } catch(e) { fail(res,e,next); }
};
export const transferUpload   = async (req, res, next) => { try { if (!req.file) return res.status(400).json({success:false,message:"No file"}); ok(res, await svc.bulkTransferStudents(req.file.buffer, req.user)); } catch(e) { fail(res,e,next); } };

// Section template
export const sectionTemplate  = async (req, res, next) => {
  try {
    const buf = await svc.getSectionTemplate();
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",'attachment; filename="section-template.xlsx"');
    res.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
  } catch(e) { fail(res,e,next); }
};
export const sectionBulkUpload = async (req, res, next) => { try { if (!req.file) return res.status(400).json({success:false,message:"No file"}); ok(res, await svc.bulkCreateSections(req.file.buffer, req.user)); } catch(e) { fail(res,e,next); } };

export const getStats = async (req, res, next) => { try { ok(res, await svc.getSectionStats?.()); } catch(e) { fail(res,e,next); } };

export const autoAssignSubjects = async (req, res, next) => {
  try { ok(res, await svc.autoAssignSubjectsToSection(req.params.id, req.user), "Subjects auto-assigned"); }
  catch(e) { fail(res,e,next); }
};

export const getSectionAssignmentTemplate = async (req, res, next) => {
  try {
    ok(res, { message: "Use /template endpoint" });
  } catch(e) { fail(res,e,next); }
};

export const processSectionAssignment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:"No file" });
    ok(res, await svc.bulkCreateSections(req.file.buffer, req.user));
  } catch(e) { fail(res,e,next); }
};

export const getFacultyAssignmentTemplate = async (req, res, next) => {
  try { ok(res, {}); } catch(e) { fail(res,e,next); }
};

export const processFacultyAssignment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:"No file" });
    ok(res, await svc.bulkAssignFaculty?.(req.params.id, req.file.buffer, req.user));
  } catch(e) { fail(res,e,next); }
};

export const assignStudents = async (req, res, next) => {
  try { ok(res, await svc.addStudentsToSection(req.params.id, req.body.student_ids || [], req.user)); }
  catch(e) { fail(res,e,next); }
};

export const deactivate = async (req, res, next) => {
  try {
    ok(res, await svc.updateSection(req.params.id, { status: "INACTIVE" }, req.user), "Section deactivated");
  } catch(e) { fail(res,e,next); }
};