// src/modules/adminss/holiday/pages/LeaveRulesPage.jsx
import { useState, useEffect } from "react";
import { Settings, Plus, Save, Loader2, X, Edit2, PlayCircle, Info, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

// ── Tooltip helper ────────────────────────────────────────────
function Tip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button type="button" onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
        className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] font-bold inline-flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">?</button>
      {show && (
        <div className="absolute z-50 bottom-5 left-0 w-64 bg-popover border border-border rounded-xl p-3 text-xs text-popover-foreground shadow-xl">
          {text}
        </div>
      )}
    </span>
  );
}

// ── Field explanation data ────────────────────────────────────
const EXPLANATIONS = {
  credit_mode: {
    SESSION:   "All leave days are credited at once at the start of the academic session (e.g. 15 CL credited on June 1).",
    MONTHLY:   "Leave days are credited every month on a fixed day (e.g. 1.5 CL on the 1st of every month = 18 days/year).",
    QUARTERLY: "Leave days are credited every 3 months (e.g. 5 days per quarter = 20 days/year).",
  },
  session_credit: "Total number of leave days given at the start of the session. Example: 15 means the employee gets 15 Casual Leaves at the beginning of June.",
  monthly_credit: "Days credited each month. Example: 1.5 means employee gets 1.5 CL on the 1st of every month. Multiply by 12 = 18 days/year.",
  max_per_year:   "Hard cap — even if credits accumulate, balance cannot exceed this. Leave blank for no limit.",
  carry_forward:  "Should unused leave balance be carried over to next session? Example: if employee has 5 unused CLs, they move to next year.",
  carry_forward_max:"Maximum days that can be carried. Example: 10 means only 10 days carry over even if 20 are remaining.",
  pro_rata:       "If an employee joins mid-session, credit proportional to remaining months. Example: joining in September gets 9/12 of the full credit.",
  min_days:       "Minimum leave duration per application. 0.5 = half day, 1 = full day minimum.",
  max_consecutive:"Maximum continuous days allowed in one application. Example: 10 means cannot apply for more than 10 consecutive days.",
  notice_days:    "Advance notice required before the leave starts. Example: 1 = must apply at least 1 day before.",
  sandwich_rule:  "If leave is sandwiched between weekends (Sat-Mon leave counts Sun also as leave). Prevents misuse of weekend buffer.",
  requires_document:"Always require a supporting document regardless of duration.",
  document_threshold:"Document is required only if leave exceeds this many days. Example: 3 means document needed only for 4+ day leaves.",
  encashable:     "Can unused leave be converted to cash? Applicable for Earned Leave typically.",
  allow_negative: "Allow employee to take leave even if balance is 0 (advance leave). They repay when next credit happens.",
};

