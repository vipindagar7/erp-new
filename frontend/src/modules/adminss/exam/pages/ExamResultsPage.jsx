// src/modules/adminss/exam/pages/ExamResultsPage.jsx
// Hub: all published results + publish pending ones
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, CheckCircle, Loader2, Lock, Unlock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function ExamResultsPage() {
  const navigate = useNavigate();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState("");
  const [sessions, setSessions]=useState([]);
  const [sessionId,setSessionId]=useState("");

  useEffect(()=>{
    axiosInstance.get(EP.sessions.list).then(r=>{
      const ses=r.data?.data||[];
      setSessions(ses);
      const cur=ses.find(s=>s.is_current);
      if(cur){setSessionId(cur.id);loadExams(cur.id);}
    });
  },[]);

  const loadExams = async (sid) => {
    setLoading(true);
    try{
      const res=await axiosInstance.get(EP.exam.list+`?session_id=${sid}&limit=100`);
      setExams(res.data?.data?.items||[]);
    }catch{notify.error("Failed");}
    finally{setLoading(false);}
  };

  const publish = async (examId) => {
    if(!confirm("Publish results to student portal? This cannot be undone easily."))return;
    setPublishing(examId);
    try{
      await axiosInstance.post(EP.exam.publish(examId));
      notify.success("Results published to student portal");
      loadExams(sessionId);
    }catch(e){notify.error(e.response?.data?.message||"Failed");}
    finally{setPublishing("");}
  };

  const completed   = exams.filter(e=>e.status==="COMPLETED");
  const published   = completed.filter(e=>e.result_published);
  const unpublished = completed.filter(e=>!e.result_published);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={20} className="text-primary"/>Exam Results</h1>
          <p className="text-sm text-muted-foreground">Publish results to student portal</p>
        </div>
        <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadExams(e.target.value);}}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {label:"Total Completed",value:completed.length, color:"text-foreground"},
          {label:"Results Published",value:published.length,color:"text-green-600"},
          {label:"Pending Publish", value:unpublished.length,color:"text-amber-600"},
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading?<div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        <div className="space-y-3">
          {unpublished.length>0&&(
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-600">⚠ Pending Publication ({unpublished.length})</p>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="divide-y divide-border">
                  {unpublished.map(e=>(
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.exam_type?.replace(/_/g," ")} · Completed · Results not published</p>
                      </div>
                      <button onClick={()=>navigate(`/admin/exam/${e.id}/report`)} className="text-xs text-primary hover:underline">Report</button>
                      <button onClick={()=>publish(e.id)} disabled={publishing===e.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60">
                        {publishing===e.id?<Loader2 size={11} className="animate-spin"/>:<Unlock size={11}/>}Publish
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-green-600">Published ({published.length})</p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {published.length===0&&<div className="py-6 text-center text-xs text-muted-foreground">No results published yet</div>}
                {published.map(e=>(
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <CheckCircle size={14} className="text-green-500 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.exam_type?.replace(/_/g," ")} · Published {e.result_published_at?new Date(e.result_published_at).toLocaleDateString("en-IN"):""}</p>
                    </div>
                    <button onClick={()=>navigate(`/admin/exam/${e.id}/report`)} className="text-xs text-primary hover:underline">View Report</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
