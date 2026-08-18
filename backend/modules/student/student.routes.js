// backend/modules/student/student.routes.js
import { Router } from "express";
import multer from "multer";
import {
  authenticate, requirePerm, requireAnyPerm,
  superAdminOnly, rootOnly,
} from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./student.controller.js";
import { createStudentSchema, updateStudentSchema, paginationSchema } from "./student.validator.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ═══════════════════════════════════════════════════════════════
// STATIC ROUTES — all before /:id
// ═══════════════════════════════════════════════════════════════

// Stats + Template + Export
router.get("/stats", authenticate, requirePerm("student:view"), c.getStats);
router.post("/bulk-photos", authenticate, superAdminOnly, upload.single("file"), c.bulkPhotoUpload);
router.get("/template", authenticate, requirePerm("student:export"), c.getTemplate);
router.get("/export", authenticate, requirePerm("student:export"), c.exportStudents);

// Bulk CRUD
router.post("/bulk-upload", authenticate, requirePerm("student:create"), upload.single("file"), c.bulkUpload);
router.post("/bulk-delete", authenticate, superAdminOnly, c.bulkDelete);
router.post("/bulk-hard-delete", authenticate, rootOnly, c.bulkHardDelete);
router.post("/bulk-block", authenticate, requirePerm("student:block"), c.bulkBlock);
router.patch("/bulk-enrollment-status", authenticate, requirePerm("student:update"), c.bulkEnrollmentStatus);

// Bulk promote / demote
router.post("/bulk-promote/institution", authenticate, requirePerm("student:bulk_promote"), auditLog("student", "BULK_PROMOTE"), c.bulkPromoteInstitution);
router.post("/bulk-promote/section", authenticate, requirePerm("student:bulk_promote"), auditLog("student", "BULK_PROMOTE"), c.bulkPromoteSection);
router.post("/bulk-demote", authenticate, requirePerm("student:promote"), auditLog("student", "BULK_DEMOTE"), c.bulkDemote);

// Bulk section change
router.post("/bulk-change-section", authenticate, requirePerm("student:change_section"), c.bulkChangeSection);

// Section assign template (V3)
router.get("/section-assign-template", authenticate, requirePerm("student:change_section"), c.sectionAssignTemplate);
router.post("/section-assign-upload", authenticate, requirePerm("student:change_section"), upload.single("file"), c.sectionAssignUpload);
router.get("/section-change-template", authenticate, requirePerm("student:change_section"), c.sectionAssignTemplate);
router.post("/section-change-upload", authenticate, requirePerm("student:change_section"), upload.single("file"), c.sectionAssignUpload);

// ═══════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════
router.get("/all", authenticate, requirePerm("student:view"), c.getAllNoPaginate);
router.get("/", authenticate, requirePerm("student:view"), validate(paginationSchema, "query"), c.getAll);
router.post("/", authenticate, requirePerm("student:create"), validate(createStudentSchema), auditLog("student", "CREATE"), c.create);

// ═══════════════════════════════════════════════════════════════
// /:id ROUTES — all after static routes
// ═══════════════════════════════════════════════════════════════
router.get("/:id", authenticate, requireAnyPerm("student:view", "student:view_own"), c.getById);
router.patch("/:id", authenticate, requirePerm("student:update"), validate(updateStudentSchema), auditLog("student", "UPDATE"), c.update);
router.delete("/:id", authenticate, superAdminOnly, auditLog("student", "DELETE"), c.remove);
router.post("/:id/restore", authenticate, superAdminOnly, c.restore);
router.patch("/:id/email", authenticate, superAdminOnly, c.changeEmail);
router.post("/:id/reset-password", authenticate, rootOnly, c.resetPassword);
router.post("/:id/photo", authenticate, requirePerm("student:update"), upload.single("photo"), c.uploadPhoto);

// Block / Unblock — separate routes (fixes Cannot POST /unblock)
router.post("/:id/block", authenticate, requirePerm("student:block"), auditLog("student", "BLOCK"), c.blockStudent);
router.post("/:id/unblock", authenticate, requirePerm("student:block"), auditLog("student", "UNBLOCK"), c.unblockStudent);
router.patch("/:id/block", authenticate, requirePerm("student:block"), auditLog("student", "BLOCK"), c.toggleBlock);

// Status change (V3)
router.post("/:id/status", authenticate, superAdminOnly, auditLog("student", "STATUS_CHANGE"), c.changeStatus);

// Promote / Demote
router.post("/:id/promote", authenticate, requirePerm("student:promote"), auditLog("student", "PROMOTE"), c.promote);
router.post("/:id/demote", authenticate, requirePerm("student:promote"), auditLog("student", "DEMOTE"), c.demote);

// Section change
router.patch("/:id/section", authenticate, requirePerm("student:change_section"), auditLog("student", "CHANGE_SECTION"), c.changeSection);

// History + Rollback (V3)
router.get("/:id/history", authenticate, requirePerm("student:view"), c.getHistory);
router.get("/:id/enrollment-history", authenticate, requirePerm("student:view"), c.getEnrollmentHistory);
router.post("/:id/rollback/:history_id", authenticate, rootOnly, c.rollback);

// ADD THESE 2 ROUTES to backend/modules/student/student.routes.js
// (after the existing template and bulkUpload routes)

import { generateTemplateNoSection, bulkCreateStudentsNoSection } from "./student.service.js";

// ── No-section template download ──────────────────────────────
router.get("/template/no-section", authenticate, requirePerm("students.create"), async (req, res, next) => {
  try {
    const buffer = generateTemplateNoSection();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="student_template_no_section.xlsx"`);
    res.send(buffer);
  } catch (e) { next(e); }
});

// ── No-section bulk create ─────────────────────────────────────
router.post("/bulk-upload/no-section", authenticate, requirePerm("students.create"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const result = await bulkCreateStudentsNoSection(req.file.buffer);
    res.json({ success: true, message: `${result.created.length} created, ${result.failed.length} failed`, data: result });
  } catch (e) { next(e); }
});

export default router;