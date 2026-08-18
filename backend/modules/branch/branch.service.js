// backend/modules/branch/branch.service.js
import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";
import { logBranchHistory } from "../../utils/historyLogger.js";

const branchInclude = {
  program: {
    select: {
      id: true, code: true, name: true,
      department: { select: { id: true, code: true, name: true } },
    },
  },
  _count: { select: { sections: true, students: true } },
};

const autoCode = (programCode, name) =>
  `${programCode}-${name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`.slice(0, 20);

// ── List ──────────────────────────────────────────────────────
export const getAllBranches = async ({
  page = 1, limit = 200, search, program_id, dept_id, include_deleted = false, status,
} = {}) => {
  const _page = parseInt(page, 10) || 1;
  const _limit = parseInt(limit, 10) || 200;
  const skip = (_page - 1) * _limit;
  const where = { ...(!include_deleted && { deleted_at: null }) };
  if (program_id) where.program_id = program_id;
  if (dept_id) where.program = { dept_id };
  if (status === "active") where.discontinued_at = null;
  if (status === "discontinued") where.discontinued_at = { not: null };
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { code: { contains: search, mode: "insensitive" } },
  ];
  const [branches, total] = await Promise.all([
    prisma.branch.findMany({ where, skip, take: _limit, include: branchInclude, orderBy: [{ program: { name: "asc" } }, { name: "asc" }] }),
    prisma.branch.count({ where }),
  ]);
  return { branches, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

export const getBranchById = (id) =>
  prisma.branch.findUnique({
    where: { id },
    include: {
      ...branchInclude,
      sections: {
        where: { deleted_at: null }, orderBy: { semester: "asc" }, take: 20,
        select: { id: true, code: true, name: true, semester: true, batch: true, academic_year: true, status: true, _count: { select: { students: true } } },
      },
    },
  });

export const getBranchStats = async () => {
  const [total, active, discontinued, combined] = await Promise.all([
    prisma.branch.count({ where: { deleted_at: null } }),
    prisma.branch.count({ where: { deleted_at: null, discontinued_at: null } }),
    prisma.branch.count({ where: { deleted_at: null, discontinued_at: { not: null } } }),
    prisma.branch.count({ where: { deleted_at: null, has_combined_first_year: true } }),
  ]);
  return { total, active, discontinued, combined };
};

// ── Create ────────────────────────────────────────────────────
export const createBranch = async (data, actingUser = {}) => {
  const { name, program_id, code, has_combined_first_year = false, start_session, intake_capacity, total_semesters_override, description } = data;

  if (!name?.trim()) throw Object.assign(new Error("Branch name is required"), { status: 400 });
  if (!program_id) throw Object.assign(new Error("program_id is required"), { status: 400 });

  const program = await prisma.program.findUnique({ where: { id: program_id }, select: { id: true, code: true } });
  if (!program) throw Object.assign(new Error("Program not found"), { status: 404 });

  const finalCode = code?.trim().toUpperCase() || autoCode(program.code, name);

  const branch = await prisma.branch.create({
    data: {
      code: finalCode,
      name: name.trim(),
      program_id,
      has_combined_first_year: !!has_combined_first_year,
      start_session: start_session || null,
      intake_capacity: intake_capacity ? parseInt(intake_capacity) : null,
      total_semesters_override: total_semesters_override ? parseInt(total_semesters_override) : null,
      description: description || null,
    },
    include: branchInclude,
  });

  await logBranchHistory(branch.id, {
    action: "CREATE", next: branch,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return branch;
};

// ── Update ────────────────────────────────────────────────────
export const updateBranch = async (id, data, actingUser = {}) => {
  const prev = await prisma.branch.findUnique({ where: { id }, include: branchInclude });
  if (!prev) throw Object.assign(new Error("Branch not found"), { status: 404 });

  const next = await prisma.branch.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.code !== undefined && { code: data.code?.trim().toUpperCase() }),
      ...(data.program_id !== undefined && { program_id: data.program_id }),
      ...(data.has_combined_first_year !== undefined && { has_combined_first_year: !!data.has_combined_first_year }),
      ...(data.start_session !== undefined && { start_session: data.start_session || null }),
      ...(data.intake_capacity !== undefined && { intake_capacity: data.intake_capacity ? parseInt(data.intake_capacity) : null }),
      ...(data.total_semesters_override !== undefined && { total_semesters_override: data.total_semesters_override ? parseInt(data.total_semesters_override) : null }),
      ...(data.description !== undefined && { description: data.description || null }),
    },
    include: branchInclude,
  });

  await logBranchHistory(id, {
    action: "UPDATE", prev, next, reason: data.reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return next;
};

// ── Discontinue ───────────────────────────────────────────────
export const discontinueBranch = async (id, { end_session, reason } = {}, actingUser = {}) => {
  const prev = await prisma.branch.findUnique({ where: { id }, include: branchInclude });
  if (!prev) throw Object.assign(new Error("Branch not found"), { status: 404 });
  if (prev.discontinued_at) throw Object.assign(new Error("Already discontinued"), { status: 400 });

  const next = await prisma.branch.update({
    where: { id },
    data: { discontinued_at: new Date(), discontinued_reason: reason || null, discontinued_by: actingUser.id || null, end_session: end_session || null },
    include: branchInclude,
  });

  await logBranchHistory(id, {
    action: "DISCONTINUE", prev, next, reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return next;
};

export const reactivateBranch = async (id, actingUser = {}) => {
  const prev = await prisma.branch.findUnique({ where: { id }, include: branchInclude });
  const next = await prisma.branch.update({
    where: { id },
    data: { discontinued_at: null, discontinued_reason: null, discontinued_by: null, end_session: null },
    include: branchInclude,
  });
  await logBranchHistory(id, { action: "REACTIVATE", prev, next, by: actingUser.id, byName: actingUser.email });
  return next;
};

// ── Soft Delete / Restore ─────────────────────────────────────
export const deleteBranch = async (id, reason, actingUser = {}) => {
  const branch = await prisma.branch.findUnique({ where: { id }, include: { _count: { select: { students: true } } } });
  if (!branch) throw Object.assign(new Error("Not found"), { status: 404 });
  if ((branch._count.students || 0) > 0)
    throw Object.assign(new Error(`Cannot delete — ${branch._count.students} student(s) enrolled. Discontinue instead.`), { status: 400 });
  const next = await prisma.branch.update({ where: { id }, data: { deleted_at: new Date() }, include: branchInclude });
  await logBranchHistory(id, { action: "SOFT_DELETE", prev: branch, next, reason, by: actingUser.id, byName: actingUser.email });
  return next;
};

export const restoreBranch = async (id, actingUser = {}) => {
  const prev = await prisma.branch.findUnique({ where: { id }, include: branchInclude });
  const next = await prisma.branch.update({ where: { id }, data: { deleted_at: null }, include: branchInclude });
  await logBranchHistory(id, { action: "RESTORE", prev, next, by: actingUser.id, byName: actingUser.email });
  return next;
};

// ── History + Rollback ────────────────────────────────────────
export const getBranchHistory = (branch_id, { page = 1, limit = 50 } = {}) => {
  const _page = parseInt(page, 10) || 1; const _limit = parseInt(limit, 10) || 50;
  return prisma.branchHistory.findMany({ where: { branch_id }, orderBy: { createdAt: "desc" }, skip: (_page - 1) * _limit, take: _limit });
};

export const rollbackBranch = async (branch_id, history_id, reason, actingUser = {}) => {
  const histEntry = await prisma.branchHistory.findUnique({ where: { id: history_id } });
  if (!histEntry?.prev_data) throw Object.assign(new Error("No previous state to restore"), { status: 400 });

  const prev = await prisma.branch.findUnique({ where: { id: branch_id }, include: branchInclude });
  const restore = histEntry.prev_data;
  const FIELDS = ["name", "code", "program_id", "has_combined_first_year", "start_session", "end_session", "intake_capacity", "total_semesters_override", "description", "discontinued_at", "deleted_at"];
  const updateData = {};
  for (const k of FIELDS) if (restore[k] !== undefined) updateData[k] = restore[k];

  const next = await prisma.branch.update({ where: { id: branch_id }, data: updateData, include: branchInclude });
  await logBranchHistory(branch_id, { action: "ROLLBACK", prev, next, reason, isRollback: true, rolledBackTo: history_id, by: actingUser.id, byName: actingUser.email });
  return next;
};

// ── Template ──────────────────────────────────────────────────
export const getBranchTemplate = async () => {
  const programs = await prisma.program.findMany({
    where: { deleted_at: null },
    select: { code: true, name: true, department: { select: { code: true, name: true } } },
    orderBy: { name: "asc" },
  });
  const wb = xlsx.utils.book_new();
  const HEADERS = ["name*", "program_code*", "branch_code (auto if blank)", "intake_capacity", "total_semesters_override", "has_combined_first_year (true/false)", "start_session (e.g. 2019-20)", "description"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ["Computer Science & Engineering", programs[0]?.code || "BTECH-CSE", "CSE", 60, "", "false", "2019-20", ""],
    ["First Year Engineering", programs[0]?.code || "BTECH-CSE", "FYE", 120, "", "true", "2024-25", "Combined FYE"],
  ]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 28 }));
  xlsx.utils.book_append_sheet(wb, ws, "Branches");
  const wsRef = xlsx.utils.aoa_to_sheet([
    ["program_code", "program_name", "dept_code", "dept_name"],
    ...programs.map((p) => [p.code, p.name, p.department?.code, p.department?.name]),
  ]);
  xlsx.utils.book_append_sheet(wb, wsRef, "Programs (Reference)");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["Field", "Required", "Notes"],
    ["name", "YES", "Branch display name"],
    ["program_code", "YES", "From Programs reference sheet"],
    ["branch_code", "NO", "Auto-generated if blank"],
    ["intake_capacity", "NO", "Seats per batch"],
    ["total_semesters_override", "NO", "Override program max semesters"],
    ["has_combined_first_year", "NO", "true/false. Default: false"],
    ["start_session", "NO", "e.g. 2019-20"],
  ]), "Instructions");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Bulk Create ───────────────────────────────────────────────
