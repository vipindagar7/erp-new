// src/modules/groups/pages/GroupNewPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GROUP_TYPES = ["EVENT","FEST","SPORTS","COMMITTEE","CLUB","OTHER"];

export default function GroupNewPage() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: "", description: "", type: "OTHER" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.type)        e.type = "Type is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.groups.create, form);
      notify.success("Group created");
      navigate(ROUTES.groups.detail(r.data?.data?.id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.groups.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Create Group</h1><p className="text-sm text-muted-foreground">New special group for students</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Group Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Techfest 2025 Committee" className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={form.type} onValueChange={set("type")}>
            <SelectTrigger className={errors.type ? "border-destructive" : ""}><SelectValue /></SelectTrigger>
            <SelectContent>{GROUP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="What is this group for?" rows={3} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.groups.hub)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>{loading ? "Creating…" : "Create Group"}</Button>
      </div>
    </div>
  );
}
