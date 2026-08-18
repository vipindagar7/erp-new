// src/modules/adminss/training/pages/TrainingAttendancePage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

const STATUS_OPTS = [
  { value:"PRESENT",  label:"P", color:"bg-green-600 text-white",   icon:CheckCircle  },
  { value:"ABSENT",   label:"A", color:"bg-red-500 text-white",     icon:XCircle      },
  { value:"LATE",     label:"L", color:"bg-amber-500 text-white",   icon:Clock        },
  { value:"EXCUSED",  label:"E", color:"bg-blue-500 text-white",    icon:AlertCircle  },
];
const TYPE_OPTS = ["REGULAR","EXTRA","IRREGULAR"];

export default function TrainingAttendancePage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [training,     setTraining]     = useState(null);
  const [enrollments,  setEnrollments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  const [date,          setDate]          = useState(new Date().toISOString().slice(0,10));
  const [sessionLabel,  setSessionLabel]  = useState("Day 1");
  const [attendanceType,setAttendanceType]= useState("REGULAR");
  const [records,       setRecords]       = useState({});  // { student_id: status }

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.training.byId(id)),
      axiosInstance.get(EP.training.enrollments(id), { params:{ limit:200, status:"ENROLLED" } }),
    ]).then(([tRes, eRes]) => {
      setTraining(tRes.data?.data);
      const enrolled = eRes.data?.data?.enrollments || [];
      setEnrollments(enrolled);
      // Default all to PRESENT
      const def = {};
      enrolled.forEach(e => { def[e.student?.id] = "PRESENT"; });
      setRecords(def);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStatus = (student_id) => {
    const opts = ["PRESENT","ABSENT","LATE","EXCUSED"];
    setRecords(prev => ({
      ...prev,
      [student_id]: opts[(opts.indexOf(prev[student_id]||"PRESENT") + 1) % opts.length],
    }));
  };

  const setAll = (status) => {
    const all = {};
    enrollments.forEach(e => { all[e.student?.id] = status; });
    setRecords(all);
  };

  const save = async () => {
    if (!date)         { notify.error("Select date");          return; }
    if (!sessionLabel) { notify.error("Enter session label");  return; }
    setSaving(true);
    try {
      const recs = enrollments.map(e => ({
        student_id:      e.student?.id,
        date,
        session_label:   sessionLabel,
        status:          records[e.student?.id] || "PRESENT",
        attendance_type: attendanceType,
      }));
      await axiosInstance.post(EP.training.attendance(id), { records: recs });
      notify.success(`Attendance saved — ${recs.length} students`);
      navigate(`/admin/training/${id}`);
    } catch (e) {
      notify.error(e.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const present = Object.values(records).filter(s => s === "PRESENT").length;
  const absent  = Object.values(records).filter(s => s === "ABSENT").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/training/${id}`)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">{training?.title}</p>
        </div>
        <button disabled={saving} onClick={save}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
          {saving ? "Saving…" : "Save Attendance"}
        </button>
      </div>

      {/* Session Config */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Details</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Session Label</label>
            <input value={sessionLabel} onChange={e => setSessionLabel(e.target.value)}
              placeholder="Day 1 / Session 2 / Week 3…"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Attendance Type</label>
            <select value={attendanceType} onChange={e => setAttendanceType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
              {TYPE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">{enrollments.length} students</span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-green-600 font-medium">{present} Present</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-red-500 font-medium">{absent} Absent</span>
        </div>
        {["PRESENT","ABSENT"].map(s => (
          <button key={s} onClick={() => setAll(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
              ${s==="PRESENT" ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"}`}>
            All {s}
          </button>
        ))}
      </div>

      {/* Student list */}
      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
          No active enrollments
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {enrollments.map((e, idx) => {
              const sid    = e.student?.id;
              const status = records[sid] || "PRESENT";
              const S      = STATUS_OPTS.find(o => o.value === status) || STATUS_OPTS[0];
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <span className="text-xs text-muted-foreground w-6 text-center">{idx+1}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {e.student?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{e.student?.name}</p>
                    <p className="text-xs text-muted-foreground">{e.student?.roll_no} · {e.student?.section?.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{e.attendance_pct?.toFixed(0)||0}%</span>
                  </div>
                  {/* Status toggle button */}
                  <button onClick={() => toggleStatus(sid)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all hover:scale-105 ${S.color}`}>
                    {S.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
        {STATUS_OPTS.map(s => (
          <span key={s.value} className="flex items-center gap-1">
            <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${s.color}`}>{s.label}</span>
            {s.value}
          </span>
        ))}
        <span className="text-muted-foreground ml-2">· Tap to cycle through statuses</span>
      </div>
    </div>
  );
}
