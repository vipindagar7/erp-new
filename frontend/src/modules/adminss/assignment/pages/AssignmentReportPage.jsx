// src/modules/adminss/assignment/pages/AssignmentReportPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, Download, Loader2, TrendingUp } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function AssignmentReportPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [reports,  setReports]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [sessions, setSessions] = useState([]);
  const [sessionId,setSessionId]= useState("");

  useEffect(()=>{
    axiosInstance.get(EP.sessions.list).then(r=>{
      const ses=r.data?.data||[];
      setSessions(ses);
      const cur=ses.find(s=>s.is_current);
      if(cur){setSessionId(cur.id);loadData(cur.id);}
    });
  },[]);

  const loadData = async(sid)=>{
    setLoading(true);
    try{
      const res=await axiosInstance.get(EP.assignments.list+`?session_id=${sid}&limit=100&status=CLOSED`);
      const items=res.data?.data?.items||[];
      setAssignments(items);
      // Load report for each closed assignment
      const rpts={};
      await Promise.all(items.slice(0,20).map(async a=>{
        const r=await axiosInstance.get(EP.assignments.report(a.id)).catch(()=>({data:{data:null}}));
        if(r.data?.data) rpts[a.id]=r.data.data;
      }));
      setReports(rpts);
    }catch{notify.error("Failed");}
    finally{setLoading(false);}
  };

  const exportCSV = ()=>{
    const rows=[];
    assignments.forEach(a=>{
      const r=reports[a.id];
      if(!r)return;
      rows.push([a.title,a.subject?.name,r.summary?.total,r.summary?.submitted,r.summary?.graded,r.summary?.late,r.summary?.flagged,r.summary?.avg_marks]);
    });
    const csv=[["Assignment","Subject","Total","Submitted","Graded","Late","Flagged","Avg Marks"],...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download="assignments-report.csv";
    a.click();
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={20} className="text-primary"/>Assignment Reports</h1>
          <p className="text-sm text-muted-foreground">Summary across all closed assignments</p>
        </div>
        <div className="flex gap-2">
          <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadData(e.target.value);}}
            className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
            {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Download size={13}/>Export
          </button>
        </div>
      </div>

      {loading?<div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        assignments.length===0?(
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-sm text-muted-foreground">No closed assignments found</div>
        ):(
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/20">
                <tr>{["Assignment","Subject","Total","Submitted","Graded","Late","Flagged","Avg Marks","Action"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map(a=>{
                  const r=reports[a.id]?.summary;
                  return(
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">{a.title}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{a.subject?.name}</td>
                      <td className="px-3 py-2.5">{r?.total||"—"}</td>
                      <td className="px-3 py-2.5">{r?.submitted||"—"}</td>
                      <td className="px-3 py-2.5 text-green-600 font-medium">{r?.graded||"—"}</td>
                      <td className="px-3 py-2.5 text-amber-600">{r?.late||"—"}</td>
                      <td className="px-3 py-2.5 text-red-500">{r?.flagged||"—"}</td>
                      <td className="px-3 py-2.5 font-bold">{r?.avg_marks||"—"}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={()=>navigate(`/admin/assignments/${a.id}`)} className="text-primary hover:underline">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
