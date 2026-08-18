// src/config/permission.config.js
// SINGLE SOURCE OF TRUTH for all permissions
// Used by: Dashboard, Sidebar, PermGuard, Backend middleware
// ALL keys use dot notation: module.action

export const PERMISSION_GROUPS = [
  // ── Students ──────────────────────────────────────────────────
  {
    key: "students",
    label: "Students",
    icon: "👥",
    permissions: [
      { key: "students.view",    label: "View Students",      desc: "List and view student profiles" },
      { key: "students.create",  label: "Add Students",       desc: "Create new student accounts and bulk upload" },
      { key: "students.update",  label: "Edit Students",      desc: "Update student info, change section" },
      { key: "students.delete",  label: "Delete Students",    desc: "Permanently remove students (Super Admin only)" },
      { key: "students.promote", label: "Promote / Demote",   desc: "Promote, demote, pass, detain students" },
      { key: "students.block",   label: "Block / Unblock",    desc: "Block and unblock student accounts" },
      { key: "students.export",  label: "Export Students",    desc: "Download student Excel reports" },
    ],
  },

  // ── Faculty ───────────────────────────────────────────────────
  {
    key: "faculty",
    label: "Faculty",
    icon: "👨‍🏫",
    permissions: [
      { key: "faculty.view",    label: "View Faculty",        desc: "List and view faculty profiles" },
      { key: "faculty.create",  label: "Add Faculty",         desc: "Create new faculty accounts and bulk upload" },
      { key: "faculty.update",  label: "Edit Faculty",        desc: "Update faculty info, qualifications, roles" },
      { key: "faculty.delete",  label: "Delete Faculty",      desc: "Remove faculty accounts" },
      { key: "faculty.block",   label: "Block / Unblock",     desc: "Block and unblock faculty accounts" },
      { key: "faculty.export",  label: "Export Faculty",      desc: "Download faculty Excel reports" },
      { key: "faculty.manage",  label: "Manage Faculty",      desc: "Assign subjects, roles, dept scope" },
    ],
  },

  // ── Academic (Dept / Program / Branch / Section / Session) ───
  {
    key: "academic",
    label: "Academic",
    icon: "🏫",
    permissions: [
      { key: "academic.view",   label: "View Academic",       desc: "View departments, programs, branches, sections" },
      { key: "academic.create", label: "Create Academic",     desc: "Add departments, programs, branches, sections" },
      { key: "academic.update", label: "Edit Academic",       desc: "Update academic structure" },
      { key: "academic.delete", label: "Delete Academic",     desc: "Remove academic entities (Super Admin only)" },
    ],
  },

  // ── Departments ───────────────────────────────────────────────
  {
    key: "departments",
    label: "Departments",
    icon: "🏢",
    permissions: [
      { key: "departments.view",   label: "View Departments",  desc: "View department list and details" },
      { key: "departments.create", label: "Add Departments",   desc: "Create new departments" },
      { key: "departments.update", label: "Edit Departments",  desc: "Update department info" },
      { key: "departments.delete", label: "Delete Departments",desc: "Remove departments (Super Admin only)" },
    ],
  },

  // ── Curriculum ────────────────────────────────────────────────
  {
    key: "curriculum",
    label: "Curriculum",
    icon: "📚",
    permissions: [
      { key: "curriculum.view",   label: "View Curriculum",   desc: "View subjects, courses, curriculum mapping" },
      { key: "curriculum.create", label: "Add Curriculum",    desc: "Add subjects, bulk upload, assign to branches" },
      { key: "curriculum.update", label: "Edit Curriculum",   desc: "Update subject details and assignments" },
      { key: "curriculum.delete", label: "Delete Curriculum", desc: "Remove subjects (Super Admin only)" },
    ],
  },

  // ── Timetable ─────────────────────────────────────────────────
  {
    key: "timetable",
    label: "Timetable",
    icon: "🗓️",
    permissions: [
      { key: "timetable.view",    label: "View Timetable",    desc: "View class schedules for all sections" },
      { key: "timetable.manage",  label: "Manage Timetable",  desc: "Create, edit, generate timetables" },
      { key: "timetable.publish", label: "Publish Timetable", desc: "Lock and publish timetables" },
      { key: "timetable.holiday", label: "Mark Holidays",     desc: "Mark holidays on the timetable (TT Head)" },
    ],
  },

  // ── Attendance ────────────────────────────────────────────────
  {
    key: "attendance",
    label: "Attendance",
    icon: "✅",
    permissions: [
      { key: "attendance.view",    label: "View Attendance",   desc: "View attendance records and summaries" },
      { key: "attendance.manage",  label: "Mark Attendance",   desc: "Mark and edit attendance" },
      { key: "attendance.report",  label: "Attendance Reports",desc: "Generate section and student reports" },
      { key: "attendance.freeze",  label: "Freeze Attendance", desc: "Lock attendance for a period" },
      { key: "attendance.backdate",label: "Backdate Attendance",desc: "Enter attendance for past dates (Root only)" },
    ],
  },

  // ── Leave ─────────────────────────────────────────────────────
  {
    key: "leave",
    label: "Leave",
    icon: "🏖️",
    permissions: [
      { key: "leave.view",    label: "View Leave",            desc: "View leave applications" },
      { key: "leave.apply",   label: "Apply Leave",           desc: "Submit leave applications" },
      { key: "leave.approve", label: "Approve Leave",         desc: "Approve or reject leave requests (HOD)" },
      { key: "leave.manage",  label: "Manage Leave Rules",    desc: "Configure leave types, balance rules (HR)" },
    ],
  },

  // ── Exam ──────────────────────────────────────────────────────
  {
    key: "exam",
    label: "Exam",
    icon: "📝",
    permissions: [
      { key: "exam.view",      label: "View Exams",           desc: "View exam schedule and results" },
      { key: "exam.manage",    label: "Manage Exams",         desc: "Create datesheets, seating, hall tickets" },
      { key: "exam.results",   label: "Declare Results",      desc: "Enter and publish exam results" },
    ],
  },

  // ── Marks ─────────────────────────────────────────────────────
  {
    key: "marks",
    label: "Marks",
    icon: "📊",
    permissions: [
      { key: "marks.view",    label: "View Marks",            desc: "View student marks and grades" },
      { key: "marks.manage",  label: "Enter Marks",           desc: "Enter internal/external marks" },
      { key: "marks.approve", label: "Approve Marks",         desc: "Approve submitted marks (HOD)" },
    ],
  },

  // ── Assignments ───────────────────────────────────────────────
  {
    key: "assignments",
    label: "Assignments",
    icon: "📋",
    permissions: [
      { key: "assignments.view",   label: "View Assignments",  desc: "View all assignments" },
      { key: "assignments.create", label: "Create Assignments",desc: "Create and publish assignments" },
      { key: "assignments.update", label: "Edit Assignments",  desc: "Edit assignment details" },
      { key: "assignments.grade",  label: "Grade Assignments", desc: "Grade submissions and check plagiarism" },
    ],
  },

  // ── Fee ───────────────────────────────────────────────────────
  {
    key: "fee",
    label: "Fee",
    icon: "💰",
    permissions: [
      { key: "fee.view",    label: "View Fee",                desc: "View student fee records" },
      { key: "fee.collect", label: "Collect Fee",             desc: "Record fee payments" },
      { key: "fee.manage",  label: "Manage Fee Structure",    desc: "Create fee structures and discounts" },
      { key: "fee.report",  label: "Fee Reports",             desc: "Generate fee collection reports" },
    ],
  },

  // ── HR / Payroll ──────────────────────────────────────────────
  {
    key: "hr",
    label: "HR & Payroll",
    icon: "💼",
    permissions: [
      { key: "hr.view",    label: "View HR",                  desc: "View salary slips and attendance records" },
      { key: "hr.manage",  label: "Manage Payroll",           desc: "Generate salary slips, manage leaves" },
      { key: "hr.approve", label: "Approve HR",               desc: "Approve salary and leave for payroll" },
    ],
  },

  // ── Reports ───────────────────────────────────────────────────
  {
    key: "reports",
    label: "Reports",
    icon: "📈",
    permissions: [
      { key: "reports.students",   label: "Student Reports",  desc: "Generate student analytics" },
      { key: "reports.faculty",    label: "Faculty Reports",  desc: "Generate faculty reports" },
      { key: "reports.attendance", label: "Attendance Reports",desc: "Generate attendance analytics" },
      { key: "reports.academic",   label: "Academic Reports", desc: "Department/program/branch reports" },
      { key: "reports.exam",       label: "Exam Reports",     desc: "Exam and marks analytics" },
      { key: "reports.fee",        label: "Fee Reports",      desc: "Fee collection analytics" },
    ],
  },

  // ── Feedback ──────────────────────────────────────────────────
  {
    key: "feedback",
    label: "Feedback",
    icon: "💬",
    permissions: [
      { key: "feedback.view",    label: "View Feedback",      desc: "View feedback forms and results" },
      { key: "feedback.create",  label: "Create Feedback",    desc: "Create and publish feedback forms" },
      { key: "feedback.results", label: "View Results",       desc: "View feedback responses and reports" },
    ],
  },

  // ── Audit ─────────────────────────────────────────────────────
  {
    key: "audit",
    label: "Audit Logs",
    icon: "🔍",
    permissions: [
      { key: "audit.view",   label: "View Audit Logs",        desc: "View system activity logs" },
      { key: "audit.export", label: "Export Audit Logs",      desc: "Download audit trail as CSV" },
    ],
  },

  // ── System / ERP ──────────────────────────────────────────────
  {
    key: "system",
    label: "System",
    icon: "⚙️",
    permissions: [
      { key: "system.settings",    label: "ERP Settings",     desc: "Manage ERP configuration (Root only)" },
      { key: "system.permissions", label: "Permissions",      desc: "Manage roles and permissions (Root only)" },
      { key: "system.notifications",label: "Notifications",   desc: "Configure email/WhatsApp notifications (Root only)" },
    ],
  },
];

