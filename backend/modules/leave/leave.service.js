// backend/modules/leave/leave.service.js
import prisma from "../../utils/prisma.js";

const currentAY = () => {
  const now = new Date();
  const yr  = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${yr}-${String(yr + 1).slice(2)}`;
};

// ─────────────────────────────────────────────────────────────
// LEAVE TYPES (HR manages)
// ─────────────────────────────────────────────────────────────
export const getLeaveTypes = (filters = {}) =>
  prisma.leaveType.findMany({
    where: { is_active: true, ...filters },
    orderBy: { name: "asc" },
  });

export const createLeaveType = (data) =>
  prisma.leaveType.create({ data });

export const updateLeaveType = (id, data) =>
  prisma.leaveType.update({ where: { id }, data });

export const deleteLeaveType = (id) =>
  prisma.leaveType.update({ where: { id }, data: { is_active: false } });

// ─────────────────────────────────────────────────────────────
// LEAVE BALANCE
// ─────────────────────────────────────────────────────────────
export const getFacultyBalances = async (faculty_id) => {
  const ay = currentAY();
  const types = await prisma.leaveType.findMany({ where: { is_active: true } });
  const balances = await prisma.leaveBalance.findMany({
    where: { faculty_id, academic_year: ay },
    include: { leave_type: true },
  });

  // Return all types with balance (create default if missing)
  return types.map(lt => {
    const bal = balances.find(b => b.leave_type_id === lt.id);
    return {
      leave_type_id:   lt.id,
      code:            lt.code,
      name:            lt.name,
      requires_document: lt.requires_document,
      balance_required: lt.max_days_per_year > 0,
      total:           bal?.total_days ?? lt.max_days_per_year,
      used:            bal?.used_days  ?? 0,
      pending:         bal?.pending_days ?? 0,
      carried_forward: bal?.carried_forward ?? 0,
      remaining:       (bal?.total_days ?? lt.max_days_per_year) - (bal?.used_days ?? 0) - (bal?.pending_days ?? 0),
    };
  });
};

// ─────────────────────────────────────────────────────────────
// TIMETABLE ON LEAVE DATES (for transfer check)
// ─────────────────────────────────────────────────────────────
export const getLecturesOnDates = async (faculty_id, from_date, to_date) => {
  const start = new Date(from_date);
  const end   = new Date(to_date);
  const DAYS  = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  // Get faculty timetable entries
  const entries = await prisma.timetableEntry.findMany({
    where: { faculty_id },
    include: {
      period_config: true,
      subject:  { select: { id: true, name: true, code: true } },
      timetable:{ include: { section: { select: { id: true, name: true } } } },
    },
    orderBy: [{ day: "asc" }, { period_config: { order: "asc" } }],
  });

  // Expand to actual dates
  const lectures = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayName = DAYS[d.getDay()];
    const dateStr = d.toISOString().slice(0, 10);
    const dayEntries = entries.filter(e => e.day === dayName);

    for (const e of dayEntries) {
      // Check if not already substituted
      const existingSub = await prisma.substitution.findFirst({
        where: {
          entry_id:           e.id,
          date:               new Date(dateStr),
          original_faculty_id:faculty_id,
          status:             { in: ["PENDING","ACCEPTED"] },
        },
      }).catch(() => null);

      lectures.push({
        entry_id:     e.id,
        date:         dateStr,
        day:          dayName,
        period_name:  e.period_config?.name,
        start_time:   e.period_config?.start_time,
        end_time:     e.period_config?.end_time,
        subject_name: e.subject?.name,
        subject_code: e.subject?.code,
        section_name: e.timetable?.section?.name,
        section_id:   e.timetable?.section?.id,
        timetable_id: e.timetable_id,
        substitution: existingSub
          ? { id: existingSub.id, status: existingSub.status, substitute_id: existingSub.substitute_faculty_id }
          : null,
        transfer_needed:  !existingSub,
        transfer_done:    existingSub?.status === "ACCEPTED",
      });
    }
  }
  return lectures;
};

// ─────────────────────────────────────────────────────────────
// SUBSTITUTION REQUEST
// ─────────────────────────────────────────────────────────────
export const requestSubstitution = async (
  entry_id, date, original_faculty_id, substitute_faculty_id, reason, leave_id = null
) => {
  // Check substitute is free on that slot
  const entry = await prisma.timetableEntry.findUnique({
    where: { id: entry_id },
    select: { period_config_id: true, timetable: { select: { session_id: true } } },
  });

  const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const dayName = DAYS[new Date(date + "T12:00:00").getDay()];

  const clash = await prisma.timetableEntry.findFirst({
    where: {
      faculty_id:       substitute_faculty_id,
      period_config_id: entry.period_config_id,
      day:              dayName,
      timetable:        { session_id: entry.timetable?.session_id },
    },
  });
  if (clash) throw Object.assign(new Error("Substitute faculty is busy at this slot"), { status: 409 });

  return prisma.substitution.create({
    data: {
      entry_id,
      date:                  new Date(date),
      original_faculty_id,
      substitute_faculty_id,
      reason,
      leave_id,
      status:                "PENDING",
    },
  });
};

export const respondSubstitution = async (sub_id, faculty_id, accept, note = "") => {
  const sub = await prisma.substitution.findUnique({ where: { id: sub_id } });
  if (!sub) throw Object.assign(new Error("Request not found"), { status: 404 });
  if (sub.substitute_faculty_id !== faculty_id)
    throw Object.assign(new Error("Not your request"), { status: 403 });
  if (sub.status !== "PENDING")
    throw Object.assign(new Error("Already responded"), { status: 400 });

  return prisma.substitution.update({
    where: { id: sub_id },
    data: {
      status:       accept ? "ACCEPTED" : "REJECTED",
      responded_at: new Date(),
      response_note: note,
    },
  });
};

export const getMySubstitutionRequests = (faculty_id) =>
  prisma.substitution.findMany({
    where: { substitute_faculty_id: faculty_id, status: "PENDING" },
    include: {
      original_faculty: { select: { name: true } },
      entry: {
        include: {
          period_config: true,
          subject: { select: { name: true } },
          timetable: { include: { section: { select: { name: true } } } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

// ─────────────────────────────────────────────────────────────
// LEAVE APPLICATION
// ─────────────────────────────────────────────────────────────
export const applyLeave = async ({
  faculty_id, leave_type_id, from_date, to_date,
  half_day, half_day_period, reason, documents = [], hod_id,
}) => {
  // 1. Check balance if required
  const leaveType = await prisma.leaveType.findUnique({ where: { id: leave_type_id } });
  if (!leaveType) throw Object.assign(new Error("Leave type not found"), { status: 404 });

  if (leaveType.max_days_per_year > 0) {
    const balances = await getFacultyBalances(faculty_id);
    const bal = balances.find(b => b.leave_type_id === leave_type_id);
    if (!bal || bal.remaining <= 0)
      throw Object.assign(new Error(`No ${leaveType.name} balance remaining`), { status: 400 });
  }

  // 2. Check ALL lectures are transferred (substitution ACCEPTED)
  const lectures = await getLecturesOnDates(faculty_id, from_date, to_date);
  const pending = lectures.filter(l => l.transfer_needed && !l.transfer_done);
  if (pending.length > 0)
    throw Object.assign(new Error(
      `${pending.length} lecture(s) still pending transfer. Get all substitutions accepted before applying.`
    ), { status: 400, pending_lectures: pending });

  // 3. Calculate total days
  const start = new Date(from_date);
  const end   = new Date(to_date);
  const total_days = half_day ? 0.5 :
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 4. Get HOD (if not provided, find from faculty dept)
  let hodId = hod_id;
  if (!hodId) {
    const faculty = await prisma.faculty.findUnique({
      where:   { id: faculty_id },
      include: { department: { include: { hod: true } } },
    });
    hodId = faculty?.department?.hod?.id;
  }
  if (!hodId) throw Object.assign(new Error("HOD not found for approval"), { status: 400 });

  // 5. Create application
  const app = await prisma.leaveApplication.create({
    data: {
      faculty_id,
      leave_type_id,
      from_date:   new Date(from_date),
      to_date:     new Date(to_date),
      total_days,
      half_day:    half_day || false,
      half_day_period,
      reason,
      documents,
      status:      "PENDING",
      current_level: 1,
      approvalSteps: {
        create: [{
          approver_id:  hodId,
          approver_role:"HOD",
          level:        1,
          status:       "PENDING",
        }],
      },
    },
    include: { leave_type: true, approvalSteps: true },
  });

  // 6. Update balance pending
  const ay = currentAY();
  await prisma.leaveBalance.upsert({
    where: { faculty_id_leave_type_id_academic_year: { faculty_id, leave_type_id, academic_year: ay } },
    create: { faculty_id, leave_type_id, academic_year: ay, total_days: leaveType.max_days_per_year, pending_days: total_days },
    update: { pending_days: { increment: total_days } },
  });

  return app;
};

export const getMyApplications = (faculty_id, status) =>
  prisma.leaveApplication.findMany({
    where: { faculty_id, ...(status ? { status } : {}) },
    include: {
      leave_type: true,
      approvalSteps: {
        include: { approver: { select: { name: true } } },
        orderBy: { level: "asc" },
      },
      substitutions: {
        include: {
          substitute: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

// ─────────────────────────────────────────────────────────────
// HOD APPROVAL
// ─────────────────────────────────────────────────────────────
export const getPendingForHod = (hod_faculty_id) =>
  prisma.leaveApplication.findMany({
    where: {
      status: "PENDING",
      approvalSteps: {
        some: {
          approver_id: hod_faculty_id,
          status:      "PENDING",
        },
      },
    },
    include: {
      faculty:    { select: { name: true, emp_id: true, department: { select: { name: true } } } },
      leave_type: true,
      approvalSteps: { include: { approver: { select: { name: true } } }, orderBy: { level: "asc" } },
      substitutions: { include: { substitute: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

export const approveLeave = async (application_id, hod_faculty_id, approve, remarks = "") => {
  const step = await prisma.leaveApprovalStep.findFirst({
    where: { application_id, approver_id: hod_faculty_id, status: "PENDING" },
  });
  if (!step) throw Object.assign(new Error("No pending approval step found"), { status: 404 });

  const newStatus = approve ? "APPROVED" : "REJECTED";

  await prisma.$transaction([
    prisma.leaveApprovalStep.update({
      where: { id: step.id },
      data:  { status: newStatus, remarks, actioned_at: new Date() },
    }),
    prisma.leaveApplication.update({
      where: { id: application_id },
      data:  { status: newStatus, remarks },
    }),
  ]);

  // Update balance if approved
  if (approve) {
    const app = await prisma.leaveApplication.findUnique({
      where: { id: application_id },
      select: { faculty_id: true, leave_type_id: true, total_days: true },
    });
    const ay = currentAY();
    await prisma.leaveBalance.updateMany({
      where: { faculty_id: app.faculty_id, leave_type_id: app.leave_type_id, academic_year: ay },
      data: {
        used_days:    { increment: app.total_days },
        pending_days: { decrement: app.total_days },
      },
    });
  }

  return { status: newStatus };
};

export const cancelLeave = async (application_id, faculty_id) => {
  const app = await prisma.leaveApplication.findUnique({
    where: { id: application_id },
    select: { faculty_id: true, status: true, leave_type_id: true, total_days: true },
  });
  if (!app || app.faculty_id !== faculty_id)
    throw Object.assign(new Error("Not found"), { status: 404 });
  if (!["PENDING","APPROVED"].includes(app.status))
    throw Object.assign(new Error("Cannot cancel"), { status: 400 });

  await prisma.leaveApplication.update({
    where: { id: application_id },
    data:  { status: "CANCELLED", cancelled_by: faculty_id, cancelled_at: new Date() },
  });

  const ay = currentAY();
  await prisma.leaveBalance.updateMany({
    where: { faculty_id, leave_type_id: app.leave_type_id, academic_year: ay },
    data: app.status === "PENDING"
      ? { pending_days: { decrement: app.total_days } }
      : { used_days:    { decrement: app.total_days } },
  });

  return { cancelled: true };
};

// ─────────────────────────────────────────────────────────────
// ATTENDANCE — Lab consecutive + special session
// ─────────────────────────────────────────────────────────────
export const markAttendance = async ({
  date, faculty_id, timetable_id, period_config_id,
  section_id, records, // [{ student_id, status }]
  special_session_id = null,
  attendance_type = "REGULAR", // REGULAR | EXTRA | SPECIAL
}) => {
  const dateObj = new Date(date);

  // For each student, upsert attendance
  const results = [];
  for (const r of records) {
    const att = await prisma.studentAttendance.upsert({
      where: {
        student_id_section_id_date_period_config_id: {
          student_id:       r.student_id,
          section_id,
          date:             dateObj,
          period_config_id,
        },
      },
      create: {
        student_id:        r.student_id,
        section_id,
        date:              dateObj,
        period_config_id,
        faculty_id,
        timetable_id,
        status:            r.status || "PRESENT",
        attendance_type,
        special_session_id,
        marked_at:         new Date(),
        marked_by:         faculty_id,
      },
      update: {
        status:  r.status || "PRESENT",
        marked_at: new Date(),
        marked_by: faculty_id,
      },
    }).catch(e => ({ error: e.message, student_id: r.student_id }));
    results.push(att);
  }
  return {
    total:   records.length,
    marked:  results.filter(r => !r.error).length,
    errors:  results.filter(r => r.error),
  };
};

// Get attendance summary for a section
export const getAttendanceSummary = async (section_id, from_date, to_date) => {
  const records = await prisma.studentAttendance.findMany({
    where: {
      section_id,
      date: { gte: new Date(from_date), lte: new Date(to_date) },
    },
    include: {
      student:      { select: { name: true, roll_no: true } },
      period_config:{ select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { period_config: { order: "asc" } }],
  });

  // Group by student
  const studentMap = {};
  for (const r of records) {
    if (!studentMap[r.student_id]) {
      studentMap[r.student_id] = {
        student_id: r.student_id,
        name: r.student?.name,
        roll_no: r.student?.roll_no,
        total: 0, present: 0, absent: 0, late: 0,
      };
    }
    studentMap[r.student_id].total++;
    if (r.status === "PRESENT") studentMap[r.student_id].present++;
    else if (r.status === "ABSENT") studentMap[r.student_id].absent++;
    else if (r.status === "LATE") studentMap[r.student_id].late++;
  }

  return Object.values(studentMap).map(s => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  }));
};