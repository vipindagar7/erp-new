// src/modules/branch/pages/BranchDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Textarea }from "@/components/ui/textarea";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

// ── Detail view ───────────────────────────────────────────────
export default function BranchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch,  setBranch]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [acting,  setActing]  = useState(false);

  useEffect(() => {
    axiosInstance.get(EP.branches.byId(id))
      .then((r) => setBranch(r.data?.data))
      .catch(() => notify.error("Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const discontinue = async () => {
    setActing(true);
    try {
      await axiosInstance.post(EP.branches.discontinue(id));
      notify.success("Branch discontinued — existing students unaffected");
      setBranch((b) => ({ ...b, is_active: false }));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); setConfirm(false); }
  };

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!branch)  return <div className="py-20 text-center text-sm text-muted-foreground">Not found.</div>;

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{branch.name}</h1>
            {branch.is_active === false && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Discontinued</span>}
          </div>
          <p className="text-sm text-muted-foreground">{branch.code || branch.branch_code}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.branches.edit(id))}><Edit size={13} className="mr-1" /> Edit</Button>
          {branch.is_active !== false && (
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setConfirm(true)}>
              <AlertCircle size={13} className="mr-1" /> Discontinue
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch Details</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{branch.name}</p></div>
          <div><p className="text-xs text-muted-foreground">Code</p><p className="font-mono font-medium">{branch.code || branch.branch_code || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Program</p><p>{branch.program?.name || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Department</p><p>{branch.program?.department?.name || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Duration</p><p>{branch.duration_years ? `${branch.duration_years} years` : "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Total Semesters</p><p>{branch.total_semesters || "—"}</p></div>
        </div>
        {branch.description && <div><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm">{branch.description}</p></div>}
      </div>

      {branch.is_active === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
          This branch is discontinued — no new admissions. Existing students continue until graduation.
        </div>
      )}

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)}
        title="Discontinue Branch?"
        description="No new admissions will be allowed. Existing students are unaffected and will continue until they graduate."
        confirmLabel="Discontinue"
        onConfirm={discontinue} loading={acting} />
    </div>
  );
}

// ── Shared form (New + Edit share this) ───────────────────────
function BranchForm({ initial, submitLabel, onSubmit, loading: saving, backPath }) {
  const navigate = useNavigate();
  const [form,   setForm]   = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => { setForm(initial); }, [JSON.stringify(initial)]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name       = "Branch name is required";
    if (!form.program_id)   e.program_id = "Program is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">

      {/* Name */}
      <div className="space-y-1.5">
        <Label>Branch Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          placeholder="Computer Science & Engineering"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Code */}
      <div className="space-y-1.5">
        <Label>Branch Code <span className="text-muted-foreground font-normal text-xs">(auto-generated if blank)</span></Label>
        <Input
          value={form.branch_code}
          onChange={(e) => set("branch_code")(e.target.value)}
          placeholder="CSE"
          className="font-mono"
        />
      </div>

      {/* Program — searchable */}
      <div className="space-y-1.5">
        <Label>Program *</Label>
        <SearchSelect
          endpoint={EP.programs.list}
          searchParam="search"
          extraParams={{ limit: 30 }}
          dataPath="programs"
          valueKey="id"
          labelKey="name"
          subLabelKey="department.name"
          value={form.program_id}
          selectedLabel={form._programLabel}
          onChange={(val, opt) =>
            setForm((f) => ({ ...f, program_id: val, _programLabel: opt?.name || "" }))
          }
          placeholder="Type to search programs…"
          error={!!errors.program_id}
        />
        {errors.program_id && <p className="text-xs text-destructive">{errors.program_id}</p>}
      </div>

      {/* Duration + Semesters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Duration (years)</Label>
          <Input type="number" min={1} max={6} value={form.duration_years} onChange={(e) => set("duration_years")(e.target.value)} placeholder="4" />
        </div>
        <div className="space-y-1.5">
          <Label>Total Semesters</Label>
          <Input type="number" min={1} max={12} value={form.total_semesters} onChange={(e) => set("total_semesters")(e.target.value)} placeholder="8" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={2} placeholder="Optional…" />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <Button variant="outline" className="flex-1" onClick={() => navigate(backPath)}>Cancel</Button>
        <Button className="flex-1" disabled={saving} onClick={() => validate() && onSubmit(form)}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ── New ───────────────────────────────────────────────────────
export function BranchNewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = async (form) => {
    setLoading(true);
    try {
      const r = await axiosInstance.post(EP.branches.create, {
        name:            form.name.trim(),
        branch_code:     form.branch_code.trim() || undefined,
        program_id:      form.program_id,
        duration_years:  form.duration_years  ? parseInt(form.duration_years)  : undefined,
        total_semesters: form.total_semesters ? parseInt(form.total_semesters) : undefined,
        description:     form.description.trim() || undefined,
      });
      notify.success("Branch created");
      navigate(ROUTES.branches.detail(r.data?.data?.id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold">New Branch</h1>
      </div>
      <BranchForm
        initial={{ name: "", branch_code: "", program_id: "", duration_years: "", total_semesters: "", description: "", _programLabel: "" }}
        submitLabel="Create Branch"
        onSubmit={submit}
        loading={loading}
        backPath={ROUTES.branches.list}
      />
    </div>
  );
}

// ── Edit ──────────────────────────────────────────────────────
export function BranchEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial,  setInitial]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.branches.byId(id))
      .then((r) => {
        const b = r.data?.data;
        setInitial({
          name:            b.name || "",
          branch_code:     b.branch_code || b.code || "",
          program_id:      b.program_id  || b.program?.id  || "",
          duration_years:  b.duration_years  || "",
          total_semesters: b.total_semesters || "",
          description:     b.description || "",
          _programLabel:   b.program?.name || "",
        });
      })
      .catch(() => notify.error("Failed to load"))
      .finally(() => setFetching(false));
  }, [id]);

  const submit = async (form) => {
    setLoading(true);
    try {
      await axiosInstance.patch(EP.branches.update(id), {
        name:            form.name.trim(),
        branch_code:     form.branch_code.trim() || undefined,
        program_id:      form.program_id || undefined,
        duration_years:  form.duration_years  ? parseInt(form.duration_years)  : undefined,
        total_semesters: form.total_semesters ? parseInt(form.total_semesters) : undefined,
        description:     form.description.trim() || undefined,
      });
      notify.success("Branch updated");
      navigate(ROUTES.branches.detail(id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.detail(id))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold">Edit Branch</h1>
      </div>
      <BranchForm
        initial={initial}
        submitLabel="Save Changes"
        onSubmit={submit}
        loading={loading}
        backPath={ROUTES.branches.detail(id)}
      />
    </div>
  );
}
