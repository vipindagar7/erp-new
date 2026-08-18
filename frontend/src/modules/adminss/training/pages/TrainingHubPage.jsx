// src/modules/adminss/training/pages/TrainingHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate }          from "react-router-dom";
import {
  Plus, Search, Filter, BookOpen, Users, Clock,
  CheckCircle, XCircle, AlertCircle, Loader2,
  BarChart2, GraduationCap, Briefcase, Wifi,
  ChevronRight, Calendar, Tag,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

const TYPE_COLOR = {
  MANDATORY: "bg-red-50 text-red-700 border-red-200",
  ELECTIVE:  "bg-blue-50 text-blue-700 border-blue-200",
  OPTIONAL:  "bg-green-50 text-green-700 border-green-200",
};
const MODE_ICON = {
  ONLINE: Wifi, OFFLINE: Briefcase, HYBRID: Briefcase,
  WORKSHOP: Briefcase, SEMINAR: GraduationCap,
  INTERNSHIP: Briefcase, GUEST_LECTURE: GraduationCap, BOOTCAMP: Briefcase,
};
const STATUS_COLOR = {
  DRAFT:       "bg-muted text-muted-foreground",
  ACTIVE:      "bg-green-50 text-green-700 border-green-200",
  ONGOING:     "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED:   "bg-violet-50 text-violet-700 border-violet-200",
  CANCELLED:   "bg-red-50 text-red-700 border-red-200",
  DEACTIVATED: "bg-muted text-muted-foreground border-border",
};

const badge = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";

export default function TrainingHubPage() {
  const navigate = useNavigate();
  const [trainings, setTrainings]   = useState([]);
  const [summary,   setSummary]     = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [search,    setSearch]      = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMode,   setFilterMode]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filterType)   params.type   = filterType;
      if (filterStatus) params.status = filterStatus;
      if (filterMode)   params.mode   = filterMode;
      if (search)       params.search = search;

      const [tRes, sRes] = await Promise.all([
        axiosInstance.get(EP.training.list, { params }),
        axiosInstance.get(EP.training.summaryReport, { params: { status: "ACTIVE" } }).catch(() => ({ data: { data: null } })),
      ]);
      setTrainings(tRes.data?.data?.trainings || []);
      setSummary(sRes.data?.data?.summary || null);
    } catch { notify.error("Failed to load trainings"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterType, filterStatus, filterMode]);

  const filtered = trainings.filter(t =>
    !search ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.code?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total",      value: trainings.length,                                        color: "text-foreground",   icon: BookOpen   },
    { label: "Active",     value: trainings.filter(t => t.status === "ACTIVE").length,     color: "text-green-600",    icon: CheckCircle},
    { label: "Mandatory",  value: trainings.filter(t => t.type === "MANDATORY").length,    color: "text-red-600",      icon: AlertCircle},
    { label: "Enrollments",value: summary?.total_enrollments || 0,                          color: "text-blue-600",     icon: Users      },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap size={20} className="text-primary"/>Training & Mentorship
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage trainings, mentors, enrollment and reports
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/admin/training/mentors")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Users size={14}/>Mentors
          </button>
          <button onClick={() => navigate("/admin/training/report")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <BarChart2 size={14}/>Reports
          </button>
          <button onClick={() => navigate("/admin/training/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14}/>New Training
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or code…"
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        {[
          { val: filterType,   set: setFilterType,   opts: ["","MANDATORY","ELECTIVE","OPTIONAL"],           label: "Type"   },
          { val: filterStatus, set: setFilterStatus, opts: ["","DRAFT","ACTIVE","ONGOING","COMPLETED","CANCELLED"], label: "Status" },
          { val: filterMode,   set: setFilterMode,   opts: ["","ONLINE","OFFLINE","HYBRID","WORKSHOP","SEMINAR","INTERNSHIP"], label: "Mode" },
        ].map(f => (
          <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
            className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
            {f.opts.map(o => <option key={o} value={o}>{o || `All ${f.label}s`}</option>)}
          </select>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
          No trainings found.{" "}
          <button onClick={() => navigate("/admin/training/new")} className="text-primary hover:underline">Create one →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(t => {
            const ModeIcon = MODE_ICON[t.mode] || Briefcase;
            return (
              <div key={t.id} onClick={() => navigate(`/admin/training/${t.id}`)}
                className="bg-card border border-border rounded-2xl p-4 space-y-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.code}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-0.5"/>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                  <span className={`${badge} ${TYPE_COLOR[t.type] || "bg-muted"}`}>{t.type}</span>
                  <span className={`${badge} ${STATUS_COLOR[t.status] || "bg-muted"}`}>{t.status}</span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ModeIcon size={9}/>{t.mode}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={10}/>
                    {new Date(t.start_date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                    {" → "}
                    {new Date(t.end_date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={10}/>{t._count?.enrollments || 0}
                  </span>
                </div>

                {/* Department */}
                {t.department && (
                  <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
                    {t.department.name}
                  </p>
                )}

                {/* Mentors */}
                {t.mentors?.length > 0 && (
                  <div className="flex -space-x-1">
                    {t.mentors.slice(0, 4).map(m => (
                      <div key={m.id} title={m.faculty?.name}
                        className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center border border-background">
                        {m.faculty?.name?.charAt(0)}
                      </div>
                    ))}
                    {t.mentors.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-[9px] flex items-center justify-center border border-background">
                        +{t.mentors.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
