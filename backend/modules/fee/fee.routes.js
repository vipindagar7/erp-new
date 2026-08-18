import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./fee.service.js";

const router = Router();
const ok   = (res, d, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data:d });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);
router.use(authenticate);

router.get(   "/structures",               requirePerm("fee:view"),        async (r,s,n)=>{ try{ok(s,await svc.listStructures(r.query));}catch(e){fail(s,e,n);} });
router.post(  "/structures",               requirePerm("fee:manage"),      async (r,s,n)=>{ try{ok(s,await svc.createStructure(r.body,r.user.id),"Created",201);}catch(e){fail(s,e,n);} });
router.patch( "/structures/:id",           requirePerm("fee:manage"),      async (r,s,n)=>{ try{ok(s,await svc.updateStructure(r.params.id,r.body));}catch(e){fail(s,e,n);} });
router.get(   "/scholarships",             requirePerm("fee:view"),        async (r,s,n)=>{ try{ok(s,await svc.listScholarships());}catch(e){fail(s,e,n);} });
router.post(  "/scholarships",             requirePerm("fee:manage"),      async (r,s,n)=>{ try{ok(s,await svc.createScholarship(r.body),"Created",201);}catch(e){fail(s,e,n);} });
router.get(   "/student/:sid",             requirePerm("fee:view"),        async (r,s,n)=>{ try{ok(s,await svc.getStudentFee(r.params.sid,r.query.session_id));}catch(e){fail(s,e,n);} });
router.post(  "/student/:sid/init",        requirePerm("fee:manage"),      async (r,s,n)=>{ try{ok(s,await svc.initStudentFee(r.params.sid,r.body.fee_structure_id,r.body.session_id,r.user.id),"Initialized",201);}catch(e){fail(s,e,n);} });
router.post(  "/payments/:pid/record",     requirePerm("fee:collect"),     async (r,s,n)=>{ try{ok(s,await svc.recordPayment(r.params.pid,r.body,r.user.id));}catch(e){fail(s,e,n);} });
router.post(  "/payments/:pid/scholarship",requirePerm("fee:manage"),      async (r,s,n)=>{ try{ok(s,await svc.applyScholarship(r.params.pid,r.body.scholarship_id,r.body.waiver_amount,r.body.waiver_reason));}catch(e){fail(s,e,n);} });
router.post(  "/payments/:pid/waive",      requirePerm("fee:manage"),      async (r,s,n)=>{ try{ok(s,await svc.waiveFee(r.params.pid,r.body.waiver_amount,r.body.waiver_reason,r.user.id));}catch(e){fail(s,e,n);} });
router.get(   "/report/defaulters",        requirePerm("fee:report"),      async (r,s,n)=>{ try{ok(s,await svc.getDefaultersList(r.query.session_id));}catch(e){fail(s,e,n);} });
router.get(   "/report/summary",           requirePerm("fee:report"),      async (r,s,n)=>{ try{ok(s,await svc.getCollectionSummary(r.query.session_id));}catch(e){fail(s,e,n);} });
export default router;
