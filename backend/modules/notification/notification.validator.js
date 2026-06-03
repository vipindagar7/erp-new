// backend/modules/notification/notification.validator.js
import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)).pipe(z.number().min(1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)).pipe(z.number().min(1).max(100)),
  unread: z.enum(["true", "false"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid notification ID"),
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