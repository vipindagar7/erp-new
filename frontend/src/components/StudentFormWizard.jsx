import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createStudent, updateStudent } from "../redux/student/studentSlice.js";
import { fetchSections } from "../redux/academic/academicSlice.js";

import { cn } from "../lib/utils.js";
import { StepIndicator, Field, Grid2, Grid3, StepSection, ReviewRow } from "../components/StepWizard.jsx";
import SectionSelector from "../components/student/SectionSelector.jsx";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2, User, BookOpen, FileText, GraduationCap, CheckCircle } from "lucide-react";
import { notify } from "../hooks/notify.js";

// ── Constants ──────────────────────────────────────────────────
const GENDERS     = ["MALE","FEMALE","OTHER"];
const CATEGORIES  = ["GENERAL","OBC","SC","ST","EWS","OTHER"];
const RELIGIONS   = ["HINDU","MUSLIM","CHRISTIAN","SIKH","BUDDHIST","JAIN","OTHER"];
const ADMISSIONS  = ["REGULAR","LATERAL","MANAGEMENT","NRI","OTHER"];
const SEMESTERS   = [1,2,3,4,5,6,7,8];
const YEARS       = [1,2,3,4];
const GROUPS      = ["A","B","C","D","Science","Commerce","Arts","Other"];

const STEPS = [
  { label: "Account"  },
  { label: "Identity" },
  { label: "Personal" },
  { label: "Academic" },
  { label: "Review"   },
];

// ── Blank form ─────────────────────────────────────────────────
const BLANK = {
  // Step 1 — Account
  email: "", password: "Student@123",
  // Step 2 — Identity
  student_id: "", roll_no: "", enrollment_no: "",
  first_name: "", last_name: "",
  // Step 3 — Personal
  dob: "", gender: "none", mobile: "", personal_email: "",
  aadhar_no: "", pan_no: "", religion: "none", category: "none",
  father_name: "", mother_name: "", father_phone: "", mother_phone: "",
  address: "", city: "", state: "", pincode: "",
  // Step 4 — Academic
  mode_of_admission: "none", session: "", year: "none",
  semester: "none", section_id: "", group: "none",
  batch_year: "",
};

const fromStudent = (s) => ({
  email:            s.user?.email        || "",
  password:         "",
  student_id:       s.id                 || "",
  roll_no:          s.roll_no            || "",
  enrollment_no:    s.enrollment_no      || "",
  first_name:       s.first_name         || "",
  last_name:        s.last_name          || "",
  dob:              s.dob ? new Date(s.dob).toISOString().split("T")[0] : "",
  gender:           s.gender             || "none",
  mobile:           s.phone              || "",
  personal_email:   s.personal_email     || "",
  aadhar_no:        s.aadhar_no          || "",
  pan_no:           s.pan_no             || "",
  religion:         s.religion           || "none",
  category:         s.category           || "none",
  father_name:      s.father_name        || "",
  mother_name:      s.mother_name        || "",
  father_phone:     s.father_phone       || "",
  mother_phone:     s.mother_phone       || "",
  address:          s.address            || "",
  city:             s.city               || "",
  state:            s.state              || "",
  pincode:          s.pincode            || "",
  mode_of_admission:s.mode_of_admission  || "none",
  session:          s.session            || "",
  year:             String(s.admission_year || "none"),
  semester:         String(s.enrollments?.find((e) => e.is_current)?.semester || "none"),
  section_id:       s.section_id         || "",
  group:            s.group              || "none",
  batch_year:       String(s.batch_year  || ""),
});

