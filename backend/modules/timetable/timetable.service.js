// backend/modules/timetable/timetable.service.js
import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

const getActiveSession = async (session_id) => {
  if (session_id) return prisma.academicSession.findUnique({ where: { id: session_id } });
  return prisma.academicSession.findFirst({ where: { is_current: true } });
};

// ─────────────────────────────────────────────────────────────
// GET or CREATE timetable for a section
// ─────────────────────────────────────────────────────────────
export const getOrCreateTimetable = async (section_id, session_id) => {
  let tt = await prisma.timetable.findUnique({ where: { section_id } });
  if (!tt) {
    const session = await getActiveSession(session_id);
    if (!session) throw new Error("No active session found");
    const section = await prisma.section.findUnique({
      where: { id: section_id },
      select: { branch: { select: { program: { select: { dept_id: true } } } } }
    });
    const dept_id = section?.branch?.program?.dept_id || null;
    tt = await prisma.timetable.create({
      data: { section_id, session_id: session.id, dept_id: dept_id, status: "DRAFT" },
    });
  }
  return tt;
};

// ─────────────────────────────────────────────────────────────
// GET TIMETABLE WITH FULL DETAILS
// ─────────────────────────────────────────────────────────────
export const getTimetableForSection = async (section_id) => {
  const tt = await prisma.timetable.findUnique({
    where: { section_id },
    include: {
      section: {
        include: {
          branch: { include: { program: { include: { department: true } } } },
          class_coordinator: { select: { id: true, name: true } },
          sectionSubjects: {
            where: { status: "ACTIVE" },
            include: { subject: true, faculty: { select: { id: true, name: true, emp_id: true } } },
          },
        },
      },
      session: { select: { id: true, name: true } },
      entries: {
        include: {
          period_config: true,
          subject: { select: { id: true, name: true, code: true, category: true, credits: true } },
          faculty: { select: { id: true, name: true, emp_id: true } },
          room: { select: { id: true, name: true } },
        },
        orderBy: [{ day: "asc" }, { period_config: { order: "asc" } }],
      },
    },
  });
  if (!tt) return null;

  // Build workload summary per subject
  const workload = buildWorkloadSummary(tt);
  return { ...tt, workload };
};

// ─────────────────────────────────────────────────────────────
// WORKLOAD SUMMARY — how many periods assigned vs needed
// ─────────────────────────────────────────────────────────────
export const buildWorkloadSummary = (tt) => {
  const subjects = tt.section?.sectionSubjects || [];
  const entries = tt.entries || [];

  return subjects.map(ss => {
    const subjectEntries = entries.filter(e => e.subject_id === ss.subject_id);
    const assigned = subjectEntries.reduce((sum, e) => sum + (e.span_periods || 1), 0);
    const needed = ss.subject?.credits || 4; // default 4 periods/week
    const isLab = ss.subject?.category === "PRACTICAL" || ss.subject?.category === "LAB";

    return {
      subject_id: ss.subject_id,
      subject_name: ss.subject?.name,
      subject_code: ss.subject?.code,
      faculty_id: ss.faculty_id,
      faculty_name: ss.faculty?.name,
      category: ss.subject?.category,
      is_lab: isLab,
      needed,
      assigned,
      remaining: Math.max(0, needed - assigned),
      complete: assigned >= needed,
      entries: subjectEntries.map(e => ({ day: e.day, period: e.period_config?.name, span: e.span_periods })),
    };
  });
};

