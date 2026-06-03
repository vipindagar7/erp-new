import xlsx from "xlsx";

import { programTemplate } from "../shared/template.helper.js";
import prisma from "../../utils/prisma.js";

const include = {
  department: { select: { id: true, name: true } },
  _count: { select: { courses: true } },
};

export const getAllPrograms = async ({ limit = 200, page = 1, search, dept_id } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (dept_id) where.dept_id = dept_id;
  const [programs, total] = await Promise.all([
    prisma.program.findMany({ where, skip, take: limit, orderBy: [{ name: "asc" }], include: { department: true } }),
    prisma.program.count({ where }),
  ]);
  return { programs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getProgramById = (id) => prisma.program.findUnique({ where: { id }, include });

export const createProgram = (data) =>
  prisma.program.create({ data: { name: data.name, dept_id: data.dept_id }, include });

export const updateProgram = (id, data) =>
  prisma.program.update({ where: { id }, data: { name: data.name, dept_id: data.dept_id }, include });

export const deleteProgram = async (id) => {
  const count = await prisma.course.count({ where: { program_id: id } });
  if (count > 0) {
    const err = new Error(`Cannot delete: this program has ${count} course${count !== 1 ? "s" : ""} associated with it. Remove them first.`);
    err.status = 400; throw err;
  }
  return prisma.program.delete({ where: { id } });
};

export const bulkCreatePrograms = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], total: rows.length };

  for (const row of rows) {
    const name = String(row["Name*"] || row.name || "").trim();
    const dept_id = String(row["Department ID*"] || row.dept_id || "").trim();
    if (!name || !dept_id) { results.failed.push({ row, reason: "Name and Department ID required" }); continue; }
    try {
      const dept = await prisma.department.findUnique({ where: { id: dept_id } });
      if (!dept) { results.failed.push({ row, reason: `Department not found: ${dept_id}` }); continue; }
      const p = await prisma.program.create({ data: { name, dept_id } });
      results.created.push({ id: p.id, name: p.name });
    } catch (e) { results.failed.push({ row, reason: e.message }); }
  }
  return results;
};

export const getProgramTemplate = programTemplate;