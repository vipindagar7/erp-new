// src/modules/rbac/pages/RoleAssignmentPage.jsx
import { useState, useEffect } from "react";
import { Shield, Plus, Trash2, Search, ChevronDown, ChevronUp, Info, Users, Building2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

// Role metadata for display
const ROLE_META = {
  SUPER_ADMIN:       { label: "Super Admin",         color: "red",    desc: "All modules, institute-wide",             scope: "institute" },
  STUDENT_ADMIN:     { label: "Student Admin",        color: "violet", desc: "Full student module access",              scope: "institute" },
  FACULTY_ADMIN:     { label: "Faculty Admin",        color: "blue",   desc: "Full faculty module access",              scope: "institute" },
  ACADEMIC_ADMIN:    { label: "Academic Admin",       color: "indigo", desc: "Dept/Program/Branch/Section management",  scope: "institute" },
  CURRICULUM_ADMIN:  { label: "Curriculum Admin",     color: "teal",   desc: "Curriculum and subject management",       scope: "institute" },
  HOD:               { label: "Head of Department",   color: "amber",  desc: "Full access within their department",     scope: "dept"      },
  PROGRAM_HEAD:      { label: "Program Head",         color: "orange", desc: "Full access within their program",        scope: "program"   },
  BRANCH_HEAD:       { label: "Branch Head",          color: "green",  desc: "Full access within their branch",         scope: "branch"    },
  CLASS_COORDINATOR: { label: "Class Coordinator",    color: "cyan",   desc: "Section management + attendance",         scope: "section"   },
  FACULTY:           { label: "Faculty",              color: "gray",   desc: "Attendance for their subjects, timetable",scope: "subject"   },
};

const SCOPE_FIELDS = {
  institute: [],
  dept:      ["dept_id"],
  program:   ["dept_id", "program_id"],
  branch:    ["dept_id", "program_id", "branch_id"],
  section:   ["dept_id", "program_id", "branch_id", "section_id"],
  subject:   [],
};

const COLOR_CLASS = {
  red:    "bg-red-100 text-red-700 border-red-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  blue:   "bg-blue-100 text-blue-700 border-blue-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  teal:   "bg-teal-100 text-teal-700 border-teal-200",
  amber:  "bg-amber-100 text-amber-700 border-amber-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  green:  "bg-green-100 text-green-700 border-green-200",
  cyan:   "bg-cyan-100 text-cyan-700 border-cyan-200",
  gray:   "bg-gray-100 text-gray-700 border-gray-200",
};

// ── Assign Modal ──────────────────────────────────────────────
function AssignModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    faculty_id: "", _facultyLabel: "",
    role_name: "",
    dept_id: "", _deptLabel: "",
    program_id: "", _programLabel: "",
    branch_id: "", _branchLabel: "",
    section_id: "", _sectionLabel: "",
    expires_at: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (v, opt) => setForm((f) => ({ ...f, [k]: v, [`_${k.replace("_id","")}Label`]: opt?.name || "" }));

  const selectedRole   = ROLE_META[form.role_name];
  const scopeFields    = selectedRole ? SCOPE_FIELDS[selectedRole.scope] : [];

  const save = async () => {
    if (!form.faculty_id) { notify.error("Select a faculty member"); return; }
    if (!form.role_name)  { notify.error("Select a role"); return; }
    if (scopeFields.includes("dept_id")    && !form.dept_id)    { notify.error("Department required for this role"); return; }
    if (scopeFields.includes("program_id") && !form.program_id) { notify.error("Program required for this role"); return; }
    if (scopeFields.includes("branch_id")  && !form.branch_id)  { notify.error("Branch required for this role"); return; }
    if (scopeFields.includes("section_id") && !form.section_id) { notify.error("Section required for this role"); return; }

    setLoading(true);
    try {
      await axiosInstance.post(`${EP.admins.list.replace("/admins","")}/rbac/assign`, {
        faculty_id: form.faculty_id,
        role_name:  form.role_name,
        dept_id:    form.dept_id    || undefined,
        program_id: form.program_id || undefined,
        branch_id:  form.branch_id  || undefined,
        section_id: form.section_id || undefined,
        expires_at: form.expires_at || undefined,
      });
      notify.success(`${selectedRole.label} role assigned`);
      onSave();
    } catch (err) { notify.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Shield size={16} className="text-primary" /> Assign Role to Faculty
        </h2>

        {/* Faculty picker */}
        <div className="space-y-1.5">
          <Label className="text-xs">Faculty Member *</Label>
          <SearchSelect
            endpoint={EP.faculty.list}
            dataPath="faculty"
            valueKey="id"
            labelKey="name"
            subLabelKey="department.name"
            value={form.faculty_id}
            selectedLabel={form._facultyLabel}
            onChange={(v, opt) => setForm((f) => ({ ...f, faculty_id: v, _facultyLabel: opt?.name || "" }))}
            placeholder="Search faculty by name or emp ID…"
          />
        </div>

        {/* Role selector */}
        <div className="space-y-1.5">
          <Label className="text-xs">Role *</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ROLE_META).map(([key, meta]) => (
              <button key={key} onClick={() => setForm((f) => ({ ...f, role_name: key, dept_id: "", program_id: "", branch_id: "", section_id: "" }))}
                className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all ${form.role_name === key ? `${COLOR_CLASS[meta.color]} border-2` : "border-border bg-card hover:bg-muted/20"}`}>
                <p className="font-semibold">{meta.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{meta.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scope fields — shown based on selected role */}
        {selectedRole && scopeFields.length > 0 && (
          <div className="space-y-3 bg-muted/20 rounded-xl p-4">
            <p className="text-xs font-medium text-muted-foreground">Scope — {selectedRole.label} will only access the selected {selectedRole.scope}</p>

            {scopeFields.includes("dept_id") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Department *</Label>
                <SearchSelect endpoint={EP.departments.list} dataPath="departments" valueKey="id" labelKey="name"
                  value={form.dept_id} selectedLabel={form._deptLabel}
                  onChange={(v, opt) => setForm((f) => ({ ...f, dept_id: v, _deptLabel: opt?.name || "", program_id: "", branch_id: "", section_id: "" }))}
                  placeholder="Select department…" />
              </div>
            )}
            {scopeFields.includes("program_id") && form.dept_id && (
              <div className="space-y-1.5">
                <Label className="text-xs">Program *</Label>
                <SearchSelect endpoint={EP.programs.list} dataPath="programs" valueKey="id" labelKey="name"
                  extraParams={{ dept_id: form.dept_id }}
                  value={form.program_id} selectedLabel={form._programLabel}
                  onChange={(v, opt) => setForm((f) => ({ ...f, program_id: v, _programLabel: opt?.name || "", branch_id: "", section_id: "" }))}
                  placeholder="Select program…" />
              </div>
            )}
            {scopeFields.includes("branch_id") && form.program_id && (
              <div className="space-y-1.5">
                <Label className="text-xs">Branch *</Label>
                <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
                  extraParams={{ program_id: form.program_id }}
                  value={form.branch_id} selectedLabel={form._branchLabel}
                  onChange={(v, opt) => setForm((f) => ({ ...f, branch_id: v, _branchLabel: opt?.name || "", section_id: "" }))}
                  placeholder="Select branch…" />
              </div>
            )}
            {scopeFields.includes("section_id") && form.branch_id && (
              <div className="space-y-1.5">
                <Label className="text-xs">Section *</Label>
                <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
                  subLabelKey="branch.name"
                  extraParams={{ branch_id: form.branch_id }}
                  value={form.section_id} selectedLabel={form._sectionLabel}
                  onChange={(v, opt) => setForm((f) => ({ ...f, section_id: v, _sectionLabel: opt?.name || "" }))}
                  placeholder="Select section…" />
              </div>
            )}
          </div>
        )}

        {selectedRole && scopeFields.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>This role is <strong>institute-wide</strong> — no scope restriction. Faculty will have {selectedRole.label} access across all departments.</span>
          </div>
        )}

        {/* Expiry */}
        <div className="space-y-1.5">
          <Label className="text-xs">Expires At <span className="text-muted-foreground">(optional — leave blank for permanent)</span></Label>
          <Input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={save}>
            {loading ? "Assigning…" : "Assign Role"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function RoleAssignmentPage() {
  const [assignments,  setAssignments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(false);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("");
  const [revoking,     setRevoking]     = useState(null);

  const RBAC_BASE = `${window.location.origin.includes("localhost") ? "http://localhost:3000" : ""}/api/rbac`;

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(`${EP.admins.list.replace("/admins","")}/rbac/assignments`, {
        params: { role_name: roleFilter || undefined, limit: 100 },
      });
      setAssignments(r.data?.data?.assignments || []);
    } catch { notify.error("Failed to load role assignments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      await axiosInstance.delete(`${EP.admins.list.replace("/admins","")}/rbac/assignments/${id}`);
      notify.success("Role revoked");
      load();
    } catch (err) { notify.error(err); }
    finally { setRevoking(null); }
  };

  const filtered = assignments.filter((a) => {
    if (!search) return true;
    const name  = a.user?.faculty?.name  || a.user?.admin?.name  || "";
    const email = a.user?.email          || "";
    const role  = a.role?.name           || "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
           email.toLowerCase().includes(search.toLowerCase()) ||
           role.toLowerCase().includes(search.toLowerCase());
  });

  // Group by role for display
  const byRole = {};
  for (const a of filtered) {
    const rn = a.role?.name || "UNKNOWN";
    if (!byRole[rn]) byRole[rn] = [];
    byRole[rn].push(a);
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          <h1 className="text-xl font-bold">Role Assignments</h1>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{assignments.length}</span>
        </div>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={13} className="mr-1.5" /> Assign Role
        </Button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 space-y-1.5">
        <p className="font-semibold">How roles work:</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
          {Object.entries(ROLE_META).map(([key, meta]) => (
            <p key={key}>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1.5 ${COLOR_CLASS[meta.color]}`}>{meta.label}</span>
              {meta.desc}
            </p>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email…" className="pl-9 h-9" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">All Roles</option>
          {Object.entries(ROLE_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {/* Assignments grouped by role */}
      {loading ? (
        <div className="text-center py-16 text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Shield size={32} className="mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No role assignments yet</p>
          <Button size="sm" onClick={() => setModal(true)}><Plus size={13} className="mr-1.5" /> Assign First Role</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byRole).map(([roleName, items]) => {
            const meta = ROLE_META[roleName] || { label: roleName, color: "gray", desc: "" };
            return (
              <div key={roleName} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className={`flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20`}>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${COLOR_CLASS[meta.color]}`}>{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.desc}</span>
                  <span className="ml-auto text-xs font-medium text-muted-foreground">{items.length} assigned</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {items.map((a) => {
                      const person = a.user?.faculty || a.user?.admin;
                      const name   = person?.name || a.user?.email || "—";
                      const empId  = person?.emp_id || "";
                      const deptName = person?.department?.name || "";

                      // Scope label
                      let scope = "Institute-wide";
                      if (a.section_id) scope = `Section: ${a.section_id.slice(0,8)}…`;
                      if (a.branch_id)  scope = `Branch: ${a.branch_id.slice(0,8)}…`;
                      if (a.program_id) scope = `Program: ${a.program_id.slice(0,8)}…`;
                      if (a.dept_id)    scope = `Dept: ${a.dept_id.slice(0,8)}…`;

                      return (
                        <tr key={a.id} className="hover:bg-muted/10">
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">{name}</p>
                            {empId && <p className="text-xs text-muted-foreground">{empId} {deptName ? `· ${deptName}` : ""}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{a.user?.email || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{scope}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {a.expires_at
                              ? new Date(a.expires_at) < new Date()
                                ? <span className="text-destructive">Expired</span>
                                : new Date(a.expires_at).toLocaleDateString("en-IN")
                              : "Permanent"}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-red-50 h-7 px-2"
                              disabled={revoking === a.id}
                              onClick={() => handleRevoke(a.id)}>
                              <Trash2 size={12} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {modal && <AssignModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
}