// ── Rule Modal ────────────────────────────────────────────────
function RuleModal({ rule, leaveTypes, onClose, onSave }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    leave_type_id:      rule?.leave_type_id      || "",
    employee_type:      rule?.employee_type      || "ALL",
    contract_type:      rule?.contract_type      || "ALL",
    credit_mode:        rule?.credit_mode        || "SESSION",
    session_credit:     rule?.session_credit     || 15,
    monthly_credit:     rule?.monthly_credit     || 1.5,
    quarterly_credit:   rule?.quarterly_credit   || 0,
    credit_on_day:      rule?.credit_on_day      || 1,
    pro_rata:           rule?.pro_rata           !== false,
    carry_forward:      rule?.carry_forward      || false,
    carry_forward_max:  rule?.carry_forward_max  || "",
    max_consecutive:    rule?.max_consecutive    || "",
    min_notice_days:    rule?.min_notice_days    || 0,
    requires_document:  rule?.requires_document  || false,
    document_threshold: rule?.document_threshold || 3,
    sandwich_rule:      rule?.sandwich_rule      || false,
    encashable:         rule?.encashable         || false,
    max_per_year:       rule?.max_per_year       || "",
    min_days:           rule?.min_days           || 0.5,
    allow_negative:     rule?.allow_negative     || false,
    is_active:          rule?.is_active          !== false,
    notes:              rule?.notes              || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.leave_type_id) { notify.error("Select a leave type"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        max_consecutive:    form.max_consecutive    || null,
        carry_forward_max:  form.carry_forward_max  || null,
        max_per_year:       form.max_per_year       || null,
      };
      if (rule?.id) {
        await axiosInstance.patch(`/holidays/leave-rules/${rule.id}`, payload);
        notify.success("Rule updated");
      } else {
        await axiosInstance.post("/holidays/leave-rules", payload);
        notify.success("Rule created");
      }
      onSave();
    } catch(e){ notify.error(e.response?.data?.message || "Failed to save"); }
    finally{ setSaving(false); }
  };

  const Chk = ({ k, label, tip }) => (
    <label className="flex items-start gap-2 cursor-pointer text-sm">
      <input type="checkbox" checked={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.checked}))}
        className="w-4 h-4 accent-primary mt-0.5 shrink-0"/>
      <span>{label}{tip && <Tip text={tip}/>}</span>
    </label>
  );

  const noTypes = leaveTypes.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <h3 className="font-semibold">{rule ? "Edit Leave Rule" : "Create Leave Rule"}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* No leave types warning */}
          {noTypes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-700">
              <AlertCircle size={14} className="shrink-0 mt-0.5"/>
              <div>
                <p className="font-semibold">No leave types found</p>
                <p className="text-xs mt-0.5">You need to create leave types (CL, EL, ML etc.) before creating rules.</p>
                <button onClick={()=>{ onClose(); navigate("/admin/leave/types"); }}
                  className="text-xs underline font-medium mt-1">Go to Leave Types →</button>
              </div>
            </div>
          )}

          {/* Leave Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Leave Type *
              <Tip text="Select which leave category this rule applies to. Create leave types first from Leave → Leave Types."/>
            </Label>
            <select value={form.leave_type_id} onChange={e=>setForm(f=>({...f,leave_type_id:e.target.value}))}
              className={sel + (noTypes?" opacity-50":"")}>
              <option value="">Select leave type…</option>
              {leaveTypes.map(t=>(
                <option key={t.id} value={t.id}>{t.name} ({t.code}) — {t.applicable_to?.join(", ")}</option>
              ))}
            </select>
            {noTypes && (
              <button onClick={()=>{ onClose(); navigate("/admin/leave/types"); }}
                className="text-xs text-primary hover:underline">+ Create Leave Types first</button>
            )}
          </div>

          {/* Employee & Contract Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Employee Type
                <Tip text="Restrict this rule to Teaching or Non-Teaching staff only. 'ALL' applies to everyone."/>
              </Label>
              <select value={form.employee_type} onChange={e=>setForm(f=>({...f,employee_type:e.target.value}))} className={sel}>
                <option value="ALL">ALL — Everyone</option>
                <option value="TEACHING">TEACHING — Faculty only</option>
                <option value="NON_TEACHING">NON_TEACHING — Support staff only</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Contract Type
                <Tip text="Restrict to permanent, contract or visiting employees. 'ALL' applies to everyone."/>
              </Label>
              <select value={form.contract_type} onChange={e=>setForm(f=>({...f,contract_type:e.target.value}))} className={sel}>
                <option value="ALL">ALL — Every contract</option>
                <option value="PERMANENT">PERMANENT only</option>
                <option value="CONTRACT">CONTRACT only</option>
                <option value="VISITING">VISITING only</option>
              </select>
            </div>
          </div>

          {/* Credit Mode */}
          <div className="bg-muted/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Credit Configuration</p>
              <Info size={14} className="text-muted-foreground"/>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Credit Mode
                <Tip text="How leaves are credited to employee balance."/>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {["SESSION","MONTHLY","QUARTERLY"].map(m=>(
                  <label key={m} className={`text-center py-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${form.credit_mode===m?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:border-primary/50"}`}>
                    <input type="radio" value={m} checked={form.credit_mode===m}
                      onChange={()=>setForm(f=>({...f,credit_mode:m}))} className="sr-only"/>
                    {m}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                {EXPLANATIONS.credit_mode[form.credit_mode]}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {form.credit_mode === "SESSION" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Session Credit (days)
                    <Tip text={EXPLANATIONS.session_credit}/>
                  </Label>
                  <Input type="number" value={form.session_credit}
                    onChange={e=>setForm(f=>({...f,session_credit:e.target.value}))} placeholder="15"/>
                  <p className="text-[10px] text-muted-foreground">e.g. 15 = employee gets 15 days at session start</p>
                </div>
              )}
              {form.credit_mode === "MONTHLY" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Per Month (days)
                      <Tip text={EXPLANATIONS.monthly_credit}/>
                    </Label>
                    <Input type="number" step="0.5" value={form.monthly_credit}
                      onChange={e=>setForm(f=>({...f,monthly_credit:e.target.value}))} placeholder="1.5"/>
                    <p className="text-[10px] text-muted-foreground">
                      {form.monthly_credit} × 12 = <strong>{(parseFloat(form.monthly_credit)||0)*12}</strong> days/year
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Credit on Day of Month</Label>
                    <Input type="number" min="1" max="28" value={form.credit_on_day}
                      onChange={e=>setForm(f=>({...f,credit_on_day:e.target.value}))} placeholder="1"/>
                    <p className="text-[10px] text-muted-foreground">e.g. 1 = credit on 1st of every month</p>
                  </div>
                </>
              )}
              {form.credit_mode === "QUARTERLY" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Per Quarter (days)</Label>
                  <Input type="number" value={form.quarterly_credit}
                    onChange={e=>setForm(f=>({...f,quarterly_credit:e.target.value}))}/>
                  <p className="text-[10px] text-muted-foreground">
                    {form.quarterly_credit} × 4 = <strong>{(parseFloat(form.quarterly_credit)||0)*4}</strong> days/year
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Max per Year
                  <Tip text={EXPLANATIONS.max_per_year}/>
                </Label>
                <Input type="number" value={form.max_per_year}
                  onChange={e=>setForm(f=>({...f,max_per_year:e.target.value}))} placeholder="No limit"/>
              </div>
            </div>
          </div>

          {/* Usage Rules */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Min Days per Application
                <Tip text={EXPLANATIONS.min_days}/>
              </Label>
              <select value={form.min_days} onChange={e=>setForm(f=>({...f,min_days:parseFloat(e.target.value)}))} className={sel}>
                <option value={0.5}>0.5 — Half day allowed</option>
                <option value={1}>1 — Full day minimum</option>
                <option value={2}>2 — Two days minimum</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Max Consecutive Days
                <Tip text={EXPLANATIONS.max_consecutive}/>
              </Label>
              <Input type="number" value={form.max_consecutive}
                onChange={e=>setForm(f=>({...f,max_consecutive:e.target.value}))} placeholder="No limit"/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Notice Days Required
                <Tip text={EXPLANATIONS.notice_days}/>
              </Label>
              <Input type="number" value={form.min_notice_days}
                onChange={e=>setForm(f=>({...f,min_notice_days:e.target.value}))}/>
              <p className="text-[10px] text-muted-foreground">0 = can apply on same day</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Document Required after (days)
                <Tip text={EXPLANATIONS.document_threshold}/>
              </Label>
              <Input type="number" value={form.document_threshold}
                onChange={e=>setForm(f=>({...f,document_threshold:e.target.value}))} placeholder="3"/>
              <p className="text-[10px] text-muted-foreground">e.g. 3 = doc needed only for 4+ day leaves</p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="bg-muted/20 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Options</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Chk k="carry_forward"     label="Carry forward to next session" tip={EXPLANATIONS.carry_forward}/>
              <Chk k="pro_rata"          label="Pro-rata credit on joining"     tip={EXPLANATIONS.pro_rata}/>
              <Chk k="sandwich_rule"     label="Sandwich rule (count weekends)" tip={EXPLANATIONS.sandwich_rule}/>
              <Chk k="requires_document" label="Always require document"        tip={EXPLANATIONS.requires_document}/>
              <Chk k="encashable"        label="Encashable"                     tip={EXPLANATIONS.encashable}/>
              <Chk k="allow_negative"    label="Allow advance leave"            tip={EXPLANATIONS.allow_negative}/>
              <Chk k="is_active"         label="Active (rule will be applied)"/>
            </div>
          </div>

          {/* Carry forward max */}
          {form.carry_forward && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Max Carry Forward Days
                <Tip text={EXPLANATIONS.carry_forward_max}/>
              </Label>
              <Input type="number" value={form.carry_forward_max}
                onChange={e=>setForm(f=>({...f,carry_forward_max:e.target.value}))} placeholder="No limit"/>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Internal Notes</Label>
            <Input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
              placeholder="e.g. Applies to permanent teaching staff from June session"/>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving || noTypes} onClick={save}>
            {saving ? <Loader2 size={13} className="mr-1.5 animate-spin"/> : <Save size={13} className="mr-1.5"/>}
            {rule ? "Update" : "Create"} Rule
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LeaveRulesPage() {
  const navigate = useNavigate();
  const [rules,      setRules]      = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [running,    setRunning]    = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/holidays/leave-rules").catch(()=>({data:{data:[]}})),
      // ?all=true fetches inactive types too — more comprehensive
      axiosInstance.get("/leave/types?all=true").catch(()=>({data:{data:[]}})),
      axiosInstance.get("/sessions?limit=10").catch(()=>({data:{data:[]}})),
    ]).then(([rRes, tRes, sRes]) => {
      setRules(rRes.data?.data      || []);
      setLeaveTypes(tRes.data?.data || []);
      setSessions(sRes.data?.data   || []);
    }).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); }, []);

  const runCredit = async () => {
    const ay = prompt(
      "Academic year (e.g. 2025-26):",
      `${new Date().getFullYear()}-${(new Date().getFullYear()+1).toString().slice(2)}`
    );
    if (!ay) return;
    setRunning(true);
    try {
      const r = await axiosInstance.post("/holidays/leave-credit/run", { academic_year:ay, credit_type:"SESSION" });
      notify.success(`${r.data?.data?.credited || 0} credits applied to faculty`);
    } catch(e){ notify.error(e.response?.data?.message || "Failed"); }
    finally{ setRunning(false); }
  };

  const CREDIT_COLOR = {
    SESSION:   "bg-blue-100 text-blue-700",
    MONTHLY:   "bg-green-100 text-green-700",
    QUARTERLY: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-primary"/>
          <div>
            <h1 className="text-xl font-bold">Leave Credit Rules</h1>
            <p className="text-sm text-muted-foreground">Configure how leaves are auto-credited to employees</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={running} onClick={runCredit}>
            {running ? <Loader2 size={12} className="mr-1.5 animate-spin"/> : <PlayCircle size={12} className="mr-1.5"/>}
            Run Session Credit
          </Button>
          <Button size="sm" onClick={()=>setModal("new")}><Plus size={13} className="mr-1.5"/>Create Rule</Button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-sm text-blue-800">
        <p className="font-semibold flex items-center gap-1.5"><Info size={14}/>How leave credit rules work:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            { mode:"SESSION",   ex:"15 CL on June 1",      desc:"All leave days credited at session start in one go" },
            { mode:"MONTHLY",   ex:"1.5 CL on 1st of month",desc:"Leave days trickle in every month automatically" },
            { mode:"QUARTERLY", ex:"5 EL every 3 months",  desc:"Credited 4 times a year at quarter start" },
          ].map(({mode,ex,desc})=>(
            <div key={mode} className="bg-white/70 rounded-xl p-3 space-y-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${CREDIT_COLOR[mode]}`}>{mode}</span>
              <p className="text-xs font-semibold mt-1">{ex}</p>
              <p className="text-[10px] text-blue-700">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-1">Click <strong>"Run Session Credit"</strong> to manually trigger session-start crediting for all eligible faculty.</p>
      </div>

      {/* No leave types warning */}
      {!loading && leaveTypes.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5"/>
          <div className="space-y-1">
            <p className="font-semibold">No leave types configured</p>
            <p className="text-xs">You must create leave types (CL, EL, ML, OD etc.) before creating credit rules.</p>
            <button onClick={()=>navigate("/admin/leave/types")}
              className="text-xs underline font-semibold">→ Go to Leave Types</button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>
      ) : rules.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
          <Settings size={28} className="mx-auto text-muted-foreground/20"/>
          <p className="text-sm font-medium">No leave rules yet</p>
          <p className="text-xs text-muted-foreground">Create a rule for each leave type to enable auto-credit</p>
          <Button variant="outline" size="sm" onClick={()=>setModal("new")}><Plus size={12} className="mr-1"/>Create First Rule</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r=>(
            <div key={r.id} className={`bg-card border rounded-2xl p-4 ${r.is_active?"border-border":"border-border opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{r.leave_type?.name} <span className="text-muted-foreground">({r.leave_type?.code})</span></p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${CREDIT_COLOR[r.credit_mode]}`}>{r.credit_mode}</span>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded">{r.employee_type}</span>
                    {!r.is_active && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">INACTIVE</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                    {r.credit_mode==="SESSION"  && <span>Session credit: <strong className="text-foreground">{r.session_credit} days</strong></span>}
                    {r.credit_mode==="MONTHLY"  && <span>Monthly: <strong className="text-foreground">{r.monthly_credit}d on day {r.credit_on_day}</strong> = {(r.monthly_credit||0)*12}d/year</span>}
                    {r.credit_mode==="QUARTERLY"&& <span>Quarterly: <strong className="text-foreground">{r.quarterly_credit}d</strong> = {(r.quarterly_credit||0)*4}d/year</span>}
                    {r.max_per_year    && <span>Max/year: <strong className="text-foreground">{r.max_per_year}d</strong></span>}
                    {r.carry_forward   && <span>Carry fwd: <strong className="text-foreground">{r.carry_forward_max||"unlimited"}d</strong></span>}
                    {r.sandwich_rule   && <span className="text-amber-600">Sandwich ✓</span>}
                    {r.encashable      && <span className="text-green-600">Encashable ✓</span>}
                    {r.pro_rata        && <span className="text-blue-600">Pro-rata ✓</span>}
                    {r.allow_negative  && <span className="text-violet-600">Advance leave ✓</span>}
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                </div>
                <button onClick={()=>setModal(r)} className="p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0">
                  <Edit2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <RuleModal
          rule={modal==="new" ? null : modal}
          leaveTypes={leaveTypes}
          sessions={sessions}
          onClose={()=>setModal(null)}
          onSave={()=>{ setModal(null); load(); }}
        />
      )}
    </div>
  );
}