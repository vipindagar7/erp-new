// backend/modules/holiday/holiday.service.js
import prisma from "../../utils/prisma.js";

const guard = () => { if (!prisma.holiday) throw Object.assign(new Error("Run migration: npx prisma migrate dev"), { status: 503 }); };

// ── Holidays ─────────────────────────────────────────────────


export const bulkCreateHolidays = async (holidays, actingUser = {}) => {
  guard();
  const created = [];
  for (const h of holidays) {
    try { created.push(await createHoliday(h, actingUser)); }
    catch (e) { created.push({ error: e.message, date: h.date, name: h.name }); }
  }
  return created;
};


// ── Leave Rules ──────────────────────────────────────────────
export const getLeaveRules = async ({ session_id, employee_type } = {}) => {
  if (!prisma.leaveRule) return [];
  const where = {};
  if (session_id) where.session_id = session_id;
  if (employee_type) where.employee_type = employee_type;
  return prisma.leaveRule.findMany({
    where,
    include: { leave_type: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "asc" },
  });
};

export const createLeaveRule = async (data, actingUser = {}) => {
  if (!prisma.leaveRule) throw Object.assign(new Error("Run migration"), { status: 503 });
  return prisma.leaveRule.create({
    data: {
      session_id: data.session_id || null,
      leave_type_id: data.leave_type_id,
      employee_type: data.employee_type || "ALL",
      contract_type: data.contract_type || "ALL",
      credit_mode: data.credit_mode || "SESSION",
      session_credit: parseFloat(data.session_credit || 0),
      monthly_credit: parseFloat(data.monthly_credit || 0),
      quarterly_credit: parseFloat(data.quarterly_credit || 0),
      credit_on_day: parseInt(data.credit_on_day || 1),
      pro_rata: data.pro_rata !== false,
      carry_forward: Boolean(data.carry_forward),
      carry_forward_max: data.carry_forward_max ? parseFloat(data.carry_forward_max) : null,
      carry_forward_lapse_days: parseInt(data.carry_forward_lapse_days || 90),
      max_consecutive: data.max_consecutive ? parseInt(data.max_consecutive) : null,
      min_notice_days: parseInt(data.min_notice_days || 0),
      requires_document: Boolean(data.requires_document),
      document_threshold: parseFloat(data.document_threshold || 3),
      sandwich_rule: Boolean(data.sandwich_rule),
      encashable: Boolean(data.encashable),
      encash_max: data.encash_max ? parseFloat(data.encash_max) : null,
      max_per_year: data.max_per_year ? parseFloat(data.max_per_year) : null,
      max_per_month: data.max_per_month ? parseFloat(data.max_per_month) : null,
      min_days: parseFloat(data.min_days || 0.5),
      allow_negative: Boolean(data.allow_negative),
      negative_max: parseFloat(data.negative_max || 0),
      is_active: data.is_active !== false,
      notes: data.notes || null,
      created_by: actingUser.id || null,
    },
  });
};

export const updateLeaveRule = async (id, data) => {
  if (!prisma.leaveRule) throw Object.assign(new Error("Run migration"), { status: 503 });
  const allowed = ["credit_mode", "session_credit", "monthly_credit", "quarterly_credit",
    "credit_on_day", "pro_rata", "carry_forward", "carry_forward_max", "max_consecutive",
    "min_notice_days", "requires_document", "document_threshold", "sandwich_rule",
    "encashable", "encash_max", "max_per_year", "max_per_month", "min_days",
    "allow_negative", "negative_max", "is_active", "notes"];
  const u = {};
  for (const k of allowed) {
    if (data[k] !== undefined) u[k] = data[k];
  }
  return prisma.leaveRule.update({ where: { id }, data: u });
};

