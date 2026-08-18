// src/hooks/notify.js
// Enhanced notify — wraps sonner toast with smart error extraction.
// Handles strings, Error objects, and axios error responses.
//
// Usage (unchanged API — drop-in replacement):
//   notify.success("Student created")
//   notify.error(err)                  // ← pass the raw error directly
//   notify.error("Something failed")   // ← or a string as before
//   notify.apiError(err)               // ← shows field errors as description
import { toast } from "sonner";
import { extractError } from "../lib/extractError.js";

// ── Internal: extract and show ────────────────────────────────
const showError = (errOrMsg, opts = {}) => {
  if (typeof errOrMsg === "string") {
    toast.error(errOrMsg, opts);
    return;
  }

  const { message, fields } = extractError(errOrMsg);

  // Build description from field errors if present
  const description = fields
    ? Object.entries(fields)
        .map(([k, v]) => `• ${k}: ${v}`)
        .join("\n")
    : undefined;

  toast.error(message, {
    description,
    duration: description ? 6000 : 4000,   // longer when there are field details
    ...opts,
  });
};

export const notify = {
  success: (msg, opts)     => toast.success(msg, opts),
  error:   (errOrMsg, opts) => showError(errOrMsg, opts),
  info:    (msg, opts)     => toast.info(msg, opts),
  warning: (msg, opts)     => toast.warning(msg, opts),
  loading: (msg, opts)     => toast.loading(msg, opts),
  dismiss: (id)            => toast.dismiss(id),

  // Explicit API error — always extracts, always shows field detail
  apiError: (err, fallback = "Something went wrong") => {
    if (!err) { toast.error(fallback); return; }
    showError(err);
  },

  // Promise toast — shows loading → success/error automatically
  promise: (promise, { loading, success, error }) =>
    toast.promise(promise, { loading, success, error }),
};