import { Router } from "express";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as c from "./curriculum.controller.js";

const router = Router();
const ADMIN  = ["SUPER_ADMIN", "ADMIN", "ACADEMIC_ADMIN"];

// ── Static routes first ──────────────────────────────────────
router.get(   "/template",               authenticate, authorize(...ADMIN),            c.getCurriculumTemplate);
router.post(  "/bulk-upload",            authenticate, authorize(...ADMIN),            upload.single("file"), c.bulkUploadCurriculum);
router.get(   "/",                        authenticate, authorize(...ADMIN, "FACULTY"), c.getCurriculum);
router.post(  "/",                        authenticate, authorize(...ADMIN),            c.addSubject);
router.post(  "/bulk",                    authenticate, authorize(...ADMIN),            c.bulkAdd);
router.post(  "/copy-semester",           authenticate, authorize(...ADMIN),            c.copySemester);
router.post(  "/bulk-auto-assign",        authenticate, authorize(...ADMIN),            c.bulkAutoAssign);
router.post(  "/auto-assign/:section_id", authenticate, authorize(...ADMIN),            c.autoAssignSection);
// ── Param routes last ─────────────────────────────────────────
router.delete("/:id",                     authenticate, authorize(...ADMIN),            c.removeSubject);

export default router;