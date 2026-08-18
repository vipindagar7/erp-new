// src/modules/admin/pages/AdminHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle, Plus, List, History, ShieldOff, Activity, Key, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";

export default function AdminHubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`${EP.admins.list}/stats`)
      .then((r) => setStats(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { label: "Total Admins", value: stats?.total,   color: "blue",  path: ROUTES.admins.list },
    { label: "Active",       value: stats?.active,  color: "green", path: `${ROUTES.admins.list}?status=active` },
    { label: "Blocked",      value: stats?.blocked, color: "red",   path: `${ROUTES.admins.list}?status=blocked` },
  ];

  const ACTIONS = [
    { label: "Add Admin",  icon: Plus,     path: ROUTES.admins.new },
    { label: "View All",   icon: List,     path: ROUTES.admins.list },
    { label: "Activity",   icon: Activity, path: ROUTES.admins.activity },
    { label: "Blocked",    icon: ShieldOff,path: `${ROUTES.admins.list}?status=blocked` },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><UserCircle size={20} /></div>
        <div><h1 className="text-2xl font-bold">Admin Management</h1><p className="text-sm text-muted-foreground">Manage ERP admin accounts and their permissions</p></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACTIONS.map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)} className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Icon size={16} /></div>
              <p className="text-xs font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
