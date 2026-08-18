// src/modules/adminss/exam/pages/ExamDetailPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Loader2, Users, Calendar, CheckCircle, FileText, ClipboardList, BarChart2, Printer, Plus, ChevronRight } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const TABS = ["Overview","Schedule","Seating","Hall Tickets","Marks","Report"];
const badge = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [actionLoading, setActionLoading] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(EP.exam.byId(id));
      setExam(res.data?.data);
    } catch { notify.error("Failed to load exam"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generateSeating = async () => {
    const date = prompt("Enter exam date (YYYY-MM-DD):", exam?.start_date?.slice(0,10));
    if (!date) return;
    setActionLoading("seating");
    try {
      const res = await axiosInstance.post(EP.exam.seating(id), { exam_date: date });
      notify.success(`Seating generated: ${res.data?.data?.generated} students`);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(""); }
  };

  const generateTickets = async () => {
    setActionLoading("tickets");
    try {
      const res = await axiosInstance.post(EP.exam.tickets(id), {});
      notify.success(`${res.data?.data?.generated} hall tickets generated`);
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(""); }
  };

  const publishResults = async () => {
    if (!confirm("Publish results to student portal?")) return;
    setActionLoading("results");
    try {
      await axiosInstance.post(EP.exam.publish(id));
      notify.success("Results published");
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(""); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!exam) return <div className="text-center py-20 text-sm text-muted-foreground">Exam not found</div>;

  const e = exam;
  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/exam")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground mt-0.5"><ArrowLeft size={18}/></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{e.title}</h1>
          <p className="text-sm text-muted-foreground">{e.exam_type?.replace(/_/g," ")} · {new Date(e.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} → {new Date(e.end_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate(`/admin/exam/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40"><Edit size={12}/>Edit</button>
          <button onClick={() => navigate(`/admin/exam/${id}/report`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40"><BarChart2 size={12}/>Report</button>
          {!e.result_published && e.status === "COMPLETED" && (
            <button onClick={publishResults} disabled={actionLoading==="results"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-60">
              {actionLoading==="results"?<Loader2 size={11} className="animate-spin"/>:<CheckCircle size={11}/>}Publish Results
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Subjects",     value:e.schedule?.length||0,     icon:ClipboardList },
          { label:"Rooms",        value:e.rooms?.length||0,         icon:Users        },
          { label:"Hall Tickets", value:e._count?.hallTickets||0,   icon:FileText     },
          { label:"Status",       value:e.status,                   icon:CheckCircle  },
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className="text-primary mb-2"/>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab===t?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==="Overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</p>
            {[
              ["Type",          e.exam_type?.replace(/_/g," ")],
              ["Start",         new Date(e.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})],
              ["End",           new Date(e.end_date).toLocaleDateString("en-IN",{dateStyle:"medium"})],
              ["Seating",       e.seating_auto?"Auto-generate":"Manual"],
              ["Hall Tickets",  e.hall_ticket_enabled?"Enabled":"Disabled"],
              ["Results",       e.result_published?"Published":"Not published"],
            ].map(([l,v])=>(
              <div key={l} className="flex justify-between text-sm">
                <span className="text-muted-foreground text-xs">{l}</span>
                <span className="text-xs font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {e.instructions && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Instructions</p>
                <p className="text-sm text-muted-foreground">{e.instructions}</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
              {[
                { label:"Generate Seating",   action:generateSeating,   loading:"seating",  icon:Users        },
                { label:"Generate Tickets",   action:generateTickets,   loading:"tickets",  icon:FileText     },
                { label:"Enter Marks",        action:()=>setTab("Marks"),loading:"",        icon:ClipboardList},
              ].map(a=>(
                <button key={a.label} onClick={a.action} disabled={actionLoading===a.loading}
                  className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border hover:bg-muted/30 text-sm text-left disabled:opacity-60">
                  <div className="flex items-center gap-2">
                    {actionLoading===a.loading?<Loader2 size={13} className="animate-spin"/>:<a.icon size={13}/>}
                    {a.label}
                  </div>
                  <ChevronRight size={12} className="text-muted-foreground"/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule */}
      {tab==="Schedule" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{e.schedule?.length||0} subjects scheduled</p>
            <button onClick={() => navigate(`/admin/exam/${id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40"><Plus size={11}/>Add Subject</button>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/30">
                <tr>{["Subject","Date","Time","Max Marks","Pass Marks","Type"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(e.schedule||[]).map(s=>(
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-medium">{s.subject?.name}</td>
                    <td className="px-3 py-2.5">{new Date(s.exam_date).toLocaleDateString("en-IN",{dateStyle:"short"})}</td>
                    <td className="px-3 py-2.5">{s.start_time}–{s.end_time}</td>
                    <td className="px-3 py-2.5">{s.max_marks}</td>
                    <td className="px-3 py-2.5">{s.passing_marks}</td>
                    <td className="px-3 py-2.5"><span className={`${badge} ${s.is_practical?"bg-green-50 text-green-700 border-green-200":"bg-blue-50 text-blue-700 border-blue-200"}`}>{s.is_practical?"Practical":"Theory"}</span></td>
                  </tr>
                ))}
                {!e.schedule?.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No schedule yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seating */}
      {tab==="Seating" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Seating Management</p>
            <button onClick={generateSeating} disabled={actionLoading==="seating"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-60">
              {actionLoading==="seating"?<Loader2 size={11} className="animate-spin"/>:<Users size={11}/>}
              Auto-Generate Seating
            </button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center py-10">
            <Users size={32} className="mx-auto text-muted-foreground/30 mb-3"/>
            <p className="text-sm text-muted-foreground">Click "Auto-Generate Seating" to assign seats</p>
            <p className="text-xs text-muted-foreground mt-1">Students will be mixed across branches automatically</p>
          </div>
        </div>
      )}

      {/* Hall Tickets */}
      {tab==="Hall Tickets" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{e._count?.hallTickets||0} hall tickets generated</p>
            <button onClick={generateTickets} disabled={actionLoading==="tickets"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-60">
              {actionLoading==="tickets"?<Loader2 size={11} className="animate-spin"/>:<FileText size={11}/>}
              Generate All Tickets
            </button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center py-10">
            <FileText size={32} className="mx-auto text-muted-foreground/30 mb-3"/>
            <p className="text-sm text-muted-foreground">Generate hall tickets for all enrolled students</p>
            <p className="text-xs text-muted-foreground mt-1">Each ticket includes: student photo, seat number, exam schedule</p>
            <button onClick={() => navigate(`/admin/exam/${id}/tickets`)}
              className="mt-3 text-xs text-primary hover:underline">View individual hall tickets →</button>
          </div>
        </div>
      )}

      {/* Marks */}
      {tab==="Marks" && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Enter marks per subject</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(e.schedule||[]).map(s=>(
              <button key={s.id} onClick={() => navigate(`/admin/exam/${id}/marks?subject_id=${s.subject_id}`)}
                className="bg-card border border-border rounded-2xl p-4 text-left hover:shadow-sm hover:-translate-y-0.5 transition-all">
                <p className="font-semibold text-sm">{s.subject?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(s.exam_date).toLocaleDateString("en-IN",{dateStyle:"short"})} · Max: {s.max_marks}</p>
                <p className="text-xs text-primary mt-2 hover:underline">Enter marks →</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      {tab==="Report" && (
        <div className="text-center py-10 bg-card border border-border rounded-2xl">
          <BarChart2 size={32} className="mx-auto text-muted-foreground/30 mb-3"/>
          <p className="text-sm text-muted-foreground">View detailed subject-wise result analysis</p>
          <button onClick={() => navigate(`/admin/exam/${id}/report`)}
            className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
            Open Full Report →
          </button>
        </div>
      )}
    </div>
  );
}
