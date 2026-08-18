// src/modules/adminss/marks/pages/MarksSubjectViewPage.jsx
// Faculty view — all subject marks at one place in table format
// Also used for student portal with student_id filter
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { BarChart2, Download, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const EXAM_TYPES = ["CLASS_TEST","SESSIONAL_1","SESSIONAL_2","MID_TERM","PRE_UNIVERSITY"];

export default function MarksSubjectViewPage() {
  const navigate     = useNavigate();
  const { user }     = useSelector(s => s.auth);
  const [searchParams] = useSearchParams();
  const studentId    = searchParams.get("student_id") || user?.student?.id;

  const [marks,    setMarks]    = useState([]);  // flat array of ExamMark
  const [sessions, setSessions] = useState([]);
  const [sessionId,setSessionId]= useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list)
      .then(r => {
        const ses = r.data?.data || [];
        setSessions(ses);
        const cur = ses.find(s => s.is_current);
        if (cur) { setSessionId(cur.id); loadMarks(cur.id); }
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadMarks = async (sid) => {
    try {
      const params = new URLSearchParams({ session_id: sid, limit: 500 });
      if (studentId) params.set("student_id", studentId);
      const res = await axiosInstance.get(`/api/exam/marks?${params}`).catch(() => ({ data: { data: [] } }));
      setMarks(res.data?.data || []);
    } catch {}
  };

  // Group by subject then exam type
  const bySubject = {};
  marks.forEach(m => {
    const key  = m.subject_id;
    const name = m.subject?.name || key;
    const code = m.subject?.code || "";
    if (!bySubject[key]) bySubject[key] = { name, code, entries: {} };
    if (!bySubject[key].entries[m.exam_type]) bySubject[key].entries[m.exam_type] = [];
    bySubject[key].entries[m.exam_type].push(m);
  });

  const subjects = Object.values(bySubject);

  const exportCSV = () => {
    const rows = [];
    subjects.forEach(s => {
      EXAM_TYPES.forEach(et => {
        (s.entries[et] || []).forEach(m => {
          rows.push([m.student?.name||"", m.student?.roll_no||"", s.name, s.code, et, m.is_absent?"ABSENT":m.marks_obtained, m.max_marks]);
        });
      });
    });
    const csv = [["Student","Roll No","Subject","Code","Exam Type","Marks","Max Marks"],...rows].map(r=>r.join(",")).join("\n");
    const a   = document.createElement("a");
    a.href    = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "marks-report.csv";
    a.click();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 size={20} className="text-primary"/>Marks — Subject-wise View
        </h1>
        <div className="flex gap-2">
          <select value={sessionId} onChange={e => { setSessionId(e.target.value); loadMarks(e.target.value); }}
            className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Download size={13}/>Export
          </button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl text-sm text-muted-foreground">
          No marks recorded yet for this session
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map(sub => {
            const allEntries = Object.values(sub.entries).flat();
            const present    = allEntries.filter(m => !m.is_absent);
            const avgPct     = present.length > 0
              ? Math.round(present.reduce((s,m) => s + (m.max_marks > 0 ? m.marks_obtained/m.max_marks*100 : 0), 0) / present.length)
              : 0;

            return (
              <div key={sub.name} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/10">
                  <div>
                    <p className="font-semibold">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {avgPct >= 60 ? <TrendingUp size={14} className="text-green-500"/> : <TrendingDown size={14} className="text-red-500"/>}
                    <span className={`text-sm font-bold ${avgPct>=60?"text-green-600":"text-red-500"}`}>Avg: {avgPct}%</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-border bg-muted/20">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Student</th>
                        <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Roll No</th>
                        {EXAM_TYPES.map(et => (
                          sub.entries[et]?.length > 0 && (
                            <th key={et} className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap">
                              {et.replace(/_/g," ")}
                            </th>
                          )
                        ))}
                        <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Overall %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Get unique students */}
                      {[...new Map(allEntries.map(m => [m.student_id, m.student])).values()].map(student => {
                        if (!student) return null;
                        let totalObtained = 0, totalMax = 0;
                        return (
                          <tr key={student.id} className="hover:bg-muted/20">
                            <td className="px-3 py-2.5 font-medium">{student.name}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{student.roll_no}</td>
                            {EXAM_TYPES.map(et => {
                              if (!sub.entries[et]?.length) return null;
                              const entry = sub.entries[et]?.find(m => m.student_id === student.id);
                              if (!entry) return <td key={et} className="px-3 py-2.5 text-center text-muted-foreground">—</td>;
                              if (!entry.is_absent) { totalObtained += entry.marks_obtained; totalMax += entry.max_marks; }
                              return (
                                <td key={et} className="px-3 py-2.5 text-center">
                                  {entry.is_absent ? (
                                    <span className="text-red-500 font-medium">AB</span>
                                  ) : (
                                    <span className={`font-medium ${entry.marks_obtained/entry.max_marks >= 0.4 ? "text-green-600" : "text-red-500"}`}>
                                      {entry.marks_obtained}/{entry.max_marks}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2.5 text-center">
                              {totalMax > 0 ? (
                                <span className={`font-bold ${totalObtained/totalMax >= 0.4 ? "text-green-600" : "text-red-500"}`}>
                                  {Math.round(totalObtained/totalMax*100)}%
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
