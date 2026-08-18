// backend/modules/leave/student.leave.service.js
import prisma from "../../utils/prisma.js";

const notFound = (msg="Leave not found") => Object.assign(new Error(msg), { status: 404 });

// Student applies for leave
export const applyLeave = async (student_id, { from_date, to_date, reason, documents = [] }) => {
  const from = new Date(from_date);
  const to   = new Date(to_date);
  const total_days = Math.ceil((to - from) / (1000*60*60*24)) + 1;

  const leave = await prisma.studentLeave.create({
    data: { student_id, from_date: from, to_date: to, total_days, reason, documents, status: "PENDING" },
  });

  // Find CC (Class Coordinator for student's section)
  const student = await prisma.student.findUnique({
    where: { id: student_id },
    include: { section: { include: { coordinator: true } }, enrollment: { include: { section: true } } },
  });

  const section = student?.section || student?.enrollment?.section;

  // Create approval steps: Step 1 = CC, Step 2 = HOD, Step 3 = Director
  await prisma.studentLeaveApproval.createMany({
    data: [
      { leave_id: leave.id, step: 1, role: "CLASS_COORDINATOR", approver_id: section?.class_coordinator_id || null },
      { leave_id: leave.id, step: 2, role: "HOD",               approver_id: student?.department?.hod_id || null },
      { leave_id: leave.id, step: 3, role: "DIRECTOR",          approver_id: null },
    ],
  });

  return leave;
};

// Approve / reject a step
export const processApproval = async (leave_id, step, action, approver_id, remarks) => {
  const approval = await prisma.studentLeaveApproval.findFirst({ where: { leave_id, step } });
  if (!approval) throw notFound("Approval step not found");

  const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

  await prisma.studentLeaveApproval.update({
    where: { id: approval.id },
    data:  { status, approver_id, remarks, acted_at: new Date() },
  });

  // If rejected at any step → reject whole leave
  if (status === "REJECTED") {
    await prisma.studentLeave.update({ where: { id: leave_id }, data: { status: "REJECTED", remarks } });
    return { status: "REJECTED", step };
  }

  // If approved at step 3 (Director) → fully approved
  if (step === 3 && status === "APPROVED") {
    await prisma.studentLeave.update({ where: { id: leave_id }, data: { status: "APPROVED", approved_by: approver_id, approved_at: new Date() } });
    return { status: "APPROVED", final: true };
  }

  // Otherwise forward to next step
  await prisma.studentLeaveApproval.update({
    where: { leave_id_step: { leave_id, step: step + 1 } },
    data:  { status: "PENDING" },
  }).catch(() => {});

  return { status: "FORWARDED", next_step: step + 1 };
};

export const getLeave        = async (id) => prisma.studentLeave.findUnique({ where: { id }, include: { approvals: true, student: { select: { id:true, name:true, roll_no:true } } } });
export const listLeaves       = async ({ student_id, status, dept_id, section_id, from_date, to_date } = {}) => {
  const where = {};
  if (student_id) where.student_id = student_id;
  if (status)     where.status     = status;
  if (from_date)  where.from_date  = { gte: new Date(from_date) };
  if (to_date)    where.to_date    = { lte: new Date(to_date) };
  return prisma.studentLeave.findMany({ where, include: { student: { select: { id:true, name:true, roll_no:true, section: { select: { name:true } } } }, approvals: true }, orderBy: { createdAt: "desc" } });
};

export const cancelLeave = async (id, student_id) => {
  const leave = await prisma.studentLeave.findFirst({ where: { id, student_id } });
  if (!leave) throw notFound();
  if (leave.status !== "PENDING") throw Object.assign(new Error("Can only cancel pending leaves"), { status: 400 });
  return prisma.studentLeave.update({ where: { id }, data: { status: "CANCELLED" } });
};

// Get pending approvals for a role
export const getPendingApprovals = async (role, approver_id) =>
  prisma.studentLeaveApproval.findMany({
    where: { role, status: "PENDING", OR: [{ approver_id }, { approver_id: null }] },
    include: { leave: { include: { student: { select: { id:true, name:true, roll_no:true, section: { select: { name:true } } } } } } },
    orderBy: { createdAt: "asc" },
  });
