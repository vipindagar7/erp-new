// backend/modules/fee/fee.service.js
import prisma from "../../utils/prisma.js";

const nf = (msg="Not found") => Object.assign(new Error(msg), { status:404 });

// ── FEE STRUCTURE ─────────────────────────────────────────────
export const listStructures = async ({ session_id, program_id, branch_id } = {}) => {
  const where = { is_active:true };
  if (session_id) where.session_id = session_id;
  if (program_id) where.program_id = program_id;
  if (branch_id)  where.branch_id  = branch_id;
  return prisma.feeStructure.findMany({ where, orderBy:{ createdAt:"desc" } });
};

export const createStructure = async (data, created_by) =>
  prisma.feeStructure.create({ data:{ ...data, created_by } });

export const updateStructure = async (id, data) =>
  prisma.feeStructure.update({ where:{ id }, data });

// ── SCHOLARSHIPS ──────────────────────────────────────────────
export const listScholarships = async () => prisma.scholarship.findMany({ where:{ is_active:true } });
export const createScholarship = async (data) => prisma.scholarship.create({ data });

// ── STUDENT FEE PAYMENTS ──────────────────────────────────────
export const getStudentFee = async (student_id, session_id) =>
  prisma.feePayment.findMany({ where:{ student_id, session_id }, include:{ scholarship:true, fee_structure:true }, orderBy:{ installment_no:"asc" } });

export const initStudentFee = async (student_id, fee_structure_id, session_id, created_by) => {
  const struct = await prisma.feeStructure.findUnique({ where:{ id:fee_structure_id } });
  if (!struct) throw nf("Fee structure not found");

  const installmentAmt = struct.total_amount / struct.installments;
  const payments = [];
  for (let i = 1; i <= struct.installments; i++) {
    payments.push({
      student_id, fee_structure_id, session_id,
      total_amount: struct.total_amount,
      paid_amount:  0,
      due_amount:   installmentAmt,
      status:       "PENDING",
      installment_no: i,
    });
  }

  return prisma.feePayment.createMany({ data: payments, skipDuplicates:true });
};

export const recordPayment = async (payment_id, { payment_date, payment_mode, receipt_no, amount, transaction_ref, bank_ref, remarks }, received_by) => {
  const p = await prisma.feePayment.findUnique({ where:{ id:payment_id } });
  if (!p) throw nf("Payment record not found");

  const new_paid = (p.paid_amount || 0) + amount;
  const new_due  = Math.max(0, p.due_amount - amount);
  const status   = new_due <= 0 ? "PAID" : new_paid > 0 ? "PARTIAL" : "PENDING";

  return prisma.feePayment.update({
    where: { id: payment_id },
    data:  { paid_amount:new_paid, due_amount:new_due, status, payment_date:payment_date?new Date(payment_date):new Date(), payment_mode, receipt_no, transaction_ref, bank_ref, remarks, received_by },
  });
};

export const applyScholarship = async (payment_id, scholarship_id, waiver_amount, waiver_reason) => {
  const s = await prisma.scholarship.findUnique({ where:{ id:scholarship_id } });
  if (!s) throw nf("Scholarship not found");
  return prisma.feePayment.update({
    where: { id:payment_id },
    data:  { scholarship_id, waiver_amount, waiver_reason, status:"SCHOLARSHIP" },
  });
};

export const waiveFee = async (payment_id, waiver_amount, waiver_reason, waived_by) =>
  prisma.feePayment.update({ where:{ id:payment_id }, data:{ waiver_amount, waiver_reason, status:"WAIVED", verified_by:waived_by, verified_at:new Date() } });

export const getDefaultersList = async (session_id) =>
  prisma.student.findMany({
    where: { feePayments:{ some:{ session_id, status:{ in:["PENDING","OVERDUE","PARTIAL"] } } }, status:"ACTIVE" },
    select: { id:true, name:true, roll_no:true, section:{ select:{ name:true } }, feePayments:{ where:{ session_id }, select:{ due_amount:true, status:true, installment_no:true } } },
  });

export const getCollectionSummary = async (session_id) => {
  const [total, paid, pending] = await Promise.all([
    prisma.feePayment.aggregate({ where:{ session_id }, _sum:{ total_amount:true, paid_amount:true, waiver_amount:true } }),
    prisma.feePayment.count({ where:{ session_id, status:"PAID" } }),
    prisma.feePayment.count({ where:{ session_id, status:{ in:["PENDING","OVERDUE"] } } }),
  ]);
  return { total_expected:total._sum.total_amount||0, total_collected:total._sum.paid_amount||0, total_waivers:total._sum.waiver_amount||0, paid_count:paid, pending_count:pending };
};
