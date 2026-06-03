// ─────────────────────────────────────────────────────────────
// Mount in index.js as:
//   app.use("/api/students/enrollments", enrollmentRoutes);
//
// All routes:
//   GET    /api/students/enrollments              — paginated list (admin)
//   GET    /api/students/enrollments/template     — xlsx template
//   GET    /api/students/enrollments/export       — xlsx export
//   GET    /api/students/enrollments/by-student   — history for one student (?student_id=)
//   POST   /api/students/enrollments              — create (student_id in body)
//   POST   /api/students/enrollments/bulk-upload  — bulk create from xlsx
//   PATCH  /api/students/enrollments/bulk-status  — bulk status
//   DELETE /api/students/enrollments/bulk-delete  — bulk delete
//   PATCH  /api/students/enrollments/:id          — edit one
//   DELETE /api/students/enrollments/:id          — delete one
//   PATCH  /api/students/enrollments/:id/set-current
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as svc from "./enrollment.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ADMIN = ["ADMIN", "SUPER_ADMIN"];

// ── Validators ────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return res.status(422).json({
    success: false, message: "Validation failed",
    errors: r.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
  });
  req.validatedData = r.data;
  next();
};

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  student_id: z.string().uuid().optional(),
  section_id: z.string().uuid().optional(),
  dept_id: z.string().uuid().optional(),
  status: z.string().optional(),
  semester: z.coerce.number().int().optional(),
  academic_year: z.string().optional(),
  is_current: z.preprocess(
    (v) => v === "true" ? true : v === "false" ? false : undefined,
    z.boolean().optional()
  ),
});

const createSchema = z.object({
  student_id: z.string().uuid("Student ID required"),
  academic_year: z.string().min(1, "Academic year required"),
  semester: z.coerce.number().int().min(1).max(8),
  batch_year: z.coerce.number().int().default(0),
  status: z.enum(["ACTIVE", "DETAINED", "PASSED", "LEFT", "TRANSFERRED", "PROMOTED"]).default("ACTIVE"),
  is_current: z.boolean().default(false),
  section_id: z.string().uuid().optional(),
  remarks: z.string().optional(),
  enrolled_at: z.string().optional(),
});

const updateSchema = createSchema.omit({ student_id: true }).partial();

const bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(["ACTIVE", "DETAINED", "PASSED", "LEFT", "TRANSFERRED", "PROMOTED"]),
  remarks: z.string().optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

// ── Helpers ───────────────────────────────────────────────────
const ok = (res, data, msg) => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => {
  if (e.status) return res.status(e.status).json({ success: false, message: e.message });
  next(e);
};
const sendXlsx = (res, buf, name) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${name}`);
  return res.send(buf);
};

// ══════════════════════════════════════════════════════════════
// STATIC ROUTES — must come before /:id
// ══════════════════════════════════════════════════════════════

// GET /api/students/enrollments?page=&limit=&search=&section_id=&status=&semester=...
router.get("/", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try {
    const p = listSchema.safeParse(req.query);
    if (!p.success) return res.status(422).json({ success: false, message: "Invalid query params" });
    ok(res, await svc.getAllEnrollments(p.data));
  } catch (e) { fail(res, e, next); }
});

// GET /api/students/enrollments/template
router.get("/template", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { sendXlsx(res, await svc.generateTemplate(), "enrollment_template.xlsx"); }
  catch (e) { next(e); }
});

// GET /api/students/enrollments/export
router.get("/export", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { sendXlsx(res, await svc.exportEnrollments(req.query), "enrollments_export.xlsx"); }
  catch (e) { next(e); }
});

// GET /api/students/enrollments/by-student?student_id=xxx
router.get("/by-student", authenticate, async (req, res, next) => {
  try {
    const { student_id } = req.query;
    if (!student_id) return res.status(422).json({ success: false, message: "student_id required" });
    ok(res, await svc.getStudentEnrollments(student_id));
  } catch (e) { fail(res, e, next); }
});

// POST /api/students/enrollments/bulk-upload
router.post("/bulk-upload", authenticate, authorize(...ADMIN), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const r = await svc.bulkCreateEnrollments(req.file.buffer);
    ok(res, r, `${r.created.length} created, ${r.skipped.length} skipped, ${r.failed.length} failed`);
  } catch (e) { next(e); }
});

// PATCH /api/students/enrollments/bulk-status
router.patch("/bulk-status", authenticate, authorize(...ADMIN), validate(bulkStatusSchema), async (req, res, next) => {
  try {
    const { ids, status, remarks } = req.validatedData;
    ok(res, await svc.bulkUpdateStatus(ids, status, remarks), `${ids.length} enrollment(s) updated`);
  } catch (e) { fail(res, e, next); }
});

// DELETE /api/students/enrollments/bulk-delete
router.delete("/bulk-delete", authenticate, authorize(...ADMIN), validate(bulkDeleteSchema), async (req, res, next) => {
  try {
    ok(res, await svc.bulkDeleteEnrollments(req.validatedData.ids), "Enrollments deleted");
  } catch (e) { fail(res, e, next); }
});

// POST /api/students/enrollments  (student_id in body)
router.post("/", authenticate, authorize(...ADMIN), validate(createSchema), async (req, res, next) => {
  try {
    const { student_id, ...data } = req.validatedData;
    ok(res, await svc.createEnrollment(student_id, data), "Enrollment created");
  } catch (e) { fail(res, e, next); }
});

// ══════════════════════════════════════════════════════════════
// DYNAMIC ROUTES — /:id
// ══════════════════════════════════════════════════════════════

// PATCH /api/students/enrollments/:id/set-current  (must be before /:id)
router.patch("/:id/set-current", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { ok(res, await svc.setCurrentEnrollment(req.params.id), "Set as current enrollment"); }
  catch (e) { fail(res, e, next); }
});

// PATCH /api/students/enrollments/:id
router.patch("/:id", authenticate, authorize(...ADMIN), validate(updateSchema), async (req, res, next) => {
  try { ok(res, await svc.updateEnrollment(req.params.id, req.validatedData), "Updated"); }
  catch (e) { fail(res, e, next); }
});

// DELETE /api/students/enrollments/:id
router.delete("/:id", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { await svc.deleteEnrollment(req.params.id); ok(res, null, "Deleted"); }
  catch (e) { fail(res, e, next); }
});

export default router;