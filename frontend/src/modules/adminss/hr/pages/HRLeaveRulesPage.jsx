// src/modules/adminss/hr/pages/HRLeaveRulesPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Users, ChevronDown, ChevronUp, Loader2, CheckCircle, Calendar } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";

const LEAVE_TYPES = [
  { key:"CL",   label:"Casual Leave",          color:"bg-blue-50 text-blue-700 border-blue-200"   },
  { key:"EL",   label:"Earned Leave",           color:"bg-green-50 text-green-700 border-green-200" },
  { key:"ML",   label:"Medical/Sick Leave",     color:"bg-red-50 text-red-700 border-red-200"      },
  { key:"SL",   label:"Special Leave",          color:"bg-violet-50 text-violet-700 border-violet-200" },
  { key:"LWP",  label:"Leave Without Pay",      color:"bg-amber-50 text-amber-700 border-amber-200" },
  { key:"SLOT", label:"Winter/Summer Slot",     color:"bg-cyan-50 text-cyan-700 border-cyan-200"   },
  { key:"OD",   label:"On Duty",                color:"bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const inp = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none";

export default function HRLeaveRulesPage() {
  const navigate = useNavigate();
  const [policies, setPolicies]     = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showRuleForm,   setShowRuleForm]   = useState(null); // policy_id
  const [showSlotForm,   setShowSlotForm]   = useState(false);
  const [slots,    setSlots]        = useState([]);
  const [saving,   setSaving]       = useState(false);
  const [initing,  setIniting]      = useState("");

  const [pForm, setPForm] = useState({ name:"", session_id:"", staff_type:"ALL" });
  const [rForm, setRForm] = useState({ leave_type:"CL", label:"Casual Leave", max_per_session:12, max_consecutive:3, max_in_month:2, requires_cover:true, is_slot_based:false, min_notice_days:1, applies_to:"ALL", carry_forward:false });
  const [sForm, setSForm] = useState({ name:"", slot_type:"WINTER", session_id:"", start_date:"", end_date:"", max_leaves:15, staff_type:"ALL" });

  const load = () => {
    Promise.all([
      axiosInstance.get("/api/hr/leave/policies"),
      axiosInstance.get("/api/sessions"),
      axiosInstance.get("/api/hr/leave/slots"),
    ]).then(([pRes, sesRes, slRes]) => {
      setPolicies(pRes.data?.data || []);
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) {
        setPForm(f => ({...f, session_id:cur.id}));
        setSForm(f => ({...f, session_id:cur.id}));
      }
      setSlots(slRes.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const savePolicy = async () => {
    if (!pForm.name || !pForm.session_id) { notify.error("Name and session required"); return; }
    setSaving(true);
    try {
      await axiosInstance.post("/api/hr/leave/policies", pForm);
      notify.success("Policy created");
      setShowPolicyForm(false);
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const saveRule = async (policy_id) => {
    setSaving(true);
    try {
      await axiosInstance.post(`/api/hr/leave/policies/${policy_id}/rules`, rForm);
      notify.success("Rule saved");
      setShowRuleForm(null);
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const saveSlot = async () => {
    if (!sForm.name || !sForm.start_date || !sForm.end_date) { notify.error("All slot fields required"); return; }
    setSaving(true);
    try {
      await axiosInstance.post("/api/hr/leave/slots", sForm);
      notify.success("Slot created");
      setShowSlotForm(false);
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const initBalances = async (policy) => {
    const session_id = policy.session_id;
    setIniting(policy.id);
    try {
      const res = await axiosInstance.post(`/api/hr/leave/policies/${policy.id}/init-balances`, { session_id });
      const d = res.data?.data;
      notify.success(`${d?.faculty_count} faculty × ${d?.rule_count} leave types initialized`);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setIniting(""); }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/hr")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
          <div>
            <h1 className="text-xl font-bold">Leave Rules & Policies</h1>
            <p className="text-sm text-muted-foreground">Set leave quotas, rules, and winter/summer break slots</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSlotForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Calendar size={14}/>Add Slot
          </button>
          <button onClick={() => setShowPolicyForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14}/>New Policy
          </button>
        </div>
      </div>

      {/* Leave Slots */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Calendar size={13}/>Winter / Summer Break Slots
        </p>
        {slots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No slots defined yet. Add slots for faculty to apply leave during breaks.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slots.map(sl => (
              <div key={sl.id} className={`rounded-xl border px-3 py-2.5 ${sl.slot_type==="WINTER"?"bg-blue-50 border-blue-200":"bg-amber-50 border-amber-200"}`}>
                <p className="text-sm font-semibold">{sl.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sl.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} → {new Date(sl.end_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}
                  {" · "} Max {sl.max_leaves} days · {sl.staff_type}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policies */}
      {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <div className="space-y-3">
          {policies.length === 0 && (
            <div className="text-center py-10 bg-card border border-border rounded-2xl text-sm text-muted-foreground">
              No policies yet. Create one to set leave quotas for faculty.
            </div>
          )}
          {policies.map(policy => (
            <div key={policy.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Policy header */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20"
                onClick={() => setExpanded(expanded === policy.id ? null : policy.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{policy.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${policy.is_active?"bg-green-50 text-green-700 border-green-200":"bg-muted text-muted-foreground border-border"}`}>
                      {policy.is_active?"Active":"Inactive"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-semibold">{policy.staff_type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{policy.rules?.length || 0} leave types · {policy._count?.balances || 0} faculty enrolled</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={e=>{e.stopPropagation();initBalances(policy);}}
                    disabled={initing===policy.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
                    {initing===policy.id?<Loader2 size={11} className="animate-spin"/>:<Users size={11}/>}
                    Init Balances
                  </button>
                  <button onClick={e=>{e.stopPropagation();setShowRuleForm(policy.id);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40">
                    <Plus size={11}/>Rule
                  </button>
                  {expanded===policy.id?<ChevronUp size={16} className="text-muted-foreground"/>:<ChevronDown size={16} className="text-muted-foreground"/>}
                </div>
              </div>

              {/* Rules */}
              {expanded===policy.id && (
                <div className="border-t border-border">
                  {policy.rules?.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-muted-foreground text-center">No rules defined — click "+ Rule" to add leave types</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="border-b border-border bg-muted/10">
                        <tr>{["Type","Label","Max/Session","Max Consecutive","Max/Month","Notice Days","Cover Reqd","Slot Based","Staff"].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {policy.rules.map(r => (
                          <tr key={r.id} className="hover:bg-muted/20">
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${LEAVE_TYPES.find(l=>l.key===r.leave_type)?.color||"bg-muted text-muted-foreground border-border"}`}>{r.leave_type}</span>
                            </td>
                            <td className="px-3 py-2.5 font-medium">{r.label}</td>
                            <td className="px-3 py-2.5 text-center font-bold">{r.max_per_session}</td>
                            <td className="px-3 py-2.5 text-center">{r.max_consecutive}</td>
                            <td className="px-3 py-2.5 text-center">{r.max_in_month}</td>
                            <td className="px-3 py-2.5 text-center">{r.min_notice_days}d</td>
                            <td className="px-3 py-2.5 text-center">{r.requires_cover?"✓":"—"}</td>
                            <td className="px-3 py-2.5 text-center">{r.is_slot_based?"✓":"—"}</td>
                            <td className="px-3 py-2.5">{r.applies_to}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Policy Form Modal */}
      {showPolicyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">New Leave Policy</h2><button onClick={()=>setShowPolicyForm(false)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">✕</button></div>
            <div className="space-y-3">
              <div className="space-y-1.5"><label className="text-xs font-medium">Policy Name *</label><input className={inp} value={pForm.name} onChange={e=>setPForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Teaching Staff 2025-26"/></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Session *</label>
                <select className={sel} value={pForm.session_id} onChange={e=>setPForm(f=>({...f,session_id:e.target.value}))}>
                  <option value="">Select session…</option>
                  {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Applies To</label>
                <select className={sel} value={pForm.staff_type} onChange={e=>setPForm(f=>({...f,staff_type:e.target.value}))}>
                  <option value="ALL">All Staff</option><option value="TEACHING">Teaching Only</option><option value="NON_TEACHING">Non-Teaching Only</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowPolicyForm(false)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={savePolicy} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">{saving?"Saving…":"Create Policy"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Form Modal */}
      {showRuleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h2 className="font-bold">Add Leave Rule</h2><button onClick={()=>setShowRuleForm(null)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">✕</button></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><label className="text-xs font-medium">Leave Type</label>
                <select className={sel} value={rForm.leave_type} onChange={e=>{const lt=LEAVE_TYPES.find(l=>l.key===e.target.value);setRForm(f=>({...f,leave_type:e.target.value,label:lt?.label||f.label}));}}>
                  {LEAVE_TYPES.map(t=><option key={t.key} value={t.key}>{t.key} — {t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Label</label><input className={inp} value={rForm.label} onChange={e=>setRForm(f=>({...f,label:e.target.value}))}/></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Max per Session</label><input type="number" min="0" className={inp} value={rForm.max_per_session} onChange={e=>setRForm(f=>({...f,max_per_session:+e.target.value}))}/></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Max Consecutive Days</label><input type="number" min="1" className={inp} value={rForm.max_consecutive} onChange={e=>setRForm(f=>({...f,max_consecutive:+e.target.value}))}/></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Max per Month</label><input type="number" min="0" className={inp} value={rForm.max_in_month} onChange={e=>setRForm(f=>({...f,max_in_month:+e.target.value}))}/></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Min Notice (days)</label><input type="number" min="0" className={inp} value={rForm.min_notice_days} onChange={e=>setRForm(f=>({...f,min_notice_days:+e.target.value}))}/></div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Applies To</label>
                <select className={sel} value={rForm.applies_to} onChange={e=>setRForm(f=>({...f,applies_to:e.target.value}))}>
                  <option value="ALL">All Staff</option><option value="TEACHING">Teaching</option><option value="NON_TEACHING">Non-Teaching</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {[["requires_cover","Requires Cover Faculty"],["is_slot_based","Slot-based Only (Winter/Summer)"],["carry_forward","Carry Forward"],["encashable","Encashable"]].map(([k,l])=>(
                <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={rForm[k]} onChange={e=>setRForm(f=>({...f,[k]:e.target.checked}))} className="w-4 h-4 accent-primary"/>{l}
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowRuleForm(null)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={()=>saveRule(showRuleForm)} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">{saving?"Saving…":"Add Rule"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Form Modal */}
      {showSlotForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">Add Break Slot</h2><button onClick={()=>setShowSlotForm(false)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">✕</button></div>
            <div className="space-y-3">
              <div className="space-y-1.5"><label className="text-xs font-medium">Slot Name *</label><input className={inp} value={sForm.name} onChange={e=>setSForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Winter Break 2025"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium">Type</label>
                  <select className={sel} value={sForm.slot_type} onChange={e=>setSForm(f=>({...f,slot_type:e.target.value}))}>
                    <option value="WINTER">Winter Break</option><option value="SUMMER">Summer Break</option><option value="SPECIAL">Special</option>
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium">Max Leaves Allowed</label><input type="number" className={inp} value={sForm.max_leaves} onChange={e=>setSForm(f=>({...f,max_leaves:+e.target.value}))}/></div>
                <div className="space-y-1.5"><label className="text-xs font-medium">From Date *</label><input type="date" className={inp} value={sForm.start_date} onChange={e=>setSForm(f=>({...f,start_date:e.target.value}))}/></div>
                <div className="space-y-1.5"><label className="text-xs font-medium">To Date *</label><input type="date" className={inp} value={sForm.end_date} onChange={e=>setSForm(f=>({...f,end_date:e.target.value}))}/></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Session</label>
                <select className={sel} value={sForm.session_id} onChange={e=>setSForm(f=>({...f,session_id:e.target.value}))}>
                  {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-medium">Applicable To</label>
                <select className={sel} value={sForm.staff_type} onChange={e=>setSForm(f=>({...f,staff_type:e.target.value}))}>
                  <option value="ALL">All Staff</option><option value="TEACHING">Teaching Only</option><option value="NON_TEACHING">Non-Teaching Only</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowSlotForm(false)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={saveSlot} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">{saving?"Saving…":"Create Slot"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
