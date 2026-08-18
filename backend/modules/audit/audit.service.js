// backend/modules/audit/audit.service.js
import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";

// ─────────────────────────────────────────────────────────────
// SENSITIVE FIELDS — never stored in audit logs
// ─────────────────────────────────────────────────────────────
const REDACT_FIELDS = new Set([
  "passwordHash", "password", "confirmPassword", "token", "secret",
  "otp", "pin", "salary_encrypted", "bank_account_encrypted",
  "refresh_token_hash", "otp_hash",
]);

// ─────────────────────────────────────────────────────────────
// REVERSIBLE MODULES (DELETE can be rolled back)
// ─────────────────────────────────────────────────────────────
const REVERSIBLE_MODULES = new Set([
  "student", "faculty", "section", "department", "program",
  "course", "subject", "curriculum", "admin",
]);

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const redact = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj))
    clean[k] = REDACT_FIELDS.has(k) ? "[REDACTED]" : v;
  return clean;
};

const diffFields = (prev, next) => {
  if (!prev || !next) return [];
  return Object.keys(next).filter(k =>
    !REDACT_FIELDS.has(k) &&
    JSON.stringify(prev[k]) !== JSON.stringify(next[k])
  );
};

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

const getDeviceInfo = (req) => ({
  ip: req.ip || req.connection?.remoteAddress,
  user_agent: req.headers?.["user-agent"],
  device_type: /mobile/i.test(req.headers?.["user-agent"] || "") ? "mobile" : "desktop",
  browser: parseBrowser(req.headers?.["user-agent"]),
  os: parseOs(req.headers?.["user-agent"]),
});

