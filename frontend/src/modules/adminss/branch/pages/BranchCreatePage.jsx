// src/modules/branch/pages/BranchCreatePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BranchCreatePage() {
  const navigate = useNavigate();
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name: "", dept_id: "", code: "", has_combined_first_year: false });
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    axiosInstance.get(EP.departments.list, { params: { limit: 200 } })
      .then((r) => setDepts(r.data?.data || []));
  }, []);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name    = "Branch name is required";
    if (!form.dept_id)       e.dept_id = "Department is required";
    if (form.code && !/^[A-Z0-9-]{2,20}$/.test(form.code.toUpperCase()))
      e.code = "Code must be 2-20 alphanumeric/dash characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.branches.create, {
        ...form,
        code: form.code?.toUpperCase() || undefined,
      });
      notify.success("Branch created");
      navigate(ROUTES.branches.detail(r.data?.data?.id));
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to create branch");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.list)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Add Branch</h1>
          <p className="text-sm text-muted-foreground">Create a new specialisation under a department</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {/* Department */}
        <div className="space-y-1.5">
          <Label>Department *</Label>
          <Select value={form.dept_id} onValueChange={set("dept_id")}>
            <SelectTrigger className={`h-10 ${errors.dept_id ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {depts.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.dept_id && <p className="text-xs text-destructive">{errors.dept_id}</p>}
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label>Branch Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. CSE Artificial Intelligence & ML"
            className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Code */}
        <div className="space-y-1.5">
          <Label>Branch Code <span className="text-xs text-muted-foreground font-normal">(auto-generated if blank)</span></Label>
          <Input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())}
            placeholder="e.g. CSE-AIML" className={`font-mono ${errors.code ? "border-destructive" : ""}`} />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          <p className="text-xs text-muted-foreground">Auto-format: DEPT-BRANCHNAME e.g. CSE-AIML</p>
        </div>

        {/* Combined first year */}
        <div>
          <Label className="mb-2 block">Admission Type</Label>
          <button type="button"
            className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            onClick={() => set("has_combined_first_year")(!form.has_combined_first_year)}>
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
              ${form.has_combined_first_year ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {form.has_combined_first_year && <Check size={11} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium">Combined first year</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Year-1 students from this branch share combined sections with other branches (e.g. CE + ECE together).
                In Year 2 they split into their respective branches.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.branches.list)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>
          {loading ? "Creating…" : "Create Branch"}
        </Button>
      </div>
    </div>
  );
}
