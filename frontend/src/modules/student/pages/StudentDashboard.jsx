// src/modules/portal/student/pages/StudentDashboard.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, BarChart2, BookOpen, ClipboardList,
  Bell, FileText, GraduationCap, Loader2, TrendingUp,
  AlertCircle, CheckCircle,
} from "lucide-react";
import axiosInstance from "../../../lib/axios.js";
import { EP }        from "../../../config/api.config.js";

const COLOR = {
  blue:  "bg-blue-50 border-blue-100 text-blue-600",
  green: "bg-green-50 border-green-100 text-green-600",
  violet:"bg-violet-50 border-violet-100 text-violet-600",
  amber: "bg-amber-50 border-amber-100 text-amber-600",
  teal:  "bg-teal-50 border-teal-100 text-teal-600",
  rose:  "bg-rose-50 border-rose-100 text-rose-600",
};

export default function StudentDashboard() {
  const user     = useSelector(s => s.auth?.user);
  const student  = user?.student;
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student?.id) return;
    // Fetch attendance summary
    axiosInstance.get(`/attendance/student/${student.id}/summary`).then(r => {
      setStats(r.data?.data);
    }).catch(() => setStats(null));
  }, [student?.id]);

  const QUICK_ACTIONS = [
    { label:"My Timetable",  icon:CalendarDays, path:"/portal/student/timetable",   color:"blue",   desc:"Class schedule for this week"      },
    { label:"Attendance",    icon:BarChart2,    path:"/portal/student/attendance",   color:"green",  desc:"Subject-wise attendance summary"   },
    { label:"Feedback",      icon:ClipboardList,path:"/portal/student/feedback",     color:"violet", desc:"Active feedback forms"             },
    { label:"Leave",         icon:FileText,     path:"/portal/student/leave",        color:"amber",  desc:"Apply for leave"                   },
    { label:"Subjects",      icon:BookOpen,     path:"/portal/student/subjects",     color:"teal",   desc:"Subjects, faculty & syllabus"      },
    { label:"Notices",       icon:Bell,         path:"/portal/student/notices",      color:"rose",   desc:"Announcements & important notices" },
  ];

  const sec = student?.section;
  const breadcrumb = [sec?.branch?.program?.department?.name, sec?.branch?.program?.name, sec?.branch?.name, sec?.name].filter(Boolean).join(" › ");

  const today_str = new Date().toLocaleDateString("en-IN",{ weekday:"long", day:"numeric", month:"long" });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">{today_str}</p>
        <h1 className="text-2xl font-bold mt-0.5">
          Hello, {student?.name?.split(" ")[0] || "Student"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{breadcrumb} · Sem {sec?.semester}</p>
        <p className="text-xs text-muted-foreground">Roll No: {student?.roll_no} · {student?.enrollment_no}</p>
      </div>

      {/* Attendance alert */}
      {stats && (
        <div className={`border rounded-2xl p-4 flex items-center gap-3 ${
          stats.overall_percentage < 75
            ? "bg-red-50 border-red-200"
            : stats.overall_percentage < 85
              ? "bg-amber-50 border-amber-200"
              : "bg-green-50 border-green-200"
        }`}>
          {stats.overall_percentage < 75
            ? <AlertCircle size={20} className="text-red-600 shrink-0"/>
            : <CheckCircle size={20} className="text-green-600 shrink-0"/>}
          <div className="flex-1">
            <p className={`font-semibold text-sm ${stats.overall_percentage<75?"text-red-800":"text-green-800"}`}>
              Overall Attendance: {stats.overall_percentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.overall_percentage < 75
                ? "⚠ Below 75% — you may be detained. Contact your coordinator."
                : "You're maintaining required attendance. Keep it up!"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{stats.overall_percentage}%</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats?.subjects && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Subjects",       value:stats.subjects.length,                                           color:"text-blue-600"  },
            { label:"Classes Attended",value:stats.subjects.reduce((s,x)=>s+(x.present||0),0),              color:"text-green-600" },
            { label:"Classes Missed", value:stats.subjects.reduce((s,x)=>s+(x.absent||0),0),               color:"text-red-600"   },
            { label:"Attendance %",   value:`${stats.overall_percentage}%`,                                 color:"text-primary"   },
          ].map(({label,value,color}) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({label,icon:Icon,path,color,desc}) => (
            <button key={path} onClick={()=>navigate(path)}
              className="text-left bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all group space-y-2">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${COLOR[color]}`}>
                <Icon size={18}/>
              </div>
              <p className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}