// src/modules/admin/pages/SuperAdminEditPage.jsx
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

export default function SuperAdminEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "" });
  const [loading, setLoading]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.superadmin.byId(id))
      .then((r) => setForm({ name: r.data?.data?.admin?.name || "" }))
      .catch(() => notify.error("Failed to load"))
      .finally(() => setPageLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { notify.error("Name is required"); return; }
    setLoading(true);
    try {
      await axiosInstance.patch(EP.superadmin.byId(id), { name: form.name });
      notify.success("Updated");
      navigate(`${ROUTES.system.superAdmins}/${id}`);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (pageLoading) return <div className="max-w-md space-y-4">{[1,2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`${ROUTES.system.superAdmins}/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Edit Super Admin</h1><p className="text-sm text-muted-foreground">Update profile details</p></div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Full Name *</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(`${ROUTES.system.superAdmins}/${id}`)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>{loading ? "Saving…" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