// ── Auto-credit engine ────────────────────────────────────────
// Call this at session start OR monthly cron
export const runLeaveCredit = async ({
  session_id, academic_year, credit_type = "SESSION",
  faculty_ids, actingUser = {},
} = {}) => {
  if (!prisma.leaveRule || !prisma.leaveCreditLog) throw Object.assign(new Error("Run migration"), { status: 503 });

  const rules = await prisma.leaveRule.findMany({
    where: {
      is_active: true,
      OR: [
        { credit_mode: credit_type === "MONTHLY" ? "MONTHLY" : "SESSION" },
        { session_id },
      ],
    },
    include: { leave_type: true },
  });

  // Get faculty to credit
  const facWhere = { deleted_at: null };
  if (faculty_ids?.length) facWhere.id = { in: faculty_ids };

  const faculty = await prisma.faculty.findMany({
    where: facWhere,
    select: { id: true, employee_type: true },
  });

  const results = [];

  for (const rule of rules) {
    const days = credit_type === "MONTHLY"
      ? rule.monthly_credit
      : rule.session_credit;

    if (!days) continue;

    for (const f of faculty) {
      // Skip if rule doesn't apply to this employee type
      if (rule.employee_type !== "ALL" && rule.employee_type !== f.employee_type) continue;

      // Get current balance
      let balance = await prisma.leaveBalance.findUnique({
        where: { faculty_id_leave_type_id_academic_year: { faculty_id: f.id, leave_type_id: rule.leave_type_id, academic_year } },
      });

      if (!balance) {
        balance = await prisma.leaveBalance.create({
          data: { faculty_id: f.id, leave_type_id: rule.leave_type_id, academic_year, total_days: 0, used_days: 0, pending_days: 0 },
        });
      }

      const newTotal = balance.total_days + days;
      const cappedTotal = rule.max_per_year ? Math.min(newTotal, rule.max_per_year) : newTotal;
      const actualCredit = cappedTotal - balance.total_days;

      if (actualCredit <= 0) continue;

      await prisma.leaveBalance.update({
        where: { faculty_id_leave_type_id_academic_year: { faculty_id: f.id, leave_type_id: rule.leave_type_id, academic_year } },
        data: { total_days: cappedTotal },
      });

      await prisma.leaveCreditLog.create({
        data: {
          faculty_id: f.id,
          leave_type_id: rule.leave_type_id,
          session_id: session_id || null,
          academic_year,
          credit_type: credit_type === "MONTHLY" ? "AUTO" : "AUTO",
          days_credited: actualCredit,
          balance_before: balance.total_days,
          balance_after: cappedTotal,
          rule_id: rule.id,
          note: `Auto credit — ${credit_type} — ${rule.leave_type.code}`,
          created_by: actingUser?.id || "SYSTEM",
        },
      }).catch(() => { });

      results.push({ faculty_id: f.id, leave_type: rule.leave_type.code, credited: actualCredit, balance: cappedTotal });
    }
  }

  return { credited: results.length, results };
};

// Carry forward balances from previous session
export const runCarryForward = async ({ from_academic_year, to_academic_year, actingUser = {} } = {}) => {
  if (!prisma.leaveBalance) throw Object.assign(new Error("Run migration"), { status: 503 });

  const rules = await prisma.leaveRule.findMany({
    where: { carry_forward: true, is_active: true },
    include: { leave_type: true },
  });

  const results = [];
  for (const rule of rules) {
    const prevBalances = await prisma.leaveBalance.findMany({
      where: { leave_type_id: rule.leave_type_id, academic_year: from_academic_year },
    });

    for (const pb of prevBalances) {
      const remaining = Math.max(0, pb.total_days - pb.used_days - pb.pending_days);
      if (remaining <= 0) continue;
      const carry = rule.carry_forward_max ? Math.min(remaining, rule.carry_forward_max) : remaining;
      if (carry <= 0) continue;

      let newBal = await prisma.leaveBalance.findUnique({
        where: { faculty_id_leave_type_id_academic_year: { faculty_id: pb.faculty_id, leave_type_id: rule.leave_type_id, academic_year: to_academic_year } },
      });
      if (!newBal) {
        newBal = await prisma.leaveBalance.create({
          data: { faculty_id: pb.faculty_id, leave_type_id: rule.leave_type_id, academic_year: to_academic_year, total_days: 0, used_days: 0, pending_days: 0, carried_forward: 0 },
        });
      }
      await prisma.leaveBalance.update({
        where: { faculty_id_leave_type_id_academic_year: { faculty_id: pb.faculty_id, leave_type_id: rule.leave_type_id, academic_year: to_academic_year } },
        data: { total_days: { increment: carry }, carried_forward: { increment: carry } },
      });
      await prisma.leaveCreditLog.create({
        data: {
          faculty_id: pb.faculty_id, leave_type_id: rule.leave_type_id,
          academic_year: to_academic_year, credit_type: "CARRY_FORWARD",
          days_credited: carry, balance_before: newBal.total_days, balance_after: newBal.total_days + carry,
          rule_id: rule.id, note: `Carry forward from ${from_academic_year}`, created_by: actingUser?.id || "SYSTEM",
        },
      }).catch(() => { });
      results.push({ faculty_id: pb.faculty_id, carried: carry, leave_type: rule.leave_type.code });
    }
  }
  return { carried: results.length, results };
};

