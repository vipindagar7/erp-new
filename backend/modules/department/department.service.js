// backend/modules/department/department.service.js  ── FULL V3
import prisma from "../../utils/prisma.js";
import xlsx  from "xlsx";
import { logDeptHistory, diffObjects } from "../../utils/historyLogger.js";

const include = {
  hod:      { select: { id: true, name: true, emp_id: true, designation: true, photo_url: true } },
  programs: { where: { deleted_at: null }, select: { id: true, name: true, code: true, _count: { select: { branches: true } } } },
  _count:   { select: { faculties: true, students: true, programs: true } },
};

// ── Helpers ───────────────────────────────────────────────────
const autoCode = (name) =>
  name.trim().toUpperCase().split(/\s+/).map((w) => w[0]).join("").slice(0, 6) || "DEPT";

// ── List ──────────────────────────────────────────────────────
export const getAllDepartments = async ({ search, include_deleted = false, page = 1, limit = 50 } = {}) => {
  const _page  = parseInt(page,  10) || 1;
  const _limit = parseInt(limit, 10) || 50;
  const where  = include_deleted ? {} : { deleted_at: null };
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { code: { contains: search, mode: "insensitive" } },
  ];
  const [departments, total] = await Promise.all([
    prisma.department.findMany({ where, include, orderBy: { name: "asc" }, skip: (_page-1)*_limit, take: _limit }),
    prisma.department.count({ where }),
  ]);
  return { departments, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total/_limit) } };
};

export const getDepartmentById = (id) =>
  prisma.department.findUnique({ where: { id }, include });

