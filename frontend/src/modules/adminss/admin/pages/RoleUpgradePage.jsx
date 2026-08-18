// src/modules/admin/pages/RoleUpgradePage.jsx
import { useState, useEffect } from "react";
import { Search, ShieldCheck, ShieldOff, Loader2, ChevronDown, Check } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { OtpConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { PERMISSION_MODULES, ALL_PERMISSION_KEYS } from "../../../../config/permission.config.js";
import { notify } from "../../../../hooks/notify.js";

const GRANTABLE_ROLES = [
  { value: "CLASS_COORDINATOR", label: "Class Coordinator", desc: "Section-scoped access", adminOnly: false },
  { value: "HOD",               label: "Head of Department", desc: "Department-scoped access", adminOnly: false },
  { value: "ADMIN",             label: "Admin",              desc: "Full admin access",        adminOnly: true },  // superAdminOnly
];

function PermissionAccordion({ module, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const modulePerms = module.permissions.map((p) => p.key);
  const allSelected = modulePerms.every((k) => selected.includes(k));
  const someSelected = modulePerms.some((k) => selected.includes(k));

  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter((k) => !modulePerms.includes(k)));
    } else {
      onChange([...new Set([...selected, ...modulePerms])]);
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-base">{module.icon}</span>
          <span className="text-sm font-semibold">{module.label}</span>
          {someSelected && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {modulePerms.filter((k) => selected.includes(k)).length}/{modulePerms.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); toggleAll(); }}
            className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
              allSelected ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}>
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {module.permissions.map((perm) => {
            const checked = selected.includes(perm.key);
            return (
              <label key={perm.key}
                className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  checked ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50 border border-transparent"
                }`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  checked ? "border-primary bg-primary" : "border-muted-foreground"
                }`}>
                  {checked && <Check size={10} className="text-white" />}
                </div>
                <input type="checkbox" checked={checked} className="sr-only"
                  onChange={() => onChange(checked ? selected.filter((k) => k !== perm.key) : [...selected, perm.key])} />
                <div>
                  <p className="text-xs font-medium">{perm.label}</p>
                  <p className="text-[10px] text-muted-foreground">{perm.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RoleUpgradePage() {
  const { isSuperAdmin } = usePageGuard();

  const [faculty, setFaculty]       = useState([]);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);  // selected faculty
  const [selectedRole, setSelectedRole] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [otpOpen, setOtpOpen]       = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [fetching, setFetching]     = useState(false);

  const searchFaculty = async (q) => {
    if (!q || q.length < 2) return setFaculty([]);
    setFetching(true);
    try {
      const r = await axiosInstance.get(`${EP.faculty.list}?search=${q}&limit=10`);
      setFaculty(r.data?.data?.faculty || r.data?.faculty || []);
    } catch { notify.error("Search failed"); }
    finally { setFetching(false); }
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => searchFaculty(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadUserPermissions = async (userId) => {
    try {
      const r = await axiosInstance.get(EP.admins.permissions(userId));
      setPermissions(r.data?.data?.permissions || []);
    } catch { setPermissions([]); }
  };

  const handleSelectFaculty = async (f) => {
    setSelected(f);
    setSelectedRole(f.user?.role || "");
    await loadUserPermissions(f.user_id || f.user?.id);
  };

  const handleGrantRole = () => {
    if (!selectedRole) return notify.error("Select a role to grant");
    if (selectedRole === "ADMIN" && !isSuperAdmin) return notify.error("Only Super Admin can grant Admin role");
    // Require OTP for ADMIN grant
    if (selectedRole === "ADMIN" || selectedRole === "HOD") {
      setPendingAction("grant_role");
      setOtpOpen(true);
    } else {
      executeGrant();
    }
  };

  const executeGrant = async (actionToken) => {
    setLoading(true);
    try {
      await axiosInstance.post(EP.roles.assignToUser, {
        user_id:    selected.user_id || selected.user?.id,
        role:       selectedRole,
        permissions,
        action_token: actionToken,
      });
      notify.success(`${selected.name} granted ${selectedRole} role with ${permissions.length} permissions`);
      setSelected(null); setFaculty([]); setSearch(""); setPermissions([]);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to grant role");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await axiosInstance.post(EP.roles.revokeFromUser, {
        user_id: selected.user_id || selected.user?.id,
        role: selectedRole,
      });
      notify.success("Role revoked");
      setSelected(null); setFaculty([]); setSearch("");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to revoke role");
    } finally {
      setLoading(false);
    }
  };

  // Quick presets
  const PRESETS = {
    "CLASS_COORDINATOR": ["sections.view", "students.view", "students.view_own_class", "feedback.view", "feedback.results"],
    "HOD": ["students.view", "faculty.view", "sections.view", "feedback.view", "feedback.results", "reports.students", "reports.faculty"],
    "ADMIN": ALL_PERMISSION_KEYS,
  };

  const applyPreset = (role) => {
    if (PRESETS[role]) setPermissions(PRESETS[role]);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold">Role Upgrade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign elevated roles to faculty members and configure their permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Search faculty */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">1. Find Faculty Member</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by name or emp ID…"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Results */}
          {fetching && <div className="flex items-center gap-2 text-xs text-muted-foreground px-2"><Loader2 size={12} className="animate-spin" /> Searching…</div>}
          {faculty.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              {faculty.map((f) => (
                <button key={f.id} onClick={() => handleSelectFaculty(f)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    selected?.id === f.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                    {f.name?.[0] || "F"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.designation} · {f.department?.name}</p>
                  </div>
                  <div className="ml-auto shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      f.user?.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                      f.user?.role === "FACULTY" ? "bg-blue-100 text-blue-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{f.user?.role || "FACULTY"}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected faculty summary */}
          {selected && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-2">Selected</p>
              <p className="text-sm font-bold">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.designation} · {selected.department?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Current role: <span className="font-medium">{selected.user?.role}</span></p>
            </div>
          )}
        </div>

        {/* Right: Role + permissions */}
        {selected && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">2. Select Role to Grant</p>
            <div className="space-y-2">
              {GRANTABLE_ROLES.filter((r) => isSuperAdmin || !r.adminOnly).map((role) => (
                <label key={role.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === role.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}>
                  <input type="radio" name="role" value={role.value} checked={selectedRole === role.value}
                    onChange={() => { setSelectedRole(role.value); applyPreset(role.value); }}
                    className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === role.value ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {selectedRole === role.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.desc}</p>
                  </div>
                  {role.adminOnly && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Super Admin Only</span>}
                </label>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={handleGrantRole} disabled={loading || !selectedRole}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Grant Role
              </button>
              {selected.user?.role !== "FACULTY" && (
                <button onClick={handleRevokeRole} disabled={loading}
                  className="flex-1 h-10 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-semibold hover:bg-destructive/10 disabled:opacity-50 flex items-center justify-center gap-2">
                  <ShieldOff size={14} /> Revoke Role
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Permission checklist */}
      {selected && selectedRole && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">3. Configure Permissions ({permissions.length} selected)</p>
            <div className="flex gap-2">
              <button onClick={() => setPermissions(ALL_PERMISSION_KEYS)}
                className="text-xs text-primary hover:underline">Select All</button>
              <button onClick={() => setPermissions([])}
                className="text-xs text-muted-foreground hover:text-foreground">Clear All</button>
            </div>
          </div>
          <div className="space-y-2">
            {PERMISSION_MODULES.map((module) => (
              <PermissionAccordion
                key={module.key}
                module={module}
                selected={permissions}
                onChange={setPermissions}
              />
            ))}
          </div>
        </div>
      )}

      {/* OTP Modal for ADMIN grant */}
      <OtpConfirmModal
        open={otpOpen}
        purpose="grant_admin"
        title="Confirm Role Grant"
        description={`You are granting ${selectedRole} role to ${selected?.name}. This is a high-privilege action requiring OTP verification.`}
        onVerified={(token) => { setOtpOpen(false); executeGrant(token); }}
        onClose={() => setOtpOpen(false)}
      />
    </div>
  );
}
