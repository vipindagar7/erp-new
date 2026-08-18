// src/modules/adminss/training/pages/TrainingSummaryReportPage.jsx
import { useState, useEffect } from "react";
import { useNavigate }          from "react-router-dom";
import { BarChart2, Download, Loader2, Users, CheckCircle, GraduationCap, Filter } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

const TYPE_COLOR   = { MANDATORY:"text-red-600", ELECTIVE:"text-blue-600", OPTIONAL:"text-green-600" };
const STATUS_COLOR = { ACTIVE:"text-green-600", ONGOING:"text-blue-600", COMPLETED:"text-violet-600", CANCELLED:"text-red-500", DRAFT:"text-muted-foreground" };

export default function TrainingSummaryReportPage() {
  const navigate = useNavigate();
  const [report,   setReport]   = useState(null);
  const [sessions, setSessions] = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({ session_id:"", dept_id:"", type:"", status:"" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.session_id) params.session_id = filters.session_id;
      if (filters.dept_id)    params.dept_id    = filters.dept_id;
      if (filters.type)       params.type       = filters.type;
      if (filters.status)     params.status     = filters.status;

      const [rRes, sRes, dRes] = await Promise.all([
        axiosInstance.get(EP.training.summaryReport, { params }),
        axiosInstance.get(EP.sessions.list).catch(() => ({data:{data:[]}})),
        axiosInstance.get(EP.departments.list + "?limit=100").catch(() => ({data:{data:[]}})),
      ]);
      setReport(rRes.data?.data);
      setSessions(sRes.data?.data || []);
      setDepts(dRes.data?.data?.departments || dRes.data?.data || []);
    } catch { notify.error("Failed to load report"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const setFilter = k => e => setFilters(f => ({...f, [k]: e.target.value}));

  const exportCSV = () => {
    if (!report?.trainings?.length) return;
    const rows = report.trainings.map(t => [
      t.title, t.code, t.type, t.mode, t.status,
      new Date(t.start_date).toLocaleDateString("en-IN"),
      new Date(t.end_date).toLocaleDateString("en-IN"),
      t._count?.enrollments||0, t._count?.sections||0, t._count?.mentors||0,
    ]);
    const csv = [["Title","Code","Type","Mode","Status","Start","End","Enrollments","Sections","Mentors"],...rows].map(r=>r.join(",")).join("\n");
    const a   = document.createElement("a");
    a.href    = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download= "training-summary-report.csv";
    a.click();
  };

  const sel = "h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 size={20} className="text-primary"/>Summary Report
          </h1>
          <p className="text-sm text-muted-foreground">All trainings overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/admin/training/mentors")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <GraduationCap size={14}/>Mentor Reports
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Download size={14}/>Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filters.session_id} onChange={setFilter("session_id")} className={sel}>
          <option value="">All Sessions</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.dept_id} onChange={setFilter("dept_id")} className={sel}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filters.type} onChange={setFilter("type")} className={sel}>
          <option value="">All Types</option>
          {["MANDATORY","ELECTIVE","OPTIONAL"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={setFilter("status")} className={sel}>
          <option value="">All Statuses</option>
          {["DRAFT","ACTIVE","ONGOING","COMPLETED","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : report ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label:"Trainings",      value:report.summary?.total_trainings||0,     color:"text-blue-600"   },
              { label:"Enrollments",    value:report.summary?.total_enrollments||0,   color:"text-foreground" },
              { label:"Completed",      value:report.summary?.completed_students||0,  color:"text-green-600"  },
              { label:"Completion %",   value:(report.summary?.completion_rate||0)+"%",color:"text-violet-600"},
              { label:"Fee Expected",   value:"₹"+(report.summary?.total_fee_expected||0), color:"text-amber-600"},
              { label:"Fee Collected",  value:"₹"+(report.summary?.total_fee_collected||0),color:"text-green-600"},
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium">{report.trainings?.length||0} trainings</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    {["Training","Code","Type","Mode","Status","Start","End","Enrolled","Sections","Mentors","Action"].map(h =>
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(report.trainings||[]).map(t => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">{t.title}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{t.code}</td>
                      <td className={`px-3 py-2.5 font-medium ${TYPE_COLOR[t.type]||""}`}>{t.type}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{t.mode}</td>
                      <td className={`px-3 py-2.5 font-medium ${STATUS_COLOR[t.status]||""}`}>{t.status}</td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {new Date(t.start_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {new Date(t.end_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium text-blue-600">{t._count?.enrollments||0}</td>
                      <td className="px-3 py-2.5 text-center">{t._count?.sections||0}</td>
                      <td className="px-3 py-2.5 text-center">{t._count?.mentors||0}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/admin/training/${t.id}`)}
                            className="text-primary hover:underline">View</button>
                          <button onClick={() => navigate(`/admin/training/${t.id}/report`)}
                            className="text-muted-foreground hover:text-primary hover:underline">Report</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
