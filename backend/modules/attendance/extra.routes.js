// backend/modules/attendance/extra.routes.js
import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./extra.service.js";

const router = Router();
const ok   = (res, data, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);

router.use(authenticate);
router.post("/grant",                      requirePerm("attendance.manage"), async (req,res,next)=>{ try{ ok(res,await svc.grantExtra(req.body.student_ids,req.body,req.user.id),"Granted",201); }catch(e){fail(res,e,next);} });
router.get("/",                            requirePerm("attendance.view"),   async (req,res,next)=>{ try{ ok(res,await svc.listExtra(req.query)); }catch(e){fail(res,e,next);} });
router.get("/needed/:sid/:subject_id",     requirePerm("attendance.view"),   async (req,res,next)=>{ try{ ok(res,await svc.calcClassesNeeded(req.params.sid,req.params.subject_id,req.query.target)); }catch(e){fail(res,e,next);} });

export default router;