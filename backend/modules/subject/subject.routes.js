// backend/modules/subject/subject.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./subject.controller.js";
import { createSubjectSchema, updateSubjectSchema, subjectListSchema } from "../shared/shared.validator.js";
import prisma from "../../utils/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const getPrev = async (req) => prisma.subject.findUnique({ where: { id: req.params.id } });

router.get("/template", authenticate, requirePerm("subject:bulk_upload"), c.downloadTemplate);
router.post("/bulk-upload", authenticate, requirePerm("subject:bulk_upload"), upload.single("file"), c.bulkUpload);
router.get("/", authenticate, requirePerm("subject:view"), validate(subjectListSchema, "query"), c.getAll);
router.post("/", authenticate, requirePerm("subject:create"), validate(createSubjectSchema), auditLog("subject", "CREATE"), c.create);
router.get("/:id", authenticate, requirePerm("subject:view"), c.getById);
router.patch("/:id", authenticate, requirePerm("subject:update"), validate(updateSubjectSchema), auditLog("subject", "UPDATE", { getPrev }), c.update);
router.delete("/:id", authenticate, superAdminOnly, auditLog("subject", "DELETE", { getPrev }), c.remove);
// router.post("/:id/restore", authenticate, superAdminOnly, c.restore); // TODO

export default router;