// backend/modules/section/section.routes.js  ── FINAL CLEAN
import { Router } from "express";
import multer    from "multer";
import { authenticate, requirePerm, superAdminOnly, rootOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./section.controller.js";
import { createSectionSchema, updateSectionSchema, sectionListSchema, assignSubjectSchema, updateSectionSubjectSchema } from "../shared/shared.validator.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ═══════════════════════════════════════════════════════════════
// STATIC ROUTES — all before /:id
// ═══════════════════════════════════════════════════════════════
router.get( "/template",                authenticate,                          c.sectionTemplate);
router.post("/bulk-upload",             authenticate, requirePerm("section:create"),  upload.single("file"), c.sectionBulkUpload);
router.post("/bulk-promote",            authenticate, requirePerm("section:promote"), c.bulkPromote);
router.post("/bulk-demote",             authenticate, superAdminOnly,                 c.bulkDemote);
router.post("/graduate",                authenticate, superAdminOnly,                 c.graduate);
router.get( "/student-status-template", authenticate, requirePerm("section:view"),   c.statusTemplate);
router.post("/student-status-upload",   authenticate, requirePerm("section:update"), upload.single("file"), c.statusUpload);
router.get( "/transfer-template",       authenticate, requirePerm("section:view"),   c.transferTemplate);
router.post("/transfer-upload",         authenticate, requirePerm("section:update"), upload.single("file"), c.transferUpload);
router.post("/promote-multiple",        authenticate, requirePerm("student:bulk_promote"), c.promoteMultiple);
router.get( "/history",                 authenticate, requirePerm("section:view_history"), c.getAllSectionHistory);
router.get( "/stats",                   authenticate, requirePerm("section:view"),   c.getStats);
router.post("/student-counts",          authenticate, requirePerm("section:view"),   c.getStudentCounts);
router.get( "/subject-template",        authenticate, requirePerm("section:assign_subject"), c.getSubjectTemplate);
router.post("/bulk-assign-subjects",    authenticate, requirePerm("section:bulk_assign"), upload.single("file"), c.bulkAssignSubjects);

// ═══════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════
router.get( "/",    authenticate, requirePerm("section:view"),   validate(sectionListSchema, "query"), c.getAll);
router.post("/",    authenticate, requirePerm("section:create"), validate(createSectionSchema), auditLog("section","CREATE"), c.create);

// ═══════════════════════════════════════════════════════════════
// /:id ROUTES
// ═══════════════════════════════════════════════════════════════
router.get(   "/:id",    authenticate, requirePerm("section:view"),   c.getById);
router.patch( "/:id",    authenticate, requirePerm("section:update"), validate(updateSectionSchema), auditLog("section","UPDATE"), c.update);
router.delete("/:id",    authenticate, superAdminOnly,                c.remove);
router.post(  "/:id/restore", authenticate, superAdminOnly,           c.restore);

// ── History + Snapshots ───────────────────────────────────────
router.get( "/:id/history",            authenticate, requirePerm("section:view_history"), c.getSectionHistory);
router.get( "/:id/snapshots",          authenticate, requirePerm("section:view"),         c.getSnapshots);
router.get( "/:id/snapshots/:snap_id", authenticate, requirePerm("section:view"),         c.getSnapshotOne);

// ── Subjects ──────────────────────────────────────────────────
router.post(  "/:id/subjects",             authenticate, requirePerm("section:assign_subject"), validate(assignSubjectSchema),           auditLog("section_subject","ASSIGN"), c.assignSubjectToSection);
router.patch( "/:id/subjects/:subject_id", authenticate, requirePerm("section:assign_subject"), validate(updateSectionSubjectSchema),    auditLog("section_subject","UPDATE"), c.updateSectionSubjectFaculty);
router.delete("/:id/subjects/:subject_id", authenticate, requirePerm("section:assign_subject"), auditLog("section_subject","REMOVE"),    c.removeSubject);
router.post(  "/:id/auto-assign-subjects", authenticate, requirePerm("section:assign_subject"), c.autoAssignSubjects);

// ── Students ──────────────────────────────────────────────────
router.get(  "/:id/students",        authenticate, requirePerm("section:view"),   c.getStudents);
router.post( "/:id/add-students",    authenticate, requirePerm("section:update"), c.addStudents);
router.post( "/:id/remove-students", authenticate, requirePerm("section:update"), c.removeStudents);

// ── Groups ────────────────────────────────────────────────────
router.get( "/:id/group-template",  authenticate, requirePerm("section:update"), c.getGroupTemplate);
router.post("/:id/group-upload",    authenticate, requirePerm("section:update"), upload.single("file"), c.uploadGroups);
router.post("/:id/assign-groups",   authenticate, requirePerm("section:update"), c.assignGroups);

// ── FYE Split ─────────────────────────────────────────────────
router.get( "/:id/fye-split-template", authenticate, requirePerm("section:update"), c.getFyeTemplate);
router.post("/:id/fye-split-upload",   authenticate, superAdminOnly, upload.single("file"), c.uploadFyeSplit);

// ── Promote / Demote / Detain / Rollback ─────────────────────
router.post("/:id/promote",         authenticate, requirePerm("student:bulk_promote"), auditLog("section","PROMOTE"), c.promoteSection);
router.post("/:id/demote",          authenticate, superAdminOnly,                      c.demoteSection);
router.post("/:id/detain",          authenticate, requirePerm("section:update"),       c.detainStudents);
router.post("/:id/fye-split",       authenticate, superAdminOnly,                      c.fyeSplit);
router.post("/:id/promote-student", authenticate, requirePerm("section:promote"),      c.promoteStudent);
router.patch("/:id/bulk-status",    authenticate, requirePerm("section:update"),       auditLog("section","BULK_STATUS"), c.bulkStatus);

// ── Rollback (root only) ──────────────────────────────────────
router.post("/:id/rollback/:snap_id", authenticate, rootOnly, c.rollback);

export default router;