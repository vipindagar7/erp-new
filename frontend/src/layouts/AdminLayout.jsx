// src/layouts/AdminLayout.jsx
import { useLocation } from "react-router-dom";
import { AppShell } from "./AppShell.jsx";
import {
  ADMIN_NAV,
  STUDENT_MODULE_NAV,
  FACULTY_MODULE_NAV,
  ADMIN_MODULE_NAV,
  DEPARTMENTS_MODULE_NAV,
  PROGRAMS_MODULE_NAV,
  SECTIONS_MODULE_NAV,
  TIMETABLE_MODULE_NAV,
  ATTENDANCE_MODULE_NAV,
  LEAVE_MODULE_NAV,
  EXAM_MODULE_NAV,
  FEE_MODULE_NAV,
  HR_MODULE_NAV,
  ASSIGNMENT_MODULE_NAV,
  TRAINING_MODULE_NAV,
  SKILLCARD_MODULE_NAV,
  STUDENT_LEAVE_MODULE_NAV,
  FEEDBACK_MODULE_NAV,
  GROUPS_MODULE_NAV,
} from "../config/nav.config.js";

// Order matters — longest prefix first to avoid false matches
const MODULE_NAV_MAP = [
  { prefix: "/admin/students", nav: STUDENT_MODULE_NAV, name: "Students" },
  { prefix: "/admin/faculty", nav: FACULTY_MODULE_NAV, name: "Faculty" },
  { prefix: "/admin/roles", nav: ADMIN_MODULE_NAV, name: "Roles & Permissions" },
  { prefix: "/admin/admins", nav: ADMIN_MODULE_NAV, name: "Admins" },
  { prefix: "/admin/departments", nav: DEPARTMENTS_MODULE_NAV, name: "Departments" },
  { prefix: "/admin/branches", nav: DEPARTMENTS_MODULE_NAV, name: "Branches" },
  { prefix: "/admin/programs", nav: PROGRAMS_MODULE_NAV, name: "Programs" },
  { prefix: "/admin/courses", nav: PROGRAMS_MODULE_NAV, name: "Courses" },
  { prefix: "/admin/subjects", nav: PROGRAMS_MODULE_NAV, name: "Subjects" },
  { prefix: "/admin/curriculum", nav: PROGRAMS_MODULE_NAV, name: "Curriculum" },
  { prefix: "/admin/academic", nav: PROGRAMS_MODULE_NAV, name: "Academic" },
  { prefix: "/admin/sections", nav: SECTIONS_MODULE_NAV, name: "Sections" },
  { prefix: "/admin/enrollments", nav: SECTIONS_MODULE_NAV, name: "Enrollments" },
  { prefix: "/admin/timetable", nav: TIMETABLE_MODULE_NAV, name: "Timetable" },
  { prefix: "/admin/attendance", nav: ATTENDANCE_MODULE_NAV, name: "Attendance" },
  { prefix: "/admin/marks", nav: EXAM_MODULE_NAV, name: "Marks" },
  { prefix: "/admin/leave", nav: LEAVE_MODULE_NAV, name: "Leave" },
  { prefix: "/admin/holidays", nav: LEAVE_MODULE_NAV, name: "Holidays" },
  { prefix: "/admin/exam", nav: EXAM_MODULE_NAV, name: "Examinations" },
  { prefix: "/admin/fee", nav: FEE_MODULE_NAV, name: "Fee" },
  { prefix: "/admin/hr", nav: HR_MODULE_NAV, name: "HR & Payroll" },
  { prefix: "/admin/assignments", nav: ASSIGNMENT_MODULE_NAV, name: "Assignments" },
  { prefix: "/admin/training", nav: TRAINING_MODULE_NAV, name: "Training" },
  { prefix: "/admin/skill-card", nav: SKILLCARD_MODULE_NAV, name: "Skill Cards" },
  { prefix: "/admin/student-leave", nav: STUDENT_LEAVE_MODULE_NAV, name: "Student Leave" },
  { prefix: "/admin/feedback", nav: FEEDBACK_MODULE_NAV, name: "Feedback" },
  { prefix: "/admin/groups", nav: GROUPS_MODULE_NAV, name: "Groups" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();

  const active = [...MODULE_NAV_MAP]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((m) => pathname.startsWith(m.prefix));

  return (
    <AppShell
      navItems={ADMIN_NAV}
      moduleNavItems={active?.nav ?? null}
      moduleName={active?.name ?? ""}
      dashboardLabel="Admin Dashboard"
    />
  );
}