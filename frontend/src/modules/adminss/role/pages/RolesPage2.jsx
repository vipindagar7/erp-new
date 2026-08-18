// src/modules/adminss/roles/pages/RolesPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, Edit2, Loader2, Save, X, Check, Lock, Unlock, Users, RefreshCw, UserPlus, ChevronDown, ChevronRight, Search } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

const SYSTEM_ROLES = ["SUPER_ADMIN","ADMIN","FACULTY","NON_TEACHING","STUDENT","HOD","DEPT_ADMIN"];

const MODULE_GROUPS = {
  "Students":    ["students:view","students:create","students:edit","students:delete","students:export"],
  "Faculty":     ["faculty:view","faculty:create","faculty:edit","faculty:manage","faculty:export"],
  "Sections":    ["section:view","section:create","section:update","sections:promote"],
  "Timetable":   ["timetable:view","timetable:edit","timetable:generate","timetable:lock"],
  "Attendance":  ["attendance:view","attendance:mark","attendance:edit","attendance:freeze","attendance:export"],
  "Curriculum":  ["curriculum:view","curriculum:edit","curriculum:upload"],
  "Feedback":    ["feedback:view","feedback:create","feedback:manage"],
  "Leave":       ["leave:view","leave:apply","leave:approve","leave:manage"],
  "Reports":     ["reports:view","reports:export"],
  "Settings":    ["settings:view","settings:edit","audit:view"],
  "Roles":       ["roles:view","roles:manage"],
};

const ROLE_COLOR = {
  SUPER_ADMIN:"bg-red-100 text-red-700",ADMIN:"bg-blue-100 text-blue-700",
  FACULTY:"bg-green-100 text-green-700",NON_TEACHING:"bg-amber-100 text-amber-700",
  HOD:"bg-violet-100 text-violet-700",DEPT_ADMIN:"bg-cyan-100 text-cyan-700",
  IT_ADMIN:"bg-slate-100 text-slate-700",EXAM_COORDINATOR:"bg-indigo-100 text-indigo-700",
};

