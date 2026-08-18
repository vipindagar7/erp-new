// src/config/nav.config.js
// Permission-based navigation — uses effectivePermissions (dot notation)
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen,
  Layers, MessageSquare, ClipboardList, BarChart3, Shield,
  FileText, UserCircle, Activity, CalendarDays, ShieldCheck,
  Search, Upload, Download, ShieldOff, History, Clock,
  Banknote, Settings, CheckSquare, Calendar, Lock,
  BarChart2, UserPlus, Navigation, Award, Star, Plus,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN NAV — shown on sidebar always
// Grouped accordion style
// ─────────────────────────────────────────────────────────────
export const ADMIN_NAV = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { key: "dashboard", label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
      { key: "sessions", label: "Sessions", path: "/admin/sessions", icon: CalendarDays },
      { key: "audit", label: "Audit Trail", path: "/admin/audit", icon: Shield, permission: "audit.view" },
    ],
  },
  {
    key: "people",
    label: "People",
    icon: Users,
    items: [
      { key: "students", label: "Students", path: "/admin/students", icon: Users, permission: "students.view" },
      { key: "faculty", label: "Faculty", path: "/admin/faculty", icon: GraduationCap, permission: "faculty.view" },
    ],
  },
  {
    key: "academic",
    label: "Academic",
    icon: Building2,
    items: [
      { key: "departments", label: "Departments", path: "/admin/departments", icon: Building2, permission: "departments.view" },
      { key: "programs", label: "Programs", path: "/admin/programs", icon: FileText, permission: "academic.view" },
      { key: "branches", label: "Branches", path: "/admin/branches", icon: Layers, permission: "academic.view" },
      { key: "sections", label: "Sections", path: "/admin/sections", icon: ClipboardList, permission: "academic.view" },
      { key: "subjects", label: "Subjects", path: "/admin/subjects", icon: BookOpen, permission: "curriculum.view" },
      { key: "curriculum", label: "Curriculum", path: "/admin/curriculum", icon: Navigation, permission: "curriculum.view" },
      { key: "universities", label: "Universities", path: "/admin/universities", icon: Award, permission: "academic.view" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    icon: CheckSquare,
    items: [
      { key: "timetable", label: "Timetable", path: "/admin/timetable", icon: Calendar, permission: "timetable.view" },
      { key: "attendance", label: "Attendance", path: "/admin/attendance", icon: CheckSquare, permission: "attendance.view" },
      { key: "leave", label: "Leave", path: "/admin/leave", icon: Clock, permission: "leave.view" },
      { key: "holidays", label: "Holidays", path: "/admin/holidays", icon: CalendarDays, permission: "timetable.holiday" },
    ],
  },
  {
    key: "assessment",
    label: "Assessment",
    icon: BookOpen,
    items: [
      { key: "assignments", label: "Assignments", path: "/admin/assignments", icon: ClipboardList, permission: "assignments.view" },
      { key: "exam", label: "Exams", path: "/admin/exam", icon: BookOpen, permission: "exam.view" },
      { key: "marks", label: "Marks", path: "/admin/marks", icon: BarChart2, permission: "marks.view" },
    ],
  },
  {
    key: "finance",
    label: "Finance & HR",
    icon: Banknote,
    items: [
      { key: "fee", label: "Fee", path: "/admin/fee", icon: Banknote, permission: "fee.view" },
      { key: "hr", label: "HR/Payroll", path: "/admin/hr", icon: UserCircle, permission: "hr.view" },
    ],
  },
  {
    key: "engage",
    label: "Engagement",
    icon: MessageSquare,
    items: [
      { key: "feedback", label: "Feedback", path: "/admin/feedback", icon: MessageSquare, permission: "feedback.view" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    items: [
      { key: "rpt-students", label: "Student Reports", path: "/admin/reports/students", icon: Users, permission: "reports.students" },
      { key: "rpt-faculty", label: "Faculty Reports", path: "/admin/reports/faculty", icon: GraduationCap, permission: "reports.faculty" },
      { key: "rpt-attendance", label: "Attendance Reports", path: "/admin/reports/attendance", icon: CheckSquare, permission: "reports.attendance" },
      { key: "rpt-academic", label: "Academic Reports", path: "/admin/reports/academic", icon: Building2, permission: "reports.academic" },
    ],
  },
  {
    key: "system",
    label: "System",
    icon: Settings,
    items: [
      { key: "roles", label: "Roles & Permissions", path: "/admin/roles", icon: ShieldCheck, rootOnly: true },
      { key: "erp-settings", label: "ERP Settings", path: "/admin/erp-settings", icon: Settings, rootOnly: true },
      { key: "notif", label: "Notifications", path: "/admin/notifications", icon: MessageSquare, rootOnly: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// STUDENT MODULE NAV
// ─────────────────────────────────────────────────────────────
export const STUDENT_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-overview", type: "divider", label: "Overview" },
  { key: "students-home", label: "Student Hub", path: "/admin/students", icon: LayoutDashboard, end: true },
  { key: "students-analytics", label: "Analytics", path: "/admin/students/analytics", icon: BarChart2, permission: "students.view" },
  { key: "div-lists", type: "divider", label: "Lists" },
  { key: "students-list", label: "All Students", path: "/admin/students/list", icon: Users, permission: "students.view" },
  { key: "students-active", label: "Active", path: "/admin/students/active", icon: CheckSquare, permission: "students.view" },
  { key: "students-detained", label: "Detained", path: "/admin/students/detained", icon: ShieldOff, permission: "students.view" },
  { key: "students-passed", label: "Passed", path: "/admin/students/passed", icon: GraduationCap, permission: "students.view" },
  { key: "div-actions", type: "divider", label: "Actions" },
  { key: "students-new", label: "Add Student", path: "/admin/students/new", icon: UserPlus, permission: "students.create" },
  { key: "students-bulk", label: "Bulk Upload", path: "/admin/students/bulk", icon: Upload, permission: "students.create" },
  { key: "students-search", label: "Search", path: "/admin/students/search", icon: Search, permission: "students.view" },
  { key: "students-export", label: "Export", path: "/admin/students/export", icon: Download, permission: "students.export" },
  { key: "students-promote", label: "Promote/Demote", path: "/admin/students/promote", icon: Star, permission: "students.promote" },
];

// ─────────────────────────────────────────────────────────────
// FACULTY MODULE NAV
// ─────────────────────────────────────────────────────────────
export const FACULTY_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-overview", type: "divider", label: "Overview" },
  { key: "faculty-home", label: "Faculty Hub", path: "/admin/faculty", icon: LayoutDashboard, end: true },
  { key: "faculty-analytics", label: "Analytics", path: "/admin/faculty/analytics", icon: BarChart2, permission: "faculty.view" },
  { key: "div-lists", type: "divider", label: "Lists" },
  { key: "faculty-list", label: "All Faculty", path: "/admin/faculty/list", icon: Users, permission: "faculty.view" },
  { key: "faculty-teaching", label: "Teaching", path: "/admin/faculty/teaching", icon: GraduationCap, permission: "faculty.view" },
  { key: "faculty-nonteaching", label: "Non-Teaching", path: "/admin/faculty/non-teaching", icon: UserCircle, permission: "faculty.view" },
  { key: "div-actions", type: "divider", label: "Actions" },
  { key: "faculty-new", label: "Add Faculty", path: "/admin/faculty/new", icon: UserPlus, permission: "faculty.create" },
  { key: "faculty-bulk", label: "Bulk Upload", path: "/admin/faculty/bulk", icon: Upload, permission: "faculty.create" },
  { key: "faculty-search", label: "Search", path: "/admin/faculty/search", icon: Search, permission: "faculty.view" },
  { key: "faculty-export", label: "Export", path: "/admin/faculty/export", icon: Download, permission: "faculty.export" },
  { key: "div-settings", type: "divider", label: "Settings" },
  { key: "faculty-roles", label: "Role Assignment", path: "/admin/faculty/roles", icon: ShieldCheck, permission: "faculty.manage" },
];

// ─────────────────────────────────────────────────────────────
// TIMETABLE MODULE NAV
// ─────────────────────────────────────────────────────────────
export const TIMETABLE_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-setup", type: "divider", label: "Setup" },
  { key: "tt-hub", label: "Timetable Hub", path: "/admin/timetable", icon: LayoutDashboard, end: true },
  { key: "tt-periods", label: "Period Config", path: "/admin/timetable/periods", icon: Clock, permission: "timetable.manage" },
  { key: "tt-generate", label: "Generate", path: "/admin/timetable/generate", icon: Star, permission: "timetable.manage" },
  { key: "div-views", type: "divider", label: "Views" },
  { key: "tt-sections", label: "Section TT", path: "/admin/timetable/sections", icon: Layers, permission: "timetable.view" },
  { key: "tt-global", label: "Global View", path: "/admin/timetable/global", icon: BarChart2, permission: "timetable.view" },
  { key: "tt-faculty", label: "Faculty View", path: "/admin/timetable/faculty", icon: GraduationCap, permission: "timetable.view" },
  { key: "div-tracking", type: "divider", label: "Tracking" },
  { key: "tt-topics", label: "Topics Taught", path: "/admin/timetable/topics", icon: BookOpen, permission: "timetable.view" },
  { key: "tt-special", label: "Special Sessions", path: "/admin/timetable/special", icon: CalendarDays, permission: "timetable.view" },
  { key: "tt-history", label: "History", path: "/admin/timetable/history", icon: History, permission: "timetable.view" },
  { key: "div-holiday", type: "divider", label: "Calendar" },
  { key: "tt-holidays", label: "Holiday Manager", path: "/admin/holidays", icon: CalendarDays, permission: "timetable.holiday" },
];

// ─────────────────────────────────────────────────────────────
// STUDENT USER NAV (student portal)
// ─────────────────────────────────────────────────────────────
export const STUDENT_NAV = [
  { key: "home", label: "Dashboard", path: "/student", icon: LayoutDashboard, end: true },
  { key: "enrollment", label: "Enrollment", path: "/student/enrollment", icon: ClipboardList },
  { key: "feedback", label: "Feedback", path: "/student/feedback", icon: MessageSquare },
  { key: "settings", label: "Settings", path: "/student/settings", icon: Settings },
];

// Legacy exports for compatibility
export const FACULTY_NAV = ADMIN_NAV;
export const ADMIN_MODULE_NAV = [];
export const STUDENT_MODULE_NAV_LEGACY = STUDENT_MODULE_NAV;

// ─────────────────────────────────────────────────────────────
// DEPARTMENTS MODULE NAV
// ─────────────────────────────────────────────────────────────
export const DEPARTMENTS_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-dept", type: "divider", label: "Departments" },
  { key: "dept-list", label: "All Departments", path: "/admin/departments", icon: Building2, permission: "departments.view", end: true },
  { key: "div-branches", type: "divider", label: "Branches" },
  { key: "branches-list", label: "All Branches", path: "/admin/branches", icon: Layers, permission: "academic.view" },
  { key: "div-univ", type: "divider", label: "Universities" },
  { key: "univ-list", label: "Universities", path: "/admin/universities", icon: Award, permission: "academic.view" },
];

// ─────────────────────────────────────────────────────────────
// PROGRAMS MODULE NAV
// ─────────────────────────────────────────────────────────────
export const PROGRAMS_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-programs", type: "divider", label: "Programs" },
  { key: "programs-list", label: "All Programs", path: "/admin/programs", icon: FileText, permission: "academic.view", end: true },
  { key: "div-academic", type: "divider", label: "Academic" },
  { key: "courses-list", label: "Courses", path: "/admin/courses", icon: BookOpen, permission: "academic.view" },
  { key: "subjects-list", label: "Subjects", path: "/admin/subjects", icon: BookOpen, permission: "curriculum.view" },
  { key: "curriculum-list", label: "Curriculum", path: "/admin/curriculum", icon: Navigation, permission: "curriculum.view" },
];

// ─────────────────────────────────────────────────────────────
// SECTIONS MODULE NAV
// ─────────────────────────────────────────────────────────────
export const SECTIONS_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-sections", type: "divider", label: "Sections" },
  { key: "sections-list", label: "All Sections", path: "/admin/sections", icon: Layers, permission: "academic.view", end: true },
  { key: "sections-history", label: "History", path: "/admin/sections/history", icon: History, permission: "academic.view" },
  { key: "div-enroll", type: "divider", label: "Enrollments" },
  { key: "enrollments", label: "Enrollments", path: "/admin/enrollments", icon: ClipboardList, permission: "academic.view" },
];

// ─────────────────────────────────────────────────────────────
// ATTENDANCE MODULE NAV
// ─────────────────────────────────────────────────────────────
export const ATTENDANCE_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-mark", type: "divider", label: "Mark" },
  { key: "att-faculty", label: "Mark Attendance", path: "/admin/attendance/faculty", icon: CheckSquare, permission: "attendance.manage" },
  { key: "div-view", type: "divider", label: "View" },
  { key: "att-summary", label: "Summary", path: "/admin/attendance/summary", icon: BarChart2, permission: "attendance.view" },
  { key: "att-section", label: "By Section", path: "/admin/attendance/section", icon: Layers, permission: "attendance.view" },
  { key: "att-report", label: "Reports", path: "/admin/attendance/reports", icon: BarChart3, permission: "attendance.report" },
  { key: "div-admin", type: "divider", label: "Admin" },
  { key: "att-freeze", label: "Freeze", path: "/admin/attendance/freeze", icon: Lock, permission: "attendance.freeze" },
  { key: "att-backdate", label: "Backdate", path: "/admin/attendance/backdate", icon: History, rootOnly: true },
];

