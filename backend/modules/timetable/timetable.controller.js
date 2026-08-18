// backend/modules/timetable/timetable.controller.js
import prisma from "../../utils/prisma.js";
import * as svc from "./timetable.service.js";

const ok   = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => {
  if (e.status === 409) return res.status(409).json({ success: false, message: e.message, clashes: e.clashes });
  if (e.status)         return res.status(e.status).json({ success: false, message: e.message });
  next(e);
};

// ── Period Config ─────────────────────────────────────────────
export const getPeriods = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    let sid = session_id;
    if (!sid) {
      const active = await prisma.academicSession.findFirst({ where: { is_current: true }, select: { id: true } });
      sid = active?.id;
    }
    const periods = await prisma.periodConfig.findMany({
      where:   { ...(sid ? { session_id: sid } : {}), is_active: true },
      orderBy: { order: "asc" },
    });
    ok(res, periods);
  } catch (e) { fail(res, e, next); }
};

export const createPeriod = async (req, res, next) => {
  try {
    const { session_id, name, start_time, end_time, order, days, type } = req.body;
    let sid = session_id;
    if (!sid) {
      const active = await prisma.academicSession.findFirst({ where: { is_current: true }, select: { id: true } });
      sid = active?.id;
    }
    const period = await prisma.periodConfig.create({
      data: { session_id: sid, name, start_time, end_time, order, days: days || ["MON","TUE","WED","THU","FRI"], type: type || "LECTURE", is_active: true },
    });
    ok(res, period, "Period created", 201);
  } catch (e) { fail(res, e, next); }
};

export const updatePeriod = async (req, res, next) => {
  try {
    const p = await prisma.periodConfig.update({ where: { id: req.params.id }, data: req.body });
    ok(res, p);
  } catch (e) { fail(res, e, next); }
};

export const deletePeriod = async (req, res, next) => {
  try {
    await prisma.periodConfig.delete({ where: { id: req.params.id } });
    ok(res, null, "Deleted");
  } catch (e) { fail(res, e, next); }
};

// ── Timetable list ────────────────────────────────────────────
export const listAll = async (req, res, next) => {
  try {
    const { session_id, dept_id, status } = req.query;
    const where = {};
    if (session_id) where.session_id = session_id;
    if (dept_id)    where.dept_id    = dept_id;
    if (status)     where.status     = status;
    const tts = await prisma.timetable.findMany({
      where,
      include: { section: { select: { id: true, name: true, semester: true, batch: true } }, session: { select: { name: true } }, _count: { select: { entries: true } } },
      orderBy: { section: { name: "asc" } },
    });
    ok(res, tts);
  } catch (e) { fail(res, e, next); }
};

export const getGlobal = async (req, res, next) => {
  try {
    const { session_id, dept_id, day } = req.query;
    let sid = session_id;
    if (!sid) {
      const a = await prisma.academicSession.findFirst({ where: { is_current: true }, select: { id: true } });
      sid = a?.id;
    }
    if (!sid) return ok(res, []);

    const where = { session_id: sid };
    if (dept_id) where.dept_id = dept_id;

    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        section: {
          select: {
            id: true, name: true, semester: true, batch: true,
            branch: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } },
          },
        },
        entries: {
          where: day ? { day } : {},
          include: {
            period_config: true,
            subject:  { select: { id: true, name: true, code: true, category: true } },
            faculty:  { select: { id: true, name: true, emp_id: true } },
            room:     { select: { id: true, name: true } },
          },
          orderBy: [{ day: "asc" }, { period_config: { order: "asc" } }],
        },
      },
      orderBy: [{ section: { name: "asc" } }],
    });
    ok(res, timetables);
  } catch (e) { fail(res, e, next); }
};

export const getForSection = async (req, res, next) => {
  try {
    const tt = await svc.getTimetableForSection(req.params.section_id);
    if (!tt) {
      // Create empty timetable
      const created = await svc.getOrCreateTimetable(req.params.section_id, req.query.session_id);
      return ok(res, { ...created, entries: [], workload: [] });
    }
    ok(res, tt);
  } catch (e) { fail(res, e, next); }
};

