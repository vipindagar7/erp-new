// src/modules/section/pages/SectionsPage.jsx  ── V3 REPLACE
// Uses branch_id (schema_v2) — NOT course_id
import { useState, useEffect } from "react";
import { Layers, Plus, Edit, Trash2, Search, Upload, ArrowUp, ArrowDown, Users } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";
import BulkUploadPanel from "../../../../components/shared/BulkUploadPanel.jsx";

const CURRENT_YEAR = new Date().getFullYear();
const STATUS_COLOR = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

function SectionModal({ section, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", branch_id: "", _branchLabel: "",
    semester: 1, batch: `${CURRENT_YEAR}-${CURRENT_YEAR + 4}`,
    academic_year: `${CURRENT_YEAR}-${String(CURRENT_YEAR + 1).slice(2)}`,
    room_no: "", capacity: "", class_coordinator_id: "", _coordLabel: "",
    is_combined: false, description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      name: section?.name || "",
      branch_id: section?.branch_id || section?.branch?.id || "",
      _branchLabel: section?.branch?.name || "",
      semester: section?.semester || 1,
      batch: section?.batch || `${CURRENT_YEAR}-${CURRENT_YEAR + 4}`,
      academic_year: section?.academic_year || `${CURRENT_YEAR}-${String(CURRENT_YEAR + 1).slice(2)}`,
      room_no: section?.room_no || "",
      capacity: section?.capacity || "",
      class_coordinator_id: section?.class_coordinator_id || section?.class_coordinator?.id || "",
      _coordLabel: section?.class_coordinator?.name || "",
      is_combined: section?.is_combined || false,
      description: section?.description || "",
    });
  }, [section]);

  const save = async () => {
    if (!form.name.trim() || !form.branch_id) { notify.error("Name and branch required"); return; }
    if (!form.semester || form.semester < 1 || form.semester > 8) { notify.error("Semester must be 1–8"); return; }
    if (!form.batch.trim()) { notify.error("Batch required"); return; }
    setLoading(true);
    try {
      const payload = {
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
      };
      if (section?.id) await axiosInstance.patch(EP.sections.update(section.id), payload);
      else await axiosInstance.post(EP.sections.create, payload);
      notify.success(section?.id ? "Section updated" : "Section created");
      onSave();
    } catch (err) { notify.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold">{section?.id ? "Edit" : "Add"} Section</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Section Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="CSE-A" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Branch * <span className="text-muted-foreground">(determines program & department)</span></Label>
            <SearchSelect
              endpoint={EP.branches.list}
              dataPath="branches"
              valueKey="id"
              labelKey="name"
              subLabelKey="program.name"
              value={form.branch_id}
              selectedLabel={form._branchLabel}
              onChange={(val, opt) => setForm((f) => ({ ...f, branch_id: val, _branchLabel: opt?.name || "" }))}
              placeholder="Search branches…"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Semester * (1–8)</Label>
              <Input type="number" min={1} max={8} value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Batch *</Label>
              <Input value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} placeholder="2024-2028" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Academic Year</Label>
              <Input value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))} placeholder="2024-25" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Class Coordinator</Label>
            <SearchSelect
              endpoint={EP.faculty.list}
              dataPath="faculty"
              valueKey="id"
              labelKey="name"
              subLabelKey="department.name"
              value={form.class_coordinator_id}
              selectedLabel={form._coordLabel}
              onChange={(val, opt) => setForm((f) => ({ ...f, class_coordinator_id: val, _coordLabel: opt?.name || "" }))}
              placeholder="Search faculty…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Room No</Label>
              <Input value={form.room_no} onChange={(e) => setForm((f) => ({ ...f, room_no: e.target.value }))} placeholder="101" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="60" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="combined" checked={form.is_combined}
              onChange={(e) => setForm((f) => ({ ...f, is_combined: e.target.checked }))} className="w-4 h-4" />
            <Label htmlFor="combined" className="text-xs cursor-pointer">Combined section (FYE / multiple branches)</Label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={save}>{loading ? "Saving…" : section?.id ? "Save" : "Create"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function SectionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState(searchParams.get("branch_id") || "");
  const [semFilter, setSemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [modal, setModal] = useState(null);
  const [bulk, setBulk] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.sections.list, {
        params: {
          search: search || undefined,
          branch_id: branchFilter || undefined,
          semester: semFilter || undefined,
          status: statusFilter || "ACTIVE",
          limit: 200,
        },
      });
      setSections(r.data?.data?.sections || []);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, branchFilter, semFilter]);

  const handleDelete = async () => {
    setActing(true);
    try {
      await axiosInstance.delete(EP.sections.delete(delTarget.id));
      notify.success("Section deleted"); setDelTarget(null); load();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          <h1 className="text-xl font-bold">Sections</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{sections.length}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulk((b) => !b)}>
            <Upload size={13} className="mr-1.5" /> {bulk ? "Hide Bulk" : "Bulk Upload"}
          </Button>
          <Button size="sm" onClick={() => setModal("create")}>
            <Plus size={13} className="mr-1.5" /> Add Section
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections…" className="pl-9" />
        </div>
        <div className="w-56">
          <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
            subLabelKey="program.name" value={branchFilter} onChange={(v) => setBranchFilter(v)} placeholder="All branches" />
        </div>
        <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm">
          <option value="ACTIVE">Active only</option>
          <option value="">All sections</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {bulk && (
        <BulkUploadPanel
          templateUrl={EP.sections.template}
          uploadUrl={EP.sections.bulkUpload}
          templateName="section-template.xlsx"
          module="Section"
          onSuccess={load}
          fields={[
            { label: "name", required: true, notes: "Section name e.g. CSE-A" },
            { label: "branch_code", required: true, notes: "From Branches reference sheet" },
            { label: "semester", required: true, notes: "1–8" },
            { label: "batch", required: true, notes: "e.g. 2024-2028" },
            { label: "academic_year", required: false, notes: "e.g. 2024-25" },
            { label: "room_no", required: false, notes: "Classroom number" },
            { label: "capacity", required: false, notes: "Max students" },
            { label: "class_coordinator_emp_id", required: false, notes: "Faculty emp_id" },
            { label: "is_combined", required: false, notes: "true/false. Default: false" },
          ]}
        />
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["Section", "Branch", "Program", "Sem", "Batch", "Academic Year", "Students", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">Loading…</td></tr>
            ) : sections.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-sm text-muted-foreground">No sections found. Create one or use bulk upload.</td></tr>
            ) : sections.map((s) => (
              <tr key={s.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.sections.detail(s.id))}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    {s.is_combined && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Combined</span>}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{s.code}</p>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{s.branch?.name || "—"}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{s.branch?.program?.name || "—"}</td>
                <td className="px-3 py-3">
                  <span className="text-sm font-bold text-primary">{s.semester}</span>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{s.batch || "—"}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{s.academic_year || "—"}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Users size={11} />{s._count?.students ?? 0}</div>
                </td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[s.status] || "bg-muted"}`}>{s.status}</span>
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => navigate(ROUTES.sections.detail(s.id))}
                      className="p-1.5 rounded hover:bg-violet-50 text-violet-600 text-xs font-medium"
                      title="Promote/Demote/History">
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => setModal(s)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit size={13} /></button>
                    <button onClick={() => setDelTarget(s)} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <SectionModal section={modal === "create" ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}

      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Delete {delTarget.name}?</h2>
            <p className="text-sm text-muted-foreground">This soft-deletes the section. Students remain but section is hidden from active lists.</p>
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