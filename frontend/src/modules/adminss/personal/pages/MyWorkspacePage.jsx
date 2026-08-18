// src/modules/adminss/workspace/pages/MyWorkspacePage.jsx
// Personal workspace — timetable, leave, attendance, password for ALL admin users
import { useState, useEffect } from "react";
import { useSelector }          from "react-redux";
import { useNavigate }           from "react-router-dom";
import {
  CalendarDays, ClipboardList, CheckCircle, Lock, Eye, EyeOff,
  Save, Loader2, Plus, AlertTriangle, Bell, TrendingUp, Users,
  Clock, BookOpen, ArrowRight, X,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";

const sel  = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const today = () => new Date().toISOString().slice(0,10);
const fmt   = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const DAYS  = ["MON","TUE","WED","THU","FRI","SAT"];
const dayNow = () => ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date().getDay()];
const ENTRY_COLOR = {
  LECTURE:"bg-blue-50 text-blue-800 border-blue-200",
  LAB:"bg-green-50 text-green-800 border-green-200",
  TUTORIAL:"bg-violet-50 text-violet-800 border-violet-200",
};

// ─────────────────────────────────────────────────────────────
// MY TIMETABLE
// ─────────────────────────────────────────────────────────────
function MyTimetable({ facultyId }) {
  const [sessions, setSessions] = useState([]);
  const [sessionId,setSessionId]= useState("");
  const [entries,  setEntries]  = useState([]);
  const [periods,  setPeriods]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const currentDay = dayNow();

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s=>s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!facultyId || !sessionId) return;
    setLoading(true);
    Promise.all([
      axiosInstance.get(EP.timetable.periods(sessionId)).catch(()=>({data:{data:[]}})),
      axiosInstance.get(EP.timetable.global, { params:{ session_id:sessionId } }).catch(()=>({data:{data:[]}})),
    ]).then(([pRes, ttRes]) => {
      setPeriods((pRes.data?.data||[]).filter(p=>!["LUNCH","BREAK","ASSEMBLY"].includes(p.type)));
      const mine = (ttRes.data?.data||[]).flatMap(tt =>
        (tt.entries||[]).filter(e=>e.faculty_id===facultyId).map(e=>({ ...e, section:tt.section }))
      );
      setEntries(mine);
    }).finally(()=>setLoading(false));
  }, [facultyId, sessionId]);

  // Today's classes
  const todayEntries = entries.filter(e => e.day === currentDay);

  if (!facultyId) return (
    <div className="bg-muted/20 rounded-2xl p-6 text-center text-sm text-muted-foreground">
      No faculty profile linked to your account
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <label className="text-xs text-muted-foreground">Session:</label>
        <select value={sessionId} onChange={e=>setSessionId(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm min-w-40">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
        </select>
      </div>

      {/* Today highlight */}
      {todayEntries.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary mb-2">Today ({currentDay}) — {todayEntries.length} class{todayEntries.length!==1?"es":""}</p>
          <div className="flex gap-2 flex-wrap">
            {todayEntries.sort((a,b)=>{
              const ai = periods.findIndex(p=>p.id===a.period_config_id);
              const bi = periods.findIndex(p=>p.id===b.period_config_id);
              return ai-bi;
            }).map(e => {
              const period = periods.find(p=>p.id===e.period_config_id);
              return (
                <div key={e.id} className={`rounded-xl p-2.5 border text-xs min-w-[120px] ${ENTRY_COLOR[e.entry_type]||"bg-muted border-border"}`}>
                  <p className="font-bold">{e.subject?.code}</p>
                  <p className="opacity-80 truncate">{e.section?.name}</p>
                  <p className="text-[10px] mt-0.5 opacity-60">{period?.start_time}–{period?.end_time}</p>
                  <button onClick={()=>navigate(`/admin/attendance/mark?section_id=${e.timetable?.section_id||""}&subject_id=${e.subject_id||""}&period_name=${period?.name||""}`)}
                    className="mt-1.5 text-[10px] bg-white/60 hover:bg-white/80 px-2 py-0.5 rounded font-medium transition-colors w-full text-center">
                    ✓ Mark Attendance
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="border-collapse text-xs w-full" style={{minWidth:"640px"}}>
            <thead>
              <tr>
                <th className="sticky left-0 bg-muted/80 border-b border-r border-border px-3 py-2 text-left min-w-[90px]">Period</th>
                {DAYS.map(d=>(
                  <th key={d} className={`px-2 py-2 border-b border-r border-border text-center min-w-[110px] font-semibold ${d===currentDay?"bg-primary/10 text-primary":"bg-muted/40"}`}>
                    {d}{d===currentDay&&" ●"}
                  </th>
                ))}
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
                    const e = entries.find(e=>e.day===day&&e.period_config_id===p.id);
                    return (
                      <td key={day} className={`border-b border-r border-border p-1 ${day===currentDay?"bg-primary/5":""}`}>
                        {e ? (
                          <div className={`rounded-lg p-1.5 border ${ENTRY_COLOR[e.entry_type]||"bg-muted border-border"}`}>
                            <p className="font-bold text-[11px]">{e.subject?.code}</p>
                            <p className="text-[10px] opacity-75 truncate">{e.subject?.name}</p>
                            <p className="text-[10px] font-medium">{e.section?.name}</p>
                          </div>
                        ) : <div className="min-h-[44px] flex items-center justify-center text-muted-foreground/20">—</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {periods.length===0 && (
                <tr><td colSpan={7} className="text-center py-6 text-sm text-muted-foreground">No periods for this session</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MY LEAVE
// ─────────────────────────────────────────────────────────────
function MyLeave({ facultyId }) {
  const [leaves,   setLeaves]   = useState([]);
  const [balance,  setBalance]  = useState(null);
  const [types,    setTypes]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({ leave_type_id:"", from_date:"", to_date:"", reason:"", is_half_day:false });

  const load = () => {
    if (!facultyId) return;
    setLoading(true);
    Promise.all([
      axiosInstance.get(`/leave/faculty/${facultyId}`).catch(()=>({data:{data:[]}})),
      axiosInstance.get(`/leave/balance/${facultyId}`).catch(()=>({data:{data:null}})),
      axiosInstance.get(`/leave/types?all=false`).catch(()=>({data:{data:[]}})),
    ]).then(([lR,bR,tR])=>{
      setLeaves(lR.data?.data||[]);
      setBalance(bR.data?.data);
      setTypes(tR.data?.data||[]);
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[facultyId]);

  const apply = async () => {
    if (!form.leave_type_id||!form.from_date||!form.to_date||!form.reason) { notify.error("Fill all fields"); return; }
    setSaving(true);
    try {
      await axiosInstance.post(`/leave/faculty/${facultyId}/submit`, form);
      notify.success("Leave applied"); setShowForm(false);
      setForm({ leave_type_id:"",from_date:"",to_date:"",reason:"",is_half_day:false });
      load();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  const days = form.from_date&&form.to_date
    ? Math.ceil((new Date(form.to_date)-new Date(form.from_date))/(86400000))+1 : 0;

  const SC = { PENDING:"bg-amber-100 text-amber-700",APPROVED:"bg-green-100 text-green-700",REJECTED:"bg-red-100 text-red-700",CANCELLED:"bg-muted text-muted-foreground" };

  if (!facultyId) return <p className="text-sm text-muted-foreground">No faculty profile linked.</p>;

  return (
    <div className="space-y-4">
      {/* Balance cards */}
      {balance?.balances?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {balance.balances.map(b=>{
            const avail = Math.max(0,(b.total_days||0)-(b.used_days||0));
            return (
              <div key={b.id} className={`rounded-2xl border px-4 py-3 text-center min-w-[80px] ${avail<=0?"border-red-200 bg-red-50":"border-border bg-card"}`}>
                <p className={`text-xl font-bold ${avail<=0?"text-red-600":"text-primary"}`}>{avail.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">{b.leaveType?.code||"—"}</p>
                <p className="text-[9px] text-muted-foreground">of {b.total_days||0}</p>
              </div>
            );
          })}
        </div>
      )}

      <Button size="sm" onClick={()=>setShowForm(v=>!v)}>
        <Plus size={12} className="mr-1.5"/>{showForm?"Cancel":"Apply Leave"}
      </Button>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Leave Type *</Label>
              <select value={form.leave_type_id} onChange={e=>setForm(f=>({...f,leave_type_id:e.target.value}))} className={sel}>
                <option value="">Select…</option>
                {types.map(t=><option key={t.id} value={t.id}>{t.name} ({t.code}) — {Math.max(0,(balance?.balances?.find(b=>b.leave_type_id===t.id)?.total_days||0)-(balance?.balances?.find(b=>b.leave_type_id===t.id)?.used_days||0))} avail</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From *</Label>
              <Input type="date" value={form.from_date} onChange={e=>setForm(f=>({...f,from_date:e.target.value}))}/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To *</Label>
              <Input type="date" value={form.to_date} min={form.from_date} onChange={e=>setForm(f=>({...f,to_date:e.target.value}))}/>
            </div>
          </div>
          {days>0 && <p className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">{days} day{days!==1?"s":""} selected</p>}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_half_day} onChange={e=>setForm(f=>({...f,is_half_day:e.target.checked}))} className="w-4 h-4 accent-primary"/>
            Half day leave
          </label>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason *</Label>
            <textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none outline-none focus:ring-2 focus:ring-ring"
              placeholder="Reason…"/>
          </div>
          <Button size="sm" disabled={saving} onClick={apply}>
            {saving?<Loader2 size={12} className="mr-1 animate-spin"/>:<Save size={12} className="mr-1"/>}Submit
          </Button>
        </div>
      )}

      {loading ? <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground"/></div> : (
        <div className="space-y-2">
          {leaves.slice(0,10).map(l=>(
            <div key={l.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{l.leaveType?.name} <span className="text-xs text-muted-foreground">({l.total_days}d)</span></p>
                <p className="text-xs text-muted-foreground">{fmt(l.from_date)} → {fmt(l.to_date)}</p>
                {l.reason&&<p className="text-xs text-muted-foreground truncate">{l.reason}</p>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${SC[l.status]||"bg-muted text-muted-foreground"}`}>{l.status}</span>
            </div>
          ))}
          {!leaves.length && <p className="text-sm text-muted-foreground text-center py-4">No leave applications</p>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────
function ChangePassword() {
  const [f, setF] = useState({ cur:"", nw:"", cf:"" });
  const [show, setShow] = useState({});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!f.cur||!f.nw) { notify.error("Fill all fields"); return; }
    if (f.nw.length<8) { notify.error("Min 8 characters"); return; }
    if (f.nw!==f.cf)   { notify.error("Passwords don't match"); return; }
    setSaving(true);
    try { await axiosInstance.post("/auth/change-password",{ current_password:f.cur, new_password:f.nw }); notify.success("Password changed"); setF({cur:"",nw:"",cf:""}); }
    catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };
  return (
    <div className="space-y-4 max-w-sm">
      {[["Current Password","cur"],["New Password (min 8)","nw"],["Confirm New Password","cf"]].map(([label,k])=>(
        <div key={k} className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <div className="relative">
            <Input type={show[k]?"text":"password"} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} className="pr-10"/>
            <button type="button" onClick={()=>setShow(s=>({...s,[k]:!s[k]}))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show[k]?<EyeOff size={13}/>:<Eye size={13}/>}
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

// ─────────────────────────────────────────────────────────────
// MAIN WORKSPACE PAGE
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"timetable", label:"My Timetable",       icon:CalendarDays },
  { id:"leave",     label:"My Leave",            icon:ClipboardList },
  { id:"attendance",label:"Mark Attendance",     icon:CheckCircle },
  { id:"password",  label:"Change Password",     icon:Lock },
];

export default function MyWorkspacePage() {
  const user    = useSelector(s => s.auth?.user);
  const faculty = user?.faculty;
  const navigate = useNavigate();
  const [tab, setTab] = useState("timetable");

  const isSuperAdmin = user?.is_root || ["SUPER_ADMIN"].includes(user?.role);
  // Super admin / root don't need personal tools
  const visibleTabs = isSuperAdmin
    ? [{ id:"password", label:"Change Password", icon:Lock }]
    : TABS;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
            {(faculty?.name||user?.email||"U")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{faculty?.name || user?.email}</h1>
            <p className="text-sm text-muted-foreground">{faculty?.designation||user?.role} {faculty?.department?.name?`· ${faculty.department.name}`:""}</p>
            {faculty?.emp_id && <p className="text-xs text-muted-foreground">EMP: {faculty.emp_id}</p>}
          </div>
        </div>
        {isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
            Super Admin — Personal tools (timetable, leave) are for institution staff only.
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {visibleTabs.map(t=>{
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab===t.id?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon size={13}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* My Timetable */}
      {tab==="timetable" && <MyTimetable facultyId={faculty?.id}/>}

      {/* My Leave */}
      {tab==="leave" && <MyLeave facultyId={faculty?.id}/>}

      {/* Mark Attendance — redirect to attendance page */}
      {tab==="attendance" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a class from your timetable to mark attendance, or go to the attendance page directly.</p>
          <Button onClick={()=>navigate("/admin/attendance/mark")}>
            <CheckCircle size={14} className="mr-1.5"/>Go to Mark Attendance
          </Button>
          {faculty?.id && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold">Quick access from timetable</p>
              <p className="text-xs text-muted-foreground">Each slot in My Timetable has a "✓ Mark Attendance" button that pre-fills the section, subject and period for you.</p>
              <Button variant="outline" size="sm" onClick={()=>setTab("timetable")}>
                <CalendarDays size={13} className="mr-1.5"/>View My Timetable
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Change Password */}
      {tab==="password" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Password minimum 8 characters. You will need to log in again after changing.</p>
          <ChangePassword/>
        </div>
      )}
    </div>
  );
}