// ── Step components ────────────────────────────────────────────
function Step1Account({ form, set, setV, isEdit }) {
  return (
    <div className="space-y-5">
      <StepSection title="Login Credentials" />
      <Grid2>
        <Field label="Email Address" required={!isEdit}>
          <Input className="h-9 text-sm" type="email" value={form.email}
            onChange={set("email")} placeholder="student@college.edu"
            disabled={isEdit} />
          {isEdit && <p className="text-xs text-muted-foreground">Email cannot be changed after creation.</p>}
        </Field>
        {!isEdit && (
          <Field label="Password" hint="Default: Student@123">
            <Input className="h-9 text-sm" type="text" value={form.password}
              onChange={set("password")} placeholder="Min 6 characters" />
          </Field>
        )}
      </Grid2>
    </div>
  );
}

function Step2Identity({ form, set, setV, isEdit }) {
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
      {form.first_name && form.last_name && (
        <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm text-muted-foreground">
          Full name: <span className="font-medium text-foreground">{form.first_name} {form.last_name}</span>
        </div>
      )}

      <StepSection title="ID Numbers" />
      <Grid3>
        <Field label="Roll No" hint="Leave blank if not assigned">
          <Input className="h-9 text-sm font-mono" value={form.roll_no} onChange={set("roll_no")} placeholder="CS001" />
        </Field>
        <Field label="Enrollment No" hint="Leave blank if not assigned">
          <Input className="h-9 text-sm font-mono" value={form.enrollment_no} onChange={set("enrollment_no")} placeholder="EN2024001" />
        </Field>
        {isEdit && (
          <Field label="Student ID" hint="System generated">
            <Input className="h-9 text-sm font-mono bg-muted" value={form.student_id} disabled />
          </Field>
        )}
      </Grid3>
    </div>
  );
}

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
        <Field label="Personal Email" hint="Personal / alternate email">
          <Input className="h-9 text-sm" type="email" value={form.personal_email} onChange={set("personal_email")} placeholder="john@gmail.com" />
        </Field>
      </Grid2>

      <StepSection title="ID Documents" />
      <Grid2>
        <Field label="Aadhar Card No">
          <Input className="h-9 text-sm font-mono" value={form.aadhar_no} onChange={set("aadhar_no")} placeholder="XXXX XXXX XXXX" maxLength={14} />
        </Field>
        <Field label="PAN Card No">
          <Input className="h-9 text-sm font-mono uppercase" value={form.pan_no} onChange={(e) => set("pan_no")({ target: { value: e.target.value.toUpperCase() } })} placeholder="ABCDE1234F" maxLength={10} />
        </Field>
      </Grid2>

      <StepSection title="Parents / Guardian" />
      <Grid2>
        <Field label="Father's Name">
          <Input className="h-9 text-sm" value={form.father_name} onChange={set("father_name")} />
        </Field>
        <Field label="Mother's Name">
          <Input className="h-9 text-sm" value={form.mother_name} onChange={set("mother_name")} />
        </Field>
        <Field label="Father's Mobile">
          <Input className="h-9 text-sm" value={form.father_phone} onChange={set("father_phone")} />
        </Field>
        <Field label="Mother's Mobile">
          <Input className="h-9 text-sm" value={form.mother_phone} onChange={set("mother_phone")} />
        </Field>
      </Grid2>

      <StepSection title="Address" />
      <Field label="Street Address">
        <Input className="h-9 text-sm" value={form.address} onChange={set("address")} placeholder="House / Flat / Street" />
      </Field>
      <Grid3>
        <Field label="City">
          <Input className="h-9 text-sm" value={form.city} onChange={set("city")} />
        </Field>
        <Field label="State">
          <Input className="h-9 text-sm" value={form.state} onChange={set("state")} />
        </Field>
        <Field label="Pincode">
          <Input className="h-9 text-sm font-mono" value={form.pincode} onChange={set("pincode")} maxLength={6} />
        </Field>
      </Grid3>
    </div>
  );
}

