// backend/modules/superadmin/superadmin.controller.js
import * as svc from "./superadmin.service.js";

const ok   = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => {
  if (e.status || e.statusCode) return res.status(e.status || e.statusCode).json({ success: false, message: e.message });
  next(e);
};

export const getAll       = async (req, res, next) => { try { ok(res, await svc.getAllSuperAdmins(req.query)); } catch (e) { fail(res, e, next); } };
export const getOne       = async (req, res, next) => { try { const d = await svc.getSuperAdminById(req.params.id); if (!d) return res.status(404).json({ success: false, message: "Not found" }); ok(res, d); } catch (e) { fail(res, e, next); } };
export const getStats     = async (req, res, next) => { try { ok(res, await svc.getSuperAdminStats()); } catch (e) { fail(res, e, next); } };
export const create       = async (req, res, next) => { try { ok(res, await svc.createSuperAdmin(req.body, req.user.id), "Super Admin created", 201); } catch (e) { fail(res, e, next); } };
export const update       = async (req, res, next) => { try { ok(res, await svc.updateSuperAdmin(req.params.id, req.body, req.user.id), "Updated"); } catch (e) { fail(res, e, next); } };
export const block        = async (req, res, next) => { try { ok(res, await svc.blockSuperAdmin(req.params.id, req.body.reason, req.user.id), "Blocked"); } catch (e) { fail(res, e, next); } };
export const unblock      = async (req, res, next) => { try { ok(res, await svc.unblockSuperAdmin(req.params.id, req.user.id), "Unblocked"); } catch (e) { fail(res, e, next); } };
export const demote       = async (req, res, next) => { try { ok(res, await svc.demoteSuperAdmin(req.params.id, req.user.id), "Demoted to Admin"); } catch (e) { fail(res, e, next); } };
export const resetPwd     = async (req, res, next) => { try { ok(res, await svc.resetSuperAdminPassword(req.params.id, req.user.id), "Password reset"); } catch (e) { fail(res, e, next); } };
export const remove       = async (req, res, next) => { try { await svc.deleteSuperAdmin(req.params.id, req.user.id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };
export const getActivity  = async (req, res, next) => { try { ok(res, await svc.getSuperAdminActivity(req.params.id, req.query)); } catch (e) { fail(res, e, next); } };