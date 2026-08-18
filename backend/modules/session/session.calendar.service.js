// backend/modules/academicSession/session.calendar.service.js
import prisma from "../../utils/prisma.js";
import xlsx   from "xlsx";

// ── Working days summary ──────────────────────────────────────
export const getCalendarSummary = async (session_id) => {
  const session = await prisma.academicSession.findUnique({
    where: { id: session_id },
    select: { id: true, name: true, start_date: true, end_date: true },
  });
  if (!session) throw Object.assign(new Error("Session not found"), { status: 404 });

  const periods = await prisma.academicPeriod.findMany({
    where: { session_id },
    orderBy: { start_date: "asc" },
  }).catch(() => []);

  // Total calendar days in session
  const sessionStart = new Date(session.start_date);
  const sessionEnd   = new Date(session.end_date);
  const totalDays    = Math.max(0, Math.round((sessionEnd - sessionStart) / 86400000) + 1);

  // Count days per type
  const byType = {};
  for (const p of periods) {
    const pStart = new Date(p.start_date);
    const pEnd   = new Date(p.end_date);
    const days   = Math.max(0, Math.round((pEnd - pStart) / 86400000) + 1);
    byType[p.type] = (byType[p.type] || 0) + days;
  }

  // Academic days = sum of ACADEMIC type periods
  const academicDays  = byType["ACADEMIC"]  || 0;
  const examDays      = byType["EXAM"]       || 0;
  const holidayDays   = byType["HOLIDAY"]    || 0;
  const breakDays     = byType["BREAK"]      || 0;
  const eventDays     = byType["EVENT"]      || 0;
  const otherDays     = byType["OTHER"]      || 0;

  const scheduledDays = academicDays + examDays + eventDays; // "active" academic days
  const nonAcademic   = holidayDays + breakDays + otherDays;
  const unplanned     = Math.max(0, totalDays - Object.values(byType).reduce((a,b) => a+b, 0));

  return {
    session: { id: session.id, name: session.name, start_date: session.start_date, end_date: session.end_date },
    summary: {
      total_calendar_days: totalDays,
      academic_days:       academicDays,
      exam_days:           examDays,
      holiday_days:        holidayDays,
      break_days:          breakDays,
      event_days:          eventDays,
      other_days:          otherDays,
      scheduled_days:      scheduledDays,   // academic + exam + event
      non_academic_days:   nonAcademic,     // holiday + break + other
      unplanned_days:      unplanned,        // not covered by any period
    },
    periods,
    by_type: byType,
  };
};