// ─────────────────────────────────────────────────────────────
// FACULTY FREE SLOTS
// ─────────────────────────────────────────────────────────────
export const getFacultyFreeSlots = async ({ faculty_id, session_id, day, exclude_entry_id }) => {
  const session = await getActiveSession(session_id);
  if (!session) throw new Error("No active session");

  // All schedulable periods
  const allPeriods = await prisma.periodConfig.findMany({
    where: { session_id: session.id, is_active: true, type: "LECTURE" },
    orderBy: { order: "asc" },
  });

  // Faculty's busy entries
  const where = {
    faculty_id,
    timetable: { session_id: session.id },
    ...(day ? { day } : {}),
    ...(exclude_entry_id ? { id: { not: exclude_entry_id } } : {}),
  };

  const busyEntries = await prisma.timetableEntry.findMany({
    where,
    include: {
      period_config: true,
      timetable: { include: { section: { select: { name: true, semester: true } } } },
      subject: { select: { name: true, code: true, category: true } },
    },
  });

  const busyMap = new Set(busyEntries.map(e => `${e.day}-${e.period_config_id}`));

  const busy = busyEntries.map(e => ({
    entry_id: e.id,
    day: e.day,
    period_config_id: e.period_config_id,
    period_name: e.period_config?.name,
    start_time: e.period_config?.start_time,
    end_time: e.period_config?.end_time,
    order: e.period_config?.order,
    section_name: e.timetable?.section?.name,
    section_semester: e.timetable?.section?.semester,
    subject_name: e.subject?.name,
    subject_category: e.subject?.category,
    span_periods: e.span_periods,
  }));

  const days = day ? [day] : DAYS;
  const free = [];
  for (const d of days) {
    for (const p of allPeriods) {
      if (!p.days.includes(d)) continue;
      if (busyMap.has(`${d}-${p.id}`)) continue;
      // Check if next period also free (for lab)
      const nextPeriod = allPeriods.find(np => np.order === p.order + 1 && np.days.includes(d));
      free.push({
        day: d,
        period_config_id: p.id,
        period_name: p.name,
        start_time: p.start_time,
        end_time: p.end_time,
        order: p.order,
        next_free: nextPeriod ? !busyMap.has(`${d}-${nextPeriod.id}`) : false,
        next_period_id: nextPeriod?.id,
        next_period_name: nextPeriod?.name,
        suitable_for_lab: nextPeriod ? !busyMap.has(`${d}-${nextPeriod.id}`) : false,
      });
    }
  }

  // Weekly load summary
  const weeklyLoad = DAYS.map(d => ({
    day: d,
    periods: busyEntries.filter(e => e.day === d).length,
    total_hours: busyEntries.filter(e => e.day === d).reduce((s, e) => s + (e.span_periods || 1), 0),
  }));

  return {
    faculty_id,
    session_id: session.id,
    day: day || "ALL",
    total_busy: busy.length,
    total_free: free.length,
    weekly_hours: busyEntries.reduce((s, e) => s + (e.span_periods || 1), 0),
    weekly_load: weeklyLoad,
    busy,
    free,
  };
};

