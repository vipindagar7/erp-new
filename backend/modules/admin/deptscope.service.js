import prisma from "../../utils/prisma.js";

export const grantScope    = async (user_id, dept_id, role, modules, granted_by) =>
  prisma.adminDeptScope.upsert({
    where:  { user_id_dept_id:{ user_id, dept_id } },
    update: { role, modules, is_active:true, granted_by },
    create: { user_id, dept_id, role, modules, granted_by },
  });
export const revokeScope   = async (user_id, dept_id) =>
  prisma.adminDeptScope.update({ where:{ user_id_dept_id:{ user_id, dept_id } }, data:{ is_active:false } });
export const listScopes    = async ({ user_id, dept_id } = {}) => {
  const where = {};
  if (user_id) where.user_id = user_id;
  if (dept_id) where.dept_id = dept_id;
  return prisma.adminDeptScope.findMany({ where, include:{ dept:{ select:{ id:true, name:true } } } });
};
export const getUserScopes = async (user_id) =>
  prisma.adminDeptScope.findMany({ where:{ user_id, is_active:true }, include:{ dept:true } });
