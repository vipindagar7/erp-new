import { Router } from "express";
import { z }       from "zod";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as svc from "./groups.service.js";

const router = Router();
const ADMIN  = ["ADMIN","SUPER_ADMIN"];

const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return res.status(422).json({ success: false, message: "Validation failed", errors: r.error.errors });
  req.validatedData = r.data;
  next();
};

const ok   = (res, data, msg) => res.json({ success: true, message: msg, data });
const fail = (res, e, next)   => { if (e.status) return res.status(e.status).json({ success: false, message: e.message }); next(e); };

// ── Schemas ───────────────────────────────────────────────────
const groupSchema = z.object({
  name:        z.string().min(1, "Name required"),
  description: z.string().optional(),
  type:        z.enum(["EVENT","SCHOLARSHIP","COMMITTEE","SPORTS","OTHER"]).default("OTHER"),
});
const addByIdSchema = z.object({
  student_ids: z.array(z.string().uuid()).min(1),
  remarks:     z.string().optional(),
});
const addByEmailSchema = z.object({
  emails:  z.array(z.string().email()).min(1),
  remarks: z.string().optional(),
});
const addBySectionSchema = z.object({
  section_ids: z.array(z.string().uuid()).min(1),
  remarks:     z.string().optional(),
});
const removeSchema = z.object({
  student_ids: z.array(z.string().uuid()).min(1),
});
const fgSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  type:        z.enum(["DEPARTMENT","COMMITTEE","EVENT","OTHER"]).default("OTHER"),
});
const addFacultyByIdSchema = z.object({
  faculty_ids: z.array(z.string().uuid()).min(1),
  remarks:     z.string().optional(),
});
const addFacultyByEmailSchema = z.object({
  emails:  z.array(z.string().email()).min(1),
  remarks: z.string().optional(),
});
const removeFacultySchema = z.object({
  faculty_ids: z.array(z.string().uuid()).min(1),
});

// ══════════════════════════════════════════════════════════════
// FACULTY GROUPS — must be registered BEFORE /:id routes
// ══════════════════════════════════════════════════════════════
router.get("/faculty-groups", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { ok(res, await svc.getAllFacultyGroups(req.query)); }
  catch (e) { fail(res, e, next); }
});

router.get("/faculty-groups/:id", authenticate, async (req, res, next) => {
  try {
    const g = await svc.getFacultyGroupById(req.params.id);
    if (!g) return res.status(404).json({ success: false, message: "Faculty group not found" });
    ok(res, g);
  } catch (e) { fail(res, e, next); }
});

router.post("/faculty-groups", authenticate, authorize(...ADMIN), validate(fgSchema), async (req, res, next) => {
  try { ok(res, await svc.createFacultyGroup(req.validatedData, req.user.id), "Faculty group created"); }
  catch (e) { fail(res, e, next); }
});

router.patch("/faculty-groups/:id", authenticate, authorize(...ADMIN), validate(fgSchema.partial()), async (req, res, next) => {
  try { ok(res, await svc.updateFacultyGroup(req.params.id, req.validatedData), "Updated"); }
  catch (e) { fail(res, e, next); }
});

router.delete("/faculty-groups/:id", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { await svc.deleteFacultyGroup(req.params.id); ok(res, null, "Deleted"); }
  catch (e) { fail(res, e, next); }
});

router.post("/faculty-groups/:id/members/by-id", authenticate, authorize(...ADMIN), validate(addFacultyByIdSchema), async (req, res, next) => {
  try {
    const r = await svc.addFacultyById(req.params.id, req.validatedData.faculty_ids, req.validatedData.remarks);
    ok(res, r, `${r.added.length} added`);
  } catch (e) { fail(res, e, next); }
});

