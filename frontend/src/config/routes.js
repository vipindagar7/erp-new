// src/config/routes.js
// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every frontend route path.
// All phases A–G included.
// Removed: courses (model deleted — replaced by branches)
// Added: branches, leave, bulk, uiPermissions, superadmin routes
// ─────────────────────────────────────────────────────────────

export const ROUTES = {

  // ── Auth ─────────────────────────────────────────────────
  auth: {
    login: "/login",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    pickRole: "/pick-role",
  },

  // ── Admin root ───────────────────────────────────────────
  admin: { root: "/admin" },

  // ── Academic Sessions ────────────────────────────────────
  sessions: {
    list: "/admin/sessions",
    new: "/admin/sessions/new",
    history: "/admin/sessions/history",
    detail: (id) => `/admin/sessions/${id}`,
    edit: (id) => `/admin/sessions/${id}/edit`,
  },

  // ── Super Admins (root only) ──────────────────────────────
  superadmin: {
    hub: "/admin/superadmins",
    list: "/admin/superadmins/list",
    new: "/admin/superadmins/new",
    history: "/admin/superadmins/history",
    activity: "/admin/superadmins/activity",
    detail: (id) => `/admin/superadmins/${id}`,
    edit: (id) => `/admin/superadmins/${id}/edit`,
  },

  // ── Students ─────────────────────────────────────────────
  students: {
    hub: "/admin/students",
    list: "/admin/students/list",
    active: "/admin/students/active",
    detained: "/admin/students/detained",
    onHold: "/admin/students/on-hold",
    passed: "/admin/students/passed",
    left: "/admin/students/left",
    suspended: "/admin/students/suspended",
    new: "/admin/students/new",
    bulk: "/admin/students/bulk",
    export: "/admin/students/export",
    analytics: "/admin/students/analytics",
    sectionHistory: "/admin/students/section-history",
    history: "/admin/students/history",
    promote: "/admin/students/promote",   // bulk promote hub
    detail: (id) => `/admin/students/${id}`,
    edit: (id) => `/admin/students/${id}/edit`,
    activity: (id) => `/admin/students/${id}/activity`,
  },

  // ── Faculty ──────────────────────────────────────────────
  faculty: {
    hub: "/admin/faculty",
    list: "/admin/faculty/list",
    active: "/admin/faculty/active",
    blocked: "/admin/faculty/blocked",
    inactive: "/admin/faculty/inactive",
    teaching: "/admin/faculty/teaching",
    nonTeaching: "/admin/faculty/non-teaching",
    new: "/admin/faculty/new",
    bulk: "/admin/faculty/bulk",
    export: "/admin/faculty/export",
    history: "/admin/faculty/history",
    detail: (id) => `/admin/faculty/${id}`,
    edit: (id) => `/admin/faculty/${id}/edit`,
    activity: (id) => `/admin/faculty/${id}/activity`,
    career: (id) => `/admin/faculty/${id}/career`,
    leave: (id) => `/admin/faculty/${id}/leave`,
  },

  // ── Admins ───────────────────────────────────────────────
  admins: {
    hub: "/admin/admins",
    list: "/admin/admins/list",
    new: "/admin/admins/new",
    activity: "/admin/admins/activity",
    history: "/admin/admins/history",
    detail: (id) => `/admin/admins/${id}`,
    edit: (id) => `/admin/admins/${id}/edit`,
    activity: (id) => `/admin/admins/${id}/activity`,
  },

  // ── Academic (master hub + structure tree) ───────────────
  academic: {
    hub: "/admin/academic",
    structure: "/admin/academic/structure",
  },

  // ── Departments ──────────────────────────────────────────
  departments: {
    hub: "/admin/departments",
    list: "/admin/departments/list",
    new: "/admin/departments/new",
    history: "/admin/departments/history",
    detail: (id) => `/admin/departments/${id}`,
    edit: (id) => `/admin/departments/${id}/edit`,
  },

  // ── Programs ─────────────────────────────────────────────
  programs: {
    hub: "/admin/programs",
    list: "/admin/programs/list",
    new: "/admin/programs/new",
    history: "/admin/programs/history",
    detail: (id) => `/admin/programs/${id}`,
    edit: (id) => `/admin/programs/${id}/edit`,
  },

  // ── Courses (legacy — kept for existing data) ─────────────
  courses: {
    hub: "/admin/courses",
    list: "/admin/courses/list",
    new: "/admin/courses/new",
    history: "/admin/courses/history",
    detail: (id) => `/admin/courses/${id}`,
    edit: (id) => `/admin/courses/${id}/edit`,
  },

  // ── Branches (replaced courses) ─────────────────────────---
  branches: {
    hub: "/admin/branches",
    list: "/admin/branches/list",
    new: "/admin/branches/new",
    history: "/admin/branches/history",
    discontinued: "/admin/branches/discontinued",
    detail: (id) => `/admin/branches/${id}`,
    edit: (id) => `/admin/branches/${id}/edit`,
  },

  // ── Subjects ─────────────────────────────────────────────
  subjects: {
    hub: "/admin/subjects",
    list: "/admin/subjects/list",
    new: "/admin/subjects/new",
    history: "/admin/subjects/history",
    detail: (id) => `/admin/subjects/${id}`,
    edit: (id) => `/admin/subjects/${id}/edit`,
  },

  // ── Sections ─────────────────────────────────────────────
  sections: {
    hub: "/admin/sections",
    list: "/admin/sections/list",
    new: "/admin/sections/new",
    history: "/admin/sections/history",
    detail: (id) => `/admin/sections/${id}`,
    edit: (id) => `/admin/sections/${id}/edit`,
  },

  // ── Curriculum ───────────────────────────────────────────
  curriculum: {
    hub: "/admin/curriculum",
    manage: "/admin/curriculum/manage",
    history: "/admin/curriculum/history",
  },

  // ── Enrollments ──────────────────────────────────────────
  enrollments: {
    list: "/admin/enrollments",
    history: "/admin/enrollments/history",
  },

  // ── Leave Management ──────────────────────────────────────
  leave: {
    hub: "/admin/leave",
    list: "/admin/leave/list",
    pending: "/admin/leave/pending",
    submit: "/admin/leave/submit",
    flows: "/admin/leave/flows",
    detail: (id) => `/admin/leave/${id}`,
    types: "/admin/leave/types",
    faculty: (fid) => `/admin/faculty/${fid}/leave`,
  },

  // ── Special Groups ────────────────────────────────────────
  groups: {
    hub: "/admin/groups",
    list: "/admin/groups/list",
    new: "/admin/groups/new",
    detail: (id) => `/admin/groups/${id}`,
    edit: (id) => `/admin/groups/${id}/edit`,
    // features (tab-based on detail page)
    announcements: (id) => `/admin/groups/${id}?tab=announcements`,
    attendance: (id) => `/admin/groups/${id}?tab=attendance`,
    tasks: (id) => `/admin/groups/${id}?tab=tasks`,
    polls: (id) => `/admin/groups/${id}?tab=polls`,
    files: (id) => `/admin/groups/${id}?tab=files`,
    notices: (id) => `/admin/groups/${id}?tab=notices`,
    bookings: (id) => `/admin/groups/${id}?tab=bookings`,
  },

  // ── Bulk Operations ───────────────────────────────────────
  bulk: {
    hub: "/admin/bulk",
    status: "/admin/bulk/status",
    promote: "/admin/bulk/promote",
    demote: "/admin/bulk/demote",
    section: "/admin/bulk/section",
  },

  // ── UI Permissions (root only) ────────────────────────────
  uiPerms: {
    hub: "/admin/ui-permissions",
  },

  // ── Feedback ─────────────────────────────────────────────
  feedback: {
    forms: "/admin/feedback/forms",
    results: "/admin/feedback/results",
    resultsFor: (fid) => `/admin/feedback/results/${fid}`,
    teaching: "/admin/feedback/teaching",
    categories: "/admin/feedback/categories",
    questions: "/admin/feedback/questions",
  },

  // ── Reports ──────────────────────────────────────────────
  reports: {
    root: "/admin/reports",
    students: "/admin/reports/students",
    faculty: "/admin/reports/faculty",
    enrollments: "/admin/reports/enrollments",
  },

  // ── System ───────────────────────────────────────────────
  system: {
    roles: "/admin/roles",
    audit: "/admin/audit",
    settings: "/admin/settings",
    erp: "/admin/settings/erp",
    accessRoles: "/admin/access-roles",
    superAdmins: "/admin/superadmins",
    mySessions: "/admin/my-sessions",
    uiPerms: "/admin/ui-permissions",
  },

  // ── Faculty Portal ───────────────────────────────────────
  facultyPortal: {
    root: "/faculty",
    sections: "/faculty/sections",
    students: "/faculty/students",
    feedback: "/faculty/feedback",
    leave: "/faculty/leave",
    settings: "/faculty/settings",
  },

  // ── Student Portal ───────────────────────────────────────
  studentPortal: {
    root: "/student",
    feedback: "/student/feedback",
    enrollment: "/student/enrollment",
    groups: "/student/groups",
    settings: "/student/settings",
  },



  // ── My Profile (all users) ────────────────────────────────
  myProfile: {
    root: "/admin/my-profile",
  },

  // ── Marks & Grades ────────────────────────────────────────
  marks: {
    root: "/admin/marks",
    section: (sid) => `/admin/marks/${sid}`,
  },

  // ── Holidays & Leave Rules ────────────────────────────────
  holidays: {
    root: "/admin/holidays",
    leaveRules: "/admin/holidays/leave-rules",
  },

  // ── Roles & Permissions ───────────────────────────────────
  rolesMgmt: {
    root: "/admin/roles",
    manage: "/admin/roles/manage",
    assign: "/admin/roles/assignment",
  },

  // ── Timetable (add missing entries) ──────────────────────
  timetable: {
    hub: "/admin/timetable",
    periods: "/admin/timetable/periods",
    workload: "/admin/timetable/workload",
    generate: "/admin/timetable/generate",
    sections: "/admin/timetable/sections",
    global: "/admin/timetable/global",
    faculty: "/admin/timetable/faculty",
    courseStructure: "/admin/timetable/course-structure",
    topics: "/admin/timetable/topics",
    special: "/admin/timetable/special",
    reports: "/admin/timetable/reports",
    history: "/admin/timetable/history",
    history: "/admin/timetable/history",
  },

  // ── Rooms ─────────────────────────────────────────────────
  rooms: {
    root: "/admin/rooms",
  },

  // ── Student portal (updated) ──────────────────────────────
  studentPortal: {
    root: "/student",
    dashboard: "/student/dashboard",
    attendance: "/student/attendance",
    feedback: "/student/feedback",
    enrollment: "/student/enrollment",
    groups: "/student/groups",
    timetable: "/student/timetable",
    leave: "/student/leave",
    subjects: "/student/subjects",
    notices: "/student/notices",
    settings: "/student/settings",
  },
}
// ── Helper: build a query-string path ────────────────────────
export const withQuery = (path, params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
};