// src/modules/adminss/attendance/pages/AttendancePage.jsx
// Faculty marks attendance | Admin views section attendance
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Loader2, Save, Users, AlertTriangle, Calendar, Search } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";

const sel = "h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const STATUS = { PRESENT:"PRESENT", ABSENT:"ABSENT", LATE:"LATE", EXCUSED:"EXCUSED", ON_LEAVE:"ON_LEAVE" };
const STATUS_UI = {
  PRESENT:  { label:"P", cls:"bg-green-100 text-green-700 border-green-300",  icon:CheckCircle },
  ABSENT:   { label:"A", cls:"bg-red-100   text-red-700   border-red-300",    icon:XCircle     },
  LATE:     { label:"L", cls:"bg-amber-100 text-amber-700 border-amber-300",  icon:Clock       },
  EXCUSED:  { label:"E", cls:"bg-blue-100  text-blue-700  border-blue-300",   icon:CheckCircle },
  ON_LEAVE: { label:"OL",cls:"bg-violet-100 text-violet-700 border-violet-300",icon:Calendar  },
};
const PCT_COLOR = p => p>=75?"text-green-600 font-semibold":p>=60?"text-amber-600 font-semibold":"text-red-600 font-bold";
const fmt = d => new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
const today = () => new Date().toISOString().slice(0,10);

