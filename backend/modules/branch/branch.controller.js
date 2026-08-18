// backend/modules/branch/branch.controller.js
import * as svc from "./branch.service.js";

const ok = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success: false, message: e.message }) : next(e);

export const getAll = async (req, res, next) => { try { ok(res, await svc.getAllBranches(req.query)); } catch (e) { fail(res, e, next); } };
export const getOne = async (req, res, next) => { try { const d = await svc.getBranchById(req.params.id); if (!d) return res.status(404).json({ success: false, message: "Not found" }); ok(res, d); } catch (e) { fail(res, e, next); } };
export const getStats = async (req, res, next) => { try { ok(res, await svc.getBranchStats()); } catch (e) { fail(res, e, next); } };
export const create = async (req, res, next) => { try { ok(res, await svc.createBranch(req.body, req.user), "Branch created", 201); } catch (e) { fail(res, e, next); } };
export const update = async (req, res, next) => { try { ok(res, await svc.updateBranch(req.params.id, req.body, req.user), "Updated"); } catch (e) { fail(res, e, next); } };
export const remove = async (req, res, next) => { try { ok(res, await svc.deleteBranch(req.params.id, req.body?.reason, req.user), "Deleted"); } catch (e) { fail(res, e, next); } };
export const restore = async (req, res, next) => { try { ok(res, await svc.restoreBranch(req.params.id, req.user), "Restored"); } catch (e) { fail(res, e, next); } };
export const discontinue = async (req, res, next) => { try { ok(res, await svc.discontinueBranch(req.params.id, req.body, req.user), "Discontinued"); } catch (e) { fail(res, e, next); } };
export const reactivate = async (req, res, next) => { try { ok(res, await svc.reactivateBranch(req.params.id, req.user), "Reactivated"); } catch (e) { fail(res, e, next); } };
export const getHistory = async (req, res, next) => { try { ok(res, await svc.getBranchHistory(req.params.id, req.query)); } catch (e) { fail(res, e, next); } };
export const rollback = async (req, res, next) => { try { ok(res, await svc.rollbackBranch(req.params.id, req.params.history_id, req.body?.reason, req.user), "Rolled back"); } catch (e) { fail(res, e, next); } };

export const getTemplate = async (req, res, next) => {
  try {
    const buf = await svc.getBranchTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="branch-template.xlsx"');
    res.send(buf);
  } catch (e) { fail(res, e, next); }
};

export const bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    ok(res, await svc.bulkCreateBranches(req.file.buffer, req.user));
  } catch (e) { fail(res, e, next); }
};