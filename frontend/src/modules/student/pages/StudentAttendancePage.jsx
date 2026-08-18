// src/modules/portal/student/pages/StudentAttendancePage.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BarChart2, Loader2, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import axiosInstance from "../../../lib/axios.js";

const PCT_COLOR = (p) =>
  p >= 90 ? "text-green-600" : p >= 75 ? "text-blue-600" : p >= 60 ? "text-amber-600" : "text-red-600";
const PCT_BG = (p) =>
  p >= 90 ? "bg-green-500" : p >= 75 ? "bg-blue-500" : p >= 60 ? "bg-amber-500" : "bg-red-500";

export default function StudentAttendancePage() {
  const student   = useSelector(s => s.auth?.user?.student);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded,setExpanded]= useState({});

  useEffect(() => {
    if (!student?.id) { setLoading(false); return; }
    axiosInstance.get(`/attendance/student/${student.id}/summary`)
      .then(r => setData(r.data?.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [student?.id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!data)   return <div className="text-center py-20 text-sm text-muted-foreground">Attendance data not available</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-2">
        <BarChart2 size={20} className="text-primary"/>
        <h1 className="text-xl font-bold">My Attendance</h1>
      </div>

      {/* Overall */}
      <div className={`border rounded-2xl p-5 ${data.overall_percentage<75?"bg-red-50 border-red-200":"bg-card border-border"}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Overall Attendance</p>
          <span className={`text-3xl font-bold ${PCT_COLOR(data.overall_percentage)}`}>{data.overall_percentage}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${PCT_BG(data.overall_percentage)}`}
            style={{ width:`${Math.min(data.overall_percentage,100)}%` }}/>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{data.total_present} present</span>
          <span>{data.total_absent} absent</span>
          <span>{data.total_classes} total</span>
        </div>
        {data.overall_percentage < 75 && (
          <p className="text-xs text-red-700 font-medium mt-3 flex items-center gap-1.5">
            <AlertCircle size={12}/>Attendance below 75% — risk of detention. Contact your coordinator.
          </p>
        )}
      </div>

      {/* Subject wise */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Subject-wise Breakdown</p>
        {(data.subjects||[]).map(s => (
          <div key={s.subject_id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setExpanded(e => ({ ...e, [s.subject_id]:!e[s.subject_id] }))}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/10 text-left">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.subject_name}</p>
                <p className="text-xs text-muted-foreground">{s.subject_code} · {s.faculty_name||"—"}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className={`text-lg font-bold ${PCT_COLOR(s.percentage)}`}>{s.percentage}%</p>
                  <p className="text-[10px] text-muted-foreground">{s.present}/{s.total}</p>
                </div>
                {expanded[s.subject_id] ? <ChevronDown size={14} className="text-muted-foreground"/> : <ChevronRight size={14} className="text-muted-foreground"/>}
              </div>
            </button>
            {expanded[s.subject_id] && (
              <div className="border-t border-border px-4 py-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${PCT_BG(s.percentage)}`} style={{ width:`${Math.min(s.percentage,100)}%` }}/>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  {[["Present",s.present,"text-green-600"],["Absent",s.absent,"text-red-600"],["Late",s.late||0,"text-amber-600"],["Total",s.total,"text-foreground"]].map(([l,v,cls])=>(
                    <div key={l} className="bg-muted/20 rounded-lg p-2">
                      <p className={`text-base font-bold ${cls}`}>{v}</p>
                      <p className="text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
                {s.percentage < 75 && (
                  <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                    Need {Math.ceil((75*s.total - 100*s.present)/(100-75))} more classes to reach 75%
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}