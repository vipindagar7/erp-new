// ─────────────────────────────────────────────────────────────
// src/modules/superadmin/pages/SuperAdminNewPage.jsx
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SuperAdminNewPage() {
  const navigate = useNavigate();
  const [departments, setDepts]   = useState([]);
  const [form,  setForm]          = useState({ name: "", emp_id: "", email: "", dept_id: "" });
  const [loading, setLoading]     = useState(false);
  const [errors,  setErrors]      = useState({});

  useEffect(() => {
    axiosInstance.get(EP.departments.list, { params: { limit: 100 } })
      .then((r) => setDepts(r.data?.data?.departments || []));
  }, []);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Name required";
    if (!form.email.trim()) e.email = "Email required";
    setErrors(e); return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosInstance.post(EP.superadmin.create, form);
      notify.success("Super Admin created — a temporary password will be emailed");
      navigate(ROUTES.superadmin.hub);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.superadmin.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-amber-500" />
          <h1 className="text-xl font-bold">Add Super Admin</h1>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        Super Admins have full access to all modules except root-only operations. A default password will be emailed automatically.
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {[
          { key: "name",   label: "Full Name *",  placeholder: "Dr. Ramesh Kumar" },
          { key: "emp_id", label: "Employee ID",  placeholder: "EIT-SA-001" },
          { key: "email",  label: "Email *",      placeholder: "sa@eit.edu.in", type: "email" },
        ].map(({ key, label, placeholder, type = "text" }) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input type={type} value={form[key]} onChange={(e) => set(key)(e.target.value)} placeholder={placeholder} className={errors[key] ? "border-destructive" : ""} />
            {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={form.dept_id || "none"} onValueChange={(v) => set("dept_id")(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Select department (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.superadmin.hub)}>Cancel</Button>
        <Button className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={loading} onClick={submit}>{loading ? "Creating…" : "Create Super Admin"}</Button>
      </div>
    </div>
  );
}

export default SuperAdminNewPage;