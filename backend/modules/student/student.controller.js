import * as svc from "./student.service.js";

// ── Standard CRUD ─────────────────────────────────────────────────────────────

export const getAll = async (req, res, next) => {
  try {
    const result = await svc.getAllStudents(req.validatedData);
    return res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
  try {
    const student = await svc.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    return res.json({ success: true, data: student });
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const student = await svc.createStudent(req.validatedData);
    return res.status(201).json({ success: true, message: "Student created successfully", data: student });
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const student = await svc.updateStudent(req.params.id, req.validatedData);
    return res.json({ success: true, message: "Student updated", data: student });
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.deleteStudent(req.params.id);
    return res.json({ success: true, message: "Student deleted" });
  } catch (e) { next(e); }
};

export const toggleBlock = async (req, res, next) => {
  try {
    const { isBlocked } = req.body;
    const result = await svc.toggleStudentBlock(req.params.id, isBlocked);
    return res.json({
      success: true,
      message: isBlocked ? "Student blocked" : "Student unblocked",
      data: result,
    });
  } catch (e) { next(e); }
};

// ── Promote — single student ──────────────────────────────────────────────────

export const promote = async (req, res, next) => {
  try {
    const student = await svc.promoteStudent(req.params.id);
    return res.json({
      success: true,
      message: "Student promoted to next semester",
      data: student,
    });
  } catch (e) { next(e); }
};

// ── Bulk promote — single section ─────────────────────────────────────────────

/**
 * POST /students/bulk-promote/section
 * Body: { ids: string[] }          ← array of student IDs (from frontend PromoteBySectionModal)
 *    OR { section_id, parity? }    ← single section (legacy)
 */
export const bulkPromoteSection = async (req, res, next) => {
  try {
    const { ids, section_id, parity, remarks } = req.body;

    // Frontend sends { ids: [...studentIds] } — promote each student individually
    if (Array.isArray(ids) && ids.length > 0) {
      const results = { promoted: [], skipped: [], failed: [], total: ids.length };
      for (const id of ids) {
        try {
          const student = await svc.promoteStudent(id);
          results.promoted.push({ id, name: student?.name });
        } catch (err) {
          // Check if it's a "already at max" or "no enrollment" — skipped vs failed
          if (err.message?.includes("max") || err.message?.includes("No active")) {
            results.skipped.push({ id, reason: err.message });
          } else {
            results.failed.push({ id, reason: err.message });
          }
        }
      }
      return res.json({
        success: true,
        message: `${results.promoted.length} promoted, ${results.skipped.length} skipped, ${results.failed.length} failed`,
        data: results,
      });
    }

    // Legacy: single section_id
    if (!section_id) return res.status(400).json({ success: false, message: "ids or section_id required" });
    const results = await svc.bulkPromoteSection(section_id, parity);
    return res.json({
      success: true,
      message: `${results.promoted.length} promoted, ${results.skipped.length} skipped, ${results.failed.length} failed`,
      data: results,
    });
  } catch (e) { next(e); }
};

// ── Bulk promote — institution-wide ──────────────────────────────────────────

/**
 * POST /students/bulk-promote/institution
 * Body: { fromParity: "ODD"|"EVEN", section_ids?: string[] }
 */
export const bulkPromoteInstitution = async (req, res, next) => {
  try {
    const { fromParity, section_ids = [] } = req.body;
    if (!fromParity || !["ODD", "EVEN"].includes(fromParity)) {
      return res.status(400).json({ success: false, message: "fromParity must be 'ODD' or 'EVEN'" });
    }

    const results = await svc.bulkPromoteInstitution(fromParity, section_ids);
    return res.json({
      success: true,
      message: `Institution promote: ${results.promoted.length} promoted, ${results.skipped.length} skipped, ${results.failed.length} failed`,
      data: results,
    });
  } catch (e) { next(e); }
};

// ── Change section — single student ──────────────────────────────────────────

/**
 * PATCH /students/:id/section
 * Body: { section_id }
 */
export const changeSection = async (req, res, next) => {
  try {
    const { section_id } = req.body;
    if (!section_id) return res.status(400).json({ success: false, message: "section_id is required" });

    const student = await svc.changeStudentSection(req.params.id, section_id);
    return res.json({
      success: true,
      message: "Student section updated",
      data: student,
    });
  } catch (e) { next(e); }
};

// ── Bulk change section — multiple students ───────────────────────────────────

/**
 * POST /students/bulk-change-section
 * Body: { student_ids: string[], section_id: string }
 */
export const bulkChangeSection = async (req, res, next) => {
  try {
    const { student_ids, section_id } = req.body;
    if (!student_ids?.length) return res.status(400).json({ success: false, message: "student_ids is required" });
    if (!section_id) return res.status(400).json({ success: false, message: "section_id is required" });

    const results = await svc.bulkChangeSection(student_ids, section_id);
    return res.json({
      success: true,
      message: `${results.success.length} moved, ${results.failed.length} failed`,
      data: results,
    });
  } catch (e) { next(e); }
};

// ── Template download ─────────────────────────────────────────
export const getTemplate = async (req, res, next) => {
  try {
    const buffer = await svc.generateStudentTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="student_template.xlsx"');
    res.send(buffer);
  } catch (e) { next(e); }
};

// ── Bulk upload (create) ──────────────────────────────────────
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const results = await svc.bulkCreateStudents(req.file.buffer);
    res.json({
      success: true,
      message: `${results.created.length} created, ${results.failed.length} failed`,
      data: results,
    });
  } catch (e) { next(e); }
};

// ── Bulk delete ───────────────────────────────────────────────
export const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    const results = { deleted: [], failed: [] };
    for (const id of ids) {
      try { await svc.deleteStudent(id); results.deleted.push(id); }
      catch (e) { results.failed.push({ id, reason: e.message }); }
    }
    res.json({ success: true, message: `${results.deleted.length} deleted`, data: results });
  } catch (e) { next(e); }
};

// ── Bulk block/unblock ────────────────────────────────────────
export const bulkBlock = async (req, res, next) => {
  try {
    const { ids, isBlocked } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    const results = { updated: [], failed: [] };
    for (const id of ids) {
      try { await svc.toggleStudentBlock(id, isBlocked); results.updated.push(id); }
      catch (e) { results.failed.push({ id, reason: e.message }); }
    }
    res.json({ success: true, message: `${results.updated.length} updated`, data: results });
  } catch (e) { next(e); }
};

// ── Bulk enrollment status ────────────────────────────────────
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
    res.json({ success: true, message: `${results.updated.length} updated`, data: results });
  } catch (e) { next(e); }
};

// ── Demote single student ─────────────────────────────────────
export const demote = async (req, res, next) => {
  try {
    const student = await svc.demoteStudent(req.params.id);
    res.json({ success: true, message: "Student demoted", data: student });
  } catch (e) { next(e); }
};

// ── Bulk demote ───────────────────────────────────────────────
export const bulkDemote = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: "ids required" });
    const results = await svc.bulkDemoteStudents(ids);
    res.json({ success: true, message: `${results.updated.length} demoted`, data: results });
  } catch (e) { next(e); }
};