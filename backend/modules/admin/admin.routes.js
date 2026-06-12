// backend/modules/admin/admin.routes.js
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as c from "./admin.controller.js";

const router = Router();
const ADMIN = ["ADMIN", "SUPER_ADMIN"];
const SUPER = ["SUPER_ADMIN"];

// Dashboard
router.get("/dashboard", authenticate, authorize(...ADMIN), c.getDashboard);
router.get("/activity", authenticate, authorize(...ADMIN), c.getDashboardActivity);

// Reports
router.get("/reports/students", authenticate, authorize(...ADMIN), c.exportStudents);
router.get("/reports/faculty", authenticate, authorize(...ADMIN), c.exportFaculty);
router.get("/reports/enrollments", authenticate, authorize(...ADMIN), c.exportEnrollments);

// Admin CRUD
router.get("/", authenticate, authorize(...ADMIN), c.getAll);
router.post("/", authenticate, authorize(...ADMIN), c.create);
router.get("/:id", authenticate, authorize(...ADMIN), c.getOne);
router.patch("/:id", authenticate, authorize(...ADMIN), c.update);
router.delete("/:id", authenticate, authorize(...SUPER), c.remove);

// User management
router.get("/users/:id/permissions", authenticate, authorize(...ADMIN), c.getPermissions);
router.patch("/users/:id/permissions", authenticate, authorize(...ADMIN), c.updatePermissions);
router.patch("/users/:id/block", authenticate, authorize(...ADMIN), c.blockUser);
router.post("/users/:id/reset-password", authenticate, authorize(...ADMIN), c.resetPassword);
router.post("/users/:id/impersonate", authenticate, authorize(...SUPER), c.impersonate);

router.get("/students/analytics", authenticate, authorize(...ADMIN), c.getStudentAnalytics);
router.get("/students/export-advanced", authenticate, authorize(...ADMIN), c.exportStudentsAdvanced);

export default router;