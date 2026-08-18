// src/modules/adminss/personal/pages/MyProfilePage.jsx
// Common for ALL admin/faculty users — profile, timetable, attendance, leave, password
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { User, Lock, Eye, EyeOff, Save, Loader2, CheckCircle, Calendar } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const TYPE_CLS = { LECTURE:"bg-blue-50 text-blue-800 border-blue-200", LAB:"bg-green-50 text-green-800 border-green-200", TUTORIAL:"bg-violet-50 text-violet-800 border-violet-200" };

function ChangePassword() {
  const [form, setForm] = useState({ current:"", newPwd:"", confirm:"" });
  const [show, setShow] = useState({});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.current||!form.newPwd) { notify.error("Fill all fields"); return; }
    if (form.newPwd.length<8)        { notify.error("Min 8 chars"); return; }
    if (form.newPwd!==form.confirm)  { notify.error("Don't match"); return; }
    setSaving(true);
    try {
      await axiosInstance.post("/auth/change-password",{ current_password:form.current, new_password:form.newPwd });
      notify.success("Password changed"); setForm({current:"",newPwd:"",confirm:""});
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };
  return (
    <div className="space-y-4 max-w-sm">
      {[["Current Password","current","c"],["New Password","newPwd","n"],["Confirm Password","confirm","cf"]].map(([l,k,sk])=>(
        <div key={k} className="space-y-1.5">
          <Label className="text-xs">{l}</Label>
          <div className="relative">
            <Input type={show[sk]?"text":"password"} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="pr-10"/>
            <button type="button" onClick={()=>setShow(s=>({...s,[sk]:!s[sk]}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show[sk]?<EyeOff size={14}/>:<Eye size={14}/>}
            </button>
          </div>
        </div>
      ))}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving?<Loader2 size={13} className="mr-1.5 animate-spin"/>:<Lock size={13} className="mr-1.5"/>}Change Password
      </Button>
    </div>
  );
}

