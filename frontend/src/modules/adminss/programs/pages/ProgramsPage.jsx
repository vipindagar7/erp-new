// src/modules/programs/pages/ProgramsPage.jsx
// Programs + Branches management
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Plus, Edit, Trash2, Search, ChevronRight, X, Loader2, Building2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { CanDo } from "../../../../components/shared/PermGuard.jsx";

const inp = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

// ── Modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Program Form Modal ─────────────────────────────────────────
function ProgramModal({ program, departments, onSave, onClose }) {
  const [form, setForm] = useState({
    name: program?.name || "",
    code: program?.code || "",
    dept_id: program?.dept_id || program?.department?.id || "",
    duration_years: program?.duration_years || 4,
    type: program?.type || "UG",
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.dept_id) return notify.error("Name and department required");
    setSaving(true);
    try {
      if (program?.id) await axiosInstance.patch(EP.programs.update(program.id), form);
      else await axiosInstance.post(EP.programs.create, form);
      notify.success(program?.id ? "Updated" : "Created");
      onSave();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={program?.id ? "Edit Program" : "Add Program"} onClose={onClose}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Program Name *</label>
          <input className={inp} value={form.name} onChange={set("name")} placeholder="B.Tech, BCA, MBA…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Code</label>
            <input className={inp} value={form.code} onChange={set("code")} placeholder="BTECH" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Type</label>
            <select className={sel} value={form.type} onChange={set("type")}>
              {["UG", "PG", "DIPLOMA", "PHD", "CERTIFICATE"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Department *</label>
          <select className={sel} value={form.dept_id} onChange={set("dept_id")}>
            <option value="">Select…</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Duration (years)</label>
          <input className={inp} type="number" min={1} max={6} value={form.duration_years} onChange={set("duration_years")} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="flex-1 h-9 rounded-xl border border-border text-sm hover:bg-muted">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function ProgramsPage() {
  const departments = useSelector(s => s.academic?.departments?.list ?? []);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [progModal, setProgModal] = useState(null); // null | program obj | "new"
  const [branchModal, setBranchModal] = useState(null); // null | {branch?, programId}
  const [expanded, setExpanded] = useState({}); // programId → branches[]
  const [loadingBranch, setLoadingBranch] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([
        axiosInstance.get(EP.programs.list + "?limit=200"),
      ]);
      const pData = pRes.data?.data;
      setPrograms(
        Array.isArray(pData) ? pData :
          Array.isArray(pData?.programs) ? pData.programs :
            Array.isArray(pData?.data) ? pData.data : []
      );
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadBranches = async (programId) => {
    if (expanded[programId]) { setExpanded(e => ({ ...e, [programId]: null })); return; }
    setLoadingBranch(l => ({ ...l, [programId]: true }));
    try {
      const res = await axiosInstance.get(EP.branches?.byProgram?.(programId) || `/programs/${programId}/branches`);
      setExpanded(e => ({ ...e, [programId]: res.data?.data || [] }));
    } catch { notify.error("Failed to load branches"); }
    finally { setLoadingBranch(l => ({ ...l, [programId]: false })); }
  };

  const deleteProgram = async (id) => {
    if (!confirm("Delete this program?")) return;
    try {
      await axiosInstance.delete(EP.programs.delete?.(id) || `/programs/${id}`);
      notify.success("Deleted");
      setPrograms(p => p.filter(x => x.id !== id));
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  const deleteBranch = async (branchId, programId) => {
    if (!confirm("Delete this branch?")) return;
    try {
      await axiosInstance.delete(EP.branches?.delete?.(branchId) || `/branches/${branchId}`);
      notify.success("Deleted");
      setExpanded(e => ({ ...e, [programId]: e[programId]?.filter(b => b.id !== branchId) }));
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  const filtered = programs.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || p.dept_id === deptFilter || p.department?.id === deptFilter || p.department_id === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Programs & Branches</h1>
          <p className="text-sm text-muted-foreground">Manage programs and branches</p>
        </div>
        <CanDo perm="academic.create">
          <button onClick={() => setProgModal("new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14} />Add Program
          </button>
        </CanDo>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none"
            placeholder="Search programs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none min-w-40">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Programs list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No programs found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(prog => (
            <div key={prog.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Program row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => loadBranches(prog.id)}
                  className="flex items-center gap-3 flex-1 text-left hover:text-primary transition-colors">
                  <ChevronRight size={14} className={`transition-transform ${expanded[prog.id] ? "rotate-90" : ""} text-muted-foreground`} />
                  <div>
                    <p className="text-sm font-semibold">{prog.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {prog.code && <span className="font-mono">{prog.code} · </span>}
                      {prog.type} · {prog.duration_years}yr · {prog.department?.name}
                    </p>
                  </div>
                </button>
                {loadingBranch[prog.id] && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                <CanDo perm="academic.create">
                  <button onClick={() => setBranchModal({ programId: prog.id })}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted">
                    <Plus size={11} />Branch
                  </button>
                </CanDo>
                <CanDo perm="academic.update">
                  <button onClick={() => setProgModal(prog)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                    <Edit size={13} />
                  </button>
                </CanDo>
                <CanDo perm="academic.delete">
                  <button onClick={() => deleteProgram(prog.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </CanDo>
              </div>

              {/* Branches */}
              {expanded[prog.id] && (
                <div className="border-t border-border bg-muted/10">
                  {expanded[prog.id].length === 0 ? (
                    <p className="px-8 py-3 text-xs text-muted-foreground">No branches. Add one.</p>
                  ) : (
                    expanded[prog.id].map(branch => (
                      <div key={branch.id} className="flex items-center gap-3 px-8 py-2.5 border-b border-border/50 last:border-0">
                        <Building2 size={13} className="text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{branch.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {branch.code && <span className="font-mono">{branch.code} · </span>}
                            {branch.total_seats && <span>{branch.total_seats} seats · </span>}
                            {branch.affiliation_no && <span>Aff: {branch.affiliation_no}</span>}
                          </p>
                        </div>

                        <CanDo perm="academic.update">
                          <button onClick={() => setBranchModal({ branch, programId: prog.id })} className="p-1 hover:bg-muted rounded-lg text-muted-foreground">
                            <Edit size={12} />
                          </button>
                        </CanDo>
                        <CanDo perm="academic.delete">
                          <button onClick={() => deleteBranch(branch.id, prog.id)} className="p-1 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </CanDo>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {progModal && (
        <ProgramModal
          program={progModal === "new" ? null : progModal}
          departments={departments}
          onSave={() => { setProgModal(null); load(); }}
          onClose={() => setProgModal(null)}
        />
      )}
      {branchModal && (
        <BranchModal
          branch={branchModal.branch}
          programId={branchModal.programId}
          onSave={() => {
            setBranchModal(null);
            if (branchModal.programId) loadBranches(branchModal.programId);
          }}
          onClose={() => setBranchModal(null)}
        />
      )}
    </div>
  );
}