// ─────────────────────────────────────────────────────────────
// CHECK CLASH BEFORE ADD/SWAP
// ─────────────────────────────────────────────────────────────
export const checkClash = async ({
  timetable_id, period_config_id, day, faculty_id,
  subject_id, span_periods = 1, exclude_entry_id,
}) => {
  const clashes = [];
  const tt = await prisma.timetable.findUnique({ where: { id: timetable_id }, select: { session_id: true } });

  // 1. Slot occupied in this section's timetable
  const slotBusy = await prisma.timetableEntry.findFirst({
    where: {
      timetable_id,
      period_config_id,
      day,
      ...(exclude_entry_id ? { id: { not: exclude_entry_id } } : {}),
    },
    include: { subject: { select: { name: true } }, faculty: { select: { name: true } } },
  });
  if (slotBusy) {
    clashes.push({
      type: "SLOT_OCCUPIED",
      message: `This slot already has ${slotBusy.subject?.name || "a class"}${slotBusy.faculty?.name ? ` by ${slotBusy.faculty.name}` : ""}`,
    });
  }

  // 2. Faculty clash across all sections
  if (faculty_id) {
    const facultyBusy = await prisma.timetableEntry.findFirst({
      where: {
        faculty_id,
        period_config_id,
        day,
        timetable: { session_id: tt?.session_id },
        ...(exclude_entry_id ? { id: { not: exclude_entry_id } } : {}),
      },
      include: {
        timetable: { include: { section: { select: { name: true } } } },
        subject: { select: { name: true } },
      },
    });
    if (facultyBusy) {
      clashes.push({
        type: "FACULTY_CLASH",
        message: `Faculty already teaching ${facultyBusy.subject?.name || "another subject"} in ${facultyBusy.timetable?.section?.name} at this slot`,
      });
    }
  }

  // 3. Lab consecutive check (span_periods = 2)
  if (span_periods >= 2) {
    const thisPeriod = await prisma.periodConfig.findUnique({ where: { id: period_config_id }, select: { order: true, session_id: true } });
    const nextPeriod = await prisma.periodConfig.findFirst({
      where: { session_id: thisPeriod?.session_id, order: (thisPeriod?.order || 0) + 1 },
      orderBy: { order: "asc" },
    });

    if (!nextPeriod) {
      clashes.push({ type: "LAB_NO_NEXT_SLOT", message: "No consecutive slot available after this period for lab" });
    } else {
      const nextBusy = await prisma.timetableEntry.findFirst({
        where: {
          timetable_id,
          period_config_id: nextPeriod.id,
          day,
          ...(exclude_entry_id ? { id: { not: exclude_entry_id } } : {}),
        },
        include: { subject: { select: { name: true } } },
      });
      if (nextBusy) {
        clashes.push({
          type: "LAB_CONSECUTIVE_BLOCKED",
          message: `Lab needs 2 consecutive slots — next slot (${nextPeriod.name}) already has ${nextBusy.subject?.name || "a class"}`,
        });
      }

      if (faculty_id) {
        const nextFacultyBusy = await prisma.timetableEntry.findFirst({
          where: {
            faculty_id,
            period_config_id: nextPeriod.id,
            day,
            timetable: { session_id: tt?.session_id },
            ...(exclude_entry_id ? { id: { not: exclude_entry_id } } : {}),
          },
          include: { timetable: { include: { section: { select: { name: true } } } } },
        });
        if (nextFacultyBusy) {
          clashes.push({
            type: "LAB_FACULTY_CLASH_NEXT",
            message: `Faculty busy in next slot (${nextPeriod.name}) in ${nextFacultyBusy.timetable?.section?.name} — can't place lab here`,
          });
        }
      }
    }
  }

  return {
    can_proceed: clashes.length === 0,
    clashes,
    span_periods,
  };
};

// ─────────────────────────────────────────────────────────────
// ADD / UPDATE ENTRY
// ─────────────────────────────────────────────────────────────
export const addEntry = async ({
  timetable_id, period_config_id, day, subject_id,
  faculty_id, room_id, entry_type, notes, span_periods = 1,
}, user_id) => {
  // Auto-detect span for lab
  if (subject_id) {
    const subj = await prisma.subject.findUnique({ where: { id: subject_id }, select: { category: true } });
    if (subj?.category === "PRACTICAL") span_periods = 2;
  }

  // Clash check
  const clash = await checkClash({ timetable_id, period_config_id, day, faculty_id, subject_id, span_periods });
  if (!clash.can_proceed) {
    const err = new Error(clash.clashes.map(c => c.message).join("; "));
    err.status = 409;
    err.clashes = clash.clashes;
    throw err;
  }

  const entry = await prisma.timetableEntry.create({
    data: {
      timetable_id,
      period_config_id,
      day,
      subject_id: subject_id || null,
      faculty_id: faculty_id || null,
      room_id: room_id || null,
      entry_type: entry_type || (span_periods > 1 ? "LAB" : "LECTURE"),
      notes: notes || null,
      span_periods,
    },
    include: {
      period_config: true,
      subject: { select: { id: true, name: true, code: true, category: true, credits: true } },
      faculty: { select: { id: true, name: true, emp_id: true } },
    },
  });

  // Log
  await prisma.timetableEntryLog.create({
    data: { timetable_id, entry_id: entry.id, action: "ADD", new_data: entry, changed_by: user_id || null },
  }).catch(() => { });

  return entry;
};

