// src/modules/branch/pages/BranchHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Network, Plus, List, BarChart2, History, Upload, Download, AlertCircle, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

export default function BranchHubPage() {
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    axiosInstance.get(`${EP.branches.list}/stats`)
      .then((r) => setStats(r.data?.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const ACTIONS = [
    { label: "Add Branch",  icon: Plus,     path: ROUTES.branches.new,     perm: "academic.create" },
    { label: "View All",    icon: List,     path: ROUTES.branches.list,    perm: "academic.view"   },
    { label: "Bulk Upload", icon: Upload,   path: ROUTES.branches.hub + "/bulk",   perm: "academic.create" },
    { label: "Export",      icon: Download, path: ROUTES.branches.hub + "/export", perm: "academic.view"   },
    { label: "History",     icon: History,  path: ROUTES.branches.history, perm: "audit.view"      },
    { label: "Analytics",   icon: BarChart2,path: ROUTES.branches.hub + "/analytics", perm: "academic.view" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Branch Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage specialisations under departments — CSE AIML, Civil Engineering, Electronics etc.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <AlertCircle size={15} /> Could not load stats.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Branches",   value: stats?.total,    color: "violet", path: ROUTES.branches.list },
          { label: "Combined Year-1",  value: stats?.combined, color: "amber",  path: `${ROUTES.branches.list}?combined=true` },
          { label: "Direct Admission", value: stats?.direct,   color: "green",  path: `${ROUTES.branches.list}?combined=false` },
        ].map(({ label, value, color, path }) => (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

      {/* Hierarchy info */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Academic Hierarchy</h2>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {["Department", "→", "Branch", "→", "Program", "→", "Section"].map((s, i) => (
            <span key={i} className={s === "→" ? "text-muted-foreground" : s === "Branch" ? "font-bold text-violet-600" : "font-medium text-foreground"}>{s}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          A Branch belongs to one Department. Programs (B.Tech, BCA etc.) belong to a Branch.
          Sections belong to Programs. Students are enrolled in Sections per session.
        </p>
      </div>
    </div>
  );
}
