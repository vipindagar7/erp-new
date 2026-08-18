// backend/modules/attendance/extra.service.js
import prisma from "../../utils/prisma.js";

export const grantExtra = async (student_ids, { units, reason, type, session_id, subject_id, section_id, effective_date }, granted_by) => {
  const results = [];
  for (const student_id of student_ids) {
    const r = await prisma.extraAttendance.create({
      data: { student_id, session_id, subject_id:subject_id||null, section_id:section_id||null, units, reason, type:type||"EXTRA", granted_by, effective_date:new Date(effective_date) },
    });
    results.push(r);
  }
  return results;
};

export const listExtra = async ({ student_id, session_id, section_id } = {}) => {
  const where = {};
  if (student_id) where.student_id = student_id;
  if (session_id) where.session_id = session_id;
  if (section_id) where.section_id = section_id;
  return prisma.extraAttendance.findMany({ where, orderBy:{ granted_at:"desc" }, include:{ student:{ select:{ id:true, name:true, roll_no:true } } } });
};

export const calcClassesNeeded = async (student_id, subject_id, target_pct=75) => {
  const att = await prisma.studentAttendance.aggregate({
    where:{ student_id, subject_id:subject_id||undefined },
    _count:{ id:true },
  });
  const present = await prisma.studentAttendance.count({
    where:{ student_id, subject_id:subject_id||undefined, status:{ in:["PRESENT","LATE"] } },
  });
  const total = att._count.id;
  const extra = await prisma.extraAttendance.aggregate({
    where:{ student_id, subject_id:subject_id||undefined },
    _sum:{ units:true },
  });
  const extraUnits    = extra._sum.units || 0;
  const effectPresent = present + extraUnits;
  const currentPct    = total>0 ? (effectPresent/total)*100 : 0;
  let needed = 0;
  if (currentPct < target_pct) needed = Math.ceil((target_pct*total - 100*effectPresent)/(100-target_pct));
  return { student_id, subject_id, total_classes:total, present:effectPresent, current_pct:+currentPct.toFixed(1), target_pct, classes_needed:Math.max(0,needed) };
};