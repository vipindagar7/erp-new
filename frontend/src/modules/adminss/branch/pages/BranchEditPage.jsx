// src/modules/branch/pages/BranchEditPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BranchEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [depts,     setDepts]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [form,    setForm]    = useState({ name: "", dept_id: "", code: "", has_combined_first_year: false });
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.branches.byId(id)),
      axiosInstance.get(EP.departments.list, { params: { limit: 200 } }),
    ]).then(([branchRes, deptRes]) => {
      const b = branchRes.data?.data;
      setForm({ name: b.name, dept_id: b.department?.id || "", code: b.code || "", has_combined_first_year: b.has_combined_first_year || false });
      setDepts(deptRes.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setPageLoading(false));
  }, [id]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name    = "Branch name is required";
    if (!form.dept_id)       e.dept_id = "Department is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosInstance.patch(EP.branches.update(id), form);
      notify.success("Branch updated");
      navigate(ROUTES.branches.detail(id));
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to update");
    } finally { setLoading(false); }
  };

  if (pageLoading) return (
    <div className="max-w-lg space-y-4">
      {[1,2,3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.detail(id))}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Edit Branch</h1>
          <p className="text-sm text-muted-foreground">Update branch details</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Department *</Label>
          <Select value={form.dept_id} onValueChange={set("dept_id")}>
            <SelectTrigger className={`h-10 ${errors.dept_id ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.dept_id && <p className="text-xs text-destructive">{errors.dept_id}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Branch Name *</Label>
          <Input value={form.name} onChange={(e) => set("name")(e.target.value)}
            className={errors.name ? "border-destructive" : ""} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Branch Code</Label>
          <Input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())} className="font-mono" />
          <p className="text-xs text-muted-foreground">Changing the code affects Excel templates and bulk uploads.</p>
        </div>

        <button type="button"
          className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          onClick={() => set("has_combined_first_year")(!form.has_combined_first_year)}>
          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
            ${form.has_combined_first_year ? "border-primary bg-primary" : "border-muted-foreground"}`}>
            {form.has_combined_first_year && <Check size={11} className="text-white" />}
          </div>
          <div>
            <p className="text-sm font-medium">Combined first year</p>
            <p className="text-xs text-muted-foreground mt-0.5">Year-1 students share combined sections with other branches</p>
          </div>
        </button>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.branches.detail(id))}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
