import { randomUUID as cryptoRandomUUID } from "crypto";
import prisma from "../../utils/prisma.js";
import { getCurrentSessionId } from "../session/session.service.js";
import { randomUUID } from "crypto";

// ── helpers ───────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();

// Raw query helpers — used for CurriculumSubject until prisma generate runs
const qCS = async (sql, ...args) => prisma.$queryRawUnsafe(sql, ...args);
const xCS = async (sql, ...args) => prisma.$executeRawUnsafe(sql, ...args);

// ── List curriculum for a course (all sems, grouped) ─────────────────────────
export const getCurriculum = async ({ course_id, program_id, semester }) => {
  let sql = `
    SELECT cs.id, cs.program_id, cs.course_id, cs.semester, cs.subject_id,
           cs.type, cs.is_core, cs.credits, cs."order",
           cs."createdAt", cs."updatedAt",
           s.id as "subject.id", s.name as "subject.name", s.code as "subject.code",
           s.nickname as "subject.nickname", s.category as "subject.category", s.credits as "subject.credits",
           c.id as "course.id", c.name as "course.name",
           p.id as "program.id", p.name as "program.name"
    FROM "CurriculumSubject" cs
    JOIN "Subject" s  ON s.id = cs.subject_id
    JOIN "Course"  c  ON c.id = cs.course_id
    JOIN "Program" p  ON p.id = cs.program_id
    WHERE 1=1
  `;
  const params = [];
  if (course_id) { params.push(course_id); sql += ` AND cs.course_id  = $${params.length}`; }
  if (program_id) { params.push(program_id); sql += ` AND cs.program_id = $${params.length}`; }
  if (semester) { params.push(parseInt(semester)); sql += ` AND cs.semester   = $${params.length}`; }
  sql += ` ORDER BY cs.semester, cs."order", s.name`;

  const rows = await qCS(sql, ...params);

  // Shape rows and group by semester
  const bySem = {};
  for (const r of rows) {
    const shaped = {
      id: r.id, program_id: r.program_id, course_id: r.course_id,
      semester: r.semester, subject_id: r.subject_id,
      type: r.type, is_core: r.is_core, credits: r.credits, order: r.order,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
      subject: {
        id: r["subject.id"], name: r["subject.name"], code: r["subject.code"],
        nickname: r["subject.nickname"], category: r["subject.category"], credits: r["subject.credits"]
      },
      course: { id: r["course.id"], name: r["course.name"] },
      program: { id: r["program.id"], name: r["program.name"] },
    };
    if (!bySem[r.semester]) bySem[r.semester] = [];
    bySem[r.semester].push(shaped);
  }
  return bySem;
};

