// src/modules/department/pages/DepartmentEditPage.jsx
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

export default function DepartmentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form,        setForm]        = useState({ name: "", code: "" });
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.departments.byId(id))
      .then((r) => { const d = r.data?.data; setForm({ name: d.name || "", code: d.code || "" }); })
      .catch(() => notify.error("Failed to load"))
      .finally(() => setPageLoading(false));
  }, [id]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Department name is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosInstance.patch(EP.departments.update(id), { ...form, code: form.code?.toUpperCase() || undefined });
      notify.success("Department updated");
      navigate(ROUTES.departments.detail(id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (pageLoading) return (
    <div className="max-w-lg space-y-4">
      {[1,2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.departments.detail(id))}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Edit Department</h1>
          <p className="text-sm text-muted-foreground">Update department details</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Department Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)}
            className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Department Code</Label>
          <Input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())}
            maxLength={8} className="font-mono" />
          <p className="text-xs text-muted-foreground">Changing the code affects Excel templates and bulk uploads.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.departments.detail(id))}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}