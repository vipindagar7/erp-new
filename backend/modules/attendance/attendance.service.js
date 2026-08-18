// backend/modules/attendance/attendance.service.js
// MERGED: existing service + consecutive period logic + faculty biometric + extra attendance
import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";

// ── Guard ─────────────────────────────────────────────────────
const guard = () => {
  if (!prisma.studentAttendance) throw Object.assign(
    new Error("Attendance models not found — run migration"),
    { status: 503 }
  );
};

// ── Freeze check ──────────────────────────────────────────────
const isFrozen = async (session_id, section_id) => {
  if (!prisma.attendanceFreezeRule) return false;
  const rule = await prisma.attendanceFreezeRule.findFirst({
    where: {
      session_id, is_frozen: true,
      OR: [{ scope: "INSTITUTE" }, { scope: "SECTION", scope_id: section_id }],
    },
  });
  return !!rule;
};

// ═══════════════════════════════════════════════════════════════
// CONSECUTIVE PERIOD LOGIC
// Lab/consecutive slots → single attendance entry (first period only)
// ═══════════════════════════════════════════════════════════════
export const checkConsecutive = async (timetable_id, period_config_id, day) => {
  if (!timetable_id || !period_config_id || !day) {
    return { is_consecutive: false, master_period_id: period_config_id, group: [period_config_id], should_skip: false };
  }

  const anchor = await prisma.timetableEntry.findFirst({
    where: { timetable_id, period_config_id, day },
    include: { period_config: { select: { order: true } } },
  });
  if (!anchor || (anchor.span_periods <= 1 && anchor.entry_type !== "LAB")) {
    return { is_consecutive: false, master_period_id: period_config_id, group: [period_config_id], should_skip: false };
  }

  // Find all entries in this TT+day for same subject+faculty
  const allEntries = await prisma.timetableEntry.findMany({
    where: { timetable_id, day },
    include: { period_config: { select: { order: true } } },
    orderBy: { period_config: { order: "asc" } },
  });

  // Find consecutive group
  const group = [];
  let started = false;
  for (const e of allEntries) {
    const isConsec = e.subject_id === anchor.subject_id && e.faculty_id === anchor.faculty_id &&
      (e.entry_type === "LAB" || anchor.entry_type === "LAB" || anchor.span_periods > 1);
    if (e.period_config_id === period_config_id) started = true;
    if (started && isConsec) group.push(e.period_config_id);
    else if (started && group.length > 0) break;
  }

  // Go back to find if there's a period BEFORE anchor that's also consecutive
  const fullGroup = [];
  let inGroup = false;
  for (const e of allEntries) {
    const isConsec = e.subject_id === anchor.subject_id && e.faculty_id === anchor.faculty_id &&
      (e.entry_type === "LAB" || anchor.entry_type === "LAB" || anchor.span_periods > 1);
    if (isConsec) { inGroup = true; fullGroup.push(e.period_config_id); }
    else if (inGroup && fullGroup.includes(period_config_id)) break;
    else if (!isConsec && fullGroup.length > 0 && !fullGroup.includes(period_config_id)) {
      fullGroup.length = 0; inGroup = false;
    }
  }

  const finalGroup = fullGroup.length >= 2 && fullGroup.includes(period_config_id) ? fullGroup : [period_config_id];
  const master = finalGroup[0];

  return {
    is_consecutive: finalGroup.length > 1,
    master_period_id: master,
    group: finalGroup,
    should_skip: finalGroup.length > 1 && master !== period_config_id,
  };
};

