// backend/modules/academic/calendar.service.js
import prisma from "../../utils/prisma.js";

export const listEvents = async ({ session_id, month, event_type, is_holiday, dept_id } = {}) => {
  const where = {};
  if (session_id)  where.session_id  = session_id;
  if (event_type)  where.event_type  = event_type;
  if (is_holiday !== undefined) where.is_holiday = is_holiday === "true" || is_holiday === true;
  if (month) {
    const m = parseInt(month);
    where.start_date = { gte: new Date(new Date().getFullYear(), m-1, 1), lt: new Date(new Date().getFullYear(), m, 1) };
  }
  where.deleted_at = null;
  return prisma.academicCalendarEvent.findMany({
    where,
    orderBy: [{ start_date: "asc" }, { event_type: "asc" }],
  });
};

export const createEvent = async (data, created_by) =>
  prisma.academicCalendarEvent.create({ data: { ...data, created_by } });

export const updateEvent = async (id, data) =>
  prisma.academicCalendarEvent.update({ where: { id }, data });

export const deleteEvent = async (id) =>
  prisma.academicCalendarEvent.update({ where: { id }, data: { deleted_at: new Date() } });

export const bulkCreate = async (events, session_id, created_by) => {
  const results = [];
  for (const e of events) {
    const r = await prisma.academicCalendarEvent.upsert({
      where: { id: e.id || "new-" + Date.now() + Math.random() },
      update: { ...e, session_id, created_by },
      create: { ...e, session_id, created_by },
    }).catch(() => prisma.academicCalendarEvent.create({ data: { ...e, session_id, created_by } }));
    results.push(r);
  }
  return results;
};

export const getWorkingDaySummary = async (session_id) => {
  const events = await prisma.academicCalendarEvent.findMany({
    where: { session_id, deleted_at: null },
    orderBy: { start_date: "asc" },
  });
  const holidays = events.filter(e => e.is_holiday);
  const working  = events.filter(e => e.is_working);
  const academic = events.filter(e => e.affects_attendance);
  return { total_events: events.length, holidays: holidays.length, working_events: working.length, academic_events: academic.length, events };
};
