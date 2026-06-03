import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: "Department name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  hod_id: z
    .string()
    .uuid("hod_id must be a valid UUID")
    .optional()
    .nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim()
    .optional(),
  hod_id: z
    .string()
    .uuid("hod_id must be a valid UUID")
    .optional()
    .nullable(),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be a positive number"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  search: z.string().trim().optional(),
});

/**
 * Middleware factory
 * @param {ZodSchema} schema
 * @param {"body" | "query"} source - which part of req to validate
 */
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(source === "query" ? req.query : req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.validatedData = result.data;
  next();
};
