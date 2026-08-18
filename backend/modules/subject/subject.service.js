// backend/modules/subject/subject.service.js
import prisma from "../../utils/prisma.js";
import xlsx   from "xlsx";

const VALID_CATS = ["THEORY", "PRACTICAL", "TRAINING", "LIBRARY", "TUTORIAL", "OTHER"];

const include = {
  _count: { select: { sectionSubjects: true, facultySubjects: true, curriculumSubjects: true } },
};

export const getAllSubjects = async ({ limit = 500, page = 1, search, category } = {}) => {
  const skip  = (page - 1) * limit;
  const where = {
    ...(category && { category }),
    ...(search   && { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] }),
  };
  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({ where, skip, take: limit, orderBy: { name: "asc" }, include }),
    prisma.subject.count({ where }),
  ]);
  return { subjects, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getSubjectById = (id) =>
  prisma.subject.findUnique({ where: { id }, include });

export const createSubject = ({ name, code, nickname, category, credits }) =>
  prisma.subject.create({
    data: { name, code: code.toUpperCase(), nickname: nickname || null, category: category || "THEORY", credits: credits ?? 4 },
    include,
  });

export const updateSubject = (id, data) =>
  prisma.subject.update({ where: { id }, data: { ...data, ...(data.code && { code: data.code.toUpperCase() }) }, include });

export const deleteSubject = async (id) => {
  const s = await prisma.subject.findUnique({ where: { id }, select: { _count: { select: { sectionSubjects: true } } } });
  if (s._count.sectionSubjects > 0)
    throw Object.assign(new Error(`Cannot delete — subject is assigned to ${s._count.sectionSubjects} section(s)`), { status: 400 });
  return prisma.subject.delete({ where: { id } });
};

export const getSubjectTemplate = async () => {
  const wb = xlsx.utils.book_new();
  const HEADERS = ["Name*", "Code*", "Nickname", "Category", "Credits"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ["Mathematics I", "MATH101", "Maths", "THEORY", "4"],
    ["Physics Lab", "PHY101L", "Phy Lab", "PRACTICAL", "2"],
  ]);
  ws["!cols"] = [30, 12, 16, 12, 8].map((w) => ({ wch: w }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");
  const wsRef = xlsx.utils.aoa_to_sheet([["Category", "Description"], ...VALID_CATS.map((c) => [c, ""])]);
  xlsx.utils.book_append_sheet(wb, wsRef, "Categories");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const bulkCreateSubjects = async (buffer) => {
  const wb   = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], total: rows.length };

  for (const row of rows) {
    const name     = String(row["Name*"]     || "").trim();
    const code     = String(row["Code*"]     || "").trim().toUpperCase();
    const nickname = String(row["Nickname"]  || "").trim() || null;
    const category = String(row["Category"]  || "THEORY").trim().toUpperCase();
    const credits  = parseInt(row["Credits"] || 4) || 4;

    if (!name || !code)                    { results.failed.push({ row: code || name, reason: "Name and Code required" });          continue; }
    if (!VALID_CATS.includes(category))    { results.failed.push({ row: code, reason: `Invalid category: ${category}` });          continue; }

    try {
      const s = await prisma.subject.create({ data: { name, code, nickname, category, credits } });
      results.created.push({ id: s.id, name: s.name, code: s.code });
    } catch (e) {
      results.failed.push({ row: code, reason: e.message.includes("Unique") ? `Code "${code}" already exists` : e.message });
    }
  }
  return results;
};