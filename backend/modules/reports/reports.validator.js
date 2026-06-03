// backend/modules/reports/reports.validator.js
import { z } from "zod";

const optUuid = z.string().uuid().optional();

export const bySectionQuerySchema = z.object({
  section_id: optUuid,
});

export const byDeptQuerySchema = z.object({
  dept_id: optUuid,
});

export const enrollmentQuerySchema = z.object({
  academic_year: z.string().optional().transform((v) => (v === "" ? undefined : v)),
});

export const feedbackParamSchema = z.object({
  formId: z.string().uuid("Invalid form ID"),
});

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