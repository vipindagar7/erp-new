// src/modules/adminss/exam/pages/ExamListPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, ChevronRight, Loader2, Filter } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const EXAM_TYPES = ["CLASS_TEST","SESSIONAL_1","SESSIONAL_2","MID_TERM","PRE_UNIVERSITY","UNIVERSITY_THEORY","UNIVERSITY_PRACTICAL","INTERNAL_PRACTICAL"];
const STATUS_STYLE = {
  DRAFT:      "bg-muted text-muted-foreground border-border",
  SCHEDULED:  "bg-blue-50 text-blue-700 border-blue-200",
  ONGOING:    "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED:  "bg-green-50 text-green-700 border-green-200",
  CANCELLED:  "bg-red-50 text-red-700 border-red-200",
  POSTPONED:  "bg-orange-50 text-orange-700 border-orange-200",
};

export default function ExamListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [typeFilter,  setTypeFilter]   = useState(searchParams.get("type") || "");
  const [statusFilter,setStatusFilter] = useState(searchParams.get("status") || "");
  const [sessions,  setSessions]   = useState([]);
  const [sessionId, setSessionId]  = useState("");

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const ses = r.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) { setSessionId(cur.id); }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 100 });
    if (typeFilter)   params.set("exam_type", typeFilter);
    if (statusFilter) params.set("status",    statusFilter);
    if (sessionId)    params.set("session_id",sessionId);
    axiosInstance.get(EP.exam.list + "?" + params)
      .then(r => setExams(r.data?.data?.items || []))
      .catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter, sessionId]);

  const filtered = exams.filter(e =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold">All Exams</h1>
        <button onClick={() => navigate("/admin/exam/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14}/>New Exam
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams…"
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Types</option>
          {EXAM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Status</option>
          {["DRAFT","SCHEDULED","ONGOING","COMPLETED","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sessionId} onChange={e => setSessionId(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No exams found. <button onClick={() => navigate("/admin/exam/new")} className="text-primary hover:underline">Create one →</button>
              </div>
            )}
            {filtered.map(e => (
              <div key={e.id} onClick={() => navigate(`/admin/exam/${e.id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.exam_type?.replace(/_/g," ")} ·{" "}
                    {new Date(e.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} →{" "}
                    {new Date(e.end_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e._count?.schedule||0} subjects · {e._count?.hallTickets||0} hall tickets
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLE[e.status]||"bg-muted"}`}>
                  {e.status}
                </span>
                <ChevronRight size={13} className="text-muted-foreground shrink-0"/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
