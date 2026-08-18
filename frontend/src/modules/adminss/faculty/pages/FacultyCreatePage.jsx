// src/modules/faculty/pages/FacultyCreatePage.jsx
// 6-step form: Account → Identity → Type & Dept → Qualifications → Roles & Access → HR
import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Check, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { fetchDepartments } from "../../../../redux/academic/academicSlice.js";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

const STEPS = [
  { label:"Account",        desc:"Login credentials" },
  { label:"Identity",       desc:"Name & personal info" },
  { label:"Type & Dept",    desc:"Teaching/Non-teaching, department" },
  { label:"Qualifications", desc:"Academic qualifications" },
  { label:"Roles",          desc:"Primary/secondary role & access" },
  { label:"HR",             desc:"Payroll & bank details" },
];

const DESIGNATIONS    = ["Professor","Associate Professor","Assistant Professor","Lecturer","Lab Assistant","Lab Technician","HOD","Visiting Faculty","Director","Principal","Administrative Officer","Accountant","Librarian","Security","Peon","Driver","Other"];
const EMPLOYEE_TYPES  = ["PERMANENT","CONTRACT","VISITING","PART_TIME"];
const GENDERS         = ["MALE","FEMALE","OTHER"];
const BLOOD_GROUPS    = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const QUAL_LEVELS     = [
  { key:"TENTH",     label:"10th (Matriculation)", mandatory:true },
  { key:"TWELFTH",   label:"12th (Intermediate)",  mandatory:true },
  { key:"DIPLOMA",   label:"Diploma",              mandatory:false },
  { key:"BACHELOR",  label:"Bachelor's Degree",    mandatory:false },
  { key:"MASTER",    label:"Master's Degree",      mandatory:false },
  { key:"PHD",       label:"PhD / Doctorate",      mandatory:false },
];

const inp = (err) => `w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-colors ${err ? "border-destructive" : "border-input"}`;
const sel = (err) => `w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-colors ${err ? "border-destructive" : "border-input"}`;

