// backend/modules/academic/calendar.routes.js
import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./calendar.service.js";
import prisma from "../../utils/prisma.js";

const router = Router();
const ok   = (res, data, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);

router.use(authenticate);
router.get(   "/",        requirePerm("academic:view"),   async (req,res,next)=>{ try{ ok(res, await svc.listEvents(req.query)); }catch(e){ fail(res,e,next); } });
router.post(  "/",        requirePerm("academic:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.createEvent(req.body, req.user.id),"Created",201); }catch(e){ fail(res,e,next); } });
router.patch( "/:id",     requirePerm("academic:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.updateEvent(req.params.id, req.body)); }catch(e){ fail(res,e,next); } });
router.delete("/:id",     requirePerm("academic:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.deleteEvent(req.params.id)); }catch(e){ fail(res,e,next); } });
router.post(  "/bulk",    requirePerm("academic:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.bulkCreate(req.body.events, req.body.session_id, req.user.id),"Bulk created"); }catch(e){ fail(res,e,next); } });
router.get(   "/summary/:session_id", requirePerm("academic:view"), async (req,res,next)=>{ try{ ok(res, await svc.getWorkingDaySummary(req.params.session_id)); }catch(e){ fail(res,e,next); } });

// ── Holiday check routes (used by AttendancePage) ────────────
router.get("/holidays", requirePerm("academic:view"), async (req, res, next) => {
  try {
    const { year, session_id } = req.query;
    const where = { is_holiday: true, deleted_at: null };
    if (session_id) where.session_id = session_id;
    if (year) {
      where.start_date = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }
    const holidays = await prisma.academicCalendarEvent.findMany({ where, orderBy: { start_date: "asc" } });
    ok(res, holidays);
  } catch(e) { fail(res, e, next); }
});

router.get("/holidays/check", requirePerm("academic:view"), async (req, res, next) => {
  try {
    const { date, session_id, section_id } = req.query;
    if (!date) return ok(res, { is_holiday: false });
    const d = new Date(date);
    const holiday = await prisma.academicCalendarEvent.findFirst({
      where: {
        is_holiday: true,
        start_date: { lte: d },
        end_date:   { gte: d },
        deleted_at: null,
        ...(session_id ? { session_id } : {}),
      },
    });
    ok(res, { is_holiday: !!holiday, event: holiday || null });
  } catch(e) { fail(res, e, next); }
});

export default router;