// ── Credit log ────────────────────────────────────────────────
export const getCreditLog = async ({ faculty_id, academic_year, leave_type_id } = {}) => {
  if (!prisma.leaveCreditLog) return [];
  const where = {};
  if (faculty_id) where.faculty_id = faculty_id;
  if (academic_year) where.academic_year = academic_year;
  if (leave_type_id) where.leave_type_id = leave_type_id;
  return prisma.leaveCreditLog.findMany({
    where,
    include: { leave_type: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
};

// backend/modules/holiday/holiday.service.js

// ── Holiday CRUD ───────────────────────────────────────────────
export const getHolidays = ({ session_id, dept_id, from, to } = {}) =>
  prisma.holiday.findMany({
    where: {
      is_active: true,
      ...(session_id ? { session_id } : {}),
      ...(dept_id ? { OR: [{ dept_id }, { dept_id: null }] } : { dept_id: null }),
      ...(from ? { date: { gte: new Date(from) } } : {}),
      ...(to ? { date: { lte: new Date(to) } } : {}),
    },
    orderBy: { date: "asc" },
  });

export const createHoliday = async ({ date, name, type, session_id, dept_id }, created_by) => {
  const hol = await prisma.holiday.create({
    data: {
      date: new Date(date),
      name,
      type: type || "GENERAL",
      session_id: session_id || null,
      dept_id: dept_id || null,
      is_active: true,
      created_by,
    },
  });

  // Delete timetable entries for that date (mark as holiday in TT)
  const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayName = DAYS[new Date(date + "T12:00:00").getDay()];

  // Create holiday substitution entries — mark as holiday in attendance
  // Instead of deleting TT entries, we just flag the date as holiday
  // so attendance marks auto as HOLIDAY

  return hol;
};

export const updateHoliday = (id, data) =>
  prisma.holiday.update({ where: { id }, data });

export const deleteHoliday = (id) =>
  prisma.holiday.update({ where: { id }, data: { is_active: false } });

// ── Check if a date is holiday ─────────────────────────────────
export const isHoliday = async (date, dept_id = null) => {
  const hol = await prisma.holiday.findFirst({
    where: {
      date: new Date(date),
      is_active: true,
      OR: [{ dept_id: null }, ...(dept_id ? [{ dept_id }] : [])],
    },
  });
  return hol;
};

// ── Auto-mark attendance as HOLIDAY for a date ─────────────────
export const autoMarkHoliday = async (holiday_id) => {
  const hol = await prisma.holiday.findUnique({ where: { id: holiday_id } });
  if (!hol) throw new Error("Holiday not found");

  // Find all sections
  const sections = await prisma.section.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, dept_id: true },
  });

  const filteredSections = hol.dept_id
    ? sections.filter(s => s.dept_id === hol.dept_id)
    : sections;

  // Get all period configs for that day
  const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayName = DAYS[new Date(hol.date).getDay()];

  const periods = await prisma.periodConfig.findMany({
    where: { is_active: true, type: "LECTURE", days: { has: dayName } },
  });

  // Get all students in filtered sections
  let marked = 0;
  for (const section of filteredSections) {
    const students = await prisma.student.findMany({
      where: { section_id: section.id, status: "ACTIVE" },
      select: { id: true },
    });
    for (const period of periods) {
      for (const student of students) {
        await prisma.studentAttendance.upsert({
          where: {
            student_id_section_id_date_period_config_id: {
              student_id: student.id,
              section_id: section.id,
              date: new Date(hol.date),
              period_config_id: period.id,
            },
          },
          create: {
            student_id: student.id,
            section_id: section.id,
            date: new Date(hol.date),
            period_config_id: period.id,
            status: "HOLIDAY",
            attendance_type: "HOLIDAY",
            marked_at: new Date(),
            marked_by: hol.created_by || "system",
          },
          update: { status: "HOLIDAY", attendance_type: "HOLIDAY" },
        }).catch(() => { });
        marked++;
      }
    }
  }
  return { holiday: hol, marked };
};