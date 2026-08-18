// src/modules/adminss/timetable/pages/TimetableHistoryPage.jsx
import { useState, useEffect } from "react";
import { History, Search, Loader2, Filter } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { Input } from "@/components/ui/input";

const ACTION_COLOR = {
  ASSIGN:  "bg-green-100 text-green-700",
  CLEAR:   "bg-red-100 text-red-700",
  SWAP:    "bg-blue-100 text-blue-700",
  DRAG:    "bg-violet-100 text-violet-700",
  PUBLISH: "bg-emerald-100 text-emerald-700",
  RESTORE: "bg-amber-100 text-amber-700",
  COMBINE: "bg-cyan-100 text-cyan-700",
  SPLIT:   "bg-orange-100 text-orange-700",
  EXPAND:  "bg-indigo-100 text-indigo-700",
};
const fmt = d => new Date(d).toLocaleString("en-IN",{ day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

export default function TimetableHistoryPage() {
  const [logs,      setLogs]    = useState([]);
  const [ttId,      setTtId]    = useState("");
  const [timetables,setTTs]     = useState([]);
  const [sessions,  setSessions]= useState([]);
  const [sessionId, setSessionId]=useState("");
  const [loading,   setLoading] = useState(false);
  const [search,    setSearch]  = useState("");

  const sel = "h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    axiosInstance.get("/sessions?limit=10").then(r => {
      const list = r.data?.data||[];
      setSessions(list);
      const cur = list.find(s=>s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    axiosInstance.get(`/timetable?session_id=${sessionId}&limit=50`)
      .then(r => {
        const tts = r.data?.data || [];
        setTTs(tts);
        if (tts.length) setTtId(tts[0].id);
      }).catch(()=>{});
  }, [sessionId]);

  useEffect(() => {
    if (!ttId) return;
    setLoading(true);
    axiosInstance.get(`/timetable/history?timetable_id=${ttId}`)
      .then(r => setLogs(r.data?.data||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [ttId]);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.includes(search.toUpperCase()) ||
    l.acting_user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.day?.includes(search.toUpperCase())
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-2">
        <History size={20} className="text-primary"/>
        <div>
          <h1 className="text-xl font-bold">Timetable History</h1>
          <p className="text-sm text-muted-foreground">Immutable log of every change made</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Session</label>
          <select value={sessionId} onChange={e=>setSessionId(e.target.value)} className={sel + " w-36"}>
            {sessions.map(s=><option key={s.id} value={s.id}>{s.name||s.code}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Section Timetable</label>
          <select value={ttId} onChange={e=>setTtId(e.target.value)} className={sel + " w-48"}>
            {timetables.map(t=><option key={t.id} value={t.id}>{t.section?.name} (Sem {t.section?.semester})</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by action, user, day…" className="pl-8 h-10"/>
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          {ttId ? "No history yet" : "Select a timetable"}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 px-4 py-2 border-b border-border">
            <span className="col-span-2">Action</span>
            <span className="col-span-1">Day</span>
            <span className="col-span-2">Period</span>
            <span className="col-span-2">By</span>
            <span className="col-span-3">Details</span>
            <span className="col-span-2">Time</span>
          </div>
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {filtered.map((l,i)=>(
              <div key={l.id||i} className="grid grid-cols-12 items-start px-4 py-2.5 hover:bg-muted/10 text-xs">
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${ACTION_COLOR[l.action]||"bg-muted text-muted-foreground"}`}>
                    {l.action}
                  </span>
                </div>
                <span className="col-span-1 font-mono text-muted-foreground">{l.day||"—"}</span>
                <span className="col-span-2 text-muted-foreground">{l.period_config?.name||l.period_config_id?.slice(0,8)||"—"}</span>
                <span className="col-span-2 text-foreground">{l.acting_user?.name||l.acting_user_id?.slice(0,8)||"System"}</span>
                <div className="col-span-3 text-muted-foreground">
                  {l.notes || (l.new_value ? JSON.stringify(l.new_value).slice(0,60) : "—")}
                </div>
                <span className="col-span-2 text-muted-foreground text-[10px]">{fmt(l.createdAt||l.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}