// backend/modules/programs/program.controller.js
import * as svc from "./program.service.js";

const ok   = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => {
  if (e.status || e.statusCode) return res.status(e.status || e.statusCode).json({ success: false, message: e.message });
  next(e);
};

export const getAll          = async (req, res, next) => { try { ok(res, await svc.getAllPrograms(req.validatedData ?? req.query)); } catch (e) { fail(res, e, next); } };
export const getById         = async (req, res, next) => { try { const p = await svc.getProgramById(req.params.id); if (!p) return res.status(404).json({ success: false, message: "Not found" }); ok(res, p); } catch (e) { fail(res, e, next); } };
export const getStats        = async (req, res, next) => { try { ok(res, await svc.getProgramStats()); } catch (e) { fail(res, e, next); } };
export const create          = async (req, res, next) => { try { ok(res, await svc.createProgram(req.validatedData ?? req.body), "Program created", 201); } catch (e) { fail(res, e, next); } };
export const update          = async (req, res, next) => { try { ok(res, await svc.updateProgram(req.params.id, req.validatedData ?? req.body), "Program updated"); } catch (e) { fail(res, e, next); } };
export const deactivate      = async (req, res, next) => { try { ok(res, await svc.deactivateProgram(req.params.id), "Program deactivated"); } catch (e) { fail(res, e, next); } };
export const restore         = async (req, res, next) => { try { ok(res, await svc.restoreProgram(req.params.id), "Program restored"); } catch (e) { fail(res, e, next); } };
export const remove          = async (req, res, next) => { try { await svc.deleteProgram(req.params.id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };
export const downloadTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getProgramTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="program-template.xlsx"');
    res.send(buf);
  } catch (e) { fail(res, e, next); }
};
export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const r = await svc.bulkCreatePrograms(req.file.buffer);
    ok(res, r, `${r.created.length} created, ${r.failed.length} failed`);
  } catch (e) { fail(res, e, next); }
};