// src/modules/role/pages/AccessRolesPage.jsx
// Create custom roles (Director, TPO, Librarian, etc.) with
// granular permission sets, then assign them to users.
import { useState, useEffect } from "react";
import {
  ShieldCheck, Plus, Edit, Trash2, Users, X, Loader2,
  Search, UserPlus, UserMinus, Check,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";

function RoleModal({ role, allPermissions, onSave, onClose }) {
  const isEdit = !!role?.id;
  const [form, setForm] = useState({
    name: role?.name || "",
    label: role?.label || "",
    description: role?.description || "",
  });
  const [selectedPerms, setSelectedPerms] = useState(
    new Set(role?.rolePermissions?.map((rp) => rp.permission.key) || [])
  );
  const [loading, setLoading] = useState(false);

  const grouped = allPermissions.reduce((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  const togglePerm = (key) => {
    const s = new Set(selectedPerms);
    s.has(key) ? s.delete(key) : s.add(key);
    setSelectedPerms(s);
  };

  const toggleModule = (mod, perms) => {
    const s = new Set(selectedPerms);
    const allSelected = perms.every((p) => s.has(p.key));
    perms.forEach((p) => allSelected ? s.delete(p.key) : s.add(p.key));
    setSelectedPerms(s);
  };

  const handleSave = async () => {
    if (!form.label.trim()) return notify.error("Label is required");
    if (!isEdit && !form.name.trim()) return notify.error("Role name is required");
    setLoading(true);
    try {
      const payload = { ...form, permissionKeys: [...selectedPerms] };
      if (isEdit) await axiosInstance.patch(EP.accessRoles.update(role.id), payload);
      else await axiosInstance.post(EP.accessRoles.create, payload);
      notify.success(isEdit ? "Role updated" : "Role created");
      onSave();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">{isEdit ? "Edit Role" : "Create New Role"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Role Key * <span className="text-muted-foreground">(e.g. DIRECTOR, TPO)</span></label>
                <input className={`${inp} uppercase font-mono`} value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))} placeholder="DIRECTOR" />
              </div>
            )}
            <div className={`space-y-1.5 ${isEdit ? "col-span-2" : ""}`}>
              <label className="text-xs font-medium">Display Label *</label>
              <input className={inp} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Director" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <input className={inp} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions ({selectedPerms.size} selected)</p>
            {Object.entries(grouped).map(([mod, perms]) => {
              const allSelected = perms.every((p) => selectedPerms.has(p.key));
              const someSelected = perms.some((p) => selectedPerms.has(p.key));
              return (
                <div key={mod} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleModule(mod, perms)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 text-left">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? "bg-primary border-primary" : someSelected ? "bg-primary/30 border-primary/50" : "border-input"}`}>
                      {allSelected && <Check size={10} className="text-primary-foreground" />}
                    </div>
                    <span className="text-xs font-semibold capitalize">{mod}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{perms.filter((p) => selectedPerms.has(p.key)).length}/{perms.length}</span>
                  </button>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {perms.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 cursor-pointer">
                        <input type="checkbox" checked={selectedPerms.has(p.key)} onChange={() => togglePerm(p.key)} className="rounded" />
                        <span className="text-xs">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}{isEdit ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ role, onClose, onAssigned }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const loadUsers = async () => {
    const r = await axiosInstance.get(EP.accessRoles.users(role.id));
    setUsers(r.data?.data || []);
  };

  useEffect(() => { loadUsers(); }, [role.id]);

  const search_ = async (q) => {
    if (!q || q.length < 2) return setResults([]);
    try {
      const [f, a] = await Promise.all([
        axiosInstance.get(EP.faculty.list, { params: { search: q, limit: 5 } }),
        axiosInstance.get(EP.admins.list, { params: { search: q, limit: 5 } }),
      ]);
      setResults([
        ...(f.data?.data?.faculty || []).map((u) => ({ id: u.user_id, label: u.name, sub: u.emp_id, type: "Faculty" })),
        ...(a.data?.data || []).map((u) => ({ id: u.user_id, label: u.name, sub: u.email, type: "Admin" })),
      ]);
    } catch { }
  };

  useEffect(() => { const t = setTimeout(() => search_(search), 300); return () => clearTimeout(t); }, [search]);

  const handleAssign = async (userId) => {
    setAssigning(true);
    try {
      await axiosInstance.post(EP.accessRoles.assign(role.id), { user_id: userId });
      notify.success("Role assigned"); setSearch(""); setResults([]); loadUsers(); onAssigned();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setAssigning(false); }
  };

  const handleRevoke = async (userId) => {
    try {
      await axiosInstance.post(EP.accessRoles.revoke(role.id), { user_id: userId });
      notify.success("Role revoked"); loadUsers(); onAssigned();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div><p className="font-semibold">{role.label}</p><p className="text-xs text-muted-foreground">{users.length} users assigned</p></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search faculty or admin to assign…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {results.length > 0 && (
            <div className="mt-2 border border-border rounded-xl divide-y divide-border max-h-40 overflow-y-auto">
              {results.map((u) => (
                <button key={u.id} onClick={() => handleAssign(u.id)} disabled={assigning}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left">
                  <UserPlus size={12} className="text-primary shrink-0" />
                  <p className="text-xs font-medium">{u.label}</p>
                  <p className="text-[10px] text-muted-foreground ml-auto">{u.type} · {u.sub}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {users.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No users assigned yet</p>
          ) : users.map((ur) => (
            <div key={ur.user.id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                {(ur.user.admin?.name || ur.user.faculty?.name || ur.user.email)[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ur.user.admin?.name || ur.user.faculty?.name || ur.user.email}</p>
                <p className="text-[10px] text-muted-foreground">{ur.user.role} {ur.user.faculty?.department?.name ? `· ${ur.user.faculty.department.name}` : ""}</p>
              </div>
              <button onClick={() => handleRevoke(ur.user.id)} className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0">
                <UserMinus size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccessRolesPage() {
  const { can } = usePageGuard();
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        axiosInstance.get(EP.accessRoles.list),
        axiosInstance.get(EP.accessRoles.permissions),
      ]);
      setRoles(r.data?.data || []);
      setAllPermissions(p.data?.data || []);
    } catch { notify.error("Failed to load roles"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(EP.accessRoles.delete(deleteTarget.id));
      notify.success("Role deleted"); setDeleteTarget(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} /> Access Roles</h1>
          <p className="text-sm text-muted-foreground">Create custom roles like Director, TPO, with their own permission sets</p>
        </div>
        {can("roles.create") && (
          <button onClick={() => setModal({ role: null })} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14} /> Create Role
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      ) : roles.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <ShieldCheck size={32} className="mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground">No custom roles yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create roles like Director, TPO, Librarian with specific permissions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{role.label}</p>
                  <code className="text-[10px] font-mono text-muted-foreground">{role.name}</code>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">{role._count?.rolePermissions ?? 0} perms</span>
              </div>
              {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{role._count?.userRoles ?? 0}</span> users assigned</p>
                <div className="flex gap-1">
                  {can("roles.assign") && (
                    <button onClick={() => setAssignModal(role)} className="h-7 px-2 rounded-lg hover:bg-muted text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Users size={12} /> Assign
                    </button>
                  )}
                  {can("roles.update") && <button onClick={() => setModal({ role })} className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Edit size={12} /></button>}
                  {can("roles.delete") && <button onClick={() => setDeleteTarget(role)} className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && <RoleModal role={modal.role} allPermissions={allPermissions} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />}
      {assignModal && <AssignModal role={assignModal} onClose={() => setAssignModal(null)} onAssigned={load} />}
      <ConfirmModal open={!!deleteTarget} title="Delete Role" variant="danger"
        message={`Delete "${deleteTarget?.label}"? Only possible if no users currently hold this role.`}
        confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}