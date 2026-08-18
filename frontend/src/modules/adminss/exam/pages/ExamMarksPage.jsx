// src/modules/adminss/exam/pages/ExamMarksPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function ExamMarksPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get("subject_id");
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [marks, setMarks] = useState({}); // { student_id: { marks, is_absent } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.exam.byId(id)),
    ]).then(([eRes]) => {
      const e = eRes.data?.data;
      setExam(e);
      const sch = e?.schedule?.find(s => s.subject_id === subjectId);
      setSubject(sch?.subject || { name: "Subject" });

      // Load students from exam's sections
      const sectionIds = [...new Set(e?.schedule?.flatMap(s => s.section_ids)||[])];
      if (sectionIds.length) {
        axiosInstance.get(EP.students.all + `?limit=500&status=ACTIVE`).then(sRes => {
          setEnrollments(sRes.data?.data || []);
          // Init marks
          const init = {};
          (sRes.data?.data||[]).forEach(s => { init[s.id] = { marks:"", is_absent:false }; });
          setMarks(init);
        });
      }
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id, subjectId]);

  const sch = exam?.schedule?.find(s => s.subject_id === subjectId);
  const maxMarks = sch?.max_marks || 100;

  const setMark = (sid, field, val) => setMarks(prev => ({ ...prev, [sid]: { ...prev[sid], [field]: val } }));
  const markAllPresent = () => setMarks(prev => {
    const next = { ...prev };
    Object.keys(next).forEach(sid => { next[sid] = { ...next[sid], is_absent:false }; });
    return next;
  });

  const save = async () => {
    if (!subjectId) { notify.error("No subject selected"); return; }
    setSaving(true);
    try {
      const records = enrollments.map(s => ({
        student_id: s.id,
        marks: marks[s.id]?.is_absent ? 0 : parseFloat(marks[s.id]?.marks) || 0,
        is_absent: marks[s.id]?.is_absent || false,
        max_marks: maxMarks,
        exam_type: exam?.exam_type,
      }));
      await axiosInstance.post(EP.exam.marks(id, subjectId), { marks: records });
      notify.success("Marks saved");
      navigate(`/admin/exam/${id}`);
    } catch(e) { notify.error(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  const filled = Object.values(marks).filter(m => m.marks !== "" || m.is_absent).length;
  const absent  = Object.values(marks).filter(m => m.is_absent).length;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/exam/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Enter Marks</h1>
          <p className="text-sm text-muted-foreground">{exam?.title} · {subject?.name} · Max: {maxMarks}</p>
        </div>
        <button disabled={saving} onClick={save}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
          {saving?"Saving…":"Save Marks"}
        </button>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-6">
        <div><p className="text-2xl font-bold text-green-600">{filled}</p><p className="text-xs text-muted-foreground">Filled</p></div>
        <div><p className="text-2xl font-bold text-red-500">{absent}</p><p className="text-xs text-muted-foreground">Absent</p></div>
        <div><p className="text-2xl font-bold text-muted-foreground">{enrollments.length - filled}</p><p className="text-xs text-muted-foreground">Pending</p></div>
        <button onClick={markAllPresent} className="ml-auto text-xs text-primary hover:underline">Mark all present</button>
      </div>

      {/* Marks table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {enrollments.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No students found for this exam</div>
          )}
          {enrollments.map((s, idx) => {
            const m = marks[s.id] || { marks:"", is_absent:false };
            return (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${m.is_absent?"bg-red-50/30":""}`}>
                <span className="text-xs text-muted-foreground w-6 text-center">{idx+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.roll_no} · {s.section?.name}</p>
                </div>
                {m.is_absent ? (
                  <span className="text-xs font-bold text-red-500 w-20 text-center">ABSENT</span>
                ) : (
                  <input
                    type="number" min="0" max={maxMarks}
                    value={m.marks}
                    onChange={e => setMark(s.id,"marks",e.target.value)}
                    placeholder="Marks"
                    className="w-20 h-9 px-3 rounded-lg border border-input bg-background text-sm text-center outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
                <span className="text-xs text-muted-foreground">/{maxMarks}</span>
                <button onClick={() => setMark(s.id,"is_absent",!m.is_absent)}
                  className={`p-1.5 rounded-lg transition-colors ${m.is_absent?"bg-red-100 text-red-600 hover:bg-red-200":"hover:bg-muted text-muted-foreground"}`}>
                  {m.is_absent ? <XCircle size={14}/> : <CheckCircle size={14}/>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
