// backend/modules/faculty/faculty.routes.js
// MERGED: original routes + new qualification + roles endpoints
import { Router } from "express";
import multer     from "multer";
import {
  authenticate, authorize, requirePerm,
  superAdminOnly, rootOnly,
} from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import * as c    from "./faculty.controller.js";
import * as qual from "./faculty.qualification.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN  = ["ADMIN","SUPER_ADMIN","ROOT"];
const ok   = (res, data, msg="OK") => res.json({ success:true, message:msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success:false, message:e.message })
  : next(e);

// ── Static — BEFORE /:id ──────────────────────────────────────
router.get("/me",               authenticate,                                c.getMe);
router.get("/template",         authenticate, requirePerm("faculty.export"),  c.getTemplate);
router.post("/bulk-upload",     authenticate, superAdminOnly, upload.single("file"), auditLog("faculty","BULK_UPLOAD"), c.bulkUpload);
router.post("/bulk-create",     authenticate, superAdminOnly, auditLog("faculty","BULK_CREATE"), async (req,res,next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)||!records.length)
      return res.status(400).json({ success:false, message:"records[] required" });
    ok(res, await qual.bulkCreateFaculty(records, req.user.id), "Bulk create done");
  } catch(e){fail(res,e,next);}
});
router.get("/export/basic",     authenticate, requirePerm("faculty.export"),  c.exportBasic);
router.get("/export/advanced",  authenticate, requirePerm("faculty.export"),  c.exportAdvanced);
router.get("/analytics",        authenticate, requirePerm("faculty.view"),    c.getAnalytics);

// ── CRUD ───────────────────────────────────────────────────────
router.get("/",   authenticate, requirePerm("faculty.view"),   c.getAll);
router.post("/",  authenticate, superAdminOnly, auditLog("faculty","CREATE"), c.create);

// ── /:id — all after statics ───────────────────────────────────
router.get("/:id",           authenticate, requirePerm("faculty.view"),   c.getOne);
router.patch("/:id",         authenticate, requirePerm("faculty.update"), auditLog("faculty","UPDATE"), c.update);
router.delete("/:id",        authenticate, superAdminOnly,                auditLog("faculty","DELETE"), c.remove);
router.post("/:id/restore",  authenticate, superAdminOnly,                c.restore);

// ── Block / Unblock ───────────────────────────────────────────
router.post("/:id/block",    authenticate, requirePerm("faculty.block"),  auditLog("faculty","BLOCK"),   c.block);
router.post("/:id/unblock",  authenticate, requirePerm("faculty.block"),  auditLog("faculty","UNBLOCK"), c.block);

// ── Email + Password ──────────────────────────────────────────
router.patch("/:id/email",         authenticate, superAdminOnly, c.changeEmail);
router.post("/:id/reset-password", authenticate, rootOnly,       c.resetPassword);

// ── Career + Status ────────────────────────────────────────────
router.get("/:id/career-history",        authenticate, requirePerm("faculty.view"),   c.getCareerHistory);
router.post("/:id/status",               authenticate, superAdminOnly,                c.changeStatus);
router.post("/:id/rollback/:history_id", authenticate, rootOnly,                      c.rollback);

// ── Subjects + Photo ──────────────────────────────────────────
router.post("/:id/subjects",  authenticate, requirePerm("faculty.manage"), c.assignSubjects);
router.post("/:id/photo",     authenticate, requirePerm("faculty.update"), upload.single("photo"), c.uploadPhoto);

// ── Sensitive ─────────────────────────────────────────────────
router.get("/:id/salary",       authenticate, authorize(...ADMIN),            c.getSalary);
router.get("/:id/bank",         authenticate, authorize(...ADMIN),            c.getBankDetails);
router.get("/:id/id-card",      authenticate, requirePerm("faculty.view"),    c.getIdCardPdf);

// ── NEW: Qualifications ───────────────────────────────────────
router.get("/:id/qualifications",           authenticate, requirePerm("faculty.view"),   async (req,res,next) => {
  try { ok(res, await qual.getQualifications(req.params.id)); } catch(e){fail(res,e,next);}
});
router.post("/:id/qualifications",          authenticate, requirePerm("faculty.update"), auditLog("faculty","QUAL_ADD"), async (req,res,next) => {
  try { ok(res, await qual.upsertQualification(req.params.id, req.body), "Saved"); } catch(e){fail(res,e,next);}
});
router.delete("/:id/qualifications/:level", authenticate, requirePerm("faculty.update"), async (req,res,next) => {
  try { ok(res, await qual.deleteQualification(req.params.id, req.params.level), "Deleted"); } catch(e){fail(res,e,next);}
});
router.get("/:id/qualifications/validate",  authenticate, requirePerm("faculty.view"),   async (req,res,next) => {
  try { ok(res, await qual.validateTeachingQualifications(req.params.id)); } catch(e){fail(res,e,next);}
});

// ── NEW: Primary / Secondary Roles ───────────────────────────
router.patch("/:id/roles", authenticate, requirePerm("faculty.manage"), auditLog("faculty","ROLE_ASSIGN"), async (req,res,next) => {
  try { ok(res, await qual.setFacultyRoles(req.params.id, req.body), "Roles updated"); } catch(e){fail(res,e,next);}
});

export default router;