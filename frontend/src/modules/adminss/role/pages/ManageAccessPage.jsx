// src/modules/adminss/roles/pages/ManageAccessPage.jsx
// Faculty list with their roles — assign / revoke per faculty
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Search, ChevronRight, Loader2, X,
  Check, Plus, RefreshCw, Users,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

// ── helpers ──────────────────────────────────────────────────
const badge = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border";
const ROLE_COLOR = {
  FACULTY:          "bg-blue-50   text-blue-700   border-blue-200",
  HOD:              "bg-violet-50 text-violet-700 border-violet-200",
  DEPT_ADMIN:       "bg-indigo-50 text-indigo-700 border-indigo-200",
  EXAM_COORDINATOR: "bg-amber-50  text-amber-700  border-amber-200",
  CLASS_COORDINATOR:"bg-green-50  text-green-700  border-green-200",
  IT_ADMIN:         "bg-cyan-50   text-cyan-700   border-cyan-200",
  ACCOUNT:          "bg-orange-50 text-orange-700 border-orange-200",
  LIBRARIAN:        "bg-pink-50   text-pink-700   border-pink-200",
  LAB_INCHARGE:     "bg-teal-50   text-teal-700   border-teal-200",
  HOSTEL_WARDEN:    "bg-lime-50   text-lime-700   border-lime-200",
  PLACEMENT:        "bg-rose-50   text-rose-700   border-rose-200",
  TRANSPORT:        "bg-sky-50    text-sky-700    border-sky-200",
};
const rc = (r) => ROLE_COLOR[r] || "bg-muted text-muted-foreground border-border";

export default function ManageAccessPage() {
  const navigate = useNavigate();
  const [faculty,    setFaculty]    = useState([]);
  const [roles,      setRoles]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null);   // faculty being edited
  const [userRoles,  setUserRoles]  = useState([]);      // roles of selected faculty
  const [roleModal,  setRoleModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [roleLoading,setRoleLoading]= useState(false);

  // load faculty list + all roles
  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.faculty.list + "?limit=200&status=ACTIVE"),
      axiosInstance.get(EP.roles.list),
    ]).then(([fRes, rRes]) => {
      setFaculty(fRes.data?.data?.faculty || fRes.data?.data || []);
      setRoles(rRes.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  // open role editor for a faculty
  const openEdit = async (f) => {
    setSelected(f);
    setRoleModal(true);
    setRoleLoading(true);
    try {
      const res = await axiosInstance.get(EP.roles.userRoles(f.user_id || f.userId || f.user?.id));
      setUserRoles(res.data?.data?.map(r => r.role_id || r.id) || []);
    } catch {
      setUserRoles([]);
    } finally {
      setRoleLoading(false);
    }
  };

  const toggleRole = (roleId) => {
    setUserRoles(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const saveRoles = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const uid = selected.user_id || selected.userId || selected.user?.id;
      await axiosInstance.post(EP.roles.assignToUser, {
        user_id:  uid,
        role_ids: userRoles,
      });
      notify.success(`Roles updated for ${selected.name}`);
      // refresh faculty list to show new roles
      const res = await axiosInstance.get(EP.faculty.list + "?limit=200&status=ACTIVE");
      setFaculty(res.data?.data?.faculty || res.data?.data || []);
      setRoleModal(false);
    } catch (e) {
      notify.error(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const filtered = faculty.filter(f =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
    f.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={22} className="animate-spin text-muted-foreground"/>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} className="text-primary"/>Manage Access
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assign roles to faculty — controls what they can access in ERP
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/roles/manage")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40 transition-colors"
        >
          <Shield size={14}/>Role Permissions
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search faculty name, emp ID, department…"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={13}/>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Faculty",    value: faculty.length,                                          color: "text-blue-600"   },
          { label: "With Extra Roles", value: faculty.filter(f => f.user?.extra_roles?.length > 0 || f.extra_roles?.length > 0).length, color: "text-violet-600" },
          { label: "Roles Available",  value: roles.length,                                            color: "text-green-600"  },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Faculty table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Users size={14} className="text-muted-foreground"/>
            {filtered.length} faculty
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No faculty found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(f => {
              const extraRoles = f.user?.extra_roles || f.extra_roles || [];
              const primaryRole = f.user?.role || "FACULTY";
              return (
                <div key={f.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openEdit(f)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {f.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {f.designation} · {f.department?.name} · {f.emp_id}
                    </p>
                  </div>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                    <span className={`${badge} ${rc(primaryRole)}`}>{primaryRole}</span>
                    {extraRoles.map(r => (
                      <span key={r} className={`${badge} ${rc(r)}`}>{r}</span>
                    ))}
                    {extraRoles.length === 0 && (
                      <span className="text-xs text-muted-foreground">No extra roles</span>
                    )}
                  </div>

                  <ChevronRight size={14} className="text-muted-foreground shrink-0"/>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role edit modal */}
      {roleModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md space-y-4 p-6">

            {/* Modal header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-base">{selected.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.designation} · {selected.department?.name}
                </p>
              </div>
              <button onClick={() => setRoleModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X size={16}/>
              </button>
            </div>

            <hr className="border-border"/>

            {roleLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted-foreground"/>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Assign Roles
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(role => {
                      const active = userRoles.includes(role.id);
                      return (
                        <button key={role.id}
                          onClick={() => toggleRole(role.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-xs text-left transition-all
                            ${active
                              ? "border-primary bg-primary/5 font-semibold text-primary"
                              : "border-border hover:bg-muted/30 text-foreground"
                            }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                            ${active ? "bg-primary border-primary" : "border-input"}`}>
                            {active && <Check size={10} className="text-primary-foreground"/>}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate">{role.name}</p>
                            {role.description && (
                              <p className="text-[10px] text-muted-foreground font-normal truncate">{role.description}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {roles.length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No roles found. <button onClick={() => navigate("/admin/roles/manage")} className="text-primary hover:underline">Create roles first</button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setRoleModal(false)}
                    className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40 transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveRoles} disabled={saving}
                    className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                    {saving ? "Saving…" : "Save Roles"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
