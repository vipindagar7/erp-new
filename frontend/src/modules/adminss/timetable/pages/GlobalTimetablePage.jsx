// src/modules/timetable/pages/GlobalTimetablePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe2, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const ENTRY_COLOR = {
  LECTURE: "bg-blue-50 text-blue-800 border-blue-200",
  LAB:     "bg-green-50 text-green-800 border-green-200",
  TUTORIAL:"bg-violet-50 text-violet-800 border-violet-200",
  SEMINAR: "bg-amber-50 text-amber-800 border-amber-200",
  TRAINING:"bg-teal-50 text-teal-800 border-teal-200",
};
const sel = "h-9 px-3 rounded-lg border border-input bg-background text-sm min-w-44";

export default function GlobalTimetablePage() {
  const navigate = useNavigate();
  const [sessions,   setSessions]   = useState([]);
  const [depts,      setDepts]      = useState([]);
  const [periods,    setPeriods]    = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [sessionId,  setSessionId]  = useState("");
  const [deptId,     setDeptId]     = useState("");
  const [dayFilter,  setDayFilter]  = useState("MON");
  const [loading,    setLoading]    = useState(false);
  const [loadingP,   setLoadingP]   = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.sessions.list),
      axiosInstance.get(EP.departments.list + "?limit=100"),
    ]).then(([sRes, dRes]) => {
      const list = sRes.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
      setDepts(dRes.data?.data?.departments || dRes.data?.data || []);
    }).catch(() => {});
  }, []);

  // Load periods when session changes
  useEffect(() => {
    if (!sessionId) return;
    setLoadingP(true);
    axiosInstance.get(EP.timetable.periods(sessionId))
      .then(r => setPeriods(r.data?.data || []))
      .catch(() => setPeriods([]))
      .finally(() => setLoadingP(false));
  }, [sessionId]);

  // Load timetables
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    axiosInstance.get(EP.timetable.global, {
      params: { session_id: sessionId, dept_id: deptId || undefined },
    }).then(r => {
      const data = r.data?.data;
      setTimetables(Array.isArray(data) ? data : []);
    })
    .catch(() => setTimetables([]))
    .finally(() => setLoading(false));
  }, [sessionId, deptId]);

  // Teaching periods only
  const teachingPeriods = periods.filter(p => !["LUNCH","BREAK","ASSEMBLY"].includes(p.type));
  const breakPeriods    = periods.filter(p => ["LUNCH","BREAK"].includes(p.type));

  // Filter to sections that have entries on selected day
  const activeTTs = timetables.filter(tt =>
    (tt.entries||[]).some(e => e.day === dayFilter)
  );

  return (
    <div className="space-y-4 max-w-full">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/timetable")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2"><Globe2 size={18} className="text-primary" /><h1 className="text-xl font-bold">Global Timetable</h1></div>
          <p className="text-sm text-muted-foreground">{timetables.length} sections loaded{activeTTs.length !== timetables.length ? ` · ${activeTTs.length} have ${dayFilter} classes` : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end bg-card border border-border rounded-2xl p-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Session</label>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={sel}>
            <option value="">Select session…</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Department</label>
          <select value={deptId} onChange={e => setDeptId(e.target.value)} className={sel}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Day</label>
          <div className="flex gap-1">
            {DAYS.map(d => (
              <button key={d} onClick={() => setDayFilter(d)}
                className={`text-xs font-bold px-2.5 py-2 rounded-lg transition-colors ${dayFilter===d?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {d.slice(0,2)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading || loadingP ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      ) : timetables.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Globe2 size={28} className="mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No timetables found for this session</p>
          <p className="text-xs text-muted-foreground/60">Generate timetable first from Admin → Timetable → Auto-Generate</p>
        </div>
      ) : activeTTs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">{timetables.length} timetables exist but no entries on {dayFilter}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a different day or check if entries were generated</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="border-collapse text-xs w-full" style={{ minWidth:`${activeTTs.length * 130 + 140}px` }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-muted border-b border-r border-border text-left px-3 py-2 font-semibold text-muted-foreground min-w-[140px]">
                  Period
                </th>
                {activeTTs.map(tt => (
                  <th key={tt.id} className="px-2 py-2 border-b border-r border-border bg-muted text-center min-w-[120px]">
                    <p className="font-semibold">{tt.section?.name}</p>
                    <p className="text-[10px] text-muted-foreground font-normal">
                      {tt.section?.branch?.name} · Sem {tt.section?.semester}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => {
                const isBreak = ["LUNCH","BREAK"].includes(period.type);
                if (isBreak) return (
                  <tr key={period.id} className="bg-amber-50/40">
                    <td className="sticky left-0 z-10 bg-amber-50 border-b border-r border-border px-3 py-1.5">
                      <p className="font-medium text-amber-700 text-xs">{period.name}</p>
                      <p className="text-[10px] text-amber-600">{period.start_time}–{period.end_time}</p>
                    </td>
                    {activeTTs.map(tt => (
                      <td key={tt.id} className="border-b border-r border-border text-center text-amber-600 text-[10px] bg-amber-50/20 py-1">
                        {period.type}
                      </td>
                    ))}
                  </tr>
                );

                return (
                  <tr key={period.id} className="hover:bg-muted/5">
                    <td className="sticky left-0 z-10 bg-card border-b border-r border-border px-3 py-1.5">
                      <p className="font-bold text-xs">{period.name}</p>
                      <p className="text-[10px] text-muted-foreground">{period.start_time}–{period.end_time}</p>
                    </td>
                    {activeTTs.map(tt => {
                      const entry = (tt.entries||[]).find(e =>
                        e.day === dayFilter && e.period_config_id === period.id
                      );
                      if (!entry) return (
                        <td key={tt.id} className="border-b border-r border-border px-1 py-1 text-center">
                          <div className="min-h-[48px] flex items-center justify-center text-muted-foreground/20 text-[10px]">—</div>
                        </td>
                      );
                      const cls = ENTRY_COLOR[entry.entry_type] || ENTRY_COLOR.LECTURE;
                      return (
                        <td key={tt.id} className="border-b border-r border-border px-1 py-1">
                          <div className={`rounded-lg border px-2 py-1.5 min-h-[48px] ${cls}`}>
                            <p className="font-semibold text-[11px] truncate">{entry.subject?.code || "—"}</p>
                            <p className="text-[10px] truncate opacity-80 leading-tight">{entry.subject?.name || ""}</p>
                            <p className="text-[10px] font-medium truncate mt-0.5">{entry.faculty?.name?.split(" ")[0] || ""}</p>
                            {entry.is_combined && <span className="text-[9px] bg-white/50 rounded px-1">Combined</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}