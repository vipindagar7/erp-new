import prisma from "../../utils/prisma.js";


/**
 * Create a notification for one or many users.
 * @param {Object} options
 * @param {string|string[]} options.user_id  - single or array of user IDs
 * @param {string}          options.type     - NotificationType enum value
 * @param {string}          options.title
 * @param {string}          options.message
 * @param {object}          [options.data]   - optional extra JSON payload
 */
export async function createNotification({ user_id, type, title, message, data }) {
  const ids = Array.isArray(user_id) ? user_id : [user_id];

  const records = ids.map((uid) => ({
    user_id: uid,
    type,
    title,
    message,
    data: data ?? undefined,
  }));

  // Fire & forget — don't block callers
  prisma.notification
    .createMany({ data: records })
    .catch((err) => console.error("[Notification] createMany failed:", err));
}

/**
 * Notify all students in a section.
 */
export async function notifySection(section_id, { type, title, message, data }) {
  const students = await prisma.student.findMany({
    where: { section_id },
    select: { user_id: true },
  });
  const userIds = students.map((s) => s.user_id);
  if (userIds.length === 0) return;
  await createNotification({ user_id: userIds, type, title, message, data });
}

/**
 * Notify all students in a list of student IDs.
 */
export async function notifyStudents(studentIds, { type, title, message, data }) {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { user_id: true },
  });
  const userIds = students.map((s) => s.user_id);
  if (userIds.length === 0) return;
  await createNotification({ user_id: userIds, type, title, message, data });
}
