import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axios.js";
import { cn } from "../../lib/utils.js";
import {
  GraduationCap, Users, Building2, Layers, BookOpen, Library,
  ClipboardList, BarChart3, TrendingUp, AlertCircle, CheckCircle,
  Clock, Loader2, ArrowRight, Plus, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, to, color, sub, loading }) {
  const inner = (
    <div className={cn(
      "bg-card border border-border rounded-2xl p-5 transition-all",
      to && "hover:border-primary/30 hover:shadow-sm cursor-pointer"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            {loading ? <span className="text-muted-foreground text-xl">—</span> : (value ?? "—")}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

// ── Mini bar chart for gender / enrollment ─────────────────────
function MiniBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Activity icon ──────────────────────────────────────────────
function ActivityIcon({ type }) {
  const map = {
    student_added: { icon: GraduationCap, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/40" },
    faculty_added: { icon: Users, color: "bg-purple-100 text-purple-600 dark:bg-purple-950/40" },
    feedback_submit: { icon: ClipboardList, color: "bg-green-100 text-green-600 dark:bg-green-950/40" },
    enrollment_promoted: { icon: TrendingUp, color: "bg-teal-100 text-teal-600 dark:bg-teal-950/40" },
    enrollment_passed: { icon: CheckCircle, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/40" },
    enrollment_detained: { icon: AlertCircle, color: "bg-red-100 text-red-600 dark:bg-red-950/40" },
  };
  const cfg = map[type] || { icon: Clock, color: "bg-muted text-muted-foreground" };
  const Icon = cfg.icon;
  return (
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
      <Icon size={13} />
    </div>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actLoad, setActLoad] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/admin/dashboard/stats")
      .then((r) => setStats(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    setActLoad(true);
    axiosInstance.get("/admin/dashboard/activity")
      .then((r) => setActivity(r.data.data || []))
      .catch(() => { })
      .finally(() => setActLoad(false));
  }, [refresh]);

  const s = stats;
  const totalGender = s?.gender?.reduce((acc, g) => acc + g.count, 0) || 0;
  const enrollTotal = s?.enrollments?.total || 0;

  const mainCards = [
    { label: "Total Students", value: s?.counts?.students, icon: GraduationCap, to: "/admin/students", color: "bg-blue-500", sub: s?.blocked?.students ? `${s.blocked.students} blocked` : null },
    { label: "Faculty Members", value: s?.counts?.faculty, icon: Users, to: "/admin/faculty", color: "bg-purple-500", sub: s?.blocked?.faculty ? `${s.blocked.faculty} blocked` : null },
    { label: "Departments", value: s?.counts?.departments, icon: Building2, to: "/admin/departments", color: "bg-green-500" },
    { label: "Sections", value: s?.counts?.sections, icon: Layers, to: "/admin/sections", color: "bg-orange-500" },
    { label: "Courses", value: s?.counts?.courses, icon: BookOpen, to: "/admin/courses", color: "bg-teal-500" },
    { label: "Subjects", value: s?.counts?.subjects, icon: Library, to: "/admin/subjects", color: "bg-indigo-500" },
    { label: "Active Forms", value: s?.feedback?.active_forms, icon: ClipboardList, to: "/admin/feedback/forms", color: "bg-rose-500" },
    { label: "FB Responses", value: s?.feedback?.total_responses, icon: BarChart3, to: "/admin/feedback/forms", color: "bg-pink-500" },
  ];

  const quickActions = [
    { label: "Add Student", to: "/admin/students", icon: "👤", color: "hover:bg-blue-50 dark:hover:bg-blue-950/20" },
    { label: "Add Faculty", to: "/admin/faculty", icon: "👨‍🏫", color: "hover:bg-purple-50 dark:hover:bg-purple-950/20" },
    { label: "New Section", to: "/admin/sections", icon: "🗂️", color: "hover:bg-orange-50 dark:hover:bg-orange-950/20" },
    { label: "New Feedback Form", to: "/admin/feedback/forms", icon: "📋", color: "hover:bg-rose-50 dark:hover:bg-rose-950/20" },
    { label: "Add Department", to: "/admin/departments", icon: "🏢", color: "hover:bg-green-50 dark:hover:bg-green-950/20" },
    { label: "View Reports", to: "/admin/reports", icon: "📊", color: "hover:bg-indigo-50 dark:hover:bg-indigo-950/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-medium text-foreground">{user?.name || user?.email}</span>
            {user?.role === "SUPER_ADMIN" && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Super Admin
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefresh((r) => r + 1)}>
          <RefreshCw size={13} className={cn("mr-1.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {mainCards.map((c) => (
          <StatCard key={c.label} {...c} loading={loading} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Enrollment breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Enrollment Status</p>
            <span className="text-xs text-muted-foreground">{enrollTotal} total</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              <MiniBar label="Active" value={s?.enrollments?.active || 0} total={enrollTotal} color="bg-green-500" />
              <MiniBar label="Detained" value={s?.enrollments?.detained || 0} total={enrollTotal} color="bg-red-400" />
              <MiniBar label="Passed" value={s?.enrollments?.passed || 0} total={enrollTotal} color="bg-blue-500" />
            </div>
          )}
          <Link to="/admin/students" className="flex items-center gap-1 text-xs text-primary hover:underline">
            View all students <ArrowRight size={11} />
          </Link>
        </div>

        {/* Gender breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Student Gender</p>
            <span className="text-xs text-muted-foreground">{s?.counts?.students || 0} total</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              {(s?.gender || []).map((g) => (
                <MiniBar key={g.gender} label={g.gender} value={g.count} total={totalGender}
                  color={g.gender === "MALE" ? "bg-blue-400" : g.gender === "FEMALE" ? "bg-pink-400" : "bg-muted-foreground"} />
              ))}
              {(!s?.gender || s.gender.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-2">No data yet</p>
              )}
            </div>
          )}
        </div>

        {/* Top sections */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Top Sections by Students</p>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : s?.top_sections?.length ? (
            <div className="space-y-2">
              {s.top_sections.map((sec, i) => (
                <div key={sec.id} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sec.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{sec.course} · Sem {sec.semester}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground shrink-0">{sec.students}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No sections yet</p>
          )}
          <Link to="/admin/sections" className="flex items-center gap-1 text-xs text-primary hover:underline">
            Manage sections <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <Link key={a.label} to={a.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground transition-colors",
                  a.color
                )}>
                <span className="text-base shrink-0">{a.icon}</span>
                <span className="truncate text-xs">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent students */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Recent Students</p>
            <Link to="/admin/students" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : s?.recent?.students?.length ? (
            <div className="space-y-2.5">
              {s.recent.students.map((st) => (
                <div key={st.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {st.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{st.name}</p>
                    <p className="text-xs text-muted-foreground">{st.section?.name} · {st.department?.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(st.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No students yet</p>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Recent Activity</p>
          {actLoad ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : activity.length ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}