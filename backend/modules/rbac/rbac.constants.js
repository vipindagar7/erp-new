// backend/modules/rbac/rbac.constants.js
// ═══════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════
export const ROLES = {
  ROOT:             "ROOT",
  SUPER_ADMIN:      "SUPER_ADMIN",
  // Module admins
  STUDENT_ADMIN:    "STUDENT_ADMIN",
  FACULTY_ADMIN:    "FACULTY_ADMIN",
  ACADEMIC_ADMIN:   "ACADEMIC_ADMIN",
  CURRICULUM_ADMIN: "CURRICULUM_ADMIN",
  EXAM_ADMIN:       "EXAM_ADMIN",
  FINANCE_ADMIN:    "FINANCE_ADMIN",
  // Scoped roles
  HOD:              "HOD",            // dept scope
  PROGRAM_HEAD:     "PROGRAM_HEAD",   // program scope
  BRANCH_HEAD:      "BRANCH_HEAD",    // branch scope
  CLASS_COORDINATOR:"CLASS_COORDINATOR", // section scope
  FACULTY:          "FACULTY",        // subject scope
};

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS — key format: module:action
// ═══════════════════════════════════════════════════════════════
export const PERMISSIONS = {
  // ── System ──────────────────────────────────────────────────
  "system:settings":       { label: "System Settings",         module: "system"     },
  "system:migrations":     { label: "Run Migrations",          module: "system"     },
  "system:audit":          { label: "View Audit Logs",         module: "system"     },

  // ── Users ────────────────────────────────────────────────────
  "users:view":            { label: "View Users",              module: "users"      },
  "users:create":          { label: "Create Users",            module: "users"      },
  "users:block":           { label: "Block/Unblock Users",     module: "users"      },
  "users:assign_role":     { label: "Assign Roles",            module: "users"      },
  "users:delete":          { label: "Delete Users (hard)",     module: "users"      },

  // ── Students ─────────────────────────────────────────────────
  "student:view":          { label: "View Students",           module: "students"   },
  "student:create":        { label: "Create Students",         module: "students"   },
  "student:update":        { label: "Update Students",         module: "students"   },
  "student:delete":        { label: "Delete Students",         module: "students"   },
  "student:promote":       { label: "Promote/Demote",          module: "students"   },
  "student:status":        { label: "Change Status",           module: "students"   },
  "student:change_section":{ label: "Change Section",          module: "students"   },
  "student:block":         { label: "Block/Unblock Login",     module: "students"   },
  "student:bulk_promote":  { label: "Bulk Promote",            module: "students"   },
  "student:export":        { label: "Export Students",         module: "students"   },

  // ── Faculty ──────────────────────────────────────────────────
  "faculty:view":          { label: "View Faculty",            module: "faculty"    },
  "faculty:create":        { label: "Create Faculty",          module: "faculty"    },
  "faculty:update":        { label: "Update Faculty",          module: "faculty"    },
  "faculty:delete":        { label: "Delete Faculty",          module: "faculty"    },
  "faculty:block":         { label: "Block/Unblock Login",     module: "faculty"    },
  "faculty:assign_subject":{ label: "Assign Subjects",         module: "faculty"    },
  "faculty:export":        { label: "Export Faculty",          module: "faculty"    },

  // ── Academic ─────────────────────────────────────────────────
  "academic:view":         { label: "View Academic Structure", module: "academic"   },
  "academic:create":       { label: "Create Dept/Program/Branch",module: "academic" },
  "academic:update":       { label: "Update Academic Records", module: "academic"   },
  "academic:delete":       { label: "Delete Academic Records", module: "academic"   },

  // ── Sections ─────────────────────────────────────────────────
  "section:view":          { label: "View Sections",           module: "sections"   },
  "section:create":        { label: "Create Sections",         module: "sections"   },
  "section:update":        { label: "Update Sections",         module: "sections"   },
  "section:delete":        { label: "Delete Sections",         module: "sections"   },
  "section:promote":       { label: "Promote/Demote Sections", module: "sections"   },
  "section:assign_subject":{ label: "Assign Subjects",         module: "sections"   },
  "section:view_history":  { label: "View Section History",    module: "sections"   },

  // ── Curriculum ───────────────────────────────────────────────
  "curriculum:view":       { label: "View Curriculum",         module: "curriculum" },
  "curriculum:manage":     { label: "Manage Curriculum",       module: "curriculum" },
  "curriculum:assign_faculty":{ label: "Assign Faculty",       module: "curriculum" },

  // ── Attendance ───────────────────────────────────────────────
  "attendance:view":       { label: "View Attendance",         module: "attendance" },
  "attendance:mark":       { label: "Mark Attendance",         module: "attendance" },
  "attendance:edit":       { label: "Edit Past Attendance",    module: "attendance" },
  "attendance:report":     { label: "Attendance Reports",      module: "attendance" },

  // ── Timetable ────────────────────────────────────────────────
  "timetable:view":        { label: "View Timetable",          module: "timetable"  },
  "timetable:manage":      { label: "Manage Timetable",        module: "timetable"  },
  "timetable:manage_dept": { label: "Manage Dept Timetable",   module: "timetable"  },

  // ── Sessions ─────────────────────────────────────────────────
  "session:view":          { label: "View Sessions",           module: "sessions"   },
  "session:manage":        { label: "Manage Sessions",         module: "sessions"   },
  "session:set_current":   { label: "Set Current Session",     module: "sessions"   },
  "session:lock":          { label: "Lock/Unlock Session",     module: "sessions"   },

  // ── Enrollments ──────────────────────────────────────────────
  "enrollments:view":      { label: "View Enrollments",        module: "enrollments"},
  "enrollments:manage":    { label: "Manage Enrollments",      module: "enrollments"},

  // ── Reports ──────────────────────────────────────────────────
  "reports:view":          { label: "View Reports",            module: "reports"    },
  "reports:export":        { label: "Export Reports",          module: "reports"    },
};