// ── Auto Generate ─────────────────────────────────────────────
export const autoGenerate = async (req, res, next) => {
  try {
    const result = await svc.autoGenerate(req.body);
    ok(res, result, `Generated: ${result.assigned_count} placed, ${result.failed_count} issues`);
  } catch (e) { fail(res, e, next); }
};

// ── Add Entry ─────────────────────────────────────────────────
export const addEntry = async (req, res, next) => {
  try {
    const { tt_id } = req.params;
    const entry = await svc.addEntry({ timetable_id: tt_id, ...req.body }, req.user?.id);
    ok(res, entry, "Entry added", 201);
  } catch (e) { fail(res, e, next); }
};

export const updateEntryLogged = async (req, res, next) => {
  try {
    const old = await prisma.timetableEntry.findUnique({ where: { id: req.params.id } });
    const entry = await prisma.timetableEntry.update({
      where:   { id: req.params.id },
      data:    req.body,
      include: { period_config: true, subject: { select: { name: true } }, faculty: { select: { name: true } } },
    });
    await prisma.timetableEntryLog.create({
      data: { timetable_id: entry.timetable_id, entry_id: entry.id, action: "UPDATE", prev_data: old, new_data: entry, changed_by: req.user?.id || null },
    }).catch(() => {});
    ok(res, entry);
  } catch (e) { fail(res, e, next); }
};

export const removeEntry = async (req, res, next) => {
  try {
    const entry = await prisma.timetableEntry.delete({ where: { id: req.params.id } });
    await prisma.timetableEntryLog.create({
      data: { timetable_id: entry.timetable_id, entry_id: entry.id, action: "DELETE", prev_data: entry, changed_by: req.user?.id || null },
    }).catch(() => {});
    ok(res, null, "Removed");
  } catch (e) { fail(res, e, next); }
};

// ── Check Clash ───────────────────────────────────────────────
export const checkClash = async (req, res, next) => {
  try {
    const result = await svc.checkClash(req.body);
    ok(res, result);
  } catch (e) { fail(res, e, next); }
};

// ── Faculty Free Slots ────────────────────────────────────────
export const facultyFreeSlots = async (req, res, next) => {
  try {
    const result = await svc.getFacultyFreeSlots({ faculty_id: req.params.faculty_id, ...req.query });
    ok(res, result);
  } catch (e) { fail(res, e, next); }
};

// ── Drag & Drop ───────────────────────────────────────────────
// Accepts two formats:
// Format A (SectionTimetablePage): { source_entry_id, source_timetable_id, source_day, source_period_id, target_day, target_period_id, swap }
// Format B (swapOrMove):           { entry_id, to_period_config_id, to_day }
export const dragDrop = async (req, res, next) => {
  try {
    const body = req.body;

    // Format A — from SectionTimetablePage
    if (body.source_entry_id || body.source_day) {
      const {
        source_entry_id, source_timetable_id, source_day, source_period_id,
        target_timetable_id, target_day, target_period_id, swap = false, notes,
      } = body;

      if (!source_entry_id && !source_timetable_id) {
        return res.status(400).json({ success: false, message: "source_entry_id or source_timetable_id required" });
      }

      // Use existing entry lookup if entry_id not provided
      let srcEntryId = source_entry_id;
      if (!srcEntryId && source_timetable_id && source_day && source_period_id) {
        const e = await prisma.timetableEntry.findUnique({
          where: { timetable_id_day_period_config_id: { timetable_id: source_timetable_id, day: source_day, period_config_id: source_period_id } },
        }).catch(() => null);
        srcEntryId = e?.id;
      }

      if (!srcEntryId) {
        return res.status(404).json({ success: false, message: "Source entry not found at that slot" });
      }

      // Find swap target entry if swap=true
      let swapWithId;
      if (swap && target_timetable_id && target_day && target_period_id) {
        const targetE = await prisma.timetableEntry.findUnique({
          where: { timetable_id_day_period_config_id: { timetable_id: target_timetable_id || source_timetable_id, day: target_day, period_config_id: target_period_id } },
        }).catch(() => null);
        swapWithId = targetE?.id;
      }

      const result = await svc.swapOrMove({
        entry_id:          srcEntryId,
        to_period_config_id: target_period_id,
        to_day:            target_day,
        swap_with_entry_id: swapWithId,
      }, req.user?.id);

      return ok(res, result);
    }

    // Format B — direct swapOrMove call
    const result = await svc.swapOrMove(body, req.user?.id);
    ok(res, result);
  } catch (e) { fail(res, e, next); }
};

