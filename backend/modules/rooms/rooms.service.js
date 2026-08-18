// backend/modules/rooms/rooms.service.js
import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";

// ── Guard — returns 503 if Room model not migrated yet ───────
const guardRoom = () => {
  if (!prisma.room) throw Object.assign(
    new Error("Room model not found. Run: npx prisma migrate dev --name rooms_timetable && npx prisma generate"),
    { status: 503 }
  );
};

// Build include dynamically — only include relations that exist post-migration
const getRoomInclude = () => {
  const inc = {};
  try { if (prisma.department) inc.department = { select: { id: true, name: true } }; } catch { }
  try { if (prisma.roomSubject) inc.subjects = { include: { subject: { select: { id: true, name: true, code: true, category: true } } } }; } catch { }
  try { if (prisma.roomStaff) inc.staff = { include: { user: { select: { id: true, email: true, faculty: { select: { name: true, designation: true } } } } } }; } catch { }
  return inc;
};
// backward compat alias
const roomInclude = {};

// ── List ──────────────────────────────────────────────────────
export const getAllRooms = async ({ type, dept_id, block, floor, search, is_active, page = 1, limit = 50 } = {}) => {
  if (!prisma.room) return { rooms: [], pagination: { total: 0, page: 1, limit: 50, pages: 0 }, _note: "Run: npx prisma migrate dev --name rooms_timetable" };

  const where = { deleted_at: null };
  if (type) where.type = type;
  if (dept_id) where.dept_id = dept_id;
  if (block) where.block = { contains: block, mode: "insensitive" };
  if (floor) where.floor = { contains: floor, mode: "insensitive" };
  if (is_active !== undefined) where.is_active = is_active === "true" || is_active === true;
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { code: { contains: search, mode: "insensitive" } },
    { block: { contains: search, mode: "insensitive" } },
  ];

  const _page = parseInt(page) || 1;
  const _limit = parseInt(limit) || 50;

  // Safe include — only include relations that exist in schema
  const safeInclude = {};
  try {
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        orderBy: [{ block: "asc" }, { floor: "asc" }, { name: "asc" }],
        skip: (_page - 1) * _limit, take: _limit,
      }),
      prisma.room.count({ where }),
    ]);
    return { rooms, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
  } catch (e) {
    console.error("[ROOMS:LIST]", e.message);
    return { rooms: [], pagination: { total: 0, page: _page, limit: _limit, pages: 0 }, _error: e.message };
  }
};

export const getRoomById = async (id) => {
  guardRoom();
  const room = await prisma.room.findUnique({ where: { id }, include: getRoomInclude() });
  if (!room) throw Object.assign(new Error("Room not found"), { status: 404 });
  return room;
};

// ── Create ────────────────────────────────────────────────────
export const createRoom = async (data, actingUser = {}) => {
  guardRoom();
  const { name, code, type, capacity, floor, block, description, dept_id, is_active, subject_ids, staff_ids } = data;
  if (!name?.trim()) throw Object.assign(new Error("Room name required"), { status: 400 });
  if (!code?.trim()) throw Object.assign(new Error("Room code required"), { status: 400 });

  const dup = await prisma.room.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (dup) throw Object.assign(new Error(`Room code "${code}" already exists`), { status: 409 });

  return prisma.room.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type || "CLASSROOM",
      capacity: parseInt(capacity) || 60,
      floor: floor || null,
      block: block || null,
      description: description || null,
      dept_id: dept_id || null,
      is_active: is_active !== false,
      ...(subject_ids?.length && {
        subjects: { create: subject_ids.map((subject_id) => ({ subject_id })) },
      }),
      ...(staff_ids?.length && {
        staff: { create: staff_ids.map(({ user_id, role }) => ({ user_id, role: role || "LAB_STAFF" })) },
      }),
    },
    include: getRoomInclude(),
  });
};

// ── Update ────────────────────────────────────────────────────
export const updateRoom = async (id, data) => {
  guardRoom();
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw Object.assign(new Error("Room not found"), { status: 404 });

  const { subject_ids, staff_ids, ...fields } = data;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.room.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name.trim() }),
        ...(fields.code !== undefined && { code: fields.code.trim().toUpperCase() }),
        ...(fields.type !== undefined && { type: fields.type }),
        ...(fields.capacity !== undefined && { capacity: parseInt(fields.capacity) }),
        ...(fields.floor !== undefined && { floor: fields.floor || null }),
        ...(fields.block !== undefined && { block: fields.block || null }),
        ...(fields.description !== undefined && { description: fields.description || null }),
        ...(fields.dept_id !== undefined && { dept_id: fields.dept_id || null }),
        ...(fields.is_active !== undefined && { is_active: fields.is_active }),
      },
      include: getRoomInclude(),
    });

    // Replace subjects if provided
    if (subject_ids !== undefined) {
      await tx.roomSubject.deleteMany({ where: { room_id: id } });
      if (subject_ids.length) {
        await tx.roomSubject.createMany({ data: subject_ids.map((subject_id) => ({ room_id: id, subject_id })) });
      }
    }

    // Replace staff if provided
    if (staff_ids !== undefined) {
      await tx.roomStaff.deleteMany({ where: { room_id: id } });
      if (staff_ids.length) {
        await tx.roomStaff.createMany({ data: staff_ids.map(({ user_id, role }) => ({ room_id: id, user_id, role: role || "LAB_STAFF" })) });
      }
    }

    return tx.room.findUnique({ where: { id }, include: getRoomInclude() });
  });
};

// ── Delete (soft) ─────────────────────────────────────────────
export const deleteRoom = async (id) => {
  guardRoom();
  await prisma.room.update({ where: { id }, data: { deleted_at: new Date(), is_active: false } });
};