// ═══════════════════════════════════════════════════════════════
// ROLE → PERMISSIONS MAP
// ═══════════════════════════════════════════════════════════════
export const ROLE_PERMISSIONS = {

  // ROOT — everything (checked separately in middleware, not via permissions)
  [ROLES.ROOT]: Object.keys(PERMISSIONS),

  // SUPER_ADMIN — everything except system-level
  [ROLES.SUPER_ADMIN]: Object.keys(PERMISSIONS).filter((p) => !["system:migrations", "users:delete"].includes(p)),

  // STUDENT_ADMIN — full student module
  [ROLES.STUDENT_ADMIN]: [
    "student:view", "student:create", "student:update", "student:delete",
    "student:promote", "student:status", "student:change_section", "student:block",
    "student:bulk_promote", "student:export",
    "section:view", "enrollments:view", "enrollments:manage",
    "reports:view", "reports:export",
    "academic:view",
  ],

  // FACULTY_ADMIN — full faculty module
  [ROLES.FACULTY_ADMIN]: [
    "faculty:view", "faculty:create", "faculty:update", "faculty:delete",
    "faculty:block", "faculty:assign_subject", "faculty:export",
    "academic:view", "section:view",
    "reports:view", "reports:export",
  ],

  // ACADEMIC_ADMIN — full academic structure
  [ROLES.ACADEMIC_ADMIN]: [
    "academic:view", "academic:create", "academic:update", "academic:delete",
    "section:view", "section:create", "section:update", "section:delete",
    "section:promote", "section:assign_subject", "section:view_history",
    "student:view", "student:change_section", "student:promote", "student:bulk_promote",
    "faculty:view", "faculty:assign_subject",
    "enrollments:view", "enrollments:manage",
    "session:view", "session:manage",
    "reports:view", "reports:export",
  ],

  // CURRICULUM_ADMIN — curriculum + subjects
  [ROLES.CURRICULUM_ADMIN]: [
    "curriculum:view", "curriculum:manage", "curriculum:assign_faculty",
    "section:view", "section:assign_subject",
    "faculty:view", "faculty:assign_subject",
    "academic:view",
    "reports:view",
  ],

  // HOD — dept scoped (scope enforced in middleware via UserRole.dept_id)
  [ROLES.HOD]: [
    "academic:view", "academic:update",
    "student:view", "student:update", "student:status", "student:change_section",
    "student:promote", "student:bulk_promote", "student:export",
    "faculty:view", "faculty:update", "faculty:assign_subject",
    "section:view", "section:create", "section:update", "section:promote",
    "section:assign_subject", "section:view_history",
    "curriculum:view", "curriculum:manage", "curriculum:assign_faculty",
    "attendance:view", "attendance:report",
    "timetable:view", "timetable:manage_dept",
    "enrollments:view",
    "reports:view", "reports:export",
  ],

  // PROGRAM_HEAD — program scoped
  [ROLES.PROGRAM_HEAD]: [
    "academic:view",
    "student:view", "student:update", "student:export",
    "faculty:view",
    "section:view", "section:update",
    "curriculum:view", "curriculum:manage",
    "attendance:view", "attendance:report",
    "timetable:view",
    "enrollments:view",
    "reports:view",
  ],

  // BRANCH_HEAD — branch scoped
  [ROLES.BRANCH_HEAD]: [
    "academic:view",
    "student:view", "student:update", "student:export",
    "faculty:view",
    "section:view", "section:update",
    "curriculum:view",
    "attendance:view", "attendance:report",
    "timetable:view",
    "enrollments:view",
    "reports:view",
  ],

  // CLASS_COORDINATOR — section scoped
  [ROLES.CLASS_COORDINATOR]: [
    "student:view", "student:update", "student:change_section",
    "section:view", "section:update", "section:view_history",
    "attendance:view", "attendance:mark", "attendance:report",
    "timetable:view",
    "enrollments:view",
    "curriculum:view",
    "reports:view",
  ],

  // FACULTY — subject scoped
  [ROLES.FACULTY]: [
    "student:view",       // read-only, their section
    "section:view",
    "curriculum:view",
    "attendance:view", "attendance:mark",  // their subjects only
    "timetable:view",
    "reports:view",
  ],
};