// ─────────────────────────────────────────────────────────────
// AUTO-GENERATE TIMETABLE
// ─────────────────────────────────────────────────────────────
export const autoGenerate = async ({ section_id, session_id, force = false }) => {
  const session = await getActiveSession(session_id);
  if (!session) throw new Error("No active session");

  const tt = await getOrCreateTimetable(section_id, session.id);
  if (tt.locked && !force) throw new Error("Timetable is locked — use force:true to regenerate");

  // Clear existing entries if force
  if (force) await prisma.timetableEntry.deleteMany({ where: { timetable_id: tt.id } });

  // Get all LECTURE period slots (ordered)
  const periods = await prisma.periodConfig.findMany({
    where: { session_id: session.id, is_active: true, type: "LECTURE" },
    orderBy: { order: "asc" },
  });

  if (!periods.length) throw new Error("No period configs defined — add periods first via /periods/bulk");

  // Get subjects assigned to this section with faculty + credits
  const sectionSubjects = await prisma.sectionSubject.findMany({
    where: { section_id, status: "ACTIVE" },
    include: { subject: true, faculty: true },
  });

  if (!sectionSubjects.length) throw new Error("No subjects assigned to section — assign subjects first");

  // Track what's already placed
  const placed = {}; // subject_id → count placed
  const daySlotUsed = {}; // "MON-periodId" → true
  const facultyBusy = {}; // "facultyId-MON-periodId" → true

  // Load faculty's existing commitments from OTHER sections
  const allFacultyIds = [...new Set(sectionSubjects.map(s => s.faculty_id).filter(Boolean))];
  if (allFacultyIds.length) {
    const existing = await prisma.timetableEntry.findMany({
      where: { timetable: { session_id: session.id }, faculty_id: { in: allFacultyIds }, timetable_id: { not: tt.id } },
      select: { faculty_id: true, day: true, period_config_id: true },
    });
    for (const e of existing) {
      facultyBusy[`${e.faculty_id}-${e.day}-${e.period_config_id}`] = true;
    }
  }

  const assigned = [];
  const failed = [];

  // Sort: labs first (they need 2 consecutive), then by credits desc
  const sorted = [...sectionSubjects].sort((a, b) => {
    const aLab = a.subject?.category === "PRACTICAL" ? 1 : 0;
    const bLab = b.subject?.category === "PRACTICAL" ? 1 : 0;
    if (bLab !== aLab) return bLab - aLab;
    return (b.subject?.credits || 4) - (a.subject?.credits || 4);
  });

  for (const ss of sorted) {
    const needed = ss.subject?.credits || 4;
    const isLab = ss.subject?.category === "PRACTICAL";
    const spanPeriods = isLab ? 2 : 1;
    placed[ss.subject_id] = 0;

    // Distribute across days — try to spread evenly
    let attempts = 0;
    while (placed[ss.subject_id] < needed && attempts < 500) {
      attempts++;

      // Pick a day (rotate through days for even distribution)
      const dayIndex = placed[ss.subject_id] % DAYS.length;
      const day = DAYS[dayIndex];

      // Find a free slot on this day
      const dayPeriods = periods.filter(p => p.days.includes(day));
      let placed_this_attempt = false;

      for (let i = 0; i < dayPeriods.length; i++) {
        const p = dayPeriods[i];
        const key = `${day}-${p.id}`;
        const fKey = ss.faculty_id ? `${ss.faculty_id}-${day}-${p.id}` : null;

        if (daySlotUsed[key]) continue;
        if (fKey && facultyBusy[fKey]) continue;

        // Lab: check next consecutive slot too
        if (isLab) {
          const nextP = dayPeriods[i + 1];
          if (!nextP) continue; // no next period
          const nextKey = `${day}-${nextP.id}`;
          const nextFKey = ss.faculty_id ? `${ss.faculty_id}-${day}-${nextP.id}` : null;
          if (daySlotUsed[nextKey]) continue;
          if (nextFKey && facultyBusy[nextFKey]) continue;

          // Place lab (2 consecutive)
          try {
            const entry = await prisma.timetableEntry.create({
              data: {
                timetable_id: tt.id,
                period_config_id: p.id,
                day,
                subject_id: ss.subject_id,
                faculty_id: ss.faculty_id || null,
                entry_type: "LAB",
                span_periods: 2,
              },
            });
            daySlotUsed[key] = true;
            daySlotUsed[nextKey] = true;
            if (fKey) facultyBusy[fKey] = true;
            if (nextFKey) facultyBusy[nextFKey] = true;
            placed[ss.subject_id]++;
            assigned.push({ subject: ss.subject?.name, day, period: p.name, span: 2 });
            placed_this_attempt = true;
            break;
          } catch (e) {
            failed.push({ subject: ss.subject?.name, reason: e.message });
          }
        } else {
          // Theory — single slot
          try {
            await prisma.timetableEntry.create({
              data: {
                timetable_id: tt.id,
                period_config_id: p.id,
                day,
                subject_id: ss.subject_id,
                faculty_id: ss.faculty_id || null,
                entry_type: "LECTURE",
                span_periods: 1,
              },
            });
            daySlotUsed[key] = true;
            if (fKey) facultyBusy[fKey] = true;
            placed[ss.subject_id]++;
            assigned.push({ subject: ss.subject?.name, day, period: p.name, span: 1 });
            placed_this_attempt = true;
            break;
          } catch (e) {
            failed.push({ subject: ss.subject?.name, reason: e.message });
          }
        }
      }

      if (!placed_this_attempt) {
        attempts++; // single increment so we try all day combinations
      }
    }

    const got = placed[ss.subject_id];
    if (got < needed) {
      failed.push({
        subject: ss.subject?.name,
        subject_id: ss.subject_id,
        faculty: ss.faculty?.name,
        faculty_id: ss.faculty_id,
        needed,
        got,
        reason: got === 0
          ? "Could not place any slot — faculty may be fully booked or no free slots"
          : `Could only place ${got}/${needed} — not enough free slots`,
      });
    }
  }

  // Update timetable status
  await prisma.timetable.update({
    where: { id: tt.id },
    data: { status: "DRAFT", generated_at: new Date() },
  });

  const workload = buildWorkloadSummary({
    section: { sectionSubjects: sectionSubjects.map(ss => ({ ...ss, subject: ss.subject })) },
    entries: await prisma.timetableEntry.findMany({ where: { timetable_id: tt.id }, include: { subject: true } }),
  });

  return {
    timetable_id: tt.id,
    section_id,
    total_subjects: sectionSubjects.length,
    assigned_count: assigned.length,
    failed_count: failed.length,
    assigned,
    failed,
    workload,
  };
};

