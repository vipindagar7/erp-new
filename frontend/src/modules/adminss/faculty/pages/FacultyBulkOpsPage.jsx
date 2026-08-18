// src/modules/adminss/faculty/pages/FacultyBulkOpsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, CheckSquare, Loader2, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const ACTIONS = [
  { key:"status",      label:"Change Status",      options:["ACTIVE","INACTIVE","ON_LEAVE","RESIGNED"],  color:"bg-blue-50 text-blue-700 border-blue-200"   },
  { key:"designation", label:"Change Designation",  options:["Professor","Associate Professor","Assistant Professor","Lecturer","Lab Instructor","Other"], color:"bg-violet-50 text-violet-700 border-violet-200" },
  { key:"block",       label:"Block Access",        options:null, color:"bg-red-50 text-red-700 border-red-200"    },
  { key:"unblock",     label:"Unblock Access",      options:null, color:"bg-green-50 text-green-700 border-green-200" },
];

export default function FacultyBulkOpsPage() {
  const navigate = useNavigate();
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState([]);
  const [action,   setAction]   = useState("status");
  const [value,    setValue]    = useState("");
  const [reason,   setReason]   = useState("");
  const [search,   setSearch]   = useState("");
  const [acting,   setActing]   = useState(false);
  const [results,  setResults]  = useState(null);

  useEffect(() => {
    axiosInstance.get(EP.faculty.list + "?limit=200&status=ACTIVE")
      .then(r => setFaculty(r.data?.data?.faculty || r.data?.data || []))
      .catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = faculty.filter(f =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
    f.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll  = () => setSelected(selected.length === filtered.length ? [] : filtered.map(f => f.id));
  const toggleOne  = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x!==id) : [...prev,id]);
  const curAction  = ACTIONS.find(a => a.key === action);

  const run = async () => {
    if (!selected.length)  { notify.error("Select at least one faculty"); return; }
    if (curAction?.options && !value) { notify.error("Select a value"); return; }
    setActing(true);
    try {
      let res;
      const payload = { faculty_ids: selected, reason };
      if (action === "status")      res = await axiosInstance.post(EP.facultyBulk.status,      { ...payload, status:      value });
      if (action === "designation") res = await axiosInstance.post(EP.facultyBulk.designation, { ...payload, designation: value });
      if (action === "block")       res = await axiosInstance.post(EP.facultyBulk.block,       payload);
      if (action === "unblock")     res = await axiosInstance.post(EP.facultyBulk.unblock,     payload);
      const data = res?.data?.data || [];
      const ok   = Array.isArray(data) ? data.filter(r=>r.success).length : selected.length;
      notify.success(`${ok} faculty updated successfully`);
      setResults(Array.isArray(data) ? data : []);
      setSelected([]);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/faculty")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex items-center gap-2"><Users size={18} className="text-primary"/>Faculty Bulk Operations</h1>
      </div>

      {/* Action config */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configure Action</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ACTIONS.map(a => (
            <button key={a.key} onClick={() => { setAction(a.key); setValue(""); }}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${action===a.key ? a.color : "border-border hover:bg-muted/30"}`}>
              {a.label}
            </button>
          ))}
        </div>
        {curAction?.options && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Value <span className="text-red-500">*</span></label>
            <select value={value} onChange={e => setValue(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
              <option value="">Select…</option>
              {curAction.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Reason (optional)</label>
          <input value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Add a reason for this bulk change…"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none"/>
        </div>
      </div>

      {/* Faculty list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <button onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <CheckSquare size={14}/>
            {selected.length === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search faculty…"
            className="flex-1 h-8 px-3 rounded-lg border border-input bg-background text-xs outline-none"/>
          <span className="text-xs text-muted-foreground">{selected.length} selected</span>
          <button onClick={run} disabled={acting || !selected.length}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
            {acting ? <Loader2 size={11} className="animate-spin"/> : null}
            {acting ? "Running…" : `Run on ${selected.length}`}
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {filtered.map(f => (
              <div key={f.id} onClick={() => toggleOne(f.id)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors ${selected.includes(f.id) ? "bg-primary/5" : ""}`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${selected.includes(f.id) ? "bg-primary border-primary" : "border-input"}`}>
                  {selected.includes(f.id) && <span className="text-[8px] text-primary-foreground font-bold">✓</span>}
                </div>
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {f.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.designation} · {f.department?.name} · {f.emp_id}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${f.status==="ACTIVE"?"bg-green-50 text-green-700 border-green-200":"bg-muted text-muted-foreground border-border"}`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operation Results</p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ {results.filter(r=>r.success).length} success</span>
            <span className="text-red-500 font-medium">✗ {results.filter(r=>!r.success).length} failed</span>
          </div>
          {results.filter(r=>!r.success).map((r,i) => (
            <p key={i} className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/>{r.faculty_id}: {r.error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
