// src/router.jsx — COMPLETE (all pages mapped to adminss/ structure)
// ── Final batch pages ─────────────────────────────────────────
import ExamListPage from "./modules/adminss/exam/pages/ExamListPage.jsx";
import ExamDatesheetPage from "./modules/adminss/exam/pages/ExamDatesheetPage.jsx";
import ExamSeatingPage from "./modules/adminss/exam/pages/ExamSeatingPage.jsx";
import ExamTicketsPage from "./modules/adminss/exam/pages/ExamTicketsPage.jsx";
import ExamResultsPage from "./modules/adminss/exam/pages/ExamResultsPage.jsx";
import AssignmentListPage from "./modules/adminss/assignment/pages/AssignmentListPage.jsx";
import AssignmentReportPage from "./modules/adminss/assignment/pages/AssignmentReportPage.jsx";
import SkillCardInitPage from "./modules/adminss/skillcard/pages/SkillCardInitPage.jsx";
import SkillCardReportPage from "./modules/adminss/skillcard/pages/SkillCardReportPage.jsx";
import StudentLeaveApprovalPage from "./modules/adminss/leave/pages/StudentLeaveApprovalPage.jsx";
import HRAttendancePage from "./modules/adminss/hr/pages/HRAttendancePage.jsx";
import HRReportPage from "./modules/adminss/hr/pages/HRReportPage.jsx";
import HRLeaveRulesPage from "./modules/adminss/hr/pages/HRLeaveRulesPage.jsx";
import SalaryCyclePage from "./modules/adminss/hr/pages/SalaryCyclePage.jsx";
import FacultyLeaveApplyPage from "./modules/adminss/faculty/pages/FacultyLeaveApplyPage.jsx";


// ── Phase 2+3 All Pages ─────────────────────────────────────────
import AssignmentCreatePage from "./modules/adminss/assignment/pages/AssignmentCreatePage.jsx";
import AssignmentDetailPage from "./modules/adminss/assignment/pages/AssignmentDetailPage.jsx";
import AssignmentHubPage from "./modules/adminss/assignment/pages/AssignmentHubPage.jsx";
import AttendanceFreezePage from "./modules/adminss/attendance/pages/AttendanceFreezePage.jsx";
import BiometricImportPage from "./modules/adminss/hr/pages/BiometricImportPage.jsx";
import ExamCreatePage from "./modules/adminss/exam/pages/ExamCreatePage.jsx";
import ExamDetailPage from "./modules/adminss/exam/pages/ExamDetailPage.jsx";
import ExamHallTicketPage from "./modules/adminss/exam/pages/ExamHallTicketPage.jsx";
import ExamHubPage from "./modules/adminss/exam/pages/ExamHubPage.jsx";
import ExamMarksPage from "./modules/adminss/exam/pages/ExamMarksPage.jsx";
import ExamReportPage from "./modules/adminss/exam/pages/ExamReportPage.jsx";
import ExtraAttendancePage from "./modules/adminss/attendance/pages/ExtraAttendancePage.jsx";
import FacultyBulkOpsPage from "./modules/adminss/faculty/pages/FacultyBulkOpsPage.jsx";
import FeeHubPage from "./modules/adminss/fee/pages/FeeHubPage.jsx";
import FeeReportPage from "./modules/adminss/fee/pages/FeeReportPage.jsx";
import FeeScholarshipPage from "./modules/adminss/fee/pages/FeeScholarshipPage.jsx";
import FeeStructurePage from "./modules/adminss/fee/pages/FeeStructurePage.jsx";
import FeeStudentDetailPage from "./modules/adminss/fee/pages/FeeStudentDetailPage.jsx";
import FeeStudentsPage from "./modules/adminss/fee/pages/FeeStudentsPage.jsx";
import HRHubPage from "./modules/adminss/hr/pages/HRHubPage.jsx";
import MarksSubjectViewPage from "./modules/adminss/marks/pages/MarksSubjectViewPage.jsx";
import MentorDetailPage from "./modules/adminss/training/pages/MentorDetailPage.jsx";
import MentorListPage from "./modules/adminss/training/pages/MentorListPage.jsx";
import SalaryApprovePage from "./modules/adminss/hr/pages/SalaryApprovePage.jsx";
import SalaryComponentPage from "./modules/adminss/hr/pages/SalaryComponentPage.jsx";
import SalaryGeneratePage from "./modules/adminss/hr/pages/SalaryGeneratePage.jsx";
import SalarySlipDetailPage from "./modules/adminss/hr/pages/SalarySlipDetailPage.jsx";
import SalarySlipListPage from "./modules/adminss/hr/pages/SalarySlipListPage.jsx";
import SkillCardBulkPage from "./modules/adminss/skillcard/pages/SkillCardBulkPage.jsx";
import SkillCardHubPage from "./modules/adminss/skillcard/pages/SkillCardHubPage.jsx";
import SkillCardMentorPage from "./modules/adminss/skillcard/pages/SkillCardMentorPage.jsx";
import SkillCardStudentPage from "./modules/adminss/skillcard/pages/SkillCardStudentPage.jsx";
import StudentIdCardPage from "./modules/adminss/student/pages/StudentIdCardPage.jsx";
import StudentLeaveApplyPage from "./modules/student/pages/StudentLeaveApplyPage.jsx";
import StudentLeaveDetailPage from "./modules/adminss/leave/pages/StudentLeaveDetailPage.jsx";
import StudentLeaveHubPage from "./modules/adminss/leave/pages/StudentLeaveHubPage.jsx";
import StudentLeaveListPage from "./modules/adminss/leave/pages/StudentLeaveListPage.jsx";
import TimetablePrintPage from "./modules/adminss/timetable/pages/TimetablePrintPage.jsx";
import TrainingAttendancePage from "./modules/adminss/training/pages/TrainingAttendancePage.jsx";
import TrainingCreatePage from "./modules/adminss/training/pages/TrainingCreatePage.jsx";
import TrainingDetailPage from "./modules/adminss/training/pages/TrainingDetailPage.jsx";
import TrainingEnrollPage from "./modules/adminss/training/pages/TrainingEnrollPage.jsx";
import TrainingHubPage from "./modules/adminss/training/pages/TrainingHubPage.jsx";
import TrainingReportPage from "./modules/adminss/training/pages/TrainingReportPage.jsx";
import TrainingSummaryReportPage from "./modules/adminss/training/pages/TrainingSummaryReportPage.jsx";
import WeekTimetablePage from "./modules/adminss/timetable/pages/WeekTimetablePage.jsx";