// ── Template download ─────────────────────────────────────────
export const getCalendarTemplate = async (session_id) => {
  const session = await prisma.academicSession.findUnique({
    where:  { id: session_id },
    select: { name: true, start_date: true, end_date: true },
  }).catch(() => null);

  const wb = xlsx.utils.book_new();

  // ── Instructions sheet ────────────────────────────────────
  const wsInst = xlsx.utils.aoa_to_sheet([
    ["ACADEMIC CALENDAR BULK UPLOAD TEMPLATE"],
    [`Session: ${session?.name || session_id}`],
    [`Session Period: ${session?.start_date ? new Date(session.start_date).toISOString().slice(0,10) : "" || ""} to ${session?.end_date ? new Date(session.end_date).toISOString().slice(0,10) : "" || ""}`],
    [""],
    ["INSTRUCTIONS:"],
    ["1. Fill the 'Calendar' sheet — one period per row"],
    ["2. type*: must be one of the values in Valid Types sheet"],
    ["3. label*: name for this period (e.g. 'Mid-Term Exams', 'Diwali Break')"],
    ["4. start_date*: YYYY-MM-DD format"],
    ["5. end_date*: YYYY-MM-DD format, must be >= start_date"],
    ["6. notes: optional description"],
    ["7. Periods can overlap — system will not block it but counts separately"],
    ["8. All existing periods will be KEPT — upload only adds new ones"],
    ["   (to replace all, delete existing ones manually first)"],
  ]);
  wsInst["!cols"] = [{ wch: 70 }];
  xlsx.utils.book_append_sheet(wb, wsInst, "Instructions");

  // ── Calendar template sheet ───────────────────────────────
  const HEADERS = ["type*", "label*", "start_date* (YYYY-MM-DD)", "end_date* (YYYY-MM-DD)", "notes", "order"];

  const SAMPLE_ROWS = [
    ["ACADEMIC",  "First Term Classes",   session?.start_date ? new Date(session.start_date).toISOString().slice(0,10) : "" || "2024-07-01", "2024-10-31", "First term academic sessions", "1"],
    ["EXAM",      "Mid-Term Examinations","2024-10-01", "2024-10-15", "Sessional exams for all semesters", "2"],
    ["HOLIDAY",   "Diwali Break",         "2024-11-01", "2024-11-07", "Festival holidays", "3"],
    ["BREAK",     "Winter Vacation",      "2024-12-25", "2025-01-01", "Winter break", "4"],
    ["ACADEMIC",  "Second Term Classes",  "2025-01-06", "2025-04-15", "Second term", "5"],
    ["EXAM",      "End-Term Examinations","2025-04-16", "2025-05-15", "Final semester exams", "6"],
    ["EVENT",     "Annual Sports Day",    "2025-02-15", "2025-02-15", "Annual sports event", "7"],
    ["HOLIDAY",   "Holi",                 "2025-03-14", "2025-03-14", "", "8"],
  ];

  const wsCalendar = xlsx.utils.aoa_to_sheet([HEADERS, ...SAMPLE_ROWS]);
  wsCalendar["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 35 }, { wch: 8 }];
  xlsx.utils.book_append_sheet(wb, wsCalendar, "Calendar");

  // ── Valid types sheet ─────────────────────────────────────
  const wsTypes = xlsx.utils.aoa_to_sheet([
    ["type",      "description",                         "counts as"],
    ["ACADEMIC",  "Regular teaching/class days",          "Academic days"],
    ["EXAM",      "Examination period",                   "Academic days (scheduled)"],
    ["HOLIDAY",   "Public / festival / gazetted holiday", "Non-academic days"],
    ["BREAK",     "Vacation / inter-semester break",      "Non-academic days"],
    ["EVENT",     "College events, sports, cultural",     "Academic days (scheduled)"],
    ["OTHER",     "Anything else",                        "Non-academic days"],
  ]);
  wsTypes["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 30 }];
  xlsx.utils.book_append_sheet(wb, wsTypes, "Valid Types");

  const raw = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
};

// ── Bulk upload ───────────────────────────────────────────────
export const bulkUploadCalendar = async (session_id, buffer, actingUser = {}) => {
  const wb   = xlsx.read(buffer, { type: "buffer" });
  const ws   = wb.Sheets["Calendar"] || wb.Sheets[wb.SheetNames.find(n => n !== "Instructions" && n !== "Valid Types") || wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });

  const VALID_TYPES = new Set(["ACADEMIC","EXAM","HOLIDAY","BREAK","EVENT","OTHER"]);

  const results = { created: [], failed: [], skipped: [], total: 0 };
  const data = rows.filter(r => {
    const t = String(r["type*"] || r.type || "").trim();
    const l = String(r["label*"] || r.label || "").trim();
    return t || l; // skip fully empty rows
  });
  results.total = data.length;

  for (let i = 0; i < data.length; i++) {
    const row    = data[i];
    const label  = `Row ${i + 2}`;
    const type   = String(row["type*"]                       || row.type        || "").trim().toUpperCase();
    const name   = String(row["label*"]                      || row.label       || "").trim();
    const start  = String(row["start_date* (YYYY-MM-DD)"]   || row.start_date  || "").trim();
    const end    = String(row["end_date* (YYYY-MM-DD)"]     || row.end_date    || "").trim();
    const notes  = String(row.notes                          || "").trim() || null;
    const order  = parseInt(row.order) || i;

    if (!type)               { results.failed.push({ row: label, reason: "type* required" }); continue; }
    if (!VALID_TYPES.has(type)) { results.failed.push({ row: label, reason: `Invalid type: "${type}" — use ACADEMIC/EXAM/HOLIDAY/BREAK/EVENT/OTHER` }); continue; }
    if (!name)               { results.failed.push({ row: label, reason: "label* required" }); continue; }
    if (!start)              { results.failed.push({ row: label, reason: "start_date* required" }); continue; }
    if (!end)                { results.failed.push({ row: label, reason: "end_date* required" }); continue; }
    if (end < start)         { results.failed.push({ row: label, reason: `end_date (${end}) must be >= start_date (${start})` }); continue; }

    try {
      const period = await prisma.academicPeriod.create({
        data: {
          session_id,
          type,
          label: name,
          start_date: new Date(start),
          end_date:   new Date(end),
          notes,
          order,
        },
      });
      const days = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
      results.created.push({ row: label, label: name, type, start, end, days });
    } catch (err) {
      results.failed.push({ row: label, label: name, reason: err.message });
    }
  }

  return results;
};


// ── Named exports for controller ─────────────────────────────
export const getCalendarPeriods = async (session_id) => {
  return prisma.academicPeriod.findMany({
    where:   { session_id },
    orderBy: [{ order: "asc" }, { start_date: "asc" }],
  }).catch(() => []);
};

export const addCalendarPeriod = async (session_id, data) => {
  const { type, label, start_date, end_date, notes, order } = data;
  return prisma.academicPeriod.create({
    data: {
      session_id,
      type:       type       || "ACADEMIC",
      label,
      start_date: new Date(start_date),
      end_date:   new Date(end_date),
      notes:      notes      || null,
      order:      order      ?? 0,
    },
  }).catch((e) => { throw Object.assign(new Error("AcademicPeriod model missing — run: npx prisma migrate dev"), { status: 503 }); });
};

export const editCalendarPeriod = async (pid, data) => {
  const { label, start_date, end_date, type, notes, order } = data;
  return prisma.academicPeriod.update({
    where: { id: pid },
    data: {
      ...(label      !== undefined && { label }),
      ...(type       !== undefined && { type }),
      ...(start_date !== undefined && { start_date: new Date(start_date) }),
      ...(end_date   !== undefined && { end_date:   new Date(end_date) }),
      ...(notes      !== undefined && { notes }),
      ...(order      !== undefined && { order }),
    },
  });
};

export const removeCalendarPeriod = async (pid) => {
  await prisma.academicPeriod.delete({ where: { id: pid } });
};
