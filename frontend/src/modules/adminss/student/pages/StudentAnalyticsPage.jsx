// src/modules/adminss/student/pages/StudentAnalyticsPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2, CheckCircle, Clock, Loader2, Download, AlertTriangle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const PCT_COLOR = (p, min=75) => p >= min ? "text-green-600" : p >= 60 ? "text-amber-600" : "text-red-500";
const BAR_COLOR = (p, min=75) => p >= min ? "bg-green-500" : p >= 60 ? "bg-amber-400" : "bg-red-500";

export default function StudentAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent]       = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves,  setLeaves]        = useState([]);
  const [skillCard,setSkillCard]    = useState(null);
  const [feeData, setFeeData]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab] = useState("attendance");

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.students.byId(id)),
      axiosInstance.get(`/api/attendance?student_id=${id}&limit=200`).catch(() => ({data:{data:[]}})),
      axiosInstance.get(EP.studentLeave.list + `?student_id=${id}`).catch(() => ({data:{data:[]}})),
      axiosInstance.get(EP.skillCard.student(id)).catch(() => ({data:{data:null}})),
      axiosInstance.get(EP.fee.student(id)).catch(() => ({data:{data:[]}})),
    ]).then(([sRes, aRes, lRes, scRes, fRes]) => {
      setStudent(sRes.data?.data);
      setAttendance(aRes.data?.data || []);
      setLeaves(lRes.data?.data || []);
      setSkillCard(scRes.data?.data);
      setFeeData(fRes.data?.data || []);
    }).catch(() => notify.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [id]);

  // Group attendance by subject
  const bySubject = {};
  attendance.forEach(a => {
    const key = a.subject_id || "general";
    const name = a.subject?.name || "General";
    if (!bySubject[key]) bySubject[key] = { name, total:0, present:0 };
    bySubject[key].total++;
    if (a.status === "PRESENT") bySubject[key].present++;
  });
  const subjects = Object.values(bySubject).map(s => ({ ...s, pct: s.total>0 ? Math.round(s.present/s.total*100) : 0 }));
  const overallPct = subjects.length ? Math.round(subjects.reduce((s,x)=>s+x.pct,0)/subjects.length) : 0;

  const feeTotal    = feeData.reduce((s,p)=>s+(p.total_amount||0),0);
  const feePaid     = feeData.reduce((s,p)=>s+(p.paid_amount||0),0);
  const feeDue      = feeTotal - feePaid;

  const skillPct = skillCard ? Math.round((skillCard.completed_entries/Math.max(1,skillCard.total_entries))*100) : 0;

  const TABS = ["attendance","leave","skill","fee"];

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!student) return <div className="text-center py-20 text-sm text-muted-foreground">Student not found</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/students/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={18} className="text-primary"/>Analytics</h1>
          <p className="text-sm text-muted-foreground">{student.name} · {student.roll_no} · {student.section?.name}</p>
        </div>
        <button onClick={() => navigate(`/admin/students/${id}/report`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={13}/>Full Report
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Overall Attend.", value:`${overallPct}%`, color:PCT_COLOR(overallPct), warn:overallPct<75 },
          { label:"Leaves Used",     value:leaves.filter(l=>l.status==="APPROVED").length, color:"text-amber-600" },
          { label:"Skill Card",      value:`${skillPct}%`,  color:skillPct>=80?"text-green-600":skillPct>=50?"text-blue-600":"text-amber-600" },
          { label:"Fee Pending",     value:`₹${feeDue.toLocaleString()}`, color:feeDue>0?"text-red-500":"text-green-600" },
        ].map(s => (
          <div key={s.label} className={`bg-card border rounded-2xl p-4 ${s.warn?"border-red-200":"border-border"}`}>
            {s.warn && <AlertTriangle size={13} className="text-red-500 mb-1"/>}
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[["attendance","Attendance"],["leave","Leave"],["skill","Skill Card"],["fee","Fee"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab===k?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Attendance Tab */}
      {tab === "attendance" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject-wise Attendance</p>
              <span className={`text-sm font-bold ${PCT_COLOR(overallPct)}`}>Overall: {overallPct}%</span>
            </div>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No attendance records yet</p>
            ) : subjects.map(s => {
              const needed = s.pct < 75
                ? Math.max(0, Math.ceil((75*s.total - 100*s.present)/(100-75)))
                : 0;
              return (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[60%]">{s.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{s.present}/{s.total}</span>
                      <span className={`font-bold ${PCT_COLOR(s.pct)}`}>{s.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${BAR_COLOR(s.pct)}`} style={{width:`${s.pct}%`}}/>
                  </div>
                  {needed > 0 && (
                    <p className="text-[10px] text-amber-600">⚠ Attend {needed} more classes to reach 75%</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {tab === "leave" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Total Applied", value:leaves.length,                                   color:"text-foreground" },
              { label:"Approved",      value:leaves.filter(l=>l.status==="APPROVED").length,  color:"text-green-600"  },
              { label:"Pending",       value:leaves.filter(l=>l.status==="PENDING").length,   color:"text-amber-600"  },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {leaves.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground bg-card border border-border rounded-2xl">No leave applications</div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/30">
                  <tr>{["From","To","Days","Reason","Status"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.map(l=>(
                    <tr key={l.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5">{new Date(l.from_date).toLocaleDateString("en-IN",{dateStyle:"short"})}</td>
                      <td className="px-3 py-2.5">{new Date(l.to_date).toLocaleDateString("en-IN",{dateStyle:"short"})}</td>
                      <td className="px-3 py-2.5">{l.total_days}</td>
                      <td className="px-3 py-2.5 max-w-[140px] truncate">{l.reason}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold
                          ${l.status==="APPROVED"?"bg-green-50 text-green-700":l.status==="REJECTED"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Skill Card Tab */}
      {tab === "skill" && (
        <div className="space-y-3">
          {!skillCard ? (
            <div className="text-center py-10 bg-card border border-border rounded-2xl">
              <p className="text-sm text-muted-foreground">Skill card not initialized for this student</p>
              <button onClick={() => navigate(`/admin/skill-card/init`)}
                className="mt-2 text-xs text-primary hover:underline">Initialize Skill Card →</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:"Total Entries",    value:skillCard.total_entries,     color:"text-foreground" },
                  { label:"Completed",        value:skillCard.completed_entries, color:"text-green-600"  },
                  { label:"Readiness Level",  value:skillCard.readiness_level?.replace(/_/g," ")||"—", color:"text-primary" },
                ].map(s=>(
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Overall Progress</span>
                  <span className="font-bold text-primary">{skillPct}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{width:`${skillPct}%`}}/>
                </div>
              </div>
              <button onClick={() => navigate(`/admin/skill-card/${id}`)}
                className="text-xs text-primary hover:underline">View Full Skill Card →</button>
            </>
          )}
        </div>
      )}

      {/* Fee Tab */}
      {tab === "fee" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Total Fee",   value:`₹${feeTotal.toLocaleString()}`,  color:"text-foreground" },
              { label:"Paid",        value:`₹${feePaid.toLocaleString()}`,   color:"text-green-600"  },
              { label:"Pending",     value:`₹${feeDue.toLocaleString()}`,    color:feeDue>0?"text-red-500":"text-green-600" },
            ].map(s=>(
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {feeData.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/30">
                  <tr>{["Installment","Amount","Paid","Due","Status"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {feeData.map(p=>(
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5">Installment {p.installment_no}</td>
                      <td className="px-3 py-2.5">₹{(p.total_amount||0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-green-600">₹{(p.paid_amount||0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-red-500">₹{(p.due_amount||0).toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold
                          ${p.status==="PAID"?"bg-green-50 text-green-700":p.status==="PARTIAL"?"bg-amber-50 text-amber-700":p.status==="WAIVED"?"bg-violet-50 text-violet-700":"bg-red-50 text-red-700"}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={() => navigate(`/admin/fee/student/${id}`)} className="text-xs text-primary hover:underline">
            Manage Fee →
          </button>
        </div>
      )}
    </div>
  );
}
