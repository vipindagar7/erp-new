// src/modules/admin/pages/AdminDashboard.jsx
// Permission-filtered dashboard
// Teaching faculty → sees personal section first
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Users, GraduationCap, Building2, BookOpen, Calendar,
  CheckSquare, MessageSquare, BarChart3, Shield, Clock,
  Banknote, ClipboardList, Settings, ChevronRight,
  ShieldCheck, Award, Star, Activity,
} from "lucide-react";

// ── All modules with their permission ─────────────────────────
const MODULES = [
  { key: "students", label: "Students", icon: Users, path: "/admin/students", perm: "students.view", color: "bg-blue-50 text-blue-600 border-blue-100", desc: "Manage student records, bulk upload, promote" },
  { key: "faculty", label: "Faculty", icon: GraduationCap, path: "/admin/faculty", perm: "faculty.view", color: "bg-violet-50 text-violet-600 border-violet-100", desc: "Faculty profiles, qualifications, roles" },
  { key: "academic", label: "Academic", icon: Building2, path: "/admin/departments", perm: "academic.view", color: "bg-indigo-50 text-indigo-600 border-indigo-100", desc: "Departments, programs, branches, sections" },
  { key: "timetable", label: "Timetable", icon: Calendar, path: "/admin/timetable", perm: "timetable.view", color: "bg-amber-50 text-amber-600 border-amber-100", desc: "Class schedules, generate, holidays" },
  { key: "attendance", label: "Attendance", icon: CheckSquare, path: "/admin/attendance", perm: "attendance.view", color: "bg-green-50 text-green-600 border-green-100", desc: "Mark and view attendance records" },
  { key: "leave", label: "Leave", icon: Clock, path: "/admin/leave", perm: "leave.view", color: "bg-orange-50 text-orange-600 border-orange-100", desc: "Leave applications and approvals" },
  { key: "assignments", label: "Assignments", icon: ClipboardList, path: "/admin/assignments", perm: "assignments.view", color: "bg-cyan-50 text-cyan-600 border-cyan-100", desc: "Create, grade, plagiarism check" },
  { key: "exam", label: "Exams", icon: BookOpen, path: "/admin/exam", perm: "exam.view", color: "bg-rose-50 text-rose-600 border-rose-100", desc: "Datesheets, seating, hall tickets" },
  { key: "marks", label: "Marks", icon: BarChart3, path: "/admin/marks", perm: "marks.view", color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100", desc: "Enter and view student marks" },
  { key: "fee", label: "Fee", icon: Banknote, path: "/admin/fee", perm: "fee.view", color: "bg-yellow-50 text-yellow-600 border-yellow-100", desc: "Fee collection and structures" },
  { key: "hr", label: "HR & Payroll", icon: Award, path: "/admin/hr", perm: "hr.view", color: "bg-teal-50 text-teal-600 border-teal-100", desc: "Salary slips, biometric, payroll" },
  { key: "feedback", label: "Feedback", icon: MessageSquare, path: "/admin/feedback", perm: "feedback.view", color: "bg-pink-50 text-pink-600 border-pink-100", desc: "Forms, results, teaching reports" },
  { key: "reports", label: "Reports", icon: BarChart3, path: "/admin/reports", perm: "reports.students", color: "bg-slate-50 text-slate-600 border-slate-100", desc: "Analytics across all modules" },
  { key: "audit", label: "Audit Logs", icon: Shield, path: "/admin/audit", perm: "audit.view", color: "bg-gray-50 text-gray-600 border-gray-100", desc: "Full activity log for root users" },
  { key: "roles", label: "Permissions", icon: ShieldCheck, path: "/admin/roles", perm: null, rootOnly: true, color: "bg-red-50 text-red-600 border-red-100", desc: "Roles, groups, access control" },
  { key: "settings", label: "ERP Settings", icon: Settings, path: "/admin/erp-settings", perm: null, rootOnly: true, color: "bg-neutral-50 text-neutral-600 border-neutral-100", desc: "System configuration (Root only)" },
];

// ── Faculty personal section (for teaching faculty) ────────────
function FacultyPersonalSection({ user }) {
  const navigate = useNavigate();
  const quick = [
    { label: "Mark Attendance", path: "/admin/attendance/faculty", icon: CheckSquare, color: "bg-green-500" },
    { label: "My Timetable", path: "/admin/timetable/faculty/me", icon: Calendar, color: "bg-blue-500" },
    { label: "Apply Leave", path: "/admin/leave/apply", icon: Clock, color: "bg-amber-500" },
    { label: "Topics Taught", path: "/admin/timetable/topics", icon: BookOpen, color: "bg-violet-500" },
  ];
  return (
    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-900">My Quick Actions</p>
          <p className="text-xs text-violet-600">Your daily teaching tools</p>
        </div>
        <Star size={16} className="text-violet-400" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quick.map(q => (
          <button key={q.label} onClick={() => navigate(q.path)}
            className="flex flex-col items-center gap-2 p-3 bg-white/80 border border-white rounded-xl hover:shadow-sm hover:-translate-y-0.5 transition-all text-center">
            <div className={`w-8 h-8 rounded-lg ${q.color} flex items-center justify-center`}>
              <q.icon size={15} className="text-white" />
            </div>
            <p className="text-xs font-medium text-gray-700 leading-tight">{q.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Module card ────────────────────────────────────────────────
function ModuleCard({ mod }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(mod.path)}
      className={`flex items-center gap-3 p-4 rounded-2xl border text-left hover:shadow-md hover:-translate-y-0.5 transition-all group ${mod.color}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
        <mod.icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{mod.label}</p>
        <p className="text-xs opacity-70 truncate mt-0.5">{mod.desc}</p>
      </div>
      <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isRoot = user?.is_root === true || isSuperAdmin;
  const isTeaching = user?.is_teaching === true;
  const perms = user?.effectivePermissions || user?.permissions || [];

  // Filter modules by permission
  const canSee = (mod) => {
    if (mod.rootOnly) return isRoot;
    if (!mod.perm) return true;
    if (isSuperAdmin) return true;
    return perms.includes(mod.perm);
  };

  const visibleModules = MODULES.filter(canSee);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? "Super Admin" : isRoot ? "Root Admin" : user?.role || "—"}
            {user?.department?.name ? ` · ${user.department.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRoot && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold">
              ROOT
            </span>
          )}
        </div>
      </div>

      {/* Teaching faculty personal section — always first */}
      {isTeaching && <FacultyPersonalSection user={user} />}

      {/* Modules grid */}
      {visibleModules.length > 0 ? (
        <div className="space-y-3">
          {(isTeaching || user?.role === "FACULTY") && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modules you can access</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleModules.map(mod => <ModuleCard key={mod.key} mod={mod} />)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield size={40} className="text-muted-foreground/20 mb-4" />
          <p className="font-semibold text-foreground">No modules assigned</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Contact your ERP administrator to get access to modules.
          </p>
        </div>
      )}
    </div>
  );
}