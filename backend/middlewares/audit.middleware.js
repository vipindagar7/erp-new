import prisma from "../utils/prisma.js";

// ── Fields to NEVER store in audit logs (sensitive data) ──────
const REDACT = new Set(["passwordHash", "password", "token", "secret", "otp", "pin"]);

const redact = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = REDACT.has(k) ? "[REDACTED]" : (typeof v === "object" && v !== null && !Array.isArray(v) ? redact(v) : v);
  }
  return out;
};

// Fields that change often and are low-value — skip from changed_fields list
const SKIP_DIFF = new Set(["updatedAt", "createdAt"]);

const diffFields = (prev, next) => {
  if (!prev || !next) return [];
  return Object.keys({ ...prev, ...next }).filter(
    (k) => !SKIP_DIFF.has(k) && JSON.stringify(prev[k]) !== JSON.stringify(next[k])
  );
};

// Modules where updates are reversible (we store enough to restore)
const REVERSIBLE_MODULES = new Set([
  "student", "faculty", "section", "subject", "course", "program", "department",
  "feedback_form", "feedback_category", "feedback_question", "curriculum", "enrollment",
  "section_subject",
]);

// ── Core log function — call directly from services ───────────
export const createAuditLog = async ({
  user_id, user_email, user_role,
  action, module, record_id, record_label,
  prev_data, new_data, ip, user_agent,
}) => {
  try {
    const changed = diffFields(prev_data, new_data);
    await prisma.auditLog.create({
      data: {
        user_id:       user_id   || null,
        user_email:    user_email || null,
        user_role:     user_role  || null,
        action,
        module,
        record_id:     record_id    || null,
        record_label:  record_label || null,
        prev_data:     prev_data ? redact(prev_data) : null,
        new_data:      new_data  ? redact(new_data)  : null,
        changed_fields: changed,
        ip,
        user_agent,
        reversible: REVERSIBLE_MODULES.has(module) && !!prev_data,
      },
    });
  } catch (e) {
    // Audit logging must never crash the app
    console.error("[audit] Failed to write audit log:", e.message);
  }
};

// ── Express middleware — wraps a route and auto-logs ──────────
// Usage: router.patch("/:id", authenticate, auditLog("section", "UPDATE"), c.update)
export const auditLog = (module, action, opts = {}) => async (req, res, next) => {
  // Capture prev state before the handler runs (for UPDATE/DELETE)
  let prev_data = null;
  if ((action === "UPDATE" || action === "DELETE") && opts.getPrev) {
    try { prev_data = await opts.getPrev(req); } catch {}
  }

  // Intercept res.json to capture the response
  const origJson = res.json.bind(res);
  res.json = function (body) {
    if (body?.success !== false) {
      const record = body?.data;
      const record_id    = opts.getRecordId?.(req, record) ?? req.params.id ?? req.params[opts.idParam || "id"] ?? record?.id;
      const record_label = opts.getLabel?.(req, record) ?? record?.name ?? record?.title ?? record?.email ?? null;
      const new_data     = action === "DELETE" ? null : (record ? redact(record) : null);

      createAuditLog({
        user_id:    req.user?.id,
        user_email: req.user?.email,
        user_role:  req.user?.role,
        action,
        module,
        record_id,
        record_label,
        prev_data:  prev_data ? redact(prev_data) : null,
        new_data,
        ip:         req.ip || req.connection?.remoteAddress,
        user_agent: req.get("user-agent"),
      });
    }
    return origJson(body);
  };
  next();
};

// ── Delete guard — blocks non-super-admins ────────────────────
export const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only Super Admins can delete records. Contact your system administrator.",
    });
  }
  next();
};

// ── Bulk audit helper — for bulk operations ────────────────────
export const bulkAuditLog = async ({ user, action, module, records, ip, user_agent }) => {
  if (!records?.length) return;
  const logs = records.map((r) => ({
    user_id:       user?.id    || null,
    user_email:    user?.email || null,
    user_role:     user?.role  || null,
    action,
    module,
    record_id:     r.id    || null,
    record_label:  r.label || r.name || r.title || null,
    prev_data:     r.prev ? redact(r.prev) : null,
    new_data:      r.next ? redact(r.next) : null,
    changed_fields: diffFields(r.prev, r.next),
    ip:            ip         || null,
    user_agent:    user_agent || null,
    reversible:    REVERSIBLE_MODULES.has(module) && !!r.prev,
    createdAt:     new Date(),
  }));
  try {
    await prisma.auditLog.createMany({ data: logs, skipDuplicates: true });
  } catch (e) {
    console.error("[audit] bulkAuditLog failed:", e.message);
  }
};
