// backend/modules/programs/program.service.js  ── REPLACE
import prisma from "../../utils/prisma.js";
import xlsx  from "xlsx";

const progInclude = {
  department: { select: { id: true, code: true, name: true } },
  _count:     { select: { branches: true, students: true } },
};

// ── List ──────────────────────────────────────────────────────
export const getAllPrograms = async ({ page = 1, limit = 200, search, dept_id } = {}) => {
  const _page  = parseInt(page,  10) || 1;
  const _limit = parseInt(limit, 10) || 200;
  const skip   = (_page - 1) * _limit;
  const where  = { deleted_at: null };
  if (search)  where.name    = { contains: search, mode: "insensitive" };
  if (dept_id) where.dept_id = dept_id;
  const [programs, total] = await Promise.all([
    prisma.program.findMany({ where, skip, take: _limit, orderBy: { name: "asc" }, include: progInclude }),
    prisma.program.count({ where }),
  ]);
  return { programs, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

// ── Get one ───────────────────────────────────────────────────
export const getProgramById = (id) => prisma.program.findUnique({ where: { id }, include: progInclude });

// ── Create ────────────────────────────────────────────────────
export const createProgram = async (data) => {
  if (!data.name?.trim()) throw Object.assign(new Error("Program name is required"), { status: 400 });
  if (!data.dept_id)      throw Object.assign(new Error("dept_id is required"),      { status: 400 });
  const dept = await prisma.department.findUnique({ where: { id: data.dept_id } });
  if (!dept) throw Object.assign(new Error("Department not found"), { status: 404 });
  return prisma.program.create({
    data: {
      name:            data.name.trim(),
      code:            data.code?.trim().toUpperCase() || _autoCode(data.name),
      dept_id:         data.dept_id,
      max_semesters:   data.max_semesters   ? parseInt(data.max_semesters)   : null,
      duration_years:  data.duration_years  ? parseInt(data.duration_years)  : null,
      degree_type:     data.degree_type     || null,
      accreditation:   data.accreditation   || null,
      intake_capacity: data.intake_capacity ? parseInt(data.intake_capacity) : null,
      description:     data.description     || null,
    },
    include: progInclude,
  });
};

const _autoCode = (name) =>
  name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "PROG";

// ── Update ────────────────────────────────────────────────────
export const updateProgram = (id, data) =>
  prisma.program.update({
    where: { id },
    data: {
      ...(data.name            !== undefined && { name:            data.name.trim() }),
      ...(data.code            !== undefined && { code:            data.code?.trim().toUpperCase() }),
      ...(data.dept_id         !== undefined && { dept_id:         data.dept_id }),
      ...(data.max_semesters   !== undefined && { max_semesters:   data.max_semesters   ? parseInt(data.max_semesters)   : null }),
      ...(data.duration_years  !== undefined && { duration_years:  data.duration_years  ? parseInt(data.duration_years)  : null }),
      ...(data.degree_type     !== undefined && { degree_type:     data.degree_type     || null }),
      ...(data.accreditation   !== undefined && { accreditation:   data.accreditation   || null }),
      ...(data.intake_capacity !== undefined && { intake_capacity: data.intake_capacity ? parseInt(data.intake_capacity) : null }),
      ...(data.description     !== undefined && { description:     data.description     || null }),
    },
    include: progInclude,
  });

// ── Delete ────────────────────────────────────────────────────
export const deleteProgram = async (id) => {
  const prog = await prisma.program.findUnique({ where: { id }, select: { _count: { select: { branches: true } } } });
  if ((prog?._count.branches || 0) > 0)
    throw Object.assign(new Error(`Cannot delete: ${prog._count.branches} branch(es) under this program`), { status: 400 });
  return prisma.program.update({ where: { id }, data: { deleted_at: new Date() } });
};

export const restoreProgram = (id) => prisma.program.update({ where: { id }, data: { deleted_at: null } });

// ── Template ──────────────────────────────────────────────────
export const getProgramTemplate = async () => {
  const depts = await prisma.department.findMany({ where: { deleted_at: null }, select: { code: true, name: true }, orderBy: { name: "asc" } });

  const wb = xlsx.utils.book_new();
  const HEADERS = ["name*", "code (auto if blank)", "dept_code*", "degree_type", "max_semesters", "duration_years", "intake_capacity", "accreditation", "description"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ["B.Tech Computer Science", "BTECH-CSE", depts[0]?.code || "CSE",  "B.Tech", 8, 4, 60, "NBA", "4-year undergraduate program"],
    ["M.Tech Computer Science", "MTECH-CSE", depts[0]?.code || "CSE",  "M.Tech", 4, 2, 30, "",    "2-year postgraduate program"],
    ["B.Tech ECE",              "BTECH-ECE", depts[1]?.code || "ECE",  "B.Tech", 8, 4, 60, "",    ""],
  ]);
  ws["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  xlsx.utils.book_append_sheet(wb, ws, "Programs");

  // Reference: departments
  const wsRef = xlsx.utils.aoa_to_sheet([
    ["dept_code", "dept_name"],
    ...depts.map((d) => [d.code, d.name]),
  ]);
  wsRef["!cols"] = [{ wch: 12 }, { wch: 36 }];
  xlsx.utils.book_append_sheet(wb, wsRef, "Departments (Reference)");

  const wsInfo = xlsx.utils.aoa_to_sheet([
    ["Field",            "Required", "Notes"],
    ["name",             "YES",      "Program display name"],
    ["code",             "NO",       "Auto-generated if blank. Must be unique."],
    ["dept_code",        "YES",      "Use code from the Departments sheet"],
    ["degree_type",      "NO",       "e.g. B.Tech, M.Tech, BCA, MCA"],
    ["max_semesters",    "NO",       "Total semesters e.g. 8"],
    ["duration_years",   "NO",       "e.g. 4"],
    ["intake_capacity",  "NO",       "Seats per year"],
    ["accreditation",    "NO",       "e.g. NBA, NAAC-A"],
    ["description",      "NO",       "Free text"],
  ]);
  wsInfo["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 50 }];
  xlsx.utils.book_append_sheet(wb, wsInfo, "Instructions");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Bulk Create ───────────────────────────────────────────────
export const bulkCreatePrograms = async (buffer) => {
  const wb   = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(
    wb.Sheets["Programs"] || wb.Sheets[wb.SheetNames[0]],
    { defval: "" },
  );

  // Build dept code → id map
  const depts    = await prisma.department.findMany({ where: { deleted_at: null }, select: { id: true, code: true } });
  const deptMap  = Object.fromEntries(depts.map((d) => [d.code.toUpperCase(), d.id]));
  const results  = { created: [], failed: [], skipped: [], total: 0 };
  const dataRows = rows.filter((r) => String(r["name*"] || r.name || "").trim());
  results.total  = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const row   = dataRows[i];
    const label = `Row ${i + 2}`;
    const name      = String(row["name*"] || row.name || "").trim();
    const deptCode  = String(row["dept_code*"] || row.dept_code || "").trim().toUpperCase();

    if (!name)     { results.failed.push({ row: label, reason: "name is required" });     continue; }
    if (!deptCode) { results.failed.push({ row: label, reason: "dept_code is required" }); continue; }

    const dept_id = deptMap[deptCode];
    if (!dept_id) { results.failed.push({ row: label, reason: `Department code not found: "${deptCode}"` }); continue; }

    try {
      const prog = await createProgram({
        name, dept_id,
        code:            String(row["code (auto if blank)"] || row.code || "").trim() || undefined,
        degree_type:     String(row.degree_type    || "").trim() || undefined,
        max_semesters:   row.max_semesters    || undefined,
        duration_years:  row.duration_years   || undefined,
        intake_capacity: row.intake_capacity  || undefined,
        accreditation:   String(row.accreditation || "").trim() || undefined,
        description:     String(row.description   || "").trim() || undefined,
      });
      results.created.push({ row: label, id: prog.id, name: prog.name, code: prog.code });
    } catch (err) {
      if (err.status === 409) results.skipped.push({ row: label, name, reason: err.message });
      else                    results.failed.push({ row: label, name, reason: err.message });
    }
  }
  return results;
};