// ── Create ────────────────────────────────────────────────────
export const createDepartment = async (data, actingUser = {}) => {
  const { name, code, description, website, phone, established_year, hod_id } = data;
  if (!name?.trim()) throw Object.assign(new Error("Department name is required"), { status: 400 });

  const dup = await prisma.department.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" }, deleted_at: null },
  });
  if (dup) throw Object.assign(new Error(`Department "${name}" already exists`), { status: 409 });

  // Validate HOD
  if (hod_id) {
    const fac = await prisma.faculty.findUnique({ where: { id: hod_id } });
    if (!fac) throw Object.assign(new Error("HOD faculty not found"), { status: 404 });
  }

  const dept = await prisma.department.create({
    data: {
      name:             name.trim(),
      code:             code?.trim().toUpperCase() || autoCode(name),
      description:      description      || null,
      website:          website          || null,
      phone:            phone            || null,
      established_year: established_year ? parseInt(established_year) : null,
      hod_id:           hod_id           || null,
    },
    include,
  });

  await logDeptHistory(dept.id, {
    action: "CREATE", next: dept,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return dept;
};

// ── Update ────────────────────────────────────────────────────
export const updateDepartment = async (id, data, actingUser = {}) => {
  const prev = await prisma.department.findUnique({ where: { id }, include });
  if (!prev) throw Object.assign(new Error("Department not found"), { status: 404 });

  // Duplicate name check
  if (data.name) {
    const dup = await prisma.department.findFirst({
      where: { name: { equals: data.name.trim(), mode: "insensitive" }, NOT: { id }, deleted_at: null },
    });
    if (dup) throw Object.assign(new Error(`Department "${data.name}" already exists`), { status: 409 });
  }

  // Validate HOD
  if (data.hod_id) {
    const fac = await prisma.faculty.findUnique({ where: { id: data.hod_id } });
    if (!fac) throw Object.assign(new Error("HOD faculty not found"), { status: 404 });
  }

  const next = await prisma.department.update({
    where: { id },
    data: {
      ...(data.name             !== undefined && { name:             data.name.trim() }),
      ...(data.code             !== undefined && { code:             data.code?.trim().toUpperCase() }),
      ...(data.description      !== undefined && { description:      data.description      || null }),
      ...(data.website          !== undefined && { website:          data.website          || null }),
      ...(data.phone            !== undefined && { phone:            data.phone            || null }),
      ...(data.established_year !== undefined && { established_year: data.established_year ? parseInt(data.established_year) : null }),
      ...(data.hod_id           !== undefined && { hod_id:           data.hod_id           || null }),
    },
    include,
  });

  const action = data.hod_id !== undefined && data.hod_id !== prev.hod_id ? "HOD_CHANGE" : "UPDATE";

  await logDeptHistory(id, {
    action, prev, next,
    reason: data.reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return next;
};

// ── Soft Delete ───────────────────────────────────────────────
export const deleteDepartment = async (id, reason, actingUser = {}) => {
  const prev = await prisma.department.findUnique({ where: { id }, include: { _count: { select: { faculties: true, students: true } } } });
  if (!prev) throw Object.assign(new Error("Not found"), { status: 404 });
  if (prev._count.faculties > 0 || prev._count.students > 0)
    throw Object.assign(new Error(`Cannot delete: ${prev._count.faculties} faculty and ${prev._count.students} students associated`), { status: 400 });

  const next = await prisma.department.update({ where: { id }, data: { deleted_at: new Date() }, include });

  await logDeptHistory(id, {
    action: "SOFT_DELETE", prev, next, reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return next;
};

// ── Restore ───────────────────────────────────────────────────
export const restoreDepartment = async (id, reason, actingUser = {}) => {
  const prev = await prisma.department.findUnique({ where: { id }, include });
  const next = await prisma.department.update({ where: { id }, data: { deleted_at: null }, include });

  await logDeptHistory(id, {
    action: "RESTORE", prev, next, reason,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return next;
};

// ── History ───────────────────────────────────────────────────
export const getDepartmentHistory = (dept_id, { page = 1, limit = 50 } = {}) => {
  const _page  = parseInt(page,  10) || 1;
  const _limit = parseInt(limit, 10) || 50;
  return prisma.departmentHistory.findMany({
    where:   { dept_id },
    orderBy: { createdAt: "desc" },
    skip:    (_page - 1) * _limit,
    take:    _limit,
  });
};

// ── Rollback ──────────────────────────────────────────────────
export const rollbackDepartment = async (dept_id, history_id, reason, actingUser = {}) => {
  const histEntry = await prisma.departmentHistory.findUnique({ where: { id: history_id } });
  if (!histEntry) throw Object.assign(new Error("History entry not found"), { status: 404 });
  if (!histEntry.prev_data) throw Object.assign(new Error("No previous state to restore"), { status: 400 });

  const prev    = await prisma.department.findUnique({ where: { id: dept_id }, include });
  const restore = histEntry.prev_data;

  const next = await prisma.department.update({
    where: { id: dept_id },
    data: {
      name:             restore.name,
      code:             restore.code,
      description:      restore.description      || null,
      website:          restore.website          || null,
      phone:            restore.phone            || null,
      established_year: restore.established_year || null,
      hod_id:           restore.hod_id           || null,
      deleted_at:       restore.deleted_at       || null,
    },
    include,
  });

  await logDeptHistory(dept_id, {
    action: "ROLLBACK", prev, next,
    reason: reason || `Rolled back to state from ${histEntry.createdAt.toISOString()}`,
    isRollback: true, rolledBackTo: history_id,
    by: actingUser.id, byName: actingUser.email, byRole: actingUser.role,
  });

  return next;
};

// ── Stats ─────────────────────────────────────────────────────
export const getDepartmentStats = async () => {
  const [total, active, withHOD, withFaculty, withStudents] = await Promise.all([
    prisma.department.count(),
    prisma.department.count({ where: { deleted_at: null } }),
    prisma.department.count({ where: { deleted_at: null, hod_id: { not: null } } }),
    prisma.department.count({ where: { deleted_at: null, faculties: { some: {} } } }),
    prisma.department.count({ where: { deleted_at: null, students:  { some: {} } } }),
  ]);
  return { total, active, deleted: total - active, withHOD, withFaculty, withStudents };
};

// ── Template ──────────────────────────────────────────────────
export const getDepartmentTemplate = async () => {
  const wb = xlsx.utils.book_new();
  const HEADERS = ["name*", "code (auto if blank)", "description", "website", "phone", "established_year"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ["Computer Science & Engineering", "CSE",  "Core CS department", "https://cse.eit.ac.in", "0129-2345678", 2005],
    ["Electronics & Communication",   "ECE",  "",                   "",                       "",             2005],
    ["Mechanical Engineering",        "ME",   "",                   "",                       "",             2006],
    ["First Year Engineering",        "FYE",  "Combined first year", "",                      "",             2005],
  ]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 28 }));
  xlsx.utils.book_append_sheet(wb, ws, "Departments");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["Field",            "Required", "Notes"],
    ["name",             "YES",      "Unique department name"],
    ["code",             "NO",       "Auto-generated if blank (e.g. CSE). Max 6 chars."],
    ["description",      "NO",       "Free text"],
    ["website",          "NO",       "https://..."],
    ["phone",            "NO",       "Contact number"],
    ["established_year", "NO",       "4-digit year e.g. 2005"],
    ["hod_emp_id",       "NO",       "Faculty emp_id — assign HOD separately after creation"],
  ]), "Instructions");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Bulk Create ───────────────────────────────────────────────
export const bulkCreateDepartments = async (buffer, actingUser = {}) => {
  const wb      = xlsx.read(buffer, { type: "buffer" });
  const rows    = xlsx.utils.sheet_to_json(wb.Sheets["Departments"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], skipped: [], total: 0 };
  const data    = rows.filter((r) => String(r["name*"] || r.name || "").trim());
  results.total = data.length;

  for (let i = 0; i < data.length; i++) {
    const row   = data[i];
    const label = `Row ${i + 2}`;
    const name  = String(row["name*"] || row.name || "").trim();
    if (!name) { results.failed.push({ row: label, reason: "name required" }); continue; }
    try {
      const dept = await createDepartment({
        name,
        code:             String(row["code (auto if blank)"] || row.code || "").trim() || undefined,
        description:      String(row.description   || "").trim() || undefined,
        website:          String(row.website        || "").trim() || undefined,
        phone:            String(row.phone          || "").trim() || undefined,
        established_year: row.established_year || undefined,
      }, actingUser);
      results.created.push({ row: label, id: dept.id, name: dept.name, code: dept.code });
    } catch (err) {
      if (err.status === 409) results.skipped.push({ row: label, name, reason: err.message });
      else                    results.failed.push({  row: label, name, reason: err.message });
    }
  }
  return results;
};

// ── Export ────────────────────────────────────────────────────
export const exportDepartments = async () => {
  const depts = await getAllDepartments({ limit: 1000 });
  const wb    = xlsx.utils.book_new();
  const ws    = xlsx.utils.json_to_sheet((depts.departments || []).map((d) => ({
    Name:             d.name,
    Code:             d.code,
    HOD:              d.hod?.name || "",
    HOD_EmpID:        d.hod?.emp_id || "",
    Description:      d.description || "",
    Website:          d.website     || "",
    Phone:            d.phone       || "",
    Established:      d.established_year || "",
    Faculty_Count:    d._count.faculties,
    Student_Count:    d._count.students,
    Program_Count:    d._count.programs,
    Status:           d.deleted_at ? "Deleted" : "Active",
  })));
  xlsx.utils.book_append_sheet(wb, ws, "Departments");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};