// src/modules/timetable/pages/CourseStructurePage.jsx
import { useState, useEffect } from "react";
import { BookOpen, Download, Upload, Loader2, Check, ChevronDown, ChevronRight } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import SearchSelect  from "../../../../components/shared/SearchSelect.jsx";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

export default function CourseStructurePage() {
  const [sessions,   setSessions]   = useState([]);
  const [sessionId,  setSessionId]  = useState("");
  const [facultyId,  setFacultyId]  = useState("");
  const [subjectId,  setSubjectId]  = useState("");
  const [sectionId,  setSectionId]  = useState("");
  const [structure,  setStructure]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [expanded,   setExpanded]   = useState({});

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => {});
  }, []);

  const load = () => {
    if (!sessionId) return;
    setLoading(true);
    axiosInstance.get(EP.timetable.courseStructure, {
      params: { session_id: sessionId, faculty_id: facultyId||undefined, subject_id: subjectId||undefined, section_id: sectionId||undefined },
    }).then(r => setStructure(r.data?.data || []))
    .catch(() => setStructure([]))
    .finally(() => setLoading(false));
  };

  useEffect(() => { if (sessionId) load(); }, [sessionId, facultyId, subjectId, sectionId]);

  const downloadTemplate = async () => {
    try {
      const r = await axiosInstance.get(EP.timetable.courseStructureTemplate, { responseType:"blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = "course-structure-template.xlsx";
      a.click(); URL.revokeObjectURL(a.href);
    } catch { notify.error("Download failed"); }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!facultyId || !subjectId || !sectionId || !sessionId) {
      notify.error("Select faculty, subject, section and session first"); return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("faculty_id", facultyId);
    fd.append("subject_id", subjectId);
    fd.append("section_id", sectionId);
    fd.append("session_id", sessionId);
    try {
      const r = await axiosInstance.post(EP.timetable.courseStructureUpload, fd, { headers:{ "Content-Type":"multipart/form-data" } });
      notify.success(`${r.data?.data?.created || 0} topics uploaded`);
      load();
    } catch (err) { notify.error(err); }
    finally { setUploading(false); e.target.value = ""; }
  };

  // Group by unit
  const byUnit = {};
  for (const t of structure) {
    if (!byUnit[t.unit_no]) byUnit[t.unit_no] = { title: t.unit_title, topics:[] };
    byUnit[t.unit_no].topics.push(t);
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2"><BookOpen size={20} className="text-primary" /><h1 className="text-xl font-bold">Course Structures</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}><Download size={13} className="mr-1.5" />Template</Button>
          <label>
            <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={upload} />
            <Button asChild variant="outline" size="sm" disabled={uploading}>
              <span className="cursor-pointer">{uploading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />}Upload Syllabus</span>
            </Button>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Session</Label>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={sel}>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Faculty</Label>
          <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
            value={facultyId} onChange={v => setFacultyId(v)} placeholder="All faculty" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
            subLabelKey="code" value={subjectId} onChange={v => setSubjectId(v)} placeholder="All subjects" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Section</Label>
          <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
            value={sectionId} onChange={v => setSectionId(v)} placeholder="All sections" />
        </div>
      </div>

      {/* Structure */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      ) : Object.keys(byUnit).length === 0 ? (
        <div className="text-center py-14 space-y-3">
          <BookOpen size={28} className="mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No course structure uploaded yet</p>
          <p className="text-xs text-muted-foreground/60">Download the template, fill unit/topic list, and upload</p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}><Download size={13} className="mr-1.5" />Download Template</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{structure.length} topics across {Object.keys(byUnit).length} units</p>
          {Object.entries(byUnit).sort(([a],[b]) => parseInt(a)-parseInt(b)).map(([unitNo, unit]) => (
            <div key={unitNo} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => setExpanded(e => ({ ...e, [unitNo]: !e[unitNo] }))}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/10 text-left">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {unitNo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{unit.title}</p>
                  <p className="text-xs text-muted-foreground">{unit.topics.length} topics · {unit.topics.reduce((s,t) => s+t.planned_hours,0)} planned hours</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-green-600">{unit.topics.filter(t=>t.is_covered).length}/{unit.topics.length} covered</span>
                  {expanded[unitNo] ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                </div>
              </button>
              {expanded[unitNo] && (
                <div className="border-t border-border divide-y divide-border">
                  {unit.topics.map((t, i) => (
                    <div key={t.id||i} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${t.is_covered ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground/30"}`}>
                        {t.is_covered ? <Check size={11} /> : <span className="text-[9px] font-bold">{t.order||i+1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.topic}</p>
                        {t.sub_topic && <p className="text-xs text-muted-foreground">{t.sub_topic}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 text-right">
                        <p>{t.planned_hours}h</p>
                        {t.is_covered && t.covered_on && (
                          <p className="text-green-600">{new Date(t.covered_on).toLocaleDateString("en-IN")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}