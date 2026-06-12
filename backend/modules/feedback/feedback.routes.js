// backend/modules/feedback/feedback.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as c from "./feedback.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN = ["ADMIN", "SUPER_ADMIN"];
const SUPER = ["SUPER_ADMIN"];
const STAFF = ["ADMIN", "SUPER_ADMIN", "HOD", "FACULTY"];
const ALL = ["ADMIN", "SUPER_ADMIN", "HOD", "FACULTY", "CLASS_COORDINATOR", "STUDENT"];

// ── Categories ────────────────────────────────────────────────
router.get("/categories", authenticate, authorize(...STAFF), c.listCategories);
router.post("/categories", authenticate, authorize(...ADMIN), c.createCategory);
router.patch("/categories/:id", authenticate, authorize(...ADMIN), c.updateCategory);
router.delete("/categories/:id", authenticate, authorize(...SUPER), c.deleteCategory);

// ── Questions ─────────────────────────────────────────────────
router.get("/questions/template", authenticate, authorize(...ADMIN), c.getQuestionsTemplate);
router.post("/questions/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUploadQuestions);
router.get("/questions", authenticate, authorize(...STAFF), c.listQuestions);
router.post("/questions", authenticate, authorize(...ADMIN), c.createQuestion);
router.patch("/questions/:id", authenticate, authorize(...ADMIN), c.updateQuestion);
router.delete("/questions/:id", authenticate, authorize(...SUPER), c.deleteQuestion);

// ── Forms ─────────────────────────────────────────────────────
router.get("/forms", authenticate, authorize(...STAFF), c.listForms);
router.post("/forms", authenticate, authorize(...ADMIN), c.createForm);
router.get("/forms/:id", authenticate, authorize(...STAFF), c.getForm);
router.patch("/forms/:id", authenticate, authorize(...ADMIN), c.updateForm);
router.delete("/forms/:id", authenticate, authorize(...SUPER), c.deleteForm);
router.patch("/forms/:id/toggle", authenticate, authorize(...ADMIN), c.toggleForm);
router.patch("/forms/:id/action", authenticate, authorize(...ADMIN), c.setFormAction);
router.get("/forms/:id/results", authenticate, authorize(...STAFF), c.getFormResults);
router.get("/forms/:id/export", authenticate, authorize(...STAFF), c.exportFormResults);
router.get("/forms/:id/template", authenticate, authorize(...ADMIN), c.getFormTemplate);
router.post("/forms/:id/submit", authenticate, authorize(...ALL), c.submitFeedback);
router.post("/forms/:id/bulk-submit", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkSubmit);
router.delete("/forms/:id/responses", authenticate, authorize(...SUPER), c.deleteFormResponses);

// ── Groups ────────────────────────────────────────────────────
router.get("/groups", authenticate, authorize(...STAFF), c.listGroups);
router.get("/groups/:id", authenticate, authorize(...STAFF), c.getGroup);
router.patch("/groups/:id", authenticate, authorize(...ADMIN), c.updateGroup);
router.delete("/groups/:id", authenticate, authorize(...SUPER), c.deleteGroup);
router.get("/groups/:id/template", authenticate, authorize(...ADMIN), c.getGroupTemplate);
router.post("/groups/:id/bulk-submit", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkSubmitGroup);
router.get("/groups/:id/export", authenticate, authorize(...STAFF), c.exportGroupResults);

// ── Teaching report ───────────────────────────────────────────
router.get("/teaching-report", authenticate, authorize(...STAFF), c.getTeachingReport);
router.get("/teaching-report/export/:level/:id", authenticate, authorize(...STAFF), c.exportTeachingReport);

// ── Student: my forms ─────────────────────────────────────────
router.get("/my-forms", authenticate, authorize(...ALL), c.getMyForms);

export default router;