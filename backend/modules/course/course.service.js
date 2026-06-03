import xlsx from "xlsx";

import { courseTemplate } from "../shared/template.helper.js";
import prisma from "../../utils/prisma.js";

const include = {
  program: { include: { department: { select: { id: true, name: true } } } },
  _count: { select: { sections: true } },
};

export const getAllCourses = async ({ limit = 200, page = 1, search, program_id } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (program_id) where.program_id = program_id;
  const [courses, total] = await Promise.all([
    prisma.course.findMany({ where, skip, take: limit, orderBy: [{ name: "asc" }], include: { program: { include: { department: true } } } }),
    prisma.course.count({ where }),
  ]);
  return { courses, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getCourseById = (id) => prisma.course.findUnique({ where: { id }, include });

export const createCourse = (data) =>
  prisma.course.create({ data: { name: data.name, program_id: data.program_id }, include });

export const updateCourse = (id, data) =>
  prisma.course.update({ where: { id }, data: { name: data.name, program_id: data.program_id }, include });

export const deleteCourse = async (id) => {
  const count = await prisma.section.count({ where: { course_id: id } });
  if (count > 0) {
    const err = new Error(`Cannot delete: this course has ${count} section${count !== 1 ? "s" : ""} associated with it. Remove them first.`);
    err.status = 400; throw err;
  }
  return prisma.course.delete({ where: { id } });
};

export const bulkCreateCourses = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], total: rows.length };

  for (const row of rows) {
    const name = String(row["Name*"] || row.name || "").trim();
    const program_id = String(row["Program ID*"] || row.program_id || "").trim();
    if (!name || !program_id) { results.failed.push({ row, reason: "Name and Program ID required" }); continue; }
    try {
      const prog = await prisma.program.findUnique({ where: { id: program_id } });
      if (!prog) { results.failed.push({ row, reason: `Program not found: ${program_id}` }); continue; }
      const c = await prisma.course.create({ data: { name, program_id } });
      results.created.push({ id: c.id, name: c.name });
    } catch (e) { results.failed.push({ row, reason: e.message }); }
  }
  return results;
};

export const getCourseTemplate = courseTemplate;