// backend/modules/audit/audit.routes.js
import { Router } from "express";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as c from "./audit.controller.js";

const router = Router();

// Static routes before /:id
router.get("/stats", authenticate, requirePerm("audit:view"), c.getStats);
router.get("/export", authenticate, requirePerm("audit:export"), c.exportCsv);
router.get("/", authenticate, requirePerm("audit:view"), c.getLogs);
router.get("/:id", authenticate, requirePerm("audit:view"), c.getLog);
router.post("/:id/restore", authenticate, superAdminOnly, c.restore);

export default router;