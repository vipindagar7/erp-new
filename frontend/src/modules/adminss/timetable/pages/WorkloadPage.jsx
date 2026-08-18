// src/modules/adminss/timetable/pages/WorkloadPage.jsx
import { useState, useEffect } from "react";
import { BarChart2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { useSelector } from "react-redux";
import { sectionOption } from "../../../../lib/formatSection.js";

export default function WorkloadPage() {
  const sections = useSelector(s => s.academic?.sections?.list ?? []);
  const sessions = useSelector(s => s.academic?.sessions?.list ?? []);
  const sessionId = sessions.find(s => s.is_current)?.id;

  const [sectionId, setSectionId] = useState("all");
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = { ...(sessionId ? { session_id: sessionId } : {}), ...(sectionId !== "all" ? { section_id: sectionId } : {}) };
    axiosInstance.get(EP.timetable.workload, { params })
      .then(r => setData(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sectionId, sessionId]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={18} className="text-primary"/>Workload Report</h1>
        <p className="text-sm text-muted-foreground">Periods assigned vs needed per subject per section</p>
      </div>

      <div className="flex items-center gap-3">
        <select value={sectionId} onChange={e => setSectionId(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
          <option value="all">All Sections</option>
          {sections.map(s => <option key={s.id} value={s.id}>{sectionOption(s)}</option>)}
        </select>
        {loading && <Loader2 size={15} className="animate-spin text-muted-foreground"/>}
      </div>

      {data.map(section => {
        const wl = section.workload || [];
        const done = wl.filter(w => w.complete).length;
        return (
          <div key={section.section_id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <p className="font-semibold text-sm">{section.section_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${done===wl.length?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>
                {done}/{wl.length} subjects complete
              </span>
            </div>
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/10">
                <tr>
                  {["Subject","Code","Faculty","Type","Needed","Assigned","Remaining","Status"].map(h =>
                    <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wl.map(w => (
                  <tr key={w.subject_id} className={w.complete ? "" : "bg-amber-50/30"}>
                    <td className="px-3 py-2.5 font-medium">{w.subject_name}</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{w.subject_code}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{w.faculty_name || "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${w.is_lab ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {w.is_lab ? "LAB" : "THEORY"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold">{w.needed}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${w.complete?"bg-green-500":w.assigned>0?"bg-amber-400":"bg-muted-foreground/20"}`}
                            style={{width:`${Math.min(100,(w.assigned/w.needed)*100)}%`}}/>
                        </div>
                        <span>{w.assigned}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">{w.remaining > 0 ? <span className="text-amber-600 font-medium">{w.remaining}</span> : "—"}</td>
                    <td className="px-3 py-2.5">
                      {w.complete
                        ? <CheckCircle size={13} className="text-green-500"/>
                        : <AlertCircle size={13} className="text-amber-500"/>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {!loading && data.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">
          No timetable data found. Generate timetable first.
        </div>
      )}
    </div>
  );
}