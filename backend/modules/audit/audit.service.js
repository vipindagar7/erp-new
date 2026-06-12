// backend/modules/audit/audit.service.js — ADD/REPLACE getAuditStats function

import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";

export const getAuditLogs = async ({ page = 1, limit = 30, module, action, user_id, search, date_from, date_to, ip } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (module) where.module = module;
  if (action) where.action = action;
  if (user_id) where.user_id = user_id;
  if (ip) where.ip = { contains: ip };
  if (date_from || date_to) {
    where.createdAt = {};
    if (date_from) where.createdAt.gte = new Date(date_from);
    if (date_to) where.createdAt.lte = new Date(new Date(date_to).setHours(23, 59, 59, 999));
  }
  if (search) {
    where.OR = [
      { user_email: { contains: search, mode: "insensitive" } },
      { record_label: { contains: search, mode: "insensitive" } },
      { ip: { contains: search } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getAuditLog = async (id) => {
  return prisma.auditLog.findUnique({ where: { id } });
};

// ── Enhanced stats ────────────────────────────────────────────
export const getAuditStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, todayCount, failedAuth, reversible, byModule, byAction] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
    prisma.auditLog.count({ where: { action: { in: ["LOGIN_FAILED", "PERMISSION_DENIED", "BLOCKED"] } } }),
    prisma.auditLog.count({ where: { reversible: true, restored_at: null } }),
    // Top modules
    prisma.auditLog.groupBy({ by: ["module"], _count: true, orderBy: { _count: { module: "desc" } }, take: 10 }),
    // Action breakdown
    prisma.auditLog.groupBy({ by: ["action"], _count: true, orderBy: { _count: { action: "desc" } } }),
  ]);

  return {
    total,
    today: todayCount,
    failed_auth: failedAuth,
    reversible,
    by_module: byModule.map((m) => ({ module: m.module, count: m._count })),
    by_action: byAction.map((a) => ({ action: a.action, count: a._count })),
  };
};

export const exportAuditLogs = async ({ module, action, date_from, date_to } = {}) => {
  const where = {};
  if (module) where.module = module;
  if (action) where.action = action;
  if (date_from || date_to) {
    where.createdAt = {};
    if (date_from) where.createdAt.gte = new Date(date_from);
    if (date_to) where.createdAt.lte = new Date(date_to);
  }

  const logs = await prisma.auditLog.findMany({
    where, orderBy: { createdAt: "desc" }, take: 5000,
  });

  const wb = xlsx.utils.book_new();
  const HEADERS = ["Time", "Action", "Module", "Record", "User Email", "User Role", "IP", "Browser", "OS", "Device", "Changed Fields", "Reversible"];
  const rows = logs.map((l) => [
    new Date(l.createdAt).toLocaleString("en-IN"),
    l.action, l.module,
    l.record_label || l.record_id || "",
    l.user_email || "", l.user_role || "",
    l.ip || "", l.browser || "", l.os || "", l.device_type || "",
    (l.changed_fields || []).join(", "),
    l.reversible ? "Yes" : "No",
  ]);
  const ws = xlsx.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  xlsx.utils.book_append_sheet(wb, ws, "Audit Log");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const restoreRecord = async (auditLogId, requestingUser) => {
  const log = await prisma.auditLog.findUnique({ where: { id: auditLogId } });
  if (!log) throw Object.assign(new Error("Audit log not found"), { statusCode: 404 });
  if (!log.reversible) throw Object.assign(new Error("This action is not reversible"), { statusCode: 400 });
  if (log.restored_at) throw Object.assign(new Error("Already restored"), { statusCode: 400 });

  // Restore by clearing deleted_at on the record
  const modelMap = {
    student: "student", faculty: "faculty", section: "section",
    department: "department", program: "program", course: "course",
    subject: "subject", admin: "admin",
  };

  const model = modelMap[log.module];
  if (!model || !log.record_id) throw Object.assign(new Error("Cannot restore this record type"), { statusCode: 400 });

  await prisma[model].update({
    where: { id: log.record_id },
    data: { deleted_at: null },
  });

  await prisma.auditLog.update({
    where: { id: auditLogId },
    data: { restored_at: new Date(), restored_by: requestingUser.id },
  });

  return { restored: true, module: log.module, record_id: log.record_id };
};