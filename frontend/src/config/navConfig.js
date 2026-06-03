// src/config/nav.config.js
// ─────────────────────────
// Single source of truth for sidebar navigation.
// permission keys MUST match permissions.config.js exactly.
// ─────────────────────────
import {
    LayoutDashboard, Users, GraduationCap, Building2,
    BookOpen, Library, Layers, MessageSquareText,
    ClipboardList, BarChart3, Shield, BookMarked,
    ClipboardCheck, UserCircle, Activity, Compass,
    ShieldPlus, UsersRound,
} from "lucide-react";

// ── Grouped nav for accordion sidebar ────────────────────────
export const ADMIN_NAV = [
    {
        key: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        items: [
            { key: "dashboard", label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
            { key: "audit", label: "Audit Trail", path: "/admin/audit", icon: Shield, permission: "audit.view" },
            { key: "roles", label: "Role Manager", path: "/admin/roles", icon: ShieldPlus, superOnly: true },
        ],
    },
    {
        key: "people",
        label: "People",
        icon: Users,
        items: [
            { key: "students", label: "Students", path: "/admin/students", icon: Users, permission: "students.view" },
            { key: "faculty", label: "Faculty", path: "/admin/faculty", icon: GraduationCap, permission: "faculty.view" },
            { key: "admins", label: "Admins", path: "/admin/admins", icon: UserCircle, permission: "admins.view" },
            { key: "groups", label: "Groups", path: "/admin/groups", icon: UsersRound, permission: "groups.view" },
        ],
    },
    {
        key: "academic",
        label: "Academic",
        icon: Building2,
        items: [
            { key: "departments", label: "Departments", path: "/admin/departments", icon: Building2, permission: "academic.view" },
            { key: "programs", label: "Programs", path: "/admin/programs", icon: BookMarked, permission: "academic.view" },
            { key: "courses", label: "Courses", path: "/admin/courses", icon: BookOpen, permission: "academic.view" },
            { key: "subjects", label: "Subjects", path: "/admin/subjects", icon: Library, permission: "subjects.view" },
            { key: "sections", label: "Sections", path: "/admin/sections", icon: Layers, permission: "sections.view" },
            { key: "enrollments", label: "Enrollments", path: "/admin/enrollments", icon: ClipboardCheck, permission: "enrollments.view" },
            { key: "curriculum", label: "Curriculum", path: "/admin/curriculum", icon: Compass, permission: "curriculum.view" },
        ],
    },
    {
        key: "feedback",
        label: "Feedback",
        icon: MessageSquareText,
        items: [
            { key: "fb-forms", label: "Forms", path: "/admin/feedback/forms", icon: ClipboardList, permission: "feedback.view" },
            { key: "fb-results", label: "Results", path: "/admin/feedback/results", icon: BarChart3, permission: "feedback.results" },
            { key: "fb-teaching", label: "Teaching Report", path: "/admin/feedback/teaching", icon: Activity, permission: "feedback.results" },
            { key: "fb-cats", label: "Categories", path: "/admin/feedback/categories", icon: MessageSquareText, permission: "feedback.view" },
            { key: "fb-questions", label: "Questions", path: "/admin/feedback/questions", icon: ClipboardList, permission: "feedback.view" },
        ],
    },
    {
        key: "reports",
        label: "Reports",
        icon: BarChart3,
        items: [
            { key: "rpt-students", label: "Student Report", path: "/admin/reports/students", icon: Users, permission: "reports.students" },
            { key: "rpt-faculty", label: "Faculty Report", path: "/admin/reports/faculty", icon: GraduationCap, permission: "reports.faculty" },
            { key: "rpt-enrollments", label: "Enrollment Report", path: "/admin/reports/enrollments", icon: ClipboardCheck, permission: "reports.enrollments" },
        ],
    },
];

// ── Faculty nav ───────────────────────────────────────────────
export const FACULTY_NAV = [
    { key: "home", label: "Dashboard", path: "/faculty", icon: LayoutDashboard, end: true },
    { key: "feedback", label: "Feedback Results", path: "/faculty/feedback", icon: BarChart3 },
    { key: "settings", label: "Settings", path: "/faculty/settings", icon: UserCircle },
];

// ── Student nav ───────────────────────────────────────────────
export const STUDENT_NAV = [
    { key: "home", label: "Dashboard", path: "/student", icon: LayoutDashboard, end: true },
    { key: "enrollment", label: "Enrollment", path: "/student/enrollment", icon: ClipboardCheck },
    { key: "feedback", label: "Feedback", path: "/student/feedback", icon: MessageSquareText },
    { key: "settings", label: "Settings", path: "/student/settings", icon: UserCircle },
];