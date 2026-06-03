// ─────────────────────────────────────────────────────────────
//  PERMISSIONS CONFIG — single source of truth
//  Every permission key, its label, description, module group,
//  and which CRUD actions it maps to.
//
//  Used by:
//   - AdminsPage permission checklist
//   - RoleManagementPage grant modal
//   - Sidebar nav filtering
//   - PageGuard component (show/hide UI elements)
//   - Backend authorize() middleware (same key strings)
// ─────────────────────────────────────────────────────────────

export const PERMISSION_MODULES = [
    {
        key: "students",
        label: "Students",
        icon: "👥",
        permissions: [
            { key: "students.view", label: "View Students", desc: "List and view student profiles" },
            { key: "students.create", label: "Add Students", desc: "Create new student accounts and bulk upload" },
            { key: "students.update", label: "Edit Students", desc: "Update student info, change section" },
            { key: "students.delete", label: "Delete Students", desc: "Permanently remove students (Super Admin only)" },
            { key: "students.promote", label: "Promote / Demote", desc: "Promote, demote, pass, detain students" },
            { key: "students.block", label: "Block / Unblock", desc: "Block and unblock student accounts" },
            { key: "students.export", label: "Export Students", desc: "Download student Excel reports" },
        ],
    },
    {
        key: "faculty",
        label: "Faculty",
        icon: "👨‍🏫",
        permissions: [
            { key: "faculty.view", label: "View Faculty", desc: "List and view faculty profiles" },
            { key: "faculty.create", label: "Add Faculty", desc: "Create new faculty accounts and bulk upload" },
            { key: "faculty.update", label: "Edit Faculty", desc: "Update faculty info, assign subjects" },
            { key: "faculty.delete", label: "Delete Faculty", desc: "Permanently remove faculty (Super Admin only)" },
            { key: "faculty.block", label: "Block / Unblock", desc: "Block and unblock faculty accounts" },
        ],
    },
    {
        key: "admins",
        label: "Admins",
        icon: "🔐",
        permissions: [
            { key: "admins.view", label: "View Admins", desc: "List admin accounts" },
            { key: "admins.create", label: "Create Admins", desc: "Create new admin accounts" },
            { key: "admins.update", label: "Edit Admins", desc: "Update admin name and permissions" },
            { key: "admins.delete", label: "Delete Admins", desc: "Remove admin accounts (Super Admin only)" },
            { key: "admins.block", label: "Block / Unblock", desc: "Block and unblock admin accounts" },
        ],
    },
    {
        key: "academic",
        label: "Academic Structure",
        icon: "🏛️",
        permissions: [
            { key: "academic.view", label: "View Academic", desc: "View departments, programs, courses" },
            { key: "academic.create", label: "Create Academic", desc: "Add departments, programs, courses" },
            { key: "academic.update", label: "Edit Academic", desc: "Update departments, programs, courses" },
            { key: "academic.delete", label: "Delete Academic", desc: "Remove departments, programs, courses" },
        ],
    },
    {
        key: "sections",
        label: "Sections",
        icon: "🗂️",
        permissions: [
            { key: "sections.view", label: "View Sections", desc: "List and view sections" },
            { key: "sections.create", label: "Create Sections", desc: "Add new sections" },
            { key: "sections.update", label: "Edit Sections", desc: "Update sections, assign subjects and faculty" },
            { key: "sections.delete", label: "Delete Sections", desc: "Remove sections (Super Admin only)" },
            { key: "sections.assign", label: "Assign Subjects", desc: "Assign subjects and faculty to sections" },
        ],
    },
    {
        key: "subjects",
        label: "Subjects",
        icon: "📝",
        permissions: [
            { key: "subjects.view", label: "View Subjects", desc: "List subjects" },
            { key: "subjects.create", label: "Create Subjects", desc: "Add new subjects" },
            { key: "subjects.update", label: "Edit Subjects", desc: "Update subject info" },
            { key: "subjects.delete", label: "Delete Subjects", desc: "Remove subjects (Super Admin only)" },
        ],
    },
    {
        key: "curriculum",
        label: "Curriculum",
        icon: "📐",
        permissions: [
            { key: "curriculum.view", label: "View Curriculum", desc: "View curriculum templates" },
            { key: "curriculum.create", label: "Manage Curriculum", desc: "Add, edit and upload curriculum subjects" },
            { key: "curriculum.delete", label: "Delete Curriculum", desc: "Remove curriculum entries" },
        ],
    },
    {
        key: "feedback",
        label: "Feedback",
        icon: "📊",
        permissions: [
            { key: "feedback.view", label: "View Feedback", desc: "View forms, categories, questions" },
            { key: "feedback.create", label: "Create Forms", desc: "Create feedback forms and groups" },
            { key: "feedback.update", label: "Edit Forms", desc: "Update and toggle feedback forms" },
            { key: "feedback.delete", label: "Delete Forms", desc: "Delete forms and responses (Super Admin only)" },
            { key: "feedback.results", label: "View Results", desc: "View and export feedback results" },
            { key: "feedback.bulk_submit", label: "Bulk Submit", desc: "Submit feedback responses via Excel" },
        ],
    },
    {
        key: "enrollments",
        label: "Enrollments",
        icon: "📋",
        permissions: [
            { key: "enrollments.view", label: "View Enrollments", desc: "View enrollment records" },
            { key: "enrollments.create", label: "Create Enrollments", desc: "Add enrollment records" },
            { key: "enrollments.update", label: "Edit Enrollments", desc: "Update enrollment status" },
            { key: "enrollments.delete", label: "Delete Enrollments", desc: "Remove enrollment records" },
            { key: "enrollments.export", label: "Export Enrollments", desc: "Download enrollment Excel report" },
        ],
    },
    {
        key: "groups",
        label: "Groups",
        icon: "👫",
        permissions: [
            { key: "groups.view", label: "View Groups", desc: "View special and faculty groups" },
            { key: "groups.create", label: "Create Groups", desc: "Create new groups" },
            { key: "groups.update", label: "Edit Groups", desc: "Update groups and manage members" },
            { key: "groups.delete", label: "Delete Groups", desc: "Remove groups" },
        ],
    },
    {
        key: "reports",
        label: "Reports",
        icon: "📈",
        permissions: [
            { key: "reports.students", label: "Student Reports", desc: "Export student Excel reports" },
            { key: "reports.faculty", label: "Faculty Reports", desc: "Export faculty Excel reports" },
            { key: "reports.enrollments", label: "Enrollment Reports", desc: "Export enrollment Excel reports" },
        ],
    },
    {
        key: "audit",
        label: "Audit Trail",
        icon: "🛡️",
        permissions: [
            { key: "audit.view", label: "View Audit Trail", desc: "View all activity logs" },
            { key: "audit.export", label: "Export Audit Logs", desc: "Download audit log CSV (Super Admin only)" },
            { key: "audit.restore", label: "Restore Records", desc: "Restore previous record states (Super Admin only)" },
        ],
    },
];

