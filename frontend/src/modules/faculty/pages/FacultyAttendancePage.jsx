// src/modules/portal/faculty/pages/FacultyAttendancePage.jsx
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { CheckCircle, X, Clock, Loader2, Save, BookOpen, ChevronDown } from "lucide-react";
import axiosInstance from "../../../lib/axios.js";
import { EP }        from "../../../config/api.config.js";
import { notify }    from "../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import SearchSelect  from "../../../components/shared/SearchSelect.jsx";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const STATUS_OPTIONS = ["PRESENT","ABSENT","LATE","EXCUSED"];
const STATUS_COLOR   = {
  PRESENT:"bg-green-100 text-green-700 border-green-300",
  ABSENT: "bg-red-100 text-red-700 border-red-300",
  LATE:   "bg-amber-100 text-amber-700 border-amber-300",
  EXCUSED:"bg-blue-100 text-blue-700 border-blue-300",
};
const STATUS_ICON = { PRESENT:CheckCircle, ABSENT:X, LATE:Clock, EXCUSED:BookOpen };

export default function FacultyAttendancePage() {
  const faculty    = useSelector(s => s.auth?.user?.faculty);
  const [sessions, setSessions]   = useState([]);
  const [sessionId,setSessionId]  = useState("");
  const [sectionId,setSectionId]  = useState("");
  const [subjectId,setSubjectId]  = useState("");
  const [period,   setPeriod]     = useState("P1");
  const [date,     setDate]       = useState(new Date().toISOString().slice(0,10));
  const [students, setStudents]   = useState([]);
  const [attendance,setAttendance]= useState({});
  const [topics,   setTopics]     = useState([]);
  const [topicText,setTopicText]  = useState("");
  const [topicId,  setTopicId]    = useState("");
  const [saving,   setSaving]     = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [step,     setStep]       = useState("config"); // config | mark

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data||[];
      setSessions(list);
      const cur = list.find(s=>s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(()=>{});
  }, []);

  const loadStudents = useCallback(() => {
    if (!sectionId) return;
    setLoading(true);
    axiosInstance.get(EP.students.list + `?section_id=${sectionId}&limit=200`)
      .then(r => {
        const stds = r.data?.data?.students || r.data?.data || [];
        setStudents(stds);
        // Default all to PRESENT
        const init = {};
        stds.forEach(s => { init[s.id] = "PRESENT"; });
        setAttendance(init);
        setStep("mark");
      })
      .catch(() => notify.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [sectionId]);

  useEffect(() => {
    if (sectionId && subjectId) {
      // Load course structure topics for this faculty+subject+section
      axiosInstance.get(EP.timetable.courseStructure, {
        params:{ faculty_id:faculty?.id, subject_id:subjectId, section_id:sectionId, session_id:sessionId },
      }).then(r => setTopics(r.data?.data||[])).catch(()=>setTopics([]));
    }
  }, [sectionId, subjectId, sessionId]);

  const toggle = (studentId) => setAttendance(a => ({
    ...a,
    [studentId]: STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(a[studentId])+1) % STATUS_OPTIONS.length],
  }));

  const setAll = (status) => {
    const next = {};
    students.forEach(s => { next[s.id] = status; });
    setAttendance(next);
  };

  const save = async () => {
    if (!subjectId) { notify.error("Select subject first"); return; }
    setSaving(true);
    try {
      // Save attendance for each student
      const records = students.map(s => ({
        session_id:      sessionId,
        section_id:      sectionId,
        subject_id:      subjectId,
        student_id:      s.id,
        faculty_id:      faculty?.id,
        date,
        period_name:     period,
        status:          attendance[s.id] || "ABSENT",
      }));
      await axiosInstance.post("/attendance/bulk", { records });

      // Save topic taught
      if (topicText || topicId) {
        const selectedTopic = topics.find(t=>t.id===topicId);
        await axiosInstance.post(EP.timetable.topics, {
          session_id: sessionId, faculty_id: faculty?.id,
          subject_id: subjectId, section_id: sectionId,
          date, period_name: period,
          course_topic_id: topicId||null,
          topic_text: topicText || selectedTopic?.topic || "—",
        });
      }

      notify.success("Attendance & topics saved");
      setStep("config");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const presentCount = Object.values(attendance).filter(s=>s==="PRESENT").length;
  const absentCount  = Object.values(attendance).filter(s=>s==="ABSENT").length;
  const pendingTopics= topics.filter(t=>!t.is_covered);

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Mark Attendance</h1>
        <p className="text-sm text-muted-foreground">Mark attendance + log today's topic</p>
      </div>

      {/* Config step */}
      {step==="config" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className={sel}/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Period</Label>
              <input value={period} onChange={e=>setPeriod(e.target.value)} className={sel} placeholder="P1"/>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Section *</Label>
            <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
              subLabelKey="branch.name" value={sectionId} onChange={v=>setSectionId(v)} placeholder="Select section…"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject *</Label>
            <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
              subLabelKey="code" value={subjectId} onChange={v=>setSubjectId(v)} placeholder="Select subject…"/>
          </div>
          <Button className="w-full" disabled={!sectionId||!subjectId||loading} onClick={loadStudents}>
            {loading?<><Loader2 size={13} className="mr-1.5 animate-spin"/>Loading…</>:"Load Students"}
          </Button>
        </div>
      )}

      {/* Mark step */}
      {step==="mark" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold">{date} · {period}</p>
              <p className="text-xs text-muted-foreground">
                {students.length} students · {presentCount} present · {absentCount} absent
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setAll("PRESENT")} className="text-xs px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium">All Present</button>
              <button onClick={()=>setAll("ABSENT")}  className="text-xs px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">All Absent</button>
              <button onClick={()=>setStep("config")} className="text-xs px-2.5 py-1.5 bg-muted text-muted-foreground rounded-lg">Back</button>
            </div>
          </div>

          {/* Topic */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold">Today's Topic <span className="text-muted-foreground font-normal text-xs">(optional but recommended)</span></p>
            {pendingTopics.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Select from syllabus</Label>
                <select value={topicId} onChange={e=>{
                  const t=topics.find(t=>t.id===e.target.value);
                  setTopicId(e.target.value);
                  setTopicText(t?.topic||"");
                }} className={sel}>
                  <option value="">— Type below —</option>
                  {pendingTopics.map(t=>(
                    <option key={t.id} value={t.id}>U{t.unit_no}: {t.topic}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Topic taught</Label>
              <input value={topicText} onChange={e=>setTopicText(e.target.value)}
                className={sel} placeholder="What was taught in this lecture…"/>
            </div>
          </div>

          {/* Student list */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 px-4 py-2 border-b border-border">
              <span className="col-span-2">Student</span>
              <span>Roll No</span>
              <span className="text-center">Status</span>
            </div>
            <div className="divide-y divide-border max-h-[50vh] overflow-y-auto">
              {students.map(s=>{
                const status = attendance[s.id]||"PRESENT";
                const Icon   = STATUS_ICON[status];
                return (
                  <div key={s.id} className="grid grid-cols-4 items-center px-4 py-2.5 hover:bg-muted/10">
                    <div className="col-span-2">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.enrollment_no||""}</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{s.roll_no||"—"}</p>
                    <div className="flex justify-center">
                      <button onClick={()=>toggle(s.id)}
                        className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-semibold ${STATUS_COLOR[status]}`}>
                        <Icon size={10}/>{status}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button className="w-full" disabled={saving} onClick={save}>
            {saving?<><Loader2 size={13} className="mr-1.5 animate-spin"/>Saving…</>:<><Save size={13} className="mr-1.5"/>Save Attendance & Topics</>}
          </Button>
        </div>
      )}
    </div>
  );
}