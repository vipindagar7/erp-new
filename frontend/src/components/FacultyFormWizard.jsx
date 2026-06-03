import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createFaculty, updateFaculty } from "../redux/faculty/facultySlice.js";
import { fetchDepartments } from "../redux/academic/academicSlice.js";
import { cn } from "../lib/utils.js";
import { StepIndicator, Field, Grid2, Grid3, StepSection, ReviewRow } from "../components/StepWizard.jsx";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import { notify } from "../hooks/notify.js";

// ── Constants ──────────────────────────────────────────────────
const GENDERS       = ["MALE","FEMALE","OTHER"];
const CATEGORIES    = ["GENERAL","OBC","SC","ST","EWS","OTHER"];
const RELIGIONS     = ["HINDU","MUSLIM","CHRISTIAN","SIKH","BUDDHIST","JAIN","OTHER"];
const EMP_TYPES     = ["PERMANENT","CONTRACT","VISITING","ADJUNCT","OTHER"];
const FAC_STATUSES  = ["ACTIVE","INACTIVE","ON_LEAVE","RESIGNED"];
const DESIGNATIONS  = [
  "Professor","Associate Professor","Assistant Professor",
  "Senior Lecturer","Lecturer","Lab Instructor","HOD","Director","Other"
];

const STEPS = [
  { label: "Account"      },
  { label: "Identity"     },
  { label: "Personal"     },
  { label: "Professional" },
  { label: "Review"       },
];

// ── Blank form ─────────────────────────────────────────────────
const BLANK = {
  // Step 1 — Account
  email: "", password: "Faculty@123",
  // Step 2 — Identity
  emp_id: "", nick_name: "", first_name: "", last_name: "", full_name: "",
  employee_type: "none",
  // Step 3 — Personal
  dob: "", gender: "none", mobile: "", personal_email: "",
  aadhar_no: "", pan_no: "", religion: "none", category: "none",
  // Step 4 — Professional
  designation: "none", dept_id: "none", joining_date: "",
  status: "ACTIVE",
};

const fromFaculty = (f) => ({
  email:         f.user?.email        || "",
  password:      "",
  emp_id:        f.emp_id             || "",
  nick_name:     f.nick_name          || "",
  first_name:    f.first_name         || "",
  last_name:     f.last_name          || "",
  full_name:     f.name               || "",
  employee_type: f.employee_type      || "none",
  dob:           f.dob ? new Date(f.dob).toISOString().split("T")[0] : "",
  gender:        f.gender             || "none",
  mobile:        f.phone              || "",
  personal_email:f.personal_email     || "",
  aadhar_no:     f.aadhar_no          || "",
  pan_no:        f.pan_no             || "",
  religion:      f.religion           || "none",
  category:      f.category           || "none",
  designation:   f.designation        || "none",
  dept_id:       f.dept_id            || f.department?.id || "none",
  joining_date:  f.joining_date ? new Date(f.joining_date).toISOString().split("T")[0] : "",
  status:        f.status             || "ACTIVE",
});

// ── Step 1 — Account ────────────────────────────────────────────
function Step1Account({ form, set, isEdit }) {
  return (
    <div className="space-y-5">
      <StepSection title="Login Credentials" />
      <Grid2>
        <Field label="Email Address" required={!isEdit}>
          <Input className="h-9 text-sm" type="email" value={form.email}
            onChange={set("email")} placeholder="faculty@college.edu"
            disabled={isEdit} />
          {isEdit && <p className="text-xs text-muted-foreground">Email cannot be changed.</p>}
        </Field>
        {!isEdit && (
          <Field label="Password" hint="Default: Faculty@123">
            <Input className="h-9 text-sm" value={form.password}
              onChange={set("password")} placeholder="Min 6 characters" />
          </Field>
        )}
      </Grid2>
    </div>
  );
}

