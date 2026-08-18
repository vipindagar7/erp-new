// src/modules/groups/pages/FacultyGroupsPage.jsx
import { useState, useEffect } from "react";
import { GraduationCap, Plus, Edit, Trash2, Search, UserPlus, UserMinus, Loader2, X } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";

const GROUP_TYPES = ["OTHER","DEPARTMENT","COMMITTEE","EVENT"];

function GroupModal({ group, onSave, onClose }) {
  const [form, setForm] = useState({ name: group?.name||"", description: group?.description||"", type: group?.type||"OTHER" });
  const [loading, setLoading] = useState(false);
  const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  const handleSave = async () => {
    if (!form.name.trim()) return notify.error("Name required");
    setLoading(true);
    try {
      if (group?.id) await axiosInstance.patch(EP.groups.facultyUpdate(group.id), form);
      else           await axiosInstance.post(EP.groups.facultyCreate, form);
      notify.success(group?.id ? "Updated" : "Created"); onSave();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <h2 className="text-base font-semibold">{group?.id ? "Edit" : "Create"} Faculty Group</h2>
        <div className="space-y-3">
          <div className="space-y-1.5"><label className="text-xs font-medium">Name *</label><input className={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Type</label>
            <select className={inp} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {GROUP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-xs font-medium">Description</label><textarea rows={2} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}{group?.id ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupDetailModal({ group, onClose, onRefresh }) {
  const [search, setSearch]     = useState("");
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState(null);

  const searchFaculty = async (q) => {
    if (!q || q.length < 2) return setResults([]);
    setSearching(true);
    try {
      const r = await axiosInstance.get(EP.faculty.list, { params: { search: q, limit: 10 } });
      setResults(r.data?.data?.faculty || []);
    } catch {} finally { setSearching(false); }
  };

  useEffect(() => { const t = setTimeout(() => searchFaculty(search), 300); return () => clearTimeout(t); }, [search]);

  const handleAdd = async (facultyId) => {
    try {
      await axiosInstance.post(EP.groups.facultyAddById(group.id), { faculty_ids: [facultyId] });
      notify.success("Added"); onRefresh(); setResults([]); setSearch("");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const handleRemove = async (facultyId) => {
    setRemoving(facultyId);
    try {
      await axiosInstance.delete(EP.groups.facultyRemove(group.id, facultyId));
      notify.success("Removed"); onRefresh();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setRemoving(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div><p className="font-semibold">{group.name}</p><p className="text-xs text-muted-foreground">{group._count?.members ?? group.members?.length ?? 0} members</p></div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search faculty to add…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {results.length > 0 && (
            <div className="mt-2 bg-background border border-border rounded-xl divide-y divide-border max-h-40 overflow-y-auto">
              {results.map((f) => (
                <button key={f.id} onClick={() => handleAdd(f.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left">
                  <UserPlus size={12} className="text-primary shrink-0" />
                  <p className="text-xs font-medium">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground ml-auto">{f.emp_id} · {f.department?.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {!group.members?.length ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No members yet</p>
          ) : group.members.map((m) => (
            <div key={m.faculty_id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                {m.faculty?.name?.[0] || "F"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.faculty?.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.faculty?.emp_id} · {m.faculty?.designation} · {m.faculty?.department?.name}</p>
              </div>
              <button onClick={() => handleRemove(m.faculty_id)} disabled={removing === m.faculty_id}
                className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0">
                {removing === m.faculty_id ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FacultyGroupsPage() {
  const { can } = usePageGuard();
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal]       = useState(null);
  const [detail, setDetail]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.groups.facultyList, { params: { search: search||undefined, type: typeFilter||undefined } });
      setGroups(r.data?.data?.groups || r.data?.data || []);
    } catch { notify.error("Failed"); }
    finally { setLoading(false); }
  };

  const loadDetail = async (id) => {
    try { const r = await axiosInstance.get(EP.groups.facultyById(id)); setDetail(r.data?.data); }
    catch { notify.error("Failed to load group"); }
  };

  useEffect(() => { load(); }, [search, typeFilter]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try { await axiosInstance.delete(EP.groups.facultyDelete(deleteTarget.id)); notify.success("Deleted"); setDeleteTarget(null); load(); }
    catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setDeleteLoading(false); }
  };

  const TYPE_COLORS = { DEPARTMENT: "bg-blue-100 text-blue-700", COMMITTEE: "bg-violet-100 text-violet-700", EVENT: "bg-amber-100 text-amber-700", OTHER: "bg-muted text-muted-foreground" };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><GraduationCap size={20} /> Faculty Groups</h1>
          <p className="text-sm text-muted-foreground">{groups.length} groups</p>
        </div>
        {can("groups.create") && (
          <button onClick={() => setModal({ group: null })} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14} /> Create Group
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
          <option value="">All Types</option>
          {GROUP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.length === 0 ? (
            <div className="col-span-3 text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
              <GraduationCap size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No faculty groups found</p>
            </div>
          ) : groups.map((g) => (
            <div key={g.id} className="bg-card border border-border rounded-2xl p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{g.name}</p>
                  {g.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.description}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${TYPE_COLORS[g.type] || TYPE_COLORS.OTHER}`}>{g.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{g._count?.members ?? 0}</span> members</p>
                <div className="flex gap-1">
                  <button onClick={() => loadDetail(g.id)} className="h-7 px-2 rounded-lg hover:bg-muted text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <GraduationCap size={12} /> Manage
                  </button>
                  {can("groups.update") && <button onClick={() => setModal({ group: g })} className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Edit size={12} /></button>}
                  {can("groups.delete") && <button onClick={() => setDeleteTarget(g)} className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && <GroupModal group={modal.group} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />}
      {detail && <GroupDetailModal group={detail} onClose={() => setDetail(null)} onRefresh={() => loadDetail(detail.id)} />}
      <ConfirmModal open={!!deleteTarget} title="Delete Faculty Group" variant="danger"
        message={`Delete "${deleteTarget?.name}" and all its members?`} confirmLabel="Delete"
        loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
