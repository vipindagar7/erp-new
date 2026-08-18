// src/modules/adminss/hr/pages/SalarySlipListPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Loader2, CheckCircle, Clock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_STYLE = {
  DRAFT:     "bg-muted text-muted-foreground border-border",
  GENERATED: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED:  "bg-green-50 text-green-700 border-green-200",
  PAID:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
};

export default function SalarySlipListPage() {
  const navigate = useNavigate();
  const [slips,   setSlips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [month,   setMonth]   = useState("");
  const [year,    setYear]    = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit:200, year });
    if (status) params.set("status", status);
    if (month)  params.set("month", month);
    axiosInstance.get(EP.hr.slips + "?" + params)
      .then(r => setSlips(r.data?.data?.items || r.data?.data || []))
      .catch(() => notify.error("Failed"))
      .finally(() => setLoading(false));
  }, [status, month, year]);

  const filtered = slips.filter(s =>
    !search ||
    s.faculty?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.faculty?.emp_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold">Salary Slips</h1>
        <button onClick={()=>navigate("/admin/hr/slips/generate")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          Generate Slips
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search faculty…"
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <select value={month} onChange={e=>setMonth(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Months</option>
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Status</option>
          {["GENERATED","APPROVED","PAID","REJECTED"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.length===0 && <div className="py-10 text-center text-sm text-muted-foreground">No salary slips found</div>}
            {filtered.map(s=>(
              <div key={s.id} onClick={()=>navigate(`/admin/hr/slips/${s.id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {s.faculty?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.faculty?.name}</p>
                  <p className="text-xs text-muted-foreground">{s.faculty?.designation} · {MONTHS[s.month]} {s.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">₹{s.net_salary?.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Net</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLE[s.status]||"bg-muted"}`}>
                  {s.status}
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
