// src/modules/groups/pages/GroupEditPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { SkeletonPage } from "../../../../components/shared/Skeleton.jsx";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GROUP_TYPES = ["EVENT","FEST","SPORTS","COMMITTEE","CLUB","OTHER"];

export default function GroupEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form,    setForm]    = useState(null);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    axiosInstance.get(EP.groups.byId(id))
      .then((r) => { const g = r.data?.data; setForm({ name: g.name, description: g.description || "", type: g.type }); })
      .catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const handleSubmit = async () => {
    if (!form.name?.trim()) { setErrors({ name: "Name required" }); return; }
    setSaving(true);
    try {
      await axiosInstance.patch(EP.groups.update(id), form);
      notify.success("Group updated");
      navigate(ROUTES.groups.detail(id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <SkeletonPage />;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.groups.detail(id))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Edit Group</h1></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Group Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)} className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={set("type")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{GROUP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={3} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.groups.detail(id))}>Cancel</Button>
        <Button className="flex-1" disabled={saving} onClick={handleSubmit}>{saving ? "Saving…" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
