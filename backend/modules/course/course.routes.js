import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validate, courseListSchema, createCourseSchema, updateCourseSchema } from "../shared/shared.validator.js";
import * as c from "./course.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN  = ["ADMIN", "SUPER_ADMIN"];

router.get("/template",     authenticate, authorize(...ADMIN), c.downloadTemplate);
router.post("/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUpload);
router.get("/",             authenticate, validate(courseListSchema, "query"), c.getAll);
router.get("/:id",          authenticate, c.getById);
router.post("/",            authenticate, authorize(...ADMIN), validate(createCourseSchema), c.create);
router.patch("/:id",        authenticate, authorize(...ADMIN), validate(updateCourseSchema), c.update);
router.delete("/:id",       authenticate, authorize(...ADMIN), c.remove);
export default router;
