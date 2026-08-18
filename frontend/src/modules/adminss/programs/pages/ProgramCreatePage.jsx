// src/modules/programs/pages/ProgramCreatePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProgramCreatePage() {
  const navigate = useNavigate();
  const [depts,    setDepts]    = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [form,    setForm]    = useState({ name: "", dept_id: "", branch_id: "", code: "", max_semesters: "", duration_years: "" });
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    axiosInstance.get(EP.departments.list, { params: { limit: 200 } })
      .then((r) => setDepts(Array.isArray(r.data?.data) ? r.data.data : []));
  }, []);

  useEffect(() => {
    if (!form.dept_id) { setBranches([]); return; }
    axiosInstance.get(EP.branches.list, { params: { dept_id: form.dept_id, limit: 200, status: "active" } })
      .then((r) => setBranches(r.data?.data?.branches || []));
  }, [form.dept_id]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v, ...(k === "dept_id" ? { branch_id: "" } : {}) })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name    = "Program name is required";
    if (!form.dept_id)      e.dept_id = "Department is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.programs.create, {
        name:           form.name,
        dept_id:        form.dept_id,
        branch_id:      form.branch_id || null,
        code:           form.code?.toUpperCase() || undefined,
        max_semesters:  form.max_semesters  ? parseInt(form.max_semesters)  : undefined,
        duration_years: form.duration_years ? parseInt(form.duration_years) : undefined,
      });
      notify.success("Program created");
      navigate(ROUTES.programs.detail(r.data?.data?.id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.programs.list)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold">Add Program</h1>
          <p className="text-sm text-muted-foreground">Create a new degree program</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {/* Department */}
        <div className="space-y-1.5">
          <Label>Department *</Label>
          <Select value={form.dept_id} onValueChange={set("dept_id")}>
            <SelectTrigger className={`h-10 ${errors.dept_id ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.dept_id && <p className="text-xs text-destructive">{errors.dept_id}</p>}
        </div>

        {/* Branch */}
        <div className="space-y-1.5">
          <Label>Branch <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <Select value={form.branch_id || "none"} onValueChange={(v) => set("branch_id")(v === "none" ? "" : v)} disabled={!form.dept_id}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={form.dept_id ? "Select branch (optional)" : "Select department first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific branch</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.code})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label>Program Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. B.Tech Computer Science & Engineering"
            className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Code */}
        <div className="space-y-1.5">
          <Label>Program Code <span className="text-xs text-muted-foreground font-normal">(auto-generated if blank)</span></Label>
          <Input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())}
            placeholder="e.g. BTECH-CSE" className="font-mono" />
        </div>

        {/* Semesters + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Max Semesters</Label>
            <Input type="number" min={1} max={20} value={form.max_semesters}
              onChange={(e) => set("max_semesters")(e.target.value)} placeholder="e.g. 8" />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (years)</Label>
            <Input type="number" min={1} max={10} value={form.duration_years}
              onChange={(e) => set("duration_years")(e.target.value)} placeholder="e.g. 4" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.programs.list)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>
          {loading ? "Creating…" : "Create Program"}
        </Button>
      </div>
    </div>
  );
}