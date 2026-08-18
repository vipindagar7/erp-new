import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./skillcard.service.js";

const router = Router();
const ok   = (res, d, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data:d });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);
router.use(authenticate);

router.post(  "/init/:student_id",      requirePerm("skillcard:manage"),  async (r,s,n)=>{ try{ok(s,await svc.initSkillCard(r.params.student_id,r.body,r.user.id),"Initialized",201);}catch(e){fail(s,e,n);} });
router.post(  "/bulk-init",             requirePerm("skillcard:manage"),  async (r,s,n)=>{ try{ok(s,await svc.bulkInitForSection(r.body.section_id,r.body,r.user.id));}catch(e){fail(s,e,n);} });
router.get(   "/student/:student_id",                                     async (r,s,n)=>{ try{ok(s,await svc.getSkillCard(r.params.student_id));}catch(e){fail(s,e,n);} });
router.patch( "/entry/:entry_id",                                         async (r,s,n)=>{ try{ok(s,await svc.updateEntry(r.params.entry_id,{ ...r.body, verified_by:r.user.id }));}catch(e){fail(s,e,n);} });
router.post(  "/bulk-update",           requirePerm("skillcard:manage"),  async (r,s,n)=>{ try{ok(s,await svc.bulkUpdateByTemplate(r.body.records));}catch(e){fail(s,e,n);} });
router.get(   "/readiness/:student_id",                                   async (r,s,n)=>{ try{ok(s,await svc.getReadinessLevel(r.params.student_id));}catch(e){fail(s,e,n);} });
router.get(   "/mentor-view/:section_id",requirePerm("skillcard:view"),   async (r,s,n)=>{ try{ok(s,await svc.getMentorView(r.user.faculty_id||r.query.faculty_id, r.params.section_id));}catch(e){fail(s,e,n);} });
export default router;
