import { Router } from "express";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as svc from "./salary.service.js";

const router = Router();
const ok   = (res, d, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data:d });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);
router.use(authenticate);

router.get(   "/components",           requirePerm("hr:view"),     async (r,s,n)=>{ try{ok(s,await svc.listComponents());}catch(e){fail(s,e,n);} });
router.post(  "/components",           requirePerm("hr:manage"),   async (r,s,n)=>{ try{ok(s,await svc.createComponent(r.body,r.user.id),"Created",201);}catch(e){fail(s,e,n);} });
router.patch( "/components/:id",       requirePerm("hr:manage"),   async (r,s,n)=>{ try{ok(s,await svc.updateComponent(r.params.id,r.body));}catch(e){fail(s,e,n);} });
router.get(   "/slips",                requirePerm("hr:view"),     async (r,s,n)=>{ try{ok(s,await svc.listSlips(r.query));}catch(e){fail(s,e,n);} });
router.get(   "/slips/my",                                         async (r,s,n)=>{ try{ok(s,await svc.listSlips({ faculty_id:r.user.faculty_id, ...r.query }));}catch(e){fail(s,e,n);} });
router.get(   "/slips/:id",            requirePerm("hr:view"),     async (r,s,n)=>{ try{ok(s,await svc.getSlip(r.params.id));}catch(e){fail(s,e,n);} });
router.post(  "/slips/generate",       requirePerm("hr:manage"),   async (r,s,n)=>{ try{ok(s,await svc.generateSlip(r.body.faculty_id,r.body.month,r.body.year,r.body,r.user.id),"Generated",201);}catch(e){fail(s,e,n);} });
router.post(  "/slips/bulk-generate",  requirePerm("hr:manage"),   async (r,s,n)=>{ try{ok(s,await svc.bulkGenerate(r.body.month,r.body.year,r.body.faculty_ids,r.body,r.user.id));}catch(e){fail(s,e,n);} });
router.post(  "/slips/:id/approve",    requirePerm("hr:approve"),  async (r,s,n)=>{ try{ok(s,await svc.approveSlip(r.params.id,r.user.id));}catch(e){fail(s,e,n);} });
router.post(  "/slips/:id/mark-paid",  requirePerm("hr:approve"),  async (r,s,n)=>{ try{ok(s,await svc.markPaid(r.params.id,r.user.id));}catch(e){fail(s,e,n);} });
router.get(   "/report",               requirePerm("hr:report"),   async (r,s,n)=>{ try{ok(s,await svc.getHRReport(r.query));}catch(e){fail(s,e,n);} });
export default router;
