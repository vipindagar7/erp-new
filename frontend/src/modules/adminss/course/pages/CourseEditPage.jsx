// src/modules/course/pages/CourseEditPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

export default function CourseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", code: "", program_id: "" });
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.courses.byId(id)),
      axiosInstance.get(EP.programs.list, { params: { limit: 200 } }),
    ]).then(([c, p]) => {
      const course = c.data?.data;
      setForm({ name: course?.name || "", code: course?.code || "", program_id: course?.program_id || course?.program?.id || "" });
      setPrograms(p.data?.data?.programs || p.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
    .finally(() => setFetching(false));
  }, [id]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: "" })); };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setErrors({ name: "Name is required" });
    if (!form.program_id)  return setErrors({ program_id: "Program is required" });
    setLoading(true);
    try {
      await axiosInstance.patch(EP.courses.update(id), { name: form.name.trim(), program_id: form.program_id });
      notify.success("Course updated");
      navigate(`/admin/courses/${id}`);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/courses/${id}`)} className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center"><ArrowLeft size={16} /></button>
        <div><h1 className="text-xl font-bold">Edit Course</h1><p className="text-sm text-muted-foreground">{form.name}</p></div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Program <span className="text-destructive">*</span></label>
          <select className={inp} value={form.program_id} onChange={set("program_id")}>
            <option value="">Select…</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.department?.name}</option>)}
          </select>
          {errors.program_id && <p className="text-xs text-destructive">{errors.program_id}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Course Name <span className="text-destructive">*</span></label>
          <input className={inp} value={form.name} onChange={set("name")} autoFocus />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Code</label>
          <input className={inp} value={form.code} onChange={set("code")} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => navigate(`/admin/courses/${id}`)} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
        <button onClick={handleSubmit} disabled={loading} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
        </button>
      </div>
    </div>
  );
}
