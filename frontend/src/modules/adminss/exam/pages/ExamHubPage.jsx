// src/modules/adminss/exam/pages/ExamHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, BarChart2, FileText, Users, Calendar, Loader2, ChevronRight, CheckCircle, AlertCircle, Clock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const EXAM_TYPES = [
  { key:"CLASS_TEST",           label:"Class Test",            color:"bg-blue-50 text-blue-700"   },
  { key:"SESSIONAL_1",          label:"Sessional 1",           color:"bg-violet-50 text-violet-700"},
  { key:"SESSIONAL_2",          label:"Sessional 2",           color:"bg-violet-50 text-violet-700"},
  { key:"MID_TERM",             label:"Mid Term",              color:"bg-amber-50 text-amber-700"  },
  { key:"PRE_UNIVERSITY",       label:"Pre-University",        color:"bg-orange-50 text-orange-700"},
  { key:"UNIVERSITY_THEORY",    label:"University Theory",     color:"bg-red-50 text-red-700"      },
  { key:"UNIVERSITY_PRACTICAL", label:"University Practical",  color:"bg-green-50 text-green-700"  },
  { key:"INTERNAL_PRACTICAL",   label:"Internal Practical",    color:"bg-teal-50 text-teal-700"    },
];

export default function ExamHubPage() {
  const navigate = useNavigate();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.exam.list + "?limit=50")
      .then(r => setExams(r.data?.data?.items || []))
      .catch(e => { if (e.response?.status !== 500) notify.error("Failed to load exams"); })
      .finally(() => setLoading(false));
  }, []);

  const active    = exams.filter(e => ["SCHEDULED","ONGOING"].includes(e.status));
  const upcoming  = exams.filter(e => e.status === "SCHEDULED" && new Date(e.start_date) > new Date());
  const completed = exams.filter(e => e.status === "COMPLETED");

  const stats = [
    { label:"Total Exams",  value:exams.length,    color:"text-foreground", icon:ClipboardList },
    { label:"Active",       value:active.length,   color:"text-green-600",  icon:CheckCircle  },
    { label:"Upcoming",     value:upcoming.length,  color:"text-blue-600",   icon:Clock        },
    { label:"Completed",    value:completed.length, color:"text-violet-600", icon:BarChart2    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList size={20} className="text-primary"/>Exam Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Schedule exams, manage seating, hall tickets and results</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/admin/exam/datesheet")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Calendar size={14}/>Datesheet
          </button>
          <button onClick={() => navigate("/admin/exam/report")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <BarChart2 size={14}/>Reports
          </button>
          <button onClick={() => navigate("/admin/exam/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14}/>New Exam
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className={`${s.color} mb-2`}/>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label:"Seating Plans",   path:"/admin/exam/seating",  icon:Users        },
          { label:"Hall Tickets",    path:"/admin/exam/tickets",  icon:FileText     },
          { label:"Marks Entry",     path:"/admin/exam/marks",    icon:ClipboardList},
          { label:"Publish Results", path:"/admin/exam/results",  icon:CheckCircle  },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 p-3 rounded-xl border border-border text-xs font-medium hover:bg-muted/30 transition-colors">
            <a.icon size={14} className="text-primary"/>{a.label}
          </button>
        ))}
      </div>

      {/* By Type */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Browse by Exam Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EXAM_TYPES.map(t => {
            const count = exams.filter(e => e.exam_type === t.key).length;
            return (
              <button key={t.key} onClick={() => navigate(`/admin/exam/list?type=${t.key}`)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border border-border text-xs font-medium hover:shadow-sm transition-all ${t.color}`}>
                <span>{t.label}</span>
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent/Active exams */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Recent Exams</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
            No exams yet. <button onClick={() => navigate("/admin/exam/new")} className="text-primary hover:underline">Create one →</button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {exams.slice(0,10).map(e => (
                <div key={e.id} onClick={() => navigate(`/admin/exam/${e.id}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {EXAM_TYPES.find(t=>t.key===e.exam_type)?.label} · {new Date(e.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                    ${e.status==="SCHEDULED"?"bg-blue-50 text-blue-700":e.status==="COMPLETED"?"bg-green-50 text-green-700":e.status==="ONGOING"?"bg-amber-50 text-amber-700":"bg-muted text-muted-foreground"}`}>
                    {e.status}
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0"/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}