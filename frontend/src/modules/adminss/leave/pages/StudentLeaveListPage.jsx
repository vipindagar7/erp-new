// src/modules/adminss/leave/pages/StudentLeaveListPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, ChevronRight, Loader2, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const STATUS_STYLE = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED:  "bg-green-50 text-green-700 border-green-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

export default function StudentLeaveListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState(searchParams.get("status") || "");
  const [page,    setPage]    = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: LIMIT, page });
    if (status) params.set("status", status);
    axiosInstance.get(EP.studentLeave.list + "?" + params.toString())
      .then(r => setLeaves(r.data?.data || []))
      .catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [status, page]);

  const filtered = leaves.filter(l =>
    !search ||
    l.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.student?.roll_no?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label:"Total",    value:leaves.length,                                    icon:Calendar,     color:"text-foreground" },
    { label:"Pending",  value:leaves.filter(l=>l.status==="PENDING").length,    icon:Clock,        color:"text-amber-600"  },
    { label:"Approved", value:leaves.filter(l=>l.status==="APPROVED").length,   icon:CheckCircle,  color:"text-green-600"  },
    { label:"Rejected", value:leaves.filter(l=>l.status==="REJECTED").length,   icon:XCircle,      color:"text-red-500"    },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calendar size={20} className="text-primary"/>Student Leave Applications
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <button key={s.label} onClick={() => setStatus(s.label === "Total" ? "" : s.label.toUpperCase())}
            className={`bg-card border rounded-2xl p-4 text-left hover:shadow-sm transition-all ${status === (s.label==="Total"?"":s.label.toUpperCase()) && s.label!=="Total" ? "border-primary" : "border-border"}`}>
            <s.icon size={16} className={`${s.color} mb-2`}/>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or roll number…"
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Status</option>
          {["PENDING","APPROVED","REJECTED","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">No leave applications found</div>
            )}
            {filtered.map(l => (
              <div key={l.id} onClick={() => navigate(`/admin/student-leave/${l.id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {l.student?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.student?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.student?.roll_no} · {l.student?.section?.name} ·{" "}
                    {new Date(l.from_date).toLocaleDateString("en-IN",{dateStyle:"short"})} → {new Date(l.to_date).toLocaleDateString("en-IN",{dateStyle:"short"})} ({l.total_days}d)
                  </p>
                  <p className="text-xs text-muted-foreground truncate italic">"{l.reason?.slice(0,60)}"</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLE[l.status]||"bg-muted text-muted-foreground border-border"}`}>
                  {l.status}
                </span>
                <ChevronRight size={13} className="text-muted-foreground shrink-0"/>
              </div>
            ))}
          </div>
          {filtered.length === LIMIT && (
            <div className="px-4 py-3 border-t border-border flex justify-center">
              <button onClick={() => setPage(p => p+1)} className="text-xs text-primary hover:underline">Load more →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