// ── Flat list of all permission keys ──────────────────────────
export const ALL_PERMISSION_KEYS = PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.key));

// ── CRUD preset — selects all 4 CRUD permissions for a module ─
export const getCRUDPreset = (moduleKey) => {
    const mod = PERMISSION_MODULES.find((m) => m.key === moduleKey);
    if (!mod) return [];
    return mod.permissions
        .filter((p) => ["view", "create", "update", "delete"].some((c) => p.key.endsWith(`.${c}`)))
        .map((p) => p.key);
};

// ── Get permission metadata by key ────────────────────────────
export const getPermission = (key) => {
    for (const mod of PERMISSION_MODULES) {
        const p = mod.permissions.find((p) => p.key === key);
        if (p) return { ...p, module: mod.label, moduleKey: mod.key };
    }
    return null;
};

// ── Check if user has a permission ────────────────────────────
export const hasPermission = (user, key) => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    return user.permissions?.includes(key) ?? false;
};

// ── Check if user has ANY of the listed permissions ───────────
export const hasAnyPermission = (user, ...keys) => keys.some((k) => hasPermission(user, k));

// ── Check if user can access a page ──────────────────────────
// Maps page paths to required permissions (ANY match = allow)
export const PAGE_PERMISSIONS = {
    "/admin": [],                          // dashboard — all admins
    "/admin/audit": ["audit.view"],
    "/admin/roles": [],                          // super admin — handled by nav
    "/admin/students": ["students.view"],
    "/admin/faculty": ["faculty.view"],
    "/admin/admins": ["admins.view"],
    "/admin/departments": ["academic.view"],
    "/admin/programs": ["academic.view"],
    "/admin/courses": ["academic.view"],
    "/admin/subjects": ["subjects.view"],
    "/admin/sections": ["sections.view"],
    "/admin/enrollments": ["enrollments.view"],
    "/admin/curriculum": ["curriculum.view"],
    "/admin/groups": ["groups.view"],
    "/admin/feedback/forms": ["feedback.view"],
    "/admin/feedback/results": ["feedback.results"],
    "/admin/feedback/teaching": ["feedback.results"],
    "/admin/feedback/categories": ["feedback.view"],
    "/admin/feedback/questions": ["feedback.view"],
};