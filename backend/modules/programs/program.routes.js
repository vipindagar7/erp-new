// backend/modules/program/program.routes.js
import { Router }   from "express";
import multer       from "multer";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c       from "./program.controller.js";
import { createProgramSchema, updateProgramSchema, programListSchema } from "../shared/shared.validator.js";
import prisma       from "../../utils/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const getPrev = async (req) => prisma.program.findUnique({ where: { id: req.params.id } });

router.get(   "/template",    authenticate, requirePerm("program:create"), c.downloadTemplate);
router.post(  "/bulk-upload", authenticate, requirePerm("program:create"), upload.single("file"), c.bulkUpload);
router.get(   "/",            authenticate, requirePerm("program:view"),   validate(programListSchema,"query"), c.getAll);
router.post(  "/",            authenticate, requirePerm("program:create"), validate(createProgramSchema),       auditLog("program","CREATE"),             c.create);
router.get(   "/:id",         authenticate, requirePerm("program:view"),   c.getById);
router.patch( "/:id",         authenticate, requirePerm("program:update"), validate(updateProgramSchema),       auditLog("program","UPDATE",{ getPrev }), c.update);
router.delete("/:id",         authenticate, superAdminOnly,                                                      auditLog("program","DELETE",{ getPrev }), c.remove);
// router.post("/:id/restore", authenticate, superAdminOnly, c.restore); // TODO

export default router;