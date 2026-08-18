import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./faculty.bulkops.service.js";

const router = Router();
const ok   = (res, d, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data:d });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);
router.use(authenticate);

router.post("/status",      requirePerm("faculty.update"), async (r,s,n)=>{ try{ok(s,await svc.bulkStatusChange(r.body.faculty_ids, r.body.status, r.user.id, r.body.reason));}catch(e){fail(s,e,n);} });
router.post("/designation",  requirePerm("faculty.update"), async (r,s,n)=>{ try{ok(s,await svc.bulkDesignationChange(r.body.faculty_ids, r.body.designation, r.user.id, r.body.reason));}catch(e){fail(s,e,n);} });
router.post("/block",        requirePerm("faculty.block"),  async (r,s,n)=>{ try{ok(s,await svc.bulkBlockUnblock(r.body.faculty_ids, true, r.user.id, r.body.reason));}catch(e){fail(s,e,n);} });
router.post("/unblock",      requirePerm("faculty.block"),  async (r,s,n)=>{ try{ok(s,await svc.bulkBlockUnblock(r.body.faculty_ids, false, r.user.id, r.body.reason));}catch(e){fail(s,e,n);} });
router.post("/export",       requirePerm("faculty.export"), async (r,s,n)=>{ try{ok(s,await svc.bulkExport(r.body.faculty_ids||[]));}catch(e){fail(s,e,n);} });
export default router;