// ─────────────────────────────────────────────────────────────
// DRAG & DROP / SWAP
// ─────────────────────────────────────────────────────────────
export const swapOrMove = async ({ entry_id, to_period_config_id, to_day, swap_with_entry_id }, user_id) => {
  const entry = await prisma.timetableEntry.findUnique({
    where: { id: entry_id },
    include: { timetable: true, subject: { select: { category: true } }, period_config: true },
  });
  if (!entry) throw new Error("Entry not found");

  const spanPeriods = entry.subject?.category === "PRACTICAL" ? 2 : entry.span_periods;

  // Check clash at destination
  const clash = await checkClash({
    timetable_id: entry.timetable_id,
    period_config_id: to_period_config_id,
    day: to_day,
    faculty_id: entry.faculty_id,
    subject_id: entry.subject_id,
    span_periods: spanPeriods,
    exclude_entry_id: entry_id,
  });

  if (!clash.can_proceed) {
    const err = new Error(clash.clashes.map(c => c.message).join("; "));
    err.status = 409;
    err.clashes = clash.clashes;
    throw err;
  }

  // If swapping two entries
  if (swap_with_entry_id) {
    const other = await prisma.timetableEntry.findUnique({ where: { id: swap_with_entry_id } });
    if (other) {
      await prisma.$transaction([
        prisma.timetableEntry.update({ where: { id: entry_id }, data: { period_config_id: to_period_config_id, day: to_day } }),
        prisma.timetableEntry.update({ where: { id: swap_with_entry_id }, data: { period_config_id: entry.period_config_id, day: entry.day } }),
      ]);
      return { action: "SWAPPED", entry_id, swap_with_entry_id };
    }
  }

  // Simple move
  const updated = await prisma.timetableEntry.update({
    where: { id: entry_id },
    data: { period_config_id: to_period_config_id, day: to_day, span_periods: spanPeriods },
    include: { period_config: true, subject: { select: { name: true } } },
  });

  await prisma.timetableEntryLog.create({
    data: {
      timetable_id: entry.timetable_id,
      entry_id,
      action: "MOVE",
      prev_data: { period_config_id: entry.period_config_id, day: entry.day },
      new_data: { period_config_id: to_period_config_id, day: to_day },
      changed_by: user_id || null,
    },
  }).catch(() => { });

  return { action: "MOVED", entry: updated };
};

