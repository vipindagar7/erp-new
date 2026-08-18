// src/modules/adminss/hr/pages/SalaryCyclePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Lock, Calculator, Loader2, Calendar, Download } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";

const MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const inp = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

export default function SalaryCyclePage() {
  const navigate = useNavigate();
  const [cycles,   setCycles]   = useState([]);
  const [sessions, setSessions] = useState([]);
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState("");
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    session_id: "",
    month:      new Date().getMonth() + 1,
    year:       new Date().getFullYear(),
    from_date:  "",
    to_date:    "",
    notes:      "",
  });

  // Auto-set from/to when month+year changes
  useEffect(() => {
    if (form.month && form.year) {
      const from = new Date(form.year, form.month - 1, 1);
      const to   = new Date(form.year, form.month, 0);
      setForm(f => ({
        ...f,
        from_date: from.toISOString().slice(0,10),
        to_date:   to.toISOString().slice(0,10),
      }));
    }
  }, [form.month, form.year]);

  const load = () => {
    Promise.all([
      axiosInstance.get("/api/hr/salary/cycles"),
      axiosInstance.get("/api/sessions"),
      axiosInstance.get("/api/faculty?status=ACTIVE&limit=200"),
    ]).then(([cRes, sesRes, fRes]) => {
      setCycles(cRes.data?.data || []);
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) setForm(f => ({...f, session_id:cur.id}));
      setFaculty(fRes.data?.data?.faculty || fRes.data?.data || []);
    }).catch(() => notify.error("Failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const saveCycle = async () => {
    if (!form.from_date || !form.to_date) { notify.error("Select date range"); return; }
    setSaving(true);
    try {
      await axiosInstance.post("/api/hr/salary/cycles", form);
      notify.success("Salary cycle created");
      setShowForm(false);
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const lockCycle = async (id) => {
    if (!confirm("Lock this cycle? Locked cycles cannot be modified.")) return;
    try {
      await axiosInstance.post(`/api/hr/salary/cycles/${id}/lock`);
      notify.success("Cycle locked");
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  const generateAll = async (cycle) => {
    setGenerating(cycle.id);
    try {
      const res = await axiosInstance.post("/api/hr/salary/bulk-generate", {
        cycle_id:    cycle.id,
        faculty_ids: faculty.map(f => f.id),
      });
      const data = res.data?.data || [];
      const ok   = data.filter(r => r.success).length;
      notify.success(`${ok}/${data.length} salary slips generated`);
      navigate(`/admin/hr/slips?cycle_id=${cycle.id}`);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setGenerating(""); }
  };

  const previewForFaculty = async (faculty_id) => {
    if (!form.from_date || !form.to_date) { notify.error("Set date range first"); return; }
    setPreviewing(true);
    try {
      const res = await axiosInstance.post("/api/hr/salary/preview", {
        faculty_id,
        from_date:  form.from_date,
        to_date:    form.to_date,
        session_id: form.session_id,
      });
      setPreview(res.data?.data);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setPreviewing(false); }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/hr")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Calendar size={18} className="text-primary"/>Salary Cycles</h1>
            <p className="text-sm text-muted-foreground">Define pay periods — full month, partial, weekly, or custom range</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14}/>New Cycle
        </button>
      </div>

      {/* Quick Preview Calculator */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Calculator size={13}/>Quick Salary Preview (any date range)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">From Date</label>
            <input type="date" value={form.from_date} onChange={e=>setForm(f=>({...f,from_date:e.target.value}))} className={inp}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">To Date</label>
            <input type="date" value={form.to_date} onChange={e=>setForm(f=>({...f,to_date:e.target.value}))} className={inp}/>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium">Preview for Faculty</label>
            <div className="flex gap-2">
              <select className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none"
                onChange={e => e.target.value && previewForFaculty(e.target.value)}>
                <option value="">Select faculty…</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.name} — {f.emp_id}</option>)}
              </select>
              {previewing && <Loader2 size={18} className="animate-spin text-muted-foreground self-center"/>}
            </div>
          </div>
        </div>

        {/* Preview result */}
        {preview && (
          <div className="bg-muted/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{preview.faculty_name}</p>
              <p className="text-xs text-muted-foreground">{preview.from_date} → {preview.to_date}</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {[
                ["Total Days",    preview.total_days,    "text-foreground"],
                ["Sundays",       preview.sundays,       "text-muted-foreground"],
                ["Holidays",      preview.holiday_days,  "text-amber-600"],
                ["Working Days",  preview.working_days,  "text-blue-600"],
                ["Per Day",       `₹${preview.per_day_salary}`, "text-primary"],
                ["Net Salary",    `₹${preview.net_salary?.toLocaleString()}`, "text-green-600 font-bold"],
              ].map(([l,v,c]) => (
                <div key={l} className="bg-card border border-border rounded-xl p-2">
                  <p className={`text-base font-bold ${c}`}>{v}</p>
                  <p className="text-muted-foreground text-[10px]">{l}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Breakdown</p>
              <div className="grid grid-cols-2 gap-1">
                {preview.breakdown?.map(b => (
                  <div key={b.code} className="flex justify-between text-xs px-2 py-1 rounded-lg bg-card border border-border">
                    <span className={b.type==="EARNING"?"text-green-600":"text-red-500"}>{b.name}</span>
                    <span className="font-medium">₹{b.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cycles list */}
      {loading ? <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><p className="text-sm font-medium">All Salary Cycles ({cycles.length})</p></div>
          <div className="divide-y divide-border">
            {cycles.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No cycles yet</div>}
            {cycles.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{MONTHS[c.month]} {c.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.from_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} → {new Date(c.to_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}
                    {" · "}{c.total_days} calendar days · {c.working_days} working days
                  </p>
                  {c.notes && <p className="text-xs text-muted-foreground italic">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {c.is_locked && <span className="flex items-center gap-1 text-xs text-amber-600"><Lock size={11}/>Locked</span>}
                  {!c.is_locked && (
                    <>
                      <button onClick={() => generateAll(c)} disabled={generating===c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60">
                        {generating===c.id?<Loader2 size={11} className="animate-spin"/>:<Calculator size={11}/>}
                        Generate All
                      </button>
                      <button onClick={() => lockCycle(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 text-xs hover:bg-amber-50">
                        <Lock size={11}/>Lock
                      </button>
                    </>
                  )}
                  <button onClick={() => navigate(`/admin/hr/report?cycle_id=${c.id}`)} className="text-xs text-primary hover:underline">Report</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Cycle Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">New Salary Cycle</h2><button onClick={()=>setShowForm(false)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">✕</button></div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-700">
              Date range can be full month (1–31), partial, weekly, or any custom range. Working days auto-calculated by excluding Sundays + holidays.
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Month</label>
                  <select className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none"
                    value={form.month} onChange={e=>setForm(f=>({...f,month:+e.target.value}))}>
                    {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Year</label>
                  <input type="number" className={inp} value={form.year} onChange={e=>setForm(f=>({...f,year:+e.target.value}))}/>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">From Date *</label>
                  <input type="date" className={inp} value={form.from_date} onChange={e=>setForm(f=>({...f,from_date:e.target.value}))}/>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">To Date *</label>
                  <input type="date" className={inp} value={form.to_date} onChange={e=>setForm(f=>({...f,to_date:e.target.value}))}/>
                </div>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Session</label>
                <select className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none"
                  value={form.session_id} onChange={e=>setForm(f=>({...f,session_id:e.target.value}))}>
                  {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Notes</label>
                <input className={inp} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. Includes festival holiday deduction"/>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowForm(false)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={saveCycle} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">{saving?"Creating…":"Create Cycle"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
