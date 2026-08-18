// backend/modules/notification/notification.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as svc from "./notification.service.js";

const router = Router();
router.use(authenticate);

const ok   = (res, data, msg="OK") => res.json({ success:true, message:msg, data });
const fail = (res, e, next) => next(e);

// Root only guard
const rootOnly = (req, res, next) => {
  if (req.user?.is_root || req.user?.role === "SUPER_ADMIN") return next();
  return res.status(403).json({ success:false, message:"Root access only" });
};

// ── Email/WhatsApp config (root only) ─────────────────────────
router.get("/config/:type",    rootOnly, async (req,res,next) => { try { ok(res, await svc.getNotifConfig(req.params.type)); } catch(e){fail(res,e,next);} });
router.post("/config/:type",   rootOnly, async (req,res,next) => { try { ok(res, await svc.saveNotifConfig(req.params.type, req.body), "Config saved"); } catch(e){fail(res,e,next);} });

// ── Templates ──────────────────────────────────────────────────
router.get("/templates",       rootOnly, async (req,res,next) => { try { ok(res, await svc.getTemplates()); } catch(e){fail(res,e,next);} });
router.post("/templates",      rootOnly, async (req,res,next) => { try { ok(res, await svc.upsertTemplate(req.body), "Template saved"); } catch(e){fail(res,e,next);} });
router.delete("/templates/:id",rootOnly, async (req,res,next) => { try { ok(res, await svc.deleteTemplate(req.params.id), "Deleted"); } catch(e){fail(res,e,next);} });

// ── Cron schedules ─────────────────────────────────────────────
router.get("/schedules",       rootOnly, async (req,res,next) => { try { ok(res, await svc.getCronSchedules()); } catch(e){fail(res,e,next);} });
router.post("/schedules",      rootOnly, async (req,res,next) => { try { ok(res, await svc.upsertCronSchedule({ ...req.body, created_by:req.user.id }), "Saved"); } catch(e){fail(res,e,next);} });
router.delete("/schedules/:id",rootOnly, async (req,res,next) => { try { ok(res, await svc.deleteCronSchedule(req.params.id), "Deleted"); } catch(e){fail(res,e,next);} });

// ── Send test notification ─────────────────────────────────────
router.post("/test",           rootOnly, async (req,res,next) => {
  try {
    const result = await svc.sendNotification({
      to_email:     req.body.email,
      to_phone:     req.body.phone,
      subject:      req.body.subject || "Test Notification",
      email_body:   req.body.body    || "<p>This is a test email from EIT ERP</p>",
      whatsapp_body:req.body.body    || "This is a test message from EIT ERP",
    });
    ok(res, result, "Test sent");
  } catch(e){fail(res,e,next);}
});

// ── Backdate attendance (root only) ───────────────────────────
router.post("/attendance/backdate", rootOnly, async (req,res,next) => {
  try {
    ok(res, await svc.backdateAttendance(req.body.records, req.user.id), "Backdate applied");
  } catch(e){fail(res,e,next);}
});

export default router;