// src/modules/attendance/pages/FacultyAttendancePage.jsx
// Mark attendance — consecutive periods handled (1 entry only)
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import axiosInstance from "../../../lib/axios.js";
import { notify } from "../../../hooks/notify.js";

const STATUS_OPTS = [
    { key: "PRESENT", label: "P", color: "bg-green-500 text-white", full: "Present" },
    { key: "ABSENT", label: "A", color: "bg-red-500 text-white", full: "Absent" },
    { key: "LATE", label: "L", color: "bg-amber-500 text-white", full: "Late" },
];

// ── Student row ────────────────────────────────────────────────
function StudentRow({ student, status, onChange }) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {student.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.roll_no || "—"}</p>
            </div>
            <div className="flex gap-1">
                {STATUS_OPTS.map(s => (
                    <button key={s.key} onClick={() => onChange(student.id, s.key)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${status === s.key ? s.color + " shadow-sm scale-105" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}>
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Mark all ───────────────────────────────────────────────────
function BulkActions({ onMarkAll }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/10">
            <span className="text-xs font-medium text-muted-foreground">Mark all:</span>
            {STATUS_OPTS.map(s => (
                <button key={s.key} onClick={() => onMarkAll(s.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${s.color}`}>
                    {s.full}
                </button>
            ))}
        </div>
    );
}

export default function FacultyAttendancePage() {
    const { user } = useSelector(s => s.auth);
    const today = new Date().toISOString().slice(0, 10);

    // Config
    const [date, setDate] = useState(today);
    const [sections, setSections] = useState([]);
    const [selectedSec, setSelectedSec] = useState("");
    const [periods, setPeriods] = useState([]);
    const [selectedPer, setSelectedPer] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [selectedSub, setSelectedSub] = useState("");

    // Students + marks
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});  // { student_id: "PRESENT"|"ABSENT"|"LATE" }
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyMarked, setAlreadyMarked] = useState(false);

    // Consecutive period info
    const [consecutive, setConsecutive] = useState(null);

    // Load faculty's sections
    useEffect(() => {
        axiosInstance.get("/api/sections?my=true&limit=100")
            .then(r => setSections(r.data?.data?.sections || r.data?.data || []))
            .catch(() => { });
    }, []);

    // Load periods when section selected
    useEffect(() => {
        if (!selectedSec) return;
        axiosInstance.get(`/api/timetable/periods?section_id=${selectedSec}`)
            .then(r => setPeriods(r.data?.data || []))
            .catch(() => { });
    }, [selectedSec]);

    // Load subjects for section
    useEffect(() => {
        if (!selectedSec) return;
        axiosInstance.get(`/api/sections/${selectedSec}/subjects`)
            .then(r => setSubjects(r.data?.data || []))
            .catch(() => { });
    }, [selectedSec]);

    // Check consecutive periods
    useEffect(() => {
        if (!selectedSec || !selectedPer) return;
        const sec = sections.find(s => s.id === selectedSec);
        if (!sec?.timetable_id) return;

        const DAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date(date + "T12:00:00").getDay()];
        axiosInstance.get(`/api/attendance/consecutive?timetable_id=${sec.timetable_id}&period_config_id=${selectedPer}&day=${DAY}`)
            .then(r => setConsecutive(r.data?.data))
            .catch(() => setConsecutive(null));
    }, [selectedSec, selectedPer, date]);

    // Load students for section
    const loadStudents = useCallback(async () => {
        if (!selectedSec) return;
        setLoading(true);
        setAlreadyMarked(false);
        try {
            // Load students
            const [studRes, existingRes] = await Promise.all([
                axiosInstance.get(`/api/attendance/students?section_id=${selectedSec}`),
                selectedPer && selectedSub
                    ? axiosInstance.get(`/api/attendance/lecture?section_id=${selectedSec}&subject_id=${selectedSub}&date=${date}&period_config_id=${selectedPer}&session_id=${user?.session_id || ""}`)
                    : Promise.resolve({ data: { data: [] } }),
            ]);

            const studs = studRes.data?.data || [];
            const existing = existingRes.data?.data || [];

            setStudents(studs);

            // Pre-fill marks from existing attendance
            if (existing.length > 0) {
                setAlreadyMarked(true);
                const preMarks = {};
                for (const r of existing) preMarks[r.student_id] = r.status;
                setMarks(preMarks);
            } else {
                // Default all to PRESENT
                const defaultMarks = {};
                for (const s of studs) defaultMarks[s.id] = "PRESENT";
                setMarks(defaultMarks);
            }
        } catch { notify.error("Failed to load students"); }
        finally { setLoading(false); }
    }, [selectedSec, selectedPer, selectedSub, date]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    const onChange = (student_id, status) => setMarks(m => ({ ...m, [student_id]: status }));
    const markAll = (status) => setMarks(Object.fromEntries(students.map(s => [s.id, status])));

    const submit = async () => {
        if (!selectedSec || !selectedSub || !selectedPer)
            return notify.error("Select section, period and subject");

        // Consecutive period check — show warning if this is not the first period
        if (consecutive?.should_skip) {
            notify.error(`This is part of a consecutive ${consecutive.group.length}-period slot. Attendance is marked only once on the first period.`);
            return;
        }

        setSubmitting(true);
        try {
            const records = students.map(s => ({ student_id: s.id, status: marks[s.id] || "ABSENT" }));
            const res = await axiosInstance.post("/api/attendance/mark", {
                date,
                section_id: selectedSec,
                subject_id: selectedSub,
                period_config_id: selectedPer,
                session_id: user?.session_id || "",
                faculty_id: user?.faculty_id || "",
                records,
            });

            if (res.data?.data?.already_marked) {
                notify.warning("Attendance already marked for this slot");
                setAlreadyMarked(true);
            } else {
                notify.success(`Saved — ${res.data?.data?.marked} students marked`);
                setAlreadyMarked(true);
            }
        } catch (e) {
            if (e.response?.status === 409) {
                notify.warning("Attendance already marked for this slot");
                setAlreadyMarked(true);
            } else {
                notify.error(e.response?.data?.message || "Failed to save");
            }
        } finally { setSubmitting(false); }
    };

    const present = Object.values(marks).filter(v => v === "PRESENT").length;
    const absent = Object.values(marks).filter(v => v === "ABSENT").length;

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Mark Attendance</h1>
                <button onClick={loadStudents} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Config */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Date</label>
                        <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Section *</label>
                        <select value={selectedSec} onChange={e => { setSelectedSec(e.target.value); setSelectedPer(""); setSelectedSub(""); }}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
                            <option value="">Select…</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Period *</label>
                        <select value={selectedPer} onChange={e => setSelectedPer(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
                            <option value="">Select…</option>
                            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.start_time}–{p.end_time})</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Subject *</label>
                        <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
                            <option value="">Select…</option>
                            {subjects.map(s => <option key={s.id || s.subject_id} value={s.id || s.subject_id}>{s.name || s.subject?.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Consecutive warning */}
                {consecutive?.is_consecutive && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${consecutive.should_skip
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                        <AlertCircle size={12} />
                        {consecutive.should_skip
                            ? `This period is part of a ${consecutive.group.length}-period consecutive slot. Mark attendance on the FIRST period only.`
                            : `This is the first of ${consecutive.group.length} consecutive periods. Mark once here.`
                        }
                    </div>
                )}

                {alreadyMarked && (
                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700">
                        <CheckCircle size={12} />Attendance already marked for this slot
                    </div>
                )}
            </div>

            {/* Students */}
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
            ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    {selectedSec ? "No students in this section" : "Select a section to start"}
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Stats */}
                    <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/10">
                        <span className="text-xs text-green-600 font-semibold">✓ {present} Present</span>
                        <span className="text-xs text-red-600 font-semibold">✗ {absent} Absent</span>
                        <span className="text-xs text-muted-foreground">{students.length} total</span>
                    </div>

                    <BulkActions onMarkAll={markAll} />

                    <div className="max-h-[60vh] overflow-y-auto">
                        {students.map(s => (
                            <StudentRow key={s.id} student={s} status={marks[s.id] || "PRESENT"} onChange={onChange} />
                        ))}
                    </div>
                </div>
            )}

            {/* Submit */}
            {students.length > 0 && !consecutive?.should_skip && (
                <button onClick={submit} disabled={submitting || !selectedSec || !selectedSub || !selectedPer}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-primary/90">
                    {submitting ? <><Loader2 size={14} className="animate-spin" />Saving…</> : `Save Attendance (${present}P / ${absent}A)`}
                </button>
            )}
        </div>
    );
}