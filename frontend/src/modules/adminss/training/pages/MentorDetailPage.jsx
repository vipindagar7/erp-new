// src/modules/adminss/training/pages/MentorDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, BarChart2, Users, CheckCircle, Calendar, GraduationCap } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

const STATUS_COLOR = { ACTIVE:"text-green-600", ONGOING:"text-blue-600", COMPLETED:"text-violet-600", CANCELLED:"text-red-500", DRAFT:"text-muted-foreground" };

export default function MentorDetailPage() {
  const { facultyId } = useParams();
  const navigate      = useNavigate();
  const [data,    setData]    = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expand,  setExpand]  = useState({});

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.training.mentorReport(facultyId)),
      axiosInstance.get(EP.faculty.byId(facultyId)),
    ]).then(([rRes, fRes]) => {
      setData(rRes.data?.data);
      setFaculty(fRes.data?.data);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [facultyId]);

  const exportCSV = () => {
    if (!data?.trainings?.length) return;
    const rows = [];
    data.trainings.forEach(t => {
      (t.students||[]).forEach(s => {
        rows.push([t.title, t.code, t.type, t.status, s.student?.name, s.student?.roll_no, s.status, s.attendance_pct?.toFixed(1)||0]);
      });
    });
    const csv = [["Training","Code","Type","Status","Student","Roll No","Enrollment Status","Attendance %"], ...rows].map(r=>r.join(",")).join("\n");
    const a   = document.createElement("a");
    a.href    = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download= `mentor-report-${faculty?.name?.replace(/ /g,"-")}.csv`;
    a.click();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!data || !faculty) return <div className="text-center py-20 text-muted-foreground">No data found</div>;

  const { summary, trainings } = data;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/training/mentors")}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary text-lg font-bold flex items-center justify-center">
            {faculty.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{faculty.name}</h1>
            <p className="text-sm text-muted-foreground">{faculty.designation} · {faculty.department?.name}</p>
          </div>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={14}/>Export
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total Trainings",     value:summary?.total_trainings||0,         color:"text-blue-600"   },
          { label:"Active",              value:summary?.active_trainings||0,         color:"text-green-600"  },
          { label:"Total Students",      value:summary?.total_students||0,           color:"text-foreground" },
          { label:"Completed Students",  value:summary?.completed_students||0,       color:"text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overall metrics */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performance Overview</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{summary?.avg_attendance_pct||0}%</p>
            <p className="text-xs text-muted-foreground">Avg Attendance</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {summary?.total_students > 0
                ? Math.round((summary?.completed_students||0)/summary.total_students*100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">{summary?.completed_trainings||0}</p>
            <p className="text-xs text-muted-foreground">Trainings Completed</p>
          </div>
        </div>
      </div>

      {/* Training-wise breakdown */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Training-wise Breakdown ({trainings.length})</p>
        {trainings.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
            No trainings as mentor yet
          </div>
        ) : trainings.map(t => {
          const completionPct = t.total_students > 0 ? Math.round((t.completed||0)/t.total_students*100) : 0;
          const isExpanded    = expand[t.training_id];
          return (
            <div key={t.training_id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Training header */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{t.title}</p>
                      <span className="text-[10px] text-muted-foreground">{t.code}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium ${STATUS_COLOR[t.status]||"text-muted-foreground"}`}>{t.status}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{t.type}</span>
                      <span className="text-[10px] text-muted-foreground">· Role: {t.role}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/admin/training/${t.training_id}`)}
                    className="text-xs text-primary hover:underline shrink-0">View →</button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label:"Students", value:t.total_students },
                    { label:"Completed", value:t.completed     },
                    { label:"Avg Attend", value:t.avg_attendance+"%"},
                    { label:"Completion", value:completionPct+"%"},
                  ].map(s => (
                    <div key={s.label} className="bg-muted/20 rounded-xl p-2 text-center">
                      <p className="text-sm font-bold">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar size={9}/>
                  {new Date(t.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} →{" "}
                  {new Date(t.end_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}
                </div>

                {/* Expand students */}
                {t.students?.length > 0 && (
                  <button onClick={() => setExpand(prev => ({...prev, [t.training_id]: !isExpanded}))}
                    className="text-xs text-primary hover:underline">
                    {isExpanded ? "Hide students ↑" : `Show ${t.students.length} students ↓`}
                  </button>
                )}
              </div>

              {/* Student list (expandable) */}
              {isExpanded && (
                <div className="border-t border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/20 border-b border-border">
                        <tr>
                          {["Student","Roll No","Status","Attendance %"].map(h =>
                            <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {t.students.map(s => (
                          <tr key={s.student?.id} className="hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium">{s.student?.name}</td>
                            <td className="px-3 py-2 text-muted-foreground">{s.student?.roll_no}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold
                                ${s.status==="COMPLETED"?"bg-green-50 text-green-700":s.status==="DROPPED"?"bg-red-50 text-red-700":"bg-muted text-muted-foreground"}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{width:`${s.attendance_pct||0}%`}}/>
                                </div>
                                <span className="font-medium">{(s.attendance_pct||0).toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
