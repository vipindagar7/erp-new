// backend/modules/admin/admin.routes.js
import { Router }  from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { auditLog, superAdminOnly } from "../../middlewares/audit.middleware.js";
import * as c      from "./admin.controller.js";
import { validate, listQuerySchema, idParamSchema, createAdminSchema, updateAdminSchema } from "./admin.validator.js";

const router = Router();
const ADMIN  = ["ADMIN", "SUPER_ADMIN"];
const SUPER  = ["SUPER_ADMIN"];

// ── Dashboard ─────────────────────────────────────────────────
router.get("/dashboard/stats",     authenticate, authorize(...ADMIN), c.getDashboardStats);
router.get("/dashboard/activity",  authenticate, authorize(...ADMIN), c.getDashboardActivity);

// ── Reports ───────────────────────────────────────────────────
router.get("/reports/students",    authenticate, authorize(...ADMIN), c.exportStudents);
router.get("/reports/faculty",     authenticate, authorize(...ADMIN), c.exportFaculty);
router.get("/reports/enrollments", authenticate, authorize(...ADMIN), c.exportEnrollments);

// ── User actions — static routes BEFORE /:id ─────────────────
router.post("/users/:userId/reset-password",
  authenticate, authorize(...ADMIN),
  auditLog("user", "UPDATE", { getRecordId: (req) => req.params.userId }),
  c.resetUserPassword
);
router.post("/users/:userId/impersonate",
  authenticate, authorize(...ADMIN),
  auditLog("auth", "LOGIN", { getRecordId: (req) => req.params.userId }),
  c.impersonateUser
);

// ── Admin CRUD ────────────────────────────────────────────────
router.get(   "/",                authenticate, authorize(...ADMIN), validate(listQuerySchema, "query"),                           c.listAdmins);
router.post(  "/",                authenticate, authorize(...SUPER), validate(createAdminSchema),        auditLog("admin","CREATE"), c.createAdmin);
router.get(   "/:id",             authenticate, authorize(...ADMIN), validate(idParamSchema, "params"),                            c.getAdminById);
router.patch( "/:id",             authenticate, authorize(...SUPER), validate(idParamSchema, "params"),  validate(updateAdminSchema), auditLog("admin","UPDATE"), c.updateAdmin);
router.patch( "/:id/permissions", authenticate, authorize(...SUPER), validate(idParamSchema, "params"),  auditLog("admin","UPDATE"), c.updatePermissions);
router.patch( "/:id/block",       authenticate, authorize(...SUPER), validate(idParamSchema, "params"),  auditLog("admin","UPDATE"), c.toggleBlock);
router.delete("/:id",             authenticate, superAdminOnly,      validate(idParamSchema, "params"),  auditLog("admin","DELETE"), c.deleteAdmin);

export default router;