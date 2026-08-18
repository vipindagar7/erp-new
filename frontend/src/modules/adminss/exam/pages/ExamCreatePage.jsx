// src/modules/adminss/exam/pages/ExamCreatePage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Loader2, ClipboardList } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const EXAM_TYPES = ["CLASS_TEST","SESSIONAL_1","SESSIONAL_2","MID_TERM","PRE_UNIVERSITY","UNIVERSITY_THEORY","UNIVERSITY_PRACTICAL","INTERNAL_PRACTICAL"];
const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";
const F = ({label,required,children}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
  </div>
);

export default function ExamCreatePage() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const [form, setForm] = useState({
    title:"", exam_type:"SESSIONAL_1", start_date:"", end_date:"",
    seating_auto:true, hall_ticket_enabled:true, instructions:"",
  });
  const [schedule, setSchedule] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.sessions.list),
      axiosInstance.get(EP.subjects.list + "?limit=200"),
      isEdit ? axiosInstance.get(EP.exam.byId(id)) : Promise.resolve({data:{data:null}}),
    ]).then(([sRes, subRes, eRes]) => {
      setSessions(sRes.data?.data || []);
      setSubjects(subRes.data?.data?.subjects || subRes.data?.data || []);
      const cur = (sRes.data?.data||[]).find(s=>s.is_current);
      if (cur) setSessionId(cur.id);
      if (isEdit && eRes.data?.data) {
        const e = eRes.data.data;
        setForm({ title:e.title, exam_type:e.exam_type, start_date:e.start_date?.slice(0,10), end_date:e.end_date?.slice(0,10), seating_auto:e.seating_auto, hall_ticket_enabled:e.hall_ticket_enabled, instructions:e.instructions||"" });
        setSchedule(e.schedule?.map(s=>({ subject_id:s.subject_id, exam_date:s.exam_date?.slice(0,10), start_time:s.start_time, end_time:s.end_time, max_marks:s.max_marks, passing_marks:s.passing_marks, is_practical:s.is_practical })) || []);
        if (e.session_id) setSessionId(e.session_id);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const set = k => e => setForm(f => ({...f,[k]: e.target.type==="checkbox"?e.target.checked:e.target.value}));

  const addScheduleRow = () => setSchedule(prev => [...prev, { subject_id:"", exam_date:form.start_date||"", start_time:"10:00", end_time:"13:00", max_marks:100, passing_marks:40, is_practical:false }]);
  const removeScheduleRow = i => setSchedule(prev => prev.filter((_,idx)=>idx!==i));
  const setScheduleRow = (i, k, v) => setSchedule(prev => prev.map((r,idx)=>idx===i?{...r,[k]:v}:r));

  const save = async () => {
    if (!form.title) { notify.error("Title required"); return; }
    if (!form.start_date || !form.end_date) { notify.error("Dates required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, session_id:sessionId };
      let examId = id;
      if (isEdit) {
        await axiosInstance.patch(EP.exam.update(id), payload);
      } else {
        const res = await axiosInstance.post(EP.exam.create, payload);
        examId = res.data?.data?.id;
      }
      // Save schedule entries
      for (const s of schedule) {
        if (!s.subject_id) continue;
        await axiosInstance.post(EP.exam.schedule(examId), s).catch(() => {});
      }
      notify.success(isEdit ? "Exam updated" : "Exam created");
      navigate(`/admin/exam/${examId}`);
    } catch(e) { notify.error(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/exam")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex-1 flex items-center gap-2">
          <ClipboardList size={18} className="text-primary"/>{isEdit?"Edit Exam":"New Exam"}
        </h1>
        <button disabled={saving} onClick={save}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
          {saving?"Saving…":"Save"}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exam Details</p>
        <F label="Exam Title" required>
          <input className={inp} value={form.title} onChange={set("title")} placeholder="e.g. Sessional Test-1 (2025-26)"/>
        </F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Exam Type" required>
            <select className={sel} value={form.exam_type} onChange={set("exam_type")}>
              {EXAM_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select>
          </F>
          <F label="Session">
            <select className={sel} value={sessionId} onChange={e=>setSessionId(e.target.value)}>
              {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </F>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Start Date" required><input className={inp} type="date" value={form.start_date} onChange={set("start_date")}/></F>
          <F label="End Date" required><input className={inp} type="date" value={form.end_date} onChange={set("end_date")}/></F>
        </div>
        <F label="Instructions (optional)">
          <textarea className={inp+" h-20 py-2 resize-none"} value={form.instructions} onChange={set("instructions")} placeholder="Instructions for students…"/>
        </F>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-muted/20 rounded-xl border border-border text-sm">
            <input type="checkbox" checked={form.seating_auto} onChange={set("seating_auto")} className="w-4 h-4 accent-primary"/>
            Auto-generate seating
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-muted/20 rounded-xl border border-border text-sm">
            <input type="checkbox" checked={form.hall_ticket_enabled} onChange={set("hall_ticket_enabled")} className="w-4 h-4 accent-primary"/>
            Enable hall tickets
          </label>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exam Schedule</p>
          <button onClick={addScheduleRow} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus size={12}/>Add Subject
          </button>
        </div>
        {schedule.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No subjects added yet. <button onClick={addScheduleRow} className="text-primary hover:underline">Add one →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.map((row, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 items-end">
                <div className="col-span-2">
                  <select className={sel} value={row.subject_id} onChange={e=>setScheduleRow(i,"subject_id",e.target.value)}>
                    <option value="">Subject…</option>
                    {subjects.map(s=><option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <input type="date" className={inp} value={row.exam_date} onChange={e=>setScheduleRow(i,"exam_date",e.target.value)}/>
                <input type="time" className={inp} value={row.start_time} onChange={e=>setScheduleRow(i,"start_time",e.target.value)}/>
                <input type="number" placeholder="Max Marks" className={inp} value={row.max_marks} onChange={e=>setScheduleRow(i,"max_marks",e.target.value)}/>
                <button onClick={()=>removeScheduleRow(i)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button disabled={saving} onClick={save}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
          {isEdit?"Save Changes":"Create Exam"}
        </button>
      </div>
    </div>
  );
}
