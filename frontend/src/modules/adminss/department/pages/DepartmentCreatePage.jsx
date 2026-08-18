// src/modules/department/pages/DepartmentCreatePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

export default function DepartmentCreatePage() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: "", code: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Department name is required";
    if (form.code && !/^[A-Z0-9]{2,8}$/.test(form.code.toUpperCase())) e.code = "Code must be 2-8 uppercase letters/numbers";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.departments.create, { ...form, code: form.code?.toUpperCase() || undefined });
      notify.success("Department created");
      navigate(ROUTES.departments.detail(r.data?.data?.id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed to create"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.departments.list)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Add Department</h1>
          <p className="text-sm text-muted-foreground">Create a new academic department</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Department Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Computer Science & Engineering"
            className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Department Code <span className="text-xs text-muted-foreground font-normal">(auto-generated if blank)</span></Label>
          <Input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())}
            placeholder="e.g. CSE" maxLength={8}
            className={`font-mono ${errors.code ? "border-destructive" : ""}`} />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          <p className="text-xs text-muted-foreground">2–8 characters. Used in Excel templates and bulk uploads.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.departments.list)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>
          {loading ? "Creating…" : "Create Department"}
        </Button>
      </div>
    </div>
  );
}