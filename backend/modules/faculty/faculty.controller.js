import * as svc from "./faculty.service.js";

export const getAll = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllFaculty(req.validatedData) }); }
  catch (e) { next(e); }
};
export const getById = async (req, res, next) => {
  try {
    const f = await svc.getFacultyById(req.params.id);
    if (!f) return res.status(404).json({ success: false, message: "Faculty not found" });
    return res.json({ success: true, data: f });
  } catch (e) { next(e); }
};
export const getMe = async (req, res, next) => {
  try {
    const f = await svc.getFacultyByUserId(req.user.id);
    if (!f) return res.status(404).json({ success: false, message: "Faculty profile not found" });
    return res.json({ success: true, data: f });
  } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: "Faculty created", data: await svc.createFaculty(req.validatedData) }); }
  catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { return res.json({ success: true, message: "Updated", data: await svc.updateFaculty(req.params.id, req.validatedData) }); }
  catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await svc.deleteFaculty(req.params.id); return res.json({ success: true, message: "Deleted" }); }
  catch (e) { next(e); }
};
export const toggleBlock = async (req, res, next) => {
  try {
    const { isBlocked } = req.validatedData;
    return res.json({ success: true, message: isBlocked ? "Blocked" : "Unblocked", data: await svc.toggleBlock(req.params.id, isBlocked) });
  } catch (e) { next(e); }
};
export const assignSubjects = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.assignSubjects(req.params.id, req.validatedData.subject_ids) }); }
  catch (e) { next(e); }
};
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const r = await svc.bulkCreateFaculty(req.file.buffer);
    return res.json({ success: true, message: `${r.created.length} created, ${r.failed.length} failed`, data: r });
  } catch (e) { next(e); }
};
export const downloadTemplate = async (req, res, next) => {
  try {
    const buf = svc.generateTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=faculty_template.xlsx");
    return res.send(buf);
  } catch (e) { next(e); }
};
