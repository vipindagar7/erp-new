// backend/modules/reports/reports.routes.js
import { Router } from "express";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as c from "./reports.controller.js";

const router = Router();
router.use(authenticate);

// ── Catalog ───────────────────────────────────────────────────
router.get("/catalog", c.getCatalog);

// ── Generic dispatcher ────────────────────────────────────────
router.get( "/generate/:report_id", requirePerm("reports:view"), c.generate);
router.post("/generate/:report_id", requirePerm("reports:view"), c.generate);

// ── Legacy explicit endpoints ─────────────────────────────────
router.get("/students",              requirePerm("reports:view"), c.studentsAll);
router.get("/students/by-section",   requirePerm("reports:view"), c.studentsBySection);
router.get("/students/by-dept",      requirePerm("reports:view"), c.studentsByDept);
router.get("/faculty",               requirePerm("reports:view"), c.facultyAll);
router.get("/faculty/workload",      requirePerm("reports:view"), c.facultyWorkload);
router.get("/sections",              requirePerm("reports:view"), c.sectionsAll);
router.get("/sections/subjects",     requirePerm("reports:view"), c.sectionSubjects);
router.get("/enrollments",           requirePerm("reports:view"), c.enrollments);

export default router;