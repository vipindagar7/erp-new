import { z } from "zod";

// ── Validate middleware ────────────────────────────────────────
// target: "body" (default) | "params" | "query"
export const validate = (schema, target = "body") => (req, res, next) => {
  const source = target === "params" ? req.params : target === "query" ? req.query : req.body;
  const result = schema.safeParse(source);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  // Merge validated data back so controllers can read it
  if (target === "body") req.validatedData = { ...(req.validatedData || {}), ...result.data };
  if (target === "params") req.params = { ...req.params, ...result.data };
  if (target === "query") req.query = { ...req.query, ...result.data };
  next();
};

// ── Param schemas ──────────────────────────────────────────────
export const formIdParamSchema = z.object({
  formId: z.string().uuid("Invalid form ID"),
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid("Invalid category ID"),
});

export const questionIdParamSchema = z.object({
  id: z.string().uuid("Invalid question ID"),
});

// ── Category schemas ───────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name required"),
  type: z.enum(["TEACHING", "GENERAL", "EVENT","GROUP", "CUSTOM"]),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.enum(["TEACHING", "GENERAL", "EVENT","GROUP", "CUSTOM"]).optional(),
  description: z.string().optional(),
});

// ── Question schemas ───────────────────────────────────────────
export const createQuestionSchema = z.object({
  category_id: z.string().uuid("Category ID required"),
  question: z.string().trim().min(1, "Question text required"),
  type: z.enum(["RATING", "TEXT", "MCQ"]),
  options: z.array(z.string()).optional().default([]),
  is_required: z.boolean().default(true),
  order: z.number().int().default(0),
});

export const updateQuestionSchema = z.object({
  question: z.string().trim().min(1).optional(),
  type: z.enum(["RATING", "TEXT", "MCQ"]).optional(),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
  order: z.number().int().optional(),
});

// ── Form schemas ───────────────────────────────────────────────
export const createFormSchema = z.object({
  // Multi-type creation (new)
  form_type: z.string().optional(),
  section_ids: z.array(z.string().uuid()).optional(),
  group_id: z.string().uuid().optional(),
  question_ids: z.array(z.string().uuid()).optional(),
  // Core fields
  title: z.string().trim().min(1, "Title required"),
  category_id: z.string().uuid("Category ID required"),
  start_date: z.string().min(1, "Start date required"),
  end_date: z.string().min(1, "End date required"),
  is_active: z.boolean().default(true),
  // Legacy single-form targeting
  section_id: z.string().uuid().optional(),
  faculty_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  action_taken: z.string().optional(),
});

export const updateFormSchema = z.object({
  title: z.string().trim().min(1).optional(),
  category_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().optional(),
  section_id: z.string().uuid().optional().nullable(),
  faculty_id: z.string().uuid().optional().nullable(),
  subject_id: z.string().uuid().optional().nullable(),
  group_id: z.string().uuid().optional().nullable(),
  specialGroupId: z.string().uuid().optional().nullable(),
  action_taken: z.string().optional().nullable(),
});

// ── Submit schema ──────────────────────────────────────────────
export const submitFormSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    answer_text: z.string().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    selected: z.string().optional(),
  })).min(1, "At least one answer required"),
});