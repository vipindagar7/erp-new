// backend/modules/settings/settings.validator.js
import { z } from "zod";

const optStr = z.string().optional().transform((v) => (v === "" ? undefined : v));
const optDate = z.string().optional().transform((v) => (v ? new Date(v) : undefined));

export const updateStudentSchema = z.object({
  first_name: optStr,
  last_name: optStr,
  phone: optStr,
  address: optStr,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: optDate,
});

export const updateFacultySchema = z.object({
  name: optStr,
  phone: optStr,
  designation: optStr,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: optDate,
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