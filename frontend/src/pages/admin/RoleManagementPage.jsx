import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../lib/axios.js";
import { useSelector } from "react-redux";
import { cn } from "../../lib/utils.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, X, RefreshCw, Loader2, AlertTriangle, Users, ArrowRight } from "lucide-react";
import { notify } from "../../hooks/notify.js";

const ROLE_META = {
  SUPER_ADMIN: { label: "Super Admin", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ADMIN: { label: "Admin", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  FACULTY: { label: "Faculty", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  STUDENT: { label: "Student", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

// All available admin permissions — must match what your routes use in authorize()
const ALL_PERMISSIONS = [
  { key: "manage_students", label: "Manage Students", desc: "View, edit, promote, bulk ops" },
  { key: "manage_faculty", label: "Manage Faculty", desc: "View, edit faculty records" },
  { key: "manage_admins", label: "Manage Admins", desc: "Create, edit admin accounts" },
  { key: "manage_departments", label: "Manage Departments", desc: "Departments, programs, courses" },
  { key: "manage_sections", label: "Manage Sections", desc: "Sections, curriculum, subjects" },
  { key: "manage_subjects", label: "Manage Subjects", desc: "Subject CRUD" },
  { key: "manage_feedback", label: "Manage Feedback", desc: "Forms, results, reports" },
];

function RoleBadge({ role }) {
  const m = ROLE_META[role];
  if (!m) return null;
  return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", m.cls)}>{m.label}</span>;
}

// ── Grant extra role modal ─────────────────────────────────────
function GrantRoleModal({ open, user, onClose, onSaved }) {
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("extra");
  const [selPerms, setSelPerms] = useState(new Set());
  const allRoles = ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"];
  const existing = [user?.role, ...(user?.extra_roles || [])];
  const available = allRoles.filter((r) => !existing.includes(r));
  const showPerms = (role === "ADMIN" || role === "SUPER_ADMIN") && mode === "extra";

  useEffect(() => { if (open) { setRole(""); setMode("extra"); setSelPerms(new Set()); } }, [open]);

  const togglePerm = (key) => setSelPerms((p) => {
    const n = new Set(p);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });

  const handle = async () => {
    if (!role) { notify.error("Select a role"); return; }
    if (showPerms && selPerms.size === 0) { notify.error("Select at least one permission"); return; }
    setSaving(true);
    try {
      if (mode === "primary") {
        await axiosInstance.post(`/role-upgrade/${user.id}/promote`, { role });
        notify.success(`Primary role changed to ${role}`);
      } else {
        await axiosInstance.post(`/role-upgrade/${user.id}/grant`, {
          role,
          permissions: showPerms ? [...selPerms] : [],
        });
        notify.success(`${role} access granted with ${selPerms.size} permission(s)`);
      }
      onSaved();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  if (!open || !user) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield size={16} /> Assign Role</DialogTitle>
            <DialogDescription>{user.faculty?.name || user.student?.name || user.email}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Current state */}
          <div className="p-3 bg-muted/30 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current</p>
            <div className="flex gap-1.5 flex-wrap items-center">
              <div className="flex items-center gap-1">
                <RoleBadge role={user.role} />
                <span className="text-[10px] text-muted-foreground">primary</span>
              </div>
              {(user.extra_roles || []).map((r) => (
                <div key={r} className="flex items-center gap-1">
                  <RoleBadge role={r} />
                  <span className="text-[10px] text-muted-foreground">extra</span>
                </div>
              ))}
              {(user.permissions || []).length > 0 && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  · {user.permissions.length} permission(s)
                </span>
              )}
            </div>
          </div>

          {/* Mode */}
          <div className="grid grid-cols-2 gap-2">
            {[
              ["extra", "Extra Access", "Access both dashboards. Permissions control what they see."],
              ["primary", "Change Primary", "Fully upgrades role. Login goes to new dashboard."],
            ].map(([m, title, desc]) => (
              <button key={m} onClick={() => setMode(m)}
                className={cn("p-3 rounded-xl border text-left transition-colors",
                  mode === m ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {/* Role picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Role to assign</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select role…" /></SelectTrigger>
              <SelectContent>
                {(mode === "extra" ? available : allRoles.filter((r) => r !== user.role)).map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={r} />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permission picker — only for ADMIN extra role */}
          {showPerms && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Admin permissions</label>
                <div className="flex gap-3">
                  <button onClick={() => setSelPerms(new Set(ALL_PERMISSIONS.map(p => p.key)))}
                    className="text-xs text-primary hover:underline">Select all</button>
                  <button onClick={() => setSelPerms(new Set())}
                    className="text-xs text-muted-foreground hover:underline">Clear</button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Only selected permissions will be accessible in the admin dashboard.</p>
              <div className="space-y-1.5">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.key}
                    className={cn("flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                      selPerms.has(p.key)
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:bg-muted/50")}>
                    <input type="checkbox" checked={selPerms.has(p.key)}
                      onChange={() => togglePerm(p.key)}
                      className="mt-0.5 accent-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {role && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400 space-y-1">
              {mode === "extra" ? (
                <>
                  <p><strong>{user.faculty?.name || user.email}</strong> will access both <strong>{ROLE_META[user.role]?.label}</strong> and <strong>{ROLE_META[role]?.label}</strong> dashboards.</p>
                  {showPerms && selPerms.size > 0 && (
                    <p>Admin access limited to: <strong>{[...selPerms].map(k => ALL_PERMISSIONS.find(p => p.key === k)?.label).join(", ")}</strong></p>
                  )}
                </>
              ) : (
                <p>Primary role changes from <strong>{ROLE_META[user.role]?.label}</strong> to <strong>{ROLE_META[role]?.label}</strong>. They log into the {ROLE_META[role]?.label} dashboard by default.</p>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
          <Button className="flex-1" onClick={handle}
            disabled={saving || !role || (showPerms && mode === "extra" && selPerms.size === 0)}>
            {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {mode === "extra" ? `Grant ${selPerms.size > 0 ? `(${selPerms.size} perms)` : ""}` : "Change Primary Role"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Search users modal ─────────────────────────────────────────
function SearchUserModal({ open, onClose, onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (val) => {
    if (!val.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [students, faculty] = await Promise.all([
        axiosInstance.get("/students", { params: { search: val, limit: 5 } }),
        axiosInstance.get("/faculty", { params: { search: val, limit: 5 } }),
      ]);
      const sl = (students.data?.data?.students || []).map((s) => ({
        id: s.user_id, email: s.user?.email, role: "STUDENT",
        extra_roles: s.user?.extra_roles || [], name: s.name, roll_no: s.roll_no,
        student: { name: s.name, roll_no: s.roll_no },
      }));
      const fl = (faculty.data?.data?.faculty || []).map((f) => ({
        id: f.user_id, email: f.user?.email, role: "FACULTY",
        extra_roles: f.user?.extra_roles || [], name: f.name,
        faculty: { name: f.name },
      }));
      setResults([...sl, ...fl]);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => search(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users size={16} /> Find User</DialogTitle>
          <DialogDescription>Search for a student or faculty member to assign roles.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, roll no…"
            className="w-full h-9 px-3 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring" />
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {loading && <p className="text-xs text-muted-foreground text-center py-4">Searching…</p>}
            {!loading && q && results.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No results</p>}
            {results.map((u) => (
              <button key={u.id} onClick={() => { onSelect(u); onClose(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted text-left transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name || u.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function RoleManagementPage() {
  const { user: me } = useSelector((s) => s.auth);
  const isSuperAdmin = me?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [revoking, setRevoking] = useState(null); // { userId, role }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get("/role-upgrade");
      setUsers(r.data?.data || []);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (userId, role) => {
    setRevoking({ userId, role });
    try {
      await axiosInstance.post(`/role-upgrade/${userId}/revoke`, { role });
      notify.success(`${role} access revoked`);
      load();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setRevoking(null); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield size={20} className="text-muted-foreground" /> Role Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Grant extra roles so users can access multiple dashboards simultaneously.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </Button>
          {isSuperAdmin && (
            <Button size="sm" onClick={() => setSearchOpen(true)}>
              <Plus size={13} className="mr-1.5" /> Assign Role
            </Button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400 space-y-1">
        <p className="font-semibold">How multi-role access works</p>
        <p>A faculty member with extra ADMIN access can switch between the Faculty and Admin dashboards. Their primary role determines where they land after login. Only Super Admins can assign or revoke extra roles.</p>
      </div>

      {/* Users with extra roles */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-border">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-muted/30" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Shield size={32} className="text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">No users with extra roles yet.</p>
            {isSuperAdmin && (
              <Button size="sm" variant="outline" onClick={() => setSearchOpen(true)}>
                <Plus size={13} className="mr-1" /> Assign first role
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["User", "Primary Role", "Extra Access", "Can Access", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="font-medium text-foreground">{u.faculty?.name || u.student?.name || u.admin?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {(u.extra_roles || []).map((r) => (
                        <div key={r} className="flex items-center gap-1">
                          <RoleBadge role={r} />
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRevoke(u.id, r)}
                              disabled={revoking?.userId === u.id && revoking?.role === r}
                              className="w-4 h-4 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title={`Revoke ${r}`}>
                              {revoking?.userId === u.id && revoking?.role === r
                                ? <Loader2 size={10} className="animate-spin" />
                                : <X size={10} />}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {[u.role, ...(u.extra_roles || [])].map((r) => (
                        <span key={r} className="text-xs text-muted-foreground">
                          {r === "ADMIN" || r === "SUPER_ADMIN" ? "/admin" : r === "FACULTY" ? "/faculty" : "/student"}
                        </span>
                      )).reduce((acc, el, i) => [...acc, i > 0 ? <span key={`s${i}`} className="text-muted-foreground/30">·</span> : null, el], [])}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSuperAdmin && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => setGrantTarget(u)}>
                        <Plus size={11} className="mr-1" /> Add role
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <SearchUserModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={(u) => { setGrantTarget(u); }} />
      <GrantRoleModal open={!!grantTarget} user={grantTarget} onClose={() => setGrantTarget(null)} onSaved={() => { setGrantTarget(null); load(); }} />
    </div>
  );
}