// ═══════════════════════════════════════════════════════════════
// MARK ATTENDANCE
// ═══════════════════════════════════════════════════════════════
export const markAttendance = async (data, actingUser = {}) => {
  guard();
  const {
    session_id, section_id, subject_id, date, period_name,
    period_config_id, records,
    attendance_type = "REGULAR",
  } = data;

  const frozen = await isFrozen(session_id, section_id);
  if (frozen) throw Object.assign(new Error("Attendance is frozen"), { status: 403 });

  const dt = new Date(date); dt.setHours(0, 0, 0, 0);

  // Already marked check
  if (period_config_id) {
    const existing = await prisma.studentAttendance.findFirst({
      where: { session_id, section_id, subject_id, date: dt, period_config_id },
      select: { id: true },
    });
    if (existing) return { already_marked: true, message: "Attendance already marked for this slot", marked: 0, errors: [] };
  }

  const results = { already_marked: false, marked: 0, updated: 0, errors: [] };
  for (const r of records) {
    try {
      await prisma.studentAttendance.upsert({
        where: {
          session_id_section_id_subject_id_student_id_date_period_name: {
            session_id, section_id, subject_id,
            student_id: r.student_id, date: dt,
            period_name: period_name || period_config_id || "P1",
          },
        },
        update: {
          status: r.status,
          is_late: r.is_late || false,
          late_reason: r.late_reason || null,
          marked_by: actingUser.id || actingUser?.user?.id || null,
          marked_at: new Date(),
        },
        create: {
          session_id, section_id, subject_id,
          student_id: r.student_id,
          date: dt,
          period_name: period_name || period_config_id || "P1",
          period_config_id: period_config_id || null,
          status: r.status || "PRESENT",
          is_late: r.is_late || false,
          late_reason: r.late_reason || null,
          attendance_type: attendance_type,
          faculty_id: actingUser?.faculty?.id || actingUser?.faculty_id || null,
          marked_by: actingUser.id || null,
        },
      });
      results.marked++;
    } catch (err) {
      results.errors.push({ student_id: r.student_id, error: err.message });
    }
  }
  return results;
};

// ── Get attendance for a lecture ──────────────────────────────
export const getLectureAttendance = async ({ session_id, section_id, subject_id, date, period_name, period_config_id }) => {
  guard();
  const dt = new Date(date); dt.setHours(0, 0, 0, 0);
  const where = { session_id, section_id, subject_id, date: dt };
  if (period_name) where.period_name = period_name;
  if (period_config_id) where.period_config_id = period_config_id;

  return prisma.studentAttendance.findMany({
    where,
    include: { student: { select: { id: true, name: true, roll_no: true, enrollment_no: true } } },
    orderBy: { student: { roll_no: "asc" } },
  });
};

// ── Daily (all periods) ───────────────────────────────────────
export const getDailyAttendance = async ({ session_id, section_id, date, subject_id }) => {
  guard();
  const dt = new Date(date); dt.setHours(0, 0, 0, 0);
  const where = { session_id, section_id, date: dt };
  if (subject_id) where.subject_id = subject_id;
  return prisma.studentAttendance.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, roll_no: true } },
      subject: { select: { name: true, code: true } },
    },
    orderBy: [{ period_name: "asc" }, { student: { roll_no: "asc" } }],
  });
};

// ── Update single record ──────────────────────────────────────
export const updateAttendanceRecord = async (id, data, actingUser = {}) => {
  guard();
  const record = await prisma.studentAttendance.findUnique({ where: { id } });
  if (!record) throw Object.assign(new Error("Record not found"), { status: 404 });
  if (record.is_frozen && !data.back_entry) throw Object.assign(new Error("Attendance is frozen"), { status: 403 });

  return prisma.studentAttendance.update({
    where: { id },
    data: {
      status: data.status,
      is_late: data.is_late ?? record.is_late,
      late_reason: data.late_reason ?? null,
      back_entry: data.back_entry || false,
      back_entry_reason: data.back_entry_reason || null,
      back_entry_by: data.back_entry ? actingUser.id : null,
      marked_by: actingUser.id,
      marked_at: new Date(),
    },
  });
};

