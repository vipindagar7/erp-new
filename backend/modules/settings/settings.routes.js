// backend/modules/settings/settings.routes.js
import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  getMyProfile,
  updateStudentProfile,
  updateFacultyProfile,
} from "./settings.controller.js";
import {
  validate,
  updateStudentSchema,
  updateFacultySchema,
} from "./settings.validator.js";

const router = express.Router();
router.use(authenticate);

router.get(   "/profile",          getMyProfile);
router.patch( "/profile/student",  validate(updateStudentSchema), updateStudentProfile);
router.patch( "/profile/faculty",  validate(updateFacultySchema), updateFacultyProfile);

export default router;
