// backend/modules/audit/audit.controller.js
import * as auditService from "./audit.service.js";

export async function getLogs(req, res) {
  try {
    const { page = 1, limit = 20, module, action, user_id, search, date_from, date_to } = req.query;
    const result = await auditService.getAuditLogs({
      page: Number(page), limit: Number(limit),
      module, action, user_id, search, date_from, date_to,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getLog(req, res) {
  try {
    const log = await auditService.getAuditLog(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getStats(req, res) {
  try {
    const data = await auditService.getAuditStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function restore(req, res) {
  try {
    const result = await auditService.restoreRecord(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function exportCsv(req, res) {
  try {
    const { module, action, date_from, date_to } = req.query;
    const buffer = await auditService.exportAuditLogs({ module, action, date_from, date_to });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="audit-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}