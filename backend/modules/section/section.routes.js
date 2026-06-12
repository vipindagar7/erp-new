// backend/modules/section/section.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./section.controller.js";
import { createSectionSchema, updateSectionSchema, sectionListSchema, assignSubjectSchema, updateSectionSubjectSchema } from "../shared/shared.validator.js";
import prisma from "../../utils/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const getPrev = async (req) => prisma.section.findUnique({ where: { id: req.params.id } });

// ── Static routes (before /:id) ───────────────────────────────
router.get("/history", authenticate, requirePerm("section:view_history"), c.getAllSectionHistory);
router.get("/subject-template", authenticate, requirePerm("section:assign_subject"), c.getSubjectTemplate);
router.post("/bulk-assign-subjects", authenticate, requirePerm("section:bulk_assign"), upload.single("file"), c.bulkAssignSubjects);

// ── CRUD ──────────────────────────────────────────────────────
router.get("/", authenticate, requirePerm("section:view"), validate(sectionListSchema, "query"), c.getAll);
router.post("/", authenticate, requirePerm("section:create"), validate(createSectionSchema), auditLog("section", "CREATE"), c.create);
router.get("/:id", authenticate, requirePerm("section:view"), c.getById);
router.patch("/:id", authenticate, requirePerm("section:update"), validate(updateSectionSchema), auditLog("section", "UPDATE", { getPrev }), c.update);
router.delete("/:id", authenticate, superAdminOnly, auditLog("section", "DELETE", { getPrev }), c.remove);

// ── Sub-resources ─────────────────────────────────────────────
router.get("/:id/history", authenticate, requirePerm("section:view_history"), c.getSectionHistory);
router.post("/:id/subjects", authenticate, requirePerm("section:assign_subject"), validate(assignSubjectSchema), auditLog("section_subject", "ASSIGN"), c.assignSubjectToSection);
router.patch("/:id/subjects/:subject_id", authenticate, requirePerm("section:assign_subject"), validate(updateSectionSubjectSchema), auditLog("section_subject", "UPDATE"), c.updateSectionSubjectFaculty);
router.delete("/:id/subjects/:subject_id", authenticate, requirePerm("section:assign_subject"), auditLog("section_subject", "REMOVE"), c.removeSubject);
// router.post("/:id/restore", authenticate, superAdminOnly, c.restore); // TODO: add restore to controller

// ── Promote ───────────────────────────────────────────────────
router.post("/promote-multiple", authenticate, requirePerm("student:bulk_promote"), c.promoteMultiple);
router.post("/student-counts", authenticate, requirePerm("section:view"), c.getStudentCounts);
router.post("/:id/promote", authenticate, requirePerm("student:bulk_promote"), auditLog("section", "PROMOTE"), c.promote);
router.patch("/:id/bulk-status", authenticate, requirePerm("section:update"), auditLog("section", "BULK_STATUS"), c.bulkStatus);

export default router;