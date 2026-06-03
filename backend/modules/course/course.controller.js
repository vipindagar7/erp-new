import * as svc from "./course.service.js";

export const getAll = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllCourses(req.validatedData) }); }
  catch (e) { next(e); }
};
export const getById = async (req, res, next) => {
  try {
    const c = await svc.getCourseById(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: c });
  } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: "Course created", data: await svc.createCourse(req.validatedData) }); }
  catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { return res.json({ success: true, message: "Updated", data: await svc.updateCourse(req.params.id, req.validatedData) }); }
  catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await svc.deleteCourse(req.params.id); return res.json({ success: true, message: "Deleted" }); }
  catch (e) { next(e); }
};
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const r = await svc.bulkCreateCourses(req.file.buffer);
    return res.json({ success: true, message: `${r.created.length} created, ${r.failed.length} failed`, data: r });
  } catch (e) { next(e); }
};
export const downloadTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getCourseTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=course_template.xlsx");
    return res.send(buf);
  } catch (e) { next(e); }
};
