// src/modules/adminss/faculty/pages/FacultyLeaveApplyPage.jsx
// Faculty self-service leave application with:
// - Real-time balance check
// - Timetable conflict detection
// - Leave rule validation
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Send, AlertCircle, CheckCircle, Loader2, Info, Clock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

const BALANCE_COLOR = (avail) => avail > 3 ? "text-green-600" : avail > 0 ? "text-amber-600" : "text-red-500";

export default function FacultyLeaveApplyPage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  const [sessions,  setSessions]  = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [balances,  setBalances]  = useState([]);
  const [slots,     setSlots]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [validating,setValidating]= useState(false);
  const [saving,    setSaving]    = useState(false);
  const [validation,setValidation]= useState(null); // result of validate-leave
  const [form, setForm] = useState({
    leave_type: "",
    from_date:  "",
    to_date:    "",
    reason:     "",
    cover_faculty_id: "",
  });

  const [coverFaculty, setCoverFaculty] = useState([]);

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/api/sessions"),
      axiosInstance.get("/api/faculty?status=ACTIVE&limit=200"),
    ]).then(([sesRes, fRes]) => {
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) {
        setSessionId(cur.id);
        loadBalances(cur.id);
        loadSlots(cur.id);
      }
      setCoverFaculty(fRes.data?.data?.faculty || fRes.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadBalances = async (sid) => {
    try {
      const res = await axiosInstance.get(`/api/hr/leave/my-balance?session_id=${sid}`);
      setBalances(res.data?.data || []);
    } catch {}
  };

  const loadSlots = async (sid) => {
    try {
      const res = await axiosInstance.get(`/api/hr/leave/slots?session_id=${sid}`);
      setSlots(res.data?.data || []);
    } catch {}
  };

  const selBalance = balances.find(b => b.leave_type === form.leave_type);
  const totalDays = form.from_date && form.to_date
    ? Math.max(0, Math.ceil((new Date(form.to_date) - new Date(form.from_date)) / (1000*60*60*24)) + 1)
    : 0;

  // Validate whenever key fields change
  useEffect(() => {
    if (!form.leave_type || !form.from_date || !form.to_date || !sessionId) {
      setValidation(null);
      return;
    }
    const t = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await axiosInstance.post("/api/hr/leave/validate-leave", {
          faculty_id:  user?.faculty?.id,
          session_id:  sessionId,
          leave_type:  form.leave_type,
          from_date:   form.from_date,
          to_date:     form.to_date,
        });
        setValidation(res.data?.data);
      } catch {}
      finally { setValidating(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [form.leave_type, form.from_date, form.to_date, sessionId]);

  const submit = async () => {
    if (!form.leave_type)  { notify.error("Select leave type"); return; }
    if (!form.from_date)   { notify.error("Select from date"); return; }
    if (!form.to_date)     { notify.error("Select to date"); return; }
    if (!form.reason)      { notify.error("Enter reason"); return; }
    if (validation && !validation.valid) { notify.error("Fix validation errors first"); return; }
    if (selBalance?.requires_cover && !form.cover_faculty_id) {
      notify.error("Assign cover faculty before applying"); return;
    }

    setSaving(true);
    try {
      await axiosInstance.post("/api/leave", {
        leave_type_code: form.leave_type,
        startDate:       form.from_date,
        endDate:         form.to_date,
        reason:          form.reason,
        cover_faculty_id:form.cover_faculty_id || undefined,
        session_id:      sessionId,
      });
      notify.success("Leave application submitted");
      navigate("/admin/my-workspace/leaves");
    } catch(e) { notify.error(e.response?.data?.message || "Failed to submit"); }
    finally { setSaving(false); }
  };

  const canApply = validation?.valid && form.reason && (!selBalance?.requires_cover || form.cover_faculty_id);

  // Filter cover faculty — exclude self
  const otherFaculty = coverFaculty.filter(f => f.id !== user?.faculty?.id);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold">Apply for Leave</h1>
      </div>

      {/* Balance cards */}
      {loading ? <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {balances.map(b => (
            <button key={b.leave_type} onClick={() => setForm(f=>({...f,leave_type:b.leave_type}))}
              className={`rounded-xl border p-3 text-left transition-all ${form.leave_type===b.leave_type?"border-primary bg-primary/5 shadow-sm":"border-border hover:bg-muted/20"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-muted-foreground">{b.leave_type}</span>
                {b.is_slot_based && <span className="text-[9px] text-cyan-600 font-semibold">SLOT</span>}
              </div>
              <p className={`text-xl font-black ${BALANCE_COLOR(b.available)}`}>{b.available}</p>
              <p className="text-[10px] text-muted-foreground">available</p>
              <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full"
                  style={{ width: `${b.allocated > 0 ? (b.available/b.allocated)*100 : 0}%` }}/>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">{b.used} used · {b.pending} pending</p>
            </button>
          ))}
          {balances.length === 0 && (
            <div className="col-span-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
              <AlertCircle size={13}/>No leave balance found. Contact HR to initialize your leave balance.
            </div>
          )}
        </div>
      )}

      {/* Active slots info */}
      {slots.length > 0 && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-cyan-700 flex items-center gap-1"><Info size={11}/>Active Break Slots</p>
          {slots.map(sl => (
            <p key={sl.id} className="text-xs text-cyan-600">
              {sl.name}: {new Date(sl.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} → {new Date(sl.end_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} (max {sl.max_leaves} days)
            </p>
          ))}
        </div>
      )}

      {/* Application form */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Leave Type *</label>
            <select value={form.leave_type} onChange={e=>setForm(f=>({...f,leave_type:e.target.value}))}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
              <option value="">Select type…</option>
              {balances.map(b => (
                <option key={b.leave_type} value={b.leave_type} disabled={b.available <= 0}>
                  {b.leave_type} — {b.label} ({b.available} left)
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Session</label>
            <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadBalances(e.target.value);loadSlots(e.target.value);}}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
              {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">From Date *</label>
            <input type="date" value={form.from_date} onChange={e=>setForm(f=>({...f,from_date:e.target.value}))} className={inp}
              min={new Date().toISOString().slice(0,10)}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">To Date *</label>
            <input type="date" value={form.to_date} onChange={e=>setForm(f=>({...f,to_date:e.target.value}))} className={inp}
              min={form.from_date || new Date().toISOString().slice(0,10)}/>
          </div>
        </div>

        {/* Days counter */}
        {totalDays > 0 && (
          <div className="bg-muted/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
            <span>Duration: <strong>{totalDays} day{totalDays>1?"s":""}</strong></span>
            {selBalance && <span>Balance after: <strong className={BALANCE_COLOR(selBalance.available - totalDays)}>{Math.max(0, selBalance.available - totalDays)} days</strong></span>}
          </div>
        )}

        {/* Validation result */}
        {validating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin"/>Checking leave rules…
          </div>
        )}
        {validation && !validating && (
          <div className={`rounded-xl p-3 space-y-1.5 ${validation.valid?"bg-green-50 border border-green-200":"bg-red-50 border border-red-200"}`}>
            <p className={`text-xs font-semibold flex items-center gap-1 ${validation.valid?"text-green-700":"text-red-700"}`}>
              {validation.valid ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
              {validation.valid ? "Leave application is valid" : "Cannot apply — rule violations found"}
            </p>
            {validation.errors?.map((e, i) => <p key={i} className="text-xs text-red-600">✗ {e}</p>)}
            {validation.warnings?.map((w, i) => <p key={i} className="text-xs text-amber-600">⚠ {w}</p>)}
          </div>
        )}

        {/* Cover faculty — shown when requires_cover */}
        {selBalance?.requires_cover && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1">
              <AlertCircle size={11} className="text-amber-500"/>
              Cover Faculty * <span className="text-muted-foreground font-normal">(required — you have classes during leave period)</span>
            </label>
            <select value={form.cover_faculty_id} onChange={e=>setForm(f=>({...f,cover_faculty_id:e.target.value}))}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
              <option value="">Select cover faculty…</option>
              {otherFaculty.map(f => <option key={f.id} value={f.id}>{f.name} — {f.designation}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Reason *</label>
          <textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}
            placeholder="Describe the reason for leave…"
            className={inp + " h-24 py-2.5 resize-none"}/>
        </div>

        <button onClick={submit} disabled={saving || !canApply}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
          {saving ? "Submitting…" : "Submit Leave Application"}
        </button>

        {!canApply && form.leave_type && form.from_date && form.to_date && !validating && (
          <p className="text-xs text-center text-muted-foreground">
            {validation?.errors?.length ? "Fix the errors above to proceed" : "Fill all required fields"}
          </p>
        )}
      </div>
    </div>
  );
}
