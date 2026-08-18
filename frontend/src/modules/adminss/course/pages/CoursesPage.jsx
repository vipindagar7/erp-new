// src/modules/course/pages/CoursesPage.jsx
import { useState, useEffect } from "react";
import { BookOpen, Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";

function CourseModal({ course, programs, onSave, onClose }) {
  const [form, setForm] = useState({ name: course?.name||"", program_id: course?.program?.id||course?.program_id||"" });
  const [loading, setLoading] = useState(false);
  const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  const handleSave = async () => {
    if (!form.name || !form.program_id) return notify.error("Name and program required");
    setLoading(true);
    try {
      if (course?.id) await axiosInstance.patch(EP.courses.update(course.id), form);
      else            await axiosInstance.post(EP.courses.create, form);
      notify.success(course?.id ? "Updated" : "Created"); onSave();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <h2 className="text-base font-semibold">{course?.id ? "Edit" : "Add"} Course</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Course Name *</label>
            <input className={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. BCA 1st Year" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Program *</label>
            <select className={inp} value={form.program_id} onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value }))}>
              <option value="">Select…</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.department?.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}{course?.id ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { can } = usePageGuard();
  const [courses, setCourses]   = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [progFilter, setProgFilter] = useState("");
  const [modal, setModal]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        axiosInstance.get(EP.courses.list, { params: { search: search||undefined, program_id: progFilter||undefined } }),
        axiosInstance.get(EP.programs.list, { params: { limit: 200 } }),
      ]);
      setCourses(c.data?.data || []);
      setPrograms(p.data?.data?.programs || p.data?.data || []);
    } catch { notify.error("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, progFilter]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(EP.courses.delete(deleteTarget.id));
      notify.success("Deleted"); setDeleteTarget(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen size={20} /> Courses</h1>
          <p className="text-sm text-muted-foreground">{courses.length} courses</p>
        </div>
        {can("academic.create") && (
          <button onClick={() => setModal({ course: null })} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14} /> Add Course
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={progFilter} onChange={(e) => setProgFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
          <option value="">All Programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Course","Code","Program","Department","Sections","Students",""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {[1,2,3,4,5,6,7].map((j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
              </tr>
            )) : courses.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No courses found</td></tr>
            ) : courses.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 group">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3"><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.code || "—"}</code></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.program?.name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.program?.program?.department?.name || c.program?.department?.name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c._count?.sections ?? 0}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c._count?.students ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 justify-end">
                    {can("academic.update") && <button onClick={() => setModal({ course: c })} className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Edit size={13} /></button>}
                    {can("academic.delete") && <button onClick={() => setDeleteTarget(c)} className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && <CourseModal course={modal.course} programs={programs} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />}
      <ConfirmModal open={!!deleteTarget} title="Delete Course" variant="danger"
        message={`Delete "${deleteTarget?.name}"? All sections will be affected.`} confirmLabel="Delete"
        loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
