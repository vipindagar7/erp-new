// src/modules/shared/pages/AcademicStructurePage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, ChevronRight, ChevronDown, Plus, Layers,
  BookOpen, FileText, Users, Loader2, RefreshCw, Lock,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { notify } from "../../../../hooks/notify.js";

function AddSectionInline({ courseId, onCreated }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [form, setForm]       = useState({ name: "", semester: "", batch: "", batch_year: "", code: "" });

  const fetchSuggestion = async (name) => {
    if (!name) return;
    try {
      const r = await axiosInstance.get(EP.sections.suggestCode, { params: { name } });
      setSuggestion(r.data?.data?.suggested || "");
    } catch {}
  };

  const handleCreate = async () => {
    if (!form.name || !form.semester || !form.batch) return notify.error("Name, semester and batch required");
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.sections.create, {
        ...form, course_id: courseId,
        semester: Number(form.semester),
        batch_year: form.batch_year ? Number(form.batch_year) : undefined,
        code: form.code || undefined,
      });
      const res = r.data?.data;
      notify.success(`"${res.section?.name}" created — ${res.autoAssigned?.length || 0} subjects auto-assigned${res.warning ? ` ⚠ ${res.warning}` : ""}`);
      setOpen(false); setForm({ name: "", semester: "", batch: "", batch_year: "", code: "" }); onCreated();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const inp = "w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring";

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors ml-8">
      <Plus size={12} /> Add Section
    </button>
  );

  return (
    <div className="ml-8 mr-4 mb-3 bg-card border border-primary/20 rounded-xl p-3 space-y-3">
      <p className="text-xs font-semibold text-primary">New Section</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-[10px] font-medium text-muted-foreground">Name *</label>
          <input className={inp} value={form.name} placeholder="e.g. BCA-A"
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); fetchSuggestion(e.target.value); }} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Code (auto)</label>
          <input className={inp} value={form.code} placeholder={suggestion || "SEC-BCAA"} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Semester *</label>
          <select className={inp} value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}>
            <option value="">Select</option>
            {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>Sem {n}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Batch *</label>
          <input className={inp} value={form.batch} placeholder="2024-27" onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">Batch Year</label>
          <input className={inp} value={form.batch_year} placeholder="2024" type="number" onChange={(e) => setForm((f) => ({ ...f, batch_year: e.target.value }))} />
        </div>
      </div>
      {suggestion && !form.code && <p className="text-[10px] text-muted-foreground">Suggested: <code className="font-mono">{suggestion}</code></p>}
      <div className="flex gap-2">
        <button onClick={handleCreate} disabled={loading} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
          {loading && <Loader2 size={11} className="animate-spin" />} Create Section
        </button>
        <button onClick={() => { setOpen(false); setForm({ name: "", semester: "", batch: "", batch_year: "", code: "" }); }} className="h-8 px-3 rounded-lg border border-input text-xs text-muted-foreground hover:bg-muted">Cancel</button>
      </div>
    </div>
  );
}

function SectionCard({ section, navigate }) {
  const unassigned = section.sectionSubjects?.filter((ss) => !ss.faculty_id).length || 0;
  return (
    <div onClick={() => navigate(`/admin/sections/${section.id}`)}
      className="group flex items-center gap-3 ml-8 px-3 py-2.5 rounded-xl hover:bg-primary/5 cursor-pointer border border-transparent hover:border-primary/20 transition-all">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Layers size={14} className="text-muted-foreground group-hover:text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium group-hover:text-primary">{section.name}</p>
          <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">{section.code}</code>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${section.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{section.status}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-muted-foreground">Sem {section.semester}</span>
          <span className="text-[10px] text-muted-foreground">{section.batch}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Users size={9} /> {section._count?.students ?? 0}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><BookOpen size={9} /> {section._count?.sectionSubjects ?? 0}</span>
          {unassigned > 0 && <span className="text-[10px] text-amber-600">⚠ {unassigned} unassigned</span>}
        </div>
      </div>
      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
    </div>
  );
}

function CourseBlock({ course, navigate, can, onRefresh }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="ml-6">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 w-full text-left group">
        {open ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />}
        <BookOpen size={13} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">{course.name}</span>
        {course.code && <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">{course.code}</code>}
        <span className="text-[10px] text-muted-foreground ml-auto">{course.sections?.length || 0} sections</span>
      </button>
      {open && (
        <div className="space-y-0.5">
          {course.sections?.map((section) => <SectionCard key={section.id} section={section} navigate={navigate} />)}
          {can("sections.create") && <AddSectionInline courseId={course.id} onCreated={onRefresh} />}
        </div>
      )}
    </div>
  );
}

function ProgramBlock({ program, navigate, can, onRefresh }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="ml-4">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 w-full text-left group">
        {open ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />}
        <FileText size={13} className="text-violet-500" />
        <span className="text-xs font-semibold text-violet-600">{program.name}</span>
        {program.code && <code className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-mono">{program.code}</code>}
        <span className="text-[10px] text-muted-foreground ml-auto">{program.courses?.length || 0} courses</span>
      </button>
      {open && program.courses?.map((course) => (
        <CourseBlock key={course.id} course={course} navigate={navigate} can={can} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function DepartmentBlock({ dept, navigate, can, onRefresh, locked }) {
  const [open, setOpen] = useState(true);
  const totalSections = dept.programs?.reduce((a, p) => a + p.courses?.reduce((b, c) => b + (c.sections?.length || 0), 0), 0) || 0;
  const totalStudents = dept.programs?.reduce((a, p) => a + p.courses?.reduce((b, c) => b + c.sections?.reduce((d, s) => d + (s._count?.students || 0), 0), 0), 0) || 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{dept.name}</p>
            {dept.code && <code className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">{dept.code}</code>}
            {locked && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium"><Lock size={9} /> Your dept</span>}
          </div>
          <p className="text-xs text-muted-foreground">{dept.programs?.length || 0} programs · {totalSections} sections · {totalStudents} students</p>
        </div>
        {open ? <ChevronDown size={16} className="text-muted-foreground shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="pb-3 space-y-1">
          {dept.programs?.map((program) => (
            <ProgramBlock key={program.id} program={program} navigate={navigate} can={can} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AcademicStructurePage() {
  const navigate = useNavigate();
  const { can, deptScope, hasDeptScope } = usePageGuard();
  const [tree, setTree]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = hasDeptScope ? { dept_id: deptScope } : {};
      const r = await axiosInstance.get(EP.sections.tree, { params });
      setTree(r.data?.data || []);
    } catch { notify.error("Failed to load academic structure"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [deptScope]);

  const filtered = search
    ? tree.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code?.toLowerCase().includes(search.toLowerCase()) ||
        d.programs?.some((p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.courses?.some((c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.sections?.some((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase()))
          )
        )
      )
    : tree;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 size={20} /> Academic Structure</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasDeptScope ? "Showing your department only" : "All departments — Dept → Program → Course → Sections"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring w-48" />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <button onClick={load} disabled={loading} className="h-9 w-9 rounded-lg border border-input bg-background hover:bg-muted flex items-center justify-center text-muted-foreground">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {hasDeptScope && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <Lock size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">You have department-scoped access. Only your department is shown.</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : !filtered.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Building2 size={40} className="mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">No academic structure found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dept) => (
            <DepartmentBlock key={dept.id} dept={dept} navigate={navigate} can={can} onRefresh={load}
              locked={hasDeptScope && dept.id === deptScope} />
          ))}
        </div>
      )}
    </div>
  );
}