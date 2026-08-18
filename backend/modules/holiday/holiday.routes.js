// backend/modules/holiday/holiday.routes.js
import { Router } from "express";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as svc from "./holiday.service.js";

const router = Router();
const ok   = (res, data, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);

router.use(authenticate);

// ── Holidays ─────────────────────────────────────────────────
router.get(  "/",               requirePerm("settings:view"),   async (req,res,next)=>{ try{ ok(res, await svc.getHolidays(req.query)); }catch(e){ fail(res,e,next); } });
router.post( "/",               requirePerm("settings:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.createHoliday(req.body, req.user), "Holiday created", 201); }catch(e){ fail(res,e,next); } });
router.post( "/bulk",           requirePerm("settings:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.bulkCreateHolidays(req.body.holidays||[], req.user), "Holidays created"); }catch(e){ fail(res,e,next); } });
router.patch("/:id",            requirePerm("settings:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.updateHoliday(req.params.id, req.body)); }catch(e){ fail(res,e,next); } });
router.delete("/:id",           requirePerm("settings:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.deleteHoliday(req.params.id)); }catch(e){ fail(res,e,next); } });
router.get(  "/check",         requirePerm("attendance:mark"),  async (req,res,next)=>{ try{ ok(res, await svc.isHoliday(req.query.date, req.query.session_id, req.query.dept_id, req.query.section_id)); }catch(e){ fail(res,e,next); } });

// ── Leave Rules ───────────────────────────────────────────────
router.get(  "/leave-rules",    requirePerm("leave:manage"),    async (req,res,next)=>{ try{ ok(res, await svc.getLeaveRules(req.query)); }catch(e){ fail(res,e,next); } });
router.post( "/leave-rules",    requirePerm("leave:manage"),    async (req,res,next)=>{ try{ ok(res, await svc.createLeaveRule(req.body, req.user), "Rule created", 201); }catch(e){ fail(res,e,next); } });
router.patch("/leave-rules/:id",requirePerm("leave:manage"),    async (req,res,next)=>{ try{ ok(res, await svc.updateLeaveRule(req.params.id, req.body)); }catch(e){ fail(res,e,next); } });

// ── Auto-credit engine ────────────────────────────────────────
router.post( "/leave-credit/run",          superAdminOnly, async (req,res,next)=>{ try{ ok(res, await svc.runLeaveCredit({ ...req.body, actingUser:req.user })); }catch(e){ fail(res,e,next); } });
router.post( "/leave-credit/carry-forward",superAdminOnly, async (req,res,next)=>{ try{ ok(res, await svc.runCarryForward({ ...req.body, actingUser:req.user })); }catch(e){ fail(res,e,next); } });
router.get(  "/leave-credit/log",          requirePerm("leave:view"), async (req,res,next)=>{ try{ ok(res, await svc.getCreditLog(req.query)); }catch(e){ fail(res,e,next); } });

export default router;
