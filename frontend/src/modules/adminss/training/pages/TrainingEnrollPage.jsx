// src/modules/adminss/training/pages/TrainingEnrollPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Trash2, Loader2, Users, Upload, CheckCircle, X } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

export default function TrainingEnrollPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [training,    setTraining]    = useState(null);
  const [sections,    setSections]    = useState([]);   // all active sections
  const [assigned,    setAssigned]    = useState([]);   // sections already assigned to training
  const [students,    setStudents]    = useState([]);   // all students (for individual search)
  const [enrolled,    setEnrolled]    = useState([]);   // already enrolled students
  const [loading,     setLoading]     = useState(true);

  const [selSections, setSelSections] = useState([]);   // section IDs selected to assign
  const [isMandatory, setIsMandatory] = useState(true);
  const [stuSearch,   setStuSearch]   = useState("");
  const [selStudents, setSelStudents] = useState([]);   // individual student IDs
  const [saving,      setSaving]      = useState("");

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.training.byId(id)),
      axiosInstance.get(EP.training.sections(id)),
      axiosInstance.get("/sections/list?status=ACTIVE&limit=200").catch(() => ({data:{data:[]}})),
      axiosInstance.get(EP.training.enrollments(id), { params:{ limit:500 } }),
      axiosInstance.get(EP.students.all + "?status=ACTIVE&limit=500").catch(() => ({data:{data:[]}})),
    ]).then(([tRes, asRes, secRes, eRes, stuRes]) => {
      setTraining(tRes.data?.data);
      setAssigned(asRes.data?.data || []);
      setSections(secRes.data?.data?.sections || secRes.data?.data || []);
      setEnrolled(eRes.data?.data?.enrollments || []);
      setStudents(stuRes.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const assignSections = async () => {
    if (!selSections.length) { notify.error("Select at least one section"); return; }
    setSaving("sections");
    try {
      await axiosInstance.post(EP.training.sections(id), { section_ids: selSections, is_mandatory: isMandatory });
      notify.success(`${selSections.length} section(s) assigned`);
      const res = await axiosInstance.get(EP.training.sections(id));
      setAssigned(res.data?.data || []);
      setSelSections([]);
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(""); }
  };

  const enrollBySection = async (section_id) => {
    setSaving("enroll-" + section_id);
    try {
      await axiosInstance.post(EP.training.enrollSection(id), { section_id });
      notify.success("Section students enrolled");
      const res = await axiosInstance.get(EP.training.enrollments(id), { params:{ limit:500 } });
      setEnrolled(res.data?.data?.enrollments || []);
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(""); }
  };

  const enrollIndividual = async () => {
    if (!selStudents.length) { notify.error("Select students first"); return; }
    setSaving("individual");
    try {
      await axiosInstance.post(EP.training.enrollments(id), { student_ids: selStudents });
      notify.success(`${selStudents.length} student(s) enrolled`);
      const res = await axiosInstance.get(EP.training.enrollments(id), { params:{ limit:500 } });
      setEnrolled(res.data?.data?.enrollments || []);
      setSelStudents([]);
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(""); }
  };

  const removeSection = async (section_id) => {
    if (!confirm("Remove this section from training?")) return;
    try {
      await axiosInstance.delete(EP.training.sections(id), { data:{ section_ids:[section_id] } });
      setAssigned(prev => prev.filter(s => s.section_id !== section_id));
      notify.success("Section removed");
    } catch { notify.error("Failed"); }
  };

  const enrolledIds = new Set(enrolled.map(e => e.student?.id));
  const filteredStudents = students.filter(s =>
    !enrolledIds.has(s.id) &&
    (!stuSearch || s.name?.toLowerCase().includes(stuSearch.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(stuSearch.toLowerCase()))
  );

  const toggleSection  = id => setSelSections(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  const toggleStudent  = id => setSelStudents(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  const assignedSecIds = new Set(assigned.map(a => a.section_id));

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/training/${id}`)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Enroll Students</h1>
          <p className="text-sm text-muted-foreground">{training?.title}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={14}/>{enrolled.length} enrolled
        </div>
      </div>

      {/* ── Section Assignment ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          1. Assign Sections to Training
        </p>
        <p className="text-xs text-muted-foreground">
          Assign sections first, then bulk-enroll all their students with one click.
        </p>

        {/* Already assigned */}
        {assigned.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Assigned ({assigned.length})</p>
            <div className="flex flex-wrap gap-2">
              {assigned.map(a => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-xl text-xs">
                  <span className="font-medium">{a.section?.name}</span>
                  <span className="text-muted-foreground">Sem {a.section?.semester}</span>
                  <span className={a.is_mandatory ? "text-red-500" : "text-green-600"}>{a.is_mandatory ? "Mandatory" : "Optional"}</span>
                  <button onClick={() => removeSection(a.section_id)} className="text-muted-foreground hover:text-red-500">
                    <X size={11}/>
                  </button>
                  <button onClick={() => enrollBySection(a.section_id)}
                    disabled={saving === "enroll-"+a.section_id}
                    className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {saving==="enroll-"+a.section_id ? <Loader2 size={9} className="animate-spin"/> : <Users size={9}/>}
                    Enroll All
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Select new sections */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add Sections</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
            {sections.filter(s => !assignedSecIds.has(s.id)).map(s => {
              const sel = selSections.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleSection(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-left transition-all
                    ${sel ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/30"}`}>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${sel ? "bg-primary border-primary" : "border-input"}`}>
                    {sel && <CheckCircle size={9} className="text-primary-foreground"/>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">Sem {s.semester} · {s._count?.students||0} students</p>
                  </div>
                </button>
              );
            })}
          </div>
          {selSections.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)}
                  className="w-3.5 h-3.5 accent-primary"/>
                Mandatory for these sections
              </label>
              <button onClick={assignSections} disabled={!!saving}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
                {saving==="sections" ? <Loader2 size={11} className="animate-spin"/> : <Plus size={11}/>}
                Assign {selSections.length} Section{selSections.length>1?"s":""}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Individual Enrollment ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          2. Enroll Individual Students
        </p>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={stuSearch} onChange={e => setStuSearch(e.target.value)}
            placeholder="Search by name or roll number…"
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        {selStudents.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{selStudents.length} selected</span>
            <button onClick={enrollIndividual} disabled={!!saving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
              {saving==="individual" ? <Loader2 size={11} className="animate-spin"/> : <Users size={11}/>}
              Enroll Selected
            </button>
          </div>
        )}
        <div className="max-h-64 overflow-y-auto divide-y divide-border border border-border rounded-xl">
          {filteredStudents.slice(0,50).map(s => {
            const sel = selStudents.includes(s.id);
            return (
              <div key={s.id} onClick={() => toggleStudent(s.id)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors ${sel?"bg-primary/5":""}`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sel?"bg-primary border-primary":"border-input"}`}>
                  {sel && <CheckCircle size={9} className="text-primary-foreground"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.roll_no} · {s.section?.name}</p>
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {stuSearch ? "No students found" : "All students already enrolled"}
            </div>
          )}
        </div>
      </div>

      {/* ── Current Enrollments ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Currently Enrolled ({enrolled.length})
        </p>
        <div className="max-h-48 overflow-y-auto divide-y divide-border">
          {enrolled.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-2 py-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                {e.student?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{e.student?.name}</p>
                <p className="text-[10px] text-muted-foreground">{e.student?.roll_no} · {e.student?.section?.name}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{e.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