// ─────────────────────────────────────────────────────────────
// GENERATE ALL SECTIONS AT ONCE
// ─────────────────────────────────────────────────────────────
export const autoGenerateAll = async ({ session_id, force = false, dept_id }) => {
  const session = await getActiveSession(session_id);
  if (!session) throw new Error("No active session found");

  // Get all active sections
  const where = { status: "ACTIVE", deleted_at: null };
  if (dept_id) where.dept_id = dept_id;

  const sections = await prisma.section.findMany({
    where,
    include: {
      sectionSubjects: {
        where: { status: "ACTIVE" },
        include: { subject: true, faculty: true },
      },
    },
    orderBy: { name: "asc" },
  });

  if (!sections.length) throw new Error("No active sections found");

  const results = {
    total: sections.length,
    success: [],
    failed: [],
    skipped: [],
  };

  for (const section of sections) {
    try {
      const result = await autoGenerate({ section_id: section.id, session_id: session.id, force });
      if (result.failed?.length) {
        results.success.push({
          section_id: section.id,
          section_name: section.name,
          assigned: result.assigned_count,
          issues: result.failed,
        });
      } else {
        results.success.push({
          section_id: section.id,
          section_name: section.name,
          assigned: result.assigned_count,
          issues: [],
        });
      }
    } catch (e) {
      results.failed.push({
        section_id: section.id,
        section_name: section.name,
        reason: e.message,
      });
    }
  }

  results.success_count = results.success.length;
  results.failed_count = results.failed.length;
  return results;
};

