// backend/modules/timetable/timetable.routes.js
import { Router } from "express";
import multer from "multer";
import prisma from "../../utils/prisma.js";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as c from "./timetable.controller.js";
import * as svc from "./timetable.service.js";
import { autoGenerateAll } from "./timetable.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(authenticate);

const ok = (res, data, msg = "OK") => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message, clashes: e.clashes })
  : next(e);

// ── Period Config ─────────────────────────────────────────────
router.get("/periods", requirePerm("timetable:view"), c.getPeriods);
router.patch("/periods/:id", superAdminOnly, c.updatePeriod);
router.delete("/periods/:id", superAdminOnly, c.deletePeriod);

// ── Bulk period create (MUST be before /periods POST to avoid :id conflict) ──
// Accepts { configs:[...] } OR { periods:[...] }, session_id auto-detected
router.post("/periods/bulk", superAdminOnly, async (req, res, next) => {
  try {
    const periods = req.body.periods || req.body.configs;
    if (!Array.isArray(periods) || !periods.length)
      return res.status(400).json({ success: false, message: "periods (or configs) array required" });

    let sid = req.body.session_id || req.query.session_id;
    if (!sid) {
      const active = await prisma.academicSession.findFirst({ where: { is_current: true }, select: { id: true } });
      sid = active?.id;
    }
    if (!sid) return res.status(400).json({ success: false, message: "No active session — pass session_id" });

    if (req.body.replace)
      await prisma.periodConfig.deleteMany({ where: { session_id: sid } });

    const results = [];
    for (const p of periods) {
      let type = "LECTURE";
      const n = (p.name || "").toLowerCase();
      if (n.includes("break") || n.includes("recess")) type = "BREAK";
      else if (n.includes("lunch") || n.includes("dinner")) type = "LUNCH";
      else if (n.includes("assembly")) type = "ASSEMBLY";
      try {
        const r = await prisma.periodConfig.upsert({
          where: { session_id_order: { session_id: sid, order: p.order } },
          create: { session_id: sid, name: p.name, type, start_time: p.start_time, end_time: p.end_time, order: p.order, days: p.days || ["MON", "TUE", "WED", "THU", "FRI"], is_active: true },
          update: { name: p.name, type, start_time: p.start_time, end_time: p.end_time, days: p.days || ["MON", "TUE", "WED", "THU", "FRI"], is_active: true },
        });
        results.push({ success: true, id: r.id, name: r.name, type: r.type });
      } catch (e) { results.push({ success: false, name: p.name, error: e.message }); }
    }
    const saved = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    ok(res, { total: periods.length, saved, failed, results }, `${saved} periods saved${failed ? `, ${failed} failed` : ""}`);
  } catch (e) { fail(res, e, next); }
});

router.post("/periods", superAdminOnly, c.createPeriod);

// ── Gen Config ────────────────────────────────────────────────
router.get("/gen-config", requirePerm("timetable:view"), c.getGenConfig);
router.post("/gen-config", superAdminOnly, c.saveGenConfig);

// ── Auto Generate ─────────────────────────────────────────────
router.post("/generate", superAdminOnly, c.autoGenerate);
router.post("/generate-all", superAdminOnly, async (req, res, next) => {
  try {
    const result = await autoGenerateAll(req.body);
    const msg = `Generated ${result.success_count}/${result.total} sections`;
    res.json({ success: true, message: msg, data: result });
  } catch (e) { next(e); }
});

// ── Faculty free slots — for clash-aware drag/drop ────────────
// GET /api/timetable/faculty/:id/free-slots?session_id=&day=MON&exclude_entry_id=
router.get("/faculty/:faculty_id/free-slots", requirePerm("timetable:view"), c.facultyFreeSlots);

// ── Check clash before placing/swapping ───────────────────────
// POST /api/timetable/check-clash  { timetable_id, period_config_id, day, faculty_id, subject_id, span_periods }
router.post("/check-clash", requirePerm("timetable:view"), c.checkClash);

// ── Workload summary ──────────────────────────────────────────
router.get("/workload", requirePerm("timetable:view"), c.getWorkload);
router.post("/workload", superAdminOnly, c.upsertWorkload);

// ── Timetable list & global ───────────────────────────────────
router.get("/", requirePerm("timetable:view"), c.listAll);
router.get("/global", requirePerm("timetable:view"), c.getGlobal);
router.get("/history", requirePerm("timetable:view"), c.getHistory);

// ── Course Structure ──────────────────────────────────────────
router.get("/course-structure", requirePerm("timetable:view"), c.getCourseStructure);
router.get("/course-structure/template", authenticate, c.courseStructureTemplate);
router.post("/course-structure/upload", authenticate, upload.single("file"), c.uploadCourseStructure);

