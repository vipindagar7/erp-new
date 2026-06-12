// backend/modules/faculty/faculty.routes.js
import { Router } from "express";
import { authenticate, authorize, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import multer from "multer";
import * as c from "./faculty.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const ADMIN = ["ADMIN", "SUPER_ADMIN"];

// ── Template & Bulk ───────────────────────────────────────────
router.get("/template", authenticate, requirePerm("faculty.create"), c.getTemplate);
router.post("/bulk-upload", authenticate, requirePerm("faculty.create"), upload.single("file"), c.bulkUpload);

// ── Me ────────────────────────────────────────────────────────
router.get("/me", authenticate, c.getMe);

// ── Analytics ─────────────────────────────────────────────────
router.get("/analytics", authenticate, requirePerm("faculty.view"), c.getAnalytics);
router.get("/export-advanced", authenticate, requirePerm("faculty.export"), c.exportAdvanced);
router.get("/export", authenticate, requirePerm("faculty.export"), c.exportBasic);

// ── CRUD ──────────────────────────────────────────────────────
router.get("/", authenticate, requirePerm("faculty.view"), c.getAll);
router.post("/", authenticate, requirePerm("faculty.create"), auditLog("faculty", "CREATE"), c.create);

router.get("/:id", authenticate, requirePerm("faculty.view"), c.getOne);
router.patch("/:id", authenticate, requirePerm("faculty.update"), auditLog("faculty", "UPDATE"), c.update);
router.delete("/:id", authenticate, superAdminOnly, auditLog("faculty", "DELETE"), c.remove);
router.post("/:id/restore", authenticate, superAdminOnly, auditLog("faculty", "RESTORE"), c.restore);
router.patch("/:id/block", authenticate, requirePerm("faculty.block"), auditLog("faculty", "BLOCK"), c.block);
router.put("/:id/subjects", authenticate, requirePerm("faculty.assign_subject"), auditLog("faculty", "UPDATE"), c.assignSubjects);

// ── Photo upload ──────────────────────────────────────────────
router.post("/:id/photo", authenticate, requirePerm("faculty.update"), upload.single("photo"), c.uploadPhoto);

// ── Sensitive data (OTP action token required) ────────────────
router.get("/:id/salary", authenticate, authorize(...ADMIN), c.getSalary);
router.get("/:id/bank", authenticate, authorize(...ADMIN), c.getBankDetails);

// ── ID Card PDF ───────────────────────────────────────────────
router.get("/:id/idcard-pdf", authenticate, requirePerm("faculty.view"), c.getIdCardPdf);

export default router;