// ── Generate timetable from Excel template ─────────────────────
// Template columns: Day, Period, Subject Code, Faculty EmpID, Room Code, Type
export const generateFromTemplate = async (section_id, session_id, file_buffer, user_id) => {
  const wb = xlsx.read(file_buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });

  // Get or create timetable
  const tt = await getOrCreateTimetable(section_id, session_id);

  // Build lookup maps
  const [subjects, faculties, rooms, periods] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, code: true, name: true, category: true } }),
    prisma.faculty.findMany({ select: { id: true, emp_id: true, name: true } }),
    prisma.room.findMany({ select: { id: true, code: true } }),
    prisma.periodConfig.findMany({
      where: { session_id, is_active: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const subjMap = Object.fromEntries(subjects.map(s => [s.code?.toUpperCase(), s]));
  const facMap = Object.fromEntries(faculties.map(f => [f.emp_id?.toUpperCase(), f]));
  const roomMap = Object.fromEntries(rooms.map(r => [r.code?.toUpperCase(), r]));
  const periodMap = Object.fromEntries(periods.map(p => [p.name?.toUpperCase(), p]));

  const VALID_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const results = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const day = String(row["Day"] || row["day"] || "").trim().toUpperCase().slice(0, 3);
    const periodName = String(row["Period"] || row["period"] || "").trim().toUpperCase();
    const subjCode = String(row["Subject"] || row["subject"] || row["Subject Code"] || "").trim().toUpperCase();
    const facId = String(row["Faculty"] || row["faculty"] || row["Faculty EmpID"] || "").trim().toUpperCase();
    const roomCode = String(row["Room"] || row["room"] || "").trim().toUpperCase();
    const entryType = String(row["Type"] || row["type"] || "LECTURE").trim().toUpperCase();

    if (!day || !periodName) { results.skipped++; continue; }
    if (!VALID_DAYS.includes(day)) {
      results.errors.push({ row: rowNum, error: `Invalid day: ${day}` }); continue;
    }

    const period = periodMap[periodName];
    const subject = subjCode ? subjMap[subjCode] : null;
    const faculty = facId ? facMap[facId] : null;
    const room = roomCode ? roomMap[roomCode] : null;

    if (!period) {
      results.errors.push({ row: rowNum, error: `Period not found: ${periodName}` }); continue;
    }
    if (subjCode && !subject) {
      results.errors.push({ row: rowNum, error: `Subject not found: ${subjCode}` }); continue;
    }
    if (facId && !faculty) {
      results.errors.push({ row: rowNum, error: `Faculty not found: ${facId}` }); continue;
    }

    // Consecutive lab detection (span_periods)
    const span = (subject?.category === "PRACTICAL" || entryType === "LAB") ? 2 : 1;

    // Clash check before upsert
    const clashes = await checkClash({
      timetable_id: tt.id,
      period_config_id: period.id,
      day,
      faculty_id: faculty?.id,
      span_periods: span,
    });

    if (clashes.length > 0) {
      results.errors.push({ row: rowNum, error: `Clash: ${clashes.map(c => c.message).join(", ")}` });
      continue;
    }

    // Upsert entry
    await prisma.timetableEntry.upsert({
      where: { timetable_id_day_period_config_id: { timetable_id: tt.id, day, period_config_id: period.id } },
      create: {
        timetable_id: tt.id,
        period_config_id: period.id,
        day,
        subject_id: subject?.id || null,
        faculty_id: faculty?.id || null,
        room_id: room?.id || null,
        entry_type: entryType === "LAB" ? "LAB" : "LECTURE",
        span_periods: span,
      },
      update: {
        subject_id: subject?.id || null,
        faculty_id: faculty?.id || null,
        room_id: room?.id || null,
        entry_type: entryType === "LAB" ? "LAB" : "LECTURE",
        span_periods: span,
      },
    }).then(() => results.created++).catch(e => {
      results.errors.push({ row: rowNum, error: e.message });
    });
  }

  return { timetable_id: tt.id, ...results };
};

// ── Download blank template ────────────────────────────────────
export const downloadTemplate = async (session_id) => {
  const periods = await prisma.periodConfig.findMany({
    where: { session_id, is_active: true },
    orderBy: { order: "asc" },
  });

  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const rows = [];
  for (const day of DAYS) {
    for (const period of periods) {
      if (!["LECTURE", "LAB"].includes(period.type)) continue;
      rows.push({
        Day: day,
        Period: period.name,
        Subject: "",
        Faculty: "",
        Room: "",
        Type: period.type,
        "Start Time": period.start_time,
        "End Time": period.end_time,
      });
    }
  }

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  xlsx.utils.book_append_sheet(wb, ws, "Timetable");

  // Add helper sheets with valid codes
  const [subjects, faculties, rooms] = await Promise.all([
    prisma.subject.findMany({ select: { code: true, name: true } }),
    prisma.faculty.findMany({ select: { emp_id: true, name: true } }),
    prisma.room.findMany({ select: { code: true, name: true } }),
  ]);

  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(subjects.map(s => ({ Code: s.code, Name: s.name }))), "Subjects");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(faculties.filter(f => f.emp_id).map(f => ({ EmpID: f.emp_id, Name: f.name }))), "Faculty");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rooms.map(r => ({ Code: r.code, Name: r.name }))), "Rooms");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};