function F({ label, error, children, required, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint  && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Card({ title, children, className="" }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 space-y-4 ${className}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

// ── Qualification row ──────────────────────────────────────────
function QualRow({ level, label, mandatory, value, onChange, isTeaching }) {
  const [show, setShow] = useState(mandatory || !!value?.board_university);
  if (!isTeaching && !mandatory) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setShow(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/20 transition-colors ${show ? "bg-muted/10" : ""}`}>
        <span className="flex items-center gap-2">
          {label}
          {mandatory && isTeaching && <span className="text-[10px] text-red-500 font-semibold">REQUIRED</span>}
        </span>
        {show ? "−" : "+"}
      </button>
      {show && (
        <div className="p-4 space-y-3 border-t border-border bg-muted/5">
          <div className="grid grid-cols-2 gap-3">
            <F label="Board / University">
              <input className={inp(false)} value={value?.board_university || ""} onChange={e => onChange({ ...value, board_university: e.target.value })} placeholder="CBSE / MDU…"/>
            </F>
            <F label="Institution">
              <input className={inp(false)} value={value?.institution || ""} onChange={e => onChange({ ...value, institution: e.target.value })}/>
            </F>
            <F label="Subject / Stream">
              <input className={inp(false)} value={value?.subject_stream || ""} onChange={e => onChange({ ...value, subject_stream: e.target.value })}/>
            </F>
            <F label="Year of Passing">
              <input className={inp(false)} type="number" min={1980} max={2030} value={value?.year_of_passing || ""} onChange={e => onChange({ ...value, year_of_passing: parseInt(e.target.value)||null })}/>
            </F>
            <F label="Percentage / CGPA">
              <input className={inp(false)} type="number" step="0.01" value={value?.percentage || ""} onChange={e => onChange({ ...value, percentage: parseFloat(e.target.value)||null })}/>
            </F>
            <F label="Grade / Division">
              <input className={inp(false)} value={value?.grade || ""} onChange={e => onChange({ ...value, grade: e.target.value })} placeholder="A / First Division…"/>
            </F>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function FacultyCreatePage() {
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const departments = useSelector(s => s.academic?.departments?.list ?? []);

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [roles,   setRoles]   = useState([]);

  // Form state
  const [form, setForm] = useState({
    email:"", password:"", confirmPassword:"",
    first_name:"", last_name:"", nick_name:"",
    gender:"", dob:"", aadhar_no:"", pan_no:"",
    personal_email:"", phone:"",
    is_teaching: true,
    dept_id:"", designation:"", employee_type:"PERMANENT",
    emp_id:"", employee_code:"", joining_date:"",
    experience_years:"", specialization:"",
    blood_group:"", category:"", religion:"",
    emergency_contact:"", emergency_phone:"", emergency_relation:"",
    primary_role_id:"", secondary_role_id:"",
    salary_grade:"", pf_number:"", esi_number:"",
    bank_name:"", bank_ifsc:"",
    status:"ACTIVE",
  });

  // Qualification state per level
  const [quals, setQuals] = useState({});

  useEffect(() => {
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
    // Load available roles for step 5
    axiosInstance.get("/api/permissions/groups")
      .then(r => setRoles(r.data?.data || []))
      .catch(() => {});
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
  const setQ = level => val => setQuals(q => ({ ...q, [level]: val }));

  const validate = (s = step) => {
    const e = {};
    if (s === 0) {
      if (!form.email)     e.email     = "Required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.password || form.password.length < 8) e.password = "Min 8 chars";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    }
    if (s === 1) {
      if (!form.first_name.trim()) e.first_name = "Required";
      if (!form.last_name.trim())  e.last_name  = "Required";
    }
    if (s === 2) {
      if (!form.dept_id)     e.dept_id     = "Required";
      if (!form.designation) e.designation = "Required";
    }
    if (s === 3 && form.is_teaching) {
      if (!quals.TENTH?.board_university)   e.qual_tenth  = "10th qualification required";
      if (!quals.TWELFTH?.board_university) e.qual_twelfth = "12th qualification required";
    }
    return e;
  };

  const next = () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setErrors({}); setStep(s => s + 1);
  };

  const back = () => { setErrors({}); step === 0 ? navigate(-1) : setStep(s => s - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      payload.name = `${form.first_name} ${form.last_name}`.trim();
      // Clean empty strings
      Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });
      payload.experience_years = payload.experience_years ? parseInt(payload.experience_years) : null;

      // Create faculty
      const res = await axiosInstance.post(EP.faculty.create, payload);
      const facultyId = res.data?.data?.id;

      // Add qualifications if teaching
      if (facultyId && form.is_teaching) {
        for (const [level, val] of Object.entries(quals)) {
          if (val?.board_university) {
            await axiosInstance.post(`/api/faculty/${facultyId}/qualifications`, { level, ...val }).catch(() => {});
          }
        }
      }

      // Assign roles
      if (facultyId && (form.primary_role_id || form.secondary_role_id)) {
        await axiosInstance.patch(`/api/faculty/${facultyId}/roles`, {
          primary_role_id:   form.primary_role_id   || null,
          secondary_role_id: form.secondary_role_id || null,
        }).catch(() => {});
      }

      notify.success("Faculty created successfully");
      navigate("/admin/faculty/list");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to create faculty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={back} className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={16}/>
        </button>
        <div>
          <h1 className="text-xl font-bold">Add New Faculty</h1>
          <p className="text-sm text-muted-foreground">Step {step+1} of {STEPS.length} — {STEPS[step].desc}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
            <button onClick={() => i < step && setStep(i)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                i < step   ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80" :
                i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                             "bg-muted text-muted-foreground"
              }`}>
              {i < step ? <Check size={13}/> : i+1}
            </button>
            <span className={`text-xs hidden sm:block ${i===step ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
            {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-1 rounded ${i < step ? "bg-primary" : "bg-border"}`}/>}
          </div>
        ))}
      </div>

      {/* ── Step 0: Account ── */}
      {step === 0 && (
        <Card title="Login Credentials">
          <F label="College Email" required error={errors.email}>
            <input className={inp(errors.email)} type="email" value={form.email} onChange={set("email")} placeholder="empid@eitfaridabad.co.in"/>
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Password" required error={errors.password}>
              <input className={inp(errors.password)} type="password" value={form.password} onChange={set("password")}/>
            </F>
            <F label="Confirm Password" required error={errors.confirmPassword}>
              <input className={inp(errors.confirmPassword)} type="password" value={form.confirmPassword} onChange={set("confirmPassword")}/>
            </F>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            Faculty will be required to change password on first login.
          </div>
        </Card>
      )}

      {/* ── Step 1: Identity ── */}
      {step === 1 && (
        <>
          <Card title="Name">
            <div className="grid grid-cols-2 gap-4">
              <F label="First Name" required error={errors.first_name}><input className={inp(errors.first_name)} value={form.first_name} onChange={set("first_name")}/></F>
              <F label="Last Name"  required error={errors.last_name}><input  className={inp(errors.last_name)}  value={form.last_name}  onChange={set("last_name")}/></F>
            </div>
            <F label="Nick Name"><input className={inp(false)} value={form.nick_name} onChange={set("nick_name")} placeholder="Optional"/></F>
          </Card>
          <Card title="Personal Info">
            <div className="grid grid-cols-2 gap-4">
              <F label="Gender"><select className={sel(false)} value={form.gender} onChange={set("gender")}><option value="">Select…</option>{GENDERS.map(g=><option key={g}>{g}</option>)}</select></F>
              <F label="Date of Birth"><input className={inp(false)} type="date" value={form.dob} onChange={set("dob")}/></F>
              <F label="Blood Group"><select className={sel(false)} value={form.blood_group} onChange={set("blood_group")}><option value="">Select…</option>{BLOOD_GROUPS.map(b=><option key={b}>{b}</option>)}</select></F>
              <F label="Category"><input className={inp(false)} value={form.category} onChange={set("category")} placeholder="General/OBC/SC/ST"/></F>
              <F label="Aadhar No"><input className={inp(false)} value={form.aadhar_no} onChange={set("aadhar_no")} maxLength={12}/></F>
              <F label="PAN No"><input className={inp(false)} value={form.pan_no} onChange={set("pan_no")} maxLength={10}/></F>
              <F label="Religion"><input className={inp(false)} value={form.religion} onChange={set("religion")}/></F>
              <F label="Personal Email"><input className={inp(false)} type="email" value={form.personal_email} onChange={set("personal_email")}/></F>
            </div>
          </Card>
          <Card title="Contact">
            <F label="Phone"><input className={inp(false)} value={form.phone} onChange={set("phone")}/></F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Emergency Contact Name"><input className={inp(false)} value={form.emergency_contact} onChange={set("emergency_contact")}/></F>
              <F label="Relationship"><input className={inp(false)} value={form.emergency_relation} onChange={set("emergency_relation")} placeholder="Spouse, Parent…"/></F>
            </div>
            <F label="Emergency Phone"><input className={inp(false)} value={form.emergency_phone} onChange={set("emergency_phone")}/></F>
          </Card>
        </>
      )}

      {/* ── Step 2: Type & Dept ── */}
      {step === 2 && (
        <>
          <Card title="Faculty Type">
            <div className="grid grid-cols-2 gap-3">
              {[
                { val:true,  label:"Teaching",     desc:"Lectures, labs, tutorials" },
                { val:false, label:"Non-Teaching",  desc:"Admin, lab tech, support" },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setForm(f=>({...f, is_teaching:opt.val}))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${form.is_teaching===opt.val ? "border-primary bg-primary/5" : "border-border hover:bg-muted/20"}`}>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
            {!form.is_teaching && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Non-teaching faculty don't require qualification details.
              </div>
            )}
          </Card>
          <Card title="Department & Role" error={errors.dept_id}>
            <F label="Department" required error={errors.dept_id}>
              <select className={sel(errors.dept_id)} value={form.dept_id} onChange={set("dept_id")}>
                <option value="">Select department…</option>
                {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </F>
            <F label="Designation" required error={errors.designation}>
              <select className={sel(errors.designation)} value={form.designation} onChange={set("designation")}>
                <option value="">Select…</option>
                {DESIGNATIONS.map(d=><option key={d}>{d}</option>)}
              </select>
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Employee Type"><select className={sel(false)} value={form.employee_type} onChange={set("employee_type")}>{EMPLOYEE_TYPES.map(e=><option key={e}>{e}</option>)}</select></F>
              <F label="Emp ID"><input className={inp(false)} value={form.emp_id} onChange={set("emp_id")} placeholder="EIT001"/></F>
              <F label="Employee Code"><input className={inp(false)} value={form.employee_code} onChange={set("employee_code")}/></F>
              <F label="Joining Date"><input className={inp(false)} type="date" value={form.joining_date} onChange={set("joining_date")}/></F>
              <F label="Experience (years)"><input className={inp(false)} type="number" value={form.experience_years} onChange={set("experience_years")}/></F>
              <F label="Specialization"><input className={inp(false)} value={form.specialization} onChange={set("specialization")}/></F>
            </div>
          </Card>
        </>
      )}

      {/* ── Step 3: Qualifications ── */}
      {step === 3 && (
        <Card title={form.is_teaching ? "Academic Qualifications (Teaching Faculty)" : "Non-Teaching — No Qualifications Required"}>
          {!form.is_teaching ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <p>Non-teaching faculty do not require qualification details.</p>
              <p className="mt-1 text-xs">Click Next to continue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.qual_tenth   && <p className="text-xs text-destructive">{errors.qual_tenth}</p>}
              {errors.qual_twelfth && <p className="text-xs text-destructive">{errors.qual_twelfth}</p>}
              {QUAL_LEVELS.map(q => (
                <QualRow
                  key={q.key}
                  level={q.key} label={q.label}
                  mandatory={q.mandatory}
                  value={quals[q.key]}
                  onChange={setQ(q.key)}
                  isTeaching={form.is_teaching}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Step 4: Roles & Access ── */}
      {step === 4 && (
        <Card title="Roles & Access Level">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">How roles work:</p>
            <p>Primary role = main access level (e.g. Teaching Faculty, HOD, Lab Incharge)</p>
            <p>Secondary role = additional access (e.g. TT Coordinator, Exam Coordinator)</p>
            <p>Each role carries specific permissions assigned by the admin.</p>
          </div>
          <F label="Primary Role" hint="Main role for this faculty">
            <select className={sel(false)} value={form.primary_role_id} onChange={set("primary_role_id")}>
              <option value="">Select primary role…</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </F>
          <F label="Secondary Role (Optional)" hint="Additional role — optional">
            <select className={sel(false)} value={form.secondary_role_id} onChange={set("secondary_role_id")}>
              <option value="">None</option>
              {roles.filter(r => r.id !== form.primary_role_id).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </F>
          {!roles.length && (
            <p className="text-xs text-amber-600">
              No roles configured yet. Create roles from Admin → Roles & Permissions first.
            </p>
          )}
        </Card>
      )}

      {/* ── Step 5: HR ── */}
      {step === 5 && (
        <>
          <Card title="Salary & Payroll">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⚠ Salary and bank details are encrypted. Only Super Admin can view them.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Salary Grade"><input className={inp(false)} value={form.salary_grade} onChange={set("salary_grade")} placeholder="L6"/></F>
              <F label="PF Number"><input className={inp(false)} value={form.pf_number} onChange={set("pf_number")}/></F>
              <F label="ESI Number"><input className={inp(false)} value={form.esi_number} onChange={set("esi_number")}/></F>
            </div>
          </Card>
          <Card title="Bank Details">
            <div className="grid grid-cols-2 gap-4">
              <F label="Bank Name"><input className={inp(false)} value={form.bank_name} onChange={set("bank_name")}/></F>
              <F label="IFSC Code"><input className={inp(false)} value={form.bank_ifsc} onChange={set("bank_ifsc")}/></F>
            </div>
          </Card>
          {/* Summary */}
          <Card title="Summary" className="bg-muted/20">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{form.first_name} {form.last_name}</span>
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate">{form.email}</span>
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{form.is_teaching ? "Teaching" : "Non-Teaching"}</span>
              <span className="text-muted-foreground">Dept</span>
              <span className="font-medium">{departments.find(d=>d.id===form.dept_id)?.name || "—"}</span>
              <span className="text-muted-foreground">Designation</span>
              <span className="font-medium">{form.designation || "—"}</span>
              <span className="text-muted-foreground">Primary Role</span>
              <span className="font-medium">{roles.find(r=>r.id===form.primary_role_id)?.name || "—"}</span>
            </div>
          </Card>
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={back} className="h-10 px-5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
          {step === 0 ? "Cancel" : "← Back"}
        </button>
        {step < STEPS.length - 1
          ? <button onClick={next} className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              Next →
            </button>
          : <button onClick={handleSubmit} disabled={loading}
              className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin"/>}
              Create Faculty
            </button>
        }
      </div>
    </div>
  );
}