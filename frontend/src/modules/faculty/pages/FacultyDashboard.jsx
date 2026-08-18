// src/modules/adminss/faculty/pages/FacultyDashboardPage.jsx
// Faculty home — today's schedule, attendance to mark, leave balance, notices
import { useState, useEffect } from "react";
import { useSelector }          from "react-redux";
import { useNavigate }           from "react-router-dom";
import {
  CalendarDays, CheckCircle, ClipboardList, Bell, TrendingUp,
  Users, BookOpen, Clock, AlertTriangle, ArrowRight, Loader2,
  BarChart2, Star,
} from "lucide-react";
import axiosInstance from "../../../lib/axios.js";
import { EP }        from "../../../config/api.config.js";

const ENTRY_COLOR = {
  LECTURE:"bg-blue-50 text-blue-800 border-blue-200",
  LAB:"bg-green-50 text-green-800 border-green-200",
  TUTORIAL:"bg-violet-50 text-violet-800 border-violet-200",
};
const today = () => new Date().toISOString().slice(0,10);
const dayNow = () => ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date().getDay()];
const greet = () => {
  const h = new Date().getHours();
  return h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening";
};

export default function FacultyDashboardPage() {
  const user    = useSelector(s => s.auth?.user);
  const faculty = user?.faculty;
  const navigate = useNavigate();

  const [todayClasses, setTodayClasses] = useState([]);
  const [periods,      setPeriods]      = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [pendingLeave, setPendingLeave] = useState(0);
  const [sections,     setSections]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!faculty?.id) { setLoading(false); return; }
    const currentDay = dayNow();

    Promise.all([
      // Current session
      axiosInstance.get(EP.sessions.list).catch(()=>({data:{data:[]}})),
      // Leave balance
      axiosInstance.get(`/leave/balance/${faculty.id}`).catch(()=>({data:{data:null}})),
      // Pending leaves
      axiosInstance.get(`/leave/faculty/${faculty.id}?status=PENDING`).catch(()=>({data:{data:[]}})),
    ]).then(async ([sRes, bRes, lRes]) => {
      const sessions = sRes.data?.data || [];
      const cur = sessions.find(s=>s.is_current);
      setLeaveBalance(bRes.data?.data?.balances || []);
      setPendingLeave((lRes.data?.data||[]).filter(l=>l.status==="PENDING").length);

      if (!cur) return;

      // Today's timetable
      const [pRes, ttRes] = await Promise.all([
        axiosInstance.get(EP.timetable.periods(cur.id)).catch(()=>({data:{data:[]}})),
        axiosInstance.get(EP.timetable.global, { params:{ session_id:cur.id } }).catch(()=>({data:{data:[]}})),
      ]);
      const perList = (pRes.data?.data||[]).filter(p=>!["LUNCH","BREAK","ASSEMBLY"].includes(p.type));
      setPeriods(perList);

      const allTTs = ttRes.data?.data || [];
      const mine = allTTs.flatMap(tt =>
        (tt.entries||[]).filter(e=>e.faculty_id===faculty.id && e.day===currentDay)
          .map(e=>({ ...e, section:tt.section, timetable_section_id:tt.section_id }))
      ).sort((a,b)=>{
        const ai = perList.findIndex(p=>p.id===a.period_config_id);
        const bi = perList.findIndex(p=>p.id===b.period_config_id);
        return ai-bi;
      });
      setTodayClasses(mine);

      // Sections
      const wlRes = await axiosInstance.get(EP.timetable.workload + `?faculty_id=${faculty.id}&session_id=${cur.id}`).catch(()=>({data:{data:[]}}));
      const wls = wlRes.data?.data || [];
      const secIds = [...new Set(wls.map(w=>w.section_id).filter(Boolean))];
      setSections(secIds);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [faculty?.id]);

  const currentDay = dayNow();
  const isWeekend = ["SAT","SUN"].includes(currentDay);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={24} className="animate-spin text-muted-foreground"/>
    </div>
  );

  if (!faculty?.id) return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-3">
      <AlertTriangle size={32} className="mx-auto text-amber-500"/>
      <p className="text-lg font-semibold">No faculty profile linked</p>
      <p className="text-sm text-muted-foreground">Your account doesn't have a faculty profile. Contact your administrator.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Greeting header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{greet()}, {faculty.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">{faculty.designation} · {faculty.department?.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
        <button onClick={()=>navigate("/admin/my-workspace")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          My Workspace <ArrowRight size={14}/>
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon:Users,       label:"My Sections",   value:sections.length,   color:"text-blue-600",  path:"/admin/sections"     },
          { icon:CalendarDays,label:"Classes Today",  value:todayClasses.length,color:"text-green-600",path:"/admin/my-workspace" },
          { icon:ClipboardList,label:"Pending Leave", value:pendingLeave,      color:"text-amber-600", path:"/admin/my-workspace?tab=leave" },
          { icon:BarChart2,   label:"Leave Balance",  value:leaveBalance.reduce((s,b)=>s+Math.max(0,(b.total_days||0)-(b.used_days||0)),0).toFixed(1)+"d", color:"text-violet-600", path:"/admin/my-workspace?tab=leave" },
        ].map(({ icon:Icon, label, value, color, path })=>(
          <button key={label} onClick={()=>navigate(path)}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5">
            <Icon size={18} className={`${color} mb-2`}/>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Today's schedule */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarDays size={16} className="text-primary"/>Today's Schedule
          </h2>
          <button onClick={()=>navigate("/admin/my-workspace")} className="text-xs text-primary hover:underline flex items-center gap-1">
            Full Timetable <ArrowRight size={10}/>
          </button>
        </div>

        {isWeekend ? (
          <div className="bg-muted/20 border border-border rounded-2xl p-6 text-center">
            <Star size={24} className="mx-auto text-amber-400 mb-2"/>
            <p className="font-medium">Weekend</p>
            <p className="text-sm text-muted-foreground">No classes scheduled. Enjoy your day!</p>
          </div>
        ) : todayClasses.length === 0 ? (
          <div className="bg-muted/20 border border-border rounded-2xl p-6 text-center">
            <CalendarDays size={24} className="mx-auto text-muted-foreground/30 mb-2"/>
            <p className="text-sm text-muted-foreground">No classes scheduled for today ({currentDay})</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayClasses.map(e => {
              const period = periods.find(p=>p.id===e.period_config_id);
              const now = new Date();
              const start = period ? new Date(`${today()}T${period.start_time}`) : null;
              const end   = period ? new Date(`${today()}T${period.end_time}`)   : null;
              const isNow = start && end && now>=start && now<=end;
              const isPast= end && now>end;
              return (
                <div key={e.id} className={`rounded-2xl border-2 p-4 space-y-2 transition-all ${isNow?"border-primary bg-primary/5 shadow-md":isPast?"border-border bg-muted/10 opacity-70":"border-border bg-card"}`}>
                  {isNow && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"/>HAPPENING NOW
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{e.subject?.name||"—"}</p>
                      <p className="text-xs text-muted-foreground">{e.subject?.code}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ENTRY_COLOR[e.entry_type]||"bg-muted text-muted-foreground"}`}>
                      {e.entry_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={10}/>{period?.start_time}–{period?.end_time}</span>
                    <span className="flex items-center gap-1"><Users size={10}/>{e.section?.name}</span>
                  </div>
                  {e.room && <p className="text-[10px] text-muted-foreground">📍 {e.room.code} — {e.room.name}</p>}
                  {!isPast && (
                    <button
                      onClick={()=>navigate(`/admin/attendance/mark?section_id=${e.timetable_section_id||""}&subject_id=${e.subject_id||""}&period_name=${period?.name||""}`)}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                      <CheckCircle size={11}/>Mark Attendance
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave balance summary */}
      {leaveBalance.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ClipboardList size={16} className="text-primary"/>Leave Balance
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {leaveBalance.map(b=>{
              const avail = Math.max(0,(b.total_days||0)-(b.used_days||0));
              const pct   = b.total_days ? (avail/b.total_days)*100 : 0;
              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <p className={`text-xl font-bold ${avail<=0?"text-red-500":avail<=2?"text-amber-500":"text-green-600"}`}>{avail.toFixed(1)}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">{b.leaveType?.code}</p>
                  <p className="text-[9px] text-muted-foreground">{b.used_days||0} used</p>
                  <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width:`${Math.min(100,pct)}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={()=>navigate("/admin/my-workspace?tab=leave")}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            Apply for leave <ArrowRight size={10}/>
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon:CheckCircle,  label:"Mark Attendance",   path:"/admin/attendance/mark",        color:"bg-green-50 text-green-700 border-green-200" },
          { icon:CalendarDays, label:"My Timetable",      path:"/admin/my-workspace",           color:"bg-blue-50 text-blue-700 border-blue-200"    },
          { icon:ClipboardList,label:"Apply Leave",       path:"/admin/my-workspace?tab=leave", color:"bg-amber-50 text-amber-700 border-amber-200" },
          { icon:Users,        label:"My Students",       path:"/admin/students",               color:"bg-violet-50 text-violet-700 border-violet-200"},
        ].map(({icon:Icon,label,path,color})=>(
          <button key={label} onClick={()=>navigate(path)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium hover:shadow-sm transition-all ${color}`}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>
    </div>
  );
}