// src/modules/adminss/assignment/pages/AssignmentCreatePage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, FileText } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";
const F = ({label,required,hint,children}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}{hint&&<span className="text-muted-foreground font-normal ml-1">({hint})</span>}</label>
    {children}
  </div>
);
const G2 = ({children}) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const Sec = ({title,children}) => (
  <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
    {children}
  </div>
);
const Toggle = ({label,desc,checked,onChange}) => (
  <label className="flex items-start gap-3 cursor-pointer p-3 bg-muted/20 rounded-xl border border-border">
    <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} className="w-4 h-4 mt-0.5 accent-primary shrink-0"/>
    <div><p className="text-sm font-medium">{label}</p>{desc&&<p className="text-xs text-muted-foreground">{desc}</p>}</div>
  </label>
);

export default function AssignmentCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title:"", description:"", instructions:"", subject_id:"", session_id:"",
    section_ids:[], deadline:"", total_marks:10, passing_marks:4,
    allow_late:true, late_penalty_pct:5, max_late_days:3,
    allow_file:true, allow_text:true, plagiarism_check:true, plagiarism_threshold:30,
  });
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.subjects.list + "?limit=200"),
      axiosInstance.get(EP.sections.list + "?status=ACTIVE&limit=200"),
      axiosInstance.get(EP.sessions.list),
      isEdit ? axiosInstance.get(EP.assignments.byId(id)) : Promise.resolve({data:{data:null}}),
    ]).then(([subRes,secRes,sesRes,aRes]) => {
      setSubjects(subRes.data?.data?.subjects || subRes.data?.data || []);
      setSections(secRes.data?.data?.sections || secRes.data?.data || []);
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s=>s.is_current);
      if (cur && !isEdit) setForm(f => ({...f, session_id:cur.id}));
      if (isEdit && aRes.data?.data) {
        const a = aRes.data.data;
        setForm({ title:a.title, description:a.description||"", instructions:a.instructions||"", subject_id:a.subject_id, session_id:a.session_id, section_ids:a.section_ids||[], deadline:a.deadline?.slice(0,16)||"", total_marks:a.total_marks, passing_marks:a.passing_marks, allow_late:a.allow_late, late_penalty_pct:a.late_penalty_pct, max_late_days:a.max_late_days, allow_file:a.allow_file, allow_text:a.allow_text, plagiarism_check:a.plagiarism_check, plagiarism_threshold:a.plagiarism_threshold });
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const set = k => e => {
    const v = e?.target ? (e.target.type==="checkbox"?e.target.checked:e.target.value) : e;
    setForm(f => ({...f,[k]:v}));
  };

  const toggleSection = sid => setForm(f => ({...f, section_ids: f.section_ids.includes(sid) ? f.section_ids.filter(s=>s!==sid) : [...f.section_ids,sid]}));

  const save = async (publish=false) => {
    if (!form.title) { notify.error("Title required"); return; }
    if (!form.subject_id) { notify.error("Subject required"); return; }
    if (!form.deadline) { notify.error("Deadline required"); return; }
    setSaving(true);
    try {
      let assignId = id;
      if (isEdit) {
        await axiosInstance.patch(EP.assignments.update(id), form);
      } else {
        const res = await axiosInstance.post(EP.assignments.create, form);
        assignId = res.data?.data?.id;
      }
      if (publish && assignId) {
        await axiosInstance.post(EP.assignments.publish(assignId));
        notify.success("Assignment published");
      } else {
        notify.success(isEdit ? "Updated" : "Saved as draft");
      }
      navigate(assignId ? `/admin/assignments/${assignId}` : "/admin/assignments");
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/assignments")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex-1 flex items-center gap-2">
          <FileText size={18} className="text-primary"/>{isEdit?"Edit Assignment":"New Assignment"}
        </h1>
        <button disabled={saving} onClick={() => save(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40 disabled:opacity-60">Save Draft</button>
        <button disabled={saving} onClick={() => save(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}
          Publish
        </button>
      </div>

      <Sec title="Basic Info">
        <F label="Title" required><input className={inp} value={form.title} onChange={set("title")} placeholder="e.g. DSA Assignment 3 — Graphs"/></F>
        <G2>
          <F label="Subject" required>
            <select className={sel} value={form.subject_id} onChange={set("subject_id")}>
              <option value="">Select subject…</option>
              {subjects.map(s=><option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </F>
          <F label="Session">
            <select className={sel} value={form.session_id} onChange={set("session_id")}>
              {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </F>
        </G2>
        <F label="Description / Problem Statement">
          <textarea className={inp+" h-20 py-2 resize-none"} value={form.description} onChange={set("description")} placeholder="Describe the assignment…"/>
        </F>
        <F label="Instructions">
          <textarea className={inp+" h-16 py-2 resize-none"} value={form.instructions} onChange={set("instructions")} placeholder="Submission instructions, format, guidelines…"/>
        </F>
      </Sec>

      <Sec title="Assign to Sections">
        <p className="text-xs text-muted-foreground">Select one or more sections</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {sections.map(s => {
            const sel2 = form.section_ids.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggleSection(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-left transition-all
                  ${sel2?"border-primary bg-primary/5 text-primary":"border-border hover:bg-muted/30"}`}>
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${sel2?"bg-primary border-primary":"border-input"}`}>
                  {sel2 && <span className="text-[8px] text-primary-foreground">✓</span>}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">Sem {s.semester}</p>
                </div>
              </button>
            );
          })}
        </div>
        {form.section_ids.length > 0 && <p className="text-xs text-primary">{form.section_ids.length} section(s) selected</p>}
      </Sec>

      <Sec title="Deadline & Marks">
        <G2>
          <F label="Deadline" required><input className={inp} type="datetime-local" value={form.deadline} onChange={set("deadline")}/></F>
          <F label="Total Marks" required><input className={inp} type="number" min="1" value={form.total_marks} onChange={set("total_marks")}/></F>
        </G2>
        <Toggle label="Allow Late Submissions" desc="Students can submit after deadline (with penalty)"
          checked={form.allow_late} onChange={v=>setForm(f=>({...f,allow_late:v}))}/>
        {form.allow_late && (
          <G2>
            <F label="Penalty % per day"><input className={inp} type="number" min="0" max="100" value={form.late_penalty_pct} onChange={set("late_penalty_pct")}/></F>
            <F label="Max late days allowed"><input className={inp} type="number" min="1" value={form.max_late_days} onChange={set("max_late_days")}/></F>
          </G2>
        )}
      </Sec>

      <Sec title="Submission Type">
        <Toggle label="Allow File Upload" desc="Students can upload PDF, DOC, ZIP, etc." checked={form.allow_file} onChange={v=>setForm(f=>({...f,allow_file:v}))}/>
        <Toggle label="Allow Text Answer"  desc="Students can type their answer directly"  checked={form.allow_text} onChange={v=>setForm(f=>({...f,allow_text:v}))}/>
        <Toggle label="Enable Plagiarism Check" desc="Flag similar submissions automatically"
          checked={form.plagiarism_check} onChange={v=>setForm(f=>({...f,plagiarism_check:v}))}/>
        {form.plagiarism_check && (
          <F label="Similarity threshold %" hint="submissions above this % are flagged">
            <input className={inp} type="number" min="0" max="100" value={form.plagiarism_threshold} onChange={set("plagiarism_threshold")}/>
          </F>
        )}
      </Sec>
    </div>
  );
}
