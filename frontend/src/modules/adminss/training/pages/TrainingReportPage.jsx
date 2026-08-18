// src/modules/adminss/training/pages/TrainingReportPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, BarChart2, Users, CheckCircle, IndianRupee } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

export default function TrainingReportPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sortBy,  setSortBy]  = useState("name"); // name | attendance | fee

  useEffect(() => {
    axiosInstance.get(EP.training.report(id))
      .then(res => setReport(res.data?.data))
      .catch(() => notify.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  const exportCSV = () => {
    if (!report?.studentReport?.length) return;
    const headers = ["Name","Roll No","Section","Department","Status","Total Sessions","Attended","Attendance %","Present","Absent","Late","Fee Status","Fee Amount","Fee Paid","Refund","Extra Units"];
    const rows = report.studentReport.map(s => [
      s.student?.name, s.student?.roll_no, s.student?.section?.name,
      s.student?.department?.name, s.status,
      s.total_sessions, s.attended, s.attendance_pct?.toFixed(1),
      s.present, s.absent, s.late,
      s.fee_status, s.fee_amount, s.fee_paid, s.refund, s.extra_units,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a   = document.createElement("a");
    a.href    = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download= `training-report-${report.training?.code}.csv`;
    a.click();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!report)  return <div className="text-center py-20 text-muted-foreground">No report data</div>;

  const { training, summary, studentReport, feeReport } = report;

  let filtered = [...(studentReport||[])];
  if (search) filtered = filtered.filter(s =>
    s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student?.roll_no?.toLowerCase().includes(search.toLowerCase())
  );
  filtered.sort((a,b) => {
    if (sortBy === "attendance") return (b.attendance_pct||0) - (a.attendance_pct||0);
    if (sortBy === "fee")        return a.fee_status?.localeCompare(b.fee_status||"");
    return a.student?.name?.localeCompare(b.student?.name||"");
  });

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(`/admin/training/${id}`)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 size={18} className="text-primary"/>Training Report
          </h1>
          <p className="text-sm text-muted-foreground">{training?.title} · {training?.code}</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={14}/>Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total Enrolled",   value:summary?.total_enrolled||0,           color:"text-blue-600",   icon:Users        },
          { label:"Completed",        value:summary?.completed||0,                 color:"text-green-600",  icon:CheckCircle  },
          { label:"Avg Attendance",   value:(summary?.avg_attendance||0)+"%",      color:"text-violet-600", icon:BarChart2    },
          { label:"Fee Collected",    value:"₹"+(feeReport?.collected||0),         color:"text-amber-600",  icon:IndianRupee  },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className={`${s.color} mb-2`}/>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Fee summary */}
      {training?.has_fee && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Collected",  value:`₹${feeReport?.collected||0}`,   color:"text-green-600"  },
            { label:"Pending",    value:`₹${feeReport?.pending||0}`,     color:"text-amber-600"  },
            { label:"Refunded",   value:`₹${feeReport?.refunded||0}`,    color:"text-violet-600" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance distribution */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendance Distribution</p>
        <div className="flex items-end gap-1 h-24">
          {[0,10,20,30,40,50,60,70,80,90].map(bucket => {
            const count = filtered.filter(s => s.attendance_pct >= bucket && s.attendance_pct < bucket+10).length;
            const pct   = filtered.length ? (count/filtered.length)*100 : 0;
            return (
              <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/80 rounded-t-sm transition-all" style={{height:`${Math.max(2,pct)}%`}}/>
                <span className="text-[8px] text-muted-foreground">{bucket}%</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"/>
            ≥{training?.attendance_pct_required||75}% (eligible): {filtered.filter(s => s.attendance_pct>=(training?.attendance_pct_required||75)).length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"/>
            Below: {filtered.filter(s => s.attendance_pct<(training?.attendance_pct_required||75)).length}
          </span>
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student…"
            className="flex-1 h-8 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring"/>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none">
            <option value="name">Sort: Name</option>
            <option value="attendance">Sort: Attendance</option>
            <option value="fee">Sort: Fee</option>
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["#","Student","Section","Status","Sessions","Attended","Attend %","Present","Absent","Late","Extra Units","Fee Status","Fee Paid"].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, idx) => (
                <tr key={s.student?.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 text-muted-foreground">{idx+1}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{s.student?.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.student?.roll_no}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.student?.section?.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold
                      ${s.status==="COMPLETED"?"bg-green-50 text-green-700":s.status==="DROPPED"?"bg-red-50 text-red-700":"bg-muted text-muted-foreground"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">{s.total_sessions}</td>
                  <td className="px-3 py-2.5 text-center">{s.attended}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.attendance_pct>=(training?.attendance_pct_required||75)?"bg-green-500":"bg-red-500"}`}
                          style={{width:`${s.attendance_pct||0}%`}}/>
                      </div>
                      <span className={`font-medium ${s.attendance_pct>=(training?.attendance_pct_required||75)?"text-green-600":"text-red-500"}`}>
                        {(s.attendance_pct||0).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-green-600 text-center">{s.present}</td>
                  <td className="px-3 py-2.5 text-red-500 text-center">{s.absent}</td>
                  <td className="px-3 py-2.5 text-amber-600 text-center">{s.late}</td>
                  <td className="px-3 py-2.5 text-center">
                    {s.extra_units > 0 ? <span className="text-violet-600 font-medium">+{s.extra_units}</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold
                      ${s.fee_status==="PAID"?"bg-green-50 text-green-700":s.fee_status==="PENDING"?"bg-amber-50 text-amber-700":s.fee_status==="REFUNDED"?"bg-violet-50 text-violet-700":"bg-muted text-muted-foreground"}`}>
                      {s.fee_status||"N/A"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {s.fee_amount > 0 ? `₹${s.fee_paid||0} / ₹${s.fee_amount}` : "Free"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
