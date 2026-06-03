// frontend/src/router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RoleGuard, PublicRoute, ProtectedRoute, getRoleHome } from "./components/auth/RoleGuard.jsx";
import { useSelector } from "react-redux";

// ── Layouts ────────────────────────────────────────────────────
import AdminLayout from "./layout/adminLayout.jsx";
import FacultyLayout from "./layout/facultyLayout.jsx";
import StudentLayout from "./layout/studentLayout.jsx";

// ── Auth ───────────────────────────────────────────────────────
import LoginPage from "./pages/auth/Login.jsx";

// ── Admin pages ────────────────────────────────────────────────
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import StudentsPage from "./pages/admin/people/StudentsPage.jsx";
import FacultyPage from "./pages/admin/people/FacultyPage.jsx";

// academic pages
import DepartmentsPage from "./pages/admin/academics/DepartmentsPage.jsx";
import ProgramsPage from "./pages/admin/academics/ProgramsPage.jsx";
import CoursesPage from "./pages/admin/academics/CoursesPage.jsx";
import SubjectsPage from "./pages/admin/academics/SubjectsPage.jsx";
import SectionsPage from "./pages/admin/academics/SectionsPage.jsx";
import EnrollmentPage from "./pages/admin/academics/EnrollmentPage.jsx";
import CurriculumPage from "./pages/admin/academics/Curriculumpage.jsx";

import AdminsPage from "./pages/admin/people/AdminsPage.jsx";
import SpecialGroupsPage from "./pages/admin/people/SpecialGroupsPage.jsx";
import SettingsPage from "./pages/admin/SettingsPage.jsx";
import AuditTrailPage from "./pages/admin/AuditTrailPage.jsx";
import RoleManagementPage from "./pages/admin/RoleManagementPage.jsx";

// feedback pages
import FeedbackCategoriesPage from "./pages/admin/feedback/FeedbackCategoriesPage.jsx";
import FeedbackQuestionsPage from "./pages/admin/feedback/FeedbackQuestionsPage.jsx";
import FeedbackFormsPage from "./pages/admin/feedback/FeedbackFormsPage.jsx";
import FeedbackResultsPage from "./pages/admin/feedback/FeedbackResultsPage.jsx";
import FeedbackTeachingReportPage from "./pages/admin/feedback/FeedbackTeachingReportPage.jsx";

// ── Faculty pages ──────────────────────────────────────────────
import FacultyDashboard from "./pages/faculty/FacultyDashboard.jsx";
import FacultyFeedbackPage from "./pages/faculty/FacultyFeedbackPage.jsx";

// ── Student pages ──────────────────────────────────────────────
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentFeedbackPage from "./pages/student/StudentFeedbackPage.jsx";
import StudentEnrollmentPage from "./pages/student/StudentEnrollmentPage.jsx";

// ── Root redirect ──────────────────────────────────────────────
function RootRedirect() {
    const { user, initialized } = useSelector((s) => s.auth ?? {});
    if (!initialized) return null;
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={getRoleHome(user.role)} replace />;
}

export const router = createBrowserRouter([

    // ── Root ────────────────────────────────────────────────────
    { path: "/", element: <RootRedirect /> },

    // ── Public ──────────────────────────────────────────────────
    {
        path: "/login",
        element: <PublicRoute><LoginPage /></PublicRoute>,
    },

    // ── Admin & Super Admin ─────────────────────────────────────
    {
        path: "/admin",
        element: <RoleGuard roles={["ADMIN", "SUPER_ADMIN"]}><AdminLayout /></RoleGuard>,
        children: [
            { index: true, element: <AdminDashboard /> },

            // Overview
            { path: "audit", element: <AuditTrailPage /> },
            { path: "roles", element: <RoleManagementPage /> },

            // People
            { path: "students", element: <StudentsPage /> },
            { path: "faculty", element: <FacultyPage /> },
            { path: "admins", element: <AdminsPage /> },
            { path: "groups", element: <SpecialGroupsPage /> },

            // Academic
            { path: "departments", element: <DepartmentsPage /> },
            { path: "programs", element: <ProgramsPage /> },
            { path: "courses", element: <CoursesPage /> },
            { path: "subjects", element: <SubjectsPage /> },
            { path: "sections", element: <SectionsPage /> },
            { path: "enrollments", element: <EnrollmentPage /> },
            { path: "curriculum", element: <CurriculumPage /> },

            // Feedback
            { path: "feedback/categories", element: <FeedbackCategoriesPage /> },
            { path: "feedback/questions", element: <FeedbackQuestionsPage /> },
            { path: "feedback/forms", element: <FeedbackFormsPage /> },
            { path: "feedback/results", element: <FeedbackResultsPage /> },
            { path: "feedback/results/:form_id", element: <FeedbackResultsPage /> },
            { path: "feedback/teaching", element: <FeedbackTeachingReportPage /> },

            // Settings
            {
                path: "settings",
                element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
            },
        ],
    },

    // ── Faculty ─────────────────────────────────────────────────
    {
        path: "/faculty",
        element: <RoleGuard roles={["FACULTY"]}><FacultyLayout /></RoleGuard>,
        children: [
            { index: true, element: <FacultyDashboard /> },
            { path: "feedback", element: <FacultyFeedbackPage /> },
            {
                path: "settings",
                element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
            },
        ],
    },

    // ── Student ─────────────────────────────────────────────────
    {
        path: "/student",
        element: <RoleGuard roles={["STUDENT"]}><StudentLayout /></RoleGuard>,
        children: [
            { index: true, element: <StudentDashboard /> },
            { path: "feedback", element: <StudentFeedbackPage /> },
            { path: "enrollment", element: <StudentEnrollmentPage /> },
            {
                path: "settings",
                element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
            },
        ],
    },

    // ── 404 ─────────────────────────────────────────────────────
    { path: "*", element: <Navigate to="/" replace /> },
]);