export default function AttendancePage() {
  const user    = useSelector(s => s.auth?.user);
  const faculty = user?.faculty;
  const isFaculty = user?.role === "FACULTY";

  const [tab,      setTab]     = useState("mark");   // mark | view | summary
  const [sessions, setSessions]= useState([]);
  const [sessionId,setSessionId]=useState("");
  const [sections, setSections]= useState([]);
  const [searchParams] = useSearchParams();
  const [sectionId,setSectionId]=useState(searchParams.get("section_id")||"");
  const [subjects, setSubjects]= useState([]);
  const [subjectId,setSubjectId]=useState(searchParams.get("subject_id")||"");
  const [date,     setDate]    = useState(today());
  const [periodName,setPeriodName]=useState(searchParams.get("period_name")||"P1");
  const [students, setStudents]= useState([]);
  const [att,      setAtt]     = useState({});      // studentId → STATUS
  const [existing, setExisting]= useState([]);
  const [loading,  setLoading] = useState(false);
  const [saving,   setSaving]  = useState(false);
  const [summary,  setSummary] = useState([]);
  const [isHoliday,setIsHoliday]=useState(null);

  // Load sessions
  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data||[];
      setSessions(list);
      const cur = list.find(s=>s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(()=>{});
  }, []);

  // Load sections based on role
  useEffect(() => {
    if (!sessionId) return;
    const params = isFaculty && faculty?.id
      ? `?faculty_id=${faculty.id}&session_id=${sessionId}&limit=50`
      : `?session_id=${sessionId}&limit=200`;

    // For faculty: get their sections from workload
    if (isFaculty && faculty?.id) {
      axiosInstance.get(EP.timetable.workload + `?faculty_id=${faculty.id}&session_id=${sessionId}`)
        .then(r => {
          const wls = r.data?.data || [];
          const uniqueSecIds = [...new Set(wls.map(w=>w.section_id).filter(Boolean))];
          return axiosInstance.get(EP.sections.list + `?limit=200`).then(r2 => {
            const all = r2.data?.data?.sections || r2.data?.data || [];
            setSections(all.filter(s=>uniqueSecIds.includes(s.id)));
          });
        }).catch(()=>{});
    } else {
      axiosInstance.get(EP.sections.list + `?limit=200`)
        .then(r => setSections(r.data?.data?.sections || r.data?.data || []))
        .catch(()=>{});
    }
  }, [sessionId, faculty?.id]);

  // Load subjects when section changes
  useEffect(() => {
    if (!sectionId || !sessionId) return;
    const params = isFaculty && faculty?.id
      ? `?faculty_id=${faculty.id}&session_id=${sessionId}&section_id=${sectionId}`
      : `?section_id=${sectionId}&session_id=${sessionId}`;
    axiosInstance.get(EP.timetable.workload + params)
      .then(r => {
        const wls = r.data?.data || [];
        const seen = new Set();
        const subs = wls.map(w=>w.subject).filter(s=>s&&!seen.has(s.id)&&seen.add(s.id));
        setSubjects(subs);
        if (subs.length) setSubjectId(subs[0].id);
      }).catch(()=>{});
  }, [sectionId, sessionId, faculty?.id]);

  // Check if date is holiday
  useEffect(() => {
    if (!date) return;
    axiosInstance.get(`/holidays/check?date=${date}&session_id=${sessionId}&section_id=${sectionId}`)
      .then(r => setIsHoliday(r.data?.data))
      .catch(()=>setIsHoliday(null));
  }, [date, sessionId, sectionId]);

  const loadAttendance = useCallback(async () => {
    if (!sectionId || !subjectId || !sessionId || !date) return;
    setLoading(true);
    try {
      const [studRes, attRes] = await Promise.all([
        axiosInstance.get(EP.students.list + `?section_id=${sectionId}&limit=200`),
        axiosInstance.get(`/attendance/lecture?session_id=${sessionId}&section_id=${sectionId}&subject_id=${subjectId}&date=${date}&period_name=${periodName}`).catch(()=>({data:{data:[]}})),
      ]);
      const studs = studRes.data?.data?.students || studRes.data?.data || [];
      const records = attRes.data?.data || [];
      setStudents(studs);
      setExisting(records);
      // Pre-fill
      const init = {};
      studs.forEach(s => {
        const r = records.find(r=>r.student_id===s.id);
        init[s.id] = r ? r.status : "PRESENT";
      });
      setAtt(init);
    } catch { notify.error("Failed to load students"); }
    finally { setLoading(false); }
  }, [sectionId, subjectId, sessionId, date, periodName]);

  useEffect(() => { if (tab==="mark") loadAttendance(); }, [sectionId, subjectId, date, periodName, tab]);

  const markAll = (status) => {
    const next = {};
    students.forEach(s => { next[s.id] = status; });
    setAtt(next);
  };

  const save = async () => {
    if (!sectionId || !subjectId || !sessionId) { notify.error("Select section, subject & session"); return; }
    if (isHoliday?.is_holiday && isHoliday?.holidays?.[0]?.affects_attendance) {
      if (!confirm(`${date} is marked as holiday (${isHoliday.holidays[0].name}). Attendance will not count. Continue?`)) return;
    }
    setSaving(true);
    try {
      const records = students.map(s => ({
        session_id:      sessionId,
        section_id:      sectionId,
        subject_id:      subjectId,
        student_id:      s.id,
        faculty_id:      faculty?.id || null,
        date,
        period_name:     periodName,
        period_config_id:null,
        status:          att[s.id] || "PRESENT",
      }));
      await axiosInstance.post("/attendance/mark", { records });
      notify.success(`Attendance saved for ${records.length} students`);
      loadAttendance();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  const loadSummary = async () => {
    if (!sectionId || !sessionId) return;
    setLoading(true);
    try {
      const r = await axiosInstance.get(`/attendance/summary/section?session_id=${sessionId}&section_id=${sectionId}&subject_id=${subjectId||""}`);
      setSummary(r.data?.data || []);
    } catch { notify.error("Failed"); }
    finally{ setLoading(false); }
  };
  useEffect(() => { if (tab==="summary") loadSummary(); }, [tab, sectionId, sessionId, subjectId]);

  const present = Object.values(att).filter(s=>s==="PRESENT").length;
  const absent  = Object.values(att).filter(s=>s==="ABSENT").length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-2">
        <CheckCircle size={20} className="text-primary"/>
        <div>
          <h1 className="text-xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark or view student attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {["mark","summary"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab===t?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t==="mark"?"Mark Attendance":"Summary / Reports"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Session</label>
          <select value={sessionId} onChange={e=>setSessionId(e.target.value)} className={sel + " w-36"}>
            {sessions.map(s=><option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Section</label>
          <select value={sectionId} onChange={e=>setSectionId(e.target.value)} className={sel + " w-40"}>
            <option value="">Select section…</option>
            {sections.map(s=><option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Subject</label>
          <select value={subjectId} onChange={e=>setSubjectId(e.target.value)} className={sel + " w-44"}>
            <option value="">Select subject…</option>
            {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {tab==="mark" && <>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="h-10 w-40"/>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Period</label>
            <select value={periodName} onChange={e=>setPeriodName(e.target.value)} className={sel + " w-24"}>
              {["P1","P2","P3","P4","P5","P6","P7","P8","Lab1","Lab2","Lab3"].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </>}
      </div>

      {/* Holiday warning */}
      {isHoliday?.is_holiday && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
          <AlertTriangle size={14}/>
          <span><strong>{isHoliday.holidays[0]?.name}</strong> — {isHoliday.holidays[0]?.affects_attendance?"Attendance will NOT count towards percentage.":"Holiday (attendance still counted)."}</span>
        </div>
      )}

      {/* MARK TAB */}
      {tab==="mark" && (
        <div className="space-y-3">
          {students.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-medium">{present} Present</span>
                <span className="text-red-600 font-medium">{absent} Absent</span>
                <span className="text-muted-foreground">{students.length} Total</span>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>markAll("PRESENT")} className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium">All Present</button>
                <button onClick={()=>markAll("ABSENT")}  className="text-xs px-3 py-1.5 rounded-lg bg-red-100   text-red-700   hover:bg-red-200   font-medium">All Absent</button>
                <Button size="sm" disabled={saving} onClick={save}>
                  {saving?<Loader2 size={12} className="mr-1 animate-spin"/>:<Save size={12} className="mr-1"/>}Save
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
          ) : students.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
              {sectionId ? "No students in this section" : "Select a section to mark attendance"}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 px-4 py-2 border-b border-border">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Name</span>
                <span className="col-span-2">Roll No</span>
                <span className="col-span-5">Status</span>
              </div>
              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                {students.map((s,i)=>{
                  const curStatus = att[s.id]||"PRESENT";
                  return (
                    <div key={s.id} className="grid grid-cols-12 items-center px-4 py-2 hover:bg-muted/10">
                      <span className="col-span-1 text-xs text-muted-foreground">{i+1}</span>
                      <div className="col-span-4 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                      </div>
                      <span className="col-span-2 text-xs font-mono text-muted-foreground">{s.roll_no||"—"}</span>
                      <div className="col-span-5 flex gap-1 flex-wrap">
                        {Object.entries(STATUS_UI).map(([k,v])=>(
                          <button key={k} onClick={()=>setAtt(a=>({...a,[s.id]:k}))}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${curStatus===k?v.cls:"border-border text-muted-foreground hover:bg-muted"}`}>
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUMMARY TAB */}
      {tab==="summary" && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
          ) : summary.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
              {sectionId ? "No attendance data yet" : "Select a section to view summary"}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 px-4 py-2 border-b border-border">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Name</span>
                <span className="col-span-2">Roll No</span>
                <span className="col-span-1 text-center">Present</span>
                <span className="col-span-1 text-center">Absent</span>
                <span className="col-span-1 text-center">Total</span>
                <span className="col-span-2 text-center">%</span>
              </div>
              <div className="divide-y divide-border max-h-[65vh] overflow-y-auto">
                {summary.map((s,i)=>{
                  const pct = s.total_classes ? Math.round((s.present_count/s.total_classes)*100) : 0;
                  return (
                    <div key={s.student_id||i} className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-muted/10">
                      <span className="col-span-1 text-xs text-muted-foreground">{i+1}</span>
                      <div className="col-span-4 min-w-0">
                        <p className="text-sm font-medium truncate">{s.student?.name||s.name}</p>
                      </div>
                      <span className="col-span-2 text-xs font-mono text-muted-foreground">{s.student?.roll_no||s.roll_no||"—"}</span>
                      <span className="col-span-1 text-xs text-center text-green-600 font-medium">{s.present_count||0}</span>
                      <span className="col-span-1 text-xs text-center text-red-600">{s.absent_count||0}</span>
                      <span className="col-span-1 text-xs text-center text-muted-foreground">{s.total_classes||0}</span>
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <span className={`text-sm ${PCT_COLOR(pct)}`}>{pct}%</span>
                        {pct < 75 && <AlertTriangle size={12} className="text-red-500"/>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}