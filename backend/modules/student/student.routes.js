import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validate } from "./student.validator.js";
import { createStudentSchema, updateStudentSchema, paginationSchema } from "./student.validator.js";
import * as c from "./student.controller.js";

const router = Router();
const ADMIN = ["ADMIN", "SUPER_ADMIN"];

// ══ ALL static / named routes MUST come before /:id ══════════════════════════

// ── Template download ─────────────────────────────────────────
router.get("/template", authenticate, authorize(...ADMIN), c.getTemplate);

// ── Bulk upload (create) ──────────────────────────────────────
router.post("/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUpload);

// ── Bulk operations ───────────────────────────────────────────
router.post("/bulk-delete", authenticate, authorize(...ADMIN), c.bulkDelete);
router.post("/bulk-block", authenticate, authorize(...ADMIN), c.bulkBlock);
router.patch("/bulk-enrollment-status", authenticate, authorize(...ADMIN), c.bulkEnrollmentStatus);

// ── Bulk promote ──────────────────────────────────────────────
router.post("/bulk-promote/institution", authenticate, authorize(...ADMIN), c.bulkPromoteInstitution);
router.post("/bulk-promote/section", authenticate, authorize(...ADMIN), c.bulkPromoteSection);

// ── Bulk change section ───────────────────────────────────────
router.post("/bulk-change-section", authenticate, authorize(...ADMIN), c.bulkChangeSection);

// ══ Standard CRUD ════════════════════════════════════════════════════════════

router.get("/", authenticate, validate(paginationSchema, "query"), c.getAll);
router.post("/", authenticate, authorize(...ADMIN), validate(createStudentSchema), c.create);

// ── Parameterised routes LAST ─────────────────────────────────
router.get("/:id", authenticate, c.getById);
router.patch("/:id", authenticate, authorize(...ADMIN), validate(updateStudentSchema), c.update);
router.delete("/:id", authenticate, authorize(...ADMIN), c.remove);
router.patch("/:id/block", authenticate, authorize(...ADMIN), c.toggleBlock);
router.post("/:id/promote", authenticate, authorize(...ADMIN, "FACULTY"), c.promote);
router.post("/:id/demote", authenticate, authorize(...ADMIN), c.demote);
router.post("/bulk-demote", authenticate, authorize(...ADMIN), c.bulkDemote);
router.patch("/:id/section", authenticate, authorize(...ADMIN, "FACULTY"), c.changeSection);

export default router;