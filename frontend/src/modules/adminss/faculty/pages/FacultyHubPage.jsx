// src/modules/faculty/pages/FacultyHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, List, History, ShieldOff, Upload, Download, Activity, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

export default function FacultyHubPage() {
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`${EP.faculty.list}/stats`)
      .then((r) => setStats(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { label: "Total Faculty", value: stats?.total,    color: "teal",   path: ROUTES.faculty.list },
    { label: "Active",        value: stats?.active,   color: "green",  path: ROUTES.faculty.active },
    { label: "Blocked",       value: stats?.blocked,  color: "red",    path: ROUTES.faculty.blocked },
    { label: "Inactive",      value: stats?.inactive, color: "amber",  path: `${ROUTES.faculty.list}?status=INACTIVE` },
  ];

  const ACTIONS = [
    { label: "Add Faculty",  icon: Plus,          path: ROUTES.faculty.new,      perm: "faculty.create" },
    { label: "View All",     icon: List,          path: ROUTES.faculty.list,     perm: "faculty.view"   },
    { label: "Bulk Upload",  icon: Upload,        path: ROUTES.faculty.bulk,     perm: "faculty.create" },
    { label: "Export",       icon: Download,      path: ROUTES.faculty.export,   perm: "faculty.view"   },
    { label: "Analytics",    icon: Activity,      path: ROUTES.faculty.analytics,perm: "faculty.view"   },
    { label: "History",      icon: History,       path: `${ROUTES.faculty.hub}/history`, perm: "faculty.view" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center"><GraduationCap size={20} /></div>
        <div><h1 className="text-2xl font-bold">Faculty Management</h1><p className="text-sm text-muted-foreground">Manage all faculty members, their profiles, subjects, and sections</p></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(({ label, value, color, path }) => (
          <button key={label} onClick={() => navigate(path)} className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 text-${color}-600`}>
              {loading ? <Loader2 size={20} className="animate-spin inline" /> : (value ?? "—")}
            </p>
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ACTIONS.filter((a) => isSuperAdmin || can(a.perm)).map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)} className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center"><Icon size={16} /></div>
              <p className="text-xs font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
