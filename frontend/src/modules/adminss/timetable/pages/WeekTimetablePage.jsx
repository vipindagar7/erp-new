// src/modules/adminss/timetable/pages/WeekTimetablePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const DAY_FULL = { MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday",SAT:"Saturday" };
const TYPE_COLOR = { LECTURE:"bg-blue-50 text-blue-800 border-blue-200", LAB:"bg-green-50 text-green-800 border-green-200", TUTORIAL:"bg-violet-50 text-violet-800 border-violet-200" };

export default function WeekTimetablePage() {
  const navigate = useNavigate();
  const [sections, setSections]   = useState([]);
  const [selSec,   setSelSec]     = useState("");
  const [periods,  setPeriods]    = useState([]);
  const [entries,  setEntries]    = useState([]);
  const [loading,  setLoading]    = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.sections.list + "?status=ACTIVE&limit=200"),
      axiosInstance.get(EP.sessions.list),
    ]).then(([secRes, sesRes]) => {
      setSections(secRes.data?.data?.sections || secRes.data?.data || []);
      const ses = sesRes.data?.data || [];
      const cur = ses.find(s => s.is_current);
      if (cur) {
        axiosInstance.get(EP.timetable.periods(cur.id))
          .then(r => setPeriods((r.data?.data || []).filter(p => !["LUNCH","BREAK","ASSEMBLY"].includes(p.type))));
      }
    }).catch(() => {});
  }, []);

  const loadTimetable = async (secId) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(EP.timetable.bySection(secId));
      setEntries(res.data?.data?.entries || []);
    } catch {} finally { setLoading(false); }
  };

  const getWeekDates = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();
  const today = new Date().toDateString();

  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; });
  entries.forEach(e => { if (grid[e.day]) grid[e.day][e.period_config_id] = e; });

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/timetable")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex-1">Week Timetable</h1>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selSec} onChange={e => { setSelSec(e.target.value); if (e.target.value) loadTimetable(e.target.value); }}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">Select section…</option>
          {sections.map(s => <option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w-1)} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft size={16}/></button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {weekDates[0]?.toLocaleDateString("en-IN",{day:"numeric",month:"short"})} — {weekDates[5]?.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
          </span>
          <button onClick={() => setWeekOffset(w => w+1)} className="p-2 rounded-lg hover:bg-muted"><ChevronRight size={16}/></button>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">Today</button>}
        </div>
      </div>

      {!selSec ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl text-sm text-muted-foreground">
          Select a section to view weekly timetable
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="grid grid-cols-6 gap-2">
          {DAYS.map((day, di) => {
            const date   = weekDates[di];
            const isToday = date?.toDateString() === today;
            const dayEntries = periods.map(p => grid[day]?.[p.id]).filter(Boolean);

            return (
              <div key={day} className={`bg-card border rounded-2xl overflow-hidden ${isToday ? "border-primary shadow-md" : "border-border"}`}>
                {/* Day header */}
                <div className={`px-3 py-2.5 text-center ${isToday ? "bg-primary text-primary-foreground" : "bg-muted/20"}`}>
                  <p className="text-xs font-bold">{DAY_FULL[day]}</p>
                  <p className={`text-[10px] ${isToday ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {date?.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                  </p>
                </div>

                {/* Periods */}
                <div className="p-2 space-y-1.5 min-h-[200px]">
                  {periods.map(p => {
                    const e = grid[day]?.[p.id];
                    return (
                      <div key={p.id} className={`rounded-lg p-2 text-[10px] border ${e ? (TYPE_COLOR[e.entry_type]||"bg-muted border-border") : "bg-muted/10 border-border/40"}`}>
                        {e ? (
                          <>
                            <p className="font-bold leading-tight truncate">{e.subject?.code || e.subject?.name}</p>
                            <p className="text-[9px] opacity-70 mt-0.5">{p.start_time}–{p.end_time}</p>
                            <p className="text-[9px] opacity-70 truncate">{e.faculty?.name?.split(" ").slice(-1)[0]}</p>
                            {e.room && <p className="text-[9px] opacity-60">{e.room.code}</p>}
                          </>
                        ) : (
                          <p className="text-[9px] text-muted-foreground/30 text-center py-1">{p.start_time}</p>
                        )}
                      </div>
                    );
                  })}
                  {periods.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No periods</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}