// ─────────────────────────────────────────────────────────────
// LEAVE MODULE NAV
// ─────────────────────────────────────────────────────────────
export const LEAVE_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-leave", type: "divider", label: "Leave" },
  { key: "leave-apply", label: "Apply Leave", path: "/admin/leave/apply", icon: Clock, permission: "leave.apply" },
  { key: "leave-my", label: "My Applications", path: "/admin/leave", icon: FileText, permission: "leave.view" },
  { key: "div-hod", type: "divider", label: "Approvals" },
  { key: "leave-pending", label: "Pending Approvals", path: "/admin/leave/pending", icon: ClipboardList, permission: "leave.approve" },
  { key: "div-cal", type: "divider", label: "Calendar" },
  { key: "holidays", label: "Holidays", path: "/admin/holidays", icon: CalendarDays, permission: "timetable.holiday" },
  { key: "div-rules", type: "divider", label: "Rules" },
  { key: "leave-types", label: "Leave Types", path: "/admin/leave/types", icon: Settings, permission: "leave.manage" },
];

// ─────────────────────────────────────────────────────────────
// EXAM MODULE NAV
// ─────────────────────────────────────────────────────────────
export const EXAM_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-exam", type: "divider", label: "Exams" },
  { key: "exam-home", label: "Exam Hub", path: "/admin/exam", icon: LayoutDashboard, permission: "exam.view", end: true },
  { key: "exam-datesheet", label: "Datesheet", path: "/admin/exam/datesheet", icon: Calendar, permission: "exam.manage" },
  { key: "exam-seating", label: "Seating Plan", path: "/admin/exam/seating", icon: Users, permission: "exam.manage" },
  { key: "exam-hallticket", label: "Hall Tickets", path: "/admin/exam/hall-tickets", icon: FileText, permission: "exam.manage" },
  { key: "div-marks", type: "divider", label: "Marks" },
  { key: "marks-entry", label: "Enter Marks", path: "/admin/marks", icon: BarChart2, permission: "marks.manage" },
  { key: "marks-view", label: "View Results", path: "/admin/marks/results", icon: BarChart3, permission: "marks.view" },
];

