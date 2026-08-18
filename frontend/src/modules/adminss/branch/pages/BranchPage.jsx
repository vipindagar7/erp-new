// src/modules/branch/pages/BranchesPage.jsx  ── V3
import { useState, useEffect } from "react";
import { GitMerge, Plus, Edit, Trash2, Search, Upload, AlertTriangle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";
import BulkUploadPanel from "../../../../components/shared/BulkUploadPanel.jsx";

function BranchModal({ branch, onClose, onSave }) {
  const [form,    setForm]    = useState({ name: "", code: "", program_id: "", _programLabel: "", intake_capacity: "", total_semesters_override: "", has_combined_first_year: false, start_session: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      name:                     branch?.name                     || "",
      code:                     branch?.code                     || "",
      program_id:               branch?.program_id               || branch?.program?.id || "",
      _programLabel:            branch?.program?.name            || "",
      intake_capacity:          branch?.intake_capacity          || "",
      total_semesters_override: branch?.total_semesters_override || "",
      has_combined_first_year:  branch?.has_combined_first_year  || false,
      start_session:            branch?.start_session            || "",
      description:              branch?.description              || "",
    });
  }, [branch]);

  const save = async () => {
    if (!form.name.trim() || !form.program_id) { notify.error("Name and program required"); return; }
    setLoading(true);
    try {
      const payload = {
        name:                     form.name.trim(),
        code:                     form.code.trim()                     || undefined,
        program_id:               form.program_id,
        intake_capacity:          form.intake_capacity          ? parseInt(form.intake_capacity)          : undefined,
        total_semesters_override: form.total_semesters_override ? parseInt(form.total_semesters_override) : undefined,
        has_combined_first_year:  form.has_combined_first_year,
        start_session:            form.start_session.trim()            || undefined,
        description:              form.description.trim()              || undefined,
      };
      if (branch?.id) await axiosInstance.patch(EP.branches.update(branch.id), payload);
      else            await axiosInstance.post(EP.branches.create, payload);
      notify.success(branch?.id ? "Branch updated" : "Branch created");
      onSave();
    } catch (err) { notify.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold">{branch?.id ? "Edit" : "Add"} Branch</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Branch Name *</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Computer Science & Engineering" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Code <span className="text-muted-foreground">(auto if blank)</span></Label>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CSE" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Program *</Label>
            <SearchSelect
              endpoint={EP.programs.list}
              dataPath="programs"
              valueKey="id"
              labelKey="name"
              subLabelKey="department.name"
              value={form.program_id}
              selectedLabel={form._programLabel}
              onChange={(val, opt) => setForm((f) => ({ ...f, program_id: val, _programLabel: opt?.name || "" }))}
              placeholder="Search programs…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Intake Capacity</Label>
              <Input type="number" value={form.intake_capacity} onChange={(e) => setForm((f) => ({ ...f, intake_capacity: e.target.value }))} placeholder="60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sem Override</Label>
              <Input type="number" value={form.total_semesters_override} onChange={(e) => setForm((f) => ({ ...f, total_semesters_override: e.target.value }))} placeholder="e.g. 6" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start Session</Label>
            <Input value={form.start_session} onChange={(e) => setForm((f) => ({ ...f, start_session: e.target.value }))} placeholder="2019-20" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="combined" checked={form.has_combined_first_year}
              onChange={(e) => setForm((f) => ({ ...f, has_combined_first_year: e.target.checked }))} className="w-4 h-4" />
            <Label htmlFor="combined" className="text-xs cursor-pointer">Has combined first year (FYE)</Label>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={save}>{loading ? "Saving…" : branch?.id ? "Save" : "Create"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function BranchesPage() {
  const navigate = useNavigate();
  const [branches,    setBranches]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [programFilter,setProgramFilter] = useState("");
  const [modal,       setModal]       = useState(null);
  const [bulk,        setBulk]        = useState(false);
  const [delTarget,   setDelTarget]   = useState(null);
  const [acting,      setActing]      = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.branches.list, {
        params: { search: search || undefined, program_id: programFilter || undefined, limit: 200 },
      });
      setBranches(r.data?.data?.branches || []);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, programFilter]);

  const handleDelete = async () => {
    setActing(true);
    try {
      await axiosInstance.delete(EP.branches.delete(delTarget.id));
      notify.success("Branch deleted"); setDelTarget(null); load();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GitMerge size={20} className="text-primary" />
          <h1 className="text-xl font-bold">Branches</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{branches.length}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulk((b) => !b)}>
            <Upload size={13} className="mr-1.5" /> {bulk ? "Hide Bulk" : "Bulk Upload"}
          </Button>
          <Button size="sm" onClick={() => setModal("create")}>
            <Plus size={13} className="mr-1.5" /> Add Branch
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search branches…" className="pl-9" />
        </div>
        <div className="w-56">
          <SearchSelect endpoint={EP.programs.list} dataPath="programs" valueKey="id" labelKey="name"
            value={programFilter} onChange={(v) => setProgramFilter(v)} placeholder="All programs" />
        </div>
      </div>

      {bulk && (
        <BulkUploadPanel
          templateUrl={EP.branches.template}
          uploadUrl={EP.branches.bulkUpload}
          templateName="branch-template.xlsx"
          module="Branch"
          onSuccess={load}
          fields={[
            { label: "name",                    required: true,  notes: "Branch display name" },
            { label: "program_code",             required: true,  notes: "From Programs reference sheet" },
            { label: "branch_code",              required: false, notes: "Auto-generated if blank" },
            { label: "intake_capacity",          required: false, notes: "Seats per batch" },
            { label: "total_semesters_override", required: false, notes: "Override program max semesters" },
            { label: "has_combined_first_year",  required: false, notes: "true/false. Default: false" },
            { label: "start_session",            required: false, notes: "e.g. 2019-20" },
          ]}
        />
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["Branch","Code","Program","Department","Intake","FYE","Sections",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">Loading…</td></tr>
            ) : branches.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No branches found.</td></tr>
            ) : branches.map((b) => (
              <tr key={b.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.branches.detail(b.id))}>
                <td className="px-4 py-3">
                  <p className="font-medium">{b.name}</p>
                  {b.discontinued_at && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Discontinued</span>}
                </td>
                <td className="px-4 py-3"><code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{b.code}</code></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{b.program?.name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{b.program?.department?.name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{b.intake_capacity || "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {b.has_combined_first_year ? <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Yes</span> : <span className="text-muted-foreground">No</span>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{b._count?.sections ?? "—"}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setModal(b)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit size={13} /></button>
                    <button onClick={() => setDelTarget(b)} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <BranchModal branch={modal === "create" ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}

      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Delete {delTarget.name}?</h2>
            <p className="text-sm text-muted-foreground">Cannot delete if students are enrolled. Use Discontinue instead for branches with existing students.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDelTarget(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={acting} onClick={handleDelete}>{acting ? "Deleting…" : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}