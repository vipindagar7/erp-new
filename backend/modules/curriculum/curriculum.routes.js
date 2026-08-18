// backend/modules/curriculum/curriculum.routes.js
import { Router } from "express";
import multer     from "multer";
import { authenticate, authorize, requirePerm } from "../../middlewares/auth.middleware.js";
import * as c from "./curriculum.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN  = ["ADMIN", "SUPER_ADMIN"];
const STAFF  = ["ADMIN", "SUPER_ADMIN", "HOD", "FACULTY", "CLASS_COORDINATOR"];

// ── Curriculum (branch → semester → subjects) ─────────────────
router.get( "/",                   authenticate, authorize(...STAFF), c.getAll);
router.post("/",                   authenticate, authorize(...ADMIN), c.addSubject);
router.delete("/:id",              authenticate, authorize(...ADMIN), c.removeSubject);

// ── Templates + Bulk Upload ───────────────────────────────────
router.get( "/template",           authenticate, authorize(...ADMIN), c.getTemplate);
router.post("/bulk-upload",        authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUpload);

// ── Auto-assign subjects to sections ─────────────────────────
router.post("/auto-assign/:section_id", authenticate, authorize(...ADMIN), c.autoAssignSection);
router.post("/bulk-auto-assign",        authenticate, authorize(...ADMIN), c.bulkAutoAssign);

// ── Faculty assignment ────────────────────────────────────────
// Single: POST /curriculum/assign-faculty
router.post("/assign-faculty",          authenticate, authorize(...ADMIN), c.assignFaculty);
// Bulk via template: POST /curriculum/assign-faculty/bulk-upload
router.get( "/assign-faculty/template", authenticate, authorize(...ADMIN), c.getFacultyAssignmentTemplate);
router.post("/assign-faculty/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkAssignFaculty);

// ── Section's current assignments (view) ─────────────────────
router.get( "/section/:section_id/assignments", authenticate, authorize(...STAFF), c.getSectionAssignments);
router.get( "/section/:section_id/history",     authenticate, authorize(...STAFF), c.getHistory);

export default router;