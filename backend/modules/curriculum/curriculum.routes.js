// backend/modules/curriculum/curriculum.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as c from "./curriculum.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN = ["ADMIN", "SUPER_ADMIN"];
const SUPER = ["SUPER_ADMIN"];
const STAFF = ["ADMIN", "SUPER_ADMIN", "HOD", "FACULTY", "CLASS_COORDINATOR"];

// ── Static routes before /:id ─────────────────────────────────
router.get("/history/:section_id", authenticate, authorize(...STAFF), c.getHistory);
router.get("/template", authenticate, authorize(...ADMIN), c.getTemplate);
router.post("/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUpload);
router.post("/bulk-auto-assign", authenticate, authorize(...ADMIN), c.bulkAutoAssign);

// ── CRUD ──────────────────────────────────────────────────────
router.get("/", authenticate, authorize(...STAFF), c.getAll);
router.post("/", authenticate, authorize(...ADMIN), c.addSubject);
router.delete("/:id", authenticate, authorize(...SUPER), c.removeSubject);
router.post("/auto-assign/:id", authenticate, authorize(...ADMIN), c.autoAssignSection);

export default router;