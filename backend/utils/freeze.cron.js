// backend/modules/attendance/freeze.cron.js
// Auto-freeze attendance daily at 12:00 AM
// Register in app startup: import './modules/attendance/freeze.cron.js'
import prisma from "./prisma.js";

const FREEZE_HOUR = 0; // midnight

export const autoFreezeYesterday = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  try {
    const session = await prisma.academicSession.findFirst({ where: { is_current: true } });
    if (!session) return;

    // Check if already frozen
    const existing = await prisma.attendanceFreezeRule.findFirst({
      where: { session_id: session.id, scope: "INSTITUTE", is_frozen: true },
    });

    // Update or create freeze for yesterday
    await prisma.attendanceFreezeRule.upsert({
      where: { id: existing?.id || "new" },
      update: { is_frozen: true, frozen_at: new Date() },
      create: {
        session_id: session.id,
        scope: "INSTITUTE",
        is_frozen: true,
        frozen_by: "SYSTEM_CRON",
        frozen_at: new Date(),
        notes: `Auto-frozen for ${dateStr}`,
      },
    }).catch(() => {});

    console.log(`[CRON] Attendance auto-frozen for ${dateStr}`);
  } catch (e) {
    console.error("[CRON] Auto-freeze failed:", e.message);
  }
};

// Schedule: runs every day at midnight
let cronInterval = null;

export const startFreezeCron = () => {
  const msUntilMidnight = () => {
    const now  = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setHours(FREEZE_HOUR, 0, 5, 0); // 00:00:05
    return next - now;
  };

  const schedule = () => {
    setTimeout(async () => {
      await autoFreezeYesterday();
      cronInterval = setInterval(autoFreezeYesterday, 24 * 60 * 60 * 1000);
    }, msUntilMidnight());
  };

  schedule();
  console.log("[CRON] Attendance freeze cron scheduled");
};

export const stopFreezeCron = () => {
  if (cronInterval) clearInterval(cronInterval);
};