function Step4Academic({ form, set, setV, sections, isEdit }) {
  return (
    <div className="space-y-5">
      <StepSection title="Admission" />
      <Grid2>
        <Field label="Mode of Admission">
          <Select value={form.mode_of_admission} onValueChange={setV("mode_of_admission")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {ADMISSIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Session" hint="e.g. 2024-2025">
          <Input className="h-9 text-sm" value={form.session} onChange={set("session")} placeholder="2024-2025" />
        </Field>
        <Field label="Batch Year" hint="e.g. 2024">
          <Input className="h-9 text-sm" type="number" value={form.batch_year} onChange={set("batch_year")} placeholder="2024" />
        </Field>
        <Field label="Year">
          <Select value={form.year} onValueChange={setV("year")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select year</SelectItem>
              {YEARS.map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Grid2>

      <StepSection title="Class Details" />
      {!isEdit && (
        <Field label="Section" required>
          <SectionSelector sections={sections} value={form.section_id}
            onChange={setV("section_id")} placeholder="Select section…" />
          <p className="text-xs text-muted-foreground mt-1">
            Selecting a section auto-assigns course, program and department.
          </p>
        </Field>
      )}
      <Grid3>
        <Field label="Semester">
          <Select value={form.semester} onValueChange={setV("semester")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select semester</SelectItem>
              {SEMESTERS.map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Group">
          <Select value={form.group} onValueChange={setV("group")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not assigned</SelectItem>
              {GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Grid3>
    </div>
  );
}

function Step5Review({ form, sections, isEdit }) {
  const section = sections.find((s) => s.id === form.section_id);
  const clean   = (v) => (v && v !== "none" ? v : null);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
        <CheckCircle size={16} className="text-green-600 shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-400">
          Please review all details before {isEdit ? "updating" : "creating"} the student.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Account</p>
          <ReviewRow label="Email"       value={form.email} />
          {!isEdit && <ReviewRow label="Password" value="••••••••" />}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identity</p>
          <ReviewRow label="Full Name"     value={`${form.first_name} ${form.last_name}`.trim()} />
          <ReviewRow label="Roll No"       value={form.roll_no} />
          <ReviewRow label="Enrollment No" value={form.enrollment_no} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Personal</p>
          <ReviewRow label="Date of Birth"   value={form.dob} />
          <ReviewRow label="Gender"          value={clean(form.gender)} />
          <ReviewRow label="Mobile"          value={form.mobile} />
          <ReviewRow label="Personal Email"  value={form.personal_email} />
          <ReviewRow label="Religion"        value={clean(form.religion)} />
          <ReviewRow label="Category"        value={clean(form.category)} />
          <ReviewRow label="Aadhar No"       value={form.aadhar_no} />
          <ReviewRow label="PAN No"          value={form.pan_no} />
          <ReviewRow label="Father's Name"   value={form.father_name} />
          <ReviewRow label="Mother's Name"   value={form.mother_name} />
          <ReviewRow label="Address"         value={[form.address, form.city, form.state, form.pincode].filter(Boolean).join(", ")} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Academic</p>
          <ReviewRow label="Section"          value={section ? `${section.name} — ${section.course?.name} (Sem ${section.semester})` : form.section_id} />
          <ReviewRow label="Mode of Admission" value={clean(form.mode_of_admission)} />
          <ReviewRow label="Session"           value={form.session} />
          <ReviewRow label="Batch Year"        value={form.batch_year} />
          <ReviewRow label="Year"              value={clean(form.year) ? `Year ${clean(form.year)}` : null} />
          <ReviewRow label="Semester"          value={clean(form.semester) ? `Sem ${clean(form.semester)}` : null} />
          <ReviewRow label="Group"             value={clean(form.group)} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN WIZARD
// ══════════════════════════════════════════════════════════════
export default function StudentFormWizard({ open, onClose, initialData, onSuccess }) {
  const dispatch      = useDispatch();
  const { actionLoading } = useSelector((s) => s.students ?? {});
  const sections          = useSelector((s) => s.academic?.sections?.list ?? []);
  const isEdit            = !!initialData;

  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState(BLANK);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setErrors({});
    setForm(isEdit ? fromStudent(initialData) : BLANK);
  }, [open, initialData]);

  useEffect(() => {
    if (!sections.length) dispatch(fetchSections({ limit: 200 }));
  }, []);

  const set  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Validation per step ───────────────────────────────────
  const validate = (s) => {
    const errs = {};
    if (s === 0 && !isEdit) {
      if (!form.email.trim())     errs.email    = "Email required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
      if (!form.password || form.password.length < 6)     errs.password = "Min 6 characters";
    }
    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = "First name required";
      if (!form.last_name.trim())  errs.last_name  = "Last name required";
    }
    if (s === 3 && !isEdit) {
      if (!form.section_id) errs.section_id = "Section required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  // ── Build submit payload ──────────────────────────────────
  const buildPayload = () => {
    const clean = (v) => (v && v !== "none" ? v : undefined);
    return {
      ...(!isEdit && { email: form.email, password: form.password }),
      first_name:       form.first_name,
      last_name:        form.last_name,
      roll_no:          form.roll_no       || undefined,
      enrollment_no:    form.enrollment_no || undefined,
      dob:              form.dob           || undefined,
      gender:           clean(form.gender),
      phone:            form.mobile        || undefined,
      personal_email:   form.personal_email || undefined,
      aadhar_no:        form.aadhar_no     || undefined,
      pan_no:           form.pan_no        || undefined,
      religion:         clean(form.religion),
      category:         clean(form.category),
      father_name:      form.father_name   || undefined,
      mother_name:      form.mother_name   || undefined,
      father_phone:     form.father_phone  || undefined,
      mother_phone:     form.mother_phone  || undefined,
      address:          form.address       || undefined,
      city:             form.city          || undefined,
      state:            form.state         || undefined,
      pincode:          form.pincode       || undefined,
      mode_of_admission:clean(form.mode_of_admission),
      session:          form.session       || undefined,
      batch_year:       form.batch_year ? parseInt(form.batch_year) : undefined,
      admission_year:   clean(form.year) ? parseInt(form.year) : undefined,
      group:            clean(form.group),
      ...(!isEdit && { section_id: form.section_id }),
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    let r;
    if (isEdit) {
      r = await dispatch(updateStudent({ id: initialData.id, data: payload }));
      if (updateStudent.fulfilled.match(r)) {
        notify.success("Student updated"); onSuccess?.(); onClose();
      } else notify.error(r.payload);
    } else {
      r = await dispatch(createStudent(payload));
      if (createStudent.fulfilled.match(r)) {
        notify.success("Student created"); onSuccess?.(); onClose();
      } else notify.error(r.payload);
    }
  };

  if (!open) return null;

  const stepContent = [
    <Step1Account key={0} form={form} set={set} setV={setV} isEdit={isEdit} />,
    <Step2Identity key={1} form={form} set={set} setV={setV} isEdit={isEdit} />,
    <Step3Personal key={2} form={form} set={set} setV={setV} />,
    <Step4Academic key={3} form={form} set={set} setV={setV} sections={sections} isEdit={isEdit} />,
    <Step5Review   key={4} form={form} sections={sections} isEdit={isEdit} />,
  ];

  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {isEdit ? `Edit Student — ${initialData?.name}` : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StepIndicator steps={STEPS} current={step} />
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {stepContent[step]}

          {/* Inline errors */}
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
          <div className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={step === 0 ? onClose : handleBack} className="min-w-[90px]">
              {step === 0 ? "Cancel" : <><ChevronLeft size={14} className="mr-1" />Back</>}
            </Button>
            {isLast ? (
              <Button onClick={handleSubmit} disabled={actionLoading} className="min-w-[120px]">
                {actionLoading
                  ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>
                  : <><CheckCircle size={14} className="mr-1.5" />{isEdit ? "Update Student" : "Create Student"}</>}
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
