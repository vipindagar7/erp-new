import * as svc from "./subject.service.js";

export const getAll = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllSubjects(req.validatedData) }); }
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
  try { return res.status(201).json({ success: true, message: "Subject created", data: await svc.createSubject(req.validatedData) }); }
  catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { return res.json({ success: true, message: "Updated", data: await svc.updateSubject(req.params.id, req.validatedData) }); }
  catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await svc.deleteSubject(req.params.id); return res.json({ success: true, message: "Deleted" }); }
  catch (e) { next(e); }
};
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const r = await svc.bulkCreateSubjects(req.file.buffer);
    return res.json({ success: true, message: `${r.created.length} created, ${r.failed.length} failed`, data: r });
  } catch (e) { next(e); }
};
export const downloadTemplate = async (req, res, next) => {
  try {
    const buf = svc.getSubjectTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=subject_template.xlsx");
    return res.send(buf);
  } catch (e) { next(e); }
};
