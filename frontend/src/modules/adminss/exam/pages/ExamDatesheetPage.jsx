// src/modules/adminss/exam/pages/ExamDatesheetPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Printer, Loader2, ChevronRight } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function ExamDatesheetPage() {
  const navigate = useNavigate();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId,setSessionId]=useState("");
  const [sessions,setSessions]=useState([]);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const ses = r.data?.data||[];
      setSessions(ses);
      const cur = ses.find(s=>s.is_current);
      if (cur) { setSessionId(cur.id); loadExams(cur.id); }
    });
  }, []);

  const loadExams = async (sid) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(EP.exam.list + `?session_id=${sid}&limit=50`);
      const items = res.data?.data?.items || [];
      // Load full schedule for each exam
      const full = await Promise.all(items.map(e => axiosInstance.get(EP.exam.byId(e.id)).then(r=>r.data?.data).catch(()=>e)));
      setExams(full.filter(Boolean));
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  // Flatten all schedule entries across all exams
  const allEntries = [];
  exams.forEach(e => {
    (e.schedule||[]).forEach(s => {
      allEntries.push({ ...s, exam_title:e.title, exam_type:e.exam_type, exam_id:e.id });
    });
  });
  allEntries.sort((a,b) => new Date(a.exam_date) - new Date(b.exam_date));

  // Group by date
  const byDate = {};
  allEntries.forEach(e => {
    const d = e.exam_date?.slice(0,10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });

  const handlePrint = () => {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Datesheet</title>
    <style>body{font-family:Arial;padding:20px;}h2,h3{text-align:center;}table{width:100%;border-collapse:collapse;font-size:11px;}td,th{border:1px solid #ddd;padding:6px 10px;}th{background:#f1f5f9;font-weight:700;}@media print{@page{size:A4;margin:10mm;}}</style>
    </head><body>
    <h2>ECHELON INSTITUTE OF TECHNOLOGY</h2>
    <h3>Examination Datesheet</h3>
    <table>
      <thead><tr><th>Date</th><th>Day</th><th>Subject</th><th>Time</th><th>Max Marks</th><th>Exam</th></tr></thead>
      <tbody>
        ${allEntries.map(e=>`<tr>
          <td>${new Date(e.exam_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}</td>
          <td>${new Date(e.exam_date).toLocaleDateString("en-IN",{weekday:"long"})}</td>
          <td>${e.subject?.name||""} (${e.subject?.code||""})</td>
          <td>${e.start_time||""} – ${e.end_time||""}</td>
          <td>${e.max_marks||""}</td>
          <td>${e.exam_title||""}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <br/><p style="text-align:right">Controller of Examinations</p>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),300);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Calendar size={20} className="text-primary"/>Examination Datesheet</h1>
          <p className="text-sm text-muted-foreground">Combined datesheet across all scheduled exams</p>
        </div>
        <div className="flex gap-2">
          <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadExams(e.target.value);}}
            className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
            {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Printer size={14}/>Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : Object.keys(byDate).length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl text-sm text-muted-foreground">
          No exam schedule found for this session
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDate).sort().map(([date, entries]) => (
            <div key={date} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
                <p className="text-sm font-bold">{new Date(date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
                <span className="text-xs text-muted-foreground">{entries.length} exam(s)</span>
              </div>
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/10">
                  <tr>{["Subject","Code","Time","Max Marks","Exam"].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((e,i)=>(
                    <tr key={i} className="hover:bg-muted/20 cursor-pointer" onClick={()=>navigate(`/admin/exam/${e.exam_id}`)}>
                      <td className="px-3 py-2.5 font-medium">{e.subject?.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{e.subject?.code}</td>
                      <td className="px-3 py-2.5">{e.start_time} – {e.end_time}</td>
                      <td className="px-3 py-2.5">{e.max_marks}</td>
                      <td className="px-3 py-2.5 flex items-center gap-1 text-primary">
                        {e.exam_title} <ChevronRight size={10}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
