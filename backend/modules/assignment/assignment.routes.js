import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./assignment.service.js";

const router = Router();
const ok   = (res, d, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data:d });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);
router.use(authenticate);

router.get(   "/",                          requirePerm("assignment:view"),   async (req,res,next)=>{ try{ ok(res, await svc.listAssignments(req.query)); }catch(e){ fail(res,e,next); } });
router.post(  "/",                          requirePerm("assignment:create"), async (req,res,next)=>{ try{ ok(res, await svc.createAssignment(req.body, req.user.id),"Created",201); }catch(e){ fail(res,e,next); } });
router.get(   "/:id",                       requirePerm("assignment:view"),   async (req,res,next)=>{ try{ ok(res, await svc.getAssignment(req.params.id)); }catch(e){ fail(res,e,next); } });
router.patch( "/:id",                       requirePerm("assignment:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.updateAssignment(req.params.id, req.body)); }catch(e){ fail(res,e,next); } });
router.post(  "/:id/publish",               requirePerm("assignment:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.publishAssignment(req.params.id)); }catch(e){ fail(res,e,next); } });
router.post(  "/:id/close",                 requirePerm("assignment:edit"),   async (req,res,next)=>{ try{ ok(res, await svc.closeAssignment(req.params.id)); }catch(e){ fail(res,e,next); } });
router.post(  "/:id/submit",                                                  async (req,res,next)=>{ try{ ok(res, await svc.submitAssignment(req.params.id, req.body.student_id||req.user.student_id, req.body),"Submitted",201); }catch(e){ fail(res,e,next); } });
router.post(  "/submissions/:sid/grade",    requirePerm("assignment:grade"),  async (req,res,next)=>{ try{ ok(res, await svc.gradeSubmission(req.params.sid, req.body, req.user.id)); }catch(e){ fail(res,e,next); } });
router.post(  "/:id/plagiarism-check",      requirePerm("assignment:grade"),  async (req,res,next)=>{ try{ ok(res, await svc.checkPlagiarism(req.params.id)); }catch(e){ fail(res,e,next); } });
router.get(   "/:id/report",                requirePerm("assignment:view"),   async (req,res,next)=>{ try{ ok(res, await svc.getReport(req.params.id)); }catch(e){ fail(res,e,next); } });
export default router;
