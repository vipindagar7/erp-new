// src/modules/adminss/fee/pages/FeeScholarshipPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Loader2, Award } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";

const TYPES = ["MERIT","SPORTS","SC_ST","MINORITY","GOVT","INSTITUTE"];

export default function FeeScholarshipPage() {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form, setForm] = useState({ name:"", code:"", type:"MERIT", amount_type:"PERCENTAGE", amount:10, max_amount:"", eligibility:"" });

  const load = () => {
    axiosInstance.get(EP.fee.scholarships)
      .then(r=>setScholarships(r.data?.data||[]))
      .catch(()=>notify.error("Failed"))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const save = async () => {
    if (!form.name||!form.code) { notify.error("Name and code required"); return; }
    setSaving(true);
    try {
      if (editId) await axiosInstance.patch(EP.fee.scholarships+`/${editId}`, form);
      else        await axiosInstance.post(EP.fee.scholarships, form);
      notify.success(editId?"Updated":"Created");
      setShowForm(false); setEditId(null);
      setForm({ name:"",code:"",type:"MERIT",amount_type:"PERCENTAGE",amount:10,max_amount:"",eligibility:"" });
      load();
    } catch(e) { notify.error(e.response?.data?.message||"Failed"); }
    finally { setSaving(false); }
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ name:s.name, code:s.code, type:s.type, amount_type:s.amount_type, amount:s.amount, max_amount:s.max_amount||"", eligibility:s.eligibility||"" });
    setShowForm(true);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate("/admin/fee")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Award size={18} className="text-primary"/>Scholarships & Waivers</h1>
        </div>
        <button onClick={()=>{setEditId(null);setShowForm(true);}} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14}/>New Scholarship
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {scholarships.length===0 && <div className="py-10 text-center text-sm text-muted-foreground">No scholarships defined yet</div>}
            {scholarships.map(s=>(
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.name} <span className="text-xs text-muted-foreground">({s.code})</span></p>
                  <p className="text-xs text-muted-foreground">
                    {s.type} · {s.amount_type==="PERCENTAGE"?`${s.amount}%`:`₹${s.amount?.toLocaleString()}`}
                    {s.max_amount?` (max ₹${s.max_amount?.toLocaleString()})`:""}
                  </p>
                  {s.eligibility && <p className="text-xs text-muted-foreground italic">{s.eligibility}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.is_active?"bg-green-50 text-green-700 border-green-200":"bg-muted text-muted-foreground border-border"}`}>
                  {s.is_active?"Active":"Inactive"}
                </span>
                <button onClick={()=>startEdit(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit size={13}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{editId?"Edit":"New"} Scholarship</h2>
              <button onClick={()=>setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Name *</label><input className={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Merit Scholarship"/></div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Code *</label><input className={inp} value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="MERIT10"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Type</label>
                  <select className={sel} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Amount Type</label>
                  <select className={sel} value={form.amount_type} onChange={e=>setForm(f=>({...f,amount_type:e.target.value}))}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">{form.amount_type==="PERCENTAGE"?"Percentage":"Amount"} *</label><input type="number" className={inp} value={form.amount} onChange={e=>setForm(f=>({...f,amount:+e.target.value}))}/></div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Max Amount (₹)</label><input type="number" className={inp} value={form.max_amount} onChange={e=>setForm(f=>({...f,max_amount:e.target.value}))}/></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Eligibility Criteria</label><input className={inp} value={form.eligibility} onChange={e=>setForm(f=>({...f,eligibility:e.target.value}))} placeholder="e.g. CGPA ≥ 8.0, first-year students only"/></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowForm(false)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
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