// ── Back-entry (superadmin) ───────────────────────────────────
export const backEntryAttendance = async (data, actingUser = {}) => {
  guard();
  const { session_id, section_id, subject_id, date, period_name, reason, records } = data;
  const dt = new Date(date); dt.setHours(0, 0, 0, 0);
  const results = { created: 0, updated: 0, errors: [] };
  for (const r of records) {
    try {
      await prisma.studentAttendance.upsert({
        where: {
          session_id_section_id_subject_id_student_id_date_period_name: {
            session_id, section_id, subject_id, student_id: r.student_id, date: dt, period_name,
          },
        },
        update: { status: r.status, back_entry: true, back_entry_reason: reason, back_entry_by: actingUser.id, marked_by: actingUser.id },
        create: {
          session_id, section_id, subject_id, student_id: r.student_id,
          date: dt, period_name, status: r.status,
          back_entry: true, back_entry_reason: reason, back_entry_by: actingUser.id,
          faculty_id: actingUser.faculty?.id || null, marked_by: actingUser.id,
        },
      });
      results.created++;
    } catch (e) { results.errors.push({ student_id: r.student_id, error: e.message }); }
  }
  return results;
};

// ── Get section students ──────────────────────────────────────
export const getSectionStudents = async (section_id) => {
  return prisma.student.findMany({
    where: { section_id, status: "ACTIVE", deleted_at: null },
    select: { id: true, name: true, roll_no: true, photo_url: true },
    orderBy: { roll_no: "asc" },
  });
};

// ═══════════════════════════════════════════════════════════════
// SUMMARIES
// ═══════════════════════════════════════════════════════════════
export const getStudentSubjectSummary = async (student_id, session_id) => {
  guard();
  const records = await prisma.studentAttendance.findMany({
    where: { student_id, session_id },
    select: { subject_id: true, status: true },
  });
  const bySubject = {};
  for (const r of records) {
    if (!bySubject[r.subject_id]) bySubject[r.subject_id] = { total: 0, present: 0, absent: 0, late: 0 };
    const s = bySubject[r.subject_id];
    s.total++;
    if (r.status === "PRESENT") s.present++;
    else if (r.status === "ABSENT") s.absent++;
    else if (r.status === "LATE") { s.late++; s.present++; }
  }
  const subjectIds = Object.keys(bySubject);
  const subjects = await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } });
  const subMap = Object.fromEntries(subjects.map(s => [s.id, s]));
  const summary = subjectIds.map(sid => {
    const s = bySubject[sid];
    const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
    return { subject_id: sid, subject: subMap[sid], ...s, percentage: pct, is_short: pct < 75 };
  });
  const total = records.length;
  const present = records.filter(r => ["PRESENT", "LATE"].includes(r.status)).length;
  return { subjects: summary, overall: { total, present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 } };
};

export const getSectionAttendanceSummary = async ({ session_id, section_id, subject_id, from_date, to_date }) => {
  guard();
  const where = { session_id, section_id };
  if (subject_id) where.subject_id = subject_id;
  if (from_date) where.date = { gte: new Date(from_date) };
  if (to_date) where.date = { ...where.date, lte: new Date(to_date) };

  const records = await prisma.studentAttendance.findMany({
    where,
    include: { student: { select: { id: true, name: true, roll_no: true } } },
  });
  const byStudent = {};
  for (const r of records) {
    if (!byStudent[r.student_id]) byStudent[r.student_id] = { student: r.student, total: 0, present: 0, absent: 0, late: 0 };
    const s = byStudent[r.student_id];
    s.total++;
    if (["PRESENT", "LATE"].includes(r.status)) s.present++;
    else if (r.status === "ABSENT") s.absent++;
    if (r.status === "LATE") s.late++;
  }
  const threshold = 75;
  const summary = Object.values(byStudent).map(s => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    is_short: s.total > 0 && Math.round((s.present / s.total) * 100) < threshold,
    is_non_attending: s.present === 0 && s.total > 0,
  }));
  return { summary, short_attendance: summary.filter(s => s.is_short), non_attending: summary.filter(s => s.is_non_attending), total_students: summary.length };
};

