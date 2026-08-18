// backend/modules/hr/leave-rules.service.js
import prisma from "../../utils/prisma.js";

// ── Leave Rule Policy ──────────────────────────────────────────

export async function createPolicy(data) {
  return prisma.leaveRulePolicy.create({ data });
}

export async function getPolicies({ session_id, staff_type, is_active }) {
  return prisma.leaveRulePolicy.findMany({
    where: {
      ...(session_id ? { session_id } : {}),
      ...(staff_type ? { staff_type } : {}),
      ...(is_active !== undefined ? { is_active } : {}),
    },
    include: { rules: true, _count: { select: { balances: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPolicyById(id) {
  return prisma.leaveRulePolicy.findUnique({
    where: { id },
    include: { rules: { orderBy: { leave_type: "asc" } } },
  });
}

export async function updatePolicy(id, data) {
  return prisma.leaveRulePolicy.update({ where: { id }, data });
}

// ── Leave Rules within a Policy ────────────────────────────────

export async function upsertRule(policy_id, data) {
  return prisma.leaveRule.upsert({
    where: { policy_id_leave_type: { policy_id, leave_type: data.leave_type } },
    create: { policy_id, ...data },
    update: data,
  });
}

export async function deleteRule(id) {
  return prisma.leaveRule.delete({ where: { id } });
}

// ── Initialize Leave Balances for all faculty in a session ─────

export async function initBalances({ policy_id, session_id, dept_id }) {
  const policy = await prisma.leaveRulePolicy.findUnique({
    where: { id: policy_id },
    include: { rules: true },
  });
  if (!policy) throw new Error("Policy not found");

  // Get all faculty matching criteria
  const where = { status: "ACTIVE" };
  if (dept_id) where.dept_id = dept_id;
  if (policy.staff_type === "TEACHING")     where.is_teaching = true;
  if (policy.staff_type === "NON_TEACHING") where.is_teaching = false;

  const faculty = await prisma.faculty.findMany({ where, select: { id: true } });

  const created = [], skipped = [];
  for (const f of faculty) {
    for (const rule of policy.rules) {
      try {
        await prisma.leaveBalance.upsert({
          where: { faculty_id_session_id_leave_type: { faculty_id: f.id, session_id, leave_type: rule.leave_type } },
          create: { faculty_id: f.id, policy_id, session_id, leave_type: rule.leave_type, allocated: rule.max_per_session, used: 0, pending: 0 },
          update: {},  // don't overwrite existing balance
        });
        created.push(f.id);
      } catch { skipped.push(f.id); }
    }
  }
  return { faculty_count: faculty.length, rule_count: policy.rules.length, created: created.length / policy.rules.length };
}

// ── Get Faculty Leave Balance ──────────────────────────────────

export async function getFacultyBalance(faculty_id, session_id) {
  const balances = await prisma.leaveBalance.findMany({
    where: { faculty_id, session_id },
    include: { policy: { include: { rules: true } } },
  });

  return balances.map(b => {
    const rule = b.policy?.rules?.find(r => r.leave_type === b.leave_type);
    return {
      leave_type:      b.leave_type,
      label:           rule?.label || b.leave_type,
      allocated:       b.allocated,
      used:            b.used,
      pending:         b.pending,
      available:       Math.max(0, b.allocated - b.used - b.pending),
      carried_forward: b.carried_forward,
      max_consecutive: rule?.max_consecutive || 3,
      max_in_month:    rule?.max_in_month    || 2,
      requires_cover:  rule?.requires_cover  ?? true,
      is_slot_based:   rule?.is_slot_based   ?? false,
      min_notice_days: rule?.min_notice_days || 1,
    };
  });
}

// ── Leave Application Validation ──────────────────────────────

export async function validateLeaveApplication({ faculty_id, session_id, leave_type, from_date, to_date, timetable_date }) {
  const errors = [];
  const warnings = [];

  const from = new Date(from_date);
  const to   = new Date(to_date);
  const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

  // 1. Check leave balance
  const balance = await prisma.leaveBalance.findUnique({
    where: { faculty_id_session_id_leave_type: { faculty_id, session_id, leave_type } },
    include: { policy: { include: { rules: { where: { leave_type } } } } },
  });

  if (!balance) {
    errors.push(`No leave balance found for ${leave_type}. Contact HR.`);
    return { valid: false, errors, warnings };
  }

  const available = Math.max(0, balance.allocated - balance.used - balance.pending);
  const rule = balance.policy?.rules?.[0];

  // 2. Balance check
  if (days > available) {
    errors.push(`Insufficient ${leave_type} balance. Available: ${available} day(s), Requested: ${days} day(s).`);
  }

  // 3. Consecutive days check
  if (rule && days > rule.max_consecutive) {
    errors.push(`Cannot take more than ${rule.max_consecutive} consecutive ${leave_type} days.`);
  }

  // 4. Monthly limit check
  const monthStart = new Date(from.getFullYear(), from.getMonth(), 1);
  const monthEnd   = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  const usedThisMonth = await prisma.leave.count({
    where: {
      faculty_id,
      leaveType: { code: leave_type },
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { gte: monthStart, lte: monthEnd },
    },
  }).catch(() => 0);

  if (rule && usedThisMonth + days > rule.max_in_month) {
    errors.push(`Monthly limit exceeded. Max ${rule.max_in_month} ${leave_type} days per month.`);
  }

  // 5. Slot-based check (winter/summer break only)
  if (rule?.is_slot_based) {
    const slot = await prisma.leaveSlot.findFirst({
      where: {
        session_id,
        start_date: { lte: from },
        end_date:   { gte: to },
        is_active:  true,
      },
    });
    if (!slot) {
      errors.push(`${leave_type} can only be taken during designated Winter/Summer Break slots.`);
    }
  }

  // 6. Timetable check — does faculty have classes on these dates?
  if (rule?.requires_cover) {
    const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const leaveDates = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      leaveDates.push(dayNames[d.getDay()]);
    }

    const hasClasses = await prisma.timetableEntry.findFirst({
      where: {
        faculty_id,
        day: { in: leaveDates },
        is_active: true,
      },
    }).catch(() => null);

    if (hasClasses) {
      // Check if cover faculty is assigned
      warnings.push(`You have classes on leave day(s). You must assign cover faculty before applying.`);
    }
  }

  // 7. Min notice days
  if (rule) {
    const today   = new Date();
    const notice  = Math.ceil((from - today) / (1000 * 60 * 60 * 24));
    if (notice < rule.min_notice_days) {
      errors.push(`Minimum ${rule.min_notice_days} day(s) notice required for ${leave_type}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    days_requested: days,
    balance_available: available,
    balance_after: available - days,
  };
}

// ── Leave Slots ────────────────────────────────────────────────

export async function createSlot(data) {
  return prisma.leaveSlot.create({ data });
}

export async function getSlots({ session_id, slot_type, is_active }) {
  return prisma.leaveSlot.findMany({
    where: {
      ...(session_id ? { session_id } : {}),
      ...(slot_type  ? { slot_type  } : {}),
      ...(is_active !== undefined ? { is_active } : { is_active: true }),
    },
    orderBy: { start_date: "asc" },
  });
}

export async function updateBalance(faculty_id, session_id, leave_type, delta, field = "used") {
  return prisma.leaveBalance.updateMany({
    where: { faculty_id, session_id, leave_type },
    data: { [field]: { increment: delta } },
  });
}
