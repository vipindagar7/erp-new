// src/config/api.config.js
// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every API endpoint
// All phases A–G + V3 (RBAC, bulk ops, section ops, calendar)
// ─────────────────────────────────────────────────────────────

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
export const url = (path) => `${API_BASE}${path}`;

export const EP = {

  // ── Auth ─────────────────────────────────────────────────
  auth: {
    login: `${API_BASE}/auth/login`,
    logout: `${API_BASE}/auth/logout`,
    refresh: `${API_BASE}/auth/refresh`,
    me: `${API_BASE}/auth/me`,
    firstLogin: `${API_BASE}/auth/first-login`,
    verifyOtp: `${API_BASE}/auth/verify-otp`,
    resendOtp: `${API_BASE}/auth/resend-otp`,
    changePassword: `${API_BASE}/auth/change-password`,
    forgotPassword: `${API_BASE}/auth/forgot-password`,
    resetPassword: `${API_BASE}/auth/reset-password`,
    sessions: `${API_BASE}/auth/sessions`,
    revokeSession: (id) => `${API_BASE}/auth/sessions/${id}`,
    switchRole: `${API_BASE}/auth/active-role`,
  },

  // ── ERP Settings ─────────────────────────────────────────
  erpSettings: {
    all: `${API_BASE}/erp-settings/erp`,
    byCategory: (cat) => `${API_BASE}/erp-settings/erp/${cat}`,
    update: `${API_BASE}/erp-settings/erp`,
    moduleBlocks: `${API_BASE}/erp-settings/module-blocks`,
    roleOverrides: `${API_BASE}/erp-settings/role-overrides`,
    campusStatus: `${API_BASE}/erp-settings/campus-status`,
  },

  // ── Super Admin ───────────────────────────────────────────
  superadmin: {
    list: `${API_BASE}/superadmin`,
    create: `${API_BASE}/superadmin`,
    stats: `${API_BASE}/superadmin/stats`,
    byId: (id) => `${API_BASE}/superadmin/${id}`,
    block: (id) => `${API_BASE}/superadmin/${id}/block`,
    unblock: (id) => `${API_BASE}/superadmin/${id}/unblock`,
    demote: (id) => `${API_BASE}/superadmin/${id}/demote`,
    delete: (id) => `${API_BASE}/superadmin/${id}`,
    resetPassword: (id) => `${API_BASE}/superadmin/${id}/reset-password`,
    activity: (id) => `${API_BASE}/superadmin/${id}/activity`,
  },

  // ── Access Roles ──────────────────────────────────────────
  accessRoles: {
    list: `${API_BASE}/access-roles`,
    create: `${API_BASE}/access-roles`,
    permissions: `${API_BASE}/access-roles/permissions`,
    searchUsers: `${API_BASE}/access-roles/search-users`,
    byId: (id) => `${API_BASE}/access-roles/${id}`,
    update: (id) => `${API_BASE}/access-roles/${id}`,
    delete: (id) => `${API_BASE}/access-roles/${id}`,
    users: (id) => `${API_BASE}/access-roles/${id}/users`,
    assign: (id) => `${API_BASE}/access-roles/${id}/assign`,
    revoke: (id) => `${API_BASE}/access-roles/${id}/revoke`,
  },

  // ── Academic Sessions ─────────────────────────────────────
  sessions: {
    list: `${API_BASE}/sessions`,
    current: `${API_BASE}/sessions/current`,
    create: `${API_BASE}/sessions`,
    byId: (id) => `${API_BASE}/sessions/${id}`,
    update: (id) => `${API_BASE}/sessions/${id}`,
    setCurrent: (id) => `${API_BASE}/sessions/${id}/set-current`,
    lock: (id) => `${API_BASE}/sessions/${id}/lock`,
    summary: (id) => `${API_BASE}/sessions/${id}/summary`,
    // Academic calendar periods
    periods:      (id) => `${API_BASE}/sessions/${id}/periods`,
    addPeriod:    (id) => `${API_BASE}/sessions/${id}/periods`,
    deletePeriod:    (sid, pid) => `${API_BASE}/sessions/${sid}/periods/${pid}`,
    calendarSummary: (id) => `${API_BASE}/sessions/${id}/calendar-summary`,
    calendarTemplate:(id) => `${API_BASE}/sessions/${id}/calendar-template`,
    calendarUpload:  (id) => `${API_BASE}/sessions/${id}/calendar-upload`,
  },

  // ── Students ──────────────────────────────────────────────
  students: {
    all:                `${API_BASE}/students`,
    list:               `${API_BASE}/students`,
    templateNoSection:  `${API_BASE}/students/template/no-section`,
    bulkUploadNoSection:`${API_BASE}/students/bulk-upload/no-section`,
    create: `${API_BASE}/students`,
    stats: `${API_BASE}/students/stats`,
    byId: (id) => `${API_BASE}/students/${id}`,
    update: (id) => `${API_BASE}/students/${id}`,
    delete: (id) => `${API_BASE}/students/${id}`,
    restore: (id) => `${API_BASE}/students/${id}/restore`,
    block: (id) => `${API_BASE}/students/${id}/block`,
    unblock: (id) => `${API_BASE}/students/${id}/unblock`,
    deactivate: (id) => `${API_BASE}/students/${id}/deactivate`,
    sectionAssignTemplate: `${API_BASE}/students/section-assign-template`,
    sectionAssignUpload:   `${API_BASE}/students/section-assign-upload`,
    status:  (id) => `${API_BASE}/students/${id}/status`,
    promote: (id) => `${API_BASE}/students/${id}/promote`,
    demote:  (id) => `${API_BASE}/students/${id}/demote`,
    resetPassword: (id) => `${API_BASE}/students/${id}/reset-password`,
    enrollments: (id) => `${API_BASE}/students/${id}/enrollments`,
    activity:    (id) => `${API_BASE}/students/${id}/activity`,
    template: `${API_BASE}/students/template`,
    bulkUpload: `${API_BASE}/students/bulk-upload`,
    export: `${API_BASE}/students/export`,
    statusTemplate: `${API_BASE}/students/status-template`,
    bulkStatus: `${API_BASE}/students/bulk-status`,
    sectionPromote: `${API_BASE}/students/section/promote`,
    sectionBulkStatus: `${API_BASE}/students/section/bulk-status`,
    history: (id) => `${API_BASE}/students/${id}/history`,
    enrollmentHistory: (id) => `${API_BASE}/students/${id}/enrollment-history`,
    rollback: (id, hid) => `${API_BASE}/students/${id}/rollback/${hid}`,
    sectionChangeTemplate: `${API_BASE}/students/section-change-template`,
    sectionChangeUpload:   `${API_BASE}/students/section-change-upload`,
    bulkHardDelete: `${API_BASE}/students/bulk-hard-delete`,
  },

  // ── Faculty ───────────────────────────────────────────────
  faculty: {
    subjectRequests:    `${API_BASE}/faculty/subject-requests`,
    reviewRequest: (id) => `${API_BASE}/faculty/subject-requests/${id}/review`,
    bulkReview:         `${API_BASE}/faculty/subject-requests/bulk-review`,
    list: `${API_BASE}/faculty`,
    create: `${API_BASE}/faculty`,
    stats: `${API_BASE}/faculty/stats`,
    me: `${API_BASE}/faculty/me`,
    byId: (id) => `${API_BASE}/faculty/${id}`,
    update: (id) => `${API_BASE}/faculty/${id}`,
    delete: (id) => `${API_BASE}/faculty/${id}`,
    restore: (id) => `${API_BASE}/faculty/${id}/restore`,
    block: (id) => `${API_BASE}/faculty/${id}/block`,
    unblock: (id) => `${API_BASE}/faculty/${id}/unblock`,
    deactivate: (id) => `${API_BASE}/faculty/${id}/deactivate`,
    resetPassword: (id) => `${API_BASE}/faculty/${id}/reset-password`,
    activity: (id) => `${API_BASE}/faculty/${id}/activity`,
    careerHistory: (id) => `${API_BASE}/faculty/${id}/career-history`,
    leaveSubmit: (id) => `${API_BASE}/faculty/${id}/leave`,
    leavePending: (id) => `${API_BASE}/faculty/${id}/leave/pending`,
    leaveFlow: (id) => `${API_BASE}/faculty/${id}/leave/flow`,
    leaveAction: (leaveId) => `${API_BASE}/faculty/leave/${leaveId}/action`,
    assignSubjects: (id) => `${API_BASE}/faculty/${id}/subjects`,
    template: `${API_BASE}/faculty/template`,
    bulkUpload: `${API_BASE}/faculty/bulk-upload`,
    export: `${API_BASE}/faculty/export`,
  },

  // ── Admins ────────────────────────────────────────────────
  admins: {
    list:      `${API_BASE}/admins`,
    create:    `${API_BASE}/admins`,
    stats:     `${API_BASE}/admins/stats`,
    dashboard: `${API_BASE}/admin/dashboard`,
    byId: (id) => `${API_BASE}/admins/${id}`,
    update: (id) => `${API_BASE}/admins/${id}`,
    delete: (id) => `${API_BASE}/admins/${id}`,
    block: (id) => `${API_BASE}/admins/${id}/block`,
    unblock: (id) => `${API_BASE}/admins/${id}/unblock`,
    deactivate: (id) => `${API_BASE}/admins/${id}/deactivate`,
    promote: (id) => `${API_BASE}/admins/${id}/promote`,
    resetPassword: (id) => `${API_BASE}/admins/${id}/reset-password`,
    activity: (id) => `${API_BASE}/admins/${id}/activity`,
    dashboard: `${API_BASE}/admin/dashboard`,
  },

  // ── Departments ───────────────────────────────────────────
  departments: {
    list: `${API_BASE}/departments`,
    create: `${API_BASE}/departments`,
    byId: (id) => `${API_BASE}/departments/${id}`,
    update: (id) => `${API_BASE}/departments/${id}`,
    delete: (id) => `${API_BASE}/departments/${id}`,
    restore: (id) => `${API_BASE}/departments/${id}/restore`,
    template: `${API_BASE}/departments/template`,
    bulkUpload: `${API_BASE}/departments/bulk-upload`,
    export: `${API_BASE}/departments/export`,
  },

  // ── Programs ──────────────────────────────────────────────
  programs: {
    list: `${API_BASE}/programs`,
    create: `${API_BASE}/programs`,
    byId: (id) => `${API_BASE}/programs/${id}`,
    update: (id) => `${API_BASE}/programs/${id}`,
    delete: (id) => `${API_BASE}/programs/${id}`,
    restore: (id) => `${API_BASE}/programs/${id}/restore`,
    template: `${API_BASE}/programs/template`,
    bulkUpload: `${API_BASE}/programs/bulk-upload`,
  },

  // ── Courses (legacy) ──────────────────────────────────────
  courses: {
    list: `${API_BASE}/courses`,
    create: `${API_BASE}/courses`,
    byId: (id) => `${API_BASE}/courses/${id}`,
    update: (id) => `${API_BASE}/courses/${id}`,
    delete: (id) => `${API_BASE}/courses/${id}`,
    history: `${API_BASE}/courses/history`,
  },

  // ── Branches ──────────────────────────────────────────────
  branches: {
    list: `${API_BASE}/branches`,
    create: `${API_BASE}/branches`,
    byId: (id) => `${API_BASE}/branches/${id}`,
    update: (id) => `${API_BASE}/branches/${id}`,
    delete: (id) => `${API_BASE}/branches/${id}`,
    restore: (id) => `${API_BASE}/branches/${id}/restore`,
    discontinue: (id) => `${API_BASE}/branches/${id}/discontinue`,
    template: `${API_BASE}/branches/template`,
    bulkUpload: `${API_BASE}/branches/bulk-upload`,
    export: `${API_BASE}/branches/export`,
    history: (id) => `${API_BASE}/branches/${id}/history`,
  },

  // ── Subjects ──────────────────────────────────────────────
  subjects: {
    list: `${API_BASE}/subjects`,
    create: `${API_BASE}/subjects`,
    byId: (id) => `${API_BASE}/subjects/${id}`,
    update: (id) => `${API_BASE}/subjects/${id}`,
    delete: (id) => `${API_BASE}/subjects/${id}`,
    restore: (id) => `${API_BASE}/subjects/${id}/restore`,
    template: `${API_BASE}/subjects/template`,
    bulkUpload: `${API_BASE}/subjects/bulk-upload`,
    history: `${API_BASE}/subjects/history`,
  },

  // ── Sections ──────────────────────────────────────────────
  sections: {
    list: `${API_BASE}/sections`,
    create: `${API_BASE}/sections`,
    byId: (id) => `${API_BASE}/sections/${id}`,
    update: (id) => `${API_BASE}/sections/${id}`,
    delete: (id) => `${API_BASE}/sections/${id}`,
    restore: (id) => `${API_BASE}/sections/${id}/restore`,
    history: (id) => `${API_BASE}/sections/${id}/history`,
    allHistory: `${API_BASE}/sections/history`,
    assignSubject: (id) => `${API_BASE}/sections/${id}/subjects`,
    updateSubject: (id, sid) => `${API_BASE}/sections/${id}/subjects/${sid}`,
    removeSubject: (id, sid) => `${API_BASE}/sections/${id}/subjects/${sid}`,
    promote: (id) => `${API_BASE}/sections/${id}/promote`,
    promoteMultiple: `${API_BASE}/sections/promote-multiple`,
    studentCounts: `${API_BASE}/sections/student-counts`,
    bulkStatus: (id) => `${API_BASE}/sections/${id}/bulk-status`,
    subjectTemplate: `${API_BASE}/sections/subject-template`,
    bulkAssign: `${API_BASE}/sections/bulk-assign-subjects`,
    template: `${API_BASE}/sections/template`,
    bulkUpload: `${API_BASE}/sections/bulk-upload`,
    // V3 bulk ops
    bulkPromote: `${API_BASE}/sections/bulk-promote`,
    bulkDemote:  `${API_BASE}/sections/bulk-demote`,
    graduate:    `${API_BASE}/sections/graduate`,
    studentStatusTemplate: `${API_BASE}/sections/student-status-template`,
    studentStatusUpload:   `${API_BASE}/sections/student-status-upload`,
    transferTemplate: `${API_BASE}/sections/transfer-template`,
    transferUpload:   `${API_BASE}/sections/transfer-upload`,
    // Per-section student management
    students:      (id) => `${API_BASE}/sections/${id}/students`,
    addStudents:   (id) => `${API_BASE}/sections/${id}/add-students`,
    removeStudents:(id) => `${API_BASE}/sections/${id}/remove-students`,
    groupTemplate: (id) => `${API_BASE}/sections/${id}/group-template`,
    groupUpload:   (id) => `${API_BASE}/sections/${id}/group-upload`,
    assignGroups:  (id) => `${API_BASE}/sections/${id}/assign-groups`,
    fyeSplitTemplate:(id) => `${API_BASE}/sections/${id}/fye-split-template`,
    fyeSplitUpload:  (id) => `${API_BASE}/sections/${id}/fye-split-upload`,
  },

  // ── Curriculum ────────────────────────────────────────────
  curriculum: {
    list: `${API_BASE}/curriculum`,
    create: `${API_BASE}/curriculum`,
    delete: (id) => `${API_BASE}/curriculum/${id}`,
    autoAssign: (sid) => `${API_BASE}/curriculum/auto-assign/${sid}`,
    bulkAutoAssign: `${API_BASE}/curriculum/bulk-auto-assign`,
    template: `${API_BASE}/curriculum/template`,
    bulkUpload: `${API_BASE}/curriculum/bulk-upload`,
    history: (sid) => `${API_BASE}/curriculum/history/${sid}`,
  },

  // ── Enrollments ───────────────────────────────────────────
  enrollments: {
    list: `${API_BASE}/enrollments`,
    byId: (id) => `${API_BASE}/enrollments/${id}`,
    update: (id) => `${API_BASE}/enrollments/${id}`,
    history: `${API_BASE}/enrollments/history`,
  },

  // ── Leave ─────────────────────────────────────────────────
  leave: {
    list: `${API_BASE}/leave`,
    stats: `${API_BASE}/leave/stats`,
    pending: `${API_BASE}/leave/pending`,
    byId: (id) => `${API_BASE}/leave/${id}`,
    action: (id) => `${API_BASE}/leave/${id}/action`,
    cancel: (id) => `${API_BASE}/leave/${id}/cancel`,
    submit: (fid) => `${API_BASE}/leave/faculty/${fid}/submit`,
    faculty: (fid) => `${API_BASE}/leave/faculty/${fid}`,
    flow: (fid) => `${API_BASE}/leave/faculty/${fid}/flow`,
  },

  // ── Groups ────────────────────────────────────────────────
  groups: {
    list:   `${API_BASE}/groups`,
    create: `${API_BASE}/groups`,
    stats:  `${API_BASE}/groups/stats`,
    byId:   (id) => `${API_BASE}/groups/${id}`,
    update: (id) => `${API_BASE}/groups/${id}`,
    delete: (id) => `${API_BASE}/groups/${id}`,
    members:   (id) => `${API_BASE}/groups/${id}/members`,
    bySection: (id) => `${API_BASE}/groups/${id}/members/section`,
    // V3 — full member management
    addById:      (id) => `${API_BASE}/groups/${id}/members/by-id`,
    addByEmail:   (id) => `${API_BASE}/groups/${id}/members/by-email`,
    addBySection: (id) => `${API_BASE}/groups/${id}/members/by-section`,
    removeMember: (id, sid) => `${API_BASE}/groups/${id}/members/${sid}`,
    removeMembers:(id) => `${API_BASE}/groups/${id}/members`,
    // Faculty groups
    facultyList:    `${API_BASE}/groups/faculty-groups`,
    facultyCreate:  `${API_BASE}/groups/faculty-groups`,
    facultyById:    (id) => `${API_BASE}/groups/faculty-groups/${id}`,
    facultyUpdate:  (id) => `${API_BASE}/groups/faculty-groups/${id}`,
    facultyDelete:  (id) => `${API_BASE}/groups/faculty-groups/${id}`,
    facultyAddById:    (id) => `${API_BASE}/groups/faculty-groups/${id}/members/by-id`,
    facultyAddByEmail: (id) => `${API_BASE}/groups/faculty-groups/${id}/members/by-email`,
    facultyRemoveMember:(id,fid) => `${API_BASE}/groups/faculty-groups/${id}/members/${fid}`,
    // Group features
    announcements: (id) => `${API_BASE}/groups/${id}/announcements`,
    attendance:    (id) => `${API_BASE}/groups/${id}/attendance`,
    tasks:         (id) => `${API_BASE}/groups/${id}/tasks`,
    polls:         (id) => `${API_BASE}/groups/${id}/polls`,
    pollResults:   (id, pid) => `${API_BASE}/groups/${id}/polls/${pid}`,
    pollVote:      (id, pid) => `${API_BASE}/groups/${id}/polls/${pid}/vote`,
    files:         (id) => `${API_BASE}/groups/${id}/files`,
    notices:       (id) => `${API_BASE}/groups/${id}/notices`,
    bookings:      (id) => `${API_BASE}/groups/${id}/bookings`,
  },

  // ── Bulk Operations ───────────────────────────────────────
  bulk: {
    statusTemplate: `${API_BASE}/bulk/status/template`,
    statusUpload:   `${API_BASE}/bulk/status/upload`,
    promoteTemplate:`${API_BASE}/bulk/promote/template`,
    promoteUpload:  `${API_BASE}/bulk/promote/upload`,
    demoteTemplate: `${API_BASE}/bulk/demote/template`,
    demoteUpload:   `${API_BASE}/bulk/demote/upload`,
    sectionPromote: `${API_BASE}/bulk/section/promote`,
    sectionStatus:  `${API_BASE}/bulk/section/status`,
    exportResults:  `${API_BASE}/bulk/export-results`,
  },

  // ── UI Permissions ────────────────────────────────────────
  uiPermissions: {
    map:         `${API_BASE}/ui-permissions/map`,
    all:         `${API_BASE}/ui-permissions`,
    module:      (m) => `${API_BASE}/ui-permissions/module/${m}`,
    set:         `${API_BASE}/ui-permissions/set`,
    bulk:        `${API_BASE}/ui-permissions/bulk`,
    reset:       `${API_BASE}/ui-permissions/reset`,
    resetModule: (m) => `${API_BASE}/ui-permissions/module/${m}`,
  },

  // ── Feedback ──────────────────────────────────────────────
  feedback: {
    // ── Categories ────────────────────────────────────────────
    categories:          `${API_BASE}/feedback/categories`,
    categoryById:   (id) => `${API_BASE}/feedback/categories/${id}`,
    createCategory:      `${API_BASE}/feedback/categories`,
    updateCategory: (id) => `${API_BASE}/feedback/categories/${id}`,
    deleteCategory: (id) => `${API_BASE}/feedback/categories/${id}`,
    bulkUploadCategories:`${API_BASE}/feedback/categories/bulk-upload`,
    categoryTemplate:    `${API_BASE}/feedback/categories/template`,

    // ── Questions ─────────────────────────────────────────────
    questions:           `${API_BASE}/feedback/questions`,
    questionById:   (id) => `${API_BASE}/feedback/questions/${id}`,
    createQuestion:      `${API_BASE}/feedback/questions`,
    updateQuestion: (id) => `${API_BASE}/feedback/questions/${id}`,
    deleteQuestion: (id) => `${API_BASE}/feedback/questions/${id}`,
    bulkUploadQuestions: `${API_BASE}/feedback/questions/bulk-upload`,
    questionTemplate:    `${API_BASE}/feedback/questions/template`,

    // ── Forms ─────────────────────────────────────────────────
    forms:               `${API_BASE}/feedback/forms`,
    formById:       (id) => `${API_BASE}/feedback/forms/${id}`,
    createForm:          `${API_BASE}/feedback/forms`,
    updateForm:     (id) => `${API_BASE}/feedback/forms/${id}`,
    deleteForm:     (id) => `${API_BASE}/feedback/forms/${id}`,
    toggleActive:   (id) => `${API_BASE}/feedback/forms/${id}/toggle`,
    toggleForm:     (id) => `${API_BASE}/feedback/forms/${id}/toggle`,
    formAction:     (id) => `${API_BASE}/feedback/forms/${id}/action`,
    updateAction:   (id) => `${API_BASE}/feedback/forms/${id}/action`,
    results:        (id) => `${API_BASE}/feedback/forms/${id}/results`,
    exportResults:  (id) => `${API_BASE}/feedback/forms/${id}/export`,
    submit:         (id) => `${API_BASE}/feedback/forms/${id}/submit`,
    submitFeedback: (id) => `${API_BASE}/feedback/forms/${id}/submit`,
    deleteResponses:(id) => `${API_BASE}/feedback/forms/${id}/responses`,
    formTemplate:   (id) => `${API_BASE}/feedback/forms/${id}/template`,

    // ── Groups ────────────────────────────────────────────────
    groups:              `${API_BASE}/feedback/groups`,
    groupById:      (id) => `${API_BASE}/feedback/groups/${id}`,
    updateGroup:    (id) => `${API_BASE}/feedback/groups/${id}`,
    deleteGroup:    (id) => `${API_BASE}/feedback/groups/${id}`,
    groupTemplate:  (id) => `${API_BASE}/feedback/groups/${id}/template`,
    groupSubmit:    (id) => `${API_BASE}/feedback/groups/${id}/bulk-submit`,
    groupExport:    (id) => `${API_BASE}/feedback/groups/${id}/export`,

    // ── Reports ───────────────────────────────────────────────
    teachingReport:      `${API_BASE}/feedback/teaching-report`,
    exportLevel: (level, id) => `${API_BASE}/feedback/teaching-report/export/${level}/${id}`,

    // ── Student ───────────────────────────────────────────────
    myForms:             `${API_BASE}/feedback/my-forms`,
  },

  // ── Audit ─────────────────────────────────────────────────
  audit: {
    list: `${API_BASE}/audit`,
    stats: `${API_BASE}/audit/stats`,
    export: `${API_BASE}/audit/export`,
    byId: (id) => `${API_BASE}/audit/${id}`,
    restore: (id) => `${API_BASE}/audit/${id}/restore`,
  },

  // ── Roles (RBAC) ──────────────────────────────────────────
  roles: {
    list: `${API_BASE}/roles`,
    byId: (id) => `${API_BASE}/roles/${id}`,
    permissions: `${API_BASE}/roles/permissions`,
    assignToUser: `${API_BASE}/roles/assign`,
    revokeFromUser: `${API_BASE}/roles/revoke`,
    userRoles: (uid) => `${API_BASE}/roles/user/${uid}`,
  },


  // ── Rooms & Labs ──────────────────────────────────────────
  rooms: {
    list:        `${API_BASE}/rooms`,
    create:      `${API_BASE}/rooms`,
    stats:       `${API_BASE}/rooms/stats`,
    template:    `${API_BASE}/rooms/template`,
    bulkUpload:  `${API_BASE}/rooms/bulk-upload`,
    byId:        (id) => `${API_BASE}/rooms/${id}`,
    update:      (id) => `${API_BASE}/rooms/${id}`,
    delete:      (id) => `${API_BASE}/rooms/${id}`,
    restore:     (id) => `${API_BASE}/rooms/${id}/restore`,
    addSubject:  (id, sid) => `${API_BASE}/rooms/${id}/subjects/${sid}`,
    removeSubject:(id, sid) => `${API_BASE}/rooms/${id}/subjects/${sid}`,
    addStaff:    (id) => `${API_BASE}/rooms/${id}/staff`,
    removeStaff: (id, uid) => `${API_BASE}/rooms/${id}/staff/${uid}`,
    availability:(id) => `${API_BASE}/rooms/${id}/availability`,
  },

  // ── Timetable ─────────────────────────────────────────────
  timetable: {
    list:          `${API_BASE}/timetable`,
    global:        `${API_BASE}/timetable/global`,
    // ── Entries ───────────────────────────────────────────────
    // addEntry: (ttId) => ... already defined below
    // ── Generate ──────────────────────────────────────────
    generate:      `${API_BASE}/timetable/generate`,
    generateAll:   `${API_BASE}/timetable/generate-all`,
    genConfig:     `${API_BASE}/timetable/gen-config`,
    // ── Periods ───────────────────────────────────────────
    periods:       (sid) => sid ? `${API_BASE}/timetable/periods?session_id=${sid}` : `${API_BASE}/timetable/periods`,
    periodById:    (id)  => `${API_BASE}/timetable/periods/${id}`,
    bulkPeriods:         (sid) => sid ? `${API_BASE}/timetable/periods/bulk?session_id=${sid}` : `${API_BASE}/timetable/periods/bulk`,
    // Faculty free slots (for swap clash detection)
    facultyFreeSlots: (fid) => `${API_BASE}/timetable/faculty/${fid}/free-slots`,
    checkSwap:        `${API_BASE}/timetable/check-swap`,
    checkClash:       `${API_BASE}/timetable/check-clash`,
    // ── Section/Faculty ───────────────────────────────────
    bySection:     (sid) => `${API_BASE}/timetable/section/${sid}`,
    byFaculty:     (fid) => `${API_BASE}/timetable/faculty/${fid}`,
    byId:          (id)  => `${API_BASE}/timetable/${id}`,
    lock:          (id)  => `${API_BASE}/timetable/${id}/lock`,
    unlock:        (id)  => `${API_BASE}/timetable/${id}/unlock`,
    // ── Entries ───────────────────────────────────────────
    addEntry:      (ttId)      => `${API_BASE}/timetable/${ttId}/entries`,
    updateEntry:   (eid)       => `${API_BASE}/timetable/entries/${eid}`,
    deleteEntry:   (_ttId, eid) => `${API_BASE}/timetable/entries/${eid || _ttId}`,
    removeEntry:   (eid)       => `${API_BASE}/timetable/entries/${eid}`,
    // ── Course Structure ──────────────────────────────────
    courseStructure:           `${API_BASE}/timetable/course-structure`,
    courseStructureTemplate:   `${API_BASE}/timetable/course-structure/template`,
    courseStructureUpload:     `${API_BASE}/timetable/course-structure/upload`,
    // ── Topics Taught ─────────────────────────────────────
    topics:                    `${API_BASE}/timetable/topics`,
    // ── Special Sessions ──────────────────────────────────
    specialSessions:           `${API_BASE}/timetable/special`,
    specialAttend: (id)  =>    `${API_BASE}/timetable/special/${id}/attend`,
    // ── Daily Reports ─────────────────────────────────────
    dailyReports:              `${API_BASE}/timetable/reports/daily`,
    generateReports:           `${API_BASE}/timetable/reports/daily/generate`,
    exportReport:              `${API_BASE}/timetable/reports/daily/export`,
    // ── Snapshots & History ──────────────────────────────────
    snapshots:     (id)  => `${API_BASE}/timetable/${id}/snapshots`,
    createSnap:    (id)  => `${API_BASE}/timetable/${id}/snapshots`,
    snapById:      (sid) => `${API_BASE}/timetable/snapshots/${sid}`,
    activateSnap:  (sid) => `${API_BASE}/timetable/snapshots/${sid}/activate`,
    history:             `${API_BASE}/timetable/history`,
    // ── Combine / Split ──────────────────────────────────────
    combine:             `${API_BASE}/timetable/combine`,
    splitEntry:  (id)  => `${API_BASE}/timetable/entries/${id}/split`,

    // ── Drag & Drop ───────────────────────────────────────────
    dragDrop:            `${API_BASE}/timetable/drag-drop`,
    // ── Rooms (clash-aware) ───────────────────────────────────
    rooms:               `${API_BASE}/timetable/rooms`,
    // ── Workload (legacy) ─────────────────────────────────────
    workload:                  `${API_BASE}/timetable/workload`,
    workloadTemplate: (sid) => `${API_BASE}/timetable/workload-template/${sid}`,
    workloadUpload:   (sid) => `${API_BASE}/timetable/workload-upload/${sid}`,
  },

  // ── Notifications ─────────────────────────────────────────
  notifications: {
    list: `${API_BASE}/notifications`,
    markRead: (id) => `${API_BASE}/notifications/${id}/read`,
    markAll: `${API_BASE}/notifications/read-all`,
    delete: (id) => `${API_BASE}/notifications/${id}`,
  },

  // ── Reports V3 ──────────────────────────────────────────────
  reports: {
    catalog:           `${API_BASE}/reports/catalog`,
    generate:     (id) => `${API_BASE}/reports/generate/${id}`,
    students:          `${API_BASE}/reports/students`,
    studentsBySection: `${API_BASE}/reports/students/by-section`,
    studentsByDept:    `${API_BASE}/reports/students/by-dept`,
    faculty:           `${API_BASE}/reports/faculty`,
    facultyWorkload:   `${API_BASE}/reports/faculty/workload`,
    sections:          `${API_BASE}/reports/sections`,
    sectionSubjects:   `${API_BASE}/reports/sections/subjects`,
    enrollments:       `${API_BASE}/reports/enrollments`,
    stats:             `${API_BASE}/admin/dashboard`,
  },

  studentPhotos: {
    upload:     (id) => `${API_BASE}/students/${id}/photo`,
    bulkUpload:        `${API_BASE}/students/bulk-photos`,
  },

  facultyAdmin: {
    changeEmail: (id) => `${API_BASE}/faculty/${id}/email`,
  },
  // ── Holidays (from academic calendar) ────────────────────
  holidays: {
    list:  `${API_BASE}/holidays`,
    check: `${API_BASE}/holidays/check`,
  },

  // ── Auth extras
  authExtra: {
    activeRole: `${API_BASE}/auth/active-role`,
  },
  // ── Training ──────────────────────────────────────────────
  training: {
    list:       `${API_BASE}/training`,
    create:     `${API_BASE}/training`,
    byId:       (id)  => `${API_BASE}/training/${id}`,
    update:     (id)  => `${API_BASE}/training/${id}`,
    enroll:     (id)  => `${API_BASE}/training/${id}/enroll`,
    attendance: (id)  => `${API_BASE}/training/${id}/attendance`,
    report:     (id)  => `${API_BASE}/training/${id}/report`,
    summary:    `${API_BASE}/training/report/summary`,
    mentors:    `${API_BASE}/training/mentors`,
    mentorReport:(fid)=> `${API_BASE}/training/mentor/${fid}/report`,
  },

  // ── Academic Calendar ─────────────────────────────────
  calendar: {
    list:     `${API_BASE}/calendar`,
    create:   `${API_BASE}/calendar`,
    update:   (id) => `${API_BASE}/calendar/${id}`,
    delete:   (id) => `${API_BASE}/calendar/${id}`,
    bulk:     `${API_BASE}/calendar/bulk`,
    summary:  (sid) => `${API_BASE}/calendar/summary/${sid}`,
  },
  // ── Extra Attendance ──────────────────────────────────
  extraAttendance: {
    grant:    `${API_BASE}/attendance/extra/grant`,
    list:     `${API_BASE}/attendance/extra`,
    needed:   (sid, subjectId) => `${API_BASE}/attendance/extra/needed/${sid}/${subjectId}`,
  },
  // ── Student Leave ─────────────────────────────────────
  studentLeave: {
    list:     `${API_BASE}/student-leave`,
    create:   `${API_BASE}/student-leave`,
    byId:     (id) => `${API_BASE}/student-leave/${id}`,
    approve:  (id) => `${API_BASE}/student-leave/${id}/approve`,
    reject:   (id) => `${API_BASE}/student-leave/${id}/reject`,
    cancel:   (id) => `${API_BASE}/student-leave/${id}`,
    pending:  (role) => `${API_BASE}/student-leave/pending/${role}`,
  },
  // ── Assignments ───────────────────────────────────────
  assignments: {
    list:       `${API_BASE}/assignments`,
    create:     `${API_BASE}/assignments`,
    byId:       (id)  => `${API_BASE}/assignments/${id}`,
    update:     (id)  => `${API_BASE}/assignments/${id}`,
    publish:    (id)  => `${API_BASE}/assignments/${id}/publish`,
    close:      (id)  => `${API_BASE}/assignments/${id}/close`,
    submit:     (id)  => `${API_BASE}/assignments/${id}/submit`,
    grade:      (sid) => `${API_BASE}/assignments/submissions/${sid}/grade`,
    plagiarism: (id)  => `${API_BASE}/assignments/${id}/plagiarism-check`,
    report:     (id)  => `${API_BASE}/assignments/${id}/report`,
  },
  // ── Exam ──────────────────────────────────────────────
  exam: {
    list:       `${API_BASE}/exam`,
    create:     `${API_BASE}/exam`,
    byId:       (id)  => `${API_BASE}/exam/${id}`,
    update:     (id)  => `${API_BASE}/exam/${id}`,
    cancel:     (id)  => `${API_BASE}/exam/${id}/cancel`,
    schedule:   (id)  => `${API_BASE}/exam/${id}/schedule`,
    autoDate:   (id)  => `${API_BASE}/exam/${id}/auto-datesheet`,
    seating:    (id)  => `${API_BASE}/exam/${id}/seating/generate`,
    tickets:    (id)  => `${API_BASE}/exam/${id}/hall-tickets/generate`,
    ticketData: (id, sid) => `${API_BASE}/exam/${id}/hall-tickets/${sid}`,
    marks:      (id, subjectId) => `${API_BASE}/exam/${id}/marks/${subjectId}`,
    publish:    (id)  => `${API_BASE}/exam/${id}/publish-results`,
    report:     (id)  => `${API_BASE}/exam/${id}/report`,
  },
  // ── Fee ───────────────────────────────────────────────
  fee: {
    structures:   `${API_BASE}/fee/structures`,
    scholarships: `${API_BASE}/fee/scholarships`,
    student:      (sid) => `${API_BASE}/fee/student/${sid}`,
    initFee:      (sid) => `${API_BASE}/fee/student/${sid}/init`,
    record:       (pid) => `${API_BASE}/fee/payments/${pid}/record`,
    scholarship:  (pid) => `${API_BASE}/fee/payments/${pid}/scholarship`,
    waive:        (pid) => `${API_BASE}/fee/payments/${pid}/waive`,
    defaulters:   `${API_BASE}/fee/report/defaulters`,
    feeSummary:   `${API_BASE}/fee/report/summary`,
  },
  // ── HR / Salary ───────────────────────────────────────
  hr: {
    components:   `${API_BASE}/hr/components`,
    slips:        `${API_BASE}/hr/slips`,
    mySlips:      `${API_BASE}/hr/slips/my`,
    slipById:     (id) => `${API_BASE}/hr/slips/${id}`,
    generate:     `${API_BASE}/hr/slips/generate`,
    bulkGenerate: `${API_BASE}/hr/slips/bulk-generate`,
    approve:      (id) => `${API_BASE}/hr/slips/${id}/approve`,
    markPaid:     (id) => `${API_BASE}/hr/slips/${id}/mark-paid`,
    hrReport:     `${API_BASE}/hr/report`,
  },
  // ── Skill Card ────────────────────────────────────────
  skillCard: {
    init:       (sid)   => `${API_BASE}/skill-card/init/${sid}`,
    bulkInit:   `${API_BASE}/skill-card/bulk-init`,
    student:    (sid)   => `${API_BASE}/skill-card/student/${sid}`,
    updateEntry:(eid)   => `${API_BASE}/skill-card/entry/${eid}`,
    bulkUpdate: `${API_BASE}/skill-card/bulk-update`,
    readiness:  (sid)   => `${API_BASE}/skill-card/readiness/${sid}`,
    mentorView: (secId) => `${API_BASE}/skill-card/mentor-view/${secId}`,
  },
  // ── Dept Scope ────────────────────────────────────────
  deptScope: {
    list:       `${API_BASE}/admin/dept-scope`,
    userScope:  (uid) => `${API_BASE}/admin/dept-scope/user/${uid}`,
    grant:      `${API_BASE}/admin/dept-scope/grant`,
    revoke:     `${API_BASE}/admin/dept-scope/revoke`,
  },
  // ── Faculty Bulk Ops ──────────────────────────────────
  facultyBulk: {
    status:      `${API_BASE}/faculty/bulk/status`,
    designation: `${API_BASE}/faculty/bulk/designation`,
    block:       `${API_BASE}/faculty/bulk/block`,
    unblock:     `${API_BASE}/faculty/bulk/unblock`,
    bulkExport:  `${API_BASE}/faculty/bulk/export`,
  },
  // ── Marks ────────────────────────────────────────────────────
  marks: {
    list:         `${API_BASE}/marks`,
    bulk:         `${API_BASE}/marks/bulk`,
    byStudent: (id) => `${API_BASE}/marks/student/${id}`,
  },
  // ── Holidays ─────────────────────────────────────────────────
  holidays: {
    list:       `${API_BASE}/holidays`,
    create:     `${API_BASE}/holidays`,
    update:(id) =>`${API_BASE}/holidays/${id}`,
    delete:(id) =>`${API_BASE}/holidays/${id}`,
    check:       `${API_BASE}/holidays/check`,
    leaveRules:  `${API_BASE}/holidays/leave-rules`,
    creditRun:   `${API_BASE}/holidays/leave-credit/run`,
    carryForward:`${API_BASE}/holidays/leave-credit/carry-forward`,
  },
  // ── Roles & Permissions ───────────────────────────────────────
  roles: {
    list:           `${API_BASE}/roles`,
    byId:   (id) => `${API_BASE}/roles/${id}`,
    create:         `${API_BASE}/roles`,
    update: (id) => `${API_BASE}/roles/${id}`,
    delete: (id) => `${API_BASE}/roles/${id}`,
    permissions:(id)=>`${API_BASE}/roles/${id}/permissions`,
    allPerms:       `${API_BASE}/roles/permissions/all`,
    assign:         `${API_BASE}/roles/assign`,
    revoke:         `${API_BASE}/roles/revoke`,
    userRoles:(uid)=>`${API_BASE}/roles/user/${uid}`,
    seed:           `${API_BASE}/roles/seed`,
  },


  // ── RBAC (scoped role assignment) ─────────────────
  rbac: {
    assign:         `${API_BASE}/rbac/assign`,
    revoke:         (id) => `${API_BASE}/rbac/assignments/${id}`,
    assignments:    `${API_BASE}/rbac/assignments`,
    userRoles:      (uid) => `${API_BASE}/rbac/user/${uid}`,
    facultyRoles:   (fid) => `${API_BASE}/rbac/faculty/${fid}`,
    roles:          `${API_BASE}/rbac/roles`,
    init:           `${API_BASE}/rbac/init`,
  },

  // ── Role Upgrade (primary role grant/promote) ──────
  roleUpgrade: {
    list:    `${API_BASE}/role-upgrade`,
    grant:   (uid) => `${API_BASE}/role-upgrade/${uid}/grant`,
    revoke:  (uid) => `${API_BASE}/role-upgrade/${uid}/revoke`,
    promote: (uid) => `${API_BASE}/role-upgrade/${uid}/promote`,
  },

  // ── Permission Groups ──────────────────────────────
  permissionGroups: {
    list:         `${API_BASE}/permission-groups`,
    create:       `${API_BASE}/permission-groups`,
    byId:         (id) => `${API_BASE}/permission-groups/${id}`,
    update:       (id) => `${API_BASE}/permission-groups/${id}`,
    delete:       (id) => `${API_BASE}/permission-groups/${id}`,
    assign:       `${API_BASE}/permission-groups/assign`,
    userGroups:   (uid) => `${API_BASE}/permission-groups/user/${uid}`,
    effective:    (uid) => `${API_BASE}/permission-groups/effective/${uid}`,
    removeAssign: (uid, gid) => `${API_BASE}/permission-groups/assign/${uid}/${gid}`,
  },


  // ── Permissions Manager (root/superadmin) ─────────────
  permissions: {
    available:    `${API_BASE}/permissions/available`,
    groups:       `${API_BASE}/permissions/groups`,
    groupById:    (id) => `${API_BASE}/permissions/groups/${id}`,
    assignGroups: `${API_BASE}/permissions/groups/assign`,
    removeGroup:  (uid,gid) => `${API_BASE}/permissions/groups/assign/${uid}/${gid}`,
    userPerms:    (uid) => `${API_BASE}/permissions/user/${uid}`,
    searchUsers:  `${API_BASE}/permissions/search-users`,
  },

  // ── Student Attendance ─────────────────────────────────────
  studentAttendance: {
    mark:       `${API_BASE}/attendance/mark`,
    bulkMark:   `${API_BASE}/attendance/bulk-mark`,
    summary:    (sectionId) => `${API_BASE}/attendance/summary/${sectionId}`,
    byDate:     `${API_BASE}/attendance/by-date`,
    students:   (sectionId) => `${API_BASE}/attendance/students/${sectionId}`,
    freeze:     `${API_BASE}/attendance/freeze`,
    myRecord:   `${API_BASE}/attendance/my-record`,
  },

};