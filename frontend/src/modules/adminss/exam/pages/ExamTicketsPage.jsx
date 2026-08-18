// src/modules/adminss/exam/pages/ExamTicketsPage.jsx
// Hub-level: all exams → generate/view hall tickets
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2, ChevronRight, CheckCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function ExamTicketsPage() {
  const navigate = useNavigate();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState("");
  const [sessions, setSessions] = useState([]);
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
      const res=await axiosInstance.get(EP.exam.list+`?session_id=${sid}&limit=50`);
      setExams(res.data?.data?.items||[]);
    }catch{notify.error("Failed");}
    finally{setLoading(false);}
  };

  const generateAll = async (examId) => {
    setGenerating(examId);
    try{
      const res=await axiosInstance.post(EP.exam.tickets(examId),{});
      notify.success(`${res.data?.data?.generated} hall tickets generated`);
      loadExams(sessionId);
    }catch(e){notify.error(e.response?.data?.message||"Failed");}
    finally{setGenerating("");}
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FileText size={20} className="text-primary"/>Hall Tickets</h1>
          <p className="text-sm text-muted-foreground">Generate and manage hall tickets for all exams</p>
        </div>
        <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadExams(e.target.value);}}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading?<div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {exams.length===0&&<div className="py-10 text-center text-sm text-muted-foreground">No exams found</div>}
            {exams.map(e=>{
              const ticketCount = e._count?.hallTickets||0;
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.exam_type?.replace(/_/g," ")} · {new Date(e.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ticketCount>0 && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle size={12}/>{ticketCount} generated
                      </span>
                    )}
                    <button onClick={()=>navigate(`/admin/exam/${e.id}/tickets`)}
                      className="text-xs text-primary hover:underline">View</button>
                    <button onClick={()=>generateAll(e.id)} disabled={generating===e.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
                      {generating===e.id?<Loader2 size={11} className="animate-spin"/>:<FileText size={11}/>}
                      Generate All
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