router.post("/faculty-groups/:id/members/by-email", authenticate, authorize(...ADMIN), validate(addFacultyByEmailSchema), async (req, res, next) => {
  try {
    const r = await svc.addFacultyByEmail(req.params.id, req.validatedData.emails, req.validatedData.remarks);
    ok(res, r, `${r.added.length} added`);
  } catch (e) { fail(res, e, next); }
});

router.delete("/faculty-groups/:id/members", authenticate, authorize(...ADMIN), validate(removeFacultySchema), async (req, res, next) => {
  try {
    const r = await svc.removeFacultyBulk(req.params.id, req.validatedData.faculty_ids);
    ok(res, r, `${r.removed} removed`);
  } catch (e) { fail(res, e, next); }
});

router.delete("/faculty-groups/:id/members/:faculty_id", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { await svc.removeFacultyFromGroup(req.params.id, req.params.faculty_id); ok(res, null, "Removed"); }
  catch (e) { fail(res, e, next); }
});

// ══════════════════════════════════════════════════════════════
// STUDENT GROUPS — /:id routes AFTER all static paths
// ══════════════════════════════════════════════════════════════
router.get("/", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { ok(res, await svc.getAllGroups(req.query)); }
  catch (e) { fail(res, e, next); }
});

router.post("/", authenticate, authorize(...ADMIN), validate(groupSchema), async (req, res, next) => {
  try { ok(res, await svc.createGroup(req.validatedData, req.user.id), "Group created"); }
  catch (e) { fail(res, e, next); }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const g = await svc.getGroupById(req.params.id);
    if (!g) return res.status(404).json({ success: false, message: "Group not found" });
    ok(res, g);
  } catch (e) { fail(res, e, next); }
});

router.patch("/:id", authenticate, authorize(...ADMIN), validate(groupSchema.partial()), async (req, res, next) => {
  try { ok(res, await svc.updateGroup(req.params.id, req.validatedData), "Updated"); }
  catch (e) { fail(res, e, next); }
});

router.delete("/:id", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { await svc.deleteGroup(req.params.id); ok(res, null, "Deleted"); }
  catch (e) { fail(res, e, next); }
});

router.post("/:id/members/by-id", authenticate, authorize(...ADMIN), validate(addByIdSchema), async (req, res, next) => {
  try {
    const r = await svc.addStudentsById(req.params.id, req.validatedData.student_ids, req.validatedData.remarks);
    ok(res, r, `${r.added.length} added, ${r.skipped.length} skipped, ${r.failed.length} failed`);
  } catch (e) { fail(res, e, next); }
});

router.post("/:id/members/by-email", authenticate, authorize(...ADMIN), validate(addByEmailSchema), async (req, res, next) => {
  try {
    const r = await svc.addStudentsByEmail(req.params.id, req.validatedData.emails, req.validatedData.remarks);
    ok(res, r, `${r.added.length} added, ${r.skipped.length} skipped, ${r.not_found.length} not found`);
  } catch (e) { fail(res, e, next); }
});

router.post("/:id/members/by-section", authenticate, authorize(...ADMIN), validate(addBySectionSchema), async (req, res, next) => {
  try {
    const r = await svc.addStudentsBySection(req.params.id, req.validatedData.section_ids, req.validatedData.remarks);
    ok(res, r, `${r.added.length} added, ${r.skipped.length} already in group`);
  } catch (e) { fail(res, e, next); }
});

router.delete("/:id/members", authenticate, authorize(...ADMIN), validate(removeSchema), async (req, res, next) => {
  try {
    const r = await svc.removeStudentsFromGroup(req.params.id, req.validatedData.student_ids);
    ok(res, r, `${r.removed} student(s) removed`);
  } catch (e) { fail(res, e, next); }
});

router.delete("/:id/members/:student_id", authenticate, authorize(...ADMIN), async (req, res, next) => {
  try { await svc.removeStudentFromGroup(req.params.id, req.params.student_id); ok(res, null, "Removed"); }
  catch (e) { fail(res, e, next); }
});

export default router;