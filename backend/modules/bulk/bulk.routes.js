// backend/modules/bulk/bulk.routes.js
import { Router } from "express";
import multer     from "multer";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as c from "./bulk.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Status change
router.get( "/status/template",   authenticate, requirePerm("students.view"),   c.getStatusTemplate);
router.post("/status/upload",     authenticate, requirePerm("students.update"),  upload.single("file"), c.bulkStatus);

// Promote
router.get( "/promote/template",  authenticate, requirePerm("students.promote"), c.getPromoteTemplate);
router.post("/promote/upload",    authenticate, requirePerm("students.promote"), upload.single("file"), c.bulkPromote);

// Demote
router.get( "/demote/template",   authenticate, requirePerm("students.promote"), c.getDemoteTemplate);
router.post("/demote/upload",     authenticate, requirePerm("students.promote"), upload.single("file"), c.bulkDemote);

// Section-based
router.post("/section/promote",   authenticate, requirePerm("students.promote"), c.sectionPromote);
router.post("/section/status",    authenticate, requirePerm("students.update"),  c.sectionBulkStatus);

// Export results back to Excel
router.post("/export-results",    authenticate, requirePerm("students.view"),    c.exportResults);

export default router;
