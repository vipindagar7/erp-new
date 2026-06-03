import { fmtSection, sectionOption } from "../../../lib/formatSection.js";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  toggleStudentBlock, promoteStudent,
  bulkPromoteSection, bulkPromoteInstitution,
  changeStudentSection, bulkChangeSection,
} from "../../../redux/student/studentSlice.js";
import { fetchDepartments, fetchPrograms, fetchCourses, fetchSections } from "../../../redux/academic/academicSlice.js";
import { fetchMyForms, submitFeedback } from "../../../redux/feedback/feedbackSlice.js";
import axiosInstance from "../../../lib/axios.js";
import {notify} from "../../../hooks/notify.js";
import { BulkActionsMenu, InstituteWidePromoteModal } from "../../../components/StudentsBulkModals.jsx";
import AdminUserActions from "../../../components/admin/AdminUserActions.jsx";


// ── Constants ──────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => { const y = currentYear - 3 + i; return `${y}-${y + 1}`; });
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const GENDERS = ["MALE", "FEMALE", "OTHER"];
const STATUSES = ["ACTIVE", "DETAINED", "PASSED", "LEFT", "TRANSFERRED"];
const ADMIT_MODES = ["DIRECT", "MANAGEMENT", "LATERAL", "NRI", "OTHER"];

const EMPTY = {
  email: "", password: "", confirmPassword: "",
  first_name: "", last_name: "",
  roll_number: "", enrollment_no: "", biometric_id: "", group_no: "",
  gender: "", dob: "", aadhar_no: "", pan_no: "",
  contact_number: "", alt_contact_number: "", personal_email: "",
  father_name: "", father_mobile: "",
  mother_name: "", mother_mobile: "",
  mode_of_admission: "", admission_year: "", admission_date: "", session: "",
  batch_year: "",
  is_hosteller: false, is_using_transport: false,
  local_address: "", local_address_city: "", local_address_state: "", local_address_zipcode: "",
  permanent_address: "", permanent_address_city: "", permanent_address_state: "", permanent_address_zipcode: "",
  section_id: "", academic_year: `${currentYear}-${currentYear + 1}`, semester: 1,
};

const inp = (err) =>
  `w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-colors ${err ? "border-destructive" : "border-input"}`;
const sel = (err = false) =>
  `w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-colors ${err ? "border-destructive" : "border-input"}`;

