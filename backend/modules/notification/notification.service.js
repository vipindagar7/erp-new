// backend/modules/notification/notification.service.js
// Email + WhatsApp notification service
// All config stored in DB — no .env dependency
// Fails gracefully — never crashes, informs root on failure

import prisma from "../../utils/prisma.js";
import nodemailer from "nodemailer";

// ── Get config from DB ─────────────────────────────────────────
const getConfig = async (type) => {
  return prisma.notificationConfig.findUnique({ where: { type } }).catch(() => null);
};

// ── Email sender ───────────────────────────────────────────────
export const sendEmail = async ({ to, subject, body, template_key, variables = {} }) => {
  const config = await getConfig("EMAIL");
  if (!config?.is_enabled) return { sent: false, reason: "Email notifications disabled" };

  let finalSubject = subject;
  let finalBody    = body;

  // If template_key provided, load template and replace variables
  if (template_key) {
    const tmpl = await prisma.notificationTemplate.findUnique({ where: { key: template_key } });
    if (tmpl) {
      finalSubject = tmpl.subject || subject;
      finalBody    = tmpl.body_email || body;
      for (const [key, val] of Object.entries(variables)) {
        finalBody    = finalBody?.replace(new RegExp(`{{${key}}}`, "g"), val);
        finalSubject = finalSubject?.replace(new RegExp(`{{${key}}}`, "g"), val);
      }
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: (config.smtp_port || 587) === 465,
      auth: { user: config.smtp_user, pass: config.smtp_pass },
    });

    const recipients = Array.isArray(to) ? to.join(",") : to;
    await transporter.sendMail({
      from:    `${config.smtp_from_name || "EIT ERP"} <${config.smtp_from || config.smtp_user}>`,
      to:      recipients,
      subject: finalSubject,
      html:    finalBody,
    });

    return { sent: true, to: recipients };
  } catch (e) {
    console.error("[Email] Failed:", e.message);
    // Inform root — log the failure
    await prisma.cronSchedule.updateMany({
      where: { channel: { in: ["EMAIL","BOTH"] }, is_active: true },
      data:  { last_status: "FAILED", last_error: e.message.slice(0, 500) },
    }).catch(() => {});
    return { sent: false, reason: e.message };
  }
};

// ── WhatsApp sender (placeholder — provider TBD) ───────────────
export const sendWhatsApp = async ({ to, message, template_key, variables = {} }) => {
  const config = await getConfig("WHATSAPP");
  if (!config?.is_enabled) return { sent: false, reason: "WhatsApp notifications disabled" };

  let finalMessage = message;
  if (template_key) {
    const tmpl = await prisma.notificationTemplate.findUnique({ where: { key: template_key } });
    if (tmpl) {
      finalMessage = tmpl.body_whatsapp || message;
      for (const [key, val] of Object.entries(variables)) {
        finalMessage = finalMessage?.replace(new RegExp(`{{${key}}}`, "g"), val);
      }
    }
  }

  try {
    // Provider-agnostic — will be implemented when provider is decided
    const provider = config.wa_provider;
    if (!provider) return { sent: false, reason: "WhatsApp provider not configured" };

    // Placeholder — implement based on provider
    console.log(`[WhatsApp:${provider}] Would send to ${to}: ${finalMessage?.slice(0, 50)}…`);
    return { sent: false, reason: "WhatsApp provider implementation pending" };
  } catch (e) {
    console.error("[WhatsApp] Failed:", e.message);
    return { sent: false, reason: e.message };
  }
};

// ── Send via both channels ─────────────────────────────────────
export const sendNotification = async ({ to_email, to_phone, subject, email_body, whatsapp_body, template_key, variables }) => {
  const results = { email: null, whatsapp: null };

  if (to_email) {
    results.email = await sendEmail({ to: to_email, subject, body: email_body, template_key, variables });
  }
  if (to_phone) {
    results.whatsapp = await sendWhatsApp({ to: to_phone, message: whatsapp_body, template_key, variables });
  }

  return results;
};

// ── Template CRUD ──────────────────────────────────────────────
export const getTemplates = () =>
  prisma.notificationTemplate.findMany({ where: { is_active: true }, orderBy: { key: "asc" } });

export const upsertTemplate = (data) =>
  prisma.notificationTemplate.upsert({
    where:  { key: data.key },
    create: data,
    update: data,
  });

export const deleteTemplate = (id) =>
  prisma.notificationTemplate.update({ where: { id }, data: { is_active: false } });

// ── Config CRUD (root only) ────────────────────────────────────
export const getNotifConfig = (type) =>
  prisma.notificationConfig.findUnique({ where: { type } });

export const saveNotifConfig = (type, data) =>
  prisma.notificationConfig.upsert({
    where:  { type },
    create: { type, ...data },
    update: data,
  });

// ── Cron Schedule CRUD (root only) ────────────────────────────
export const getCronSchedules = () =>
  prisma.cronSchedule.findMany({ orderBy: { name: "asc" } });

export const upsertCronSchedule = (data) =>
  data.id
    ? prisma.cronSchedule.update({ where: { id: data.id }, data })
    : prisma.cronSchedule.create({ data });

export const deleteCronSchedule = (id) =>
  prisma.cronSchedule.delete({ where: { id } });

// ── Backdate attendance (root only) ───────────────────────────
export const backdateAttendance = async (records, root_user_id) => {
  // records = [{ student_id, section_id, date, period_config_id, status }]
  const results = [];
  for (const r of records) {
    const att = await prisma.studentAttendance.upsert({
      where: {
        student_id_section_id_date_period_config_id: {
          student_id:       r.student_id,
          section_id:       r.section_id,
          date:             new Date(r.date),
          period_config_id: r.period_config_id,
        },
      },
      create: { ...r, date: new Date(r.date), marked_by: root_user_id, attendance_type: "BACKDATE", marked_at: new Date() },
      update: { status: r.status, marked_by: root_user_id, attendance_type: "BACKDATE", marked_at: new Date() },
    }).catch(e => ({ error: e.message }));
    results.push(att);
  }
  return { total: records.length, updated: results.filter(r => !r.error).length };
};