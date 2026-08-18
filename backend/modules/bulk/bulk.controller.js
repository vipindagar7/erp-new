// backend/modules/bulk/bulk.controller.js
import * as svc from "./bulk.service.js";
import multer   from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const ok   = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => { if (e.status || e.statusCode) return res.status(e.status || e.statusCode).json({ success: false, message: e.message }); next(e); };

const sendXlsx = (res, buf, filename) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buf);
};

export const getStatusTemplate   = async (req, res, next) => { try { sendXlsx(res, await svc.getStatusChangeTemplate(), "status-change-template.xlsx"); } catch (e) { fail(res, e, next); } };
export const bulkStatus          = async (req, res, next) => { try { if (!req.file) return res.status(400).json({ success: false, message: "No file" }); ok(res, await svc.bulkStatusViaTemplate(req.file.buffer, req.user)); } catch (e) { fail(res, e, next); } };
export const getPromoteTemplate  = async (req, res, next) => { try { sendXlsx(res, await svc.getPromotionTemplate(), "promotion-template.xlsx"); } catch (e) { fail(res, e, next); } };
export const bulkPromote         = async (req, res, next) => { try { if (!req.file) return res.status(400).json({ success: false, message: "No file" }); ok(res, await svc.bulkPromoteViaTemplate(req.file.buffer, req.user)); } catch (e) { fail(res, e, next); } };
export const getDemoteTemplate   = async (req, res, next) => { try { sendXlsx(res, await svc.getDemotionTemplate(), "demotion-template.xlsx"); } catch (e) { fail(res, e, next); } };
export const bulkDemote          = async (req, res, next) => { try { if (!req.file) return res.status(400).json({ success: false, message: "No file" }); ok(res, await svc.bulkDemoteViaTemplate(req.file.buffer, req.user)); } catch (e) { fail(res, e, next); } };
export const sectionPromote      = async (req, res, next) => { try { ok(res, await svc.promoteSectionBulk(req.body.from_section_id, req.body.to_section_id, req.body.reason, req.user)); } catch (e) { fail(res, e, next); } };
export const sectionBulkStatus   = async (req, res, next) => { try { ok(res, await svc.sectionBulkStatus(req.body.section_id, req.body.status, req.body.reason, req.user)); } catch (e) { fail(res, e, next); } };
export const exportResults       = async (req, res, next) => { try { sendXlsx(res, svc.exportBulkResults(req.body, req.query.sheet || "Results"), "bulk-results.xlsx"); } catch (e) { fail(res, e, next); } };