function F({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-destructive ml-1">*</span>}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function Sec({ children }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1 pb-0.5">{children}</p>;
}

// ── Step Wizard ────────────────────────────────────────────────
const STEPS = [
  { label: "Account" }, { label: "Identity" }, { label: "Contact" },
  { label: "Address" }, { label: "Enrollment" },
];

function StepWizard({ current, children }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
              ${i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded ${i < current ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

function WizardNav({ current, onBack, onNext, onSubmit, loading }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
      <button onClick={onBack} className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        {current === 0 ? "Cancel" : "← Back"}
      </button>
      {current < STEPS.length - 1
        ? <button onClick={onNext} className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Next →</button>
        : <button onClick={onSubmit} disabled={loading} className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
          {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
          Create Student
        </button>}
    </div>
  );
}

// ── Wizard steps content ───────────────────────────────────────
function StepAccount({ form, set, errors }) {
  return (
    <div className="space-y-4">
      <Sec>Login Credentials</Sec>
      <F label="Email" required error={errors.email}>
        <input className={inp(errors.email)} type="email" value={form.email} onChange={set("email")} placeholder="student@college.edu" />
      </F>
      <div className="grid grid-cols-2 gap-4">
        <F label="Password" required error={errors.password}>
          <input className={inp(errors.password)} type="password" value={form.password} onChange={set("password")} placeholder="Min 8 chars" />
        </F>
        <F label="Confirm Password" required error={errors.confirmPassword}>
          <input className={inp(errors.confirmPassword)} type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter" />
        </F>
      </div>
    </div>
  );
}

function StepIdentity({ form, set, errors }) {
  return (
    <div className="space-y-4">
      <Sec>Name</Sec>
      <div className="grid grid-cols-2 gap-4">
        <F label="First Name" required error={errors.first_name}><input className={inp(errors.first_name)} value={form.first_name} onChange={set("first_name")} placeholder="Rahul" /></F>
        <F label="Last Name" required error={errors.last_name}><input className={inp(errors.last_name)} value={form.last_name} onChange={set("last_name")} placeholder="Kumar" /></F>
      </div>
      <Sec>Identity Numbers</Sec>
      <div className="grid grid-cols-2 gap-4">
        <F label="Roll Number" required error={errors.roll_number}><input className={inp(errors.roll_number)} value={form.roll_number} onChange={set("roll_number")} placeholder="e.g. 2025CS001" /></F>
        <F label="Enrollment No"><input className={inp()} value={form.enrollment_no} onChange={set("enrollment_no")} placeholder="Optional" /></F>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="Biometric ID"><input className={inp()} value={form.biometric_id} onChange={set("biometric_id")} placeholder="Optional" /></F>
        <F label="Group / House No"><input className={inp()} value={form.group_no} onChange={set("group_no")} placeholder="e.g. G1, House-A" /></F>
      </div>
      <Sec>Personal</Sec>
      <div className="grid grid-cols-2 gap-4">
        <F label="Gender">
          <select className={sel()} value={form.gender} onChange={set("gender")}>
            <option value="">Select…</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </F>
        <F label="Date of Birth"><input className={inp()} type="date" value={form.dob} onChange={set("dob")} /></F>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="Aadhar Number"><input className={inp()} value={form.aadhar_no} onChange={set("aadhar_no")} placeholder="12 digits" maxLength={12} /></F>
        <F label="PAN Number"><input className={inp()} value={form.pan_no} onChange={set("pan_no")} placeholder="ABCDE1234F" maxLength={10} /></F>
      </div>
    </div>
  );
}

function StepContact({ form, set, errors }) {
  return (
    <div className="space-y-4">
      <Sec>Contact</Sec>
      <div className="grid grid-cols-2 gap-4">
        <F label="Phone Number" required error={errors.contact_number}><input className={inp(errors.contact_number)} value={form.contact_number} onChange={set("contact_number")} placeholder="10-digit mobile" /></F>
        <F label="Alt. Phone"><input className={inp()} value={form.alt_contact_number} onChange={set("alt_contact_number")} placeholder="Optional" /></F>
      </div>
      <F label="Personal Email"><input className={inp()} type="email" value={form.personal_email} onChange={set("personal_email")} placeholder="personal@gmail.com" /></F>
      <Sec>Father</Sec>
      <div className="grid grid-cols-2 gap-4">
        <F label="Father's Name" required error={errors.father_name}><input className={inp(errors.father_name)} value={form.father_name} onChange={set("father_name")} /></F>
        <F label="Father's Mobile"><input className={inp()} value={form.father_mobile} onChange={set("father_mobile")} /></F>
      </div>
      <Sec>Mother</Sec>
      <div className="grid grid-cols-2 gap-4">
        <F label="Mother's Name" required error={errors.mother_name}><input className={inp(errors.mother_name)} value={form.mother_name} onChange={set("mother_name")} /></F>
        <F label="Mother's Mobile"><input className={inp()} value={form.mother_mobile} onChange={set("mother_mobile")} /></F>
      </div>
      <Sec>Admission</Sec>
      <div className="grid grid-cols-2 gap-4">
        <F label="Mode of Admission">
          <select className={sel()} value={form.mode_of_admission} onChange={set("mode_of_admission")}>
            <option value="">Select…</option>
            {ADMIT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </F>
        <F label="Admission Year"><input className={inp()} type="number" value={form.admission_year} onChange={set("admission_year")} placeholder="e.g. 2025" /></F>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="Admission Date"><input className={inp()} type="date" value={form.admission_date} onChange={set("admission_date")} /></F>
        <F label="Batch Year"><input className={inp()} type="number" value={form.batch_year} onChange={set("batch_year")} placeholder="e.g. 2024" /></F>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="Session"><input className={inp()} value={form.session} onChange={set("session")} placeholder="e.g. 2025-2026" /></F>
      </div>
      <div className="flex gap-6 pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={form.is_hosteller} onChange={(e) => set("is_hosteller")({ target: { value: e.target.checked } })} />
          <span>Is Hosteller</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={form.is_using_transport} onChange={(e) => set("is_using_transport")({ target: { value: e.target.checked } })} />
          <span>Using Transport</span>
        </label>
      </div>
    </div>
  );
}

function StepAddress({ form, set }) {
  const copyLocal = () => {
    set("permanent_address")({ target: { value: form.local_address } });
    set("permanent_address_city")({ target: { value: form.local_address_city } });
    set("permanent_address_state")({ target: { value: form.local_address_state } });
    set("permanent_address_zipcode")({ target: { value: form.local_address_zipcode } });
  };
  return (
    <div className="space-y-4">
      <Sec>Local Address</Sec>
      <F label="Address"><input className={inp()} value={form.local_address} onChange={set("local_address")} placeholder="Street / Area" /></F>
      <div className="grid grid-cols-3 gap-3">
        <F label="City"><input className={inp()} value={form.local_address_city} onChange={set("local_address_city")} /></F>
        <F label="State"><input className={inp()} value={form.local_address_state} onChange={set("local_address_state")} /></F>
        <F label="Pincode"><input className={inp()} value={form.local_address_zipcode} onChange={set("local_address_zipcode")} placeholder="110001" /></F>
      </div>
      <div className="flex items-center justify-between">
        <Sec>Permanent Address</Sec>
        <button type="button" onClick={copyLocal} className="text-xs text-primary hover:underline">Same as local ↑</button>
      </div>
      <F label="Address"><input className={inp()} value={form.permanent_address} onChange={set("permanent_address")} placeholder="Street / Area" /></F>
      <div className="grid grid-cols-3 gap-3">
        <F label="City"><input className={inp()} value={form.permanent_address_city} onChange={set("permanent_address_city")} /></F>
        <F label="State"><input className={inp()} value={form.permanent_address_state} onChange={set("permanent_address_state")} /></F>
        <F label="Pincode"><input className={inp()} value={form.permanent_address_zipcode} onChange={set("permanent_address_zipcode")} placeholder="400001" /></F>
      </div>
    </div>
  );
}

function StepEnrollment({ form, set, errors, sections }) {
  const sec = sections.find((s) => s.id === form.section_id);
  return (
    <div className="space-y-4">
      <F label="Section" required error={errors.section_id}>
        <select className={sel(errors.section_id)} value={form.section_id} onChange={set("section_id")}>
          <option value="">Select section…</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {sectionOption(s)}
            </option>
          ))}
        </select>
      </F>
      {sec && (
        <div className="rounded-xl bg-muted/30 border border-border p-3 grid grid-cols-3 gap-3 text-xs">
          {[
            ["Department", sec.course?.program?.department?.name],
            ["Program", sec.course?.program?.name],
            ["Course", sec.course?.name],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-muted-foreground">{k}</p>
              <p className="font-medium text-foreground">{v || "—"}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <F label="Academic Year" required error={errors.academic_year}>
          <select className={sel()} value={form.academic_year} onChange={set("academic_year")}>
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </F>
        <F label="Semester" required error={errors.semester}>
          <select className={sel()} value={form.semester} onChange={(e) => set("semester")({ target: { value: parseInt(e.target.value) } })}>
            {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s} ({s % 2 === 1 ? "ODD" : "EVEN"})</option>)}
          </select>
        </F>
      </div>
    </div>
  );
}

// ── Create Wizard Modal ────────────────────────────────────────
function CreateStudentModal({ open, onClose, onSubmit, loading, sections }) {
  const [step, setStep] = useState(0);
  const [form, setFormState] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  useEffect(() => { if (open) { setStep(0); setFormState(EMPTY); setErrors({}); } }, [open]);

  const set = (k) => (e) => setFormState((f) => ({ ...f, [k]: e.target.value !== undefined ? e.target.value : e.target.checked }));

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.email) e.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.password || form.password.length < 8) e.password = "Min 8 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    }
    if (step === 1) {
      if (!form.first_name.trim()) e.first_name = "Required";
      if (!form.last_name.trim()) e.last_name = "Required";
      if (!form.roll_number.trim()) e.roll_number = "Required";
    }
    if (step === 2) {
      if (!form.contact_number) e.contact_number = "Required";
      if (!form.father_name.trim()) e.father_name = "Required";
      if (!form.mother_name.trim()) e.mother_name = "Required";
    }
    if (step === 4) {
      if (!form.section_id) e.section_id = "Required";
    }
    return e;
  };

  const next = () => {
    const e = validate(); if (Object.keys(e).length) return setErrors(e);
    setErrors({}); setStep((s) => s + 1);
  };
  const submit = () => {
    const e = validate(); if (Object.keys(e).length) return setErrors(e);
    const { confirmPassword, ...payload } = form;
    payload.name = `${form.first_name} ${form.last_name}`;
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    onSubmit(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Add New Student</h2>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 pt-5 pb-6 overflow-y-auto flex-1">
          <StepWizard current={step}>
            {step === 0 && <StepAccount form={form} set={set} errors={errors} />}
            {step === 1 && <StepIdentity form={form} set={set} errors={errors} />}
            {step === 2 && <StepContact form={form} set={set} errors={errors} />}
            {step === 3 && <StepAddress form={form} set={set} />}
            {step === 4 && <StepEnrollment form={form} set={set} errors={errors} sections={sections} />}
            <WizardNav current={step} onBack={() => { setErrors({}); step === 0 ? onClose() : setStep((s) => s - 1); }}
              onNext={next} onSubmit={submit} loading={loading} />
          </StepWizard>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────
function EditStudentModal({ open, onClose, onSubmit, initialData, loading }) {
  const [form, setFormState] = useState({});
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (open && initialData) {
      setTab(0);
      setFormState({
        first_name: initialData.first_name || "", last_name: initialData.last_name || "",
        roll_number: initialData.roll_no || initialData.roll_number || "",
        enrollment_no: initialData.enrollment_no || "", biometric_id: initialData.biometric_id || "",
        group_no: initialData.group_no || "",
        gender: initialData.gender || "", dob: initialData.dob ? new Date(initialData.dob).toISOString().slice(0, 10) : "",
        aadhar_no: initialData.aadhar_no || "", pan_no: initialData.pan_no || "",
        contact_number: initialData.phone || initialData.contact_number || "",
        alt_contact_number: initialData.alt_contact_number || "",
        personal_email: initialData.personal_email || "",
        father_name: initialData.father_name || "", father_mobile: initialData.father_phone || initialData.father_mobile || "",
        mother_name: initialData.mother_name || "", mother_mobile: initialData.mother_phone || initialData.mother_mobile || "",
        mode_of_admission: initialData.mode_of_admission || "",
        admission_year: initialData.admission_year || "", admission_date: initialData.admission_date ? new Date(initialData.admission_date).toISOString().slice(0, 10) : "",
        session: initialData.session || "", batch_year: initialData.batch_year || "",
        is_hosteller: initialData.is_hosteller ?? false, is_using_transport: initialData.is_using_transport ?? false,
        local_address: initialData.address || initialData.local_address || "",
        local_address_city: initialData.city || initialData.local_address_city || "",
        local_address_state: initialData.state || initialData.local_address_state || "",
        local_address_zipcode: initialData.pincode || initialData.local_address_zipcode || "",
        permanent_address: initialData.permanent_address || "",
        permanent_address_city: initialData.permanent_address_city || "",
        permanent_address_state: initialData.permanent_address_state || "",
        permanent_address_zipcode: initialData.permanent_address_zipcode || "",
      });
      setErrors({});
    }
  }, [open, initialData]);

  const set = (k) => (e) => setFormState((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = "Required";
    if (!form.last_name?.trim()) e.last_name = "Required";
    if (!form.roll_number?.trim()) e.roll_number = "Required";
    if (!form.contact_number) e.contact_number = "Required";
    if (Object.keys(e).length) return setErrors(e);
    const payload = { ...form };
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    onSubmit(payload);
  };

  if (!open) return null;

  const TABS = ["Identity", "Contact", "Admission", "Address"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Edit Student</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{initialData?.first_name} {initialData?.last_name} · {initialData?.roll_no || initialData?.roll_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-border px-6 mt-3 gap-1 shrink-0">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === i ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          {tab === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <F label="First Name" required error={errors.first_name}><input className={inp(errors.first_name)} value={form.first_name || ""} onChange={set("first_name")} /></F>
                <F label="Last Name" required error={errors.last_name}><input className={inp(errors.last_name)} value={form.last_name || ""} onChange={set("last_name")} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Roll Number" required error={errors.roll_number}><input className={inp(errors.roll_number)} value={form.roll_number || ""} onChange={set("roll_number")} /></F>
                <F label="Enrollment No"><input className={inp()} value={form.enrollment_no || ""} onChange={set("enrollment_no")} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Biometric ID"><input className={inp()} value={form.biometric_id || ""} onChange={set("biometric_id")} /></F>
                <F label="Group / House No"><input className={inp()} value={form.group_no || ""} onChange={set("group_no")} placeholder="e.g. G1, House-A" /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Gender">
                  <select className={sel()} value={form.gender || ""} onChange={set("gender")}>
                    <option value="">Select…</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </F>
                <F label="Date of Birth"><input className={inp()} type="date" value={form.dob || ""} onChange={set("dob")} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Aadhar No"><input className={inp()} value={form.aadhar_no || ""} onChange={set("aadhar_no")} maxLength={12} /></F>
                <F label="PAN No"><input className={inp()} value={form.pan_no || ""} onChange={set("pan_no")} maxLength={10} /></F>
              </div>
            </>
          )}
          {tab === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <F label="Phone" required error={errors.contact_number}><input className={inp(errors.contact_number)} value={form.contact_number || ""} onChange={set("contact_number")} /></F>
                <F label="Alt Phone"><input className={inp()} value={form.alt_contact_number || ""} onChange={set("alt_contact_number")} /></F>
              </div>
              <F label="Personal Email"><input className={inp()} type="email" value={form.personal_email || ""} onChange={set("personal_email")} /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Father Name"><input className={inp()} value={form.father_name || ""} onChange={set("father_name")} /></F>
                <F label="Father Mobile"><input className={inp()} value={form.father_mobile || ""} onChange={set("father_mobile")} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Mother Name"><input className={inp()} value={form.mother_name || ""} onChange={set("mother_name")} /></F>
                <F label="Mother Mobile"><input className={inp()} value={form.mother_mobile || ""} onChange={set("mother_mobile")} /></F>
              </div>
            </>
          )}
          {tab === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <F label="Mode of Admission">
                  <select className={sel()} value={form.mode_of_admission || ""} onChange={set("mode_of_admission")}>
                    <option value="">Select…</option>
                    {ADMIT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </F>
                <F label="Admission Year"><input className={inp()} type="number" value={form.admission_year || ""} onChange={set("admission_year")} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Admission Date"><input className={inp()} type="date" value={form.admission_date || ""} onChange={set("admission_date")} /></F>
                <F label="Batch Year"><input className={inp()} type="number" value={form.batch_year || ""} onChange={set("batch_year")} placeholder="e.g. 2024" /></F>
              </div>
              <F label="Session"><input className={inp()} value={form.session || ""} onChange={set("session")} placeholder="e.g. 2025-2026" /></F>
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.is_hosteller || false} onChange={set("is_hosteller")} /><span>Is Hosteller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.is_using_transport || false} onChange={set("is_using_transport")} /><span>Using Transport</span>
                </label>
              </div>
            </>
          )}
          {tab === 3 && (
            <>
              <F label="Local Address"><input className={inp()} value={form.local_address || ""} onChange={set("local_address")} /></F>
              <div className="grid grid-cols-3 gap-3">
                <F label="City"><input className={inp()} value={form.local_address_city || ""} onChange={set("local_address_city")} /></F>
                <F label="State"><input className={inp()} value={form.local_address_state || ""} onChange={set("local_address_state")} /></F>
                <F label="Pincode"><input className={inp()} value={form.local_address_zipcode || ""} onChange={set("local_address_zipcode")} /></F>
              </div>
              <F label="Permanent Address"><input className={inp()} value={form.permanent_address || ""} onChange={set("permanent_address")} /></F>
              <div className="grid grid-cols-3 gap-3">
                <F label="City"><input className={inp()} value={form.permanent_address_city || ""} onChange={set("permanent_address_city")} /></F>
                <F label="State"><input className={inp()} value={form.permanent_address_state || ""} onChange={set("permanent_address_state")} /></F>
                <F label="Pincode"><input className={inp()} value={form.permanent_address_zipcode || ""} onChange={set("permanent_address_zipcode")} /></F>
              </div>
            </>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-3 shrink-0 border-t border-border pt-4">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────
function StudentDetailModal({ open, onClose, student }) {
  if (!open || !student) return null;
  const enrollment = student.enrollments?.find((e) => e.is_current) || student.studentEnrollments?.find((e) => e.is_current);
  const subjects = student.section?.sectionSubjects || [];
  const Row = ({ label, value }) => value ? (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  ) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{student.first_name} {student.last_name}</h2>
              {student.user?.isBlocked && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Blocked</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{student.roll_no || student.roll_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Roll Number" value={student.roll_no || student.roll_number} />
              <Row label="Enrollment No" value={student.enrollment_no} />
              <Row label="Group / House" value={student.group_no} />
              <Row label="Biometric ID" value={student.biometric_id} />
              <Row label="Gender" value={student.gender} />
              <Row label="DOB" value={student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : null} />
              <Row label="Aadhar No" value={student.aadhar_no} />
              <Row label="PAN No" value={student.pan_no} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Phone" value={student.phone || student.contact_number} />
              <Row label="Alt Phone" value={student.alt_contact_number} />
              <Row label="Login Email" value={student.user?.email} />
              <Row label="Personal Email" value={student.personal_email} />
              <Row label="Father" value={student.father_name} />
              <Row label="Father Mobile" value={student.father_phone || student.father_mobile} />
              <Row label="Mother" value={student.mother_name} />
              <Row label="Mother Mobile" value={student.mother_phone || student.mother_mobile} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Academic</p>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Department" value={student.department?.name} />
              <Row label="Program" value={student.program?.name} />
              <Row label="Course" value={student.course?.name} />
              <Row label="Section" value={student.section?.name} />
            </div>
          </div>
          {enrollment && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div>
                <p className="text-sm font-bold">{enrollment.academic_year}</p>
                <p className="text-xs text-muted-foreground">Semester {enrollment.semester} · {enrollment.section?.name}</p>
              </div>
              <span className="ml-auto px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Current</span>
            </div>
          )}
          {subjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subjects</p>
              <div className="space-y-1.5">
                {subjects.map((ss) => (
                  <div key={ss.subject?.id} className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg border border-border">
                    <p className="text-sm font-medium">{ss.subject?.name} <span className="text-xs font-mono text-muted-foreground">{ss.subject?.code}</span></p>
                    <p className="text-xs text-muted-foreground">{ss.faculty?.name || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Promote Modal ──────────────────────────────────────────────
function PromoteModal({ open, student, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  if (!open || !student) return null;
  const handle = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(`/students/${student.id}/promote`);
      notify.success(`${student.first_name} promoted to next semester`);
      onSuccess?.(); onClose();
    } catch (err) { notify.error(err.response?.data?.message || "Promotion failed"); }
    finally { setLoading(false); }
  };
  const current = student.enrollments?.find((e) => e.is_current) || student.studentEnrollments?.find((e) => e.is_current);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-center">Promote Student</h2>
        <div className="mt-3 mb-5 text-center">
          <p className="font-medium text-foreground">{student.first_name} {student.last_name}</p>
          <p className="text-sm text-muted-foreground">{student.roll_no || student.roll_number}</p>
          {current && (
            <p className="text-xs text-muted-foreground mt-1">
              Current: Sem {current.semester} · {current.academic_year}
              → Sem {current.semester + 1}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={handle} disabled={loading}
            className="flex-1 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
            ↑ Promote
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Section Modal ───────────────────────────────────────
function ChangeSectionModal({ open, onClose, onSuccess, student, selectedStudents, sections }) {
  const [sectionId, setSectionId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const isBulk = Array.isArray(selectedStudents) && selectedStudents.length > 0;
  useEffect(() => { if (open) { setSectionId(""); setRemarks(""); } }, [open]);
  if (!open) return null;
  const handle = async () => {
    if (!sectionId) return notify.error("Select a section");
    setLoading(true);
    try {
      if (isBulk) {
        await axiosInstance.post("/students/bulk-change-section", { student_ids: selectedStudents.map((s) => s.id), section_id: sectionId, remarks: remarks || undefined });
        notify.success(`${selectedStudents.length} students moved`);
      } else {
        await axiosInstance.patch(`/students/${student.id}/section`, { section_id: sectionId, remarks: remarks || undefined });
        notify.success("Section changed");
      }
      onSuccess?.(); onClose();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Change Section</h2>
        <p className="text-sm text-muted-foreground">
          Move {isBulk ? `${selectedStudents.length} students` : `${student?.first_name} ${student?.last_name}`} to a new section.
        </p>
        <F label="New Section">
          <select className={sel()} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select section…</option>
            {(sections || []).map((s) => (
              <option key={s.id} value={s.id}>
                {sectionOption(s)}
              </option>
            ))}
          </select>
        </F>
        <F label="Remarks (optional)">
          <input className={inp()} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
        </F>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={handle} disabled={!sectionId || loading}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filters panel ──────────────────────────────────────────────
function StudentFilters({ filters, onChange, sections, departments, programs, courses, onReset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "").length;
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const set = (k, v) => onChange((p) => ({ ...p, [k]: v || undefined }));
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-xs font-medium transition-colors ${activeCount > 0 ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:bg-muted"}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
        Filters
        {activeCount > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{activeCount}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-20 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-card pb-1">
              <p className="text-sm font-semibold">Filters</p>
              <button onClick={() => { onReset(); setOpen(false); }} className="text-xs text-primary hover:underline">Reset all</button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Structure</p>
              <select className={sel()} value={filters.dept_id || ""} onChange={(e) => set("dept_id", e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className={sel()} value={filters.program_id || ""} onChange={(e) => set("program_id", e.target.value)}>
                <option value="">All Programs</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className={sel()} value={filters.course_id || ""} onChange={(e) => set("course_id", e.target.value)}>
                <option value="">All Courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={sel()} value={filters.section_id || ""} onChange={(e) => set("section_id", e.target.value)}>
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {sectionOption(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrollment</p>
              <select className={sel()} value={filters.academic_year || ""} onChange={(e) => set("academic_year", e.target.value)}>
                <option value="">All Academic Years</option>
                {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className={sel()} value={filters.semester || ""} onChange={(e) => set("semester", e.target.value ? parseInt(e.target.value) : "")}>
                <option value="">All Semesters</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s} ({s % 2 === 1 ? "ODD" : "EVEN"})</option>)}
              </select>
              <select className={sel()} value={filters.status || ""} onChange={(e) => set("status", e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Batch Year (admission)</p>
                  <input className={inp()} type="number" placeholder="e.g. 2024" value={filters.batch_year || ""} onChange={(e) => set("batch_year", e.target.value)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Session</p>
                  <input className={inp()} placeholder="2025-2026" value={filters.session || ""} onChange={(e) => set("session", e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Batch (e.g. 2024-2028)</p>
                <select className={sel()} value={filters.batch || ""} onChange={(e) => set("batch", e.target.value)}>
                  <option value="">All Batches</option>
                  {[...new Set((sections || []).map((s) => s.batch).filter(Boolean))].sort().map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "none" }}>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal</p>
              <select className={sel()} value={filters.gender || ""} onChange={(e) => set("gender", e.target.value)}>
                <option value="">All Genders</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className={sel()} value={filters.is_hosteller ?? ""} onChange={(e) => set("is_hosteller", e.target.value)}>
                <option value="">Hosteller — Any</option>
                <option value="true">Hosteller Only</option>
                <option value="false">Day Scholars Only</option>
              </select>
              <select className={sel()} value={filters.is_using_transport ?? ""} onChange={(e) => set("is_using_transport", e.target.value)}>
                <option value="">Transport — Any</option>
                <option value="true">Using Transport</option>
                <option value="false">Not Using Transport</option>
              </select>
              <select className={sel()} value={filters.isBlocked ?? ""} onChange={(e) => set("isBlocked", e.target.value)}>
                <option value="">Account — Any</option>
                <option value="false">Active Accounts</option>
                <option value="true">Blocked Accounts</option>
              </select>
            </div>

            <button onClick={() => setOpen(false)} className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
              Apply Filters
            </button>
          </div>
        </>
      )
      }
    </div >
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
      {label}<button onClick={onRemove} className="hover:opacity-70">×</button>
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[8, 18, 32, 22, 18, 18, 12, 8].map((w, i) => (
        <td key={i} className="px-4 py-3.5"><div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} /></td>
      ))}
    </tr>
  );
}

// ── Bulk Upload Tab ────────────────────────────────────────────
function BulkUploadTab({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  const downloadTemplate = async () => {
    try {
      const res = await axiosInstance.get("/students/template", { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = "student_template.xlsx"; a.click();
    } catch { notify.error("Failed to download template"); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setResults(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await axiosInstance.post("/students/bulk-upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const d = res.data.data;
      setResults(d);
      notify.success(`${d.created?.length ?? 0} students created, ${d.failed?.length ?? 0} failed`);
      if (d.created?.length) onSuccess?.();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Bulk Add Students</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download template → fill data → upload. One sheet per section, section_id is pre-filled.
          </p>
        </div>
        <button onClick={downloadTemplate}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
          Download Template
        </button>
      </div>
      <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold">How it works</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>Template has one sheet per section named with course + section + semester</li>
          <li>Each sheet has <code className="bg-card px-1 rounded">section_id</code>, <code className="bg-card px-1 rounded">academic_year</code>, <code className="bg-card px-1 rounded">semester</code> already filled</li>
          <li>Just fill in student data — email, name, roll number, phone, parents, etc.</li>
          <li>Upload the whole workbook — all sheets are processed automatically</li>
          <li>Required: email, first_name, last_name, roll_number, contact_number, father_name, mother_name</li>
        </ul>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.name.match(/\.xlsx?$/)) setFile(f); else notify.error("Only .xlsx files"); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : file ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
        <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
        {file ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); setResults(null); }} className="text-xs text-destructive hover:underline">Remove</button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-foreground">Drag & drop or click to browse</p>
            <p className="text-xs text-muted-foreground">.xlsx only</p>
          </div>
        )}
      </div>
      {file && !results && (
        <button onClick={handleUpload} disabled={uploading}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Uploading…</> : "Upload & Create Students"}
        </button>
      )}
      {results && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{results.created?.length ?? 0}</p>
              <p className="text-xs text-green-600 font-medium mt-0.5">Created</p>
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{results.failed?.length ?? 0}</p>
              <p className="text-xs text-red-600 font-medium mt-0.5">Failed</p>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
              <p className="text-2xl font-bold">{results.total ?? 0}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Total Rows</p>
            </div>
          </div>
          {/* Created list */}
          {results.created?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">✓ Successfully Created ({results.created.length})</p>
              <div className="max-h-36 overflow-y-auto space-y-0.5">
                {results.created.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                    <span className="font-mono opacity-60">{s.row}</span>
                    <span className="font-medium">{s.name}</span>
                    <span className="opacity-70">· {s.roll_number || s.roll_no}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Failures with reasons */}
          {results.failed?.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">✗ Failed ({results.failed.length})</p>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {results.failed.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 bg-red-100/50 dark:bg-red-950/30 rounded-lg">
                    <span className="font-mono text-red-500 shrink-0">{f.row}</span>
                    <div className="min-w-0">
                      {f.email && <span className="text-red-700 dark:text-red-400 mr-1">({f.email})</span>}
                      <span className="text-red-600 dark:text-red-400">— {f.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => { setFile(null); setResults(null); }}
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function StudentsPage() {
  const dispatch = useDispatch();
  const { items: students, pagination, loading } = useSelector((s) => s.student);
  const sections = useSelector((s) => s.academic?.sections?.list ?? []);
  const departments = useSelector((s) => s.academic?.departments?.list ?? []);
  const programs = useSelector((s) => s.academic?.programs?.list ?? []);
  const courses = useSelector((s) => s.academic?.courses?.list ?? []);

  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [checkedIds, setCheckedIds] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [bulkPromoteOpen, setBulkPromoteOpen] = useState(false);
  const [changeSectionOpen, setChangeSectionOpen] = useState(false);
  const [bulkSectionOpen, setBulkSectionOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const searchTO = useRef(null);
  const [limit, setLimit] = useState(20);

  const checkedStudents = (students || []).filter((s) => checkedIds.includes(s.id));
  const totalPages = pagination?.totalPages || pagination?.pages || 1;
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "").length;

  const getEnrollment = (s) => s.enrollments?.find((e) => e.is_current) || s.studentEnrollments?.find((e) => e.is_current);

  const load = () => {
    const params = { page, limit };
    if (search) params.search = search;
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params[k] = v; });
    dispatch(getStudents(params));
  };

  useEffect(() => { load(); }, [page, limit, search, filters]);
  useEffect(() => {
    if (!sections.length) dispatch(fetchSections({ limit: 500 }));
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
    if (!programs.length) dispatch(fetchPrograms({ limit: 200 }));
    if (!courses.length) dispatch(fetchCourses({ limit: 200 }));
  }, []);

  const handleSearch = (v) => {
    clearTimeout(searchTO.current);
    searchTO.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const handleCreate = async (data) => { const r = await dispatch(createStudent(data)); if (!r.error) { setCreateOpen(false); load(); } else notify.error(r.payload); };
  const handleEdit = async (data) => { const r = await dispatch(updateStudent({ id: selected.id, data })); if (!r.error) { setEditOpen(false); setSelected(null); load(); } else notify.error(r.payload); };
  const handleDelete = async () => { const r = await dispatch(deleteStudent(selected.id)); if (!r.error) { setDeleteOpen(false); setSelected(null); load(); } };
  const handleToggleBlock = async (s) => { await dispatch(toggleStudentBlock({ id: s.id, isBlocked: !s.user?.isBlocked })); load(); };

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    let ok = 0;
    for (const id of checkedIds) { const r = await dispatch(deleteStudent(id)); if (!r.error) ok++; }
    setBulkDeleteLoading(false); setBulkDeleteOpen(false); setCheckedIds([]);
    notify.success(`Deleted ${ok} of ${checkedIds.length} students`); load();
  };

  const toggleCheck = (id) => setCheckedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll = () => setCheckedIds(checkedIds.length === (students || []).length ? [] : (students || []).map((s) => s.id));

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {["👥 Students", "📤 Bulk Upload"].map((label, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 1 && <BulkUploadTab onSuccess={() => { load(); setActiveTab(0); }} />}

      {activeTab === 0 && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">Students</h1>
              <p className="text-sm text-muted-foreground">{pagination?.total ?? 0} students · {pagination?.pages ?? 1} pages</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {checkedIds.length > 0 && (
                <button onClick={() => setBulkSectionOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/30 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>
                  Move Section ({checkedIds.length})
                </button>
              )}
              <BulkActionsMenu
                checkedIds={checkedIds}
                onSuccess={load}
                onClearSelection={() => setCheckedIds([])}
              />
              <button onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Add Student
              </button>
            </div>
          </div>

          {/* Search + filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input type="text" placeholder="Search name, roll, email, group…" onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <StudentFilters
              filters={filters}
              onChange={(f) => { setFilters(f); setPage(1); }}
              sections={sections} departments={departments} programs={programs} courses={courses}
              onReset={() => { setFilters({}); setPage(1); }}
            />
            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filters.dept_id && <Chip label={departments.find((d) => d.id === filters.dept_id)?.name || "Dept"} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.dept_id; return n; })} />}
                {filters.program_id && <Chip label={programs.find((p) => p.id === filters.program_id)?.name || "Program"} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.program_id; return n; })} />}
                {filters.course_id && <Chip label={courses.find((c) => c.id === filters.course_id)?.name || "Course"} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.course_id; return n; })} />}
                {filters.section_id && (
                  <Chip
                    label={fmtSection(
                      sections.find((s) => s.id === filters.section_id),
                      "short"
                    )}
                    onRemove={() =>
                      setFilters((f) => {
                        const n = { ...f };
                        delete n.section_id;
                        return n;
                      })
                    }
                  />
                )}{filters.section_id && (
                  <Chip
                    label={fmtSection(
                      sections.find((s) => s.id === filters.section_id),
                      "short"
                    )}
                    onRemove={() =>
                      setFilters((f) => {
                        const n = { ...f };
                        delete n.section_id;
                        return n;
                      })
                    }
                  />
                )}
                {filters.status && <Chip label={filters.status} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.status; return n; })} />}
                {filters.gender && <Chip label={filters.gender} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.gender; return n; })} />}
                {filters.semester && <Chip label={`Sem ${filters.semester}`} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.semester; return n; })} />}
                {filters.academic_year && <Chip label={filters.academic_year} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.academic_year; return n; })} />}
                {filters.batch_year && <Chip label={`Batch ${filters.batch_year}`} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.batch_year; return n; })} />}
                {filters.batch && <Chip label={filters.batch} onRemove={() => setFilters((f) => { const n = { ...f }; delete n.batch; return n; })} />}
              </div>
            )}
            {checkedIds.length > 0 && (
              <span className="text-xs font-medium text-primary ml-auto">
                {checkedIds.length} selected
                <button onClick={() => setCheckedIds([])} className="ml-2 text-muted-foreground hover:text-foreground">✕</button>
              </span>
            )}
            {checkedIds.length === 0 && pagination && (
              <span className="text-xs text-muted-foreground ml-auto">{pagination.total} students</span>
            )}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={checkedIds.length === (students || []).length && (students || []).length > 0} onChange={toggleAll} className="rounded" />
                    </th>
                    {["#", "Roll No", "Name", "Group", "Section", "Dept", "Enrollment", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                    : (students || []).length === 0
                      ? <tr><td colSpan={10} className="text-center py-16 text-sm text-muted-foreground">
                        {activeFilterCount > 0 ? "No students match these filters" : "No students yet"}
                      </td></tr>
                      : (students || []).map((s, idx) => {
                        const enr = getEnrollment(s);
                        const blocked = s.user?.isBlocked;
                        const isSel = checkedIds.includes(s.id);
                        const rollNo = s.roll_no || s.roll_number;
                        return (
                          <tr key={s.id} onClick={() => { setSelected(s); setDetailOpen(true); }}
                            className={`border-b border-border last:border-0 transition-colors group cursor-pointer ${isSel ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={isSel} onChange={() => toggleCheck(s.id)} className="rounded" />
                            </td>
                            <td className="px-3 py-3 text-xs text-muted-foreground">{(page - 1) * limit + idx + 1}</td>
                            <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{rollNo}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                  {s.first_name?.[0] || "S"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate flex items-center gap-1.5">
                                    {s.first_name} {s.last_name}
                                    {blocked && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium shrink-0">Blocked</span>}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{s.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-muted-foreground">{s.group_no || "—"}</td>
                            <td className="px-3 py-3 text-xs">
                              <p className="font-medium text-foreground">
                                {[s.section?.course?.program?.name, s.section?.course?.name].filter(Boolean).join(" › ")}
                                {" › "}<span className="text-primary">{fmtSection(s.section, "short")}</span>
                              </p>
                              <p className="text-muted-foreground">Sem {s.section?.semester} · {s.section?.batch || s.batch_year || "—"}</p>
                            </td>
                            <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-[120px]">{s.department?.name || "—"}</td>
                            <td className="px-3 py-3">
                              {enr ? (
                                <div className="text-xs">
                                  <span className="font-medium text-foreground">{enr.academic_year}</span>
                                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${enr.semester % 2 === 1 ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"}`}>
                                    Sem {enr.semester}
                                  </span>
                                </div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              {enr && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${enr.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  enr.status === "DETAINED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                    enr.status === "PASSED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                  }`}>{enr.status}</span>
                              )}
                            </td>
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                {/* Edit */}
                                <button onClick={() => { setSelected(s); setEditOpen(true); }} title="Edit"
                                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                                {/* Promote */}
                                <button onClick={() => { setSelected(s); setPromoteOpen(true); }} title="Promote to next semester"
                                  className="h-7 w-7 rounded-md hover:bg-green-100 dark:hover:bg-green-950/30 flex items-center justify-center text-muted-foreground hover:text-green-600">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                                </button>
                                {/* Change section */}
                                <button onClick={() => { setSelected(s); setChangeSectionOpen(true); }} title="Change section"
                                  className="h-7 w-7 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950/30 flex items-center justify-center text-muted-foreground hover:text-blue-600">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>
                                </button>
                                {/* Block/Unblock */}
                                <button onClick={() => handleToggleBlock(s)} title={blocked ? "Unblock" : "Block"}
                                  className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${blocked ? "hover:bg-green-100 text-green-600" : "hover:bg-orange-100 text-muted-foreground hover:text-orange-600"}`}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {blocked ? <><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></> : <><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></>}
                                  </svg>
                                </button>
                                {/* Delete */}
                                <button onClick={() => { setSelected(s); setDeleteOpen(true); }} title="Delete"
                                  className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                                </button>
                                {/* Admin: Reset password + Login as */}
                                <AdminUserActions
                                  userId={s.user_id}
                                  userEmail={s.user?.email}
                                  userRole="STUDENT"
                                  userName={s.name}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {pagination?.total ?? 0} students · Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Show:</span>
                  {[10, 20, 50, 100].map((n) => (
                    <button key={n} onClick={() => { setLimit(n); setPage(1); }}
                      className={`h-6 px-2 rounded text-xs font-medium transition-colors ${limit === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex gap-1">
                  {[["«", () => setPage(1), page === 1], ["‹", () => setPage((p) => Math.max(1, p - 1)), page === 1],
                  ["›", () => setPage((p) => Math.min(totalPages, p + 1)), page === totalPages], ["»", () => setPage(totalPages), page === totalPages]]
                    .map(([l, a, d], i) => (
                      <button key={i} onClick={a} disabled={d}
                        className="h-8 w-8 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">{l}</button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      <CreateStudentModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} loading={loading} sections={sections} />
      <EditStudentModal open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} onSubmit={handleEdit} initialData={selected} loading={loading} />
      <StudentDetailModal open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); }} student={selected} />

      <PromoteModal open={promoteOpen} student={selected}
        onClose={() => { setPromoteOpen(false); setSelected(null); }} onSuccess={load} />

      {/* BulkPromoteModal moved into BulkActionsMenu */}

      <ChangeSectionModal open={changeSectionOpen} student={selected} sections={sections}
        onClose={() => { setChangeSectionOpen(false); setSelected(null); }} onSuccess={load} />
      <ChangeSectionModal open={bulkSectionOpen} selectedStudents={checkedStudents} sections={sections}
        onClose={() => { setBulkSectionOpen(false); setCheckedIds([]); }} onSuccess={() => { load(); setCheckedIds([]); }} />

      {/* Bulk delete confirm */}
      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBulkDeleteOpen(false)} />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-center">Delete {checkedIds.length} Students?</h2>
            <p className="text-sm text-muted-foreground text-center mt-2">This permanently deletes their accounts. Cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setBulkDeleteOpen(false)} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkDeleteLoading}
                className="flex-1 h-10 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {bulkDeleteLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single delete confirm */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-center">Delete Student</h2>
            <p className="text-sm text-muted-foreground text-center mt-2">Delete <span className="font-medium text-foreground">{selected?.first_name} {selected?.last_name}</span>? This also deletes their login account.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteOpen(false)} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleDelete} disabled={loading}
                className="flex-1 h-10 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Student pages for student-facing routes ────────────────────
export function StudentEnrollmentPage() {
  const { user } = useSelector((s) => s.auth);
  const student = user?.students || user?.student;
  const enrollments = student?.enrollments || student?.studentEnrollments || [];
  const sectionSubjects = student?.section?.sectionSubjects || [];
  const current = enrollments.find((e) => e.is_current);
  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold">My Enrollment</h1><p className="text-sm text-muted-foreground mt-1">Your academic profile and enrollment history</p></div>
      {current && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Current Enrollment</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><p className="text-xl font-bold">{current.academic_year}</p><p className="text-sm text-muted-foreground">Semester {current.semester} · Section {current.section?.name}</p></div>
            <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">{current.status}</span>
          </div>
        </div>
      )}
      {student && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Profile</p>
          <div className="grid grid-cols-2 gap-3">
            {[["Roll Number", student.roll_no || student.roll_number], ["Enrollment No", student.enrollment_no],
            ["Department", student.department?.name], ["Program", student.program?.name],
            ["Course", student.course?.name], ["Section", student.section?.name],
            ["Group / House", student.group_no]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium">{v}</p></div>
            ))}
          </div>
        </div>
      )}
      {sectionSubjects.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Subjects</p>
          <div className="space-y-2">
            {sectionSubjects.map((ss) => (
              <div key={ss.subject?.id} className="flex justify-between px-3 py-2.5 bg-muted/40 rounded-xl border border-border">
                <p className="text-sm font-medium">{ss.subject?.name} <span className="text-xs font-mono text-muted-foreground">{ss.subject?.code}</span></p>
                <p className="text-xs text-muted-foreground">{ss.faculty?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><p className="text-sm font-semibold">Enrollment History</p></div>
        {enrollments.length === 0
          ? <div className="text-center py-12 text-sm text-muted-foreground">No enrollment records</div>
          : <div className="divide-y divide-border">
            {enrollments.map((e, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div><p className="text-sm font-medium">{e.academic_year} · Semester {e.semester}</p><p className="text-xs text-muted-foreground">{e.section?.name}</p></div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.is_current ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{e.is_current ? "Current" : e.status}</span>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}

export function StudentFeedbackPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { myForms: activeForms = [], loading } = useSelector((s) => s.feedbackNew ?? {});
  const [activeForm, setActiveForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(new Set());

  const studentId = user?.student?.id || user?.students?.id;
  useEffect(() => { if (studentId) dispatch(fetchMyForms()); }, [studentId]);

  const setAnswer = (qid, type, val) => setAnswers((p) => ({
    ...p, [qid]: { question_id: qid, ...(type === "TEXT" ? { answer_text: val } : type === "RATING" ? { rating: Number(val) } : { selected: val }) }
  }));

  const handleSubmit = async () => {
    setSubmitting(true);
    const r = await dispatch(submitFeedback({ form_id: activeForm.id, student_id: studentId, answers: Object.values(answers) }));
    setSubmitting(false);
    if (!r.error) { setSubmitted((p) => new Set([...p, activeForm.id])); setActiveForm(null); dispatch(fetchMyForms()); }
  };

  if (activeForm) return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => { setActiveForm(null); setAnswers({}); }} className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">{activeForm.title}</h1>
          {activeForm.faculty && <p className="text-sm text-muted-foreground">Faculty: {activeForm.faculty.name}{activeForm.subject ? ` · ${activeForm.subject.name}` : ""}</p>}
        </div>
      </div>
      <div className="space-y-5">
        {(activeForm.category?.questions || []).map((q, idx) => (
          <div key={q.id} className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm font-medium mb-4"><span className="text-muted-foreground mr-2">Q{idx + 1}.</span>{q.question}{q.is_required && <span className="text-destructive ml-1">*</span>}</p>
            {q.type === "TEXT" && <textarea rows={3} value={answers[q.id]?.answer_text || ""} onChange={(e) => setAnswer(q.id, "TEXT", e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />}
            {q.type === "RATING" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setAnswer(q.id, "RATING", n)}
                    className={`w-11 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${answers[q.id]?.rating === n ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}>{n}</button>
                ))}
              </div>
            )}
            {q.type === "MCQ" && (
              <div className="space-y-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${answers[q.id]?.selected === opt ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                    <input type="radio" name={q.id} value={opt} checked={answers[q.id]?.selected === opt} onChange={() => setAnswer(q.id, "MCQ", opt)} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${answers[q.id]?.selected === opt ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {answers[q.id]?.selected === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
        Submit Feedback
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold">Feedback</h1><p className="text-sm text-muted-foreground mt-1">Submit feedback for your courses and faculty</p></div>
      {!loading && activeForms.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <div className="text-4xl mb-3">💬</div>
          <p className="font-medium">No active feedback forms</p>
          <p className="text-sm text-muted-foreground mt-1">Check back later</p>
        </div>
      )}
      <div className="space-y-3">
        {activeForms.map((form) => {
          const done = form.already_submitted || submitted.has(form.id);
          return (
            <div key={form.id} className={`bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 ${done ? "opacity-70" : ""}`}>
              <div>
                <p className="font-semibold">{form.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  {form.faculty && <span>👤 {form.faculty.name}</span>}
                  {form.subject && <span>· {form.subject.name}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Deadline: {new Date(form.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
              {done
                ? <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-700 shrink-0">✓ Submitted</span>
                : <button onClick={() => { setActiveForm(form); setAnswers({}); }} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 shrink-0">Fill Now →</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}