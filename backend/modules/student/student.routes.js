// backend/modules/student/student.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, requirePerm, requireAnyPerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./student.controller.js";
import { createStudentSchema, updateStudentSchema, paginationSchema } from "./student.validator.js";
import prisma from "../../utils/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const getPrev = async (req) => prisma.student.findUnique({ where: { id: req.params.id } });

// ── Static / bulk routes (before /:id) ───────────────────────
router.get("/template", authenticate, requirePerm("student:export"), c.getTemplate);
router.post("/bulk-upload", authenticate, requirePerm("student:create"), upload.single("file"), c.bulkUpload);
router.post("/bulk-delete", authenticate, superAdminOnly, c.bulkDelete);
router.post("/bulk-block", authenticate, requirePerm("student:block"), c.bulkBlock);
router.patch("/bulk-enrollment-status", authenticate, requirePerm("student:update"), c.bulkEnrollmentStatus);
router.post("/bulk-promote/institution", authenticate, requirePerm("student:bulk_promote"), auditLog("student", "BULK_PROMOTE"), c.bulkPromoteInstitution);
router.post("/bulk-promote/section", authenticate, requirePerm("student:bulk_promote"), auditLog("student", "BULK_PROMOTE"), c.bulkPromoteSection);
router.post("/bulk-change-section", authenticate, requirePerm("student:change_section"), c.bulkChangeSection);
router.post("/bulk-demote", authenticate, requirePerm("student:promote"), auditLog("student", "BULK_DEMOTE"), c.bulkDemote);

// ── CRUD ──────────────────────────────────────────────────────
router.get("/", authenticate, requirePerm("student:view"), validate(paginationSchema, "query"), c.getAll);
router.post("/", authenticate, requirePerm("student:create"), validate(createStudentSchema), auditLog("student", "CREATE"), c.create);

router.get("/:id", authenticate, requireAnyPerm("student:view", "student:view_own"), c.getById);
router.patch("/:id", authenticate, requirePerm("student:update"), validate(updateStudentSchema), auditLog("student", "UPDATE", { getPrev }), c.update);
router.delete("/:id", authenticate, superAdminOnly, auditLog("student", "DELETE", { getPrev }), c.remove);

// ── Actions ───────────────────────────────────────────────────
router.patch("/:id/block", authenticate, requirePerm("student:block"), auditLog("student", "BLOCK", { getPrev }), c.toggleBlock);
router.post("/:id/promote", authenticate, requirePerm("student:promote"), auditLog("student", "PROMOTE", { getPrev }), c.promote);
router.post("/:id/demote", authenticate, requirePerm("student:promote"), auditLog("student", "DEMOTE", { getPrev }), c.demote);
router.patch("/:id/section", authenticate, requirePerm("student:change_section"), auditLog("student", "CHANGE_SECTION", { getPrev }), c.changeSection);
// router.post("/:id/restore", authenticate, superAdminOnly, c.restore); // TODO
// router.get("/export", authenticate, requirePerm("student:export"), c.exportStudents); // TODO

export default router;