// ── Topics ────────────────────────────────────────────────────
router.get("/topics", requirePerm("timetable:view"), c.getTopics);
router.post("/topics", authenticate, c.markTopic);

// ── Special Sessions ──────────────────────────────────────────
router.get("/special", requirePerm("timetable:view"), c.getSpecialSessions);
router.post("/special", superAdminOnly, c.createSpecialSession);
router.post("/special/:id/attend", authenticate, c.markSpecialAttend);

// ── Daily Reports ─────────────────────────────────────────────
router.get("/reports/daily", superAdminOnly, c.getDailyReports);
router.post("/reports/daily/generate", superAdminOnly, c.generateDailyReports);
router.get("/reports/daily/export", superAdminOnly, c.exportDailyReport);

// ── Combine suggestions (svc) ─────────────────────────────────
router.get("/suggest-combine", requirePerm("timetable:edit"), async (req, res, next) => { try { ok(res, await svc.getCombineSuggestions?.(req.query) || []); } catch (e) { fail(res, e, next); } });
router.post("/entries/combine", requirePerm("timetable:edit"), async (req, res, next) => { try { ok(res, await svc.combineEntries?.(req.body.entry_ids, req.body.label, req.user) || {}); } catch (e) { fail(res, e, next); } });
router.post("/entries/split", requirePerm("timetable:edit"), async (req, res, next) => { try { ok(res, await svc.splitCombinedEntries?.(req.body.entry_ids, req.user) || {}); } catch (e) { fail(res, e, next); } });

// ── Drag & Drop ───────────────────────────────────────────────
router.post("/drag-drop", requirePerm("timetable:edit"), c.dragDrop);

// ── Rooms ─────────────────────────────────────────────────────
router.get("/rooms", requirePerm("timetable:view"), c.getRooms);

// ── Section timetable (dynamic :section_id — after all static routes) ──
router.get("/section/:section_id", requirePerm("timetable:view"), c.getForSection);

// ── Entries ───────────────────────────────────────────────────
router.post("/:tt_id/entries", requirePerm("timetable:edit"), c.addEntry);
router.patch("/entries/:id", requirePerm("timetable:edit"), c.updateEntryLogged);
router.delete("/entries/:id", superAdminOnly, c.removeEntry);
router.post("/entries/:id/split", requirePerm("timetable:edit"), c.splitSlot);
router.post("/entries/:id/expand", requirePerm("timetable:edit"), async (req, res, next) => { try { ok(res, await svc.expandEntry?.(req.params.id, req.body.span_periods, req.user) || {}); } catch (e) { fail(res, e, next); } });

// ── Combine ───────────────────────────────────────────────────
router.post("/combine", requirePerm("timetable:edit"), c.combineSlots);

// ── Lock / Unlock ─────────────────────────────────────────────
router.post("/:id/lock", superAdminOnly, c.lockWithSnap);
router.post("/:id/unlock", superAdminOnly, c.unlockTT);

// ── Snapshots ─────────────────────────────────────────────────
router.get("/:id/snapshots", requirePerm("timetable:view"), c.getSnaps);
router.post("/:id/snapshots", superAdminOnly, c.createSnap);
router.get("/snapshots/:snap_id", requirePerm("timetable:view"), c.getSnapById);
router.post("/snapshots/:snap_id/activate", superAdminOnly, c.activateSnap);


router.get("/template/:section_id", authenticate, requirePerm("timetable.manage"), async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ success: false, message: "session_id required" });
    const buf = await svc.downloadTemplate(session_id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="timetable_template.xlsx"`);
    res.end(buf);
  } catch (e) { next(e); }
});

router.post("/template/:section_id/upload", authenticate, requirePerm("timetable.manage"), upload.single("file"), async (req, res, next) => {
  try {
    const { session_id } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    if (!session_id) return res.status(400).json({ success: false, message: "session_id required" });
    const result = await svc.generateFromTemplate(req.params.section_id, session_id, req.file.buffer, req.user.id);
    res.json({ success: true, message: `Done — ${result.created} entries`, data: result });
  } catch (e) { next(e); }
});

// ── Manual clash check ─────────────────────────────────────────
router.post("/clash-check", authenticate, requirePerm("timetable.view"), async (req, res, next) => {
  try {
    const clashes = await svc.checkClash(req.body);
    res.json({ success: true, data: { clashes, has_clash: clashes.length > 0 } });
  } catch (e) { next(e); }
});

export default router;