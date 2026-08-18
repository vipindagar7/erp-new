// src/modules/adminss/timetable/pages/TimetableHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, Users, Clock, ArrowRight, Settings, BarChart2,
  Loader2, Link, History, BookOpen, GitBranch, Upload, Layers,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";

const QuickLink = ({ icon: Icon, label, path, desc, badge, color = "text-primary" }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:bg-muted/20 transition-all w-full text-left group"
    >
      <div className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      {badge && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
      <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </button>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color = "text-primary", onClick }) => (
  <button
    onClick={onClick}
    className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md transition-all hover:-translate-y-0.5 w-full"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 mb-3 ${color}`}>
      <Icon size={18} />
    </div>
    <p className="text-2xl font-bold">{value ?? "—"}</p>
    <p className="text-sm font-medium">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </button>
);

export default function TimetableHubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get(EP.sessions.list)
      .then((r) => {
        const list = r.data?.data || [];
        const cur = list.find((s) => s.is_current) || list[0];
        setSession(cur);
        if (!cur) return;
        return axiosInstance
          .get(`/timetable?session_id=${cur.id}&limit=200`)
          .then((r2) => {
            const tts = r2.data?.data || [];
            setStats({
              sections: tts.length,
              published: tts.filter((t) => t.is_published).length,
              locked: tts.filter((t) => t.is_locked).length,
            });
          });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Timetable</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create, manage and publish section timetables
        </p>
        {session && (
          <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Session: {session.name || session.code}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={Layers} label="Timetables" value={stats.sections}
              sub="Total sections" onClick={() => navigate("/admin/timetable/sections")}
            />
            <StatCard
              icon={CalendarDays} label="Published" value={stats.published}
              sub="Visible to students" color="text-green-600"
              onClick={() => navigate("/admin/timetable/sections")}
            />
            <StatCard
              icon={Clock} label="Locked" value={stats.locked}
              sub="No edits allowed" color="text-amber-600"
              onClick={() => navigate("/admin/timetable/sections")}
            />
            <StatCard
              icon={History} label="History" value="→"
              sub="All changes logged" color="text-violet-600"
              onClick={() => navigate("/admin/timetable/history")}
            />
          </div>

          {/* Quick links grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Setup</p>
              <QuickLink icon={Settings} label="Period Timings" path="/admin/timetable/periods" desc="Configure daily period schedule" />
              <QuickLink icon={Upload} label="Faculty Workload" path="/admin/timetable/workload" desc="Assign faculty to subjects & sections" />
              <QuickLink icon={GitBranch} label="Auto-Generate" path="/admin/timetable/generate" desc="AI-based timetable generation" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Views</p>
              <QuickLink icon={Layers} label="Class-wise View" path="/admin/timetable/sections" desc="Manage each section's timetable" badge="Main" />
              <QuickLink icon={CalendarDays} label="Global View" path="/admin/timetable/global" desc="All sections at once" />
              <QuickLink icon={Users} label="Faculty View" path="/admin/timetable/faculty" desc="Teacher-wise schedule" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tracking</p>
              <QuickLink icon={BookOpen} label="Course Structure" path="/admin/timetable/course-structure" desc="Syllabus coverage" />
              <QuickLink icon={BarChart2} label="Topics Taught" path="/admin/timetable/topics" desc="Lecture-wise progress" />
              <QuickLink icon={History} label="Change History" path="/admin/timetable/history" desc="Every slot change logged" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Special</p>
              <QuickLink icon={Link} label="Combine Sections" path="/admin/timetable/sections" desc="Merge same faculty+subject slots" color="text-cyan-600" />
              <QuickLink icon={CalendarDays} label="Special Sessions" path="/admin/timetable/special" desc="Extra classes, labs, workshops" />
              <QuickLink icon={BarChart2} label="Daily Reports" path="/admin/timetable/reports" desc="Day-wise lecture reports" />
            </div>
          </div>

          {/* Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1">
            <p className="font-semibold">Combine tip:</p>
            <p>
              When the same faculty teaches the same subject in multiple sections,
              the system will suggest combining them when you assign a slot.
              Combined sections share one row in the timetable.
            </p>
          </div>
        </>
      )}
    </div>
  );
}