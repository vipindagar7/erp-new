// src/modules/adminss/fee/pages/FeeStructurePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Loader2, Banknote, Trash2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";

const DEFAULT_COMPONENTS = { tuition:60000, development:10000, library:2000, lab:3000, exam:2500, sports:1500, misc:1000 };

export default function FeeStructurePage() {
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [programs,   setPrograms]   = useState([]);
  const [branches,   setBranches]   = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form, setForm] = useState({
    title:"", session_id:"", program_id:"", branch_id:"", semester:"",
    total_amount:80000, installments:2, components: { ...DEFAULT_COMPONENTS },
  });

  const load = () => {
    Promise.all([
      axiosInstance.get(EP.fee.structures),
      axiosInstance.get(EP.programs.list + "?limit=50").catch(() => ({data:{data:[]}})),
      axiosInstance.get(EP.branches.list + "?limit=100").catch(() => ({data:{data:[]}})),
      axiosInstance.get(EP.sessions.list),
    ]).then(([sRes,pRes,bRes,sesRes]) => {
      setStructures(sRes.data?.data || []);
      setPrograms(pRes.data?.data?.programs || pRes.data?.data || []);
      setBranches(bRes.data?.data?.branches  || bRes.data?.data || []);
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s=>s.is_current);
      if (cur) setForm(f=>({...f, session_id:cur.id}));
    }).catch(()=>notify.error("Failed to load"))
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const compTotal = Object.values(form.components).reduce((s,v)=>s+(+v||0),0);

  const save = async () => {
    if (!form.title) { notify.error("Title required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, total_amount: compTotal || form.total_amount };
      if (editId) {
        await axiosInstance.patch(EP.fee.structures + `/${editId}`, payload);
        notify.success("Updated");
      } else {
        await axiosInstance.post(EP.fee.structures, payload);
        notify.success("Created");
      }
      setShowForm(false); setEditId(null);
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ title:s.title, session_id:s.session_id, program_id:s.program_id||"", branch_id:s.branch_id||"", semester:s.semester||"", total_amount:s.total_amount, installments:s.installments, components:s.components||{...DEFAULT_COMPONENTS} });
    setShowForm(true);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate("/admin/fee")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Banknote size={18} className="text-primary"/>Fee Structures</h1>
            <p className="text-sm text-muted-foreground">Define fee breakdowns per program, branch, semester</p>
          </div>
        </div>
        <button onClick={()=>{setEditId(null);setShowForm(true);}} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14}/>New Structure
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {structures.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No fee structures yet</div>}
            {structures.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[s.program_id&&"Program",s.branch_id&&"Branch",s.semester&&`Sem ${s.semester}`].filter(Boolean).join(" · ")||"All Students"}
                    {" · "}{s.installments} installment(s) · ₹{s.total_amount?.toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">₹{s.total_amount?.toLocaleString()}</span>
                <button onClick={()=>startEdit(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit size={13}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{editId?"Edit":"New"} Fee Structure</h2>
              <button onClick={()=>{setShowForm(false);setEditId(null);}} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5"><label className="text-xs font-medium">Title *</label><input className={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. B.Tech CSE 2025-26 Odd Sem"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Session</label>
                  <select className={sel} value={form.session_id} onChange={e=>setForm(f=>({...f,session_id:e.target.value}))}>
                    {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Installments</label>
                  <select className={sel} value={form.installments} onChange={e=>setForm(f=>({...f,installments:+e.target.value}))}>
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Program (optional)</label>
                  <select className={sel} value={form.program_id} onChange={e=>setForm(f=>({...f,program_id:e.target.value}))}>
                    <option value="">All programs</option>
                    {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Semester (optional)</label>
                  <select className={sel} value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))}>
                    <option value="">All semesters</option>
                    {[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Fee Components</p>
              {Object.entries(form.components).map(([k,v]) => (
                <div key={k} className="flex items-center gap-3">
                  <label className="text-xs font-medium w-28 capitalize">{k}</label>
                  <input type="number" value={v} onChange={e=>setForm(f=>({...f,components:{...f.components,[k]:+e.target.value}}))} className={inp}/>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                <span>Total</span><span className="text-primary">₹{compTotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>{setShowForm(false);setEditId(null);}} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                {saving?"Saving…":editId?"Update":"Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
