import * as svc from "./program.service.js";

export const getAll = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllPrograms(req.validatedData) }); }
  catch (e) { next(e); }
};
export const getById = async (req, res, next) => {
  try {
    const p = await svc.getProgramById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: p });
  } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: "Program created", data: await svc.createProgram(req.validatedData) }); }
  catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { return res.json({ success: true, message: "Updated", data: await svc.updateProgram(req.params.id, req.validatedData) }); }
  catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await svc.deleteProgram(req.params.id); return res.json({ success: true, message: "Deleted" }); }
  catch (e) { next(e); }
};
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const r = await svc.bulkCreatePrograms(req.file.buffer);
    return res.json({ success: true, message: `${r.created.length} created, ${r.failed.length} failed`, data: r });
  } catch (e) { next(e); }
};
export const downloadTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getProgramTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=program_template.xlsx");
    return res.send(buf);
  } catch (e) { next(e); }
};