// ── Step 2 — Identity ───────────────────────────────────────────
function Step2Identity({ form, set, setV, isEdit }) {
  // Auto-build full name from first + last
  const autoFull = `${form.first_name} ${form.last_name}`.trim();
  const displayFull = form.full_name || autoFull;

  return (
    <div className="space-y-5">
      <StepSection title="Name" />
      <Grid2>
        <Field label="First Name" required>
          <Input className="h-9 text-sm" value={form.first_name} onChange={set("first_name")} placeholder="John" />
        </Field>
        <Field label="Last Name" required>
          <Input className="h-9 text-sm" value={form.last_name} onChange={set("last_name")} placeholder="Doe" />
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Nick Name" hint="Friendly name / short name">
          <Input className="h-9 text-sm" value={form.nick_name} onChange={set("nick_name")} placeholder="Johnny" />
        </Field>
        <Field label="Full Name / Display Name" hint="Auto-built from first + last name">
          <Input className="h-9 text-sm" value={form.full_name || autoFull}
            onChange={set("full_name")} placeholder={autoFull || "Dr. John Doe"} />
        </Field>
      </Grid2>
      {displayFull && (
        <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-muted-foreground">
          Will be displayed as: <span className="font-medium text-foreground">{displayFull}</span>
        </div>
      )}

      <StepSection title="Employment" />
      <Grid2>
        <Field label="Employee ID" hint="Unique emp ID">
          <Input className="h-9 text-sm font-mono" value={form.emp_id} onChange={set("emp_id")} placeholder="EMP001" />
        </Field>
        <Field label="Employee Type">
          <Select value={form.employee_type} onValueChange={setV("employee_type")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {EMP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Grid2>
      {isEdit && (
        <Field label="Faculty ID" hint="System generated">
          <Input className="h-9 text-sm font-mono bg-muted" value={form.faculty_id || ""} disabled />
        </Field>
      )}
    </div>
  );
}

// ── Step 3 — Personal ───────────────────────────────────────────
function Step3Personal({ form, set, setV }) {
  return (
    <div className="space-y-5">
      <StepSection title="Basic Info" />
      <Grid3>
        <Field label="Date of Birth">
          <Input className="h-9 text-sm" type="date" value={form.dob} onChange={set("dob")} />
        </Field>
        <Field label="Gender">
          <Select value={form.gender} onValueChange={setV("gender")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Religion">
          <Select value={form.religion} onValueChange={setV("religion")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {RELIGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Grid3>
      <Grid2>
        <Field label="Category">
          <Select value={form.category} onValueChange={setV("category")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Mobile No">
          <Input className="h-9 text-sm" value={form.mobile} onChange={set("mobile")} placeholder="9876543210" />
        </Field>
      </Grid2>

      <StepSection title="Email" />
      <Grid2>
        <Field label="Personal Email">
          <Input className="h-9 text-sm" type="email" value={form.personal_email}
            onChange={set("personal_email")} placeholder="john@gmail.com" />
        </Field>
      </Grid2>

      <StepSection title="ID Documents" />
      <Grid2>
        <Field label="Aadhar Card No">
          <Input className="h-9 text-sm font-mono" value={form.aadhar_no}
            onChange={set("aadhar_no")} placeholder="XXXX XXXX XXXX" maxLength={14} />
        </Field>
        <Field label="PAN Card No">
          <Input className="h-9 text-sm font-mono uppercase" value={form.pan_no}
            onChange={(e) => set("pan_no")({ target: { value: e.target.value.toUpperCase() } })}
            placeholder="ABCDE1234F" maxLength={10} />
        </Field>
      </Grid2>
    </div>
  );
}

// ── Step 4 — Professional ───────────────────────────────────────
function Step4Professional({ form, set, setV, departments }) {
  return (
    <div className="space-y-5">
      <StepSection title="Role" />
      <Grid2>
        <Field label="Designation">
          <Select value={form.designation} onValueChange={setV("designation")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Department">
          <Select value={form.dept_id} onValueChange={setV("dept_id")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No department</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Grid2>
      <Grid2>
        <Field label="Joining Date">
          <Input className="h-9 text-sm" type="date" value={form.joining_date}
            onChange={set("joining_date")} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={setV("status")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FAC_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Grid2>
    </div>
  );
}

// ── Step 5 — Review ─────────────────────────────────────────────
function Step5Review({ form, departments, isEdit }) {
  const dept  = departments.find((d) => d.id === form.dept_id);
  const clean = (v) => (v && v !== "none" ? v : null);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
        <CheckCircle size={16} className="text-green-600 shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-400">
          Review all details before {isEdit ? "updating" : "creating"} the faculty member.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Account</p>
          <ReviewRow label="Email"    value={form.email} />
          {!isEdit && <ReviewRow label="Password" value="••••••••" />}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identity</p>
          <ReviewRow label="Full Name"     value={form.full_name || `${form.first_name} ${form.last_name}`.trim()} />
          <ReviewRow label="Nick Name"     value={form.nick_name} />
          <ReviewRow label="Emp ID"        value={form.emp_id} />
          <ReviewRow label="Employee Type" value={clean(form.employee_type)} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Personal</p>
          <ReviewRow label="Date of Birth"  value={form.dob} />
          <ReviewRow label="Gender"         value={clean(form.gender)} />
          <ReviewRow label="Mobile"         value={form.mobile} />
          <ReviewRow label="Personal Email" value={form.personal_email} />
          <ReviewRow label="Religion"       value={clean(form.religion)} />
          <ReviewRow label="Category"       value={clean(form.category)} />
          <ReviewRow label="Aadhar No"      value={form.aadhar_no} />
          <ReviewRow label="PAN No"         value={form.pan_no} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Professional</p>
          <ReviewRow label="Designation"  value={clean(form.designation)} />
          <ReviewRow label="Department"   value={dept?.name} />
          <ReviewRow label="Joining Date" value={form.joining_date} />
          <ReviewRow label="Status"       value={form.status?.replace("_", " ")} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN WIZARD
// ══════════════════════════════════════════════════════════════
export default function FacultyFormWizard({ open, onClose, initialData, onSuccess }) {
  const dispatch   = useDispatch();
  const { actionLoading } = useSelector((s) => s.faculty ?? {});
  const { list: departments } = useSelector((s) => s.academic?.departments ?? { list: [] });
  const isEdit = !!initialData;

  const [step,   setStep]   = useState(0);
  const [form,   setForm]   = useState(BLANK);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    setForm(isEdit ? fromFaculty(initialData) : BLANK);
  }, [open, initialData]);

  useEffect(() => {
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
  }, []);

  const set  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (s) => {
    const errs = {};
    if (s === 0 && !isEdit) {
      if (!form.email.trim()) errs.email = "Email required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
      if (!form.password || form.password.length < 6)       errs.password = "Min 6 characters";
    }
    if (s === 1) {
      if (!form.first_name.trim() && !(form.full_name.trim()))
        errs.name = "At least first name or full name required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (!validate(step)) return; setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const buildPayload = () => {
    const clean = (v) => (v && v !== "none" ? v : undefined);
    const name  = form.full_name.trim() || `${form.first_name} ${form.last_name}`.trim();
    return {
      ...(!isEdit && { email: form.email, password: form.password }),
      name,
      first_name:    form.first_name    || undefined,
      last_name:     form.last_name     || undefined,
      nick_name:     form.nick_name     || undefined,
      emp_id:        form.emp_id        || undefined,
      employee_type: clean(form.employee_type),
      dob:           form.dob           || undefined,
      gender:        clean(form.gender),
      phone:         form.mobile        || undefined,
      personal_email:form.personal_email || undefined,
      aadhar_no:     form.aadhar_no     || undefined,
      pan_no:        form.pan_no        || undefined,
      religion:      clean(form.religion),
      category:      clean(form.category),
      designation:   clean(form.designation),
      dept_id:       clean(form.dept_id),
      joining_date:  form.joining_date  || undefined,
      status:        form.status        || "ACTIVE",
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    let r;
    if (isEdit) {
      r = await dispatch(updateFaculty({ id: initialData.id, data: payload }));
      if (updateFaculty.fulfilled.match(r)) { notify.success("Faculty updated"); onSuccess?.(); onClose(); }
      else notify.error(r.payload);
    } else {
      r = await dispatch(createFaculty(payload));
      if (createFaculty.fulfilled.match(r)) { notify.success("Faculty created"); onSuccess?.(); onClose(); }
      else notify.error(r.payload);
    }
  };

  if (!open) return null;
  const isLast = step === STEPS.length - 1;

  const stepContent = [
    <Step1Account      key={0} form={form} set={set} isEdit={isEdit} />,
    <Step2Identity     key={1} form={form} set={set} setV={setV} isEdit={isEdit} />,
    <Step3Personal     key={2} form={form} set={set} setV={setV} />,
    <Step4Professional key={3} form={form} set={set} setV={setV} departments={departments} />,
    <Step5Review       key={4} form={form} departments={departments} isEdit={isEdit} />,
  ];

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {isEdit ? `Edit Faculty — ${initialData?.name}` : "Add New Faculty"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StepIndicator steps={STEPS} current={step} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {stepContent[step]}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl space-y-1">
              {Object.values(errors).map((e, i) => (
                <p key={i} className="text-xs text-destructive">• {e}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={step === 0 ? onClose : handleBack} className="min-w-[90px]">
              {step === 0 ? "Cancel" : <><ChevronLeft size={14} className="mr-1" />Back</>}
            </Button>
            {isLast ? (
              <Button onClick={handleSubmit} disabled={actionLoading} className="min-w-[130px]">
                {actionLoading
                  ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>
                  : <><CheckCircle size={14} className="mr-1.5" />{isEdit ? "Update Faculty" : "Create Faculty"}</>}
              </Button>
            ) : (
              <Button onClick={handleNext} className="min-w-[90px]">
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
