import * as svc from "./department.service.js";

export const getAll = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllDepartments(req.validatedData) }); }
  catch (e) { next(e); }
};
export const getById = async (req, res, next) => {
  try {
    const d = await svc.getDepartmentById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: d });
  } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: "Department created", data: await svc.createDepartment(req.validatedData) }); }
  catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { return res.json({ success: true, message: "Updated", data: await svc.updateDepartment(req.params.id, req.validatedData) }); }
  catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { await svc.deleteDepartment(req.params.id); return res.json({ success: true, message: "Deleted" }); }
  catch (e) { next(e); }
};
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const result = await svc.bulkCreateDepartments(req.file.buffer);
    return res.json({ success: true, message: `${result.created.length} created, ${result.failed.length} failed`, data: result });
  } catch (e) { next(e); }
};
export const downloadTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getDepartmentTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=department_template.xlsx");
    return res.send(buf);
  } catch (e) { next(e); }
};
