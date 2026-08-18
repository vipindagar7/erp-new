// src/modules/programs/pages/ProgramEditPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProgramEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [depts,       setDepts]       = useState([]);
  const [branches,    setBranches]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [form, setForm] = useState({ name: "", dept_id: "", branch_id: "", code: "", max_semesters: "", duration_years: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.programs.byId(id)),
      axiosInstance.get(EP.departments.list, { params: { limit: 200 } }),
    ]).then(([progRes, deptRes]) => {
      const p = progRes.data?.data;
      setForm({
        name:           p.name || "",
        dept_id:        p.department?.id || p.dept_id || "",
        branch_id:      p.branch?.id || p.branch_id || "",
        code:           p.code || "",
        max_semesters:  p.max_semesters  ? String(p.max_semesters)  : "",
        duration_years: p.duration_years ? String(p.duration_years) : "",
      });
      setDepts(Array.isArray(deptRes.data?.data) ? deptRes.data.data : []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setPageLoading(false));
  }, [id]);

  useEffect(() => {
    if (!form.dept_id) { setBranches([]); return; }
    axiosInstance.get(EP.branches.list, { params: { dept_id: form.dept_id, limit: 200, status: "active" } })
      .then((r) => setBranches(r.data?.data?.branches || []));
  }, [form.dept_id]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErrors({ name: "Required" }); return; }
    setLoading(true);
    try {
      await axiosInstance.patch(EP.programs.update(id), {
        name:           form.name,
        dept_id:        form.dept_id || undefined,
        branch_id:      form.branch_id || null,
        code:           form.code?.toUpperCase() || undefined,
        max_semesters:  form.max_semesters  ? parseInt(form.max_semesters)  : null,
        duration_years: form.duration_years ? parseInt(form.duration_years) : null,
      });
      notify.success("Program updated");
      navigate(ROUTES.programs.detail(id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (pageLoading) return <div className="max-w-lg space-y-4">{[1,2,3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.programs.detail(id))}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Edit Program</h1><p className="text-sm text-muted-foreground">Update program details</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={form.dept_id} onValueChange={set("dept_id")}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Branch <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <Select value={form.branch_id || "none"} onValueChange={(v) => set("branch_id")(v === "none" ? "" : v)}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific branch</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.code})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Program Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)}
            className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Program Code</Label>
          <Input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())} className="font-mono" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Max Semesters</Label>
            <Input type="number" value={form.max_semesters} onChange={(e) => set("max_semesters")(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (years)</Label>
            <Input type="number" value={form.duration_years} onChange={(e) => set("duration_years")(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.programs.detail(id))}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>{loading ? "Saving…" : "Save Changes"}</Button>
      </div>
    </div>
  );
}