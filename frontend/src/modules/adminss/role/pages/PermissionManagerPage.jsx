// src/modules/role/pages/PermissionManagerPage.jsx
// ONE page — root/superadmin only
// Tabs: Groups | Users
// Groups tab: create/edit/delete permission groups
// Users tab: search user → assign groups + individual permissions
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Plus, Edit, Trash2, Users, Search, X,
  Check, Loader2, ChevronDown, ChevronUp, ArrowLeft,
  Save, UserCheck,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const GROUP_COLORS = [
  { key: "blue", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "violet", cls: "bg-violet-100 text-violet-700 border-violet-200" },
  { key: "green", cls: "bg-green-100 text-green-700 border-green-200" },
  { key: "amber", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "red", cls: "bg-red-100 text-red-700 border-red-200" },
  { key: "cyan", cls: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { key: "rose", cls: "bg-rose-100 text-rose-700 border-rose-200" },
  { key: "indigo", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
];
const colorCls = k => GROUP_COLORS.find(c => c.key === k)?.cls || GROUP_COLORS[0].cls;

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

// ─────────────────────────────────────────────────────────────
// PERMISSION CHECKLIST — grouped by module
// ─────────────────────────────────────────────────────────────
function PermissionChecklist({ allPerms, selected, onChange }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  // Group by module
  const modules = {};
  allPerms.forEach(p => {
    if (!modules[p.module]) modules[p.module] = [];
    modules[p.module].push(p);
  });

  const toggle = key => onChange(
    selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]
  );

  const toggleModule = (keys) => {
    const allSel = keys.every(k => selected.includes(k));
    onChange(allSel
      ? selected.filter(k => !keys.includes(k))
      : [...new Set([...selected, ...keys])]
    );
  };

  const filteredMods = Object.entries(modules).map(([mod, perms]) => ({
    mod,
    perms: perms.filter(p =>
      !search ||
      p.label.toLowerCase().includes(search.toLowerCase()) ||
      p.key.includes(search.toLowerCase())
    ),
  })).filter(({ perms }) => perms.length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{selected.length} selected</span>
        <div className="flex gap-3 text-xs">
          <button onClick={() => onChange(allPerms.map(p => p.key))} className="text-primary hover:underline">All</button>
          <button onClick={() => onChange([])} className="text-muted-foreground hover:underline">None</button>
        </div>
      </div>
      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-8 pl-8 pr-3 rounded-lg border border-input bg-background text-xs outline-none"
          placeholder="Search permissions…" />
      </div>
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border max-h-72 overflow-y-auto">
        {filteredMods.map(({ mod, perms }) => {
          const keys = perms.map(p => p.key);
          const allSel = keys.every(k => selected.includes(k));
          const someSel = keys.some(k => selected.includes(k));
          const open = expanded[mod] !== false; // default open
          return (
            <div key={mod}>
              <button onClick={() => setExpanded(e => ({ ...e, [mod]: !open }))}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/20 text-left">
                <div onClick={e => { e.stopPropagation(); toggleModule(keys); }}
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${allSel ? "bg-primary border-primary" : someSel ? "bg-primary/30 border-primary" : "border-input"}`}>
                  {allSel && <Check size={9} className="text-primary-foreground" />}
                  {someSel && !allSel && <div className="w-2 h-0.5 bg-primary" />}
                </div>
                <span className="text-xs font-semibold flex-1">{mod}</span>
                <span className="text-[10px] text-muted-foreground">{keys.filter(k => selected.includes(k)).length}/{keys.length}</span>
                {open ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
              </button>
              {open && (
                <div className="px-3 pb-2 pt-0.5 space-y-0.5 bg-muted/5">
                  {perms.map(p => (
                    <label key={p.key} className="flex items-start gap-2 py-1 cursor-pointer group">
                      <div onClick={() => toggle(p.key)}
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${selected.includes(p.key) ? "bg-primary border-primary" : "border-input group-hover:border-primary"}`}>
                        {selected.includes(p.key) && <Check size={9} className="text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{p.label}</p>
                        <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GROUP FORM MODAL
// ─────────────────────────────────────────────────────────────
function GroupModal({ group, allPerms, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: group?.name || "",
    description: group?.description || "",
    color: group?.color || "blue",
    permissions: group?.permissions || [],
    dept_ids: group?.dept_ids || [],
    program_ids: group?.program_ids || [],
  });
  const [saving, setSaving] = useState(false);
  const [scopeDepts, setScopeDepts] = useState([]);
  const [scopePrograms, setScopePrograms] = useState([]);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.departments.list + "?limit=100"),
      axiosInstance.get(EP.programs?.list || "/api/programs?limit=100"),
    ]).then(([dRes, pRes]) => {
      setScopeDepts(dRes.data?.data?.departments || dRes.data?.data || []);
      setScopePrograms(pRes.data?.data?.programs || pRes.data?.data || []);
    }).catch(() => { });
  }, []);

  const save = async () => {
    if (!form.name.trim()) { notify.error("Name required"); return; }
    if (!form.permissions.length) { notify.error("Select at least one permission"); return; }
    setSaving(true);
    try {
      if (group) {
        await axiosInstance.patch(`/api/permissions/groups/${group.id}`, form);
        notify.success("Group updated");
      } else {
        await axiosInstance.post("/api/permissions/groups", form);
        notify.success("Group created");
      }
      onSaved();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold">{group ? "Edit" : "Create"} Permission Group</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={15} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium">Group Name *</label>
              <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. TT Coordinator, HR Manager, HOD" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium">Description</label>
              <input className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What this group can do" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Color</label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_COLORS.map(c => (
                <button key={c.key} onClick={() => setForm(f => ({ ...f, color: c.key }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${c.cls} ${form.color === c.key ? "ring-2 ring-offset-1 ring-current" : ""}`}>
                  {c.key}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Permissions *</label>
            <PermissionChecklist
              allPerms={allPerms}
              selected={form.permissions}
              onChange={perms => setForm(f => ({ ...f, permissions: perms }))}
            />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? "Saving…" : group ? "Update" : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// USER PERMISSION EDITOR
// ─────────────────────────────────────────────────────────────
function UserEditor({ allPerms, groups, onClose }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // user being edited
  const [summary, setSummary] = useState(null); // full permission summary
  const [loading2, setLoading2] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ownPerms, setOwnPerms] = useState([]);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]); // dept scope
  const [depts, setDepts] = useState([]);

  // Load departments on mount for scope selector
  useEffect(() => {
    axiosInstance.get(EP.departments?.list + "?limit=100")
      .then(r => setDepts(r.data?.data?.departments || r.data?.data || []))
      .catch(() => { });
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/permissions/search-users?q=${query}`);
      setUsers(res.data?.data || []);
    } catch { notify.error("Search failed"); }
    finally { setLoading(false); }
  };

  const openUser = async (user) => {
    setSelected(user);
    setLoading2(true);
    try {
      const [permRes, deptRes] = await Promise.all([
        axiosInstance.get(`/api/permissions/user/${user.id}`),
        axiosInstance.get(EP.departments.list + "?limit=100").catch(() => ({ data: { data: [] } })),
      ]);
      const s = permRes.data?.data;
      setSummary(s);
      setOwnPerms(s.own_permissions || []);
      setAssignedGroups(s.groups.map(g => g.id));
      setSelectedDepts(s.groups.flatMap(g => g.dept_id ? [g.dept_id] : []));
      setDepts(deptRes.data?.data?.departments || deptRes.data?.data || []);
    } catch { notify.error("Failed to load user permissions"); }
    finally { setLoading2(false); }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // 1. Save own permissions
      await axiosInstance.post(`/api/permissions/user/${selected.id}`, { permissions: ownPerms });

      // 2. Compute group changes
      const was = summary.groups.map(g => g.id);
      const toAdd = assignedGroups.filter(id => !was.includes(id));
      const toRem = was.filter(id => !assignedGroups.includes(id));

      if (toAdd.length) {
        await axiosInstance.post("/api/permissions/groups/assign", { user_id: selected.id, group_ids: toAdd });
      }
      for (const gid of toRem) {
        await axiosInstance.delete(`/api/permissions/groups/assign/${selected.id}/${gid}`);
      }

      notify.success(`Permissions saved for ${summary.name || summary.email}`);
      // Refresh
      await openUser(selected);
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  // Effective = union of ownPerms + selected groups' permissions
  const groupPerms = groups.filter(g => assignedGroups.includes(g.id)).flatMap(g => g.permissions || []);
  const effective = [...new Set([...ownPerms, ...groupPerms])];

  return (
    <div className="space-y-4">
      {/* Search */}
      {!selected && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Search for a user to assign permissions</p>
          <div className="flex gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              className={inp} placeholder="Search by name or email…" />
            <button onClick={search} disabled={loading}
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          </div>
          {users.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {users.map(u => (
                <button key={u.id} onClick={() => openUser(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/30 text-left">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">
                    {(u.admin?.name || u.faculty?.name || u.email)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.admin?.name || u.faculty?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.role}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {u.permissionGroups?.slice(0, 2).map(ug => (
                      <span key={ug.group.id} className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${colorCls(ug.group.color)}`}>
                        {ug.group.name}
                      </span>
                    ))}
                    {u.permissions?.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border bg-muted text-muted-foreground">
                        +{u.permissions.length} perms
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      {selected && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelected(null); setSummary(null); }}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"><ArrowLeft size={15} /></button>
            <div className="flex-1">
              <p className="font-semibold text-sm">{summary?.name || selected.email}</p>
              <p className="text-xs text-muted-foreground">{selected.email} · {selected.role}
                {summary?.department && ` · ${summary.department}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Effective permissions</p>
              <p className="text-lg font-bold text-primary">{effective.length}</p>
            </div>
          </div>

          {loading2 ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* Assign Groups */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permission Groups</p>
                <div className="grid grid-cols-2 gap-2">
                  {groups.map(g => {
                    const active = assignedGroups.includes(g.id);
                    return (
                      <button key={g.id}
                        onClick={() => setAssignedGroups(prev => active ? prev.filter(id => id !== g.id) : [...prev, g.id])}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/20"}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${active ? "bg-primary border-primary" : "border-input"}`}>
                          {active && <Check size={9} className="text-primary-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{g.name}</p>
                          <p className="text-[10px] text-muted-foreground">{g.permissions?.length} permissions</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${colorCls(g.color)}`}>●</span>
                      </button>
                    );
                  })}
                  {groups.length === 0 && (
                    <p className="col-span-2 text-xs text-muted-foreground py-2">No groups yet — create some in the Groups tab</p>
                  )}
                </div>
              </div>

              {/* Individual permissions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Individual Permissions</p>
                <PermissionChecklist
                  allPerms={allPerms}
                  selected={ownPerms}
                  onChange={setOwnPerms}
                />
              </div>

              {/* Effective preview */}
              {effective.length > 0 && (
                <div className="bg-muted/20 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">Effective permissions ({effective.length} total)</p>
                  <div className="flex flex-wrap gap-1">
                    {effective.map(p => {
                      const fromGroup = groupPerms.includes(p) && !ownPerms.includes(p);
                      return (
                        <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${fromGroup ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-muted text-muted-foreground border-border"}`}>
                          {p}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded bg-blue-200 mr-1" />From groups
                    <span className="inline-block w-2 h-2 rounded bg-muted ml-3 mr-1" />Own
                  </p>
                </div>
              )}

              {/* Dept scope selector */}
              {depts.length > 0 && assignedGroups.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department Scope <span className="font-normal">(optional — leave empty for institute-wide)</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    {depts.map(d => {
                      const sel = selectedDepts.includes(d.id);
                      return (
                        <button key={d.id} onClick={() => setSelectedDepts(prev =>
                          sel ? prev.filter(id => id !== d.id) : [...prev, d.id]
                        )}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${sel ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedDepts.length === 0 ? "No scope = institute-wide access" : `Restricted to ${selectedDepts.length} department(s)`}
                  </p>
                </div>
              )}

              <button onClick={save} disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save Permissions"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function PermissionManagerPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("groups"); // groups | users
  const [groups, setGroups] = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [deleting, setDeleting] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/api/permissions/groups"),
      axiosInstance.get("/api/permissions/available"),
    ]).then(([gRes, pRes]) => {
      setGroups(gRes.data?.data || []);
      setAllPerms(pRes.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteGroup = async (g) => {
    if (!confirm(`Delete "${g.name}"?`)) return;
    setDeleting(g.id);
    try {
      await axiosInstance.delete(`/api/permissions/groups/${g.id}`);
      notify.success("Deleted");
      load();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setDeleting(""); }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield size={18} className="text-primary" />Permission Manager
            </h1>
            <p className="text-sm text-muted-foreground">Create groups · assign to users · control what they see</p>
          </div>
        </div>
        {tab === "groups" && (
          <button onClick={() => { setEditGroup(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14} />New Group
          </button>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">How it works</p>
        <p>1. Create a <strong>Permission Group</strong> (e.g. "TT Coordinator") with the permissions they need</p>
        <p>2. Go to <strong>Users</strong> tab → search user → assign groups + any extra individual permissions</p>
        <p>3. User logs in → dashboard shows only the modules they have access to</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
        {[["groups", "Permission Groups"], ["users", "Assign to Users"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* GROUPS TAB */}
      {tab === "groups" && (
        loading
          ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
          : (
            <div className="space-y-3">
              {groups.length === 0 && (
                <div className="text-center py-14 bg-card border border-border rounded-2xl space-y-3">
                  <Shield size={32} className="mx-auto text-muted-foreground opacity-30" />
                  <p className="font-semibold">No permission groups yet</p>
                  <p className="text-sm text-muted-foreground">Create your first group to start assigning permissions</p>
                  <button onClick={() => setShowForm(true)}
                    className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm">
                    <Plus size={13} />Create Group
                  </button>
                </div>
              )}
              {groups.map(g => (
                <div key={g.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorCls(g.color)}`}>{g.name}</span>
                        <span className="text-xs text-muted-foreground">{g.permissions?.length} permissions</span>
                        <span className="text-xs text-muted-foreground">· {g._count?.assignments || 0} users</span>
                      </div>
                      {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                      <div className="flex flex-wrap gap-1">
                        {g.permissions?.slice(0, 8).map(p => (
                          <code key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p}</code>
                        ))}
                        {g.permissions?.length > 8 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{g.permissions.length - 8} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditGroup(g); setShowForm(true); }}
                        className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => deleteGroup(g)} disabled={deleting === g.id}
                        className="p-2 rounded-lg border border-border hover:bg-red-50 hover:text-red-500 text-muted-foreground disabled:opacity-50">
                        {deleting === g.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* USERS TAB */}
      {tab === "users" && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <UserEditor allPerms={allPerms} groups={groups} onClose={() => setTab("groups")} />
        </div>
      )}

      {/* Group Form Modal */}
      {showForm && (
        <GroupModal
          group={editGroup}
          allPerms={allPerms}
          onClose={() => { setShowForm(false); setEditGroup(null); }}
          onSaved={() => { setShowForm(false); setEditGroup(null); load(); }}
        />
      )}
    </div>
  );
}