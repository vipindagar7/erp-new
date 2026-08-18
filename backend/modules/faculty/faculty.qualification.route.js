// backend/modules/faculty/faculty.routes.new.js
// ADD these routes to existing faculty.routes.js
// These handle: qualifications, primary/secondary roles, bulk create

import { Router } from "express";
import multer     from "multer";
import { authenticate, requirePerm, superAdminOnly, rootOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import * as qualSvc from "./faculty.service.new.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(authenticate);

// ── Qualifications ─────────────────────────────────────────────
router.get( "/:id/qualifications",           requirePerm("faculty.view"),   async (req,res,next) => {
  try { res.json({ success:true, data: await qualSvc.getQualifications(req.params.id) }); } catch(e){next(e);}
});

router.post("/:id/qualifications",           requirePerm("faculty.update"), auditLog("faculty","QUAL_ADD"), async (req,res,next) => {
  try { res.json({ success:true, data: await qualSvc.upsertQualification(req.params.id, req.body) }); } catch(e){
    if (e.status) return res.status(e.status).json({ success:false, message:e.message });
    next(e);
  }
});

router.delete("/:id/qualifications/:level",  requirePerm("faculty.update"), async (req,res,next) => {
  try { res.json({ success:true, data: await qualSvc.deleteQualification(req.params.id, req.params.level) }); } catch(e){
    if (e.status) return res.status(e.status).json({ success:false, message:e.message });
    next(e);
  }
});

router.get("/:id/qualifications/validate",   requirePerm("faculty.view"),   async (req,res,next) => {
  try { res.json({ success:true, data: await qualSvc.validateTeachingQualifications(req.params.id) }); } catch(e){
    if (e.status) return res.status(e.status).json({ success:false, message:e.message });
    next(e);
  }
});

// ── Primary / Secondary Role assignment ───────────────────────
router.patch("/:id/roles", requirePerm("faculty.manage"), auditLog("faculty","ROLE_ASSIGN"), async (req,res,next) => {
  try {
    res.json({ success:true, data: await qualSvc.setFacultyRoles(req.params.id, req.body) });
  } catch(e){next(e);}
});

// ── Bulk create with qualifications (JSON body) ────────────────
router.post("/bulk-create", superAdminOnly, auditLog("faculty","BULK_CREATE"), async (req,res,next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || !records.length)
      return res.status(400).json({ success:false, message:"records[] required" });
    res.json({ success:true, data: await qualSvc.bulkCreateFaculty(records, req.user.id) });
  } catch(e){next(e);}
});

export default router;
