// src/modules/student/pages/StudentCreatePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Eye, EyeOff } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GENDERS    = ["Male","Female","Other","Prefer not to say"];
const MODES      = ["DIRECT","LATERAL","MANAGEMENT","NRI","SPORTS"];
const CATEGORIES = ["GEN","OBC","SC","ST","EWS"];

export default function StudentCreatePage() {
  const navigate = useNavigate();
  const [depts,    setDepts]    = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [created,  setCreated]  = useState(null);
  const [showPwd,  setShowPwd]  = useState(false);

  const [form, setForm] = useState({
    name:"", email:"", roll_no:"", enrollment_no:"", university_roll_no:"",
    dept_id:"", program_id:"", branch_id:"", section_id:"",
    batch_year:"", admission_year: String(new Date().getFullYear()),
    gender:"", phone:"", dob:"",
    father_name:"", mother_name:"", father_phone:"", mother_phone:"",
    address:"", city:"", state:"", pincode:"",
    category:"", religion:"", mode_of_admission:"",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axiosInstance.get(EP.departments.list, { params: { limit: 200 } })
      .then((r) => setDepts(Array.isArray(r.data?.data) ? r.data.data : []));
  }, []);

  useEffect(() => {
    if (!form.dept_id) { setPrograms([]); setBranches([]); setSections([]); return; }
    axiosInstance.get(EP.programs.list, { params: { dept_id: form.dept_id, limit: 200 } })
      .then((r) => setPrograms(r.data?.data?.programs || []));
  }, [form.dept_id]);

  useEffect(() => {
    if (!form.program_id) { setBranches([]); setSections([]); return; }
    axiosInstance.get(EP.branches.list, { params: { program_id: form.program_id, limit: 200 } })
      .then((r) => setBranches(r.data?.data?.branches || []));
  }, [form.program_id]);

  useEffect(() => {
    if (!form.branch_id) { setSections([]); return; }
    axiosInstance.get(EP.sections.list, { params: { branch_id: form.branch_id, status: "ACTIVE", limit: 100 } })
      .then((r) => setSections(r.data?.data?.sections || []));
  }, [form.branch_id]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const cascadeSet = (k) => (v) => {
    const resets = {};
    if (k === "dept_id")    { resets.program_id=""; resets.branch_id=""; resets.section_id=""; }
    if (k === "program_id") { resets.branch_id =""; resets.section_id=""; }
    if (k === "branch_id")  { resets.section_id=""; }
    setForm((f) => ({ ...f, [k]: v, ...resets }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name       = "Name is required";
    if (!form.email.trim()) e.email      = "Email is required";
    if (!form.dept_id)      e.dept_id    = "Department is required";
    if (!form.program_id)   e.program_id = "Program is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form };
      ["branch_id","section_id","roll_no","enrollment_no","university_roll_no",
       "phone","gender","dob","father_name","mother_name","father_phone","mother_phone",
       "address","city","state","pincode","category","religion","mode_of_admission"]
        .forEach((k) => { if (!payload[k]) payload[k] = null; });
      if (payload.batch_year)     payload.batch_year     = parseInt(payload.batch_year) || null;
      if (payload.admission_year) payload.admission_year = parseInt(payload.admission_year) || null;
      const r = await axiosInstance.post(EP.students.create, payload);
      setCreated(r.data?.data);
      notify.success("Student created");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (created) return (
    <div className="max-w-md space-y-5">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
        <div><p className="text-sm font-semibold text-green-800">Student created</p><p className="text-xs text-green-700 mt-0.5">Share the temporary password securely.</p></div>
        <div className="space-y-2 text-sm">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{created.student?.name}</p></div>
          <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{created.student?.user?.email}</p></div>
          {created.student?.roll_no && <div><p className="text-xs text-muted-foreground">Roll No</p><p className="font-mono font-medium">{created.student.roll_no}</p></div>}
          <div>
            <p className="text-xs text-muted-foreground">Temporary Password</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">{showPwd ? created.tempPassword : "••••••••••"}</p>
              <button onClick={() => setShowPwd(v => !v)} className="p-1 text-muted-foreground">{showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
              <button onClick={() => { navigator.clipboard.writeText(created.tempPassword); notify.success("Copied"); }} className="p-1 text-muted-foreground"><Copy size={14}/></button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(ROUTES.students.detail(created.student?.id))}>View Profile</Button>
          <Button size="sm" className="flex-1" onClick={() => setCreated(null)}>Add Another</Button>
        </div>
      </div>
    </div>
  );

  const F = ({ label, name, type="text", req }) => (
    <div className="space-y-1.5">
      <Label>{label}{req && " *"}</Label>
      <Input type={type} value={form[name]} onChange={(e) => set(name)(e.target.value)} className={errors[name] ? "border-destructive" : ""} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );
  const S = ({ label, name, options, req, disabled }) => (
    <div className="space-y-1.5">
      <Label>{label}{req && " *"}</Label>
      <Select value={form[name] || "none"} onValueChange={(v) => cascadeSet(name)(v === "none" ? "" : v)} disabled={disabled}>
        <SelectTrigger className={`h-10 ${errors[name] ? "border-destructive" : ""}`}><SelectValue placeholder={disabled ? "Select parent first" : "Select…"}/></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Select…</SelectItem>
          {options.map((o) => typeof o === "string" ? <SelectItem key={o} value={o}>{o}</SelectItem> : <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.students.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div><h1 className="text-xl font-bold">Add Student</h1><p className="text-sm text-muted-foreground">A temporary password will be auto-generated</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Hierarchy *</p>
        <div className="grid grid-cols-2 gap-4">
          <S label="Department" name="dept_id"    req options={depts.map((d) => ({ value: d.id, label: d.name }))} />
          <S label="Program"    name="program_id" req options={programs.map((p) => ({ value: p.id, label: p.name }))} disabled={!form.dept_id} />
          <S label="Branch"     name="branch_id"  options={branches.map((b) => ({ value: b.id, label: b.name }))} disabled={!form.program_id} />
          <S label="Section"    name="section_id" options={sections.map((s) => ({ value: s.id, label: `${s.name} (Sem ${s.semester})` }))} disabled={!form.branch_id} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity & Login</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Full Name *"          name="name" req />
          <F label="Email *"              name="email" type="email" req />
          <F label="Roll No"              name="roll_no" />
          <F label="Enrollment No"        name="enrollment_no" />
          <F label="University Roll No"   name="university_roll_no" />
          <F label="Phone"                name="phone" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Info</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Batch Year"      name="batch_year"      type="number" />
          <F label="Admission Year"  name="admission_year"  type="number" />
          <S label="Gender"          name="gender"          options={GENDERS} />
          <F label="Date of Birth"   name="dob"             type="date" />
          <S label="Category"        name="category"        options={CATEGORIES} />
          <S label="Mode of Admission" name="mode_of_admission" options={MODES} />
          <F label="Religion"        name="religion" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Family & Address</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Father Name"  name="father_name" />
          <F label="Father Phone" name="father_phone" />
          <F label="Mother Name"  name="mother_name" />
          <F label="Mother Phone" name="mother_phone" />
          <div className="col-span-2"><F label="Address" name="address" /></div>
          <F label="City"    name="city" />
          <F label="State"   name="state" />
          <F label="Pincode" name="pincode" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.students.list)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>{loading ? "Creating…" : "Create Student"}</Button>
      </div>
    </div>
  );
}