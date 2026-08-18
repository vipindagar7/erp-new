// src/modules/leave/pages/LeaveSubmitPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LEAVE_TYPES = ["CASUAL","MEDICAL","EARNED","MATERNITY","PATERNITY","DUTY","UNPAID"];

export default function LeaveSubmitPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [form, setForm] = useState({
    faculty_id: searchParams.get("faculty_id") || "",
    leave_type: "", from_date: "", to_date: "", reason: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axiosInstance.get(EP.faculty.list, { params: { limit: 300, status: "ACTIVE" } })
      .then((r) => setFaculty(r.data?.data?.faculty || []));
  }, []);

  const totalDays = form.from_date && form.to_date
    ? Math.ceil((new Date(form.to_date) - new Date(form.from_date)) / (1000*60*60*24)) + 1
    : 0;

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.faculty_id) e.faculty_id = "Faculty required";
    if (!form.leave_type) e.leave_type = "Leave type required";
    if (!form.from_date)  e.from_date  = "From date required";
    if (!form.to_date)    e.to_date    = "To date required";
    if (!form.reason.trim()) e.reason  = "Reason required";
    if (form.from_date && form.to_date && new Date(form.from_date) > new Date(form.to_date)) e.to_date = "To date must be after from date";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await axiosInstance.post(EP.leave.submit(form.faculty_id), { leave_type: form.leave_type, from_date: form.from_date, to_date: form.to_date, reason: form.reason });
      notify.success("Leave submitted successfully");
      navigate(ROUTES.leave.list);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.leave.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Submit Leave Request</h1><p className="text-sm text-muted-foreground">Submit on behalf of a faculty member</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Faculty *</Label>
          <Select value={form.faculty_id || "none"} onValueChange={(v) => set("faculty_id")(v === "none" ? "" : v)}>
            <SelectTrigger className={`h-10 ${errors.faculty_id ? "border-destructive" : ""}`}><SelectValue placeholder="Select faculty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select…</SelectItem>
              {faculty.map((f) => <SelectItem key={f.id} value={f.id}>{f.name} {f.emp_id ? `(${f.emp_id})` : ""}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.faculty_id && <p className="text-xs text-destructive">{errors.faculty_id}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Leave Type *</Label>
          <Select value={form.leave_type || "none"} onValueChange={(v) => set("leave_type")(v === "none" ? "" : v)}>
            <SelectTrigger className={`h-10 ${errors.leave_type ? "border-destructive" : ""}`}><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select…</SelectItem>
              {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.leave_type && <p className="text-xs text-destructive">{errors.leave_type}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>From Date *</Label>
            <Input type="date" value={form.from_date} onChange={(e) => set("from_date")(e.target.value)} className={errors.from_date ? "border-destructive" : ""} />
            {errors.from_date && <p className="text-xs text-destructive">{errors.from_date}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>To Date *</Label>
            <Input type="date" value={form.to_date} onChange={(e) => set("to_date")(e.target.value)} className={errors.to_date ? "border-destructive" : ""} />
            {errors.to_date && <p className="text-xs text-destructive">{errors.to_date}</p>}
          </div>
        </div>

        {totalDays > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
            Total: {totalDays} day{totalDays > 1 ? "s" : ""}
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Reason *</Label>
          <Textarea value={form.reason} onChange={(e) => set("reason")(e.target.value)} placeholder="Reason for leave…" rows={4} className={errors.reason ? "border-destructive" : ""} />
          {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.leave.list)}>Cancel</Button>
        <Button className="flex-1" disabled={loading} onClick={handleSubmit}>{loading ? "Submitting…" : "Submit Leave"}</Button>
      </div>
    </div>
  );
}
