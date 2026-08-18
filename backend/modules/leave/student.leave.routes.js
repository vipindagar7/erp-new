import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./student.leave.service.js";

const router = Router();
const ok   = (res, d, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data:d });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);

router.use(authenticate);
router.post("/",                         async (req,res,next)=>{ try{ ok(res, await svc.applyLeave(req.body.student_id || req.user.student_id, req.body),"Applied",201); }catch(e){ fail(res,e,next); } });
router.get("/",                          async (req,res,next)=>{ try{ ok(res, await svc.listLeaves(req.query)); }catch(e){ fail(res,e,next); } });
router.get("/pending/:role",             async (req,res,next)=>{ try{ ok(res, await svc.getPendingApprovals(req.params.role, req.user.id)); }catch(e){ fail(res,e,next); } });
router.get("/:id",                       async (req,res,next)=>{ try{ ok(res, await svc.getLeave(req.params.id)); }catch(e){ fail(res,e,next); } });
router.post("/:id/approve",              requirePerm("leave:approve"), async (req,res,next)=>{ try{ ok(res, await svc.processApproval(req.params.id, req.body.step, "APPROVE", req.user.id, req.body.remarks)); }catch(e){ fail(res,e,next); } });
router.post("/:id/reject",               requirePerm("leave:approve"), async (req,res,next)=>{ try{ ok(res, await svc.processApproval(req.params.id, req.body.step, "REJECT",  req.user.id, req.body.remarks)); }catch(e){ fail(res,e,next); } });
router.delete("/:id",                    async (req,res,next)=>{ try{ ok(res, await svc.cancelLeave(req.params.id, req.body.student_id)); }catch(e){ fail(res,e,next); } });
export default router;
