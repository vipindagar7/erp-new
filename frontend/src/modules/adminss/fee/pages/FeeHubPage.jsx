// src/modules/adminss/fee/pages/FeeHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Plus, BarChart2, Users, AlertCircle, CheckCircle, Loader2, ChevronRight } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function FeeHubPage() {
  const navigate = useNavigate();
  const [summary,    setSummary]    = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    // Get current session id from store or use latest
    Promise.all([
      axiosInstance.get(EP.fee.feeSummary).catch(() => ({ data:{ data:null } })),
      axiosInstance.get(EP.fee.defaulters).catch(() => ({ data:{ data:[] } })),
    ]).then(([sRes, dRes]) => {
      setSummary(sRes.data?.data);
      setDefaulters(dRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label:"Fee Expected",   value:`₹${(summary?.total_expected||0).toLocaleString()}`,   color:"text-foreground"  },
    { label:"Collected",      value:`₹${(summary?.total_collected||0).toLocaleString()}`,   color:"text-green-600"   },
    { label:"Pending",        value:`₹${((summary?.total_expected||0)-(summary?.total_collected||0)).toLocaleString()}`, color:"text-amber-600" },
    { label:"Defaulters",     value:defaulters.length,                                       color:"text-red-500"     },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Banknote size={20} className="text-primary"/>Fee Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track fee structures, collections, scholarships and defaulters</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/admin/fee/structures")}
            className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">Fee Structures</button>
          <button onClick={() => navigate("/admin/fee/report")}
            className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">Report</button>
          <button onClick={() => navigate("/admin/fee/collect")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14}/>Record Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Collection progress bar */}
      {summary && summary.total_expected > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Collection Progress</span>
            <span className="text-muted-foreground">{Math.round((summary.total_collected/summary.total_expected)*100)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all"
              style={{width:`${Math.min(100,(summary.total_collected/summary.total_expected)*100)}%`}}/>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label:"Fee Structures",  path:"/admin/fee/structures",   icon:Banknote    },
          { label:"Scholarships",    path:"/admin/fee/scholarships",  icon:CheckCircle },
          { label:"Student Fees",    path:"/admin/fee/students",      icon:Users       },
          { label:"Defaulters",      path:"/admin/fee/defaulters",    icon:AlertCircle },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 p-3 rounded-xl border border-border text-xs font-medium hover:bg-muted/30">
            <a.icon size={14} className="text-primary"/>{a.label}
          </button>
        ))}
      </div>

      {/* Top defaulters */}
      {defaulters.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500"/>Top Defaulters ({defaulters.length})
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {defaulters.slice(0,5).map(s => {
                const due = s.feePayments?.reduce((sum,p) => sum+(p.due_amount||0), 0) || 0;
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center">
                      {s.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.roll_no} · {s.section?.name}</p>
                    </div>
                    <span className="text-sm font-bold text-red-500">₹{due.toLocaleString()}</span>
                    <button onClick={() => navigate(`/admin/fee/student/${s.id}`)}
                      className="text-xs text-primary hover:underline">Collect</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
