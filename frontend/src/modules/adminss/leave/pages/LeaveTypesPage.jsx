// src/modules/adminss/leave/pages/LeaveTypesPage.jsx
// HR Admin can create, edit, view all leave types
import { useState, useEffect } from "react";
import { ClipboardList, Plus, Edit2, Trash2, Loader2, X, Save, CheckCircle, XCircle, Lock, Unlock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

// Preset leave types for quick setup
const PRESETS = [
  { code:"CL",  name:"Casual Leave",          max_days_per_year:12, applicable_to:["ALL"],          is_paid:true,  min_days:0.5, description:"For personal/casual reasons" },
  { code:"EL",  name:"Earned Leave",           max_days_per_year:30, applicable_to:["TEACHING"],     is_paid:true,  carry_forward:true, carry_forward_max:15, description:"Accrued through service" },
  { code:"ML",  name:"Medical Leave",          max_days_per_year:10, applicable_to:["ALL"],          is_paid:true,  requires_document:true, document_threshold:3, description:"For medical reasons" },
  { code:"PL",  name:"Paternity Leave",        max_days_per_year:15, applicable_to:["ALL"],          is_paid:true,  description:"For new fathers" },
  { code:"MAL", name:"Maternity Leave",        max_days_per_year:180,applicable_to:["ALL"],          is_paid:true,  description:"For new mothers" },
  { code:"CCL", name:"Child Care Leave",       max_days_per_year:10, applicable_to:["TEACHING"],     is_paid:true,  description:"For child care responsibilities" },
  { code:"OD",  name:"On Duty",                max_days_per_year:30, applicable_to:["TEACHING"],     is_paid:true,  description:"Official duty outside campus" },
  { code:"CML", name:"Compensatory Leave",     max_days_per_year:10, applicable_to:["ALL"],          is_paid:true,  description:"In lieu of working on holidays" },
  { code:"LWP", name:"Leave Without Pay",      max_days_per_year:0,  applicable_to:["ALL"],          is_paid:false, description:"Unpaid leave" },
  { code:"SL",  name:"Special Leave",          max_days_per_year:5,  applicable_to:["NON_TEACHING"], is_paid:true,  description:"Special occasions" },
];

function TypeModal({ type, onClose, onSave }) {
  const [form, setForm] = useState({
    code:               type?.code             || "",
    name:               type?.name             || "",
    applicable_to:      type?.applicable_to    || ["ALL"],
    max_days_per_year:  type?.max_days_per_year|| 0,
    carry_forward:      type?.carry_forward    || false,
    carry_forward_max:  type?.carry_forward_max|| "",
    is_paid:            type?.is_paid          !== false,
    requires_document:  type?.requires_document|| false,
    min_days:           type?.min_days         || 0.5,
    max_consecutive:    type?.max_consecutive  || "",
    notice_days:        type?.notice_days      || 0,
    is_active:          type?.is_active        !== false,
    description:        type?.description      || "",
  });
  const [saving, setSaving] = useState(false);

  const toggleApplicable = (val) => {
    if (val === "ALL") { setForm(f=>({...f, applicable_to:["ALL"]})); return; }
    const curr = form.applicable_to.filter(v=>v!=="ALL");
    if (curr.includes(val)) setForm(f=>({...f, applicable_to:curr.filter(v=>v!==val)||["ALL"]}));
    else setForm(f=>({...f, applicable_to:[...curr, val]}));
  };

  const save = async () => {
    if (!form.code || !form.name) { notify.error("Code and name required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, max_consecutive: form.max_consecutive||null, carry_forward_max:form.carry_forward_max||null };
      if (type?.id) { await axiosInstance.patch(`/leave/types/${type.id}`, payload); notify.success("Updated"); }
      else          { await axiosInstance.post("/leave/types", payload); notify.success("Leave type created"); }
      onSave();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  const Chk = ({ k, label }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input type="checkbox" checked={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.checked}))} className="w-4 h-4 accent-primary"/>
      {label}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{type?"Edit Leave Type":"Create Leave Type"}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Code * <span className="text-muted-foreground">(e.g. CL, EL)</span></Label>
            <Input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="CL" maxLength={6} disabled={!!type?.id}/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Casual Leave"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Days/Year</Label>
            <Input type="number" value={form.max_days_per_year} onChange={e=>setForm(f=>({...f,max_days_per_year:e.target.value}))}/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Min Per Application</Label>
            <select value={form.min_days} onChange={e=>setForm(f=>({...f,min_days:parseFloat(e.target.value)}))} className={sel}>
              <option value={0.5}>Half Day (0.5)</option>
              <option value={1}>Full Day (1)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Consecutive Days</Label>
            <Input type="number" value={form.max_consecutive} onChange={e=>setForm(f=>({...f,max_consecutive:e.target.value}))} placeholder="No limit"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notice Days Required</Label>
            <Input type="number" value={form.notice_days} onChange={e=>setForm(f=>({...f,notice_days:e.target.value}))}/>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Applicable To</Label>
          <div className="flex gap-2 flex-wrap">
            {["ALL","TEACHING","NON_TEACHING"].map(v=>(
              <label key={v} className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer font-medium transition-all ${
                form.applicable_to.includes(v)?"bg-primary text-primary-foreground border-primary":"border-border text-muted-foreground hover:bg-muted"
              }`}>
                <input type="checkbox" checked={form.applicable_to.includes(v)} onChange={()=>toggleApplicable(v)} className="sr-only"/>
                {v}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Chk k="is_paid"           label="Paid leave"/>
          <Chk k="carry_forward"     label="Carry forward"/>
          <Chk k="requires_document" label="Document required"/>
          <Chk k="is_active"         label="Active"/>
        </div>

        {form.carry_forward && (
          <div className="space-y-1.5">
            <Label className="text-xs">Max Carry Forward Days</Label>
            <Input type="number" value={form.carry_forward_max} onChange={e=>setForm(f=>({...f,carry_forward_max:e.target.value}))} placeholder="No limit"/>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description…"/>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving?<Loader2 size={13} className="mr-1.5 animate-spin"/>:<Save size={13} className="mr-1.5"/>}Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveTypesPage() {
  const [types,   setTypes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  const load = () => {
    setLoading(true);
    axiosInstance.get("/leave/types?all=true")
      .then(r => setTypes(r.data?.data||[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Toggle active/inactive (soft deactivate)
  const toggleActive = async (t) => {
    try {
      await axiosInstance.patch(`/leave/types/${t.id}`, { is_active: !t.is_active });
      notify.success(t.is_active ? "Deactivated" : "Activated");
      load();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
  };

  const del = async (id, name, active) => {
    if (active) { notify.error("Deactivate first before deleting"); return; }
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await axiosInstance.delete(`/leave/types/${id}`); notify.success("Deleted"); load(); }
    catch(e){ notify.error(e.response?.data?.message||"Cannot delete — check if leave applications use this type"); }
  };

  const addPresets = async () => {
    let added = 0;
    for (const p of PRESETS) {
      try {
        await axiosInstance.post("/leave/types", { ...p, min_days: p.min_days||0.5, is_active:true });
        added++;
      } catch {} // skip duplicates
    }
    notify.success(`${added} leave types added`);
    load();
  };

  const APPLY_COLOR = { ALL:"bg-blue-100 text-blue-700", TEACHING:"bg-green-100 text-green-700", NON_TEACHING:"bg-amber-100 text-amber-700" };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-primary"/>
          <div>
            <h1 className="text-xl font-bold">Leave Types</h1>
            <p className="text-sm text-muted-foreground">Manage leave categories — CL, EL, ML, OD, etc.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addPresets}>+ Add Standard Types</Button>
          <Button size="sm" onClick={()=>setModal("new")}><Plus size={13} className="mr-1.5"/>Create Type</Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <strong>Standard leave types:</strong> CL (Casual), EL (Earned), ML (Medical), PL (Paternity), MAL (Maternity), CCL (Child Care), OD (On Duty), CML (Compensatory), LWP (Without Pay). Click "Add Standard Types" to add all at once.
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>
      ) : types.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
          <ClipboardList size={28} className="mx-auto text-muted-foreground/20"/>
          <p className="text-sm text-muted-foreground">No leave types defined yet</p>
          <Button variant="outline" size="sm" onClick={addPresets}>Add Standard Types</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 px-4 py-2 border-b border-border">
            <span className="col-span-1">Code</span>
            <span className="col-span-3">Name</span>
            <span className="col-span-2">Applicable</span>
            <span className="col-span-1 text-center">Days/Yr</span>
            <span className="col-span-2">Options</span>
            <span className="col-span-1 text-center">Status</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          <div className="divide-y divide-border">
            {types.map(t=>(
              <div key={t.id} className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/10 ${!t.is_active?"opacity-50":""}`}>
                <span className="col-span-1 text-sm font-bold text-primary">{t.code}</span>
                <div className="col-span-3">
                  <p className="text-sm font-medium">{t.name}</p>
                  {t.description && <p className="text-[10px] text-muted-foreground truncate">{t.description}</p>}
                </div>
                <div className="col-span-2 flex flex-wrap gap-0.5">
                  {(t.applicable_to||[]).map(a=>(
                    <span key={a} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${APPLY_COLOR[a]||"bg-muted text-muted-foreground"}`}>{a}</span>
                  ))}
                </div>
                <span className="col-span-1 text-xs text-center font-semibold">{t.max_days_per_year||"∞"}</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {t.is_paid       && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Paid</span>}
                  {t.carry_forward && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">CF</span>}
                  {t.requires_document && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Doc</span>}
                </div>
                <div className="col-span-1 flex justify-center">
                  {t.is_active
                    ? <CheckCircle size={14} className="text-green-500"/>
                    : <XCircle    size={14} className="text-muted-foreground"/>}
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <button onClick={()=>setModal(t)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Edit"><Edit2 size={12}/></button>
                  <button onClick={()=>toggleActive(t)} className={`p-1.5 rounded ${t.is_active?"hover:bg-amber-50 text-amber-600":"hover:bg-green-50 text-green-600"}`} title={t.is_active?"Deactivate":"Activate"}>{t.is_active?<Lock size={12}/>:<Unlock size={12}/>}</button>
                  <button onClick={()=>del(t.id, t.name, t.is_active)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <TypeModal
          type={modal==="new"?null:modal}
          onClose={()=>setModal(null)}
          onSave={()=>{ setModal(null); load(); }}
        />
      )}
    </div>
  );
}