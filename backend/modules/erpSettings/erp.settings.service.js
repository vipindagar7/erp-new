// backend/modules/erpSettings/erp.settings.service.js
import prisma from "../../utils/prisma.js";

export const DEFAULT_SETTINGS = [
  // ── Security ──────────────────────────────────────────────
  { key: "max_login_attempts", value: "5", label: "Max Login Attempts", description: "Failed logins before account is auto-blocked", category: "security", data_type: "number", is_system: true },
  { key: "password_min_length", value: "8", label: "Minimum Password Length", description: "Minimum characters required for any password", category: "security", data_type: "number", is_system: true },
  { key: "allow_bulk_delete", value: "true", label: "Allow Bulk Delete", description: "Enable bulk delete operations across modules", category: "security", data_type: "boolean", is_system: false },
  { key: "salary_view_otp", value: "true", label: "Require OTP to View Salary", description: "Force email OTP before salary details are shown", category: "security", data_type: "boolean", is_system: true },

  // ── Default Passwords ─────────────────────────────────────
  // Format tokens available: {username} = email prefix,
  // {first_name}, {last_name}, {roll_no}, {emp_id}, {email}
  // Only root can change these (enforced in the route).
  {
    key: "default_password_student",
    value: "{username}@Student",
    label: "Student Default Password",
    description: "Format for auto-generated student passwords. Tokens: {username} {first_name} {last_name} {roll_no} {email}",
    category: "default_passwords",
    data_type: "string",
    is_system: true,
  },
  {
    key: "default_password_faculty",
    value: "{username}@Faculty",
    label: "Faculty Default Password",
    description: "Format for auto-generated faculty passwords. Tokens: {username} {first_name} {last_name} {emp_id} {email}",
    category: "default_passwords",
    data_type: "string",
    is_system: true,
  },
  {
    key: "default_password_admin",
    value: "{username}@Admin",
    label: "Admin Default Password",
    description: "Format for auto-generated admin passwords. Tokens: {username} {first_name} {last_name} {email}",
    category: "default_passwords",
    data_type: "string",
    is_system: true,
  },
  {
    key: "default_password_superadmin",
    value: "{username}@SuperAdmin",
    label: "Super Admin Default Password",
    description: "Format for auto-generated super admin passwords. Tokens: {username} {first_name} {last_name} {email}",
    category: "default_passwords",
    data_type: "string",
    is_system: true,
  },

  // ── OTP ───────────────────────────────────────────────────
  { key: "otp_expiry_minutes", value: "10", label: "OTP Expiry (minutes)", description: "How long a login OTP remains valid", category: "otp", data_type: "number", is_system: true },
  { key: "otp_max_attempts", value: "3", label: "OTP Max Attempts", description: "Wrong attempts before the OTP is invalidated", category: "otp", data_type: "number", is_system: true },

  // ── Campus ────────────────────────────────────────────────
  { key: "campus_open", value: "true", label: "Campus Open", description: "Off = closure notice shown to students and faculty", category: "campus", data_type: "boolean", is_system: false },
  { key: "campus_closure_message", value: "", label: "Closure Message", description: "Shown when campus is marked closed", category: "campus", data_type: "string", is_system: false },
  { key: "weekly_off_days", value: "[0]", label: "Weekly Off Days", description: "JSON array — 0=Sun … 6=Sat  e.g. [0,6] for Sat+Sun", category: "campus", data_type: "json", is_system: false },

  // ── Academic ──────────────────────────────────────────────
  { key: "academic_year_start_month", value: "7", label: "Academic Year Start Month", description: "Month (1–12) the academic year begins", category: "academic", data_type: "number", is_system: true },
  { key: "max_semesters", value: "8", label: "Maximum Semesters", description: "Max semesters in any program", category: "academic", data_type: "number", is_system: true },
  { key: "promotion_lock_after_days", value: "30", label: "Promotion Lock (days)", description: "Days after year-end when promotions are locked", category: "academic", data_type: "number", is_system: false },
  {
    key: "university_roll_format", value: "{YEAR}{DEPT}{SEQ:5}", label: "University Roll Number Format",
    description: "Tokens: {YEAR} {DEPT} {COURSE} {SEQ:N}",
    category: "academic", data_type: "string", is_system: false
  },

  // ── Notifications ─────────────────────────────────────────
  { key: "email_notifications", value: "true", label: "Email Notifications", description: "Send email notifications system-wide", category: "notifications", data_type: "boolean", is_system: false },
  { key: "feedback_reminder_days", value: "3", label: "Feedback Reminder (days)", description: "Send reminder this many days before feedback deadline", category: "notifications", data_type: "number", is_system: false },

  // ── System ────────────────────────────────────────────────
  { key: "institution_name", value: "EIT Faridabad", label: "Institution Name", description: "Full institution name for reports and ID cards", category: "system", data_type: "string", is_system: true },
  { key: "institution_short_name", value: "EIT", label: "Institution Short Name", description: "Abbreviation used in headings", category: "system", data_type: "string", is_system: true },
  { key: "institution_address", value: "", label: "Institution Address", description: "Full address on ID cards and official reports", category: "system", data_type: "string", is_system: false },
  { key: "id_card_expiry_years", value: "1", label: "ID Card Validity (years)", description: "How long an ID card is valid", category: "system", data_type: "number", is_system: false },
  { key: "maintenance_mode", value: "false", label: "Maintenance Mode", description: "Blocks all non-Super Admin logins", category: "system", data_type: "boolean", is_system: true },
];

