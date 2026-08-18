// src/config/dashboards.config.js
export const DASHBOARDS = {

  SUPER_ADMIN: {
    role: "SUPER_ADMIN", label: "Super Admin",
    description: "Full system access",
    icon: "Shield", color: "purple",
    homePath: "/admin", layoutKey: "admin",
  },

  ADMIN: {
    role: "ADMIN", label: "Administrator",
    description: "Institution management",
    icon: "Building2", color: "blue",
    homePath: "/admin", layoutKey: "admin",
  },

  HOD: {
    role: "HOD", label: "Head of Department",
    description: "Department management",
    icon: "Users", color: "amber",
    homePath: "/admin", layoutKey: "admin",
  },

  CLASS_COORDINATOR: {
    role: "CLASS_COORDINATOR", label: "Class Coordinator",
    description: "Section management",
    icon: "Layers", color: "cyan",
    homePath: "/admin", layoutKey: "admin",
  },

  TIMETABLE_MANAGER: {
    role: "TIMETABLE_MANAGER", label: "Timetable Manager",
    description: "Schedule and timetable management",
    icon: "CalendarDays", color: "indigo",
    homePath: "/admin", layoutKey: "admin",
  },

  ACADEMIC_MANAGER: {
    role: "ACADEMIC_MANAGER", label: "Academic Manager",
    description: "Curriculum and academic planning",
    icon: "BookOpen", color: "violet",
    homePath: "/admin", layoutKey: "admin",
  },

  FACULTY: {
    role: "FACULTY", label: "Faculty",
    description: "Teaching, attendance & feedback",
    icon: "BookOpen", color: "teal",
    homePath: "/admin", layoutKey: "admin",
  },

  STUDENT: {
    role: "STUDENT", label: "Student",
    description: "My academics & feedback",
    icon: "GraduationCap", color: "green",
    homePath: "/student", layoutKey: "student",
  },

  ACCOUNTANT: {
    role: "ACCOUNTANT", label: "Accounts",
    description: "Fee & financial reports",
    icon: "IndianRupee", color: "emerald",
    homePath: "/admin", layoutKey: "admin",
  },

  LIBRARIAN: {
    role: "LIBRARIAN", label: "Library",
    description: "Library management",
    icon: "Library", color: "orange",
    homePath: "/admin", layoutKey: "admin",
  },

  TRAINING_AND_PLACEMENT_OFFICER: {
    role: "TRAINING_AND_PLACEMENT_OFFICER", label: "Placement Officer",
    description: "Placements & training",
    icon: "Briefcase", color: "rose",
    homePath: "/admin", layoutKey: "admin",
  },

  DEPT_ADMIN: {
    role: "DEPT_ADMIN", label: "Department Admin",
    description: "Department-level management",
    icon: "Building2", color: "sky",
    homePath: "/admin", layoutKey: "admin",
  },

  EXAM_COORDINATOR: {
    role: "EXAM_COORDINATOR", label: "Exam Coordinator",
    description: "Exams, marks & attendance reports",
    icon: "ClipboardList", color: "violet",
    homePath: "/admin", layoutKey: "admin",
  },

  NON_TEACHING: {
    role: "NON_TEACHING", label: "Non-Teaching Staff",
    description: "Administrative & support staff",
    icon: "UserCircle", color: "slate",
    homePath: "/admin", layoutKey: "admin",
  },

  ACCOUNT: {
    role: "ACCOUNT", label: "Account Officer",
    description: "Finance, salary & accounts",
    icon: "IndianRupee", color: "emerald",
    homePath: "/admin", layoutKey: "admin",
  },

  LAB_INCHARGE: {
    role: "LAB_INCHARGE", label: "Lab In-Charge",
    description: "Laboratory & practical sessions",
    icon: "FlaskConical", color: "cyan",
    homePath: "/admin", layoutKey: "admin",
  },

  HOSTEL_WARDEN: {
    role: "HOSTEL_WARDEN", label: "Hostel Warden",
    description: "Hostel accommodation management",
    icon: "Home", color: "amber",
    homePath: "/admin", layoutKey: "admin",
  },

  PLACEMENT: {
    role: "PLACEMENT", label: "Placement Officer",
    description: "Training & placement cell",
    icon: "Briefcase", color: "rose",
    homePath: "/admin", layoutKey: "admin",
  },

  IT_ADMIN: {
    role: "IT_ADMIN", label: "IT Admin",
    description: "ERP infrastructure & system admin",
    icon: "Monitor", color: "blue",
    homePath: "/admin", layoutKey: "admin",
  },

  TRANSPORT: {
    role: "TRANSPORT", label: "Transport Officer",
    description: "Transport & logistics management",
    icon: "Bus", color: "orange",
    homePath: "/admin", layoutKey: "admin",
  },

};

export const getDashboard          = (role) => DASHBOARDS[role] || null;
export const getRoleHome           = (role) => DASHBOARDS[role]?.homePath || "/login";
export const getDashboardsForRoles = (roles = []) => roles.map((r) => DASHBOARDS[r]).filter(Boolean);
export const ADMIN_LAYOUT_ROLES    = Object.values(DASHBOARDS).filter((d) => d.layoutKey === "admin").map((d) => d.role);
export const ALL_ROLES              = Object.keys(DASHBOARDS);