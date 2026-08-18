// src/modules/adminss/faculty/pages/FacultyEditPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Shield, Check, X } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer",
  "Senior Lecturer", "Lab Instructor", "Demonstrator", "Technical Staff",
  "Admin Staff", "Librarian", "Account Officer", "Other"];
const EMP_TYPES = ["PERMANENT", "CONTRACT", "VISITING", "ADJUNCT", "PART_TIME", "AD_HOC"];
const ERP_ROLES = [
  { value: "FACULTY", label: "Faculty (default)" },
  { value: "DEPT_ADMIN", label: "Dept Admin" },
  { value: "EXAM_COORD", label: "Exam Coordinator" },
  { value: "ACCOUNT", label: "Account Officer" },
  { value: "LIBRARY", label: "Librarian" },
  { value: "LAB_INCHARGE", label: "Lab In-charge" },
  { value: "HOSTEL_WARDEN", label: "Hostel Warden" },
  { value: "PLACEMENT", label: "Placement Officer" },
];
const ACCOMM_TYPES = ["QUARTER", "FLAT", "HOSTEL", "OUTSIDE"];
const GENDERS = ["MALE", "FEMALE", "OTHER"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Other"];

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

const F = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}{hint && <span className="text-muted-foreground font-normal ml-1">({hint})</span>}</Label>
    {children}
  </div>
);
const G2 = ({ children }) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const G3 = ({ children }) => <div className="grid grid-cols-3 gap-3">{children}</div>;
const Sec = ({ title, children }) => (
  <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
    {children}
  </div>
);
const Toggle = ({ label, desc, checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer p-3 bg-muted/20 rounded-xl border border-border">
    <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 mt-0.5 accent-primary shrink-0" />
    <div><p className="text-sm font-medium">{label}</p>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
  </label>
);

const TABS = ["Basic", "Academic", "Campus", "Contact", "HR", "Account", "Access"];

export default function FacultyEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Basic");
  const [form, setForm] = useState(null);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [allRoles, setAllRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [rolesSaving, setRolesSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.faculty.byId(id)),
      axiosInstance.get(EP.departments.list + "?limit=100"),
      axiosInstance.get(EP.roles.list),
    ]).then(([fRes, dRes, rRes]) => {
      const f = fRes.data?.data;
      setAllRoles(rRes.data?.data || []);
      setForm({
        name: f?.name || "",
        first_name: f?.first_name || "",
        last_name: f?.last_name || "",
        nick_name: f?.nick_name || "",
        gender: f?.gender || "",
        dob: f?.dob?.slice(0, 10) || "",
        blood_group: f?.blood_group || "",
        category: f?.category || "",
        religion: f?.religion || "",
        personal_email: f?.personal_email || "",
        aadhar_no: f?.aadhar_no || "",
        pan_no: f?.pan_no || "",
        // Academic
        dept_id: f?.dept_id || "",
        designation: f?.designation || "",
        employee_type: f?.employee_type || "",
        status: f?.status || "ACTIVE",
        joining_date: f?.joining_date?.slice(0, 10) || "",
        emp_id: f?.emp_id || "",
        employee_code: f?.employee_code || "",
        qualification: f?.qualification || "",
        specialization: f?.specialization || "",
        experience_years: f?.experience_years || "",
        erp_role: f?.erp_role || "FACULTY",
        is_teaching: f?.is_teaching !== false,
        // Campus
        lives_on_campus: f?.lives_on_campus || false,
        accommodation_type: f?.accommodation_type || "",
        campus_quarter_no: f?.campus_quarter_no || "",
        campus_address: f?.campus_address || "",
        biometric_device_id: f?.biometric_device_id || "",
        // Contact
        phone: f?.phone || "",
        address: f?.address || "",
        city: f?.city || "",
        state: f?.state || "",
        pincode: f?.pincode || "",
        emergency_contact: f?.emergency_contact || "",
        emergency_phone: f?.emergency_phone || "",
        emergency_relation: f?.emergency_relation || "",
        // HR
        salary_grade: f?.salary_grade || "",
        pf_number: f?.pf_number || "",
        esi_number: f?.esi_number || "",
        bank_name: f?.bank_name || "",
        bank_ifsc: f?.bank_ifsc || "",
      });
      setNewEmail(f?.user?.email || "");
      setDepts(dRes.data?.data?.departments || dRes.data?.data || []);
      // Load current roles for this user
      const uid = f?.user?.id || f?.user_id;
      if (uid) {
        axiosInstance.get(EP.roles.userRoles(uid))
          .then(r => setUserRoles((r.data?.data || []).map(x => x.role_id || x.id)))
          .catch(() => { });
      }
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = k => e => {
    const v = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm(f => ({ ...f, [k]: v }));
  };

  const saveRoles = async () => {
    const uid = (await axiosInstance.get(EP.faculty.byId(id))).data?.data?.user?.id;
    if (!uid) { notify.error("No user linked to this faculty"); return; }
    setRolesSaving(true);
    try {
      await axiosInstance.post(EP.roles.assignToUser, { user_id: uid, role_ids: userRoles });
      notify.success("Roles saved");
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setRolesSaving(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.faculty.update(id), {
        ...form,
        experience_years: form.experience_years ? parseInt(form.experience_years) : null,
        dob: form.dob || null,
        joining_date: form.joining_date || null,
        lives_on_campus: Boolean(form.lives_on_campus),
        is_teaching: Boolean(form.is_teaching),
        accommodation_type: form.accommodation_type || null,
      });
      notify.success("Saved");
      navigate(`/admin/faculty/${id}`);
    } catch (err) { notify.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const updateEmail = async () => {
    if (!newEmail.trim()) { notify.error("Enter email"); return; }
    setEmailSaving(true);
    try {
      await axiosInstance.patch(EP.faculty.update(id), { email: newEmail.trim() });
      notify.success("Login email updated");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setEmailSaving(false); }
  };

  if (loading || !form) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/faculty/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold flex-1">Edit Faculty</h1>
        <Button disabled={saving} onClick={save}>
          {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
          {saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Basic */}
      {tab === "Basic" && (
        <div className="space-y-4">
          <Sec title="Name">
            <G3>
              <F label="First Name"><input className={inp} value={form.first_name} onChange={set("first_name")} /></F>
              <F label="Last Name"><input className={inp} value={form.last_name} onChange={set("last_name")} /></F>
              <F label="Nick Name"><input className={inp} value={form.nick_name} onChange={set("nick_name")} placeholder="Optional" /></F>
            </G3>
          </Sec>
          <Sec title="Personal">
            <G3>
              <F label="Gender">
                <select className={sel} value={form.gender} onChange={set("gender")}>
                  <option value="">Select…</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </F>
              <F label="DOB"><input className={inp} type="date" value={form.dob} onChange={set("dob")} /></F>
              <F label="Blood Group">
                <select className={sel} value={form.blood_group} onChange={set("blood_group")}>
                  <option value="">Select…</option>
                  {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </F>
            </G3>
            <G3>
              <F label="Category">
                <select className={sel} value={form.category} onChange={set("category")}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </F>
              <F label="Religion"><input className={inp} value={form.religion} onChange={set("religion")} /></F>
              <F label="Aadhar No"><input className={inp} value={form.aadhar_no} onChange={set("aadhar_no")} maxLength={12} /></F>
            </G3>
            <G2>
              <F label="PAN No"><input className={inp} value={form.pan_no} onChange={set("pan_no")} maxLength={10} style={{ textTransform: "uppercase" }} /></F>
              <F label="Personal Email"><input className={inp} type="email" value={form.personal_email} onChange={set("personal_email")} /></F>
            </G2>
          </Sec>
        </div>
      )}

      {/* Academic */}
      {tab === "Academic" && (
        <div className="space-y-4">
          <Sec title="Department & Role">
            <G2>
              <F label="Department">
                <select className={sel} value={form.dept_id} onChange={set("dept_id")}>
                  <option value="">Select…</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </F>
              <F label="Designation">
                <select className={sel} value={form.designation} onChange={set("designation")}>
                  <option value="">Select…</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </F>
            </G2>
            <G3>
              <F label="Employee Type">
                <select className={sel} value={form.employee_type} onChange={set("employee_type")}>
                  <option value="">Select…</option>
                  {EMP_TYPES.map(e => <option key={e} value={e}>{e.replace(/_/g, " ")}</option>)}
                </select>
              </F>
              <F label="Status">
                <select className={sel} value={form.status} onChange={set("status")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="RESIGNED">Resigned</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </F>
              <F label="Joining Date"><input className={inp} type="date" value={form.joining_date} onChange={set("joining_date")} /></F>
            </G3>
            <G3>
              <F label="Emp ID"><input className={inp} value={form.emp_id} onChange={set("emp_id")} /></F>
              <F label="Emp Code"><input className={inp} value={form.employee_code} onChange={set("employee_code")} /></F>
              <F label="Experience (yrs)"><input className={inp} type="number" min="0" value={form.experience_years} onChange={set("experience_years")} /></F>
            </G3>
          </Sec>
          <Sec title="Qualification">
            <G2>
              <F label="Qualification"><input className={inp} value={form.qualification} onChange={set("qualification")} placeholder="M.Tech / Ph.D…" /></F>
              <F label="Specialization"><input className={inp} value={form.specialization} onChange={set("specialization")} /></F>
            </G2>
          </Sec>
          <Sec title="ERP Access Role">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ERP_ROLES.map(r => (
                <label key={r.value} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${form.erp_role === r.value ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/20"}`}>
                  <input type="radio" name="erp_role" value={r.value} checked={form.erp_role === r.value}
                    onChange={set("erp_role")} className="w-3.5 h-3.5 accent-primary" />
                  {r.label}
                </label>
              ))}
            </div>
          </Sec>
        </div>
      )}

      {/* Campus */}
      {tab === "Campus" && (
        <div className="space-y-4">
          <Sec title="Teaching Status">
            <Toggle label="Teaching Faculty"
              desc="Appears in timetable & can mark attendance"
              checked={form.is_teaching} onChange={v => setForm(f => ({ ...f, is_teaching: v }))} />
          </Sec>
          <Sec title="Campus Residence">
            <Toggle label="Lives on Campus"
              desc="Faculty resides in campus accommodation"
              checked={form.lives_on_campus} onChange={v => setForm(f => ({ ...f, lives_on_campus: v }))} />
            {form.lives_on_campus && (
              <>
                <F label="Accommodation Type">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ACCOMM_TYPES.map(t => (
                      <label key={t} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${form.accommodation_type === t ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/20"}`}>
                        <input type="radio" name="accomm" value={t} checked={form.accommodation_type === t}
                          onChange={set("accommodation_type")} className="w-3.5 h-3.5 accent-primary" />
                        {t}
                      </label>
                    ))}
                  </div>
                </F>
                <G2>
                  <F label="Quarter / Room No"><input className={inp} value={form.campus_quarter_no} onChange={set("campus_quarter_no")} placeholder="Q-12" /></F>
                  <F label="Campus Address"><input className={inp} value={form.campus_address} onChange={set("campus_address")} /></F>
                </G2>
              </>
            )}
          </Sec>
          <Sec title="Biometric">
            <F label="Biometric Device ID" hint="optional">
              <input className={inp} value={form.biometric_device_id} onChange={set("biometric_device_id")} placeholder="Device enrollment number" />
            </F>
          </Sec>
        </div>
      )}

      {/* Contact */}
      {tab === "Contact" && (
        <div className="space-y-4">
          <Sec title="Phone">
            <F label="Office / Mobile Phone">
              <input className={inp} value={form.phone} onChange={set("phone")} placeholder="9876543210" />
            </F>
          </Sec>
          <Sec title="Address">
            <F label="Full Address"><input className={inp} value={form.address} onChange={set("address")} /></F>
            <G3>
              <F label="City"><input className={inp} value={form.city} onChange={set("city")} /></F>
              <F label="State"><input className={inp} value={form.state} onChange={set("state")} /></F>
              <F label="Pincode"><input className={inp} value={form.pincode} onChange={set("pincode")} maxLength={6} /></F>
            </G3>
          </Sec>
          <Sec title="Emergency Contact">
            <G3>
              <F label="Name"><input className={inp} value={form.emergency_contact} onChange={set("emergency_contact")} /></F>
              <F label="Phone"><input className={inp} value={form.emergency_phone} onChange={set("emergency_phone")} /></F>
              <F label="Relation"><input className={inp} value={form.emergency_relation} onChange={set("emergency_relation")} /></F>
            </G3>
          </Sec>
        </div>
      )}

      {/* HR */}
      {tab === "HR" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⚠ Salary and bank details are encrypted. Only Super Admin can view.
          </div>
          <Sec title="Salary">
            <G3>
              <F label="Salary Grade"><input className={inp} value={form.salary_grade} onChange={set("salary_grade")} placeholder="L4" /></F>
              <F label="PF Number"><input className={inp} value={form.pf_number} onChange={set("pf_number")} /></F>
              <F label="ESI Number"><input className={inp} value={form.esi_number} onChange={set("esi_number")} /></F>
            </G3>
          </Sec>
          <Sec title="Bank">
            <G2>
              <F label="Bank Name"><input className={inp} value={form.bank_name} onChange={set("bank_name")} /></F>
              <F label="IFSC"><input className={inp} value={form.bank_ifsc} onChange={set("bank_ifsc")} style={{ textTransform: "uppercase" }} /></F>
            </G2>
          </Sec>
        </div>
      )}

      {/* Account */}
      {tab === "Account" && (
        <div className="space-y-4">
          <Sec title="Login Email">
            <p className="text-xs text-muted-foreground">Changing login email will update faculty's login credentials immediately.</p>
            <div className="flex gap-3">
              <input className={inp + " flex-1"} type="email" value={newEmail}
                onChange={e => setNewEmail(e.target.value)} placeholder="New login email" />
              <Button disabled={emailSaving} onClick={updateEmail}>
                {emailSaving ? <Loader2 size={13} className="animate-spin" /> : "Update Email"}
              </Button>
            </div>
          </Sec>
          <Sec title="Access Role">
            <p className="text-xs text-muted-foreground mb-2">This controls what modules this faculty can access in the ERP.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ERP_ROLES.map(r => (
                <label key={r.value} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${form.erp_role === r.value ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/20"}`}>
                  <input type="radio" name="erp_role2" value={r.value} checked={form.erp_role === r.value}
                    onChange={set("erp_role")} className="w-3.5 h-3.5 accent-primary" />
                  {r.label}
                </label>
              ))}
            </div>
          </Sec>
        </div>
      )}


      {/* Access */}
      {tab === "Access" && (
        <div className="space-y-4">
          <Sec title="ERP Role Assignments">
            <p className="text-xs text-muted-foreground mb-3">
              Select all roles this faculty member should have. These control which modules they can access.
            </p>
            {allRoles.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No roles found. <a href="/admin/roles/manage" className="text-primary hover:underline">Create roles first →</a>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allRoles.map(role => {
                  const active = userRoles.includes(role.id);
                  return (
                    <button key={role.id}
                      onClick={() => setUserRoles(prev => active ? prev.filter(r => r !== role.id) : [...prev, role.id])}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs text-left transition-all
                        ${active ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border hover:bg-muted/30"}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                        ${active ? "bg-primary border-primary" : "border-input"}`}>
                        {active && <Check size={10} className="text-primary-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{role.name}</p>
                        {role.description && <p className="text-[10px] text-muted-foreground font-normal truncate">{role.description}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={saveRoles} disabled={rolesSaving}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {rolesSaving ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
                {rolesSaving ? "Saving…" : "Save Roles"}
              </button>
            </div>
          </Sec>
        </div>
      )}

      {/* Bottom save bar */}
      <div className="flex justify-end pt-2">
        <Button disabled={saving} onClick={save} className="min-w-32">
          {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}