// ─────────────────────────────────────────────────────────────
// FEE MODULE NAV
// ─────────────────────────────────────────────────────────────
export const FEE_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-fee", type: "divider", label: "Fee" },
  { key: "fee-home", label: "Fee Hub", path: "/admin/fee", icon: LayoutDashboard, permission: "fee.view", end: true },
  { key: "fee-collect", label: "Collect Fee", path: "/admin/fee/collect", icon: Banknote, permission: "fee.collect" },
  { key: "fee-structure", label: "Fee Structure", path: "/admin/fee/structure", icon: FileText, permission: "fee.manage" },
  { key: "div-reports", type: "divider", label: "Reports" },
  { key: "fee-report", label: "Fee Reports", path: "/admin/fee/reports", icon: BarChart3, permission: "fee.report" },
  { key: "fee-defaulters", label: "Defaulters", path: "/admin/fee/defaulters", icon: ShieldOff, permission: "fee.view" },
];

// ─────────────────────────────────────────────────────────────
// HR MODULE NAV
// ─────────────────────────────────────────────────────────────
export const HR_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-hr", type: "divider", label: "HR" },
  { key: "hr-home", label: "HR Hub", path: "/admin/hr", icon: LayoutDashboard, permission: "hr.view", end: true },
  { key: "hr-payroll", label: "Payroll", path: "/admin/hr/payroll", icon: Banknote, permission: "hr.manage" },
  { key: "hr-slips", label: "Salary Slips", path: "/admin/hr/slips", icon: FileText, permission: "hr.view" },
  { key: "div-attendance", type: "divider", label: "Attendance" },
  { key: "hr-attendance", label: "Biometric", path: "/admin/hr/attendance", icon: CheckSquare, permission: "hr.view" },
  { key: "hr-leave", label: "Leave Rules", path: "/admin/hr/leave", icon: Clock, permission: "hr.manage" },
];