export const restoreRoom = async (id) => {
  guardRoom();
  return prisma.room.update({ where: { id }, data: { deleted_at: null, is_active: true } });
};

// ── Add/Remove subjects ───────────────────────────────────────
export const addSubjectToRoom = async (room_id, subject_id) => {
  return prisma.roomSubject.upsert({
    where: { room_id_subject_id: { room_id, subject_id } },
    update: {},
    create: { room_id, subject_id },
  });
};

export const removeSubjectFromRoom = async (room_id, subject_id) => {
  await prisma.roomSubject.delete({ where: { room_id_subject_id: { room_id, subject_id } } });
};

// ── Add/Remove staff ──────────────────────────────────────────
export const addStaffToRoom = async (room_id, user_id, role = "LAB_STAFF") => {
  return prisma.roomStaff.upsert({
    where: { room_id_user_id: { room_id, user_id } },
    update: { role },
    create: { room_id, user_id, role },
  });
};

export const removeStaffFromRoom = async (room_id, user_id) => {
  await prisma.roomStaff.delete({ where: { room_id_user_id: { room_id, user_id } } });
};

// ── Availability check ────────────────────────────────────────
export const checkRoomAvailability = async (room_id, day, period_config_id, exclude_entry_id = null) => {
  const conflict = await prisma.timetableEntry.findFirst({
    where: {
      room_id,
      day,
      period_config_id,
      ...(exclude_entry_id && { id: { not: exclude_entry_id } }),
      timetable: { status: { not: "ARCHIVED" } },
    },
    include: { timetable: { select: { section: { select: { name: true } } } } },
  });
  return { available: !conflict, conflict };
};

// ── Template download ─────────────────────────────────────────
export const getRoomTemplate = async () => {
  const depts = await prisma.department.findMany({ where: { deleted_at: null }, select: { name: true } }).catch(() => []);

  const wb = xlsx.utils.book_new();

  const HEADERS = ["code*", "name*", "type*", "capacity", "block", "floor", "dept_name", "description"];
  const SAMPLE = ["R101", "Room 101", "CLASSROOM", "60", "Block A", "Ground Floor", "", "General classroom"];
  const SAMPLE2 = ["CSE-LAB-A", "CSE Lab A", "LAB", "30", "Block B", "1st Floor", "Computer Science Engg", "Programming lab with 30 computers"];

  const ws = xlsx.utils.aoa_to_sheet([HEADERS, SAMPLE, SAMPLE2]);
  ws["!cols"] = [{ wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 36 }, { wch: 30 }];
  xlsx.utils.book_append_sheet(wb, ws, "Rooms");

  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["type", "description"],
    ["CLASSROOM", "Regular teaching room"],
    ["LAB", "Computer / Science / Electronics lab"],
    ["SEMINAR_HALL", "Seminar or conference hall"],
    ["AUDITORIUM", "Large auditorium"],
    ["TRAINING_ROOM", "Training / workshop room"],
    ["OTHER", "Any other type"],
  ]), "Valid Types");

  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ["dept_name (copy exactly)"],
    ...depts.map((d) => [d.name]),
  ]), "Departments");

  const raw = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
};

// ── Bulk upload ───────────────────────────────────────────────
export const bulkUploadRooms = async (buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Rooms"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });

  const depts = await prisma.department.findMany({ where: { deleted_at: null }, select: { id: true, name: true } });
  const deptByName = Object.fromEntries(depts.map((d) => [d.name.toLowerCase().trim(), d.id]));

  const VALID_TYPES = new Set(["CLASSROOM", "LAB", "SEMINAR_HALL", "AUDITORIUM", "TRAINING_ROOM", "CONFERENCE_ROOM", "LIBRARY", "OTHER"]);
  const results = { created: [], failed: [], skipped: [], total: 0 };
  const data = rows.filter((r) => String(r["code*"] || r.code || "").trim());
  results.total = data.length;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const label = `Row ${i + 2}`;
    const code = String(row["code*"] || row.code || "").trim().toUpperCase();
    const name = String(row["name*"] || row.name || "").trim();
    const type = String(row["type*"] || row.type || "CLASSROOM").trim().toUpperCase();
    const dname = String(row.dept_name || "").trim().toLowerCase();

    if (!code) { results.failed.push({ row: label, reason: "code* required" }); continue; }
    if (!name) { results.failed.push({ row: label, code, reason: "name* required" }); continue; }
    if (!VALID_TYPES.has(type)) { results.failed.push({ row: label, code, reason: `Invalid type: "${type}"` }); continue; }

    const dept_id = dname ? (deptByName[dname] || null) : null;
    if (dname && !dept_id) { results.failed.push({ row: label, code, reason: `Department not found: "${dname}"` }); continue; }

    try {
      const room = await createRoom({ code, name, type, dept_id, capacity: row.capacity, block: row.block, floor: row.floor, description: row.description }, actingUser);
      results.created.push({ row: label, code, name, type });
    } catch (err) {
      if (err.status === 409) results.skipped.push({ row: label, code, reason: "Code already exists" });
      else results.failed.push({ row: label, code, reason: err.message });
    }
  }

  return results;
};

// ── Stats ─────────────────────────────────────────────────────
export const getRoomStats = async () => {
  if (!prisma.room) return { total: 0, available: 0, by_type: [] };
  const safeCount = async (fn) => { try { return await fn(); } catch { return 0; } };
  const [total, byType, available] = await Promise.all([
    safeCount(() => prisma.room.count({ where: { deleted_at: null } })),
    prisma.room.groupBy({ by: ["type"], where: { deleted_at: null }, _count: true }).catch(() => []),
    safeCount(() => prisma.room.count({ where: { deleted_at: null, is_active: true } })),
  ]);
  return { total, available, by_type: byType };
};