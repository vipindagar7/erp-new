// src/modules/course/pages/CourseCreatePage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

export default function CourseCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillProgramId = searchParams.get("program_id") || "";

  const [form, setForm]       = useState({ name: "", code: "", program_id: prefillProgramId });
  const [programs, setPrograms] = useState([]);
  const [depts, setDepts]     = useState([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.programs.list, { params: { limit: 200 } }),
      axiosInstance.get(EP.departments.list),
    ]).then(([p, d]) => {
      setPrograms(p.data?.data?.programs || p.data?.data || []);
      setDepts(d.data?.data || []);
    }).catch(() => {});
  }, []);

  const fetchSuggestion = async (name) => {
    if (!name || name.length < 2) return;
    try {
      const r = await axiosInstance.get("/api/courses/suggest-code", { params: { name } });
      setSuggestion(r.data?.data?.suggested || "");
    } catch {}
  };

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
    if (k === "name") fetchSuggestion(e.target.value);
  };

  const filteredPrograms = deptFilter
    ? programs.filter((p) => p.dept_id === deptFilter || p.department?.id === deptFilter)
    : programs;

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = "Course name is required";
    if (!form.program_id)   e.program_id = "Program is required";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosInstance.post(EP.courses.create, {
        name: form.name.trim(), program_id: form.program_id,
        ...(form.code.trim() && { code: form.code.trim().toUpperCase() }),
      });
      notify.success("Course created");
      navigate("/admin/courses");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/courses")} className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center"><ArrowLeft size={16} /></button>
        <div><h1 className="text-xl font-bold">Add Course</h1><p className="text-sm text-muted-foreground">Create a course under a program</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        {/* Dept filter to narrow program list */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Filter by Department</label>
          <select className={inp} value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setForm((f) => ({ ...f, program_id: "" })); }}>
            <option value="">All Departments</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Program <span className="text-destructive">*</span></label>
          <select className={inp} value={form.program_id} onChange={set("program_id")}>
            <option value="">Select program…</option>
            {filteredPrograms.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.department?.name}</option>)}
          </select>
          {errors.program_id && <p className="text-xs text-destructive">{errors.program_id}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Course Name <span className="text-destructive">*</span></label>
          <input className={inp} value={form.name} onChange={set("name")} placeholder="e.g. BCA 1st Year" autoFocus />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Code</label>
          <input className={inp} value={form.code} onChange={set("code")} placeholder={suggestion || "e.g. CRS-BCA1 (auto if blank)"} />
          {suggestion && !form.code && (
            <p className="text-xs text-muted-foreground">Suggested: <code className="font-mono">{suggestion}</code>
              <button onClick={() => setForm((f) => ({ ...f, code: suggestion }))} className="ml-2 text-primary hover:underline">Use this</button>
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate("/admin/courses")} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
        <button onClick={handleSubmit} disabled={loading} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Create Course
        </button>
      </div>
    </div>
  );
}
