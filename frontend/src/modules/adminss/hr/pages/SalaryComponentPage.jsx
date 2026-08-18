// src/modules/adminss/hr/pages/SalaryComponentPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Loader2, Settings } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";

export default function SalaryComponentPage() {
  const navigate = useNavigate();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm,setShowForm]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [form, setForm] = useState({ name:"", code:"", type:"EARNING", calc_type:"FIXED", value:0, is_taxable:false, is_statutory:false, sort_order:0, description:"" });

  const load = () => {
    axiosInstance.get(EP.hr.components)
      .then(r=>setComponents(r.data?.data||[]))
      .catch(()=>notify.error("Failed"))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const save = async () => {
    if (!form.name||!form.code) { notify.error("Name and code required"); return; }
    setSaving(true);
    try {
      if (editId) await axiosInstance.patch(EP.hr.components+`/${editId}`, form);
      else        await axiosInstance.post(EP.hr.components, form);
      notify.success(editId?"Updated":"Created");
      setShowForm(false); setEditId(null);
      setForm({name:"",code:"",type:"EARNING",calc_type:"FIXED",value:0,is_taxable:false,is_statutory:false,sort_order:0,description:""});
      load();
    } catch(e){notify.error(e.response?.data?.message||"Failed");}
    finally{setSaving(false);}
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({name:c.name,code:c.code,type:c.type,calc_type:c.calc_type,value:c.value,is_taxable:c.is_taxable,is_statutory:c.is_statutory,sort_order:c.sort_order,description:c.description||""});
    setShowForm(true);
  };

  const earnings   = components.filter(c=>c.type==="EARNING");
  const deductions = components.filter(c=>c.type!=="EARNING");

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate("/admin/hr")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Settings size={18} className="text-primary"/>Salary Components</h1>
        </div>
        <button onClick={()=>{setEditId(null);setShowForm(true);}} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14}/>Add Component
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <div className="space-y-4">
          {[["Earnings", earnings, "bg-green-50 text-green-700"], ["Deductions", deductions, "bg-red-50 text-red-700"]].map(([label, list, style]) => (
            <div key={label} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/10">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label} ({list.length})</p>
              </div>
              <div className="divide-y divide-border">
                {list.length===0 && <div className="px-4 py-4 text-xs text-muted-foreground">No {label.toLowerCase()} defined</div>}
                {list.map(c=>(
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{c.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${style}`}>{c.code}</span>
                        {c.is_statutory&&<span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">Statutory</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {c.calc_type==="FIXED"?`₹${c.value?.toLocaleString()}`:c.calc_type==="PERCENTAGE_OF_BASIC"?`${c.value}% of Basic`:`${c.value}% of Gross`}
                        {c.is_taxable?" · Taxable":""}
                      </p>
                    </div>
                    <button onClick={()=>startEdit(c)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{editId?"Edit":"New"} Component</h2>
              <button onClick={()=>setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Name *</label><input className={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Basic Salary"/></div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Code *</label><input className={inp} value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="BASIC"/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Type</label>
                  <select className={sel} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    <option value="EARNING">Earning</option>
                    <option value="DEDUCTION">Deduction</option>
                    <option value="STATUTORY">Statutory</option>
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Calc Type</label>
                  <select className={sel} value={form.calc_type} onChange={e=>setForm(f=>({...f,calc_type:e.target.value}))}>
                    <option value="FIXED">Fixed ₹</option>
                    <option value="PERCENTAGE_OF_BASIC">% of Basic</option>
                    <option value="PERCENTAGE_OF_GROSS">% of Gross</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Value *</label><input type="number" className={inp} value={form.value} onChange={e=>setForm(f=>({...f,value:+e.target.value}))}/></div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Sort Order</label><input type="number" className={inp} value={form.sort_order} onChange={e=>setForm(f=>({...f,sort_order:+e.target.value}))}/></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_taxable} onChange={e=>setForm(f=>({...f,is_taxable:e.target.checked}))} className="w-4 h-4 accent-primary"/>Taxable</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_statutory} onChange={e=>setForm(f=>({...f,is_statutory:e.target.checked}))} className="w-4 h-4 accent-primary"/>Statutory (PF/ESI/TDS)</label>
              </div>
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
