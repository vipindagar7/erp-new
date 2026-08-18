// src/modules/student/pages/StudentLeaveApplyPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Send, Loader2, Calendar, Info } from "lucide-react";
import axiosInstance from "../../../lib/axios.js";
import { EP } from "../../../config/api.config.js";
import { notify } from "../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

export default function StudentLeaveApplyPage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const studentId = user?.student?.id || user?.student_id;

  const [form, setForm] = useState({ from_date:"", to_date:"", reason:"", documents:[] });
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const totalDays = form.from_date && form.to_date
    ? Math.max(0, Math.ceil((new Date(form.to_date) - new Date(form.from_date)) / (1000*60*60*24)) + 1)
    : 0;

  const submit = async () => {
    if (!form.from_date) { notify.error("Select from date"); return; }
    if (!form.to_date)   { notify.error("Select to date");   return; }
    if (!form.reason)    { notify.error("Enter reason");     return; }
    if (new Date(form.to_date) < new Date(form.from_date)) { notify.error("End date must be after start date"); return; }

    setSaving(true);
    try {
      await axiosInstance.post(EP.studentLeave.create, { ...form, student_id: studentId });
      notify.success("Leave application submitted");
      navigate("/student/leave");
    } catch(e) { notify.error(e.response?.data?.message || "Failed to submit"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calendar size={18} className="text-primary"/>Apply for Leave
        </h1>
      </div>

      {/* Approval flow info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1"><Info size={11}/>Approval Workflow</p>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <span className="px-2 py-0.5 bg-blue-100 rounded-full font-medium">1. Class Coordinator</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-blue-100 rounded-full font-medium">2. HOD</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-blue-100 rounded-full font-medium">3. Director</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">From Date <span className="text-red-500">*</span></label>
            <input type="date" className={inp} value={form.from_date} onChange={set("from_date")}
              min={new Date().toISOString().slice(0,10)}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">To Date <span className="text-red-500">*</span></label>
            <input type="date" className={inp} value={form.to_date} onChange={set("to_date")}
              min={form.from_date || new Date().toISOString().slice(0,10)}/>
          </div>
        </div>

        {totalDays > 0 && (
          <div className="bg-muted/20 rounded-xl px-4 py-2.5 text-sm font-medium text-center">
            Total: <span className="text-primary font-bold">{totalDays} day{totalDays>1?"s":""}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Reason <span className="text-red-500">*</span></label>
          <textarea value={form.reason} onChange={set("reason")}
            placeholder="Describe the reason for leave (medical, personal, family emergency, etc.)…"
            className={inp + " h-28 py-2.5 resize-none"}/>
        </div>

        <button onClick={submit} disabled={saving}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
          {saving ? "Submitting…" : "Submit Leave Application"}
        </button>
      </div>
    </div>
  );
}
