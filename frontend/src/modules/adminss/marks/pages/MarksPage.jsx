// src/modules/adminss/marks/pages/MarksPage.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { GraduationCap, Plus, Save, Loader2, Search, Download } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const EXAM_TYPES = ["INTERNAL","MID_TERM","END_TERM","PRACTICAL","ASSIGNMENT","QUIZ","PROJECT"];
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

const GRADE_THRESHOLDS = [
  { min:90, grade:"A+", cls:"text-green-700 bg-green-100"  },
  { min:80, grade:"A",  cls:"text-green-600 bg-green-50"   },
  { min:70, grade:"B+", cls:"text-blue-700  bg-blue-100"   },
  { min:60, grade:"B",  cls:"text-blue-600  bg-blue-50"    },
  { min:50, grade:"C",  cls:"text-amber-700 bg-amber-100"  },
  { min:40, grade:"D",  cls:"text-orange-700 bg-orange-100"},
  { min:0,  grade:"F",  cls:"text-red-700   bg-red-100"    },
];
const getGrade = (marks, max) => {
  const pct = (marks/max)*100;
  return GRADE_THRESHOLDS.find(g => pct >= g.min) || GRADE_THRESHOLDS[GRADE_THRESHOLDS.length-1];
};

export default function MarksPage() {
  const user     = useSelector(s => s.auth?.user);
  const faculty  = user?.faculty;
  const isFaculty= user?.role === "FACULTY";

  const [sessions,   setSessions]   = useState([]);
  const [sessionId,  setSessionId]  = useState("");
  const [sectionId,  setSectionId]  = useState("");
  const [subjectId,  setSubjectId]  = useState("");
  const [examType,   setExamType]   = useState("INTERNAL");
  const [examName,   setExamName]   = useState("");
  const [maxMarks,   setMaxMarks]   = useState(100);
  const [students,   setStudents]   = useState([]);
  const [marksData,  setMarksData]  = useState({});
  const [existing,   setExisting]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [step,       setStep]       = useState("config"); // config | entry

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data||[];
      setSessions(list);
      const cur = list.find(s=>s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(()=>{});
  }, []);

  const loadStudents = async () => {
    if (!sectionId || !subjectId) { notify.error("Select section and subject"); return; }
    setLoading(true);
    try {
      const [studRes, markRes] = await Promise.all([
        axiosInstance.get(EP.students.list + `?section_id=${sectionId}&limit=200`),
        axiosInstance.get(`/marks?section_id=${sectionId}&subject_id=${subjectId}&session_id=${sessionId}&exam_type=${examType}&exam_name=${examName||""}`).catch(()=>({data:{data:[]}})),
      ]);
      const stds = studRes.data?.data?.students || studRes.data?.data || [];
      const marks = markRes.data?.data || [];
      setStudents(stds);
      setExisting(marks);
      const init = {};
      stds.forEach(s => {
        const existing_mark = marks.find(m => m.student_id === s.id);
        init[s.id] = { marks: existing_mark?.marks_obtained ?? "", is_absent: existing_mark?.is_absent || false };
      });
      setMarksData(init);
      setStep("entry");
    } catch { notify.error("Failed to load students"); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id:     s.id,
        subject_id:     subjectId,
        section_id:     sectionId,
        session_id:     sessionId,
        faculty_id:     faculty?.id || null,
        exam_type:      examType,
        exam_name:      examName || null,
        max_marks:      parseFloat(maxMarks),
        marks_obtained: marksData[s.id]?.is_absent ? null : parseFloat(marksData[s.id]?.marks||0),
        is_absent:      Boolean(marksData[s.id]?.is_absent),
      }));
      await axiosInstance.post("/marks/bulk", { records });
      notify.success(`Marks saved for ${records.length} students`);
      setStep("config");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const classAvg = students.length
    ? (students.filter(s=>!marksData[s.id]?.is_absent)
        .reduce((sum,s)=>sum+(parseFloat(marksData[s.id]?.marks)||0),0) /
       Math.max(1,students.filter(s=>!marksData[s.id]?.is_absent).length)).toFixed(1)
    : 0;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-2">
        <GraduationCap size={20} className="text-primary"/>
        <div><h1 className="text-xl font-bold">Marks & Grades</h1>
          <p className="text-sm text-muted-foreground">Enter exam marks per student</p>
        </div>
      </div>

      {step==="config" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Session</Label>
              <select value={sessionId} onChange={e=>setSessionId(e.target.value)} className={sel}>
                {sessions.map(s=><option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exam Type</Label>
              <select value={examType} onChange={e=>setExamType(e.target.value)} className={sel}>
                {EXAM_TYPES.map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
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
            <div className="space-y-1.5">
              <Label className="text-xs">Exam Name (optional)</Label>
              <Input value={examName} onChange={e=>setExamName(e.target.value)} placeholder="Unit Test 1, Mid Sem…"/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Marks</Label>
              <Input type="number" value={maxMarks} onChange={e=>setMaxMarks(e.target.value)} placeholder="100"/>
            </div>
          </div>
          <Button onClick={loadStudents} disabled={loading||!sectionId||!subjectId} className="w-full">
            {loading?<Loader2 size={13} className="mr-1.5 animate-spin"/>:<Search size={13} className="mr-1.5"/>}Load Students
          </Button>
        </div>
      )}

      {step==="entry" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="bg-card border border-border rounded-xl px-4 py-2.5 flex gap-4 text-sm">
              <span>{students.length} students</span>
              <span className="text-muted-foreground">·</span>
              <span>Max: {maxMarks}</span>
              <span className="text-muted-foreground">·</span>
              <span>Class Avg: <strong className="text-primary">{classAvg}</strong></span>
              <span className="text-muted-foreground">·</span>
              <span className="text-amber-600">{Object.values(marksData).filter(m=>m.is_absent).length} absent</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={()=>setStep("config")}>← Back</Button>
              <Button size="sm" disabled={saving} onClick={save}>
                {saving?<Loader2 size={12} className="mr-1.5 animate-spin"/>:<Save size={12} className="mr-1.5"/>}Save Marks
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 px-4 py-2 border-b border-border">
              <span className="col-span-1">#</span>
              <span className="col-span-3">Name</span>
              <span className="col-span-2">Roll No</span>
              <span className="col-span-2 text-center">Absent</span>
              <span className="col-span-2 text-center">Marks /{maxMarks}</span>
              <span className="col-span-2 text-center">Grade</span>
            </div>
            <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {students.map((s,i)=>{
                const m = marksData[s.id]||{};
                const grade = m.marks && !m.is_absent ? getGrade(m.marks, maxMarks) : null;
                return (
                  <div key={s.id} className={`grid grid-cols-12 items-center px-4 py-2 ${m.is_absent?"opacity-50 bg-red-50/30":""}`}>
                    <span className="col-span-1 text-xs text-muted-foreground">{i+1}</span>
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                    </div>
                    <span className="col-span-2 text-xs font-mono text-muted-foreground">{s.roll_no||"—"}</span>
                    <div className="col-span-2 flex justify-center">
                      <input type="checkbox" checked={!!m.is_absent}
                        onChange={e=>setMarksData(d=>({...d,[s.id]:{...d[s.id],is_absent:e.target.checked,marks:""} }))}
                        className="w-4 h-4 accent-red-500"/>
                    </div>
                    <div className="col-span-2">
                      <input type="number" disabled={m.is_absent} value={m.marks||""}
                        onChange={e=>{
                          const v = Math.min(parseFloat(e.target.value)||0, parseFloat(maxMarks));
                          setMarksData(d=>({...d,[s.id]:{...d[s.id],marks:v}}));
                        }}
                        className={`w-full h-8 px-2 rounded-lg border text-sm text-center outline-none focus:ring-2 focus:ring-ring
                          ${m.is_absent?"bg-muted border-border text-muted-foreground":"border-input bg-background"}`}
                        placeholder="—" min={0} max={maxMarks}/>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      {grade && (
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${grade.cls}`}>{grade.grade}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}