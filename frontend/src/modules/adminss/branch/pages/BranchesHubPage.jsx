// src/modules/branches/pages/BranchesHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitMerge, Plus, List, History, AlertCircle, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { Button } from "@/components/ui/button";

export default function BranchesHubPage() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.branches.list, { params: { limit: 1 } })
      .then((r) => setStats(r.data?.data?.pagination || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ACTIONS = [
    { label: "All Branches",    icon: List,        path: ROUTES.branches.list },
    { label: "Discontinued",    icon: AlertCircle, path: ROUTES.branches.discontinued },
    { label: "Add Branch",      icon: Plus,        path: ROUTES.branches.new },
    { label: "History",         icon: History,     path: ROUTES.branches.history },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><GitMerge size={20} /></div>
          <div><h1 className="text-2xl font-bold">Branches</h1><p className="text-sm text-muted-foreground">B.Tech CSE, ECE, ME — grouped under Programs</p></div>
        </div>
        <Button onClick={() => navigate(ROUTES.branches.new)}><Plus size={13} className="mr-1.5" /> New Branch</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4"><p className="text-xs text-muted-foreground">Total Branches</p><p className="text-2xl font-bold mt-1">{loading ? <Loader2 size={16} className="animate-spin inline" /> : (stats?.total ?? "—")}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ label, icon: Icon, path }) => (
          <button key={label} onClick={() => navigate(path)} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Icon size={16} /></div>
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}