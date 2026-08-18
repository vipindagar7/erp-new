// src/modules/adminss/attendance/pages/ExtraAttendancePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Loader2, CheckCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function ExtraAttendancePage() {
  const navigate  = useNavigate();
  const [students,  setStudents]  = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState([]);
  const [form, setForm] = useState({ units:1, reason:"", type:"EXTRA", session_id:"", subject_id:"", effective_date:new Date().toISOString().slice(0,10) });
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.sessions.list),
      axiosInstance.get(EP.subjects.list + "?limit=200"),
      axiosInstance.get(EP.extraAttendance.list + "?limit=50"),
    ]).then(([sesRes, subRes, recRes]) => {
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) setForm(f => ({ ...f, session_id: cur.id }));
      setSubjects(subRes.data?.data?.subjects || subRes.data?.data || []);
      setRecords(recRes.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const searchStudents = async () => {
    if (!search) return;
    const res = await axiosInstance.get(EP.students.all + `?search=${search}&limit=20`).catch(() => ({ data: { data: [] } }));
    setStudents(res.data?.data || []);
  };

  const toggleStudent = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);

  const grant = async () => {
    if (!selected.length) { notify.error("Select at least one student"); return; }
    if (!form.units || form.units < 1) { notify.error("Units must be >= 1"); return; }
    if (!form.reason) { notify.error("Enter reason"); return; }
    setSaving(true);
    try {
      await axiosInstance.post(EP.extraAttendance.grant, { ...form, student_ids: selected, units: parseInt(form.units) });
      notify.success(`Extra attendance granted to ${selected.length} student(s)`);
      setSelected([]);
      const res = await axiosInstance.get(EP.extraAttendance.list + "?limit=50");
      setRecords(res.data?.data || []);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/attendance")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex items-center gap-2"><Plus size={18} className="text-primary"/>Extra Attendance</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Student selection */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Students</p>
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchStudents()}
              placeholder="Search name or roll no…" className={inp}/>
            <button onClick={searchStudents} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/40">Search</button>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-xl">
            {students.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">Search and select students</p>
            )}
            {students.map(s => (
              <div key={s.id} onClick={() => toggleStudent(s.id)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/20 ${selected.includes(s.id)?"bg-primary/5":""}`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(s.id)?"bg-primary border-primary":"border-input"}`}>
                  {selected.includes(s.id) && <CheckCircle size={10} className="text-primary-foreground"/>}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.roll_no} · {s.section?.name}</p>
                </div>
              </div>
            ))}
          </div>
          {selected.length > 0 && <p className="text-xs text-primary font-medium">{selected.length} student(s) selected</p>}
        </div>

        {/* Grant form */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grant Extra Classes</p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Number of Classes (units) *</label>
            <input type="number" min="1" value={form.units} onChange={e => setForm(f=>({...f,units:e.target.value}))} className={inp}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Type</label>
            <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} className={inp}>
              <option value="EXTRA">Extra (bonus)</option>
              <option value="MEDICAL">Medical (illness)</option>
              <option value="EVENT">Event/Competition</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Subject (optional)</label>
            <select value={form.subject_id} onChange={e => setForm(f=>({...f,subject_id:e.target.value}))} className={inp}>
              <option value="">All subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Effective Date</label>
            <input type="date" value={form.effective_date} onChange={e => setForm(f=>({...f,effective_date:e.target.value}))} className={inp}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Reason *</label>
            <input value={form.reason} onChange={e => setForm(f=>({...f,reason:e.target.value}))}
              placeholder="e.g. Sports meet, medical emergency, institute event…" className={inp}/>
          </div>
          <button onClick={grant} disabled={saving || !selected.length}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
            {saving ? "Granting…" : `Grant to ${selected.length} student(s)`}
          </button>
        </div>
      </div>

      {/* Recent grants */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Recent Extra Attendance Grants</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No records yet</div>
        ) : (
          <div className="divide-y divide-border">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 text-xs font-bold flex items-center justify-center">+{r.units}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.student?.name}</p>
                  <p className="text-xs text-muted-foreground">{r.student?.roll_no} · {r.reason} · {r.type}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(r.granted_at).toLocaleDateString("en-IN",{dateStyle:"short"})}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
