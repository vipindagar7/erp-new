import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import {
  validate, facultyListSchema, createFacultySchema,
  updateFacultySchema, blockSchema, assignSubjectsSchema,
} from "./faculty.validator.js";
import * as c from "./faculty.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN  = ["ADMIN", "SUPER_ADMIN"];

router.get("/template",        authenticate, authorize(...ADMIN), c.downloadTemplate);
router.post("/bulk-upload",    authenticate, authorize(...ADMIN), upload.single("file"), c.bulkUpload);
router.get("/me",              authenticate, authorize("FACULTY"), c.getMe);
router.get("/",                authenticate, validate(facultyListSchema, "query"), c.getAll);
router.get("/:id",             authenticate, c.getById);
router.post("/",               authenticate, authorize(...ADMIN), validate(createFacultySchema), c.create);
router.patch("/:id",           authenticate, authorize(...ADMIN), validate(updateFacultySchema), c.update);
router.delete("/:id",          authenticate, authorize(...ADMIN), c.remove);
router.patch("/:id/block",     authenticate, authorize(...ADMIN), validate(blockSchema), c.toggleBlock);
router.put("/:id/subjects",    authenticate, authorize(...ADMIN), validate(assignSubjectsSchema), c.assignSubjects);

export default router;
