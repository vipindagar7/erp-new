// backend/modules/faculty/faculty.bulkops.service.js
import prisma from "../../utils/prisma.js";

export const bulkStatusChange = async (faculty_ids, status, changed_by, reason="") => {
  const results = [];
  for (const faculty_id of faculty_ids) {
    try {
      const f = await prisma.faculty.findUnique({ where:{ id:faculty_id } });
      if (!f) { results.push({ faculty_id, success:false, error:"Not found" }); continue; }

      await prisma.faculty.update({ where:{ id:faculty_id }, data:{ status } });

      // Audit trail
      await prisma.facultyCareerHistory.create({
        data:{ faculty_id, action:"STATUS_CHANGE", prev_status:f.status, new_status:status, reason, changed_by },
      }).catch(() => {});

      results.push({ faculty_id, success:true, prev:f.status, new:status });
    } catch(e) {
      results.push({ faculty_id, success:false, error:e.message });
    }
  }
  return results;
};

export const bulkDesignationChange = async (faculty_ids, designation, changed_by, reason="") => {
  const results = [];
  for (const fid of faculty_ids) {
    try {
      const f = await prisma.faculty.update({ where:{ id:fid }, data:{ designation } });
      await prisma.facultyCareerHistory.create({ data:{ faculty_id:fid, action:"DESIGNATION_CHANGE", prev_designation:f.designation, new_designation:designation, reason, changed_by } }).catch(()=>{});
      results.push({ faculty_id:fid, success:true });
    } catch(e) { results.push({ faculty_id:fid, success:false, error:e.message }); }
  }
  return results;
};

export const bulkBlockUnblock = async (faculty_ids, block, changed_by, reason="") => {
  const status = block ? "BLOCKED" : "ACTIVE";
  return bulkStatusChange(faculty_ids, status, changed_by, reason);
};

export const bulkExport = async (faculty_ids) => {
  return prisma.faculty.findMany({
    where: faculty_ids.length ? { id:{ in:faculty_ids } } : {},
    include: { department:{ select:{ name:true } } },
    orderBy: { name:"asc" },
  });
};