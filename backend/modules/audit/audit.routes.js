// backend/modules/audit/audit.routes.js
import { Router } from "express";
import { authenticate, requirePerm, rootOnly } from "../../middlewares/auth.middleware.js";
import * as svc from "./audit.service.js";

const router = Router();
const ok = (res, data, msg = "OK") => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
    ? res.status(e.status).json({ success: false, message: e.message })
    : next(e);

// Static before /:id
router.get("/stats", authenticate, requirePerm("audit.view"), async (req, res, next) => { try { ok(res, await svc.getAuditStats()); } catch (e) { fail(res, e, next); } });
router.get("/export", authenticate, requirePerm("audit.export"), async (req, res, next) => {
    try {
        const buf = await svc.exportAuditLogs(req.query);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.xlsx"`);
        res.end(buf);
    } catch (e) { fail(res, e, next); }
});

router.get("/", authenticate, requirePerm("audit.view"), async (req, res, next) => {
    try {
        const { page = 1, limit = 30, module, action, user_id, search, date_from, date_to, ip, record_id, section_id } = req.query;
        ok(res, await svc.getAuditLogs({ page: +page, limit: +limit, module, action, user_id, search, date_from, date_to, ip, record_id, section_id }));
    } catch (e) { fail(res, e, next); }
});

router.get("/:id", authenticate, requirePerm("audit.view"), async (req, res, next) => {
    try {
        const log = await svc.getAuditLog(req.params.id);
        if (!log) return res.status(404).json({ success: false, message: "Not found" });
        ok(res, log);
    } catch (e) { fail(res, e, next); }
});

router.post("/:id/restore", authenticate, rootOnly, async (req, res, next) => {
    try { ok(res, await svc.restoreAuditLog(req.params.id), "Restored"); } catch (e) { fail(res, e, next); }
});

export default router;