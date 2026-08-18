// src/modules/programs/pages/ProgramHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, History, Upload, Download, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

export default function ProgramHubPage() {
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`${EP.programs.list}/stats`)
      .then((r) => setStats(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { label: "Total Programs", value: stats?.total,   color: "blue",  path: ROUTES.programs.list },
    { label: "Active",         value: stats?.active,  color: "green", path: `${ROUTES.programs.list}?status=active` },
    { label: "Inactive",       value: stats?.inactive,color: "amber", path: `${ROUTES.programs.list}?status=inactive` },
  ];

  const ACTIONS = [
    { label: "Add Program",  icon: Plus,     path: ROUTES.programs.new,                 perm: "program:create" },
    { label: "View All",     icon: List,     path: ROUTES.programs.list,                perm: "program:view"   },
    { label: "Bulk Upload",  icon: Upload,   path: `${ROUTES.programs.hub}/bulk`,       perm: "program:create" },
    { label: "Template",     icon: Download, path: `${ROUTES.programs.hub}/template`,   perm: "program:view"   },
    { label: "History",      icon: History,  path: ROUTES.programs.history,             perm: "program:view"   },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Program Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Programs are degree courses under a department and branch — e.g. B.Tech CSE, BCA, M.Tech.
        </p>
      </div>

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

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ACTIONS.filter((a) => isSuperAdmin || can(a.perm)).map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Icon size={16} />
              </div>
              <p className="text-xs font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hierarchy</h2>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {["Department", "→", "Branch", "→", "Program", "→", "Section"].map((s, i) => (
            <span key={i} className={s === "→" ? "text-muted-foreground" : s === "Program" ? "font-bold text-blue-600" : "font-medium"}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}