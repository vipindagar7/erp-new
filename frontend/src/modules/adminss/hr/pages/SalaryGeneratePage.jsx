// src/modules/adminss/hr/pages/SalaryGeneratePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Loader2, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function SalaryGeneratePage() {
  const navigate = useNavigate();
  const [faculty,  setFaculty]  = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year:  new Date().getFullYear(),
    working_days: 26,
    present_days: 26,
    lop_days: 0,
  });
  const [generating, setGenerating] = useState(false);
  const [results,    setResults]    = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.faculty.list + "?status=ACTIVE&limit=200")
      .then(r => {
        const f = r.data?.data?.faculty || r.data?.data || [];
        setFaculty(f);
        setSelected(f.map(x => x.id));
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleAll = () => setSelected(selected.length === faculty.length ? [] : faculty.map(f => f.id));
  const toggleOne = id => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  const set = k => e => setForm(f => ({...f,[k]:+e.target.value}));

  const generate = async () => {
    if (!selected.length) { notify.error("Select faculty"); return; }
    setGenerating(true);
    try {
      const res = await axiosInstance.post(EP.hr.bulkGenerate, { ...form, faculty_ids: selected });
      const data = res.data?.data || [];
      const ok   = data.filter(r => r.success).length;
      notify.success(`${ok}/${data.length} salary slips generated`);
      setResults(data);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setGenerating(false); }
  };

  const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/hr")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex-1">Generate Salary Slips</h1>
        <button onClick={generate} disabled={generating || !selected.length}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {generating ? <Loader2 size={13} className="animate-spin"/> : <Play size={13}/>}
          {generating ? "Generating…" : `Generate for ${selected.length}`}
        </button>
      </div>

      {/* Config */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period Configuration</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Month</label>
            <select value={form.month} onChange={set("month")} className={inp}>
              {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Year</label>
            <input type="number" value={form.year} onChange={set("year")} className={inp}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Working Days</label>
            <input type="number" value={form.working_days} onChange={set("working_days")} className={inp}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Present Days</label>
            <input type="number" value={form.present_days} onChange={set("present_days")} className={inp}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">LOP Days</label>
            <input type="number" min="0" value={form.lop_days} onChange={set("lop_days")} className={inp}/>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">LOP (Loss of Pay) will reduce salary proportionally. Individual overrides can be set after generation.</p>
      </div>

      {/* Faculty list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <button onClick={toggleAll} className="text-xs text-muted-foreground hover:text-foreground">
            {selected.length === faculty.length ? "Deselect All" : "Select All"}
          </button>
          <span className="text-xs text-muted-foreground ml-auto">{selected.length}/{faculty.length} selected</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
        ) : (
          <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
            {faculty.map(f => (
              <div key={f.id} onClick={() => toggleOne(f.id)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/20 ${selected.includes(f.id)?"bg-primary/5":""}`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(f.id)?"bg-primary border-primary":"border-input"}`}>
                  {selected.includes(f.id) && <span className="text-[8px] text-primary-foreground">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.designation} · {f.department?.name} · {f.emp_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generation Results</p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={13}/>{results.filter(r=>r.success).length} success</span>
            <span className="text-red-500 font-medium flex items-center gap-1"><XCircle size={13}/>{results.filter(r=>!r.success).length} failed</span>
          </div>
          {results.filter(r=>!r.success).map((r,i) => (
            <p key={i} className="text-xs text-red-500">{r.faculty_id}: {r.error}</p>
          ))}
          {results.filter(r=>r.success).length > 0 && (
            <button onClick={() => navigate("/admin/hr/slips?status=GENERATED")} className="text-xs text-primary hover:underline">
              View generated slips for approval →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
