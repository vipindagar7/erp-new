import { z } from "zod";

export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(source === "body" ? req.body : req.query);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }
  req.validatedData = result.data;
  next();
};

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().optional(),
});

// ── Department ──────────────────────────────────────────────────
export const deptListSchema = pagination;
export const createDeptSchema = z.object({ name: z.string().min(1, "Name required") });
export const updateDeptSchema = createDeptSchema.partial();

// ── Program ─────────────────────────────────────────────────────
export const programListSchema = pagination.extend({
  dept_id: z.string().uuid().optional(),
});
export const createProgramSchema = z.object({
  name: z.string().min(1, "Name required"),
  dept_id: z.string().uuid("Valid department required"),
});
export const updateProgramSchema = createProgramSchema.partial();

// ── Course ──────────────────────────────────────────────────────
export const courseListSchema = pagination.extend({
  program_id: z.string().uuid().optional(),
  dept_id: z.string().uuid().optional(),
});
export const createCourseSchema = z.object({
  name: z.string().min(1, "Name required"),
  program_id: z.string().uuid("Valid program required"),
});
export const updateCourseSchema = createCourseSchema.partial();

// ── Subject ─────────────────────────────────────────────────────
const SUBJECT_CATEGORIES = ["THEORY", "PRACTICAL", "TRAINING", "LIBRARY", "TUTORIAL", "OTHER"];
export const subjectListSchema = pagination.extend({
  category: z.enum(SUBJECT_CATEGORIES).optional(),
});
export const createSubjectSchema = z.object({
  name: z.string().min(1, "Name required"),
  code: z.string().min(1, "Code required"),
  nickname: z.string().optional(),
  category: z.enum(SUBJECT_CATEGORIES).default("THEORY"),
  credits: z.coerce.number().int().min(0).max(10).default(4),
});
export const updateSubjectSchema = createSubjectSchema.partial();

// ── Section ─────────────────────────────────────────────────────
// NOTE: the v3 section model uses branch_id (NOT course_id) — see
// section.service.js createSection()/getAllSections(). Keeping course_id
// here silently broke create AND made update() strip every field
// the edit/promote UI actually sends (academic_year, session_id,
// capacity, description, is_combined, code, batch_year, reason…)
// because Zod drops unknown keys by default.
export const sectionListSchema = pagination.extend({
  branch_id: z.string().uuid().optional(),
  program_id: z.string().uuid().optional(),
  dept_id: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  status: z.string().optional(), // "" / "all" returns all statuses
  batch: z.string().optional(),
  academic_year: z.string().optional(),
  session_id: z.string().uuid().optional(),
});
// Backwards compat — old routes still import sectionPaginationSchema
export const sectionPaginationSchema = sectionListSchema;

const SECTION_STATUSES = ["ACTIVE", "INACTIVE", "MERGED", "DISCONTINUED", "GRADUATED", "COMPLETED", "ARCHIVED", "ALUMNI", "SUSPENDED"];

export const createSectionSchema = z.object({
  name: z.string().min(1, "Name required"),
  branch_id: z.string().uuid("Valid branch required"),
  semester: z.coerce.number().int().min(1).max(12),
  batch: z.string().min(1, "Batch required"),
  academic_year: z.string().optional(),
  room_no: z.string().optional(),
  capacity: z.coerce.number().int().min(0).optional().nullable(),
  class_coordinator_id: z.string().uuid().optional().nullable(),
  is_combined: z.coerce.boolean().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(SECTION_STATUSES).optional(),
});

// Update schema is its own object (not createSectionSchema.partial()) so we
// can allow the extra fields the edit/promote/demote flows send that aren't
// part of section creation — code, session_id, batch_year, reason.
export const updateSectionSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  branch_id: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  batch: z.string().optional(),
  batch_year: z.coerce.number().int().optional().nullable(),
  academic_year: z.string().optional().nullable(),
  session_id: z.string().uuid().optional(), // picked from the session dropdown; backend resolves academic_year from it
  room_no: z.string().optional().nullable(),
  capacity: z.coerce.number().int().min(0).optional().nullable(),
  class_coordinator_id: z.string().uuid().optional().nullable(),
  is_combined: z.coerce.boolean().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(SECTION_STATUSES).optional(),
  reason: z.string().optional(),
});

// ── Section-Subject assignment ───────────────────────────────────
const SUBJECT_TYPES = ["REGULAR", "ELECTIVE", "COMBINED", "TRAINING", "OTHER"];
const SUBJECT_STATUSES = ["ACTIVE", "COMPLETED", "REMOVED"];

export const assignSubjectSchema = z.object({
  subject_id: z.string().uuid("Valid subject required"),
  faculty_id: z.string().uuid().optional().nullable(),
  type: z.enum(SUBJECT_TYPES).default("REGULAR"),
  status: z.enum(SUBJECT_STATUSES).default("ACTIVE"),
});

export const updateSectionSubjectSchema = z.object({
  faculty_id: z.string().uuid().optional().nullable(),
  type: z.enum(SUBJECT_TYPES).optional(),
  status: z.enum(SUBJECT_STATUSES).optional(),
});

export const bulkAssignSchema = z.object({
  assignments: z.array(z.object({
    subject_id: z.string().uuid(),
    faculty_id: z.string().uuid().optional().nullable(),
    type: z.enum(SUBJECT_TYPES).default("REGULAR"),
    status: z.enum(SUBJECT_STATUSES).default("ACTIVE"),
  })).min(1),
});

// ── Section promote / status / counts ───────────────────────────
// NOTE: these are exported as pre-applied middleware below but section.routes.js
// does NOT currently use validatePromote/validateMultiPromote — promote, demote,
// bulk-promote and bulk-demote all read straight from req.body in the controller,
// so to_session_id/reason are NOT at risk of being stripped there. Only the
// PATCH /:id (update) route runs through validate(updateSectionSchema).
const promoteSchema = z.object({
  reason: z.string().optional(),
  remarks: z.string().optional(),
  to_session_id: z.string().uuid().optional(),
  new_academic_year: z.string().optional(),
});

const multiPromoteSchema = z.object({
  section_ids: z.array(z.string().uuid()).min(1, "At least one section required"),
  reason: z.string().optional(),
  remarks: z.string().optional(),
  to_session_id: z.string().uuid().optional(),
});

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "DETAINED", "PASSED", "LEFT"]),
  remarks: z.string().optional(),
});

const countsSchema = z.object({
  section_ids: z.array(z.string().uuid()).min(1),
});

// Pre-applied middleware — use directly in router without calling validate()
// e.g.  router.post("/promote", validatePromote, c.promote)
export const validatePromote = validate(promoteSchema);
export const validateMultiPromote = validate(multiPromoteSchema);
export const validateStatus = validate(statusSchema);
export const validateCounts = validate(countsSchema);