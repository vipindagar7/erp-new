// backend/modules/student/enrollment.validator.js
import { z } from "zod";

const uuidField = z.string().uuid();
const optUuid = z.string().uuid().optional().or(z.literal("").transform(() => undefined));
const optInt = z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional();
const optStr = z.string().optional().transform((v) => (v === "" ? undefined : v));

export const studentIdParamSchema = z.object({
  id: uuidField,
});

export const enrollmentParamSchema = z.object({
  id: uuidField,
  enrollId: uuidField,
});

const enrollmentBaseSchema = z.object({
  section_id: optUuid,
  course_id: optUuid,
  program_id: optUuid,
  dept_id: optUuid,
  academic_year: optStr,
  semester: optInt,
  batch_year: optInt,
  status: z
    .enum(["ACTIVE", "INACTIVE", "DROPPED", "GRADUATED", "SUSPENDED"])
    .optional()
    .default("ACTIVE"),
  remarks: optStr,
  is_current: z.boolean().optional().default(false),
});

export const addEnrollmentSchema = enrollmentBaseSchema;
export const updateEnrollmentSchema = enrollmentBaseSchema.partial();

export const validate = (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten(),
      });
    }
    // req.query is read-only in Express — use req.validated.
    // req.params and req.body are writable — update them directly
    // so controllers reading req.params.formId / req.body.x work as-is.
    if (source === "query") {
      req.validated = { ...(req.validated ?? {}), ...result.data };
    } else {
      Object.assign(req[source], result.data);
      req.validated = { ...(req.validated ?? {}), ...result.data };
    }
    next();
  };