// ── Flat list of all permission keys ──────────────────────────
export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g =>
  g.permissions.map(p => p.key)
);

// ── Permission checker ────────────────────────────────────────
export const hasPermission = (user, key) => {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const perms = user.effectivePermissions || user.permissions || [];
  return perms.includes(key);
};

export const hasAnyPermission = (user, ...keys) =>
  keys.some(k => hasPermission(user, k));

// ── Root check ────────────────────────────────────────────────
export const isRoot = (user) =>
  user?.is_root === true || user?.role === "SUPER_ADMIN";

// ── Super Admin restrictions (root only can do these) ─────────
export const ROOT_ONLY_PERMS = [
  "attendance.backdate",
  "system.settings",
  "system.permissions",
  "system.notifications",
];

// ── Module → required permission map (for dashboard/sidebar) ──
export const MODULE_PERMISSION_MAP = {
  students:    "students.view",
  faculty:     "faculty.view",
  academic:    "academic.view",
  departments: "departments.view",
  curriculum:  "curriculum.view",
  timetable:   "timetable.view",
  attendance:  "attendance.view",
  leave:       "leave.view",
  exam:        "exam.view",
  marks:       "marks.view",
  assignments: "assignments.view",
  fee:         "fee.view",
  hr:          "hr.view",
  reports:     "reports.students",
  feedback:    "feedback.view",
  audit:       "audit.view",
  system:      "system.settings",
};

