import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as c from "./feedback.controller.js";
import { validate, submitFormSchema, updateFormSchema, createCategorySchema, updateCategorySchema, createQuestionSchema, updateQuestionSchema } from "./feedback.validator.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN = ["ADMIN", "SUPER_ADMIN"];

// ── Categories ────────────────────────────────────────────────
router.get("/categories", authenticate, c.listCategories);
router.get("/categories/:id", authenticate, c.getCategoryById);
router.post("/categories", authenticate, authorize(...ADMIN), validate(createCategorySchema), c.createCategory);
router.patch("/categories/:id", authenticate, authorize(...ADMIN), validate(updateCategorySchema), c.updateCategory);
router.delete("/categories/:id", authenticate, authorize(...ADMIN), c.deleteCategory);

// ── Questions ─────────────────────────────────────────────────
// Static routes BEFORE /:id
router.get("/questions/template", authenticate, authorize(...ADMIN), c.getQuestionTemplate);
router.post("/questions/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUploadQuestions);
router.get("/questions", authenticate, c.listQuestions);
router.get("/questions/:id", authenticate, c.getQuestionById);
router.post("/questions", authenticate, authorize(...ADMIN), validate(createQuestionSchema), c.createQuestion);
router.patch("/questions/:id", authenticate, authorize(...ADMIN), validate(updateQuestionSchema), c.updateQuestion);
router.delete("/questions/:id", authenticate, authorize(...ADMIN), c.deleteQuestion);

// ── Forms — static paths BEFORE /:formId ─────────────────────
router.get("/forms", authenticate, c.listForms);
router.post("/forms", authenticate, authorize(...ADMIN), c.createForm);

// ── Forms — :formId sub-routes (static sub-paths first) ──────
router.delete("/forms/:formId/responses", authenticate, authorize(...ADMIN), c.deleteFormResponses);
router.patch("/forms/:formId/toggle", authenticate, authorize(...ADMIN), c.toggleFormActive);
router.patch("/forms/:formId/action", authenticate, authorize(...ADMIN), c.updateActionTaken);
router.get("/forms/:formId/questions", authenticate, c.getFormQuestions);
router.get("/forms/:formId/bulk-template", authenticate, authorize(...ADMIN), c.getBulkTemplate);
router.post("/forms/:formId/bulk-submit", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkSubmit);
router.get("/forms/:formId/results", authenticate, authorize(...ADMIN, "FACULTY"), c.getFormResults);
router.get("/forms/:formId/export", authenticate, authorize(...ADMIN), c.exportFormResults);

// ── Forms — generic CRUD (:formId last) ──────────────────────
router.get("/forms/:formId", authenticate, c.getFormById);
router.patch("/forms/:formId", authenticate, authorize(...ADMIN), validate(updateFormSchema), c.updateForm);
router.delete("/forms/:formId", authenticate, authorize(...ADMIN), c.deleteForm);

// ── Student ───────────────────────────────────────────────────
router.get("/my-forms", authenticate, authorize("STUDENT"), c.getMyForms);
router.post("/forms/:formId/submit", authenticate, authorize("STUDENT"), validate(submitFormSchema), c.submitFeedback);

// ── Form Groups ───────────────────────────────────────────────
router.get("/groups", authenticate, authorize(...ADMIN), c.listFormGroups);
router.get("/groups/:groupId", authenticate, authorize(...ADMIN), c.getFormGroup);
router.patch("/groups/:groupId", authenticate, authorize(...ADMIN), c.updateFormGroup);
router.delete("/groups/:groupId", authenticate, authorize(...ADMIN), c.deleteFormGroup);
router.get("/groups/:groupId/export", authenticate, authorize(...ADMIN), c.exportGroupResults);
router.get("/groups/:groupId/bulk-template", authenticate, authorize(...ADMIN), c.getGroupBulkTemplate);
router.post("/groups/:groupId/bulk-submit", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkSubmitGroupResponses);

// ── Teaching Report ───────────────────────────────────────────
router.get("/teaching-report", authenticate, authorize(...ADMIN, "FACULTY"), c.getTeachingReport);
router.get("/export-level", authenticate, authorize(...ADMIN), c.exportLevelReport);

export default router;