// src/modules/adminss/fee/pages/FeeStudentsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const STATUS_STYLE = {
  PAID:    "bg-green-50 text-green-700 border-green-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-red-50 text-red-600 border-red-200",
  WAIVED:  "bg-violet-50 text-violet-700 border-violet-200",
};

export default function FeeStudentsPage() {
  const navigate = useNavigate();
  const [students,  setStudents]  = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const ses = r.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) { setSessionId(cur.id); loadStudents(cur.id); }
    }).catch(() => setLoading(false));
  }, []);

  const loadStudents = async (sid) => {
    setLoading(true);
    try {
      // Get students with their fee status
      const res = await axiosInstance.get(EP.students.all + `?limit=500&status=ACTIVE`);
      setStudents(res.data?.data || []);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const filtered = students.filter(s =>
    (!search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.roll_no?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || s.feeStatus === statusFilter)
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold">Student Fee List</h1>
        <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadStudents(e.target.value);}}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student…"
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Status</option>
          {["PAID","PARTIAL","PENDING","WAIVED"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/20">
              <tr>{["Student","Roll No","Section","Sem","Fee Status","Action"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length===0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No students found</td></tr>}
              {filtered.map(s=>(
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium">{s.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.roll_no}</td>
                  <td className="px-3 py-2.5">{s.section?.name}</td>
                  <td className="px-3 py-2.5">{s.semester}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLE[s.feeStatus||"PENDING"]}`}>
                      {s.feeStatus||"—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={()=>navigate(`/admin/fee/student/${s.id}`)} className="text-xs text-primary hover:underline flex items-center gap-1">
                      Manage <ChevronRight size={10}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
