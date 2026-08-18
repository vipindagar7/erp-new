// src/modules/timetable/pages/FacultyTimetablePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import SearchSelect  from "../../../../components/shared/SearchSelect.jsx";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const ENTRY_TYPE_COLOR = {
  LECTURE:"bg-blue-50 text-blue-700", LAB:"bg-green-50 text-green-700",
  TUTORIAL:"bg-violet-50 text-violet-700",
};

export default function FacultyTimetablePage() {
  const navigate = useNavigate();
  const [sessions,  setSessions]  = useState([]);
  const [periods,   setPeriods]   = useState([]);
  const [entries,   setEntries]   = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [facLabel,  setFacLabel]  = useState("");
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    axiosInstance.get(EP.timetable.periods(sessionId)).then(r => setPeriods(r.data?.data || []));
  }, [sessionId]);

  useEffect(() => {
    if (!facultyId || !sessionId) { setEntries([]); return; }
    setLoading(true);
    axiosInstance.get(EP.timetable.byFaculty(facultyId), { params: { session_id: sessionId } })
      .then(r => setEntries(r.data?.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [facultyId, sessionId]);

  // Build grid
  const entryMap = {};
  for (const e of entries) {
    const key = `${e.day}_${e.period_config_id}`;
    entryMap[key] = e;
  }

  const lectPeriods = periods.filter(p => !["LUNCH","BREAK","ASSEMBLY"].includes(p.type));

  // Weekly summary
  const weeklyHours = entries.filter(e => !["LUNCH","BREAK","FREE"].includes(e.entry_type)).length;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/timetable")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h1 className="text-xl font-bold">Faculty Timetable</h1>
          </div>
          <p className="text-sm text-muted-foreground">View assigned lectures for any faculty member</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Session</label>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm min-w-44">
            <option value="">Select…</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-60">
          <label className="text-xs text-muted-foreground">Faculty</label>
          <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
            subLabelKey="designation" value={facultyId} selectedLabel={facLabel}
            onChange={(v, opt) => { setFacultyId(v); setFacLabel(opt?.name || ""); }}
            placeholder="Search faculty…" />
        </div>
        {entries.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm">
            <p className="font-bold text-blue-700">{weeklyHours}</p>
            <p className="text-[10px] text-blue-600">hrs/week</p>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : !facultyId ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Select a faculty member to view their timetable
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No timetable entries found for {facLabel} in this session
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-20 text-left px-3 py-2 bg-muted/30 border border-border font-semibold text-muted-foreground">Period</th>
                {DAYS.map(d => (
                  <th key={d} className="px-2 py-2 bg-muted/30 border border-border text-center font-semibold text-muted-foreground">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => {
                if (["LUNCH","BREAK"].includes(period.type)) return (
                  <tr key={period.id}>
                    <td className="px-3 py-1 border border-border bg-amber-50 font-medium text-amber-700">{period.name}</td>
                    {DAYS.map(d => <td key={d} className="border border-border bg-amber-50/30 text-center text-amber-600">{period.type}</td>)}
                  </tr>
                );
                return (
                  <tr key={period.id}>
                    <td className="px-3 py-1 border border-border bg-card">
                      <p className="font-bold">{period.name}</p>
                      <p className="text-[10px] text-muted-foreground">{period.start_time}–{period.end_time}</p>
                    </td>
                    {DAYS.map(d => {
                      const e = entryMap[`${d}_${period.id}`];
                      if (!e) return <td key={d} className="border border-border text-center text-muted-foreground/30">—</td>;
                      const cls = ENTRY_TYPE_COLOR[e.entry_type] || ENTRY_TYPE_COLOR.LECTURE;
                      return (
                        <td key={d} className="border border-border px-1 py-1">
                          <div className={`rounded p-1.5 ${cls}`}>
                            <p className="font-semibold truncate">{e.subject?.code}</p>
                            <p className="truncate opacity-75 text-[10px]">{e.timetable?.section?.name}</p>
                            {e.room && <p className="opacity-60 text-[10px]">{e.room.code}</p>}
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