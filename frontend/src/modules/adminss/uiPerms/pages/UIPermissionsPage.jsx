// src/modules/uiPerms/pages/UIPermissionsPage.jsx
// Root admin only — control which buttons appear per module + role
import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight, RotateCcw, Save, Shield } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { invalidateUIPermissionCache } from "../../../../hooks/useUIPermissions.js";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODULES = ["students", "faculty", "admin", "superadmin", "departments", "programs", "branches", "sections", "subjects", "curriculum", "enrollments", "groups", "leave", "bulk", "feedback", "reports", "sessions", "audit"];
const ACTIONS = ["view", "add", "edit", "delete", "deactivate", "restore", "bulk", "export", "import", "promote", "demote", "block", "unblock", "reset_password", "assign"];
const ROLES = [null, "ADMIN", "SUPER_ADMIN", "FACULTY", "STUDENT"];

export default function UIPermissionsPage() {
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [filter, setFilter] = useState({ module: "students", role: "ADMIN" });

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.uiPermissions.all);
      setPerms(r.data?.data || []);
    } catch { notify.error("Failed to load UI permissions"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const getPerm = (module, action, role) =>
    perms.find((p) => p.module === module && p.action === action && (p.role === role || (!p.role && !role)));

  const toggle = async (module, action, role, field) => {
    const key = `${module}.${action}.${role}.${field}`;
    const existing = getPerm(module, action, role);
    const newVal = !(existing?.[field] ?? false);
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await axiosInstance.post(EP.uiPermissions.set, {
        module, action, role: role || "",
        is_hidden: field === "is_hidden" ? newVal : (existing?.is_hidden ?? false),
        is_disabled: field === "is_disabled" ? newVal : (existing?.is_disabled ?? false),
      });
      invalidateUIPermissionCache();
      await load();
    } catch { notify.error("Failed to update"); }
    finally { setSaving((s) => ({ ...s, [key]: false })); }
  };

  const resetModule = async (module) => {
    if (!confirm(`Reset all UI permissions for "${module}"? All overrides will be removed.`)) return;
    try {
      await axiosInstance.delete(EP.uiPermissions.resetModule(module));
      invalidateUIPermissionCache();
      notify.success(`${module} permissions reset`);
      await load();
    } catch { notify.error("Reset failed"); }
  };

  const filteredActions = ACTIONS;
  const selectedRole = filter.role === "all" ? "" : (filter.role || "");

  const Toggle = ({ on, loading: l, onClick }) => (
    <button onClick={onClick} disabled={l} className={`p-1.5 rounded-lg transition-colors ${on ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
      {on ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
    </button>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center"><Shield size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold">UI Permissions</h1>
          <p className="text-sm text-muted-foreground">Root admin control — hide or disable buttons per module and role. Root always sees everything.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="space-y-1 w-48">
          <p className="text-xs text-muted-foreground">Module</p>
          <Select value={filter.module} onValueChange={(v) => setFilter((f) => ({ ...f, module: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-44">
          <p className="text-xs text-muted-foreground">Role (null = all roles)</p>
          <Select value={filter.role || "null"} onValueChange={(v) => setFilter((f) => ({ ...f, role: v === "null" ? "" : v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="null">All Roles (global = "")</SelectItem>
              {ROLES.filter(Boolean).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5">
          <Button variant="outline" size="sm" onClick={() => resetModule(filter.module)}>
            <RotateCcw size={12} className="mr-1.5" /> Reset {filter.module}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30 grid grid-cols-[1fr_auto_auto] gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 text-center">Hidden</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 text-center">Disabled</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredActions.map((action) => {
              const perm = getPerm(filter.module, action, selectedRole);
              const isHidden = perm?.is_hidden ?? false;
              const isDisabled = perm?.is_disabled ?? false;
              return (
                <div key={action} className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 items-center hover:bg-muted/20">
                  <div>
                    <p className="text-sm font-medium capitalize">{action.replace("_", " ")}</p>
                    {perm && <p className="text-xs text-muted-foreground">Override active {perm.role ? `(${perm.role})` : "(all roles)"}</p>}
                  </div>
                  <div className="w-20 flex justify-center">
                    <Toggle
                      on={isHidden}
                      loading={saving[`${filter.module}.${action}.${selectedRole}.is_hidden`]}
                      onClick={() => toggle(filter.module, action, selectedRole, "is_hidden")}
                    />
                  </div>
                  <div className="w-20 flex justify-center">
                    <Toggle
                      on={isDisabled}
                      loading={saving[`${filter.module}.${action}.${selectedRole}.is_disabled`]}
                      onClick={() => toggle(filter.module, action, selectedRole, "is_disabled")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
        <p className="font-semibold">How it works</p>
        <p><strong>Hidden</strong> = button is completely removed from the UI for that role</p>
        <p><strong>Disabled</strong> = button is visible but grayed out and non-clickable</p>
        <p><strong>Role = "" (All Roles)</strong> = applies to every role unless overridden by a specific role setting</p>
        <p>Root admin always sees and can always click everything — no restrictions apply.</p>
      </div>
    </div>
  );
}