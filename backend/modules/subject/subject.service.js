import xlsx from "xlsx";
prisma
import { subjectTemplate } from "../shared/template.helper.js";
import prisma from "../../utils/prisma.js";

const include = {
  _count: { select: { sectionSubjects: true, facultySubjects: true } },
};

export const getAllSubjects = async ({ limit = 500, page = 1, search, category } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }];
  if (category) where.category = category;
  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({ where, skip, take: limit, orderBy: [{ name: "asc" }] }),
    prisma.subject.count({ where }),
  ]);
  return { subjects, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getSubjectById = (id) => prisma.subject.findUnique({ where: { id }, include });

export const createSubject = (data) =>
  prisma.subject.create({
    data: {
      name: data.name,
      code: data.code,
      nickname: data.nickname || null,
      category: data.category || "THEORY",
      credits: data.credits ?? 4,
    },
    include,
  });

export const updateSubject = (id, data) =>
  prisma.subject.update({ where: { id }, data, include });

export const deleteSubject = (id) => prisma.subject.delete({ where: { id } });

export const bulkCreateSubjects = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], total: rows.length };

  const VALID_CATS = ["THEORY", "PRACTICAL", "TRAINING", "LIBRARY", "TUTORIAL", "OTHER"];

  for (const row of rows) {
    const name = String(row["Name*"] || row.name || "").trim();
    const code = String(row["Code*"] || row.code || "").trim();
    const nickname = String(row["Nickname"] || row.nickname || "").trim() || null;
    const category = String(row["Category"] || row.category || "THEORY").trim().toUpperCase();
    const credits = parseInt(row["Credits"] || row.credits || 4) || 4;

    if (!name || !code) { results.failed.push({ row, reason: "Name and Code required" }); continue; }
    if (!VALID_CATS.includes(category)) { results.failed.push({ row, reason: `Invalid category: ${category}` }); continue; }

    try {
      const s = await prisma.subject.create({ data: { name, code, nickname, category, credits } });
      results.created.push({ id: s.id, name: s.name, code: s.code });
    } catch (e) {
      results.failed.push({ row, reason: e.message.includes("Unique") ? `Code "${code}" already exists` : e.message });
    }
  }
  return results;
};

export const getSubjectTemplate = subjectTemplate;
