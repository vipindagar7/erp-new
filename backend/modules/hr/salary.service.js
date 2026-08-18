// backend/modules/hr/salary.service.js
import prisma from "../../utils/prisma.js";

const nf = (msg="Not found") => Object.assign(new Error(msg), { status:404 });

// ── SALARY COMPONENTS ─────────────────────────────────────────
export const listComponents = async () =>
  prisma.salaryComponent.findMany({ where:{ is_active:true }, orderBy:[{ type:"asc" },{ sort_order:"asc" }] });

export const createComponent = async (data, created_by) =>
  prisma.salaryComponent.create({ data:{ ...data, created_by } });

export const updateComponent = async (id, data) =>
  prisma.salaryComponent.update({ where:{ id }, data });

// ── SALARY SLIP GENERATION ────────────────────────────────────
export const generateSlip = async (faculty_id, month, year, { working_days, present_days, lop_days=0, manual_overrides={} }, generated_by) => {
  const faculty    = await prisma.faculty.findUnique({ where:{ id:faculty_id } });
  if (!faculty) throw nf("Faculty not found");

  const components = await listComponents();
  const slipComponents = [];
  let gross = 0, deductions = 0;

  // Base salary from faculty record
  const basic = manual_overrides.BASIC || faculty.basic_salary || 0;

  for (const comp of components) {
    let amount = 0;
    if (comp.calc_type === "FIXED") {
      amount = manual_overrides[comp.code] ?? comp.value;
    } else if (comp.calc_type === "PERCENTAGE_OF_BASIC") {
      amount = (basic * comp.value) / 100;
    } else if (comp.calc_type === "PERCENTAGE_OF_GROSS") {
      amount = (gross * comp.value) / 100;
    }

    // LOP deduction
    if (lop_days > 0 && working_days > 0 && comp.type === "EARNING") {
      amount = amount * (1 - lop_days / working_days);
    }

    amount = +amount.toFixed(2);

    if (comp.type === "EARNING") gross += amount;
    else deductions += amount;

    slipComponents.push({ component_id:comp.id, amount, is_earning:comp.type==="EARNING" });
  }

  const net = +(gross - deductions).toFixed(2);

  // Upsert slip
  const slip = await prisma.salarySlip.upsert({
    where:  { faculty_id_month_year:{ faculty_id, month, year } },
    update: { gross_salary:gross, total_deductions:deductions, net_salary:net, working_days, present_days, lop_days, status:"GENERATED", generated_by, generated_at:new Date() },
    create: { faculty_id, month, year, gross_salary:gross, total_deductions:deductions, net_salary:net, working_days, present_days, lop_days, status:"GENERATED", generated_by, generated_at:new Date() },
  });

  // Replace components
  await prisma.salarySlipComponent.deleteMany({ where:{ slip_id:slip.id } });
  await prisma.salarySlipComponent.createMany({ data: slipComponents.map(c => ({ ...c, slip_id:slip.id })) });

  return slip;
};

export const bulkGenerate = async (month, year, faculty_ids, opts, generated_by) => {
  const results = [];
  for (const faculty_id of faculty_ids) {
    try {
      const r = await generateSlip(faculty_id, month, year, opts, generated_by);
      results.push({ faculty_id, success:true, slip_id:r.id });
    } catch(e) {
      results.push({ faculty_id, success:false, error:e.message });
    }
  }
  return results;
};

export const approveSlip = async (slip_id, approved_by) =>
  prisma.salarySlip.update({ where:{ id:slip_id }, data:{ status:"APPROVED", approved_by, approved_at:new Date() } });

export const markPaid = async (slip_id, paid_by) =>
  prisma.salarySlip.update({ where:{ id:slip_id }, data:{ status:"PAID", paid_by, paid_at:new Date() } });

export const listSlips = async ({ faculty_id, month, year, status, page=1, limit=20 }) => {
  const where = {};
  if (faculty_id) where.faculty_id = faculty_id;
  if (month)      where.month      = +month;
  if (year)       where.year       = +year;
  if (status)     where.status     = status;
  const skip = (page-1)*limit;
  const [items, total] = await Promise.all([
    prisma.salarySlip.findMany({ where, skip, take:+limit, include:{ faculty:{ select:{ id:true, name:true, designation:true, dept_id:true } }, components:{ include:{ component:true } } }, orderBy:[{ year:"desc" },{ month:"desc" }] }),
    prisma.salarySlip.count({ where }),
  ]);
  return { items, total, page:+page, limit:+limit };
};

export const getSlip = async (id) =>
  prisma.salarySlip.findUnique({ where:{ id }, include:{ faculty:{ select:{ id:true, name:true, designation:true, emp_id:true, department:{ select:{ name:true } } } }, components:{ include:{ component:true }, orderBy:{ component:{ sort_order:"asc" } } } } });

export const getHRReport = async ({ month, year, dept_id }) => {
  const where = {};
  if (month) where.month = +month;
  if (year)  where.year  = +year;
  const slips = await prisma.salarySlip.findMany({ where, include:{ faculty:{ where: dept_id?{ dept_id }:{}, select:{ id:true, name:true, designation:true, dept_id:true } } } });
  return {
    total_slips:    slips.length,
    approved:       slips.filter(s => s.status === "APPROVED").length,
    paid:           slips.filter(s => s.status === "PAID").length,
    total_gross:    +slips.reduce((sum,s) => sum+s.gross_salary, 0).toFixed(2),
    total_deductions:+slips.reduce((sum,s) => sum+s.total_deductions, 0).toFixed(2),
    total_net:      +slips.reduce((sum,s) => sum+s.net_salary, 0).toFixed(2),
    slips,
  };
};
