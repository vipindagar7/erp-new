import xlsx from "xlsx";
import { departmentTemplate } from "../shared/template.helper.js";
import prisma from "../../utils/prisma.js";

const deptInclude = {
  _count: { select: { programs: true, faculties: true, students: true } },
};

// ── GET ALL ────────────────────────────────────────────────────
export const getAllDepartments = async ({ limit = 20, page = 1, search } = {}) => {
  const skip = (page - 1) * limit;
  const where = search ? { name: { contains: search, mode: "insensitive" } } : {};
  const [departments, total] = await Promise.all([
    prisma.department.findMany({ where, skip, take: limit, orderBy: [{ name: "asc" }] }),
    prisma.department.count({ where }),
  ]);
  return { departments, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getDepartmentById = (id) =>
  prisma.department.findUnique({ where: { id }, include: deptInclude });

// ── CREATE ─────────────────────────────────────────────────────
export const createDepartment = (data) =>
  prisma.department.create({ data: { name: data.name }, include: deptInclude });

// ── UPDATE ─────────────────────────────────────────────────────
export const updateDepartment = (id, data) =>
  prisma.department.update({ where: { id }, data: { name: data.name }, include: deptInclude });

// ── DELETE ─────────────────────────────────────────────────────
export const deleteDepartment = async (id) => {
  const count = await prisma.program.count({ where: { dept_id: id } });
  if (count > 0) {
    const err = new Error(`Cannot delete: this department has ${count} program${count !== 1 ? "s" : ""} associated with it. Remove them first.`);
    err.status = 400; throw err;
  }
  return prisma.department.delete({ where: { id } });
};

// ── BULK CREATE ────────────────────────────────────────────────
export const bulkCreateDepartments = async (buffer) => {
  const rows = xlsx.utils.sheet_to_json(
    xlsx.read(buffer, { type: "buffer" }).Sheets["Data"] ||
    xlsx.read(buffer, { type: "buffer" }).Sheets[Object.keys(xlsx.read(buffer, { type: "buffer" }).Sheets)[0]],
    { defval: "" }
  );
  const results = { created: [], failed: [], total: rows.length };
  for (const row of rows) {
    const name = String(row["Name*"] || row["Name"] || row.name || "").trim();
    if (!name) { results.failed.push({ row, reason: "Name is required" }); continue; }
    try {
      const dept = await prisma.department.create({ data: { name } });
      results.created.push({ id: dept.id, name: dept.name });
    } catch (e) {
      results.failed.push({ row, reason: e.message.includes("Unique") ? `"${name}" already exists` : e.message });
    }
  }
  return results;
};

export const getDepartmentTemplate = departmentTemplate;