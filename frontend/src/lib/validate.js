// backend/utils/validate.js
// Always returns both "message" AND "errors" so the frontend can
// read .data.message for a summary AND .data.errors for field detail.
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    // Build a readable summary: "Name: Required. Email: Invalid email."
    const summary = Object.entries(fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs[0]}`)
      .join(" · ");

    return res.status(400).json({
      success: false,
      message: summary || "Validation failed",
      errors:  fieldErrors,   // { field: [messages] }
    });
  }
  req.validatedData = result.data;
  if (source === "body") req.body = result.data;
  next();
};
