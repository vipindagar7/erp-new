// src/modules/admin/pages/SuperAdminCreatePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Eye, EyeOff } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

export default function SuperAdminCreatePage() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: "", email: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null); // { user, tempPassword }
  const [showPwd, setShowPwd] = useState(false);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.superadmin.create, form);
      setCreated(r.data?.data);
      notify.success("Super Admin created");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (created) return (
    <div className="max-w-md space-y-5">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-sm font-semibold text-green-800">Super Admin created successfully</p>
          <p className="text-xs text-green-700 mt-0.5">Share the temporary password securely. They must change it on first login.</p>
        </div>
        <div className="space-y-2">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="text-sm font-medium">{created.user?.admin?.name}</p></div>
          <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{created.user?.email}</p></div>
          <div>
            <p className="text-xs text-muted-foreground">Temporary Password</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">{showPwd ? created.tempPassword : "••••••••••"}</p>
              <button onClick={() => setShowPwd((v) => !v)} className="p-1 text-muted-foreground hover:text-foreground">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button onClick={() => { navigator.clipboard.writeText(created.tempPassword); notify.success("Copied"); }}
                className="p-1 text-muted-foreground hover:text-foreground"><Copy size={14} /></button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`${ROUTES.system.superAdmins}/${created.user?.id}`)}>View Profile</Button>
          <Button size="sm" className="flex-1" onClick={() => navigate(ROUTES.system.superAdmins)}>Back to Hub</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.system.superAdmins)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Add Super Admin</h1><p className="text-sm text-muted-foreground">A temporary password will be auto-generated</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Full Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Ramesh Kumar" className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="e.g. ramesh@eit.edu.in" className={errors.email ? "border-destructive" : ""} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          Password will be generated from ERP Settings format: <span className="font-mono">{`{username}@SuperAdmin`}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.system.superAdmins)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>{loading ? "Creating…" : "Create Super Admin"}</Button>
      </div>
    </div>
  );
}