// ─────────────────────────────────────────────────────────────
// ASSIGNMENT MODULE NAV
// ─────────────────────────────────────────────────────────────
export const ASSIGNMENT_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-assign", type: "divider", label: "Assignments" },
  { key: "assign-home", label: "All Assignments", path: "/admin/assignments", icon: ClipboardList, permission: "assignments.view", end: true },
  { key: "assign-create", label: "Create", path: "/admin/assignments/new", icon: Plus, permission: "assignments.create" },
  { key: "div-grade", type: "divider", label: "Grading" },
  { key: "assign-grade", label: "Grade Submissions", path: "/admin/assignments/grade", icon: Award, permission: "assignments.grade" },
];

// ─────────────────────────────────────────────────────────────
// TRAINING MODULE NAV
// ─────────────────────────────────────────────────────────────
export const TRAINING_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-training", type: "divider", label: "Training" },
  { key: "training-home", label: "Training Hub", path: "/admin/training", icon: LayoutDashboard, end: true },
  { key: "training-sessions", label: "Sessions", path: "/admin/training/sessions", icon: CalendarDays },
];

// ─────────────────────────────────────────────────────────────
// SKILL CARD MODULE NAV
// ─────────────────────────────────────────────────────────────
export const SKILLCARD_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-skill", type: "divider", label: "Skill Cards" },
  { key: "skill-home", label: "Skill Cards", path: "/admin/skill-card", icon: Award, end: true },
  { key: "skill-mentors", label: "Mentors", path: "/admin/skill-card/mentors", icon: Users },
];

