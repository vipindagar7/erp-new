// backend/modules/course/course.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./course.controller.js";
import { createCourseSchema, updateCourseSchema, courseListSchema } from "../shared/shared.validator.js";
import prisma from "../../utils/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const getPrev = async (req) => prisma.course.findUnique({ where: { id: req.params.id } });

router.get("/template", authenticate, requirePerm("course:create"), c.downloadTemplate);
router.post("/bulk-upload", authenticate, requirePerm("course:create"), upload.single("file"), c.bulkUpload);
router.get("/", authenticate, requirePerm("course:view"), validate(courseListSchema, "query"), c.getAll);
router.post("/", authenticate, requirePerm("course:create"), validate(createCourseSchema), auditLog("course", "CREATE"), c.create);
router.get("/:id", authenticate, requirePerm("course:view"), c.getById);
router.patch("/:id", authenticate, requirePerm("course:update"), validate(updateCourseSchema), auditLog("course", "UPDATE", { getPrev }), c.update);
router.delete("/:id", authenticate, superAdminOnly, auditLog("course", "DELETE", { getPrev }), c.remove);
// router.post("/:id/restore", authenticate, superAdminOnly, c.restore); // TODO

export default router;