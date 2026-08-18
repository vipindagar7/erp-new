// src/modules/adminss/training/pages/MentorListPage.jsx
import { useState, useEffect } from "react";
import { useNavigate }          from "react-router-dom";
import { Search, BarChart2, Users, Loader2, ChevronRight, GraduationCap, Award } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

export default function MentorListPage() {
  const navigate = useNavigate();
  const [mentors,  setMentors]  = useState([]);  // { faculty, trainings count, stats }
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    // Load all faculty who are mentors in at least one training
    axiosInstance.get(EP.faculty.list + "?limit=200&status=ACTIVE")
      .then(async res => {
        const allFaculty = res.data?.data?.faculty || res.data?.data || [];
        // For each faculty, try to load their track record
        const mentorData = await Promise.all(
          allFaculty.map(async f => {
            try {
              const r = await axiosInstance.get(EP.training.mentorReport(f.id));
              const d = r.data?.data;
              if (!d || d.trainings?.length === 0) return null;
              return { faculty: f, ...d.summary, trainings: d.trainings };
            } catch { return null; }
          })
        );
        setMentors(mentorData.filter(Boolean));
      })
      .catch(() => notify.error("Failed to load mentors"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mentors.filter(m =>
    !search ||
    m.faculty?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.faculty?.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap size={20} className="text-primary"/>Mentors
          </h1>
          <p className="text-sm text-muted-foreground">{mentors.length} active mentors across all trainings</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Mentors",       value:mentors.length,                                                   color:"text-blue-600"   },
          { label:"Total Students",      value:mentors.reduce((s,m) => s+(m.total_students||0), 0),              color:"text-green-600"  },
          { label:"Avg Completion Rate", value: mentors.length
              ? Math.round(mentors.reduce((s,m) => s + (m.completed_students||0)/(m.total_students||1)*100, 0)/mentors.length) + "%"
              : "—",                                                                                              color:"text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search mentor name or department…"
          className="w-full h-10 pl-8 pr-4 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
      </div>

      {/* Mentor cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
          No mentors found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(m => {
            const completionPct = m.total_students > 0
              ? Math.round((m.completed_students||0)/m.total_students*100) : 0;
            return (
              <div key={m.faculty?.id}
                onClick={() => navigate(`/admin/training/mentors/${m.faculty?.id}/report`)}
                className="bg-card border border-border rounded-2xl p-4 space-y-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {m.faculty?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.faculty?.name}</p>
                      <p className="text-xs text-muted-foreground">{m.faculty?.designation} · {m.faculty?.department?.name}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground mt-1 shrink-0"/>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label:"Trainings",  value:m.total_trainings||0          },
                    { label:"Students",   value:m.total_students||0           },
                    { label:"Completed",  value:m.completed_students||0       },
                    { label:"Avg Attend", value:(m.avg_attendance_pct||0)+"%"  },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/20 rounded-xl p-2">
                      <p className="text-sm font-bold">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Completion bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">{completionPct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width:`${completionPct}%`}}/>
                  </div>
                </div>

                {/* Active trainings */}
                {m.active_trainings > 0 && (
                  <p className="text-[10px] text-green-600 font-medium">
                    {m.active_trainings} active training{m.active_trainings>1?"s":""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
