// backend/modules/programs/program.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, requirePerm, superAdminOnly, rootOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./program.controller.js";
import { createProgramSchema, updateProgramSchema, programListSchema } from "./program.validator.js";
import prisma from "../../utils/prisma.js";
import { bulkCreatePrograms, getProgramTemplate } from "./program.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const getPrev = (req) => prisma.program.findUnique({ where: { id: req.params.id } });

router.get("/stats", authenticate, requirePerm("program:view"), c.getStats);
router.get("/template", authenticate, requirePerm("program:create"), c.downloadTemplate);
router.post("/bulk-upload", authenticate, requirePerm("program:create"), upload.single("file"), c.bulkUpload);
router.get("/", authenticate, requirePerm("program:view"), validate(programListSchema, "query"), c.getAll);
router.post("/", authenticate, requirePerm("program:create"), validate(createProgramSchema), auditLog("program", "CREATE"), c.create);
router.get("/:id", authenticate, requirePerm("program:view"), c.getById);
router.patch("/:id", authenticate, requirePerm("program:update"), validate(updateProgramSchema), auditLog("program", "UPDATE", { getPrev }), c.update);

// Lifecycle
router.post("/:id/deactivate", authenticate, superAdminOnly, auditLog("program", "DEACTIVATE", { getPrev }), c.deactivate);
router.post("/:id/restore", authenticate, superAdminOnly, auditLog("program", "RESTORE"), c.restore);
router.delete("/:id", authenticate, rootOnly, auditLog("program", "DELETE", { getPrev }), c.remove);

// bulk
router.get("/template", authenticate, requirePerm("program:view"), async (req, res, next) => {
    try { sendXlsx(res, await getProgramTemplate(), "program-template.xlsx"); } catch (e) { next(e); }
});
router.post("/bulk-upload", authenticate, requirePerm("program:create"), upload.single("file"), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
        res.json({ success: true, data: await bulkCreatePrograms(req.file.buffer) });
    } catch (e) { next(e); }
});

export default router;