// ─────────────────────────────────────────────────────────────
// CORE LOG WRITER
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// QUERY / SEARCH
// ─────────────────────────────────────────────────────────────
export const getAuditLogs = async ({
  page = 1, limit = 30,
  module, action, user_id, search,
  date_from, date_to, ip,
  record_id, section_id,
} = {}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (module) where.module = module;
  if (action) where.action = action;
  if (user_id) where.user_id = user_id;
  if (ip) where.ip = { contains: ip };
  if (record_id) where.record_id = record_id;
  if (section_id) where.record_id = section_id; // section_id alias

  if (date_from || date_to) {
    where.createdAt = {};
    if (date_from) where.createdAt.gte = new Date(date_from);
    if (date_to) where.createdAt.lte = new Date(new Date(date_to).setHours(23, 59, 59, 999));
  }

  if (search) {
    where.OR = [
      { record_label: { contains: search, mode: "insensitive" } },
      { user_email: { contains: search, mode: "insensitive" } },
      { module: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getAuditLog = async (id) =>
  prisma.auditLog.findUnique({ where: { id } });

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────
export const getAuditStats = async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [total, todayCount, failedAuth, reversible, byModule, byAction] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
    prisma.auditLog.count({ where: { action: { in: ["LOGIN_FAILED", "PERMISSION_DENIED", "BLOCKED"] } } }),
    prisma.auditLog.count({ where: { reversible: true, restored_at: null } }),
    prisma.auditLog.groupBy({ by: ["module"], _count: true, orderBy: { _count: { module: "desc" } }, take: 10 }),
    prisma.auditLog.groupBy({ by: ["action"], _count: true, orderBy: { _count: { action: "desc" } } }),
  ]);
  return {
    total, today: todayCount, failed_auth: failedAuth, reversible,
    by_module: byModule.map(m => ({ module: m.module, count: m._count })),
    by_action: byAction.map(a => ({ action: a.action, count: a._count })),
  };
};

// ─────────────────────────────────────────────────────────────
// RESTORE (root only)
// ─────────────────────────────────────────────────────────────
export const restoreAuditLog = async (id) => {
  const log = await prisma.auditLog.findUnique({ where: { id } });
  if (!log?.reversible || !log.prev_data)
    throw Object.assign(new Error("Not restorable"), { status: 400 });
  try {
    await prisma[log.module].update({ where: { id: log.record_id }, data: log.prev_data });
    return prisma.auditLog.update({ where: { id }, data: { restored_at: new Date() } });
  } catch {
    throw Object.assign(new Error("Restore failed — model may not support it"), { status: 400 });
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────
export const exportAuditLogs = async ({ module, action, date_from, date_to, record_id } = {}) => {
  const where = {};
  if (module) where.module = module;
  if (action) where.action = action;
  if (record_id) where.record_id = record_id;
  if (date_from || date_to) {
    where.createdAt = {};
    if (date_from) where.createdAt.gte = new Date(date_from);
    if (date_to) where.createdAt.lte = new Date(date_to);
  }

  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 5000 });
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(logs.map(l => ({
    Time: new Date(l.createdAt).toLocaleString("en-IN"),
    Module: l.module,
    Action: l.action,
    Record: l.record_label || l.record_id || "",
    User: l.user_email || "",
    Role: l.user_role || "",
    IP: l.ip || "",
    Fields: (l.changed_fields || []).join(", "),
  })));
  xlsx.utils.book_append_sheet(wb, ws, "Audit Logs");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE — Express auditLog() + helpers
// ─────────────────────────────────────────────────────────────

// Route-level audit middleware
// Usage: router.post("/", authenticate, requirePerm("..."), auditLog("faculty","CREATE"), c.create)
export const auditLog = (module, action, opts = {}) => (req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = async (body) => {
    res.json = origJson;
    if (body?.success !== false && req.user) {
      try {
        const device = getDeviceInfo(req);
        let prev_data = null;
        const new_data = body?.data || null;
        const record_id = req.params?.id || body?.data?.id || null;
        const record_label = body?.data?.name || body?.data?.email || body?.data?.title || null;

        if (opts.getPrev && ["UPDATE", "DELETE", "BLOCK"].includes(action)) {
          try { prev_data = await opts.getPrev(req); } catch { }
        }

        await createAuditLog({
          user_id: req.user.id,
          user_email: req.user.email,
          user_role: req.user.role,
          action, module, record_id, record_label,
          prev_data, new_data,
          ...device,
        });
      } catch (err) {
        console.error("[AUDIT MW]", err.message);
      }
    }
    return origJson(body);
  };
  next();
};

// Full request audit logger (attach to app.use BEFORE routes)
export const requestAuditLogger = (req, res, next) => {
  const start = Date.now();
  const SKIP = ["/api/auth/refresh", "/api/auth/me", "/health", "/favicon"];
  res.on("finish", () => {
    if (SKIP.some(s => req.path.startsWith(s))) return;
    createAuditLog({
      user_id: req.user?.id || null,
      user_email: req.user?.email || null,
      user_role: req.user?.role || "ANONYMOUS",
      action: req.method,
      module: req.path.split("/")[2] || "unknown",
      record_id: null,
      record_label: null,
      new_data: {
        path: req.path,
        status: res.statusCode,
        duration_ms: Date.now() - start,
        query: Object.keys(req.query || {}).length ? req.query : undefined,
        body_keys: req.body ? Object.keys(req.body) : undefined,
      },
      ...getDeviceInfo(req),
    });
  });
  next();
};

// Bulk audit
export const bulkAuditLog = async ({ user, action, module, records, ip, user_agent }) => {
  const device = { ip, user_agent, device_type: null, browser: parseBrowser(user_agent), os: parseOs(user_agent) };
  await Promise.all(records.map(r =>
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

// Auth event (call from auth.service.js)
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

// Permission denied logger
export const logPermissionDenied = async (req, permission) => {
  if (!req.user) return;
  await createAuditLog({
    user_id: req.user.id,
    user_email: req.user.email,
    user_role: req.user.role,
    action: "PERMISSION_DENIED",
    module: "auth",
    record_label: permission,
    new_data: { permission, path: req.originalUrl, method: req.method },
    ...getDeviceInfo(req),
  });
};

// Search event logger
export const logSearchEvent = async (req, module, query) => {
  if (!req.user) return;
  await createAuditLog({
    user_id: req.user.id,
    user_email: req.user.email,
    user_role: req.user.role,
    action: "SEARCH", module,
    new_data: { query },
    ...getDeviceInfo(req),
  });
};

// Export event logger
export const logExportEvent = async (req, module, filters) => {
  if (!req.user) return;
  await createAuditLog({
    user_id: req.user.id,
    user_email: req.user.email,
    user_role: req.user.role,
    action: "EXPORT", module,
    new_data: { filters },
    ...getDeviceInfo(req),
  });
};