import prisma from "../utils/prisma.js";

// ── Sensitive fields never stored in audit ────────────────────
const REDACT_FIELDS = new Set([
  "passwordHash", "password", "confirmPassword", "token", "secret",
  "otp", "pin", "salary_encrypted", "bank_account_encrypted",
  "refresh_token_hash", "otp_hash",
]);

// ── Modules where DELETE is reversible ───────────────────────
const REVERSIBLE_MODULES = new Set([
  "student", "faculty", "section", "department", "program",
  "course", "subject", "curriculum", "admin",
]);

// ── Redact sensitive keys from object ────────────────────────
const redact = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = REDACT_FIELDS.has(k) ? "[REDACTED]" : v;
  }
  return clean;
};

// ── Diff two objects → changed field names ────────────────────
const diffFields = (prev, next) => {
  if (!prev || !next) return [];
  return Object.keys(next).filter((k) => {
    if (REDACT_FIELDS.has(k)) return false;
    return JSON.stringify(prev[k]) !== JSON.stringify(next[k]);
  });
};

// ── Core log function ─────────────────────────────────────────
export const createAuditLog = async ({
  user_id, user_email, user_role,
  action, module, record_id, record_label,
  prev_data, new_data,
  ip, user_agent, device_type, browser, os,
}) => {
  try {
    const changed_fields = diffFields(prev_data, new_data);
    const reversible = action === "DELETE" && REVERSIBLE_MODULES.has(module);

    await prisma.auditLog.create({
      data: {
        user_id: user_id || null,
        user_email: user_email || null,
        user_role: user_role || null,
        action, module,
        record_id: record_id || null,
        record_label: record_label || null,
        prev_data: prev_data ? redact(prev_data) : null,
        new_data: new_data ? redact(new_data) : null,
        changed_fields,
        ip: ip || null,
        user_agent: user_agent || null,
        device_type: device_type || null,
        browser: browser || null,
        os: os || null,
        reversible,
      },
    });
  } catch (err) {
    console.error("[AUDIT] Failed to write audit log:", err.message);
  }
};

// ── Extract device info from req ──────────────────────────────
const getDeviceInfo = (req) => ({
  ip: req.ip || req.connection?.remoteAddress,
  user_agent: req.headers["user-agent"],
  device_type: /mobile/i.test(req.headers["user-agent"]) ? "mobile" : "desktop",
  browser: parseBrowser(req.headers["user-agent"]),
  os: parseOs(req.headers["user-agent"]),
});

const parseBrowser = (ua = "") => {
  if (!ua) return null;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Unknown";
};

const parseOs = (ua = "") => {
  if (!ua) return null;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS")) return "iOS";
  return "Unknown";
};

// ── Express middleware wrapper ────────────────────────────────
// Usage: router.post("/", authenticate, requirePerm("student:create"), auditLog("student","CREATE"), c.create)
// opts.getPrev: async (req) => prisma.student.findUnique({where:{id:req.params.id}})
export const auditLog = (module, action, opts = {}) => {
  return (req, res, next) => {
    // Patch res.json to capture response after handler runs
    const origJson = res.json.bind(res);
    res.json = async (body) => {
      res.json = origJson;

      if (body?.success !== false && req.user) {
        try {
          const device = getDeviceInfo(req);
          let prev_data = null;
          let new_data = body?.data || null;
          let record_id = req.params?.id || body?.data?.id || null;
          let record_label = body?.data?.name || body?.data?.email || body?.data?.title || null;

          // Fetch previous state for UPDATE/DELETE
          if (opts.getPrev && (action === "UPDATE" || action === "DELETE" || action === "BLOCK")) {
            try { prev_data = await opts.getPrev(req); } catch { }
          }

          await createAuditLog({
            user_id: req.user.id,
            user_email: req.user.email,
            user_role: req.user.role,
            action, module,
            record_id, record_label,
            prev_data, new_data,
            ...device,
          });
        } catch (err) {
          console.error("[AUDIT MW] Error:", err.message);
        }
      }

      return origJson(body);
    };
    next();
  };
};

// ── Bulk audit log ────────────────────────────────────────────
export const bulkAuditLog = async ({ user, action, module, records, ip, user_agent }) => {
  const device = { ip, user_agent, device_type: null, browser: parseBrowser(user_agent), os: parseOs(user_agent) };
  await Promise.all(records.map((r) =>
    createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action, module,
      record_id: r.id,
      record_label: r.name || r.email || r.title,
      ...device,
    })
  ));
};

// ── Auth event logger (call from auth.service.js) ─────────────
export const logAuthEvent = async (action, { user_id, email, role, ip, user_agent, fail_reason }) => {
  await createAuditLog({
    user_id, user_email: email, user_role: role,
    action, module: "auth",
    record_id: user_id,
    record_label: email,
    new_data: fail_reason ? { fail_reason } : null,
    ip, user_agent,
    device_type: /mobile/i.test(user_agent || "") ? "mobile" : "desktop",
    browser: parseBrowser(user_agent),
    os: parseOs(user_agent),
  });
};

// ── Failed permission logger ──────────────────────────────────
// Add to auth.middleware.js requirePerm() on failure
export const logPermissionDenied = async (req, permission) => {
  if (!req.user) return;
  const device = getDeviceInfo(req);
  await createAuditLog({
    user_id: req.user.id,
    user_email: req.user.email,
    user_role: req.user.role,
    action: "PERMISSION_DENIED",
    module: "auth",
    record_label: permission,
    new_data: { permission, path: req.originalUrl, method: req.method },
    ...device,
  });
};

// ── Search/Export logger ──────────────────────────────────────
// Call manually in controllers where you want search/export tracked
export const logSearchEvent = async (req, module, query) => {
  if (!req.user) return;
  const device = getDeviceInfo(req);
  await createAuditLog({
    user_id: req.user.id,
    user_email: req.user.email,
    user_role: req.user.role,
    action: "SEARCH",
    module,
    new_data: { query },
    ...device,
  });
};

export const logExportEvent = async (req, module, filters) => {
  if (!req.user) return;
  const device = getDeviceInfo(req);
  await createAuditLog({
    user_id: req.user.id,
    user_email: req.user.email,
    user_role: req.user.role,
    action: "EXPORT",
    module,
    new_data: { filters },
    ...device,
  });
};