export const getStudentDegreeSummary = async (student_id) => {
  guard();
  const allRecords = await prisma.studentAttendance.findMany({
    where: { student_id },
    select: { session_id: true, status: true },
  });
  const bySem = {};
  for (const r of allRecords) {
    if (!bySem[r.session_id]) bySem[r.session_id] = { total: 0, present: 0 };
    bySem[r.session_id].total++;
    if (["PRESENT", "LATE"].includes(r.status)) bySem[r.session_id].present++;
  }
  const total = allRecords.length;
  const present = allRecords.filter(r => ["PRESENT", "LATE"].includes(r.status)).length;
  return {
    by_session: Object.entries(bySem).map(([sid, s]) => ({ session_id: sid, ...s, percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 })),
    overall: { total, present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 },
  };
};

// ═══════════════════════════════════════════════════════════════
// FREEZE / UNFREEZE / AUTO-FREEZE
// ═══════════════════════════════════════════════════════════════
export const freezeAttendance = async (data, actingUser = {}) => {
  if (!prisma.attendanceFreezeRule) throw Object.assign(new Error("Model not found — run migration"), { status: 503 });
  const { session_id, scope, scope_id, freeze_reason } = data;
  return prisma.attendanceFreezeRule.upsert({
    where: { session_id_scope_scope_id: { session_id, scope, scope_id: scope_id || null } },
    update: { is_frozen: true, frozen_by: actingUser.id, frozen_at: new Date(), freeze_reason: freeze_reason || null },
    create: { session_id, scope, scope_id: scope_id || null, is_frozen: true, frozen_by: actingUser.id, frozen_at: new Date(), freeze_reason: freeze_reason || null },
  });
};

export const unfreezeAttendance = async (data, actingUser = {}) => {
  if (!prisma.attendanceFreezeRule) throw Object.assign(new Error("Model not found — run migration"), { status: 503 });
  const { session_id, scope, scope_id } = data;
  return prisma.attendanceFreezeRule.update({
    where: { session_id_scope_scope_id: { session_id, scope, scope_id: scope_id || null } },
    data: { is_frozen: false, unfrozen_by: actingUser.id, unfrozen_at: new Date() },
  });
};

export const getFreezeStatus = async (session_id) => {
  if (!prisma.attendanceFreezeRule) return [];
  return prisma.attendanceFreezeRule.findMany({ where: { session_id } });
};

export const autoFreezeYesterday = async () => {
  guard();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0);
  const result = await prisma.studentAttendance.updateMany({
    where: { date: yesterday, is_frozen: false },
    data: { is_frozen: true },
  });
  return { frozen: result.count, date: yesterday.toISOString().slice(0, 10) };
};

