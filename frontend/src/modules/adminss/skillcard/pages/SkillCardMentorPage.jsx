// src/modules/adminss/skillcard/pages/SkillCardMentorPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Award, Search, CheckCircle, Loader2, ChevronRight, Users } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function SkillCardMentorPage() {
  const navigate  = useNavigate();
  const { user }  = useSelector(s => s.auth);
  const faculty   = user?.faculty;
  const [sections, setSections] = useState([]);
  const [selSection, setSelSection] = useState("");
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    axiosInstance.get(EP.sections.list + "?status=ACTIVE&limit=100")
      .then(r => {
        const all = r.data?.data?.sections || r.data?.data || [];
        setSections(all);
        if (all.length) { setSelSection(all[0].id); loadStudents(all[0].id); }
      }).catch(() => {});
  }, []);

  const loadStudents = async (sectionId) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(EP.skillCard.mentorView(sectionId));
      setStudents(res.data?.data || []);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const filtered = students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.toLowerCase().includes(search.toLowerCase())
  );

  const getReadiness = (card) => {
    if (!card) return { level: "NO CARD", color: "text-muted-foreground", pct: 0 };
    const pct = card.total_entries > 0 ? Math.round(card.completed_entries / card.total_entries * 100) : 0;
    const level = pct >= 80 ? "PLACEMENT_READY" : pct >= 50 ? "JOB_READY" : "FOUNDATIONAL";
    const color = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-blue-600" : "text-amber-600";
    return { level, color, pct };
  };

  const stats = {
    total:     students.length,
    withCard:  students.filter(s => s.skillCard).length,
    placement: students.filter(s => getReadiness(s.skillCard).level === "PLACEMENT_READY").length,
    jobReady:  students.filter(s => getReadiness(s.skillCard).level === "JOB_READY").length,
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Award size={20} className="text-primary"/>Mentor View — Skill Cards
          </h1>
          <p className="text-sm text-muted-foreground">Track your students' training completion progress</p>
        </div>
        <button onClick={() => navigate("/admin/skill-card/bulk")}
          className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          Bulk Update
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total Students",     value:stats.total,      color:"text-foreground" },
          { label:"Cards Initialized",  value:stats.withCard,   color:"text-blue-600"   },
          { label:"Placement Ready",    value:stats.placement,  color:"text-green-600"  },
          { label:"Job Ready",          value:stats.jobReady,   color:"text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section selector + search */}
      <div className="flex gap-2">
        <select value={selSection} onChange={e => { setSelSection(e.target.value); loadStudents(e.target.value); }}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sections.map(s => <option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
        </select>
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student…"
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
      </div>

      {/* Student list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">No students found</div>
            )}
            {filtered.map(s => {
              const r = getReadiness(s.skillCard);
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {s.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.roll_no}</p>
                  </div>

                  {s.skillCard ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-medium">{s.skillCard.completed_entries}/{s.skillCard.total_entries}</p>
                        <p className="text-[10px] text-muted-foreground">entries done</p>
                      </div>
                      <div className="w-20">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${r.pct}%` }}/>
                        </div>
                        <p className={`text-[10px] font-medium mt-0.5 ${r.color}`}>{r.pct}%</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
                        ${r.level==="PLACEMENT_READY"?"bg-green-50 text-green-700 border-green-200":
                          r.level==="JOB_READY"?"bg-blue-50 text-blue-700 border-blue-200":
                          "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {r.level.replace(/_/g," ")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-muted rounded-full">No card</span>
                  )}

                  <button onClick={() => navigate(`/admin/skill-card/${s.id}`)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                    <ChevronRight size={14}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
