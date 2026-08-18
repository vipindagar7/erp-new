// src/modules/facultyPortal/pages/FacultyMyLeave.jsx
// Faculty's own leave portal view — see all my leaves, submit new, action pending
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Plus, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import axiosInstance from "../../../lib/axios.js";
import { EP } from "../../../config/api.config.js";
import { notify } from "../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Textarea}from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "../../../components/shared/StatusBadge.jsx";
import { useSelector } from "react-redux";

const LEAVE_TYPES = ["CASUAL","MEDICAL","EARNED","MATERNITY","PATERNITY","DUTY","UNPAID"];

export default function FacultyMyLeave() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const facultyId = user?.faculty?.id;
  const [leaves,     setLeaves]     = useState([]);
  const [pending,    setPending]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [form,       setForm]       = useState({ leave_type: "", from_date: "", to_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("my"); // "my" | "pending"

  const load = async () => {
    if (!facultyId) return;
    try {
      const [lr, pr] = await Promise.all([
        axiosInstance.get(EP.leave.faculty(facultyId)),
        axiosInstance.get(EP.leave.pending),
      ]);
      setLeaves(lr.data?.data?.leaves || []);
      setPending(pr.data?.data?.leaves || []);
    } catch { notify.error("Failed to load leaves"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [facultyId]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.leave_type || !form.from_date || !form.to_date || !form.reason.trim()) {
      notify.error("All fields required"); return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(EP.leave.submit(facultyId), form);
      notify.success("Leave submitted successfully");
      setShowSubmit(false); setForm({ leave_type: "", from_date: "", to_date: "", reason: "" }); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";
  const totalDays = form.from_date && form.to_date
    ? Math.max(0, Math.ceil((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1)
    : 0;

  const STATS = [
    { label: "Total",    value: leaves.length,                                          color: "blue" },
    { label: "Pending",  value: leaves.filter((l) => l.status === "PENDING").length,    color: "amber" },
    { label: "Approved", value: leaves.filter((l) => l.status === "APPROVED").length,   color: "green" },
    { label: "My Queue", value: pending.length,                                          color: "violet" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center"><Calendar size={18} /></div>
          <div><h1 className="text-xl font-bold">My Leave</h1><p className="text-sm text-muted-foreground">Submit and track your leave requests</p></div>
        </div>
        <Button size="sm" onClick={() => setShowSubmit((s) => !s)}><Plus size={13} className="mr-1.5" /> {showSubmit ? "Cancel" : "Apply Leave"}</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-0.5 text-${color}-600`}>{loading ? "…" : value}</p>
          </div>
        ))}
      </div>

      {/* Submit form */}
      {showSubmit && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold">New Leave Application</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Leave Type *</Label>
            <Select value={form.leave_type || "none"} onValueChange={(v) => set("leave_type")(v === "none" ? "" : v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent><SelectItem value="none">Select…</SelectItem>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs">From *</Label><Input type="date" value={form.from_date} onChange={(e) => set("from_date")(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">To *</Label><Input type="date" value={form.to_date} onChange={(e) => set("to_date")(e.target.value)} /></div>
          </div>
          {totalDays > 0 && <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium">{totalDays} day{totalDays > 1 ? "s" : ""}</div>}
          <div className="space-y-1.5"><Label className="text-xs">Reason *</Label><Textarea value={form.reason} onChange={(e) => set("reason")(e.target.value)} rows={3} placeholder="Reason for leave…" /></div>
          <Button disabled={submitting} onClick={submit}>{submitting ? "Submitting…" : "Submit Application"}</Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[{ k: "my", label: `My Requests (${leaves.length})` }, { k: "pending", label: `Pending Approval (${pending.length})` }].map(({ k, label }) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>
        ))}
      </div>

      {/* Leave table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {tab === "pending" ? ["Faculty","Type","From","Days","Status",""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>)
              : ["Type","From","To","Days","Status",""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">Loading…</td></tr>
            : (tab === "my" ? leaves : pending).length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">None found</td></tr>
            : (tab === "my" ? leaves : pending).map((l) => (
              <tr key={l.id} className="hover:bg-muted/20">
                {tab === "pending" && <td className="px-4 py-3 font-medium">{l.faculty?.name}</td>}
                <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{l.leave_type}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(l.from_date)}</td>
                {tab === "my" && <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(l.to_date)}</td>}
                <td className="px-4 py-3 text-center font-medium">{l.total_days}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3"><button onClick={() => navigate(`/admin/leave/${l.id}`)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}