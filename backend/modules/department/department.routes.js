// backend/modules/department/department.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./department.controller.js";
import { updateDepartmentSchema ,createDepartmentSchema } from "./department.validator.js";
import prisma from "../../utils/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const getPrev = async (req) => prisma.department.findUnique({ where: { id: req.params.id } });

router.get("/template", authenticate, requirePerm("department:create"), c.downloadTemplate);
router.post("/bulk-upload", authenticate, requirePerm("department:create"), upload.single("file"), c.bulkUpload);
router.get("/", authenticate, requirePerm("department:view"), c.getAll);
router.post("/", authenticate, requirePerm("department:create"), validate(createDepartmentSchema), auditLog("department", "CREATE"), c.create);
router.get("/:id", authenticate, requirePerm("department:view"), c.getById);
router.patch("/:id", authenticate, requirePerm("department:update"), validate(updateDepartmentSchema), auditLog("department", "UPDATE", { getPrev }), c.update);
router.delete("/:id", authenticate, superAdminOnly, auditLog("department", "DELETE", { getPrev }), c.remove);
// // router.post("/:id/restore", authenticate, superAdminOnly, c.restore); // TODO // TODO

export default router;