// src/lib/extractError.js
// Extracts a human-readable error message + optional field errors
// from ANY error shape the backend or axios can throw.
//
// Backend shapes handled:
//   { message: "...", errors: { field: ["msg"] } }  ← validate.js (new)
//   { message: "...", errors: [{ field, message }] } ← department_validator.js
//   { message: "..." }                               ← service throws
//   { error: "..." }                                 ← some legacy routes
//   Axios network error (no response)
//   Redux thunk rejected payload (string)
//
// Returns: { message: string, fields: { [field]: string } | null }

export const extractError = (err) => {
  // ── Redux payload (string or object) ─────────────────────────
  if (typeof err === "string") return { message: err, fields: null };

  const data = err?.response?.data;

  if (!data) {
    // Network error / no response
    if (err?.message) return { message: err.message, fields: null };
    return { message: "Something went wrong", fields: null };
  }

  // ── Field errors as object { field: [msgs] } (validate.js) ───
  const fieldObj = data.errors && !Array.isArray(data.errors) ? data.errors : null;
  const fields   = fieldObj
    ? Object.fromEntries(
        Object.entries(fieldObj).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      )
    : null;

  // ── Field errors as array [{ field, message }] ────────────────
  const fieldArr = data.errors && Array.isArray(data.errors) ? data.errors : null;
  const fieldsFromArr = fieldArr
    ? Object.fromEntries(fieldArr.map((e) => [e.field, e.message]))
    : null;

  const allFields = fields || fieldsFromArr;

  // ── Summary message ───────────────────────────────────────────
  const message =
    data.message ||
    data.error   ||
    (allFields
      ? Object.entries(allFields).map(([k, v]) => `${k}: ${v}`).join(" · ")
      : "Something went wrong");

  return { message, fields: allFields };
};

// Convenience: just the message string
export const extractErrorMessage = (err) => extractError(err).message;