function MyTimetable({ facultyId, sessions }) {
  const [sessionId,setSessionId]=useState("");
  const [entries, setEntries]  = useState([]);
  const [periods, setPeriods]  = useState([]);
  const [loading, setLoading]  = useState(false);

  useEffect(()=>{ const cur=sessions.find(s=>s.is_current); if(cur) setSessionId(cur.id); },[sessions]);

  useEffect(()=>{
    if (!facultyId||!sessionId){ return; }
    setLoading(true);
    Promise.all([
      axiosInstance.get(EP.timetable.periods(sessionId)).catch(()=>({data:{data:[]}})),
      axiosInstance.get(EP.timetable.global, { params:{ session_id:sessionId } }).catch(()=>({data:{data:[]}})),
    ]).then(([pRes,ttRes])=>{
      setPeriods((pRes.data?.data||[]).filter(p=>!["LUNCH","BREAK","ASSEMBLY"].includes(p.type)));
      const mine=(ttRes.data?.data||[]).flatMap(tt=>(tt.entries||[]).filter(e=>e.faculty_id===facultyId).map(e=>({...e,section:tt.section})));
      setEntries(mine);
    }).finally(()=>setLoading(false));
  },[facultyId,sessionId]);

  if (!facultyId) return <p className="text-sm text-muted-foreground">No faculty profile linked to your account.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground">Session:</label>
        <select value={sessionId} onChange={e=>setSessionId(e.target.value)} className="h-9 px-3 rounded-lg border border-input bg-background text-sm min-w-44">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{entries.length} classes/week</span>
      </div>
      {loading ? <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div> : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="border-collapse text-xs w-full" style={{minWidth:"700px"}}>
            <thead>
              <tr>
                <th className="sticky left-0 bg-muted border-b border-r border-border px-3 py-2 text-left text-muted-foreground min-w-[110px]">Period</th>
                {DAYS.map(d=><th key={d} className="px-2 py-2 border-b border-r border-border bg-muted text-center min-w-[120px] font-semibold">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {periods.map(p=>(
                <tr key={p.id}>
                  <td className="sticky left-0 bg-card border-b border-r border-border px-3 py-2">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.start_time}–{p.end_time}</p>
                  </td>
                  {DAYS.map(day=>{
                    const e=entries.find(e=>e.day===day&&e.period_config_id===p.id);
                    return <td key={day} className="border-b border-r border-border p-1.5">
                      {e ? <div className={`rounded-lg p-2 min-h-[52px] border ${TYPE_CLS[e.entry_type]||"bg-muted text-foreground border-border"}`}>
                        <p className="font-bold text-[11px] truncate">{e.subject?.code||"—"}</p>
                        <p className="text-[10px] truncate opacity-80">{e.subject?.name}</p>
                        <p className="text-[10px] font-medium truncate mt-0.5">{e.section?.name} · Sem {e.section?.semester}</p>
                        {e.room&&<p className="text-[9px] opacity-60">📍{e.room.code}</p>}
                      </div> : <div className="min-h-[52px] flex items-center justify-center text-muted-foreground/20">—</div>}
                    </td>;
                  })}
                </tr>
              ))}
              {!periods.length && <tr><td colSpan={7} className="text-center py-6 text-sm text-muted-foreground">No periods configured for this session</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MyLeave({ facultyId }) {
  const [leaves, setLeaves]   = useState([]);
  const [types,  setTypes]    = useState([]);
  const [balance,setBalance]  = useState(null);
  const [show,   setShow]     = useState(false);
  const [form,   setForm]     = useState({ leave_type_id:"",from_date:"",to_date:"",reason:"" });
  const [saving, setSaving]   = useState(false);
  const [loading,setLoading]  = useState(true);
  const load = () => {
    if(!facultyId) return;
    setLoading(true);
    Promise.all([
      axiosInstance.get(`/leave/faculty/${facultyId}`).catch(()=>({data:{data:[]}})),
      axiosInstance.get(`/leave/balance/${facultyId}`).catch(()=>({data:{data:null}})),
      axiosInstance.get(`/leave/types`).catch(()=>({data:{data:[]}})),
    ]).then(([l,b,t])=>{ setLeaves(l.data?.data||[]); setBalance(b.data?.data); setTypes(t.data?.data||[]); })
    .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[facultyId]);

  const apply = async () => {
    if(!form.leave_type_id||!form.from_date||!form.to_date||!form.reason){ notify.error("Fill all fields"); return; }
    setSaving(true);
    try { await axiosInstance.post(`/leave/faculty/${facultyId}/submit`,form); notify.success("Applied"); setShow(false); setForm({leave_type_id:"",from_date:"",to_date:"",reason:""}); load(); }
    catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  const SC = { PENDING:"bg-amber-100 text-amber-700",APPROVED:"bg-green-100 text-green-700",REJECTED:"bg-red-100 text-red-700",CANCELLED:"bg-gray-100 text-gray-600" };
  if(!facultyId) return <p className="text-sm text-muted-foreground">No faculty profile linked.</p>;
  return (
    <div className="space-y-4 max-w-2xl">
      {balance?.balances?.length>0 && (
        <div className="flex gap-2 flex-wrap">
          {balance.balances.map(b=>(
            <div key={b.id} className="bg-card border border-border rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-xl font-bold text-primary">{Math.max(0,(b.total_days||0)-(b.used_days||0)).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">{b.leaveType?.code||"—"}</p>
              <p className="text-[9px] text-muted-foreground">avail</p>
            </div>
          ))}
        </div>
      )}
      <Button size="sm" onClick={()=>setShow(v=>!v)}>{show?"Cancel":"+ Apply Leave"}</Button>
      {show && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Leave Type *</Label>
              <select value={form.leave_type_id} onChange={e=>setForm(f=>({...f,leave_type_id:e.target.value}))} className={sel}>
                <option value="">Select…</option>
                {types.map(t=><option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">From *</Label><Input type="date" value={form.from_date} onChange={e=>setForm(f=>({...f,from_date:e.target.value}))}/></div>
            <div className="space-y-1.5"><Label className="text-xs">To *</Label><Input type="date" value={form.to_date} min={form.from_date} onChange={e=>setForm(f=>({...f,to_date:e.target.value}))}/></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Reason *</Label>
            <textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none outline-none focus:ring-2 focus:ring-ring"/>
          </div>
          <Button onClick={apply} disabled={saving} size="sm">
            {saving?<Loader2 size={12} className="mr-1 animate-spin"/>:<Save size={12} className="mr-1"/>}Submit
          </Button>
        </div>
      )}
      {loading ? <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground"/></div> : (
        <div className="space-y-2">
          {leaves.map(l=>(
            <div key={l.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{l.leaveType?.name||"—"} <span className="text-xs text-muted-foreground">({l.total_days}d)</span></p>
                <p className="text-xs text-muted-foreground">{fmt(l.from_date)} → {fmt(l.to_date)}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SC[l.status]||"bg-muted text-muted-foreground"}`}>{l.status}</span>
            </div>
          ))}
          {!leaves.length && <p className="text-sm text-muted-foreground text-center py-4">No leave applications</p>}
        </div>
      )}
    </div>
  );
}

export default function MyProfilePage() {
  const user    = useSelector(s => s.auth?.user);
  const faculty = user?.faculty;
  const [tab,      setTab]      = useState("Profile");
  const [sessions, setSessions] = useState([]);

  useEffect(()=>{ axiosInstance.get(EP.sessions.list).then(r=>setSessions(r.data?.data||[])).catch(()=>{}); },[]);

  const TABS = ["Profile","My Timetable","My Leave","Change Password"].filter(t => t!=="My Timetable" || !!faculty?.id);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-2"><User size={20} className="text-primary"/><h1 className="text-xl font-bold">My Profile & Settings</h1></div>
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab===t?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==="Profile" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0">
              {(faculty?.name||user?.email||"U")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{faculty?.name||user?.email}</h2>
              {faculty && <p className="text-sm text-muted-foreground">{faculty.designation} · {faculty.department?.name}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">Role: <strong>{user?.role}</strong> · {user?.email}</p>
              {faculty?.emp_id && <p className="text-xs text-muted-foreground">Emp ID: {faculty.emp_id}</p>}
            </div>
          </div>
          {faculty && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ["Department",    faculty.department?.name],
                ["Designation",   faculty.designation],
                ["Emp ID",        faculty.emp_id],
                ["Phone",         faculty.phone],
                ["Joining Date",  fmt(faculty.joining_date)],
                ["Teaching",      faculty.is_teaching!==false?"Yes":"No"],
                ["On Campus",     faculty.lives_on_campus?"Yes":"No"],
                ["Accommodation", faculty.accommodation_type],
                ["Quarter / Room",faculty.campus_quarter_no],
              ].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} className="bg-muted/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="text-sm font-medium">{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="My Timetable" && <MyTimetable facultyId={faculty?.id} sessions={sessions}/>}
      {tab==="My Leave"     && <MyLeave facultyId={faculty?.id}/>}
      {tab==="Change Password" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Minimum 8 characters required.</p>
          <ChangePassword/>
        </div>
      )}
    </div>
  );
}