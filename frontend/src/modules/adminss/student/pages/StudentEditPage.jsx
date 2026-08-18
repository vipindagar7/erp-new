// src/modules/student/pages/StudentEditPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

export default function StudentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [depts, setDepts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pageLoad, setPageLoad] = useState(true);
  const [form, setForm] = useState({ name:"", roll_no:"", enrollment_no:"", university_roll_no:"", dept_id:"", program_id:"", branch_id:"", section_id:"", batch_year:"", admission_year:"", gender:"", phone:"", dob:"", father_name:"", mother_name:"", father_phone:"", mother_phone:"", address:"", city:"", state:"", pincode:"", category:"", religion:"", mode_of_admission:"", aadhar_no:"" });

  useEffect(() => {
    Promise.all([axiosInstance.get(EP.students.byId(id)), axiosInstance.get(EP.departments.list, { params: { limit: 200 } })])
      .then(([sRes, dRes]) => {
        const s = sRes.data?.data;
        setForm({ name: s.name||"", roll_no: s.roll_no||"", enrollment_no: s.enrollment_no||"", university_roll_no: s.university_roll_no||"", dept_id: s.department?.id||s.dept_id||"", program_id: s.program?.id||s.program_id||"", branch_id: s.branch?.id||s.branch_id||"", section_id: s.section?.id||s.section_id||"", batch_year: s.batch_year ? String(s.batch_year) : "", admission_year: s.admission_year ? String(s.admission_year) : "", gender: s.gender||"", phone: s.phone||"", dob: s.dob ? s.dob.split("T")[0] : "", father_name: s.father_name||"", mother_name: s.mother_name||"", father_phone: s.father_phone||"", mother_phone: s.mother_phone||"", address: s.address||"", city: s.city||"", state: s.state||"", pincode: s.pincode||"", category: s.category||"", religion: s.religion||"", mode_of_admission: s.mode_of_admission||"", aadhar_no: s.aadhar_no||"" });
        setDepts(Array.isArray(dRes.data?.data) ? dRes.data.data : []);
      }).catch(() => notify.error("Failed to load")).finally(() => setPageLoad(false));
  }, [id]);

  useEffect(() => { if (!form.dept_id)    return; axiosInstance.get(EP.programs.list, { params: { dept_id: form.dept_id, limit: 200 } }).then((r) => setPrograms(r.data?.data?.programs || [])); }, [form.dept_id]);
  useEffect(() => { if (!form.program_id) return; axiosInstance.get(EP.branches.list, { params: { program_id: form.program_id, limit: 200 } }).then((r) => setBranches(r.data?.data?.branches || [])); }, [form.program_id]);
  useEffect(() => { if (!form.branch_id)  return; axiosInstance.get(EP.sections.list, { params: { branch_id: form.branch_id, status: "ACTIVE", limit: 100 } }).then((r) => setSections(r.data?.data?.sections || [])); }, [form.branch_id]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { notify.error("Name is required"); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.batch_year)     payload.batch_year     = parseInt(payload.batch_year)     || null;
      if (payload.admission_year) payload.admission_year = parseInt(payload.admission_year) || null;
      await axiosInstance.patch(EP.students.byId(id), payload);
      notify.success("Student updated");
      navigate(ROUTES.students.detail(id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); } finally { setLoading(false); }
  };

  if (pageLoad) return <div className="max-w-2xl space-y-4">{[1,2,3,4].map((i) => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}</div>;

  const F = ({ label, name, type="text" }) => (
    <div className="space-y-1.5"><Label>{label}</Label><Input type={type} value={form[name]} onChange={(e) => set(name)(e.target.value)} /></div>
  );
  const S = ({ label, name, options, disabled }) => (
    <div className="space-y-1.5"><Label>{label}</Label>
      <Select value={form[name] || "none"} onValueChange={(v) => set(name)(v === "none" ? "" : v)} disabled={disabled}>
        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="none">Select…</SelectItem>{options.map((o) => typeof o === "string" ? <SelectItem key={o} value={o}>{o}</SelectItem> : <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.students.detail(id))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div><h1 className="text-xl font-bold">Edit Student</h1><p className="text-sm text-muted-foreground">Update student profile</p></div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Hierarchy</p>
        <div className="grid grid-cols-2 gap-4">
          <S label="Department" name="dept_id"    options={depts.map((d)=>({value:d.id,label:d.name}))} />
          <S label="Program"    name="program_id" options={programs.map((p)=>({value:p.id,label:p.name}))} disabled={!form.dept_id} />
          <S label="Branch"     name="branch_id"  options={branches.map((b)=>({value:b.id,label:b.name}))} disabled={!form.program_id} />
          <S label="Section"    name="section_id" options={sections.map((s)=>({value:s.id,label:`${s.name} (Sem ${s.semester})`}))} disabled={!form.branch_id} />
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Full Name *"        name="name" />
          <F label="Roll No"            name="roll_no" />
          <F label="Enrollment No"      name="enrollment_no" />
          <F label="University Roll No" name="university_roll_no" />
          <F label="Phone"              name="phone" />
          <F label="Aadhar No"          name="aadhar_no" />
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
          <F label="Father Name"  name="father_name" /><F label="Father Phone" name="father_phone" />
          <F label="Mother Name"  name="mother_name" /><F label="Mother Phone" name="mother_phone" />
          <div className="col-span-2"><F label="Address" name="address" /></div>
          <F label="City" name="city" /><F label="State" name="state" /><F label="Pincode" name="pincode" />
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.students.detail(id))}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>{loading ? "Saving…" : "Save Changes"}</Button>
      </div>
    </div>
  );
}