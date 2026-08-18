// backend/modules/subject/subject.controller.js
// FIXED: restore function uses correct import
import * as svc from "./subject.service.js";

export const getAll = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllSubjects(req.validatedData ?? req.query) }); }
  catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
  try {
    const s = await svc.getSubjectById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: s });
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    return res.status(201).json({
      success: true, message: "Subject created",
      data: await svc.createSubject(req.validatedData ?? req.body),
    });
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    return res.json({
      success: true, message: "Updated",
      data: await svc.updateSubject(req.params.id, req.validatedData ?? req.body),
    });
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.deleteSubject(req.params.id);
    return res.json({ success: true, message: "Deleted" });
  } catch (e) { next(e); }
};

export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const r = await svc.bulkCreateSubjects(req.file.buffer);
    return res.json({
      success: true,
      message: `${r.created.length} created, ${r.failed.length} failed`,
      data: r,
    });
  } catch (e) { next(e); }
};

export const downloadTemplate = async (req, res, next) => {
  try {
    const raw = await Promise.resolve(svc.getSubjectTemplate());
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=subject_template.xlsx");
    res.setHeader("Content-Length", buf.length);
    return res.end(buf);
  } catch (e) { next(e); }
};

// Soft-delete restore (adds deleted_at=null back)
export const restore = async (req, res, next) => {
  try {
    const data = await svc.restoreSubject(req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};