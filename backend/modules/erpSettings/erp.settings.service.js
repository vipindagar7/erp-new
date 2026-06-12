// backend/modules/settings/erp.settings.service.js
import prisma from "../../utils/prisma.js";

// ── Default settings seeded on first run ─────────────────────
export const DEFAULT_SETTINGS = [
  // Auth & Security
  { key: "otp_expiry_minutes",     value: "5",     label: "OTP Expiry (minutes)",          description: "How long an OTP is valid",                  category: "security",     data_type: "number",  is_system: true  },
  { key: "otp_max_attempts",       value: "3",     label: "OTP Max Attempts",              description: "Failed attempts before lockout",            category: "security",     data_type: "number",  is_system: true  },
  { key: "otp_lockout_minutes",    value: "15",    label: "OTP Lockout Duration (minutes)",description: "Lockout duration after max attempts",       category: "security",     data_type: "number",  is_system: true  },
  { key: "totp_required",          value: "false", label: "Require TOTP for Admins",       description: "Force TOTP for all admin accounts",         category: "security",     data_type: "boolean", is_system: true  },
  { key: "totp_deadline_days",     value: "30",    label: "TOTP Setup Deadline (days)",    description: "Days given to set up TOTP after account creation", category: "security", data_type: "number", is_system: true },
  { key: "session_timeout_minutes",value: "60",    label: "Session Timeout (minutes)",     description: "Inactive session timeout",                  category: "security",     data_type: "number",  is_system: true  },
  { key: "max_login_attempts",     value: "5",     label: "Max Login Attempts",            description: "Failed logins before account lockout",      category: "security",     data_type: "number",  is_system: true  },
  { key: "password_min_length",    value: "8",     label: "Minimum Password Length",       description: "Minimum characters for passwords",          category: "security",     data_type: "number",  is_system: true  },
  // Academic
  { key: "academic_year_start_month", value: "7", label: "Academic Year Start Month",     description: "Month number (1-12) when academic year starts", category: "academic", data_type: "number",  is_system: true  },
  { key: "max_semesters",          value: "8",     label: "Maximum Semesters",             description: "Max number of semesters in any program",    category: "academic",     data_type: "number",  is_system: true  },
  { key: "promotion_lock_after_days", value: "30",label: "Promotion Lock (days after year end)", description: "Days after year end when promotions are locked", category: "academic", data_type: "number", is_system: false },
  // Notifications
  { key: "email_notifications",    value: "true",  label: "Email Notifications",           description: "Send email notifications system-wide",      category: "notifications",data_type: "boolean", is_system: false },
  { key: "feedback_reminder_days", value: "3",     label: "Feedback Reminder (days before deadline)", description: "Send reminder this many days before feedback deadline", category: "notifications", data_type: "number", is_system: false },
  // System
  { key: "institution_name",       value: "EIT Faridabad", label: "Institution Name",     description: "Full institution name",                     category: "system",       data_type: "string",  is_system: true  },
  { key: "institution_short_name", value: "EIT",   label: "Institution Short Name",        description: "Abbreviation",                              category: "system",       data_type: "string",  is_system: true  },
  { key: "institution_address",    value: "",      label: "Institution Address",           description: "Full address for ID cards and reports",     category: "system",       data_type: "string",  is_system: false },
  { key: "maintenance_mode",       value: "false", label: "Maintenance Mode",              description: "Blocks all non-SUPER_ADMIN logins",         category: "system",       data_type: "boolean", is_system: true  },
  { key: "allow_bulk_delete",      value: "true",  label: "Allow Bulk Delete",             description: "Enable bulk delete operations",             category: "security",     data_type: "boolean", is_system: false },
  { key: "salary_view_otp",        value: "true",  label: "Require OTP to View Salary",    description: "Force OTP verification to view salary",     category: "security",     data_type: "boolean", is_system: true  },
  { key: "id_card_expiry_years",   value: "1",     label: "ID Card Validity (years)",      description: "How long an ID card is valid",              category: "system",       data_type: "number",  is_system: false },
];

// ── Seed defaults (run once) ──────────────────────────────────
export const seedDefaultSettings = async () => {
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.erpSetting.upsert({
      where:  { key: setting.key },
      update: {},                  // don't overwrite existing values
      create: setting,
    });
  }
};

// ── Get all settings ──────────────────────────────────────────
export const getAllSettings = async () => {
  return prisma.erpSetting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
};

// ── Get settings by category ──────────────────────────────────
export const getSettingsByCategory = async (category) => {
  return prisma.erpSetting.findMany({ where: { category }, orderBy: { key: "asc" } });
};

// ── Get a single setting value ────────────────────────────────
export const getSetting = async (key) => {
  const s = await prisma.erpSetting.findUnique({ where: { key } });
  if (!s) return null;
  return parseValue(s.value, s.data_type);
};

// ── Update settings (batch) ───────────────────────────────────
export const updateSettings = async (updates, userId) => {
  const results = [];
  for (const { key, value } of updates) {
    const existing = await prisma.erpSetting.findUnique({ where: { key } });
    if (!existing) continue;
    const updated = await prisma.erpSetting.update({
      where: { key },
      data: { value: String(value), updated_by: userId },
    });
    results.push(updated);
  }
  return results;
};

// ── Parse value by type ───────────────────────────────────────
const parseValue = (value, type) => {
  switch (type) {
    case "number":  return Number(value);
    case "boolean": return value === "true";
    case "json":    try { return JSON.parse(value); } catch { return value; }
    default:        return value;
  }
};
