// src/modules/portal/faculty/pages/FacultyTimetablePage.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { CalendarDays, Loader2 } from "lucide-react";
import axiosInstance from "../../../lib/axios.js";
import { EP } from "../../../config/api.config.js";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat" };
const TYPE_COLOR = {
    LECTURE: "bg-blue-50 text-blue-700 border-blue-200",
    LAB: "bg-green-50 text-green-700 border-green-200",
    SEMINAR: "bg-amber-50 text-amber-700 border-amber-200",
    TRAINING: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function FacultyTimetablePage() {
    const faculty = useSelector(s => s.auth?.user?.faculty);
    const [entries, setEntries] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [sessionId, setSessionId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get(EP.sessions.list).then(r => {
            const list = r.data?.data || [];
            setSessions(list);
            const cur = list.find(s => s.is_current);
            if (cur) setSessionId(cur.id);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!sessionId || !faculty?.id) return;
        setLoading(true);
        // Fetch all timetable entries where faculty_id = me
        Promise.all([
            axiosInstance.get(EP.timetable.periods(sessionId)),
            // Get global timetable and filter by faculty
            axiosInstance.get(EP.timetable.global, { params: { session_id: sessionId } }),
        ]).then(([pRes, ttRes]) => {
            setPeriods((pRes.data?.data || []).filter(p => !["LUNCH", "BREAK", "ASSEMBLY"].includes(p.type)));
            const tts = ttRes.data?.data || [];
            const myEntries = tts.flatMap(tt =>
                (tt.entries || []).filter(e => e.faculty_id === faculty.id).map(e => ({ ...e, section: tt.section }))
            );
            setEntries(myEntries);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [sessionId, faculty?.id]);

    const getEntry = (day, periodId) => entries.filter(e => e.day === day && e.period_config_id === periodId);

    return (
        <div className="space-y-5 max-w-5xl">
            <div className="flex items-center gap-2">
                <CalendarDays size={20} className="text-primary" />
                <div>
                    <h1 className="text-xl font-bold">My Timetable</h1>
                    <p className="text-sm text-muted-foreground">{entries.length} classes this week</p>
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Session</label>
                <select value={sessionId} onChange={e => setSessionId(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-input bg-background text-sm min-w-44">
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name || s.code}{s.is_current ? " ●" : ""}</option>)}
                </select>
            </div>
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                    <table className="border-collapse text-xs w-full" style={{ minWidth: "700px" }}>
                        <thead>
                            <tr>
                                <th className="sticky left-0 bg-muted border-b border-r border-border px-3 py-2.5 text-left text-muted-foreground min-w-[120px]">Period</th>
                                {DAYS.map(d => (
                                    <th key={d} className="px-2 py-2.5 border-b border-r border-border bg-muted text-center min-w-[130px]">
                                        <p className="font-semibold">{DAY_LABELS[d]}</p>
                                        <p className="text-[10px] text-muted-foreground font-normal">{entries.filter(e => e.day === d).length} classes</p>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(p => (
                                <tr key={p.id} className="hover:bg-muted/5">
                                    <td className="sticky left-0 bg-card border-b border-r border-border px-3 py-2">
                                        <p className="font-bold">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{p.start_time}–{p.end_time}</p>
                                    </td>
                                    {DAYS.map(day => {
                                        const dayEntries = getEntry(day, p.id);
                                        return (
                                            <td key={day} className="border-b border-r border-border p-1.5">
                                                {dayEntries.length === 0
                                                    ? <div className="min-h-[56px] flex items-center justify-center text-muted-foreground/20 text-[10px]">—</div>
                                                    : dayEntries.map((e, i) => (
                                                        <div key={i} className={`rounded-lg border p-2 min-h-[56px] ${TYPE_COLOR[e.entry_type] || TYPE_COLOR.LECTURE}`}>
                                                            <p className="font-bold text-[11px] truncate">{e.subject?.code || "—"}</p>
                                                            <p className="text-[10px] truncate opacity-80">{e.subject?.name}</p>
                                                            <p className="text-[10px] font-medium truncate mt-0.5">{e.section?.name} S{e.section?.semester}</p>
                                                            {e.room && <p className="text-[9px] opacity-60">📍{e.room.code}</p>}
                                                        </div>
                                                    ))
                                                }
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}