// ─────────────────────────────────────────────────────────────
// STUDENT LEAVE MODULE NAV
// ─────────────────────────────────────────────────────────────
export const STUDENT_LEAVE_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-leave", type: "divider", label: "Student Leave" },
  { key: "sl-home", label: "Applications", path: "/admin/student-leave", icon: ClipboardList },
  { key: "sl-approve", label: "Pending", path: "/admin/student-leave/pending", icon: Clock },
];

// ─────────────────────────────────────────────────────────────
// FEEDBACK MODULE NAV
// ─────────────────────────────────────────────────────────────
export const FEEDBACK_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-forms", type: "divider", label: "Forms" },
  { key: "fb-forms", label: "Forms", path: "/admin/feedback/forms", icon: ClipboardList, permission: "feedback.view" },
  { key: "fb-questions", label: "Questions", path: "/admin/feedback/questions", icon: MessageSquare, permission: "feedback.view" },
  { key: "fb-categories", label: "Categories", path: "/admin/feedback/categories", icon: Layers, permission: "feedback.view" },
  { key: "div-results", type: "divider", label: "Results" },
  { key: "fb-results", label: "Results", path: "/admin/feedback/results", icon: BarChart3, permission: "feedback.results" },
  { key: "fb-teaching", label: "Teaching Report", path: "/admin/feedback/teaching", icon: GraduationCap, permission: "feedback.results" },
];

// ─────────────────────────────────────────────────────────────
// GROUPS MODULE NAV
// ─────────────────────────────────────────────────────────────
export const GROUPS_MODULE_NAV = [
  { key: "back", label: "← Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { key: "div-groups", type: "divider", label: "Groups" },
  { key: "groups-home", label: "All Groups", path: "/admin/groups", icon: Users, end: true },
  { key: "groups-special", label: "Special Groups", path: "/admin/groups/special", icon: Star },
];