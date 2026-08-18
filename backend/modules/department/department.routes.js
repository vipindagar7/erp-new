// backend/modules/department/department.routes.js  ── V3 REPLACE
import { Router } from "express";
import multer     from "multer";
import { authenticate, requirePerm, superAdminOnly, rootOnly } from "../../middlewares/auth.middleware.js";
import * as c from "./department.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── Static (before /:id) ──────────────────────────────────────
router.get( "/stats",       authenticate, requirePerm("departments.view"),   c.getStats);
router.get( "/template",    authenticate, requirePerm("departments.view"),   c.getTemplate);
router.get( "/export",      authenticate, requirePerm("departments.view"),   c.exportData);
router.post("/bulk-upload", authenticate, requirePerm("departments.create"), upload.single("file"), c.bulkUpload);

// ── CRUD ──────────────────────────────────────────────────────
router.get( "/",    authenticate, requirePerm("departments.view"),   c.getAll);
router.post("/",    authenticate, requirePerm("departments.create"), c.create);
router.get( "/:id", authenticate, requirePerm("departments.view"),   c.getOne);
router.patch("/:id",authenticate, requirePerm("departments.update"), c.update);
router.delete("/:id",authenticate,requirePerm("departments.delete"), c.remove);

// ── V3: History + Rollback ────────────────────────────────────
router.get( "/:id/history",                 authenticate, requirePerm("departments.view"), c.getHistory);
router.post("/:id/rollback/:history_id",    authenticate, rootOnly,                        c.rollback);
router.post("/:id/restore",                 authenticate, superAdminOnly,                  c.restore);

export default router;