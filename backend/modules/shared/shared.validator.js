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
export const sectionListSchema = pagination.extend({
  course_id: z.string().uuid().optional(),
  program_id: z.string().uuid().optional(),
  dept_id: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  status: z.string().optional(), // "all" returns all statuses
});
// Backwards compat — old routes still import sectionPaginationSchema
export const sectionPaginationSchema = sectionListSchema;

const SECTION_STATUSES = ["ACTIVE", "COMPLETED", "ARCHIVED", "ALUMNI", "SUSPENDED"];
export const createSectionSchema = z.object({
  name: z.string().min(1, "Name required"),
  course_id: z.string().uuid("Valid course required"),
  semester: z.coerce.number().int().min(1).max(8),
  batch: z.string().min(1, "Batch required"),
  room_no: z.string().optional(),
  class_coordinator_id: z.string().uuid().optional().nullable(),
  status: z.enum(SECTION_STATUSES).optional(),
});
export const updateSectionSchema = createSectionSchema.partial();

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
const promoteSchema = z.object({
  remarks: z.string().optional(),
});

const multiPromoteSchema = z.object({
  section_ids: z.array(z.string().uuid()).min(1, "At least one section required"),
  remarks: z.string().optional(),
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