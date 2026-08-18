// src/modules/department/pages/DepartmentHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, List, History, Download, Users, GraduationCap, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

export default function DepartmentHubPage() {
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`${EP.departments.list}/stats`)
      .then((r) => setStats(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { label: "Total Departments", value: stats?.total,  color: "violet", path: ROUTES.departments.list },
    { label: "Active",            value: stats?.active,  color: "green",  path: `${ROUTES.departments.list}?status=active` },
    { label: "Inactive",          value: stats?.inactive,color: "amber",  path: `${ROUTES.departments.list}?status=inactive` },
  ];

  const ACTIONS = [
    { label: "Add Department", icon: Plus,          path: ROUTES.departments.new,     perm: "departments.create" },
    { label: "View All",       icon: List,          path: ROUTES.departments.list,    perm: "departments.view"   },
    { label: "History",        icon: History,       path: ROUTES.departments.history, perm: "departments.view"   },
    { label: "Export",         icon: Download,      path: `${ROUTES.departments.hub}/export`, perm: "departments.view" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Department Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Departments are the top level of the academic hierarchy. Every branch, program, and section belongs to a department.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {STATS.map(({ label, value, color, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 text-${color}-600`}>
              {loading ? <Loader2 size={20} className="animate-spin inline" /> : (value ?? "—")}
            </p>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACTIONS.filter((a) => isSuperAdmin || can(a.perm)).map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Icon size={18} />
              </div>
              <p className="text-xs font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Hierarchy */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Academic Hierarchy</h2>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {["Department", "→", "Branch", "→", "Program", "→", "Section"].map((s, i) => (
            <span key={i} className={
              s === "→" ? "text-muted-foreground" :
              s === "Department" ? "font-bold text-violet-600" : "font-medium"
            }>{s}</span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Users size={12} /> Faculty and students belong to departments</div>
          <div className="flex items-center gap-2"><GraduationCap size={12} /> Branches and programs are created under departments</div>
        </div>
      </div>
    </div>
  );
}
