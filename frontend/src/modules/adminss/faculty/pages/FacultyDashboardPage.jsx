// src/modules/adminss/faculty/pages/FacultyDashboardPage.jsx
// Faculty dashboard — shows when faculty role is active
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, CheckCircle, ClipboardList, Clock, Users,
  ArrowRight, Loader2, AlertTriangle, BarChart2, FileText,
  Award, BookOpen, Bell,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const todayStr = () => new Date().toISOString().slice(0, 10);
const dayNow = () => ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date().getDay()];
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; };

const ENTRY_COLOR = {
  LECTURE: "bg-blue-50 text-blue-800 border-blue-200",
  LAB: "bg-green-50 text-green-800 border-green-200",
  TUTORIAL: "bg-violet-50 text-violet-800 border-violet-200",
};

// Role-switcher component
function RoleSwitcher({ user }) {
  const navigate = useNavigate();
  const extraRoles = user?.extra_roles || [];
  if (!extraRoles.length) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Switch role:</span>
      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">FACULTY (current)</span>
      {extraRoles.filter(r => r !== "FACULTY").map(r => (
        <button key={r} onClick={() => navigate("/admin")}
          className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted/40 transition-colors">
          {r.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

export default function FacultyDashboardPage() {
  const user = useSelector(s => s.auth?.user);
  const faculty = user?.faculty;
  const navigate = useNavigate();

  const [todayClasses, setTodayClasses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [pendingLeave, setPendingLeave] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!faculty?.id) { setLoading(false); return; }
    const load = async () => {
      try {
        const currentDay = dayNow();
        const sRes = await axiosInstance.get(EP.sessions.list).catch(() => ({ data: { data: [] } }));
        const cur = (sRes.data?.data || []).find(s => s.is_current);

        const [lRes, aRes] = await Promise.all([
          axiosInstance.get(EP.leave.faculty(faculty.id)).catch(() => ({ data: { data: [] } })),
          axiosInstance.get(EP.assignments.list + `?faculty_id=${faculty.id}&limit=5&status=CLOSED`).catch(() => ({ data: { data: { items: [] } } })),
        ]);

        const leaves = lRes.data?.data || [];
        setPendingLeave(leaves.filter(l => l.status === "PENDING").length);
        setAssignments(aRes.data?.data?.items || []);

        const byType = {};
        leaves.forEach(l => {
          if (!l.leaveType?.name) return;
          if (!byType[l.leaveType.name]) byType[l.leaveType.name] = { name: l.leaveType.name, code: l.leaveType.code, used: 0, total: l.leaveType.days_per_year || 0 };
          if (l.status === "APPROVED") byType[l.leaveType.name].used += (l.total_days || 1);
        });
        setLeaveBalance(Object.values(byType));

        if (!cur) return;

        const [pRes, ttRes] = await Promise.all([
          axiosInstance.get(EP.timetable.periods(cur.id)).catch(() => ({ data: { data: [] } })),
          axiosInstance.get(EP.timetable.byFaculty(faculty.id), { params: { session_id: cur.id } }).catch(() => ({ data: { data: [] } })),
        ]);

        const perList = (pRes.data?.data || []).filter(p => !["LUNCH", "BREAK", "ASSEMBLY"].includes(p.type));
        setPeriods(perList);

        const allEntries = ttRes.data?.data || [];
        let mine = [];
        if (Array.isArray(allEntries)) {
          mine = allEntries[0]?.entries
            ? allEntries.flatMap(tt => (tt.entries || []).filter(e => e.day === currentDay).map(e => ({ ...e, section: tt.section, timetable_section_id: tt.section_id })))
            : allEntries.filter(e => e.day === currentDay);
        }
        mine.sort((a, b) => perList.findIndex(p => p.id === a.period_config_id) - perList.findIndex(p => p.id === b.period_config_id));
        setTodayClasses(mine);
      } catch (e) { setError("Failed to load dashboard"); }
      finally { setLoading(false); }
    };
    load();
  }, [faculty?.id]);

  const currentDay = dayNow();
  const isWeekend = ["SAT", "SUN"].includes(currentDay);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  if (!faculty?.id) return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-3">
      <AlertTriangle size={32} className="mx-auto text-amber-500" />
      <p className="text-lg font-semibold">No faculty profile linked</p>
      <p className="text-sm text-muted-foreground">Contact administrator to link your faculty profile.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header + role switch */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{greet()}, {faculty.name?.split(" ")[0]} 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{faculty.designation} · {faculty.department?.name}</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <button onClick={() => navigate("/admin/my-workspace")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
            My Workspace <ArrowRight size={14} />
          </button>
        </div>
        <RoleSwitcher user={user} />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CalendarDays, label: "Classes Today", value: todayClasses.length, color: "text-blue-600", path: "/admin/my-workspace" },
          { icon: ClipboardList, label: "Pending Leave", value: pendingLeave, color: "text-amber-600", path: "/admin/leave/list" },
          { icon: FileText, label: "To Grade", value: assignments.length, color: "text-orange-600", path: "/admin/assignments" },
          { icon: BarChart2, label: "Leave Balance", value: leaveBalance.reduce((s, b) => s + Math.max(0, (b.total || 0) - (b.used || 0)), 0) + "d", color: "text-violet-600", path: "/admin/leave/list" },
        ].map(({ icon: Icon, label, value, color, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:shadow-md transition-all hover:-translate-y-0.5">
            <Icon size={18} className={`${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Today's classes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />Today's Schedule
            <span className="text-xs font-normal text-muted-foreground">({currentDay})</span>
          </h2>
          <button onClick={() => navigate("/admin/timetable/faculty")} className="text-xs text-primary hover:underline flex items-center gap-1">
            Full Timetable <ArrowRight size={10} />
          </button>
        </div>

        {isWeekend ? (
          <div className="bg-muted/20 border border-border rounded-2xl p-8 text-center">
            <p className="font-medium text-lg">🎉 Weekend — No classes!</p>
          </div>
        ) : todayClasses.length === 0 ? (
          <div className="bg-muted/20 border border-border rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayClasses.map(e => {
              const period = periods.find(p => p.id === e.period_config_id);
              const now = new Date();
              const start = period ? new Date(`${todayStr()}T${period.start_time}`) : null;
              const end = period ? new Date(`${todayStr()}T${period.end_time}`) : null;
              const isNow = start && end && now >= start && now <= end;
              const isPast = end && now > end;
              return (
                <div key={e.id} className={`rounded-2xl border-2 p-4 space-y-2 transition-all
                  ${isNow ? "border-primary bg-primary/5 shadow-md" : isPast ? "border-border bg-muted/10 opacity-60" : "border-border bg-card"}`}>
                  {isNow && <div className="flex items-center gap-1.5 text-xs font-bold text-primary"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" />HAPPENING NOW</div>}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{e.subject?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{e.subject?.code}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${ENTRY_COLOR[e.entry_type] || "bg-muted"}`}>{e.entry_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {period && <span className="flex items-center gap-1"><Clock size={10} />{period.start_time}–{period.end_time}</span>}
                    {e.section?.name && <span className="flex items-center gap-1"><Users size={10} />{e.section.name}</span>}
                  </div>
                  {!isPast && (
                    <button onClick={() => navigate(`/admin/attendance/mark?section_id=${e.timetable_section_id || e.section_id || ""}&subject_id=${e.subject_id || ""}&period_name=${period?.name || ""}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                      <CheckCircle size={11} />Mark Attendance
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignments needing grading */}
      {assignments.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FileText size={16} className="text-primary" />Assignments to Grade
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {assignments.slice(0, 4).map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer"
                  onClick={() => navigate(`/admin/assignments/${a.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subject?.name} · {a._count?.submissions || 0} submissions</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Grade</span>
                  <ArrowRight size={13} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leave balance */}
      {leaveBalance.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold flex items-center gap-2"><ClipboardList size={16} className="text-primary" />Leave Balance</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {leaveBalance.map(b => {
              const avail = Math.max(0, (b.total || 0) - (b.used || 0));
              return (
                <div key={b.name} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <p className={`text-xl font-bold ${avail <= 0 ? "text-red-500" : avail <= 2 ? "text-amber-500" : "text-green-600"}`}>{avail}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">{b.code || b.name}</p>
                  <p className="text-[9px] text-muted-foreground">{b.used || 0} used</p>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate("/admin/leave/submit")} className="text-xs text-primary hover:underline flex items-center gap-1">Apply Leave <ArrowRight size={10} /></button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: CheckCircle, label: "Mark Attendance", path: "/admin/attendance/mark", color: "bg-green-50 text-green-700 border-green-200" },
          { icon: CalendarDays, label: "My Timetable", path: "/admin/timetable/faculty", color: "bg-blue-50 text-blue-700 border-blue-200" },
          { icon: ClipboardList, label: "Apply Leave", path: "/admin/leave/submit", color: "bg-amber-50 text-amber-700 border-amber-200" },
          { icon: Award, label: "Skill Cards", path: "/admin/skill-card/mentor", color: "bg-violet-50 text-violet-700 border-violet-200" },
        ].map(({ icon: Icon, label, path, color }) => (
          <button key={label} onClick={() => navigate(path)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium hover:shadow-sm transition-all ${color}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}