export const bulkCreateBranches = async (buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Branches"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });

  const programs = await prisma.program.findMany({ where: { deleted_at: null }, select: { id: true, code: true } });
  const progMap = Object.fromEntries(programs.map((p) => [p.code.toUpperCase(), p]));

  const results = { created: [], failed: [], skipped: [], total: 0 };
  const data = rows.filter((r) => String(r["name*"] || r.name || "").trim());
  results.total = data.length;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const label = `Row ${i + 2}`;
    const name = String(row["name*"] || row.name || "").trim();
    const progCode = String(row["program_code*"] || row.program_code || "").trim().toUpperCase();
    if (!name) { results.failed.push({ row: label, reason: "name required" }); continue; }
    if (!progCode) { results.failed.push({ row: label, reason: "program_code required" }); continue; }
    const program = progMap[progCode];
    if (!program) { results.failed.push({ row: label, reason: `Program not found: "${progCode}"` }); continue; }

    try {
      const branch = await createBranch({
        name,
        program_id: program.id,
        code: String(row["branch_code (auto if blank)"] || "").trim().toUpperCase() || undefined,
        intake_capacity: row.intake_capacity || undefined,
        total_semesters_override: row.total_semesters_override || undefined,
        has_combined_first_year: String(row["has_combined_first_year (true/false)"] || "false").toLowerCase() === "true",
        start_session: String(row["start_session (e.g. 2019-20)"] || "").trim() || undefined,
        description: String(row.description || "").trim() || undefined,
      }, actingUser);
      results.created.push({ row: label, id: branch.id, name: branch.name, code: branch.code });
    } catch (err) {
      if (err.code === "P2002") results.skipped.push({ row: label, name, reason: "Branch code already exists" });
      else results.failed.push({ row: label, name, reason: err.message });
    }
  }
  return results;
};