// ── Key normalization map (old → new) for route migration ─────
// Routes still use old keys — requirePerm() will normalize these
export const PERM_ALIASES = {
  // Student
  "student:view":          "students.view",
  "student:create":        "students.create",
  "student:update":        "students.update",
  "student:block":         "students.block",
  "student:promote":       "students.promote",
  "student:bulk_promote":  "students.promote",
  "student:change_section":"students.update",
  "student:export":        "students.export",
  // Faculty
  "faculty:view":          "faculty.view",
  "faculty:update":        "faculty.update",
  "faculty:block":         "faculty.block",
  "faculty:unblock":       "faculty.block",
  "faculty:export":        "faculty.export",
  "faculty:manage":        "faculty.manage",
  // Academic
  "academic.create":       "academic.create",
  "academic:view":         "academic.view",
  "academic:edit":         "academic.update",
  // Course/Subject
  "course:view":           "curriculum.view",
  "course:create":         "curriculum.create",
  "course:update":         "curriculum.update",
  "subject:view":          "curriculum.view",
  "subject:create":        "curriculum.create",
  "subject:update":        "curriculum.update",
  "subject:bulk_upload":   "curriculum.create",
  // Attendance
  "attendance:view":       "attendance.view",
  "attendance:mark":       "attendance.manage",
  "attendance:edit":       "attendance.manage",
  "attendance:report":     "attendance.report",
  "attendance:freeze":     "attendance.freeze",
  // Assignment
  "assignment:view":       "assignments.view",
  "assignment:create":     "assignments.create",
  "assignment:edit":       "assignments.update",
  "assignment:grade":      "assignments.grade",
  // Audit
  "audit:view":            "audit.view",
  "audit:export":          "audit.export",
};

export default PERMISSION_GROUPS;