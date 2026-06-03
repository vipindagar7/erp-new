// backend/modules/admin/admin.validator.js
import { z } from "zod";

export const ALL_PERMISSIONS = [
  "manage_students",
  "manage_faculty",
  "manage_departments",
  "manage_sections",
  "manage_subjects",
  "manage_feedback",
  "manage_admins",
  "manage_reports",
  "manage_settings",
];

const optStr = z.string().optional().transform((v) => (v === "" ? undefined : v));

export const createAdminSchema = z.object({
  name:        z.string().min(1, "Name is required"),
  email:       z.string().email("Invalid email"),
  password:    z.string().min(6, "Password must be at least 6 characters"),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).optional().default([]),
});

export const updateAdminSchema = z.object({
  name:        optStr,
  permissions: z.array(z.enum(ALL_PERMISSIONS)).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID"),
});

export const listQuerySchema = z.object({
  page:   z.string().optional().transform((v) => (v ? parseInt(v) : 1)).pipe(z.number().min(1)),
  limit:  z.string().optional().transform((v) => (v ? parseInt(v) : 20)).pipe(z.number().min(1).max(100)),
  search: z.string().optional(),
});

export const activityQuerySchema = z.object({
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)).pipe(z.number().min(1).max(100)),
});

/**
 * validate(schema, source)
 * Attaches parsed result to req.validated (safe for req.query which is read-only in Express).
 * Also writes back to req.body / req.params for existing controller code that reads those directly.
 */
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({ message: "Validation error", errors: result.error.flatten() });
  }
  if (source === "query") {
    req.validated = { ...(req.validated ?? {}), ...result.data };
  } else {
    Object.assign(req[source], result.data);
    req.validated = { ...(req.validated ?? {}), ...result.data };
  }
  next();
};