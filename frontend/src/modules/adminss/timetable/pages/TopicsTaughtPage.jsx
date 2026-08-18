// src/modules/timetable/pages/TopicsTaughtPage.jsx
import { useState, useEffect } from "react";
import { GraduationCap, Plus, X, Loader2, Calendar } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import SearchSelect  from "../../../../components/shared/SearchSelect.jsx";

const sel  = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const METHODS = ["LECTURE","DEMO","PRACTICAL","DISCUSSION","SEMINAR","WORKSHOP"];

function MarkModal({ onClose, onSave, sessions }) {
  const [form, setForm] = useState({
    session_id:"", faculty_id:"", subject_id:"", section_id:"",
    date: new Date().toISOString().slice(0,10), period_name:"P1",
    topic_text:"", sub_topic:"", teaching_method:"LECTURE", remarks:"",
    course_topic_id:"",
  });
  const [structure, setStructure] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  useEffect(() => {
    if (form.faculty_id && form.subject_id && form.section_id && form.session_id) {
      axiosInstance.get(EP.timetable.courseStructure, {
        params: { faculty_id:form.faculty_id, subject_id:form.subject_id, section_id:form.section_id, session_id:form.session_id },
      }).then(r => setStructure(r.data?.data || [])).catch(() => setStructure([]));
    }
  }, [form.faculty_id, form.subject_id, form.section_id, form.session_id]);

  const save = async () => {
    if (!form.topic_text || !form.faculty_id || !form.subject_id || !form.section_id) {
      notify.error("Fill faculty, subject, section and topic"); return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.timetable.topics, form);
      notify.success("Topic marked"); onSave();
    } catch (err) { notify.error(err); }
    finally { setSaving(false); }
  };

  const pendingTopics = structure.filter(t => !t.is_covered);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Mark Topic Taught</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Session</Label>
            <select value={form.session_id} onChange={set("session_id")} className={sel}>
              <option value="">Select…</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={set("date")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Period</Label>
            <Input value={form.period_name} onChange={set("period_name")} placeholder="P1" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Method</Label>
            <select value={form.teaching_method} onChange={set("teaching_method")} className={sel}>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Faculty</Label>
          <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
            value={form.faculty_id} onChange={v => setForm(f => ({ ...f, faculty_id:v }))} placeholder="Select faculty" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name" subLabelKey="code"
            value={form.subject_id} onChange={v => setForm(f => ({ ...f, subject_id:v }))} placeholder="Select subject" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Section</Label>
          <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
            value={form.section_id} onChange={v => setForm(f => ({ ...f, section_id:v }))} placeholder="Select section" />
        </div>

        {/* Topic — select from syllabus or type free text */}
        {pendingTopics.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Select from Syllabus <span className="text-muted-foreground">(optional)</span></Label>
            <select value={form.course_topic_id} onChange={e => {
              const t = structure.find(s => s.id === e.target.value);
              setForm(f => ({ ...f, course_topic_id: e.target.value, topic_text: t?.topic || f.topic_text, sub_topic: t?.sub_topic || "" }));
            }} className={sel}>
              <option value="">— Type below instead —</option>
              {pendingTopics.map(t => (
                <option key={t.id} value={t.id}>U{t.unit_no}: {t.topic}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Topic *</Label>
          <Input value={form.topic_text} onChange={set("topic_text")} placeholder="What was taught today…" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sub Topic</Label>
          <Input value={form.sub_topic} onChange={set("sub_topic")} placeholder="Optional detail" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Remarks</Label>
          <Input value={form.remarks} onChange={set("remarks")} placeholder="Any notes" />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : null}Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TopicsTaughtPage() {
  const [sessions,   setSessions]   = useState([]);
  const [topics,     setTopics]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [marking,    setMarking]    = useState(false);
  const [date,       setDate]       = useState(new Date().toISOString().slice(0,10));
  const [sessionId,  setSessionId]  = useState("");
  const [sectionId,  setSectionId]  = useState("");
  const [facultyId,  setFacultyId]  = useState("");

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    axiosInstance.get(EP.timetable.topics, { params: { date, section_id:sectionId||undefined, faculty_id:facultyId||undefined } })
      .then(r => setTopics(r.data?.data || []))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [date, sectionId, facultyId]);

  const METHOD_COLOR = { LECTURE:"bg-blue-100 text-blue-700", DEMO:"bg-teal-100 text-teal-700", PRACTICAL:"bg-green-100 text-green-700", DISCUSSION:"bg-violet-100 text-violet-700", SEMINAR:"bg-amber-100 text-amber-700", WORKSHOP:"bg-rose-100 text-rose-700" };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2"><GraduationCap size={20} className="text-primary" /><h1 className="text-xl font-bold">Topics Taught</h1></div>
        <Button size="sm" onClick={() => setMarking(true)}><Plus size={13} className="mr-1.5" />Mark Topic</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={sel} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Section</Label>
          <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
            value={sectionId} onChange={v => setSectionId(v)} placeholder="All sections" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Faculty</Label>
          <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
            value={facultyId} onChange={v => setFacultyId(v)} placeholder="All faculty" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      ) : topics.length === 0 ? (
        <div className="text-center py-14 space-y-3">
          <GraduationCap size={28} className="mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No topics marked for {date}</p>
          <Button variant="outline" size="sm" onClick={() => setMarking(true)}><Plus size={13} className="mr-1.5" />Mark First Topic</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {topics.map(t => (
            <div key={t.id} className="flex gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{t.topic_text}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${METHOD_COLOR[t.teaching_method] || "bg-muted text-muted-foreground"}`}>
                    {t.teaching_method}
                  </span>
                </div>
                {t.sub_topic && <p className="text-xs text-muted-foreground mt-0.5">{t.sub_topic}</p>}
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{t.section?.name}</span>
                  <span>{t.subject?.name} ({t.subject?.code})</span>
                  <span>Period {t.period_name}</span>
                </div>
              </div>
              {t.remarks && <p className="text-xs text-muted-foreground/60 italic shrink-0 max-w-32 truncate">{t.remarks}</p>}
            </div>
          ))}
        </div>
      )}

      {marking && <MarkModal sessions={sessions} onClose={() => setMarking(false)} onSave={() => { setMarking(false); load(); }} />}
    </div>
  );
}