// src/modules/section/pages/SectionCreatePage.jsx  ── V3 REPLACE
// Uses branch_id (schema_v2) — NOT course_id
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const CURRENT_YEAR = new Date().getFullYear();

export default function SectionCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: "",
    branch_id: searchParams.get("branch_id") || "",
    _branchLabel: "",
    semester: "1",
    batch: `${CURRENT_YEAR}-${CURRENT_YEAR + 4}`,
    academic_year: `${CURRENT_YEAR}-${String(CURRENT_YEAR + 1).slice(2)}`,
    room_no: "",
    capacity: "",
    class_coordinator_id: "",
    _coordLabel: "",
    is_combined: false,
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Section name is required";
    if (!form.branch_id) e.branch_id = "Branch is required";
    if (!form.semester || parseInt(form.semester) < 1 || parseInt(form.semester) > 8)
      e.semester = "Semester must be 1–8";
    if (!form.batch.trim()) e.batch = "Batch is required (e.g. 2024-2028)";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.sections.create, {
        name: form.name.trim(),
        branch_id: form.branch_id,
        semester: parseInt(form.semester),
        batch: form.batch.trim(),
        academic_year: form.academic_year.trim() || undefined,
        room_no: form.room_no.trim() || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        class_coordinator_id: form.class_coordinator_id || undefined,
        is_combined: form.is_combined,
        description: form.description.trim() || undefined,
      });
      notify.success("Section created");
      navigate(ROUTES.sections.detail(r.data?.data?.id));
    } catch (err) { notify.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.sections.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          <h1 className="text-xl font-bold">New Section</h1>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">

        {/* Name */}
        <div className="space-y-1.5">
          <Label>Section Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="CSE-A, ECE-B, FYE-C"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Branch — SearchSelect (replaces course dropdown) */}
        <div className="space-y-1.5">
          <Label>Branch * <span className="text-xs text-muted-foreground font-normal">(determines program & department automatically)</span></Label>
          <SearchSelect
            endpoint={EP.branches.list}
            dataPath="branches"
            valueKey="id"
            labelKey="name"
            subLabelKey="program.name"
            value={form.branch_id}
            selectedLabel={form._branchLabel}
            onChange={(val, opt) => setForm((f) => ({ ...f, branch_id: val, _branchLabel: opt?.name || "" }))}
            placeholder="Type to search branches…"
            error={!!errors.branch_id}
          />
          {errors.branch_id && <p className="text-xs text-destructive">{errors.branch_id}</p>}
          {form.branch_id && (
            <p className="text-xs text-muted-foreground">Program and department will be set automatically from the branch.</p>
          )}
        </div>

        {/* Semester + Batch + Academic Year */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Semester * <span className="text-xs text-muted-foreground">(1–8)</span></Label>
            <Input
              type="number" min={1} max={8}
              value={form.semester}
              onChange={(e) => set("semester")(e.target.value)}
              className={errors.semester ? "border-destructive" : ""}
            />
            {errors.semester && <p className="text-xs text-destructive">{errors.semester}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Batch *</Label>
            <Input
              value={form.batch}
              onChange={(e) => set("batch")(e.target.value)}
              placeholder="2024-2028"
              className={errors.batch ? "border-destructive" : ""}
            />
            {errors.batch && <p className="text-xs text-destructive">{errors.batch}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Academic Year</Label>
            <Input
              value={form.academic_year}
              onChange={(e) => set("academic_year")(e.target.value)}
              placeholder="2024-25"
            />
          </div>
        </div>

        {/* Coordinator */}
        <div className="space-y-1.5">
          <Label>Class Coordinator <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <SearchSelect
            endpoint={EP.faculty.list}
            dataPath="faculty"
            valueKey="id"
            labelKey="name"
            subLabelKey="designation"
            value={form.class_coordinator_id}
            selectedLabel={form._coordLabel}
            onChange={(val, opt) => setForm((f) => ({ ...f, class_coordinator_id: val, _coordLabel: opt?.name || "" }))}
            placeholder="Search faculty…"
          />
        </div>

        {/* Room + Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Room No</Label>
            <Input value={form.room_no} onChange={(e) => set("room_no")(e.target.value)} placeholder="101" />
          </div>
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input type="number" value={form.capacity} onChange={(e) => set("capacity")(e.target.value)} placeholder="60" />
          </div>
        </div>

        {/* Combined checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_combined}
            onChange={(e) => set("is_combined")(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Combined section (FYE / multiple branches in one section)</span>
        </label>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <Input value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Optional notes…" />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.sections.list)}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={handleSubmit}>
            {loading ? "Creating…" : "Create Section"}
          </Button>
        </div>
      </div>
    </div>
  );
}