import * as svc from "./audit.service.js";

const ok   = (res, data, msg = "OK") => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => { if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); };

export const getLogs    = async (req, res, next) => { try { ok(res, await svc.getAuditLogs(req.query)); } catch (e) { fail(res, e, next); } };
export const getLog     = async (req, res, next) => { try { ok(res, await svc.getAuditLog(req.params.id)); } catch (e) { fail(res, e, next); } };
export const getStats   = async (req, res, next) => { try { ok(res, await svc.getAuditStats(req.query)); } catch (e) { fail(res, e, next); } };
export const restore    = async (req, res, next) => {
  try { ok(res, await svc.restoreRecord(req.params.id, req.user.id), "Record restored"); }
  catch (e) { fail(res, e, next); }
};
export const exportCsv  = async (req, res, next) => {
  try {
    const { csv, filename } = await svc.exportAuditLogs(req.query);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e) { fail(res, e, next); }
};