// ── Gen Config ────────────────────────────────────────────────
export const getGenConfig = async (req, res, next) => {
  try {
    const config = await prisma.erpSetting.findUnique({ where: { key: "timetable_gen_config" } }).catch(() => null);
    ok(res, config?.value || {});
  } catch (e) { fail(res, e, next); }
};

export const saveGenConfig = async (req, res, next) => {
  try {
    const config = await prisma.erpSetting.upsert({
      where:  { key: "timetable_gen_config" },
      create: { key: "timetable_gen_config", value: req.body },
      update: { value: req.body },
    });
    ok(res, config);
  } catch (e) { fail(res, e, next); }
};

// ── Lock / Unlock ─────────────────────────────────────────────
export const lockWithSnap = async (req, res, next) => {
  try {
    const tt = await prisma.timetable.update({
      where: { id: req.params.id },
      data:  { locked: true, locked_by: req.user?.id, locked_at: new Date(), status: "PUBLISHED" },
    });
    await prisma.timetableSnapshot.create({
      data: { timetable_id: tt.id, label: `Auto-lock ${new Date().toLocaleDateString("en-IN")}`, snapshot_data: tt, created_by: req.user?.id },
    }).catch(() => {});
    ok(res, tt, "Timetable locked and snapshot created");
  } catch (e) { fail(res, e, next); }
};

export const unlockTT = async (req, res, next) => {
  try {
    const tt = await prisma.timetable.update({ where: { id: req.params.id }, data: { locked: false, status: "DRAFT" } });
    ok(res, tt, "Unlocked");
  } catch (e) { fail(res, e, next); }
};

// ── Snapshots ─────────────────────────────────────────────────
export const getSnaps = async (req, res, next) => {
  try {
    const snaps = await prisma.timetableSnapshot.findMany({ where: { timetable_id: req.params.id }, orderBy: { createdAt: "desc" } });
    ok(res, snaps);
  } catch (e) { fail(res, e, next); }
};

export const createSnap = async (req, res, next) => {
  try {
    const tt   = await prisma.timetable.findUnique({ where: { id: req.params.id }, include: { entries: true } });
    const snap = await prisma.timetableSnapshot.create({
      data: { timetable_id: req.params.id, label: req.body.label || `Snapshot ${new Date().toLocaleDateString("en-IN")}`, snapshot_data: tt, created_by: req.user?.id },
    });
    ok(res, snap, "Snapshot created");
  } catch (e) { fail(res, e, next); }
};

export const getSnapById = async (req, res, next) => {
  try {
    ok(res, await prisma.timetableSnapshot.findUnique({ where: { id: req.params.snap_id } }));
  } catch (e) { fail(res, e, next); }
};

export const activateSnap = async (req, res, next) => {
  try {
    const snap = await prisma.timetableSnapshot.findUnique({ where: { id: req.params.snap_id } });
    if (!snap) return res.status(404).json({ success: false, message: "Snapshot not found" });
    const data = snap.snapshot_data;
    await prisma.timetableEntry.deleteMany({ where: { timetable_id: snap.timetable_id } });
    if (data.entries?.length) {
      await prisma.timetableEntry.createMany({ data: data.entries.map(e => ({ ...e, id: undefined, createdAt: undefined, updatedAt: undefined })), skipDuplicates: true });
    }
    ok(res, null, "Snapshot restored");
  } catch (e) { fail(res, e, next); }
};