import { createBrowserRouter, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import RoleGuard, {
  PublicRoute, ProtectedRoute,
  getEffectiveHome, getUserRoles,
  ADMIN_LAYOUT_ROLES,
} from "./components/shared/RoleGuard.jsx";
import RootGuard from "./components/shared/RootGuard.jsx";

import AdminLayout from "./layouts/AdminLayout.jsx";
import StudentLayout from "./layouts/StudentLayout.jsx";

// ── Auth ──────────────────────────────────────────────────────
import LoginPage from "./modules/adminss/auth/pages/Login.jsx";
import RolePickerPage from "./modules/adminss/auth/pages/RolePicker.jsx";
import ForgotPasswordPage from "./modules/adminss/auth/pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./modules/adminss/auth/pages/ResetPasswordPage.jsx";

// ── Admin / Dashboard ─────────────────────────────────────────
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
import { PermGuard } from "./components/shared/PermGuard.jsx";
import AdminDashboardPage from "./modules/adminss/admin/pages/AdminDashboard.jsx";

// ── Settings ──────────────────────────────────────────────────
import MySessionsPage from "./modules/adminss/settings/pages/MySessionsPage.jsx";
import SettingsPage from "./modules/adminss/settings/pages/SettingsPage.jsx";
import ErpSettingsPage from "./modules/adminss/settings/pages/ErpSettingsPage.jsx";

// ── Personal (NEW) ────────────────────────────────────────────
import MyWorkspacePage from "./modules/adminss/personal/pages/MyWorkspacePage.jsx";
import MyProfilePage from "./modules/adminss/personal/pages/MyProfilePage.jsx";

// ── Super Admins ──────────────────────────────────────────────
import SuperAdminManagementPage from "./modules/adminss/admin/pages/SuperAdminManagementPage.jsx";
import SuperAdminHubPage from "./modules/adminss/superadmin/pages/SuperAdminHubPage.jsx";
import SuperAdminNewPage from "./modules/adminss/superadmin/pages/SuperAdminNewPage.jsx";
import SuperAdminListPage from "./modules/adminss/superadmin/pages/SuperAdminListPage.jsx";
import SuperAdminDetailPage from "./modules/adminss/superadmin/pages/SuperAdminDetailPage.jsx";
import SuperAdminEditPage from "./modules/adminss/superadmin/pages/SuperAdminEditPage.jsx";
import SuperAdminActivityPage from "./modules/adminss/superadmin/pages/SuperAdminActivityPage.jsx";
import SuperAdminHistoryPage from "./modules/adminss/superadmin/pages/SuperAdminHistoryPage.jsx";

// ── Students ──────────────────────────────────────────────────
import StudentHubPage from "./modules/adminss/student/pages/StudentHubPage.jsx";
import StudentsListPage from "./modules/adminss/student/pages/StudentsListPage.jsx";
import StudentsAllPage from "./modules/adminss/student/pages/StudentsAllPage.jsx";
import StudentCreatePage from "./modules/adminss/student/pages/StudentCreatePage.jsx";
import StudentDetailPage from "./modules/adminss/student/pages/StudentDetailPage.jsx";
import StudentEditPage from "./modules/adminss/student/pages/StudentEditPage.jsx";
import StudentSearchPage from "./modules/adminss/student/pages/StudentSearchPage.jsx";
import StudentBulkPage from "./modules/adminss/student/pages/StudentBulkPage.jsx";
import StudentBulkStatusPage from "./modules/adminss/student/pages/StudentBulkStatusPage.jsx";
import StudentBulkOpsPage from "./modules/adminss/student/pages/StudentBulkOpsPage.jsx";
import StudentExportPage from "./modules/adminss/student/pages/StudentExportPage.jsx";
import StudentAnalyticsPage from "./modules/adminss/student/pages/StudentAnalyticsPage.jsx";
import SpecialGroupsPage from "./modules/adminss/student/pages/SpecialGroupsPage.jsx";
import StudentSectionHistoryPage from "./modules/adminss/student/pages/StudentSectionHistoryPage.jsx";
import {
  ActiveStudentsPage, DetainedStudentsPage,
  PassedStudentsPage, PreviousBatchesPage,
} from "./modules/adminss/student/pages/StudentStatusPage.jsx";
import {
  StudentAttendancePage as StudentAttendanceAdminPage,
  StudentFeesPage,
} from "./modules/adminss/student/pages/StudentComingSoonPage.jsx";
import StudentDashboardPage from "./modules/adminss/student/pages/StudentDashboardPage.jsx";
import StudentEnrollmentPage from "./modules/adminss/student/pages/StudentEnrollmentPage.jsx";
import StudentGroups from "./modules/adminss/studentPortal/pages/StudentGroups.jsx";
const OnHoldStudentsPage = () => <StudentsListPage filter="ON_HOLD" />;
const LeftStudentsPage = () => <StudentsListPage filter="LEFT" />;
const SuspendedStudentsPage = () => <StudentsListPage filter="SUSPENDED" />;

// ── Faculty ───────────────────────────────────────────────────
import FacultyHubPage from "./modules/adminss/faculty/pages/FacultyHubPage.jsx";
import FacultyListPage from "./modules/adminss/faculty/pages/FacultyListPage.jsx";
import FacultyCreatePage from "./modules/adminss/faculty/pages/FacultyCreatePage.jsx";
import FacultyDetailPage from "./modules/adminss/faculty/pages/FacultyDetailPage.jsx";
import FacultyEditPage from "./modules/adminss/faculty/pages/FacultyEditPage.jsx";
import FacultySearchPage from "./modules/adminss/faculty/pages/FacultySearchPage.jsx";
import FacultyBulkPage from "./modules/adminss/faculty/pages/FacultyBulkPage.jsx";
import FacultyExportPage from "./modules/adminss/faculty/pages/FacultyExportPage.jsx";
import FacultyAnalyticsPage from "./modules/adminss/faculty/pages/FacultyAnalyticsPage.jsx";
import FacultyIdCardPage from "./modules/adminss/faculty/pages/FacultyIdCardPage.jsx";
import FacultyDashboardPage from "./modules/adminss/faculty/pages/FacultyDashboardPage.jsx";
import FacultyCareerPage from "./modules/adminss/faculty/pages/FacultyCareerPage.jsx";
import FacultyLeavePage from "./modules/adminss/faculty/pages/FacultyLeavePage.jsx";
import SubjectPreferencePage from "./modules/adminss/faculty/pages/SubjectPreferencePage.jsx";

// ── Admins ────────────────────────────────────────────────────
import AdminHubPage from "./modules/adminss/admin/pages/AdminHubPages.jsx";
import AdminsListPage from "./modules/adminss/admin/pages/AdminsListPage.jsx";
import AdminCreatePage from "./modules/adminss/admin/pages/AdminCreatePage.jsx";
import AdminDetailPage from "./modules/adminss/admin/pages/AdminDetailPage.jsx";
import AdminEditPage from "./modules/adminss/admin/pages/AdminEditPage.jsx";
import PermissionManagerPage from "./modules/adminss/role/pages/PermissionManagerPage.jsx";
import AdminActivityPage from "./modules/adminss/admin/pages/AdminActivityPage.jsx";

// ── Academic ──────────────────────────────────────────────────
import AcademicHubPage from "./modules/adminss/academics/pages/AcademicHubPage.jsx";
import AcademicCalendarPage from "./modules/adminss/academics/pages/AcademicCalendarPage.jsx";
import AcademicStructurePage from "./modules/adminss/shared/pages/AcademicStructurePage.jsx";

// ── Sessions ──────────────────────────────────────────────────
import SessionsPage from "./modules/adminss/session/pages/SessionPage.jsx";

// ── Departments ───────────────────────────────────────────────
import DepartmentHubPage from "./modules/adminss/department/pages/DepartmentHubPage.jsx";
import DepartmentsPage from "./modules/adminss/department/pages/DepartmentsPage.jsx";
import DepartmentCreatePage from "./modules/adminss/department/pages/DepartmentCreatePage.jsx";
import DepartmentDetailPage from "./modules/adminss/department/pages/DepartmentDetailPage.jsx";
import DepartmentEditPage from "./modules/adminss/department/pages/DepartmentEditPage.jsx";
import DepartmentBulkPage from "./modules/adminss/department/pages/DepartmentBulkPage.jsx";

// ── Programs ──────────────────────────────────────────────────
import ProgramHubPage from "./modules/adminss/programs/pages/ProgramHubPage.jsx";
import ProgramsPage from "./modules/adminss/programs/pages/ProgramsPage.jsx";
import ProgramCreatePage from "./modules/adminss/programs/pages/ProgramCreatePage.jsx";
import ProgramDetailPage from "./modules/adminss/programs/pages/ProgramDetailPage.jsx";
import ProgramEditPage from "./modules/adminss/programs/pages/ProgramEditPage.jsx";
import ProgramBulkPage from "./modules/adminss/programs/pages/ProgramBulkPage.jsx";

// ── Branches ──────────────────────────────────────────────────
import BranchPage from "./modules/adminss/branch/pages/BranchPage.jsx";
import BranchHubPage from "./modules/adminss/branch/pages/BranchHubPage.jsx";
import BranchListPage from "./modules/adminss/branch/pages/BranchListPage.jsx";
import BranchCreatePage from "./modules/adminss/branch/pages/BranchCreatePage.jsx";
import BranchDetailPage from "./modules/adminss/branch/pages/BranchDetailPage.jsx";
import BranchEditPage from "./modules/adminss/branch/pages/BranchEditPage.jsx";
import BranchBulkPage from "./modules/adminss/branch/pages/BranchBulkPage.jsx";
import BranchDiscontinuationPage from "./modules/adminss/branch/pages/BranchDiscontinuationPage.jsx";

// ── Courses ───────────────────────────────────────────────────
import CourseHubPage from "./modules/adminss/course/pages/CourseHubPage.jsx";
import CoursesPage from "./modules/adminss/course/pages/CoursesPage.jsx";
import CourseCreatePage from "./modules/adminss/course/pages/CourseCreatePage.jsx";
import CourseDetailPage from "./modules/adminss/course/pages/CourseDetailPage.jsx";
import CourseEditPage from "./modules/adminss/course/pages/CourseEditPage.jsx";

// ── Subjects ──────────────────────────────────────────────────
import SubjectHubPage from "./modules/adminss/subject/pages/SubjectHubPage.jsx";
import SubjectsPage from "./modules/adminss/subject/pages/SubjectsPage.jsx";

// ── Sections ──────────────────────────────────────────────────
import SectionsHubPage from "./modules/adminss/section/pages/SectionsHubPage.jsx";
import SectionsPage from "./modules/adminss/section/pages/SectionsPage.jsx";
import SectionCreatePage from "./modules/adminss/section/pages/SectionCreatePage.jsx";
import SectionDetailPage from "./modules/adminss/section/pages/SectionDetailPage.jsx";
import SectionEditPage from "./modules/adminss/section/pages/SectionEditPage.jsx";
import SectionHistoryPage from "./modules/adminss/section/pages/SectionHistorypage.jsx";
import SectionBulkPage from "./modules/adminss/section/pages/SectionBulkPage.jsx";
import SectionBulkPromotePage from "./modules/adminss/section/pages/SectionBulkPromotePage.jsx";
import SectionStudentsPage from "./modules/adminss/section/pages/SectionStudentsPage.jsx";
import SectionTransferPage from "./modules/adminss/section/pages/SectionTransferPage.jsx";
import SectionGraduatePage from "./modules/adminss/section/pages/SectionGraduatePage.jsx";

// ── Timetable ─────────────────────────────────────────────────
import TimetableHubPage from "./modules/adminss/timetable/pages/TimetableHubPage.jsx";
import PeriodConfigPage from "./modules/adminss/timetable/pages/PeriodConfigPage.jsx";
import WorkloadPage from "./modules/adminss/timetable/pages/WorkloadPage.jsx";
import GeneratePage from "./modules/adminss/timetable/pages/GeneratePage.jsx";
import SectionTimetablePage from "./modules/adminss/timetable/pages/SectionTimetablePage.jsx";
import GlobalTimetablePage from "./modules/adminss/timetable/pages/GlobalTimetablePage.jsx";
import FacultyTimetablePage from "./modules/adminss/timetable/pages/FacultyTimetablePage.jsx";
import CourseStructurePage from "./modules/adminss/timetable/pages/CourseStructurePage.jsx";
import TopicsTaughtPage from "./modules/adminss/timetable/pages/TopicsTaughtPage.jsx";
import SpecialSessionsPage from "./modules/adminss/timetable/pages/SpecialSessionsPage.jsx";
import DailyReportsPage from "./modules/adminss/timetable/pages/DailyReportsPage.jsx";
import TimetableHistoryPage from "./modules/adminss/timetable/pages/TimetableHistoryPage.jsx";

// ── Rooms ─────────────────────────────────────────────────────
import RoomsPage from "./modules/adminss/rooms/pages/RoomPage.jsx";

// ── Curriculum ────────────────────────────────────────────────
import CurriculumHubPage from "./modules/adminss/curriculum/pages/CurriculumHubPage.jsx";
import CurriculumPage from "./modules/adminss/curriculum/pages/Curriculumpage.jsx";

// ── Enrollments ───────────────────────────────────────────────
import EnrollmentPage from "./modules/adminss/enrollment/pages/EnrollmentPage.jsx";

// ── Groups ────────────────────────────────────────────────────
import GroupsHubPage from "./modules/adminss/groups/pages/GroupsHubPage.jsx";
import FacultyGroupsPage from "./modules/adminss/groups/pages/FacultyGroupsPage.jsx";
import GroupListPage from "./modules/adminss/groups/pages/GroupListPage.jsx";
import GroupDetailPage from "./modules/adminss/groups/pages/GroupDetailPage.jsx";
import GroupNewPage from "./modules/adminss/groups/pages/GroupNewPage.jsx";
import GroupEditPage from "./modules/adminss/groups/pages/GroupEditPage.jsx";

// ── Leave ─────────────────────────────────────────────────────
import LeaveHubPage from "./modules/adminss/leave/pages/LeaveHubPage.jsx";
import LeaveListPage from "./modules/adminss/leave/pages/LeaveListPage.jsx";
import LeaveDetailPage from "./modules/adminss/leave/pages/LeaveDetailPage.jsx";
import LeaveSubmitPage from "./modules/adminss/leave/pages/LeaveSubmitPage.jsx";
import LeaveApprovalFlowPage from "./modules/adminss/leave/pages/LeaveApprovalFlowPage.jsx";
import LeaveTypesPage from "./modules/adminss/leave/pages/LeaveTypesPage.jsx";

// ── Holidays & Leave Rules (NEW) ──────────────────────────────
import HolidayPage from "./modules/adminss/holiday/pages/HolidayPage.jsx";
import LeaveRulesPage from "./modules/adminss/holiday/pages/LeaveRulesPage.jsx";

// ── Attendance (NEW) ──────────────────────────────────────────
import AttendanceHubPage from "./modules/adminss/attendance/pages/AttendanceHubPage.jsx";
import AttendancePage from "./modules/adminss/attendance/pages/AttendancePage.jsx";

// ── Marks (NEW) ───────────────────────────────────────────────
import MarksPage from "./modules/adminss/marks/pages/MarksPage.jsx";

// ── Feedback ──────────────────────────────────────────────────
import FeedbackFormsPage from "./modules/adminss/feedback/pages/FeedbackFormsPage.jsx";
import FeedbackResultsPage from "./modules/adminss/feedback/pages/FeedbackResultsPage.jsx";
import FeedbackTeachingPage from "./modules/adminss/feedback/pages/FeedbackTeachingReportPage.jsx";
import FeedbackCategoriesPage from "./modules/adminss/feedback/pages/FeedbackCategoriesPage.jsx";
import FeedbackQuestionsPage from "./modules/adminss/feedback/pages/FeedbackQuestionsPage.jsx";
import StudentFeedbackPage from "./modules/adminss/feedback/pages/StudentFeedbackPage.jsx";
import FacultyFeedbackPage from "./modules/adminss/feedback/pages/FacultyFeedbackPage.jsx";
import FeedbackAdminPage from "./modules/adminss/feedback/pages/Feedbackadminpage.jsx";

// ── Roles & RBAC ──────────────────────────────────────────────

// ── Bulk ops ──────────────────────────────────────────────────
import BulkHubPage from "./modules/adminss/bulk/pages/BulkHubPage.jsx";

// ── UI Permissions ────────────────────────────────────────────
import UIPermissionsPage from "./modules/adminss/uiPerms/pages/UIPermissionsPage.jsx";

// ── History pages (shared) ────────────────────────────────────
import {
  DepartmentHistoryPage,
  ProgramHistoryPage,
  CourseHistoryPage,
  SubjectHistoryPage,
  SessionHistoryPage,
  CurriculumHistoryPage,
  EnrollmentHistoryPage,
} from "./modules/adminss/shared/pages/ModuleHistoryPages.jsx";

// ── Audit / Reports ───────────────────────────────────────────
import AuditPage from "./modules/adminss/audit/pages/AuditPage.jsx";
import ReportsPage from "./modules/adminss/report/pages/ReportsPage.jsx";

// ── Faculty portal pages ──────────────────────────────────────
import FacultyPortalDashboard from "./modules/faculty/pages/FacultyDashboard.jsx";
import FacultyTimetable from "./modules/faculty/pages/FacultyTimetable.jsx";
import FacultyAttendancePage from "./modules/faculty/pages/FacultyAttendancePage.jsx";
import FacultyMyLeave from "./modules/faculty/pages/FacultyMyLeave.jsx";

// ── Student portal pages ──────────────────────────────────────
import StudentPortalDash from "./modules/student/pages/StudentDashboard.jsx";
import StudentPortalAttend from "./modules/student/pages/StudentAttendancePage.jsx";

function RootRedirect() {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return null;
  if (!user) return <Navigate to="/login" replace />;
  const roles = getUserRoles(user);
  const uniqueHomes = [...new Set(roles.map((r) =>
    ADMIN_LAYOUT_ROLES.includes(r) ? "/admin" : getEffectiveHome({ role: r })
  ))];
  if (uniqueHomes.length > 1) return <Navigate to="/pick-role" replace />;
  return <Navigate to={getEffectiveHome(user)} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },

  // ── Auth ──────────────────────────────────────────────────
  { path: "/login", element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: "/forgot-password", element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
  { path: "/reset-password", element: <PublicRoute><ResetPasswordPage /></PublicRoute> },
  { path: "/pick-role", element: <ProtectedRoute><RolePickerPage /></ProtectedRoute> },

  // /faculty/* → /admin (all staff use admin portal)
  { path: "/faculty", element: <Navigate to="/admin" replace /> },
  { path: "/faculty/*", element: <Navigate to="/admin" replace /> },

  // ── Admin layout ─────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <RoleGuard roles={[
        ...ADMIN_LAYOUT_ROLES,
        "FACULTY", "NON_TEACHING", "IT_ADMIN", "EXAM_COORDINATOR",
        "ACCOUNT", "LIBRARIAN", "LAB_INCHARGE", "HOSTEL_WARDEN",
        "PLACEMENT", "TRANSPORT", "CLASS_COORDINATOR",
      ]}>
        <AdminLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },

      // ── Sessions ──────────────────────────────────────
      { path: "sessions", element: <SessionsPage /> },
      { path: "sessions/history", element: <SessionHistoryPage /> },

      // ── My account ────────────────────────────────────
      { path: "my-sessions", element: <MySessionsPage /> },
      { path: "my-workspace", element: <MyWorkspacePage /> },
      { path: "my-profile", element: <MyProfilePage /> },
      { path: "faculty-home", element: <FacultyDashboardPage /> },

      // ── Super Admins (root only) ───────────────────────
      { path: "superadmins", element: <RootGuard><SuperAdminHubPage /></RootGuard> },
      { path: "superadmins/list", element: <RootGuard><SuperAdminListPage /></RootGuard> },
      { path: "superadmins/new", element: <RootGuard><SuperAdminNewPage /></RootGuard> },
      { path: "superadmins/history", element: <RootGuard><SuperAdminHistoryPage /></RootGuard> },
      { path: "superadmins/activity", element: <RootGuard><SuperAdminActivityPage /></RootGuard> },
      { path: "superadmins/:id", element: <RootGuard><SuperAdminDetailPage /></RootGuard> },
      { path: "superadmins/:id/edit", element: <RootGuard><SuperAdminEditPage /></RootGuard> },
      { path: "superadmins/manage", element: <RootGuard><SuperAdminManagementPage /></RootGuard> },

      // ── Students — static BEFORE /:id ─────────────────
      { path: "students", element: <PermGuard anyOf={["students.view", "students.create"]}><StudentHubPage /></PermGuard> },
      { path: "students/list", element: <PermGuard perm="students.view"><StudentsListPage /></PermGuard> },
      { path: "students/all", element: <StudentsAllPage /> },
      { path: "students/active", element: <ActiveStudentsPage /> },
      { path: "students/detained", element: <DetainedStudentsPage /> },
      { path: "students/on-hold", element: <OnHoldStudentsPage /> },
      { path: "students/passed", element: <PassedStudentsPage /> },
      { path: "students/left", element: <LeftStudentsPage /> },
      { path: "students/suspended", element: <SuspendedStudentsPage /> },
      { path: "students/previous", element: <PreviousBatchesPage /> },
      { path: "students/new", element: <StudentCreatePage /> },
      { path: "students/search", element: <StudentSearchPage /> },
      { path: "students/bulk", element: <StudentBulkPage /> },
      { path: "students/bulk-status", element: <StudentBulkStatusPage /> },
      { path: "students/bulk-ops", element: <StudentBulkOpsPage /> },
      { path: "students/export", element: <StudentExportPage /> },
      { path: "students/analytics", element: <StudentAnalyticsPage /> },
      { path: "students/attendance", element: <StudentAttendanceAdminPage /> },
      { path: "students/fees", element: <StudentFeesPage /> },
      { path: "students/groups", element: <SpecialGroupsPage /> },
      { path: "students/section-history", element: <StudentSectionHistoryPage /> },
      { path: "students/history", element: <StudentSectionHistoryPage /> },
      { path: "students/promote", element: <BulkHubPage /> },
      { path: "students/:id", element: <StudentDetailPage /> },
      { path: "students/:id/edit", element: <StudentEditPage /> },
      { path: "students/:id/activity", element: <StudentDetailPage /> },

      // ── Faculty — static BEFORE /:id ──────────────────
      { path: "faculty", element: <FacultyHubPage /> },
      { path: "faculty/list", element: <FacultyListPage /> },
      { path: "faculty/active", element: <FacultyListPage status="ACTIVE" /> },
      { path: "faculty/blocked", element: <FacultyListPage status="BLOCKED" /> },
      { path: "faculty/inactive", element: <FacultyListPage status="INACTIVE" /> },
      { path: "faculty/teaching", element: <FacultyListPage filter="TEACHING" /> },
      { path: "faculty/non-teaching", element: <FacultyListPage filter="NON_TEACHING" /> },
      { path: "faculty/new", element: <FacultyCreatePage /> },
      { path: "faculty/search", element: <FacultySearchPage /> },
      { path: "faculty/bulk", element: <FacultyBulkPage /> },
      { path: "faculty/export", element: <FacultyExportPage /> },
      { path: "faculty/analytics", element: <FacultyAnalyticsPage /> },
      { path: "faculty/history", element: <FacultyListPage /> },
      { path: "faculty/subject-preferences", element: <SubjectPreferencePage /> },
      { path: "faculty/:id", element: <FacultyDetailPage /> },
      { path: "faculty/:id/edit", element: <FacultyEditPage /> },
      { path: "faculty/:id/idcard", element: <FacultyIdCardPage /> },
      { path: "faculty/:id/activity", element: <FacultyDetailPage /> },
      { path: "faculty/:id/career", element: <FacultyCareerPage /> },
      { path: "faculty/:id/leave", element: <FacultyLeavePage /> },

      // ── Admins ────────────────────────────────────────
      { path: "admins", element: <AdminHubPage /> },
      { path: "admins/list", element: <AdminsListPage /> },
      { path: "admins/new", element: <AdminCreatePage /> },
      // role-upgrade removed — use Permission Manager
      { path: "admins/activity", element: <AdminActivityPage /> },
      { path: "admins/history", element: <AdminsListPage /> },
      { path: "admins/:id", element: <AdminDetailPage /> },
      { path: "admins/:id/edit", element: <AdminEditPage /> },
      { path: "admins/:id/activity", element: <AdminDetailPage /> },

      // ── Access Roles ──────────────────────────────────

      // ── Academic ──────────────────────────────────────
      { path: "academic", element: <AcademicHubPage /> },
      { path: "academic/structure", element: <AcademicStructurePage /> },
      { path: "academic/calendar", element: <AcademicCalendarPage /> },

      // ── Departments ───────────────────────────────────
      { path: "departments", element: <DepartmentHubPage /> },
      { path: "departments/list", element: <DepartmentsPage /> },
      { path: "departments/new", element: <DepartmentCreatePage /> },
      { path: "departments/bulk", element: <DepartmentBulkPage /> },
      { path: "departments/history", element: <DepartmentHistoryPage /> },
      { path: "departments/:id", element: <DepartmentDetailPage /> },
      { path: "departments/:id/edit", element: <DepartmentEditPage /> },

      // ── Programs ──────────────────────────────────────
      { path: "programs", element: <ProgramHubPage /> },
      { path: "programs/list", element: <ProgramsPage /> },
      { path: "programs/new", element: <ProgramCreatePage /> },
      { path: "programs/bulk", element: <ProgramBulkPage /> },
      { path: "programs/history", element: <ProgramHistoryPage /> },
      { path: "programs/:id", element: <ProgramDetailPage /> },
      { path: "programs/:id/edit", element: <ProgramEditPage /> },

      // ── Branches ──────────────────────────────────────
      { path: "branches", element: <BranchHubPage /> },
      { path: "branches/list", element: <BranchListPage /> },
      { path: "branches/new", element: <BranchCreatePage /> },
      { path: "branches/bulk", element: <BranchBulkPage /> },
      { path: "branches/discontinued", element: <BranchDiscontinuationPage /> },
      { path: "branches/:id", element: <BranchDetailPage /> },
      { path: "branches/:id/edit", element: <BranchEditPage /> },

      // ── Courses ───────────────────────────────────────
      { path: "courses", element: <CourseHubPage /> },
      { path: "courses/list", element: <CoursesPage /> },
      { path: "courses/new", element: <CourseCreatePage /> },
      { path: "courses/history", element: <CourseHistoryPage /> },
      { path: "courses/:id", element: <CourseDetailPage /> },
      { path: "courses/:id/edit", element: <CourseEditPage /> },

      // ── Subjects ──────────────────────────────────────
      { path: "subjects", element: <SubjectHubPage /> },
      { path: "subjects/list", element: <SubjectsPage /> },
      { path: "subjects/history", element: <SubjectHistoryPage /> },

      // ── Sections — static BEFORE /:id ─────────────────
      { path: "sections", element: <SectionsHubPage /> },
      { path: "sections/list", element: <SectionsPage /> },
      { path: "sections/new", element: <SectionCreatePage /> },
      { path: "sections/bulk", element: <SectionBulkPage /> },
      { path: "sections/bulk-promote", element: <SectionBulkPromotePage /> },
      { path: "sections/transfer", element: <SectionTransferPage /> },
      { path: "sections/graduate", element: <SectionGraduatePage /> },
      { path: "sections/history", element: <SectionHistoryPage /> },
      { path: "sections/:id/students", element: <SectionStudentsPage /> },
      { path: "sections/:id", element: <SectionDetailPage /> },
      { path: "sections/:id/edit", element: <SectionEditPage /> },

      // ── Rooms ─────────────────────────────────────────
      { path: "rooms", element: <RoomsPage /> },

      // ── Timetable ─────────────────────────────────────
      { path: "timetable", element: <PermGuard anyOf={["timetable.view", "timetable.manage"]}><TimetableHubPage /></PermGuard> },
      { path: "timetable/periods", element: <PeriodConfigPage /> },
      { path: "timetable/workload", element: <WorkloadPage /> },
      { path: "timetable/generate", element: <GeneratePage /> },
      { path: "timetable/sections", element: <SectionTimetablePage /> },
      { path: "timetable/global", element: <GlobalTimetablePage /> },
      { path: "timetable/faculty", element: <FacultyTimetablePage /> },
      { path: "timetable/course-structure", element: <CourseStructurePage /> },
      { path: "timetable/topics", element: <TopicsTaughtPage /> },
      { path: "timetable/special", element: <SpecialSessionsPage /> },
      { path: "timetable/reports", element: <DailyReportsPage /> },
      { path: "timetable/history", element: <TimetableHistoryPage /> },

      // ── Attendance (NEW) ──────────────────────────────
      { path: "attendance", element: <AttendanceHubPage /> },
      { path: "attendance/faculty", element: <FacultyAttendancePage /> },
      { path: "attendance/mark", element: <AttendancePage /> },
      { path: "attendance/summary", element: <AttendancePage /> },

      // ── Marks (NEW) ───────────────────────────────────
      { path: "marks", element: <MarksPage /> },

      // ── Curriculum ────────────────────────────────────
      { path: "curriculum", element: <CurriculumHubPage /> },
      { path: "curriculum/manage", element: <CurriculumPage /> },
      { path: "curriculum/history", element: <CurriculumHistoryPage /> },

      // ── Enrollments ───────────────────────────────────
      { path: "enrollments", element: <EnrollmentPage /> },
      { path: "enrollments/history", element: <EnrollmentHistoryPage /> },

      // ── Groups ────────────────────────────────────────
      { path: "groups", element: <GroupsHubPage /> },
      { path: "groups/list", element: <GroupListPage /> },
      { path: "groups/new", element: <GroupNewPage /> },
      { path: "groups/students", element: <SpecialGroupsPage /> },
      { path: "groups/faculty", element: <FacultyGroupsPage /> },
      { path: "groups/:id", element: <GroupDetailPage /> },
      { path: "groups/:id/edit", element: <GroupEditPage /> },

      // ── Leave ─────────────────────────────────────────
      { path: "leave", element: <LeaveHubPage /> },
      { path: "leave/list", element: <LeaveListPage /> },
      { path: "leave/pending", element: <LeaveListPage pending /> },
      { path: "leave/submit", element: <LeaveSubmitPage /> },
      { path: "leave/flows", element: <LeaveApprovalFlowPage /> },
      { path: "leave/types", element: <LeaveTypesPage /> },
      { path: "leave/:id", element: <LeaveDetailPage /> },

      // ── Holidays & Leave Rules (NEW) ──────────────────
      { path: "holidays", element: <HolidayPage /> },
      { path: "holidays/leave-rules", element: <LeaveRulesPage /> },

      // ── Feedback ──────────────────────────────────────
      { path: "feedback", element: <FeedbackAdminPage /> },
      { path: "feedback/forms", element: <FeedbackFormsPage /> },
      { path: "feedback/results", element: <FeedbackResultsPage /> },
      { path: "feedback/results/:form_id", element: <FeedbackResultsPage /> },
      { path: "feedback/teaching", element: <FeedbackTeachingPage /> },
      { path: "feedback/categories", element: <FeedbackCategoriesPage /> },
      { path: "feedback/questions", element: <FeedbackQuestionsPage /> },

      // ── Roles & Permissions ───────────────────────────
      { path: "roles/permission-groups", element: <PermGuard rootOnly><PermissionManagerPage /></PermGuard> },

      // ── UI Permissions (root only) ────────────────────
      { path: "ui-permissions", element: <RootGuard><UIPermissionsPage /></RootGuard> },

      // ── Bulk ops ──────────────────────────────────────
      { path: "bulk", element: <BulkHubPage /> },
      { path: "bulk/status", element: <BulkHubPage /> },
      { path: "bulk/promote", element: <BulkHubPage /> },
      { path: "bulk/demote", element: <BulkHubPage /> },
      { path: "bulk/section", element: <BulkHubPage /> },

      // ── Reports ───────────────────────────────────────
      { path: "reports", element: <Navigate to="/admin/reports/students" replace /> },
      { path: "reports/students", element: <ReportsPage /> },
      { path: "reports/faculty", element: <ReportsPage /> },
      { path: "reports/enrollments", element: <ReportsPage /> },

      // ── System ────────────────────────────────────────


      // ── Exam Module ──────────────────────────────────
      { path: "exam", element: <ExamHubPage /> },
      { path: "exam/new", element: <ExamCreatePage /> },
      { path: "exam/list", element: <ExamListPage /> },
      { path: "exam/datesheet", element: <ExamDatesheetPage /> },
      { path: "exam/seating", element: <ExamSeatingPage /> },
      { path: "exam/tickets", element: <ExamTicketsPage /> },
      { path: "exam/marks", element: <ExamMarksPage /> },
      { path: "exam/results", element: <ExamResultsPage /> },
      { path: "exam/report", element: <ExamHubPage /> },
      { path: "exam/:id/edit", element: <ExamCreatePage /> },
      { path: "exam/:id/tickets", element: <ExamHallTicketPage /> },
      { path: "exam/:id/marks", element: <ExamMarksPage /> },
      { path: "exam/:id/report", element: <ExamReportPage /> },
      { path: "exam/:id", element: <ExamDetailPage /> },
      // ── Fee Module// ── Fee Module ───────────────────────────────────
      { path: "fee", element: <FeeHubPage /> },
      { path: "fee/structures", element: <FeeStructurePage /> },
      { path: "fee/scholarships", element: <FeeScholarshipPage /> },
      { path: "fee/collect", element: <FeeStudentsPage /> },
      { path: "fee/students", element: <FeeStudentsPage /> },
      { path: "fee/defaulters", element: <FeeReportPage /> },
      { path: "fee/report", element: <FeeReportPage /> },
      { path: "fee/student/:sid", element: <FeeStudentDetailPage /> },
      // ── HR Module ────────────────────────────────────
      { path: "hr", element: <HRHubPage /> },
      { path: "hr/components", element: <SalaryComponentPage /> },
      { path: "hr/slips", element: <SalarySlipListPage /> },
      { path: "hr/slips/generate", element: <SalaryGeneratePage /> },
      { path: "hr/slips/approve", element: <SalaryApprovePage /> },
      { path: "hr/slips/:id", element: <SalarySlipDetailPage /> },
      { path: "hr/attendance", element: <HRAttendancePage /> },
      { path: "hr/cycles", element: <SalaryCyclePage /> },
      { path: "hr/leave-rules", element: <HRLeaveRulesPage /> },
      { path: "hr/biometric", element: <BiometricImportPage /> },
      { path: "hr/report", element: <HRReportPage /> },
      // ── Assignment Module ────────────────────────────
      { path: "assignments", element: <AssignmentHubPage /> },
      { path: "assignments/new", element: <AssignmentCreatePage /> },
      { path: "assignments/list", element: <AssignmentListPage /> },
      { path: "assignments/report", element: <AssignmentReportPage /> },
      { path: "assignments/:id/edit", element: <AssignmentCreatePage /> },
      { path: "assignments/:id", element: <AssignmentDetailPage /> },
      // ── Skill Card Module ────────────────────────────
      { path: "skill-card", element: <SkillCardHubPage /> },
      { path: "skill-card/init", element: <SkillCardInitPage /> },
      { path: "skill-card/list", element: <SkillCardStudentPage /> },
      { path: "skill-card/bulk", element: <SkillCardBulkPage /> },
      { path: "skill-card/mentor", element: <SkillCardMentorPage /> },
      { path: "skill-card/report", element: <SkillCardReportPage /> },

      { path: "skill-card/:sid", element: <SkillCardStudentPage /> },
      // ── Student Leave ────────────────────────────────
      { path: "students/:id/id-card", element: <StudentIdCardPage /> },
      { path: "students/:id/analytics", element: <StudentAnalyticsPage /> },
      { path: "student-leave", element: <StudentLeaveHubPage /> },
      { path: "student-leave/list", element: <StudentLeaveListPage /> },
      { path: "student-leave/apply", element: <StudentLeaveApplyPage /> },
      { path: "student-leave/pending", element: <StudentLeaveApprovalPage /> },
      { path: "student-leave/:id", element: <StudentLeaveDetailPage /> },
      // ── Academic Calendar ────────────────────────────
      { path: "academic/calendar", element: <AcademicCalendarPage /> },

      // ── Timetable extras ────────────────────────────
      { path: "timetable/print", element: <TimetablePrintPage /> },
      { path: "timetable/week", element: <WeekTimetablePage /> },
      // ── Attendance extras ────────────────────────────
      { path: "attendance/freeze", element: <AttendanceFreezePage /> },
      { path: "attendance/extra", element: <ExtraAttendancePage /> },
      // ── Marks ───────────────────────────────────────
      { path: "marks/subjects", element: <MarksSubjectViewPage /> },
      // ── Faculty extras ───────────────────────────────
      { path: "faculty/:id/analytics", element: <FacultyAnalyticsPage /> },
      { path: "faculty/bulk-ops", element: <FacultyBulkOpsPage /> },
      { path: "faculty/leave/apply", element: <FacultyLeaveApplyPage /> },
      // ── Dept extras ──────────────────────────────────
      // dept-scope removed — use Permission Manager
      { path: "departments/:id/analytics", element: <DeptAnalyticsPage /> },

      // ── Training & Mentorship ──────────────────────────
      { path: "training", element: <TrainingHubPage /> },
      { path: "training/new", element: <TrainingCreatePage /> },
      { path: "training/report", element: <TrainingSummaryReportPage /> },
      { path: "training/mentors", element: <MentorListPage /> },
      { path: "training/mentors/:facultyId/report", element: <MentorDetailPage /> },
      { path: "training/:id", element: <TrainingDetailPage /> },
      { path: "training/:id/edit", element: <TrainingCreatePage /> },
      { path: "training/:id/enroll", element: <TrainingEnrollPage /> },
      { path: "training/:id/attendance", element: <TrainingAttendancePage /> },
      { path: "training/:id/report", element: <TrainingReportPage /> },
      { path: "audit", element: <AuditPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "settings/erp", element: <ErpSettingsPage /> },
    ],
  },

  // ── Faculty portal (/faculty handled above as redirect to /admin)
  // Faculty portal pages are accessible via /admin/faculty-home etc.
  // If you want a separate /faculty portal, remove the redirect above
  // and uncomment below:
  // {
  //     path: "/faculty",
  //     element: <RoleGuard roles={["FACULTY"]}><FacultyLayout /></RoleGuard>,
  //     children: [
  //         { index: true,          element: <FacultyPortalDashboard /> },
  //         { path: "timetable",    element: <FacultyTimetable /> },
  //         { path: "attendance",   element: <FacultyAttendancePage /> },
  //         { path: "leave",        element: <FacultyMyLeave /> },
  //         { path: "feedback",     element: <FacultyFeedbackPage /> },
  //         { path: "settings",     element: <SettingsPage /> },
  //     ],
  // },

  // ── Student portal ────────────────────────────────────────
  {
    path: "/student",
    element: <RoleGuard roles={["STUDENT"]}><StudentLayout /></RoleGuard>,
    children: [
      { index: true, element: <StudentPortalDash /> },
      { path: "dashboard", element: <StudentPortalDash /> },
      { path: "attendance", element: <StudentPortalAttend /> },
      { path: "feedback", element: <StudentFeedbackPage /> },
      { path: "enrollment", element: <StudentEnrollmentPage /> },
      { path: "groups", element: <StudentGroups /> },
      { path: "timetable", element: <StudentPortalDash /> },
      { path: "leave", element: <StudentPortalDash /> },
      { path: "subjects", element: <StudentPortalDash /> },
      { path: "notices", element: <StudentPortalDash /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },

  { path: "unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]); import DeptAnalyticsPage from "./modules/adminss/department/pages/DeptAnalyticsPage.jsx";