// src/modules/adminss/exam/pages/ExamSeatingPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Printer, Loader2, ChevronRight, Shuffle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function ExamSeatingPage() {
  const navigate = useNavigate();
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selExam, setSelExam] = useState(null);
  const [generating, setGenerating] = useState(false);
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
      const res = await axiosInstance.get(EP.exam.list+`?session_id=${sid}&limit=50`);
      setExams(res.data?.data?.items||[]);
    }catch{notify.error("Failed");}
    finally{setLoading(false);}
  };

  const generateSeating = async (examId, examDate) => {
    setGenerating(examId);
    try{
      const res = await axiosInstance.post(EP.exam.seating(examId),{exam_date:examDate});
      notify.success(`Seating generated: ${res.data?.data?.generated} students across ${res.data?.data?.rooms} rooms`);
    }catch(e){notify.error(e.response?.data?.message||"Failed");}
    finally{setGenerating("");}
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Users size={20} className="text-primary"/>Seating Plans</h1>
          <p className="text-sm text-muted-foreground">Auto-generate seating or override manually per exam</p>
        </div>
        <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadExams(e.target.value);}}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {exams.length===0 && <div className="py-10 text-center text-sm text-muted-foreground">No exams in this session</div>}
            {exams.map(e=>(
              <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.exam_type?.replace(/_/g," ")} ·{" "}
                    {new Date(e.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>navigate(`/admin/exam/${e.id}`)}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    View <ChevronRight size={10}/>
                  </button>
                  <button onClick={()=>generateSeating(e.id, e.start_date?.slice(0,10))}
                    disabled={generating===e.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
                    {generating===e.id?<Loader2 size={11} className="animate-spin"/>:<Shuffle size={11}/>}
                    Auto-Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">How seating works:</p>
        <p>• Students from different sections/branches are mixed in each room</p>
        <p>• Seat numbers assigned alphabetically by room (A1, A2… B1, B2…)</p>
        <p>• Override individual seats by clicking "View" → Seating tab → Manual Override</p>
      </div>
    </div>
  );
}