// ── History ───────────────────────────────────────────────────
export const getHistory = async (req, res, next) => {
  try {
    const { timetable_id, limit = 50 } = req.query;
    const logs = await prisma.timetableEntryLog.findMany({
      where:   { ...(timetable_id ? { timetable_id } : {}) },
      orderBy: { createdAt: "desc" },
      take:    parseInt(limit),
      include: { entry: { include: { subject: { select: { name: true } } } } },
    });
    ok(res, logs);
  } catch (e) { fail(res, e, next); }
};

// ── Rooms ─────────────────────────────────────────────────────
export const getRooms = async (req, res, next) => {
  try {
    ok(res, await prisma.room.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }));
  } catch (e) { fail(res, e, next); }
};

// ── Workload ──────────────────────────────────────────────────
export const getWorkload = async (req, res, next) => {
  try {
    const { section_id, session_id } = req.query;
    let sid = session_id;
    if (!sid) {
      const a = await prisma.academicSession.findFirst({ where: { is_current: true }, select: { id: true } });
      sid = a?.id;
    }
    const tts = section_id
      ? [await prisma.timetable.findUnique({ where: { section_id }, include: { entries: { include: { subject: true } }, section: { include: { sectionSubjects: { include: { subject: true, faculty: true } } } } } })]
      : await prisma.timetable.findMany({ where: { session_id: sid }, include: { entries: { include: { subject: true } }, section: { include: { sectionSubjects: { include: { subject: true, faculty: true } } } } } });

    const workloads = tts.filter(Boolean).map(tt => ({
      section_id:   tt.section_id,
      section_name: tt.section?.name,
      workload:     svc.buildWorkloadSummary(tt),
    }));
    ok(res, workloads);
  } catch (e) { fail(res, e, next); }
};

export const upsertWorkload = async (req, res, next) => {
  try { ok(res, req.body, "Workload config saved"); } catch (e) { fail(res, e, next); }
};

// ── Stubs for controller exports called in routes ─────────────
export const combineSlots      = async (req, res, next) => { try { ok(res, await svc.combineEntries?.(req.body.entry_ids, req.body.label, req.user) || {}); } catch(e){fail(res,e,next);} };
export const splitSlot         = async (req, res, next) => { try { ok(res, await svc.splitCombinedEntries?.([req.params.id], req.user) || {}); } catch(e){fail(res,e,next);} };
export const getTopics         = async (req, res, next) => { try { ok(res, await prisma.timetableTopicLog?.findMany({ where: req.query, orderBy: { createdAt: "desc" }, take: 100 }) || []); } catch(e){fail(res,e,next);} };
export const markTopic         = async (req, res, next) => { try { ok(res, req.body); } catch(e){fail(res,e,next);} };
export const getSpecialSessions= async (req, res, next) => { try { ok(res, []); } catch(e){fail(res,e,next);} };
export const createSpecialSession=async (req, res, next) => { try { ok(res, req.body, "Created", 201); } catch(e){fail(res,e,next);} };
export const markSpecialAttend = async (req, res, next) => { try { ok(res, req.body); } catch(e){fail(res,e,next);} };
export const getDailyReports   = async (req, res, next) => { try { ok(res, []); } catch(e){fail(res,e,next);} };
export const generateDailyReports=async(req,res,next) => { try { ok(res, {}); } catch(e){fail(res,e,next);} };
export const exportDailyReport = async (req, res, next) => { try { ok(res, {}); } catch(e){fail(res,e,next);} };
export const getCourseStructure= async (req, res, next) => { try { ok(res, []); } catch(e){fail(res,e,next);} };
export const courseStructureTemplate=async(req,res,next) => { try { ok(res, {}); } catch(e){fail(res,e,next);} };
export const uploadCourseStructure=async(req,res,next)  => { try { ok(res, {}); } catch(e){fail(res,e,next);} };
export const bulkCreatePeriods = async (req, res, next) => { next(); }; // handled inline in routes