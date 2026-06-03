// backend/modules/reports/reports.routes.js
import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  exportStudentsBySection,
  exportStudentsByDept,
  exportFacultyList,
  exportEnrollmentSummary,
  exportFeedbackSummary,
} from "./reports.controller.js";
import {
  validate,
  bySectionQuerySchema,
  byDeptQuerySchema,
  enrollmentQuerySchema,
  feedbackParamSchema,
} from "./reports.validator.js";

const router = express.Router();
router.use(authenticate, authorize("ADMIN","SUPER_ADMIN"));

router.get("/students/by-section", validate(bySectionQuerySchema,  "query"),  exportStudentsBySection);
router.get("/students/by-dept",    validate(byDeptQuerySchema,      "query"),  exportStudentsByDept);
router.get("/faculty",                                                          exportFacultyList);
router.get("/enrollments",         validate(enrollmentQuerySchema,  "query"),  exportEnrollmentSummary);
router.get("/feedback/:formId",    validate(feedbackParamSchema,    "params"), exportFeedbackSummary);

export default router;