// ═══════════════════════════════════════════════════════════════
// FACULTY BIOMETRIC ATTENDANCE
// ═══════════════════════════════════════════════════════════════
export const processBiometricUpload = async (buffer, format = "AUTO") => {
  if (!prisma.facultyAttendance) throw Object.assign(new Error("FacultyAttendance model not found"), { status: 503 });

  const wb = xlsx.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
  if (!rows.length) throw Object.assign(new Error("No data in file"), { status: 400 });

  const firstRow = rows[0];
  const keys = Object.keys(firstRow).map(k => String(k).toLowerCase());
  const isOptionA = keys.some(k => k.includes("in_time") || k.includes("intime") || k.includes("out_time"));
  const detected = format === "AUTO" ? (isOptionA ? "OPTION_A" : "OPTION_B") : format;

  const allFaculty = await prisma.faculty.findMany({ select: { id: true, emp_id: true } });
  const empMap = Object.fromEntries(allFaculty.filter(f => f.emp_id).map(f => [String(f.emp_id).trim(), f.id]));

  const results = { created: 0, updated: 0, skipped: 0, errors: [] };

  if (detected === "OPTION_A") {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const emp_id = String(row["EmpID"] || row["emp_id"] || row["Employee ID"] || row["ID"] || "").trim();
      const dateStr = String(row["Date"] || row["date"] || row["Attendance Date"] || "").trim();
      const inStr = String(row["InTime"] || row["in_time"] || row["In Time"] || "").trim();
      const outStr = String(row["OutTime"] || row["out_time"] || row["Out Time"] || "").trim();
      const statusStr = String(row["Status"] || row["status"] || "PRESENT").trim().toUpperCase();
      if (!emp_id || !dateStr) { results.skipped++; continue; }
      const faculty_id = empMap[emp_id];
      if (!faculty_id) { results.errors.push({ row: i + 2, emp_id, reason: "Faculty not found" }); continue; }
      const date = new Date(dateStr); date.setHours(0, 0, 0, 0);
      const status = ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"].includes(statusStr) ? statusStr : "PRESENT";
      try {
        await prisma.facultyAttendance.upsert({
          where: { faculty_id_date: { faculty_id, date } },
          update: { in_time: inStr ? new Date(`${dateStr} ${inStr}`) : null, out_time: outStr ? new Date(`${dateStr} ${outStr}`) : null, status, source: "BIOMETRIC", raw_logs: row },
          create: { faculty_id, date, in_time: inStr ? new Date(`${dateStr} ${inStr}`) : null, out_time: outStr ? new Date(`${dateStr} ${outStr}`) : null, status, source: "BIOMETRIC", raw_logs: row },
        });
        results.created++;
      } catch (err) { results.errors.push({ row: i + 2, emp_id, reason: err.message }); }
    }
  } else {
    // Option B: punch-based
    const grouped = {};
    for (const row of rows) {
      const emp_id = String(row["EmpID"] || row["emp_id"] || row["Employee ID"] || row["ID"] || "").trim();
      const dtStr = String(row["LogDate"] || row["PunchDateTime"] || row["DateTime"] || row["Date"] || "").trim();
      const type = String(row["Type"] || row["Direction"] || row["punch_type"] || "").trim().toUpperCase();
      if (!emp_id || !dtStr) continue;
      const dt = new Date(dtStr);
      const key = `${emp_id}_${dt.toISOString().slice(0, 10)}`;
      if (!grouped[key]) grouped[key] = { emp_id, date: dt, punches: [] };
      grouped[key].punches.push({ dt, type });
    }
    for (const [key, g] of Object.entries(grouped)) {
      const faculty_id = empMap[g.emp_id];
      if (!faculty_id) { results.errors.push({ key, emp_id: g.emp_id, reason: "Not found" }); continue; }
      g.punches.sort((a, b) => a.dt - b.dt);
      const ins = g.punches.filter(p => !p.type || p.type.includes("IN"));
      const outs = g.punches.filter(p => p.type.includes("OUT"));
      const in_time = ins[0]?.dt || g.punches[0]?.dt || null;
      const out_time = outs[outs.length - 1]?.dt || g.punches[g.punches.length - 1]?.dt || null;
      const date = new Date(g.date); date.setHours(0, 0, 0, 0);
      try {
        await prisma.facultyAttendance.upsert({
          where: { faculty_id_date: { faculty_id, date } },
          update: { in_time, out_time, status: "PRESENT", source: "BIOMETRIC", raw_logs: g.punches },
          create: { faculty_id, date, in_time, out_time, status: "PRESENT", source: "BIOMETRIC", raw_logs: g.punches },
        });
        results.created++;
      } catch (err) { results.errors.push({ key, reason: err.message }); }
    }
  }
  return { ...results, format: detected, total: rows.length };
};

export const getFacultyAttendance = async ({ faculty_id, from_date, to_date, month, year }) => {
  if (!prisma.facultyAttendance) return [];
  const where = { faculty_id };
  if (from_date && to_date) { where.date = { gte: new Date(from_date), lte: new Date(to_date) }; }
  else if (month && year) {
    where.date = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) };
  }
  return prisma.facultyAttendance.findMany({ where, orderBy: { date: "desc" } });
};