// ── Add a subject to curriculum ───────────────────────────────────────────────
export const addCurriculumSubject = async (data) => {
  const { program_id, course_id, subject_id, type = "REGULAR", is_core = true, credits, order = 0 } = data;
  const semester = parseInt(data.semester);

  // Check if exists
  const existing = await qCS(
    `SELECT id FROM "CurriculumSubject" WHERE course_id=$1 AND semester=$2 AND subject_id=$3`,
    course_id, semester, subject_id
  );

  if (existing.length) {
    await xCS(
      `UPDATE "CurriculumSubject" SET type=$1, is_core=$2, credits=$3, "order"=$4, "updatedAt"=$5 WHERE id=$6`,
      type, is_core, credits ? parseInt(credits) : null, parseInt(order), now(), existing[0].id
    );
    return { id: existing[0].id, program_id, course_id, semester, subject_id, type, is_core };
  }

  const id = randomUUID();
  await xCS(
    `INSERT INTO "CurriculumSubject" (id, program_id, course_id, semester, subject_id, type, is_core, credits, "order", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    id, program_id, course_id, semester, subject_id, type, is_core,
    credits ? parseInt(credits) : null, parseInt(order), now(), now()
  );
  return { id, program_id, course_id, semester, subject_id, type, is_core };
};

// ── Bulk add subjects for a semester ─────────────────────────────────────────
export const bulkAddCurriculumSubjects = async ({ program_id, course_id, semester, subjects }) => {
  const sem = parseInt(semester);
  const results = [];
  for (let idx = 0; idx < subjects.length; idx++) {
    const { subject_id, type = "REGULAR", is_core = true, credits } = subjects[idx];
    results.push(await addCurriculumSubject({ program_id, course_id, semester: sem, subject_id, type, is_core, credits, order: idx }));
  }
  return results;
};

// ── Remove a subject from curriculum ─────────────────────────────────────────
export const removeCurriculumSubject = async (id) => {
  await xCS(`DELETE FROM "CurriculumSubject" WHERE id=$1`, id);
  return { deleted: true, id };
};

// ── Copy a full semester's curriculum to another semester ─────────────────────
export const copySemesterCurriculum = async ({ course_id, program_id, from_semester, to_semester }) => {
  const from = parseInt(from_semester);
  const to = parseInt(to_semester);
  const rows = await qCS(
    `SELECT * FROM "CurriculumSubject" WHERE course_id=$1 AND semester=$2`,
    course_id, from
  );
  if (!rows.length) {
    const e = new Error(`No curriculum defined for semester ${from}`);
    e.statusCode = 404; throw e;
  }
  const results = [];
  for (const r of rows) {
    results.push(await addCurriculumSubject({
      program_id, course_id, semester: to,
      subject_id: r.subject_id, type: r.type, is_core: r.is_core,
      credits: r.credits, order: r.order,
    }));
  }
  return results;
};

// ── AUTO-ASSIGN subjects to a section from curriculum ────────────────────────
// ── Internal helper: write to SectionSubjectHistory ─────────────────────────
const logSubjectHistory = async (entries) => {
  if (!entries?.length) return;
  try {
    const _sessionId = await getCurrentSessionId().catch(() => "DEFAULT-SESSION-0000-0000-000000000001");
    const enriched = entries.map(e => ({ ...e, session_id: e.session_id || _sessionId }));
    await prisma.sectionSubjectHistory.createMany({ data: enriched, skipDuplicates: false });
  } catch (e) { console.error("[curriculum] history log failed:", e.message); }
};

export const autoAssignSubjectsToSection = async (section_id, { reason = "manual", changed_by = null } = {}) => {
  const section = await prisma.section.findUnique({
    where: { id: section_id },
    include: {
      course: { select: { id: true, name: true, program_id: true } },
      sectionSubjects: { select: { subject_id: true, faculty_id: true, status: true, type: true } },
    },
  });
  if (!section) { const e = new Error("Section not found"); e.statusCode = 404; throw e; }

  // Get curriculum subjects for this course+semester
  const curriculum = await qCS(
    `SELECT cs.subject_id, cs.type, cs."order",
            s.name as subject_name, s.code as subject_code
     FROM "CurriculumSubject" cs
     JOIN "Subject" s ON s.id = cs.subject_id
     WHERE cs.course_id = $1 AND cs.semester = $2
     ORDER BY cs."order"`,
    section.course_id, section.semester
  );

  if (!curriculum.length) {
    return {
      assigned: [], removed: [], updated: [], already_had: [], skipped: [],
      message: `No curriculum defined for ${section.course?.name} Sem ${section.semester} — define it in the Curriculum page first`,
    };
  }

  const curriculumIds = new Set(curriculum.map((c) => c.subject_id));
  const existing = new Navigation(section.sectionSubjects.map((ss) => [ss.subject_id, ss]));

  const assigned = [];
  const updated = [];
  const removed = [];
  const already_had = [];
  const historyLogs = [];

  // ── Step 1: Assign / reactivate subjects IN the curriculum ────────────────
  for (const cs of curriculum) {
    const ex = existing.get(cs.subject_id);
    if (ex) {
      if (ex.status === "REMOVED") {
        // Reactivate — was previously removed
        await prisma.sectionSubject.update({
          where: { section_id_subject_id: { section_id, subject_id: cs.subject_id } },
          data: { status: "ACTIVE", type: cs.type },
        });
        assigned.push({ subject_id: cs.subject_id, name: cs.subject_name, code: cs.subject_code, action: "reactivated" });
        historyLogs.push({
          id: cryptoRandomUUID(), section_id, subject_id: cs.subject_id,
          action: "REACTIVATED", reason,
          prev_data: { status: ex.status, type: ex.type },
          new_data: { status: "ACTIVE", type: cs.type },
          changed_by,
        });
      } else if (ex.type !== cs.type) {
        // Type changed in curriculum — update
        await prisma.sectionSubject.update({
          where: { section_id_subject_id: { section_id, subject_id: cs.subject_id } },
          data: { type: cs.type },
        });
        updated.push({ subject_id: cs.subject_id, name: cs.subject_name, code: cs.subject_code, prev_type: ex.type, new_type: cs.type });
        historyLogs.push({
          id: cryptoRandomUUID(), section_id, subject_id: cs.subject_id,
          action: "UPDATED", reason,
          prev_data: { status: ex.status, type: ex.type },
          new_data: { status: ex.status, type: cs.type },
          changed_by,
        });
      } else {
        already_had.push({ subject_id: cs.subject_id, name: cs.subject_name, code: cs.subject_code });
      }
    } else {
      // New — create
      const _sid = await getCurrentSessionId();
      await prisma.sectionSubject.create({
        data: { session_id: _sid, section_id, subject_id: cs.subject_id, type: cs.type, status: "ACTIVE" },
      });
      assigned.push({ subject_id: cs.subject_id, name: cs.subject_name, code: cs.subject_code, action: "assigned" });
      historyLogs.push({
        id: cryptoRandomUUID(), section_id, subject_id: cs.subject_id,
        action: reason.startsWith("promote") ? "AUTO_ASSIGNED" : "ASSIGNED", reason,
        prev_data: null,
        new_data: { status: "ACTIVE", type: cs.type },
        changed_by,
      });
    }
  }

  // ── Step 2: Remove ACTIVE subjects NOT in the new curriculum ─────────────
  // Only applies when triggered by semester change (promote/demote)
  const isSemesterChange = reason.startsWith("promote") || reason.startsWith("demote");
  if (isSemesterChange) {
    for (const [subject_id, ex] of existing) {
      if (!curriculumIds.has(subject_id) && ex.status === "ACTIVE") {
        await prisma.sectionSubject.update({
          where: { section_id_subject_id: { section_id, subject_id } },
          data: { status: "REMOVED" },
        });
        removed.push({ subject_id, action: "removed" });
        historyLogs.push({
          id: cryptoRandomUUID(), section_id, subject_id,
          action: "AUTO_REMOVED", reason,
          prev_data: { status: ex.status, type: ex.type, faculty_id: ex.faculty_id },
          new_data: { status: "REMOVED" },
          changed_by,
        });
      }
    }
  }

  // Write all history in one batch
  await logSubjectHistory(historyLogs);

  return {
    assigned,
    updated,
    removed,
    already_had,
    skipped: [],
    total_curriculum: curriculum.length,
    history_logged: historyLogs.length,
  };
};

// ── BULK auto-assign to multiple sections ─────────────────────────────────────
export const bulkAutoAssign = async (section_ids) => {
  const results = {};
  for (const id of section_ids) {
    try { results[id] = await autoAssignSubjectsToSection(id); }
    catch (e) { results[id] = { error: e.message }; }
  }
  return results;
};

// ── BULK TEMPLATE — one sheet per section, sem-wise tables inside ────────────
export const getCurriculumTemplate = async () => {
  const xlsx = (await import("xlsx")).default;

  // Fetch all sections with course/program info
  const sections = await prisma.section.findMany({
    include: {
      course: { select: { id: true, name: true, program: { select: { id: true, name: true, department: { select: { name: true } } } } } },
    },
    orderBy: [{ course: { program: { name: "asc" } } }, { course: { name: "asc" } }, { semester: "asc" }, { name: "asc" }],
  });

  // Fetch ALL existing curriculum grouped by course+semester
  const existing = await qCS(`
    SELECT cs.course_id, cs.semester, cs.type, cs.is_core, cs.credits,
           s.name as subject_name, s.code as subject_code
    FROM "CurriculumSubject" cs
    JOIN "Subject" s ON s.id = cs.subject_id
    ORDER BY cs.course_id, cs.semester, cs."order", s.name
  `);
  const bySem = {};
  for (const r of existing) {
    const key = `${r.course_id}::${r.semester}`;
    if (!bySem[key]) bySem[key] = [];
    bySem[key].push(r);
  }

  // Subject reference
  const allSubjects = await prisma.subject.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true, nickname: true, category: true, credits: true },
  });

  const wb = xlsx.utils.book_new();

  // Sheet name = same as student template: "CourseName–SecName SemX"
  const usedNames = new Set();
  const safeSheet = (sec) => {
    const course = sec.course?.name || "";
    const base = `${course}–${sec.name} Sem${sec.semester}`.replace(/[\[\]:*?/\\]/g, "").slice(0, 31);
    let n = base;
    if (usedNames.has(n)) { let i = 2; while (usedNames.has(n)) { const s = `(${i++})`; n = base.slice(0, 31 - s.length) + s; } }
    usedNames.add(n); return n;
  };

  const COL_HEADERS = ["Subject Code *", "Type", "Is Core (true/false)", "Credits Override", "— Subject Name (info)"];
  const COL_WIDTHS = [{ wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 36 }];

  // ── One sheet per section ─────────────────────────────────────────────────
  for (const sec of sections) {
    const sheetName = safeSheet(sec);
    const course = sec.course?.name || "";
    const program = sec.course?.program?.name || "";
    const dept = sec.course?.program?.department?.name || "";
    const maxSem = 8;

    const rows = [];

    // Section info header
    rows.push(["CURRICULUM TEMPLATE"]);
    rows.push([`Section: ${sec.name}`, `Course: ${course}`, `Program: ${program}`, `Dept: ${dept}`, `Batch: ${sec.batch || ""}`]);
    rows.push([`Course ID (do not edit): ${sec.course?.id || ""}`, `Program ID (do not edit): ${sec.course?.program?.id || ""}`]);
    rows.push([]);

    // ── One table per semester ──────────────────────────────────────────────
    for (let sem = 1; sem <= maxSem; sem++) {
      const semRows = bySem[`${sec.course_id}::${sem}`] || [];

      // Semester header
      rows.push([`SEMESTER ${sem}`, `Semester (do not edit): ${sem}`]);
      rows.push(COL_HEADERS);

      if (semRows.length) {
        for (const r of semRows) {
          rows.push([r.subject_code, r.type || "REGULAR", r.is_core !== false ? "true" : "false", r.credits || "", r.subject_name]);
        }
      } else {
        rows.push(["", "REGULAR", "true", "", "← add subject codes here"]);
      }
      rows.push([]); // blank spacer between sems
    }

    const ws = xlsx.utils.aoa_to_sheet(rows);
    ws["!cols"] = COL_WIDTHS;
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
  }

  // ── Subject Reference sheet ──────────────────────────────────────────────
  const subWs = xlsx.utils.aoa_to_sheet([
    ["Subject Code", "Name", "Nickname", "Category", "Credits"],
    ...allSubjects.map((s) => [s.code, s.name, s.nickname || "", s.category, s.credits]),
  ]);
  subWs["!cols"] = [{ wch: 16 }, { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 8 }];
  xlsx.utils.book_append_sheet(wb, subWs, "Subjects (Reference)");

  // ── Instructions sheet ───────────────────────────────────────────────────
  const instrWs = xlsx.utils.aoa_to_sheet([
    ["HOW TO USE THIS CURRICULUM TEMPLATE"],
    [],
    ["1. Each sheet = one Section (same naming as student template: e.g. 'CSE–A Sem4')."],
    ["2. Each sheet has SEPARATE TABLES per semester (Sem 1 through Sem 8)."],
    ["3. Fill Subject Code under each semester table — must match 'Subjects (Reference)' sheet."],
    ["4. Type: REGULAR | ELECTIVE | PRACTICAL | TRAINING | OTHER (default: REGULAR)"],
    ["5. Is Core: true = mandatory, false = elective."],
    ["6. Credits Override: leave blank to use subject default."],
    ["7. Row 3 contains Course ID and Program ID — do NOT edit these."],
    ["8. 'SEMESTER X' header rows and 'Semester: X' tag are used during upload — do NOT edit."],
    ["9. Column E (Subject Name) is info only — ignored on upload."],
    [],
    ["Upload via: Curriculum page → Bulk Upload button"],
  ]);
  instrWs["!cols"] = [{ wch: 80 }];
  xlsx.utils.book_append_sheet(wb, instrWs, "Instructions");

  return {
    buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }),
    filename: `curriculum_template_${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
};

// ── BULK UPLOAD from Excel ────────────────────────────────────────────────────
export const bulkUploadCurriculum = async (buffer) => {
  const xlsx = (await import("xlsx")).default;
  const wb = xlsx.read(buffer, { type: "buffer" });

  // Subject code → id lookup
  const allSubjects = await prisma.subject.findMany({ select: { id: true, code: true } });
  const subjectByCode = Object.fromEntries(allSubjects.map((s) => [s.code.toLowerCase().trim(), s.id]));

  const SKIP = new Set(["subjects (reference)", "instructions"]);
  const results = { created: 0, updated: 0, failed: [], sheets_processed: 0 };

  for (const sheetName of wb.SheetNames) {
    if (SKIP.has(sheetName.toLowerCase())) continue;

    const ws = wb.Sheets[sheetName];
    const allRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });

    // Read course_id and program_id from row 3 (index 2)
    const metaRow = allRows[2] || [];
    const courseCell = String(metaRow[0] || "");
    const progCell = String(metaRow[1] || "");
    const course_id = courseCell.includes(":") ? courseCell.split(":").slice(1).join(":").trim() : "";
    const program_id = progCell.includes(":") ? progCell.split(":").slice(1).join(":").trim() : "";

    if (!course_id || !program_id) {
      results.failed.push({ sheet: sheetName, reason: "Could not read Course ID / Program ID from row 3" });
      continue;
    }

    results.sheets_processed++;

    // Walk rows — detect "SEMESTER X" header rows, then collect data rows until next sem or end
    let currentSem = null;
    let colHeaders = null;
    let semOrder = 0;

    for (let ri = 4; ri < allRows.length; ri++) {
      const row = allRows[ri];
      const c0 = String(row[0] || "").trim();
      const c1 = String(row[1] || "").trim();

      // Detect semester header: col A = "SEMESTER X", col B = "Semester (do not edit): X"
      if (c0.startsWith("SEMESTER") && c1.startsWith("Semester (do not edit):")) {
        currentSem = parseInt(c1.split(":").pop().trim());
        colHeaders = null;
        semOrder = 0;
        continue;
      }

      if (currentSem === null) continue; // haven't hit first sem yet

      // Detect column header row
      if (c0 === "Subject Code *" || c0 === "Subject Code") {
        colHeaders = row.map((h) => String(h).trim());
        continue;
      }

      // Blank spacer row
      if (!c0 && row.every((c) => c === "")) { colHeaders = null; continue; }

      if (!colHeaders) continue;

      // Data row
      const obj = Object.fromEntries(colHeaders.map((h, i) => [h, row[i] ?? ""]));
      const code = String(obj["Subject Code *"] || obj["Subject Code"] || "").trim();
      if (!code) continue;

      const subject_id = subjectByCode[code.toLowerCase()];
      if (!subject_id) {
        results.failed.push({ sheet: sheetName, sem: currentSem, code, reason: `Subject code "${code}" not found` });
        continue;
      }

      const type = String(obj["Type"] || "REGULAR").trim().toUpperCase() || "REGULAR";
      const is_core = String(obj["Is Core (true/false)"] || "true").trim().toLowerCase() !== "false";
      const credits = parseInt(obj["Credits Override"]) || null;

      try {
        await addCurriculumSubject({ program_id, course_id, semester: currentSem, subject_id, type, is_core, credits, order: semOrder++ });
        results.created++;
      } catch (e) {
        results.failed.push({ sheet: sheetName, sem: currentSem, code, reason: e.message });
      }
    }
  }

  results.total = results.created + results.updated + results.failed.length;

  // Auto-reassign subjects to all sections whose course+semester was updated
  // Runs in background — doesn't block the response
  if (results.created > 0 || results.updated > 0) {
    const affectedSheets = new Set(
      wb.SheetNames.filter((n) => !["subjects (reference)", "instructions"].includes(n.toLowerCase()))
    );
    setImmediate(async () => {
      try {
        for (const sheetName of affectedSheets) {
          const ws = wb.Sheets[sheetName];
          const allRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });
          const metaRow = allRows[2] || [];
          const courseId = String(metaRow[0] || "").split(":").slice(1).join(":").trim();
          if (!courseId) continue;

          // Find all sections for this course+semester and auto-assign
          const sections = await prisma.section.findMany({
            where: { course_id: courseId, status: "ACTIVE" },
            select: { id: true },
          });
          for (const sec of sections) {
            await autoAssignSubjectsToSection(sec.id, {
              reason: "curriculum_upload",
              changed_by: null,
            }).catch(() => { });
          }
        }
      } catch (e) { console.error("[curriculum] post-upload auto-assign failed:", e.message); }
    });
  }

  return results;
};