// src/modules/adminss/attendance/pages/AttendanceHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Users, BarChart2, AlertTriangle, Calendar, ArrowRight, Loader2, TrendingDown } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";

const Card = ({ icon: Icon, label, value, sub, color="text-primary", onClick }) => (
  <button onClick={onClick}
    className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md transition-all hover:-translate-y-0.5 w-full space-y-2">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 ${color}`}><Icon size={20}/></div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm font-medium">{label}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </button>
);

const QuickLink = ({ icon: Icon, label, path, desc }) => {
  const nav = useNavigate();
  return (
    <button onClick={()=>nav(path)}
      className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:bg-muted/20 transition-all w-full text-left group">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon size={16}/></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"/>
    </button>
  );
};

export default function AttendanceHubPage() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/sessions?limit=5").catch(()=>({data:{data:[]}})),
      axiosInstance.get("/sections?limit=200").catch(()=>({data:{data:[]}})),
    ]).then(([sRes, secRes]) => {
      const sessions = sRes.data?.data || [];
      const cur = sessions.find(s=>s.is_current);
      const sections = secRes.data?.data?.sections || secRes.data?.data || [];
      setStats({ sessionName: cur?.name || cur?.code, totalSections: sections.length });
    }).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Mark, view and manage student attendance</p>
        {stats?.sessionName && (
          <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"/>Current: {stats.sessionName}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card icon={Users}         label="Total Sections"    value={stats?.totalSections||"—"} sub="Active this session" onClick={()=>navigate("/admin/sections")}/>
        <Card icon={CheckCircle}   label="Mark Today"        value="→" sub="Mark attendance now" color="text-green-600" onClick={()=>navigate("/admin/attendance/mark")}/>
        <Card icon={BarChart2}     label="Summary View"      value="→" sub="Section-wise report" color="text-blue-600" onClick={()=>navigate("/admin/attendance")}/>
        <Card icon={AlertTriangle} label="Below 75%"         value="—" sub="Students at risk" color="text-red-600" onClick={()=>navigate("/admin/attendance")}/>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QuickLink icon={CheckCircle}   label="Mark Attendance"      path="/admin/attendance/mark" desc="Mark today's attendance for a section"/>
          <QuickLink icon={BarChart2}     label="Section Summary"      path="/admin/attendance"      desc="View attendance % for all students"/>
          <QuickLink icon={TrendingDown}  label="Students at Risk"     path="/admin/attendance"      desc="Below 75% attendance — needs action"/>
          <QuickLink icon={Calendar}      label="Holiday Master"       path="/admin/holidays"        desc="Manage holidays (attendance not counted)"/>
          <QuickLink icon={Users}         label="All Sections"         path="/admin/sections"        desc="View section roster"/>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1.5">
        <p className="font-semibold">How attendance works:</p>
        <p>• Holiday dates with <strong>affects_attendance: true</strong> are automatically excluded from % calculations</p>
        <p>• Faculty can only mark attendance for their assigned sections</p>
        <p>• Students below 75% are flagged automatically</p>
        <p>• Attendance can be frozen by admins to prevent editing</p>
      </div>
    </div>
  );
}