// src/modules/student/pages/StudentHubPage.jsx
// Permission-filtered hub with dept-scope awareness
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Users, UserPlus, Upload, Download, Search,
  ArrowUpCircle, ShieldOff, GraduationCap, History,
  BarChart2, Loader2, Filter, Building2,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { CanDo } from "../../../../components/shared/PermGuard.jsx";

const COLOR = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  green: "bg-green-50 text-green-600 border-green-100",
  teal: "bg-teal-50 text-teal-600 border-teal-100",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  red: "bg-red-50 text-red-600 border-red-100",
  slate: "bg-slate-50 text-slate-600 border-slate-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

function ActionCard({ label, icon: Icon, path, perm, color, disabled }) {
  const navigate = useNavigate();
  const inner = (
    <button
      onClick={() => !disabled && navigate(path)}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"}
        ${COLOR[color] || COLOR.blue}`}>
      <Icon size={20} />
      <p className="text-xs font-semibold">{label}</p>
    </button>
  );
  if (!perm) return inner;
  return <CanDo perm={perm}>{inner}</CanDo>;
}

function StatCard({ label, value, icon: Icon, color, path }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => path && navigate(path)}
      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm ${path ? "cursor-pointer hover:-translate-y-0.5" : ""} ${COLOR[color]}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm shrink-0">
        <Icon size={18} />
      </div>
      <div className="text-left">
        <p className="text-xl font-black">{value ?? "—"}</p>
        <p className="text-xs opacity-70">{label}</p>
      </div>
    </button>
  );
}

export default function StudentHubPage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const departments = useSelector(s => s.academic?.departments?.list ?? []);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dept scope — if user has dept_ids, filter stats
  const deptIds = user?.dept_ids || [];
  const hasDeptScope = deptIds.length > 0 && user?.role !== "SUPER_ADMIN";

  useEffect(() => {
    axiosInstance.get(EP.admins?.dashboard || "/api/admin/dashboard")
      .then(r => setStats(r.data?.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const deptNames = hasDeptScope
    ? departments.filter(d => deptIds.includes(d.id)).map(d => d.name).join(", ")
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Student Hub</h1>
          {hasDeptScope && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Filter size={11} />Scoped to: {deptNames}
            </p>
          )}
        </div>
        <CanDo perm="students.create">
          <button onClick={() => navigate("/admin/students/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <UserPlus size={14} />Add Student
          </button>
        </CanDo>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active" value={stats?.students?.active} icon={Users} color="green" path="/admin/students/active" />
          <StatCard label="Detained" value={stats?.students?.detained} icon={ShieldOff} color="red" path="/admin/students/detained" />
          <StatCard label="Passed" value={stats?.students?.passed} icon={GraduationCap} color="blue" path="/admin/students/passed" />
          <StatCard label="Total" value={stats?.students?.total} icon={BarChart2} color="slate" path="/admin/students/list" />
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <ActionCard label="All Students" icon={Users} path="/admin/students/list" perm="students.view" color="slate" />
          <ActionCard label="Add Student" icon={UserPlus} path="/admin/students/new" perm="students.create" color="blue" />
          <ActionCard label="Bulk Upload" icon={Upload} path="/admin/students/bulk" perm="students.create" color="violet" />
          <ActionCard label="Search" icon={Search} path="/admin/students/search" perm="students.view" color="indigo" />
          <ActionCard label="Export" icon={Download} path="/admin/students/export" perm="students.export" color="teal" />
          <ActionCard label="Bulk Promote" icon={ArrowUpCircle} path="/admin/students/promote" perm="students.promote" color="green" />
        </div>
      </div>

      {/* Sections by dept (if scoped) */}
      {hasDeptScope && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Building2 size={12} />Your department scope
          </p>
          <p className="text-xs text-blue-600">
            You can view and manage students only in: <strong>{deptNames}</strong>
          </p>
        </div>
      )}

      {/* Analytics link */}
      <CanDo perm="students.view">
        <button onClick={() => navigate("/admin/students/analytics")}
          className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
              <BarChart2 size={16} className="text-cyan-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Analytics</p>
              <p className="text-xs text-muted-foreground">Enrollment trends, retention, dept-wise</p>
            </div>
          </div>
          <BarChart2 size={14} className="text-muted-foreground" />
        </button>
      </CanDo>
    </div>
  );
}