// ── Permission Matrix ─────────────────────────────────────────
function PermMatrix({ perms, setPerms, allPerms }) {
  const [expanded, setExpanded] = useState(Object.keys(MODULE_GROUPS));

  const toggle = (key) => {
    setPerms(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]);
  };
  const toggleModule = (keys) => {
    const allOn = keys.every(k=>perms.includes(k));
    if (allOn) setPerms(prev=>prev.filter(k=>!keys.includes(k)));
    else       setPerms(prev=>[...new Set([...prev,...keys])]);
  };
  const toggleExpanded = (m) => setExpanded(e=>e.includes(m)?e.filter(x=>x!==m):[...e,m]);

  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {Object.entries(MODULE_GROUPS).map(([mod, keys])=>{
        const on = keys.filter(k=>perms.includes(k)).length;
        const isExp = expanded.includes(mod);
        return (
          <div key={mod} className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 cursor-pointer hover:bg-muted/40"
              onClick={()=>toggleExpanded(mod)}>
              {isExp?<ChevronDown size={12}/>:<ChevronRight size={12}/>}
              <span className="text-xs font-semibold flex-1">{mod}</span>
              <button type="button" onClick={e=>{e.stopPropagation();toggleModule(keys);}}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all ${on===keys.length?"bg-primary text-primary-foreground":"border border-border text-muted-foreground hover:bg-muted"}`}>
                {on===keys.length?"All On":"All"}
              </button>
              <span className="text-[10px] text-muted-foreground w-8 text-right">{on}/{keys.length}</span>
            </div>
            {isExp && (
              <div className="px-3 py-2 flex flex-wrap gap-2">
                {keys.map(k=>{
                  const action = k.split(":")[1];
                  return (
                    <label key={k} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer text-[11px] font-medium transition-all ${perms.includes(k)?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:bg-muted"}`}>
                      <input type="checkbox" checked={perms.includes(k)} onChange={()=>toggle(k)} className="sr-only"/>
                      {perms.includes(k)&&<Check size={9} className="shrink-0"/>}
                      {action}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Role Modal ────────────────────────────────────────────────
function RoleModal({ role, allPerms, onClose, onSave }) {
  const isSystem = role?.is_system || SYSTEM_ROLES.includes(role?.name);
  const [form, setForm]   = useState({ name:role?.name||"", label:role?.label||"", description:role?.description||"" });
  const [perms, setPerms] = useState(role?.rolePermissions?.map(rp=>rp.permission?.key).filter(Boolean) || []);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.label) { notify.error("Role label required"); return; }
    setSaving(true);
    try {
      let roleId = role?.id;
      if (!role?.id) {
        const r = await axiosInstance.post("/roles", { name: form.name.toUpperCase().replace(/\s+/g,"_"), label:form.label, description:form.description });
        roleId = r.data?.data?.id;
      } else {
        await axiosInstance.patch(`/roles/${roleId}`, { label:form.label, description:form.description });
      }
      await axiosInstance.post(`/roles/${roleId}/permissions`, { permission_keys:perms, replace:true });
      notify.success(role?.id ? "Role updated" : "Role created");
      onSave();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <h3 className="font-semibold">{role?.id?"Edit Role":"Create Custom Role"}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {!role?.id && (
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Role Code * <span className="text-muted-foreground">(e.g. LAB_INCHARGE)</span></Label>
                <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value.toUpperCase().replace(/\s+/g,"_")}))} placeholder="CUSTOM_ROLE"/>
              </div>
            )}
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Display Label *</Label>
              <Input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Lab In-Charge" disabled={isSystem}/>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Description</Label>
              <Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What this role can do"/>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Permissions ({perms.length} selected)</Label>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setPerms(Object.values(MODULE_GROUPS).flat())}
                  className="text-[10px] text-primary hover:underline">Select All</button>
                <span className="text-muted-foreground text-[10px]">·</span>
                <button type="button" onClick={()=>setPerms([])}
                  className="text-[10px] text-muted-foreground hover:underline">Clear All</button>
              </div>
            </div>
            <PermMatrix perms={perms} setPerms={setPerms} allPerms={allPerms}/>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving?<Loader2 size={13} className="mr-1.5 animate-spin"/>:<Save size={13} className="mr-1.5"/>}
            {role?.id?"Update":"Create"} Role
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Role to User ───────────────────────────────────────
function AssignRoleModal({ roles, onClose }) {
  const [search,   setSearch]   = useState("");
  const [users,    setUsers]    = useState([]);
  const [selUser,  setSelUser]  = useState(null);
  const [selRoles, setSelRoles] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const searchUsers = async (q) => {
    if (!q || q.length < 2) { setUsers([]); return; }
    setLoading(true);
    try {
      const r = await axiosInstance.get(`/faculty?search=${q}&limit=20`);
      setUsers(r.data?.data?.faculty || r.data?.data || []);
    } catch { setUsers([]); }
    finally{ setLoading(false); }
  };

  const loadUserRoles = async (user) => {
    setSelUser(user);
    try {
      const r = await axiosInstance.get(`/roles/user/${user.user_id || user.id}`);
      setSelRoles((r.data?.data||[]).filter(ur=>ur.is_active).map(ur=>ur.role?.name||ur.role_id));
    } catch { setSelRoles([]); }
  };

  const save = async () => {
    if (!selUser) { notify.error("Select a user"); return; }
    setSaving(true);
    try {
      for (const roleName of selRoles) {
        await axiosInstance.post("/roles/assign", {
          user_id:  selUser.user_id || selUser.id,
          role_name:roleName,
          granted_by: "admin",
        });
      }
      notify.success(`Roles assigned to ${selUser.name}`);
      onClose();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  const toggleRole = (name) => setSelRoles(prev=>prev.includes(name)?prev.filter(r=>r!==name):[...prev,name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <h3 className="font-semibold flex items-center gap-2"><UserPlus size={16}/>Assign Roles to User</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* User search */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Search Faculty / Staff</Label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <Input value={search} onChange={e=>{setSearch(e.target.value);searchUsers(e.target.value);}}
                placeholder="Name or emp ID…" className="pl-8"/>
            </div>
            {loading && <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-muted-foreground"/></div>}
            {users.length>0 && !selUser && (
              <div className="border border-border rounded-xl divide-y divide-border max-h-40 overflow-y-auto">
                {users.map(u=>(
                  <button key={u.id} onClick={()=>loadUserRoles(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 text-left">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name?.[0]?.toUpperCase()||"?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.emp_id} · {u.designation}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected user */}
          {selUser && (
            <div className="bg-muted/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {selUser.name?.[0]?.toUpperCase()||"?"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{selUser.name}</p>
                <p className="text-xs text-muted-foreground">{selUser.emp_id} · {selUser.designation}</p>
              </div>
              <button onClick={()=>{setSelUser(null);setSelRoles([]);}} className="text-xs text-muted-foreground hover:underline">Change</button>
            </div>
          )}

          {/* Role selection */}
          {selUser && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Assign Roles (multiple allowed)</Label>
              <p className="text-[10px] text-muted-foreground">Select all roles this person should have. Primary role determines their home portal.</p>
              <div className="grid grid-cols-2 gap-2">
                {roles.filter(r=>r.name!=="STUDENT").map(r=>(
                  <label key={r.id} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-all ${selRoles.includes(r.name)?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:bg-muted"}`}>
                    <input type="checkbox" checked={selRoles.includes(r.name)} onChange={()=>toggleRole(r.name)} className="sr-only"/>
                    {selRoles.includes(r.name) && <Check size={10} className="shrink-0"/>}
                    <div className="min-w-0">
                      <p className="truncate">{r.label}</p>
                      <p className="text-[9px] opacity-60 truncate">{r.name}</p>
                    </div>
                  </label>
                ))}
              </div>
              {selRoles.length > 0 && (
                <p className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                  Primary role: <strong>{selRoles[0]}</strong> — determines login redirect. Additional roles add permissions.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving||!selUser||selRoles.length===0} onClick={save}>
            {saving?<Loader2 size={13} className="mr-1.5 animate-spin"/>:<UserPlus size={13} className="mr-1.5"/>}
            Assign {selRoles.length} Role{selRoles.length!==1?"s":""}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Roles Page ───────────────────────────────────────────
export default function RolesPage() {
  const [roles,    setRoles]    = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [seeding,  setSeeding]  = useState(false);
  const [search,   setSearch]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/roles?include_inactive=true"),
      axiosInstance.get("/roles/permissions/all"),  // FIXED: was /permissions
    ]).then(([rRes, pRes]) => {
      setRoles(rRes.data?.data || []);
      setAllPerms(pRes.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    setSeeding(true);
    try {
      await axiosInstance.post("/roles/seed");
      notify.success("16 predefined roles loaded");
      load();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSeeding(false); }
  };

  const toggleActive = async (role) => {
    if (role.is_system) { notify.error("Cannot deactivate system roles"); return; }
    try {
      await axiosInstance.patch(`/roles/${role.id}`, { is_active:!role.is_active });
      notify.success(role.is_active ? "Role deactivated" : "Role activated");
      load();
    } catch { notify.error("Failed"); }
  };

  const predefined = roles.filter(r => r.is_system || SYSTEM_ROLES.includes(r.name));
  const custom     = roles.filter(r => !r.is_system && !SYSTEM_ROLES.includes(r.name));
  const filtered   = [...predefined, ...custom].filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary"/>
          <div>
            <h1 className="text-xl font-bold">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground">Manage access control for all users</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" disabled={seeding} onClick={seed}>
            {seeding?<Loader2 size={12} className="mr-1.5 animate-spin"/>:<RefreshCw size={12} className="mr-1.5"/>}
            Load Predefined Roles
          </Button>
          <Button variant="outline" size="sm" onClick={()=>setAssignModal(true)}>
            <UserPlus size={12} className="mr-1.5"/>Assign Roles
          </Button>
          <Button size="sm" onClick={()=>setModal("new")}>
            <Plus size={13} className="mr-1.5"/>Custom Role
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
        <p><strong>System roles</strong> (grey lock) have fixed names but you can edit their permissions.</p>
        <p><strong>Custom roles</strong> can be created, edited or deleted freely.</p>
        <p><strong>Multiple roles</strong> — use "Assign Roles" to give one person multiple roles (e.g. FACULTY + CLASS_COORDINATOR).</p>
        <p><strong>SUPER_ADMIN / ROOT</strong> — your company accounts. They don't appear here and have separate login.</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search roles…" className="pl-8 h-9"/>
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} roles</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
          <Shield size={28} className="mx-auto text-muted-foreground/20"/>
          <p className="text-sm text-muted-foreground">No roles yet</p>
          <Button variant="outline" size="sm" onClick={seed}>Load 16 Predefined Roles</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Predefined */}
          {predefined.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Roles ({predefined.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {predefined.map(r=>(
                  <div key={r.id} className={`bg-card border rounded-xl p-3.5 flex items-center gap-3 ${!r.is_active?"opacity-50":""}`}>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${ROLE_COLOR[r.name]||"bg-muted text-muted-foreground"} shrink-0`}>
                      {r.name.slice(0,6)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.label||r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r._count?.userRoles||0} users · {r.rolePermissions?.length||0} permissions</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={()=>setModal(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Edit permissions"><Edit2 size={12}/></button>
                      <button onClick={()=>toggleActive(r)} className={`p-1.5 rounded ${r.is_active?"hover:bg-amber-50 text-amber-600":"hover:bg-green-50 text-green-600"}`}
                        title={r.is_active?"Deactivate":"Activate"}>
                        {r.is_active?<Lock size={12}/>:<Unlock size={12}/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom */}
          {custom.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Roles ({custom.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {custom.map(r=>(
                  <div key={r.id} className={`bg-card border rounded-xl p-3.5 flex items-center gap-3 ${!r.is_active?"opacity-50 border-dashed":""}`}>
                    <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-muted text-muted-foreground shrink-0">{r.name.slice(0,8)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.label||r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r._count?.userRoles||0} users · {r.rolePermissions?.length||0} perms</p>
                      {r.description && <p className="text-[10px] text-muted-foreground italic truncate">{r.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={()=>setModal(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit2 size={12}/></button>
                      <button onClick={()=>toggleActive(r)} className={`p-1.5 rounded ${r.is_active?"hover:bg-amber-50 text-amber-600":"hover:bg-green-50 text-green-600"}`}>
                        {r.is_active?<Lock size={12}/>:<Unlock size={12}/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modal && (
        <RoleModal
          role={modal==="new"?null:modal}
          allPerms={allPerms}
          onClose={()=>setModal(null)}
          onSave={()=>{ setModal(null); load(); }}
        />
      )}
      {assignModal && (
        <AssignRoleModal roles={roles} onClose={()=>setAssignModal(false)}/>
      )}
    </div>
  );
}