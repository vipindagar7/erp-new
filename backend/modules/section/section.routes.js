import { Router } from "express";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import * as c from "./section.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  validate,
  sectionListSchema,
  createSectionSchema,
  updateSectionSchema,
  assignSubjectSchema,
  updateSectionSubjectSchema,
  validatePromote,
  validateMultiPromote,
  validateStatus,
  validateCounts,
} from "../shared/shared.validator.js";

const router = Router();
const ADMIN = ["ADMIN", "SUPER_ADMIN"];

// ── CRUD ──────────────────────────────────────────────────────
// ── Static routes MUST come before /:id ──────────────────────
router.get("/subject-template", authenticate, authorize(...ADMIN), c.getSubjectTemplate);
router.post("/bulk-assign-subjects", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkAssignSubjects);

// ── CRUD ──────────────────────────────────────────────────────
router.get("/", authenticate, validate(sectionListSchema, "query"), c.getAll);
router.get("/:id", authenticate, c.getById);
router.post("/", authenticate, authorize(...ADMIN), validate(createSectionSchema), c.create);
router.patch("/:id", authenticate, authorize(...ADMIN), validate(updateSectionSchema), c.update);
router.delete("/:id", authenticate, authorize(...ADMIN), c.remove);

// ── Subject assignment ────────────────────────────────────────
router.post("/:id/subjects", authenticate, authorize(...ADMIN), validate(assignSubjectSchema), c.assignSubjectToSection);
router.patch("/:id/subjects/:subject_id", authenticate, authorize(...ADMIN), validate(updateSectionSubjectSchema), c.updateSectionSubjectFaculty);
router.delete("/:id/subjects/:subject_id", authenticate, authorize(...ADMIN), c.removeSubject);

// ── Promote / status (static paths BEFORE /:id) ───────────────
router.post("/promote-multiple", authenticate, authorize(...ADMIN), c.promoteMultiple);
router.post("/student-counts", authenticate, authorize(...ADMIN), c.getStudentCounts);
router.post("/:id/promote", authenticate, authorize(...ADMIN),  c.promote);
router.patch("/:id/bulk-status", authenticate, authorize(...ADMIN), c.bulkStatus);

export default router;