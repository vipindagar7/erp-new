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

const opt = (v) => (v && v.trim() !== "" ? v.trim() : undefined);

export const facultyListSchema = z.object({
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(200).default(20),
  search:      z.string().optional(),
  dept_id:     z.string().uuid().optional(),
  designation: z.string().optional(),
  isBlocked:   z.preprocess((v) => v === "true" ? true : v === "false" ? false : v, z.boolean().optional()),
});

export const createFacultySchema = z.object({
  // Account
  email:    z.string().trim().email("Valid email required"),
  password: z.string().min(6).default("Faculty@123"),
  // Profile
  name:        z.string().trim().min(1, "Name required"),
  emp_id:      z.string().trim().optional(),
  designation: z.string().trim().optional(),
  phone:       z.string().trim().optional(),
  dept_id:     z.string().uuid().optional().nullable(),
  gender:      z.enum(["MALE","FEMALE","OTHER"]).optional().nullable(),
  joining_date:z.string().optional().transform((v) => v ? new Date(v) : undefined),
  // Subjects to assign
  subject_ids: z.array(z.string().uuid()).default([]),
});

export const updateFacultySchema = createFacultySchema
  .omit({ email: true, password: true })
  .partial();

export const blockSchema = z.object({ isBlocked: z.boolean() });

export const assignSubjectsSchema = z.object({
  subject_ids: z.array(z.string().uuid()).min(1, "At least one subject required"),
});
