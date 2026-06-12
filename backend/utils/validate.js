// backend/utils/validate.js
// ─────────────────────────────────────────────────────────────
// Zod-based request validation middleware.
// Usage: validate(schema)          → validates req.body
//        validate(schema, "query") → validates req.query
//        validate(schema, "params")→ validates req.params
//
// On success: attaches result to req.validatedData
// On failure: returns 400 with structured Zod error
// ─────────────────────────────────────────────────────────────

export const validate = (schema, source = "body") => (req, res, next) => {
  if (!schema) return next(); // no schema = no validation

  const result = schema.safeParse(req[source]);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: result.error.flatten().fieldErrors,
    });
  }

  // Attach parsed data — safe even for read-only req.query
  req.validatedData = { ...(req.validatedData ?? {}), ...result.data };

  // Also write back to req.body so existing controllers that read req.body still work
  if (source === "body") {
    Object.assign(req.body, result.data);
  }

  next();
};