// ═══════════════════════════════════════════════════════════════
// SCOPE TYPE — what each role is scoped to
// ═══════════════════════════════════════════════════════════════
export const ROLE_SCOPE = {
  [ROLES.ROOT]:             "institute",
  [ROLES.SUPER_ADMIN]:      "institute",
  [ROLES.STUDENT_ADMIN]:    "institute",
  [ROLES.FACULTY_ADMIN]:    "institute",
  [ROLES.ACADEMIC_ADMIN]:   "institute",
  [ROLES.CURRICULUM_ADMIN]: "institute",
  [ROLES.EXAM_ADMIN]:       "institute",
  [ROLES.FINANCE_ADMIN]:    "institute",
  [ROLES.HOD]:              "dept",
  [ROLES.PROGRAM_HEAD]:     "program",
  [ROLES.BRANCH_HEAD]:      "branch",
  [ROLES.CLASS_COORDINATOR]:"section",
  [ROLES.FACULTY]:          "subject",
};

// ═══════════════════════════════════════════════════════════════
// MODULE GROUPS — for UI permission assignment page
// ═══════════════════════════════════════════════════════════════
export const PERMISSION_MODULES = {
  system:      { label: "System",      icon: "Settings",    roles: [ROLES.ROOT] },
  users:       { label: "Users",       icon: "Users",       roles: [ROLES.ROOT, ROLES.SUPER_ADMIN] },
  students:    { label: "Students",    icon: "GraduationCap",roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.STUDENT_ADMIN, ROLES.HOD, ROLES.PROGRAM_HEAD, ROLES.BRANCH_HEAD, ROLES.CLASS_COORDINATOR] },
  faculty:     { label: "Faculty",     icon: "Users",       roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.FACULTY_ADMIN, ROLES.HOD] },
  academic:    { label: "Academic",    icon: "Building2",   roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.ACADEMIC_ADMIN, ROLES.HOD, ROLES.PROGRAM_HEAD, ROLES.BRANCH_HEAD] },
  sections:    { label: "Sections",    icon: "Layers",      roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.ACADEMIC_ADMIN, ROLES.HOD, ROLES.PROGRAM_HEAD, ROLES.BRANCH_HEAD, ROLES.CLASS_COORDINATOR] },
  curriculum:  { label: "Curriculum",  icon: "BookOpen",    roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.CURRICULUM_ADMIN, ROLES.HOD, ROLES.PROGRAM_HEAD] },
  attendance:  { label: "Attendance",  icon: "ClipboardList",roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.CLASS_COORDINATOR, ROLES.FACULTY] },
  timetable:   { label: "Timetable",   icon: "Calendar",    roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.HOD, ROLES.CLASS_COORDINATOR, ROLES.FACULTY] },
  sessions:    { label: "Sessions",    icon: "Clock",       roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.ACADEMIC_ADMIN] },
  enrollments: { label: "Enrollments", icon: "FileText",    roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.STUDENT_ADMIN, ROLES.HOD] },
  reports:     { label: "Reports",     icon: "BarChart2",   roles: [ROLES.ROOT, ROLES.SUPER_ADMIN, ROLES.STUDENT_ADMIN, ROLES.FACULTY_ADMIN, ROLES.HOD] },
};