// Modules that root / super admin can block globally.
export const BLOCKABLE_MODULES = [
  { key: "feedback", label: "Feedback System" },
  { key: "enrollments", label: "Enrollments" },
  { key: "groups", label: "Groups" },
  { key: "reports", label: "Reports" },
  { key: "curriculum", label: "Curriculum" },
  { key: "sections", label: "Sections" },
  { key: "academic", label: "Academic Structure" },
];

const moduleBlockKey = (k) => `module_block.${k}`;

// ── Seed (idempotent) ─────────────────────────────────────────
export const seedDefaultSettings = async () => {
  for (const s of DEFAULT_SETTINGS) {
    await prisma.erpSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  for (const mod of BLOCKABLE_MODULES) {
    await prisma.erpSetting.upsert({
      where: { key: moduleBlockKey(mod.key) },
      update: {},
      create: {
        key: moduleBlockKey(mod.key), value: "false",
        label: `Block Module: ${mod.label}`,
        description: `When enabled, ${mod.label} is inaccessible to everyone except Super Admin`,
        category: "module_access", data_type: "boolean", is_system: false,
      },
    });
  }
};

// ── CRUD ──────────────────────────────────────────────────────
export const getAllSettings = () =>
  prisma.erpSetting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });

export const getSettingsByCategory = (category) =>
  prisma.erpSetting.findMany({ where: { category }, orderBy: { key: "asc" } });

export const getSetting = async (key) => {
  const s = await prisma.erpSetting.findUnique({ where: { key } });
  if (!s) return null;
  return parseValue(s.value, s.data_type);
};

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

const parseValue = (value, type) => {
  if (value === "" || value === null || value === undefined) return null;
  switch (type) {
    case "number": return Number(value);
    case "boolean": return value === "true";
    case "json": try { return JSON.parse(value); } catch { return value; }
    default: return value;
  }
};

// ── Module-block helpers ──────────────────────────────────────
export const isModuleBlocked = async (key) => (await getSetting(moduleBlockKey(key))) === true;

export const getModuleBlockStates = async () => {
  const settings = await prisma.erpSetting.findMany({ where: { category: "module_access" } });
  return Object.fromEntries(settings.map((s) => [s.key.replace("module_block.", ""), s.value === "true"]));
};

// ── Campus status ─────────────────────────────────────────────
export const getCampusStatus = async () => {
  const open = await getSetting("campus_open");
  const message = await getSetting("campus_closure_message");
  const weeklyOff = await getSetting("weekly_off_days");
  const today = new Date().getDay();
  return { open: open !== false, isWeeklyOff: Array.isArray(weeklyOff) && weeklyOff.includes(today), message: message || "" };
};

// ── Default password generator ────────────────────────────────
// role: "student" | "faculty" | "admin" | "superadmin"
// data: { email, first_name, last_name, roll_no, emp_id }
// Falls back to a safe default if the format setting is missing.
export const generateDefaultPassword = async (role, data = {}) => {
  const key = `default_password_${role.toLowerCase()}`;
  const format = (await getSetting(key)) || "{username}@EIT123";
  return applyPasswordFormat(format, data);
};

export const applyPasswordFormat = (format, data = {}) => {
  const username = (data.email || "").split("@")[0] || data.first_name || "user";
  return format
    .replace(/{username}/g, username)
    .replace(/{first_name}/g, data.first_name || username)
    .replace(/{last_name}/g, data.last_name || "")
    .replace(/{roll_no}/g, data.roll_no || "")
    .replace(/{emp_id}/g, data.emp_id || "")
    .replace(/{email}/g, data.email || "");
};