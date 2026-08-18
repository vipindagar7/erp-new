// src/modules/adminss/exam/pages/ExamReportPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, BarChart2, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function ExamReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.exam.report(id))
      .then(r => setReport(r.data?.data))
      .catch(() => notify.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  const exportCSV = () => {
    if (!report?.subjectReport) return;
    const rows = [];
    report.subjectReport.forEach(sr => {
      sr.entries?.forEach(e => {
        rows.push([sr.subject?.name, sr.subject?.code, e.student?.name, e.student?.roll_no,
          e.student?.section?.name, e.is_absent?"ABSENT":e.marks_obtained, sr.avg, sr.pass_pct+"%"]);
      });
    });
    const csv = [["Subject","Code","Student","Roll No","Section","Marks","Class Avg","Pass %"], ...rows].map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `exam-report-${report.exam?.title?.replace(/\s/g,"-")}.csv`;
    a.click();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!report) return <div className="text-center py-20 text-sm text-muted-foreground">No report data</div>;

  const { exam, subjectReport, total_marks, total_absent } = report;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(`/admin/exam/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={18} className="text-primary"/>Exam Report</h1>
          <p className="text-sm text-muted-foreground">{exam?.title}</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={14}/>Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total Subjects", value:subjectReport?.length||0,      color:"text-foreground" },
          { label:"Marks Entered",  value:total_marks||0,                color:"text-blue-600"   },
          { label:"Total Absent",   value:total_absent||0,               color:"text-red-500"    },
          { label:"Results",        value:exam?.result_published?"Published":"Pending", color:exam?.result_published?"text-green-600":"text-amber-600" },
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Subject-wise breakdown */}
      <div className="space-y-4">
        {(subjectReport||[]).map(sr => (
          <div key={sr.subject?.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/10">
              <div>
                <p className="font-semibold">{sr.subject?.name}</p>
                <p className="text-xs text-muted-foreground">{sr.subject?.code}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center"><p className="font-bold">{sr.avg}</p><p className="text-[10px] text-muted-foreground">Class Avg</p></div>
                <div className="text-center"><p className={`font-bold ${sr.pass_pct>=60?"text-green-600":"text-red-500"}`}>{sr.pass_pct}%</p><p className="text-[10px] text-muted-foreground">Pass Rate</p></div>
                <div className="text-center"><p className="font-bold text-red-500">{sr.absent}</p><p className="text-[10px] text-muted-foreground">Absent</p></div>
              </div>
            </div>
            {/* Distribution bar */}
            <div className="px-4 py-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-16">Pass</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width:`${sr.pass_pct}%`}}/>
                </div>
                <span>{sr.pass} / {sr.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
