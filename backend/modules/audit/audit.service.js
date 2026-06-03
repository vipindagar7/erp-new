import prisma from "../../utils/prisma.js";


// ── LIST audit logs with filters ─────────────────────────────
export const getAuditLogs = async ({
  page = 1, limit = 50, user_id, user_email, module, action,
  record_id, date_from, date_to, search,
} = {}) => {
  page  = parseInt(page)  || 1;
  limit = Math.min(parseInt(limit) || 50, 200);

  const where = {
    ...(user_id    && { user_id }),
    ...(user_email && { user_email: { contains: user_email, mode: "insensitive" } }),
    ...(module     && module !== "all" && { module }),
    ...(action     && action !== "all" && { action }),
    ...(record_id  && { record_id }),
    ...(date_from  && { createdAt: { gte: new Date(date_from) } }),
    ...(date_to    && { createdAt: { ...(date_from ? { gte: new Date(date_from) } : {}), lte: new Date(date_to) } }),
    ...(search && {
      OR: [
        { user_email:   { contains: search, mode: "insensitive" } },
        { record_label: { contains: search, mode: "insensitive" } },
        { module:       { contains: search, mode: "insensitive" } },
        { action:       { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ]);

  return { logs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

// ── GET single log with full diff ─────────────────────────────
export const getAuditLog = async (id) => {
  const log = await prisma.auditLog.findUnique({ where: { id } });
  if (!log) throw Object.assign(new Error("Audit log not found"), { statusCode: 404 });
  return log;
};

// ── RESTORE — re-apply prev_data to the record ────────────────
export const restoreRecord = async (logId, restoredBy) => {
  const log = await prisma.auditLog.findUnique({ where: { id: logId } });
  if (!log) throw Object.assign(new Error("Audit log not found"), { statusCode: 404 });
  if (!log.reversible) throw Object.assign(new Error("This action is not reversible"), { statusCode: 400 });
  if (!log.prev_data)  throw Object.assign(new Error("No previous data to restore"), { statusCode: 400 });
  if (log.restored_at) throw Object.assign(new Error("Already restored"), { statusCode: 400 });

  const prev = log.prev_data;
  const { id: recordId, ...restoreData } = prev;

  // Dispatch to correct model
  const MODEL_MAP = {
    student:          (d) => prisma.student.update({ where: { id: recordId }, data: sanitize(d, ["user_id","dept_id","section_id","course_id","program_id"]) }),
    faculty:          (d) => prisma.faculty.update({ where: { id: recordId }, data: sanitize(d, ["user_id","dept_id"]) }),
    section:          (d) => prisma.section.update({ where: { id: recordId }, data: sanitize(d, ["course_id","class_coordinator_id"]) }),
    subject:          (d) => prisma.subject.update({ where: { id: recordId }, data: sanitize(d, []) }),
    course:           (d) => prisma.course.update({ where: { id: recordId }, data: sanitize(d, ["program_id"]) }),
    program:          (d) => prisma.program.update({ where: { id: recordId }, data: sanitize(d, ["dept_id"]) }),
    department:       (d) => prisma.department.update({ where: { id: recordId }, data: sanitize(d, []) }),
    feedback_form:    (d) => prisma.feedbackForm.update({ where: { id: recordId }, data: sanitize(d, ["category_id","faculty_id","subject_id","section_id"]) }),
    feedback_category:(d) => prisma.feedbackCategory.update({ where: { id: recordId }, data: sanitize(d, []) }),
    feedback_question:(d) => prisma.feedbackQuestion.update({ where: { id: recordId }, data: sanitize(d, ["category_id"]) }),
    curriculum:       (d) => prisma.curriculumSubject.update({ where: { id: recordId }, data: sanitize(d, ["program_id","course_id","subject_id"]) }),
    enrollment:       (d) => prisma.studentEnrollment.update({ where: { id: recordId }, data: sanitize(d, ["student_id","section_id","dept_id","course_id","program_id"]) }),
  };

  const fn = MODEL_MAP[log.module];
  if (!fn) throw Object.assign(new Error(`Restore not supported for module "${log.module}"`), { statusCode: 400 });

  const SCALAR_SKIP = new Set(["id","createdAt","updatedAt",...Object.keys(restoreData).filter(k => typeof restoreData[k] === "object" && !Array.isArray(restoreData[k]) && restoreData[k] !== null)]);
  function sanitize(data, fkFields) {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
      if (SCALAR_SKIP.has(k)) continue;
      if (typeof v === "object" && !Array.isArray(v) && v !== null) continue; // skip nested objects
      out[k] = v;
    }
    return out;
  }

  await fn(restoreData);

  // Mark as restored
  await prisma.auditLog.update({
    where: { id: logId },
    data:  { restored_at: new Date(), restored_by: restoredBy },
  });

  // Write a new audit log for the restore action
  await prisma.auditLog.create({
    data: {
      user_id:       restoredBy,
      action:        "RESTORE",
      module:        log.module,
      record_id:     recordId,
      record_label:  log.record_label,
      prev_data:     log.new_data,
      new_data:      log.prev_data,
      changed_fields: log.changed_fields,
      reversible:    false,
    },
  });

  return { restored: true, record_id: recordId, module: log.module };
};

// ── STATS for dashboard ───────────────────────────────────────
export const getAuditStats = async ({ days = 7 } = {}) => {
  const since = new Date(Date.now() - days * 86400000);
  const [total, byAction, byModule, byUser, recent] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    prisma.auditLog.groupBy({ by: ["action"],  _count: true, where: { createdAt: { gte: since } }, orderBy: { _count: { action: "desc" } } }),
    prisma.auditLog.groupBy({ by: ["module"],  _count: true, where: { createdAt: { gte: since } }, orderBy: { _count: { module: "desc" } } }),
    prisma.auditLog.groupBy({ by: ["user_email"], _count: true, where: { createdAt: { gte: since } }, orderBy: { _count: { user_email: "desc" } }, take: 10 }),
    prisma.auditLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return { total, days, byAction, byModule, byUser, recent };
};

// ── EXPORT audit logs as CSV ──────────────────────────────────
export const exportAuditLogs = async (filters) => {
  const { logs } = await getAuditLogs({ ...filters, limit: 10000 });
  const headers = ["ID","User","Role","Action","Module","Record","Label","Changed Fields","IP","Timestamp","Restored"];
  const rows = logs.map((l) => [
    l.id, l.user_email||"system", l.user_role||"—", l.action, l.module,
    l.record_id||"—", l.record_label||"—",
    (l.changed_fields||[]).join(", "), l.ip||"—",
    new Date(l.createdAt).toISOString(),
    l.restored_at ? new Date(l.restored_at).toISOString() : "—",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  return { csv, filename: `audit_log_${new Date().toISOString().slice(0,10)}.csv` };
};
