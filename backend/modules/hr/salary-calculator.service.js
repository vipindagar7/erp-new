// backend/modules/hr/salary-calculator.service.js
import prisma from "../../utils/prisma.js";

// ─────────────────────────────────────────────────────────────
// SALARY CYCLE MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function createCycle({ session_id, month, year, from_date, to_date, notes }) {
  const from = new Date(from_date);
  const to   = new Date(to_date);

  // Calculate calendar days in range
  const total_days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate working days (exclude sundays + holidays)
  const holidays = await prisma.academicCalendarEvent.findMany({
    where: {
      session_id,
      is_holiday: true,
      start_date: { lte: to },
      end_date:   { gte: from },
    },
  });

  let working_days = 0;
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const isSunday  = d.getDay() === 0;
    const isHoliday = holidays.some(h => new Date(h.start_date) <= d && new Date(h.end_date) >= d);
    if (!isSunday && !isHoliday) working_days++;
  }

  return prisma.salaryCycle.upsert({
    where: { session_id_month_year: { session_id, month, year } },
    create: { session_id, month, year, total_days, working_days, from_date: from, to_date: to, notes },
    update: { total_days, working_days, from_date: from, to_date: to, notes },
  });
}

export async function getCycles({ session_id, year }) {
  return prisma.salaryCycle.findMany({
    where: {
      ...(session_id ? { session_id } : {}),
      ...(year ? { year: parseInt(year) } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function lockCycle(id, locked_by) {
  return prisma.salaryCycle.update({
    where: { id },
    data: { is_locked: true, locked_by, locked_at: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────
// SALARY CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────

export async function calculateSalary({ faculty_id, cycle_id, present_days, lop_days, override_working_days }) {
  const [faculty, cycle, components] = await Promise.all([
    prisma.faculty.findUnique({
      where: { id: faculty_id },
      select: { id: true, name: true, emp_id: true, basic_salary: true, designation: true, dept_id: true },
    }),
    prisma.salaryCycle.findUnique({ where: { id: cycle_id } }),
    prisma.salaryComponent.findMany({ where: { is_active: true }, orderBy: { sort_order: "asc" } }),
  ]);

  if (!faculty || !cycle) throw new Error("Faculty or cycle not found");

  const working_days = override_working_days || cycle.working_days;
  const basic = faculty.basic_salary || 0;

  // Per-day salary
  const per_day = working_days > 0 ? basic / working_days : 0;

  // LOP deduction
  const lop_amount = per_day * (lop_days || 0);

  let gross = 0, deductions = 0;
  const slip_components = [];

  for (const comp of components) {
    let amount = 0;

    if (comp.calc_type === "FIXED") {
      amount = comp.value;
    } else if (comp.calc_type === "PERCENTAGE_OF_BASIC") {
      amount = (comp.value / 100) * basic;
    } else if (comp.calc_type === "PERCENTAGE_OF_GROSS") {
      amount = (comp.value / 100) * gross;
    }

    // Pro-rate for present days
    if (working_days > 0 && present_days !== undefined) {
      amount = (amount / working_days) * present_days;
    }

    // Apply LOP for earnings
    if (comp.type === "EARNING") {
      gross += amount;
    } else {
      deductions += amount;
    }

    slip_components.push({
      component_id: comp.id,
      amount: Math.round(amount * 100) / 100,
      is_earning: comp.type === "EARNING",
    });
  }

  // Add LOP deduction
  if (lop_amount > 0) {
    gross -= lop_amount;
    deductions += lop_amount;
  }

  const net_salary = Math.max(0, gross - deductions);

  return {
    faculty_id,
    cycle_id,
    month: cycle.month,
    year: cycle.year,
    working_days,
    present_days: present_days ?? working_days,
    lop_days: lop_days || 0,
    basic_salary: basic,
    gross_salary: Math.round(gross * 100) / 100,
    total_deductions: Math.round(deductions * 100) / 100,
    net_salary: Math.round(net_salary * 100) / 100,
    components: slip_components,
    breakdown: {
      per_day_salary: Math.round(per_day * 100) / 100,
      lop_deduction:  Math.round(lop_amount * 100) / 100,
      days_considered: working_days,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// BULK SALARY GENERATION WITH CYCLE
// ─────────────────────────────────────────────────────────────

export async function bulkGenerate({ cycle_id, faculty_ids, attendance_map = {} }) {
  const cycle = await prisma.salaryCycle.findUnique({ where: { id: cycle_id } });
  if (!cycle) throw new Error("Cycle not found");
  if (cycle.is_locked) throw new Error("This salary cycle is locked");

  const results = [];
  for (const faculty_id of faculty_ids) {
    try {
      const att     = attendance_map[faculty_id] || {};
      const present = att.present_days ?? cycle.working_days;
      const lop     = att.lop_days     ?? 0;

      const calc = await calculateSalary({ faculty_id, cycle_id, present_days: present, lop_days: lop });

      // Upsert slip
      const slip = await prisma.salarySlip.upsert({
        where: { faculty_id_month_year: { faculty_id, month: cycle.month, year: cycle.year } },
        create: {
          faculty_id,
          cycle_id,
          month:            cycle.month,
          year:             cycle.year,
          working_days:     calc.working_days,
          present_days:     calc.present_days,
          lop_days:         calc.lop_days,
          basic_salary:     calc.basic_salary,
          gross_salary:     calc.gross_salary,
          total_deductions: calc.total_deductions,
          net_salary:       calc.net_salary,
          status:           "GENERATED",
        },
        update: {
          working_days:     calc.working_days,
          present_days:     calc.present_days,
          lop_days:         calc.lop_days,
          gross_salary:     calc.gross_salary,
          total_deductions: calc.total_deductions,
          net_salary:       calc.net_salary,
          status:           "GENERATED",
        },
      });

      // Recreate components
      await prisma.salarySlipComponent.deleteMany({ where: { slip_id: slip.id } });
      await prisma.salarySlipComponent.createMany({
        data: calc.components.map(c => ({ ...c, slip_id: slip.id })),
      });

      results.push({ success: true, faculty_id, slip_id: slip.id, net_salary: calc.net_salary });
    } catch (e) {
      results.push({ success: false, faculty_id, error: e.message });
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// SALARY REPORT
// ─────────────────────────────────────────────────────────────

export async function getSalaryReport({ cycle_id, session_id, month, year, dept_id, status }) {
  const where = {};

  if (cycle_id) {
    where.cycle_id = cycle_id;
  } else {
    if (month)  where.month = parseInt(month);
    if (year)   where.year  = parseInt(year);
  }
  if (status) where.status = status;

  const slips = await prisma.salarySlip.findMany({
    where,
    include: {
      faculty: {
        select: {
          id: true, name: true, emp_id: true, designation: true,
          department: { select: { name: true, code: true } },
        },
      },
      cycle: true,
      components: { include: { component: true } },
    },
    orderBy: [{ faculty: { name: "asc" } }],
  });

  // Filter by dept if needed
  const filtered = dept_id ? slips.filter(s => s.faculty?.dept_id === dept_id) : slips;

  const summary = {
    total_slips:       filtered.length,
    generated:         filtered.filter(s => s.status === "GENERATED").length,
    approved:          filtered.filter(s => s.status === "APPROVED").length,
    paid:              filtered.filter(s => s.status === "PAID").length,
    total_gross:       filtered.reduce((sum, s) => sum + (s.gross_salary || 0), 0),
    total_deductions:  filtered.reduce((sum, s) => sum + (s.total_deductions || 0), 0),
    total_net:         filtered.reduce((sum, s) => sum + (s.net_salary || 0), 0),
    total_lop_days:    filtered.reduce((sum, s) => sum + (s.lop_days || 0), 0),
  };

  return { slips: filtered, summary };
}

export async function previewSalary({ faculty_id, from_date, to_date, session_id }) {
  // Ad-hoc preview for any date range — no cycle required
  const from = new Date(from_date);
  const to   = new Date(to_date);
  const total_days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

  // Count sundays
  let sundays = 0;
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) sundays++;
  }

  // Count holidays
  const holidays = session_id ? await prisma.academicCalendarEvent.findMany({
    where: { session_id, is_holiday: true, start_date: { lte: to }, end_date: { gte: from } },
  }) : [];

  let holiday_days = 0;
  for (const h of holidays) {
    for (let d = new Date(Math.max(from, new Date(h.start_date))); d <= Math.min(to, new Date(h.end_date)); d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) holiday_days++;
    }
  }

  const working_days = total_days - sundays - holiday_days;

  // Create temp cycle for calculation
  const tempCycle = { id: "PREVIEW", month: from.getMonth() + 1, year: from.getFullYear(), working_days, is_locked: false };

  const faculty = await prisma.faculty.findUnique({
    where: { id: faculty_id },
    select: { id: true, name: true, basic_salary: true },
  });
  const components = await prisma.salaryComponent.findMany({ where: { is_active: true }, orderBy: { sort_order: "asc" } });

  const basic    = faculty?.basic_salary || 0;
  const per_day  = working_days > 0 ? basic / working_days : 0;

  let gross = 0, deductions = 0;
  const breakdown = [];

  for (const comp of components) {
    let amount = comp.calc_type === "FIXED"
      ? comp.value
      : comp.calc_type === "PERCENTAGE_OF_BASIC"
      ? (comp.value / 100) * basic
      : (comp.value / 100) * gross;

    if (comp.type === "EARNING") gross += amount;
    else deductions += amount;

    breakdown.push({ name: comp.name, code: comp.code, type: comp.type, amount: Math.round(amount * 100) / 100 });
  }

  return {
    faculty_name:    faculty?.name,
    from_date,
    to_date,
    total_days,
    sundays,
    holiday_days,
    working_days,
    per_day_salary:  Math.round(per_day * 100) / 100,
    basic_salary:    basic,
    gross_salary:    Math.round(gross * 100) / 100,
    total_deductions:Math.round(deductions * 100) / 100,
    net_salary:      Math.round(Math.max(0, gross - deductions) * 100) / 100,
    breakdown,
  };
}
