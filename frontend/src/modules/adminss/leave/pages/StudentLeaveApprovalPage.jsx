// src/modules/adminss/leave/pages/StudentLeaveApprovalPage.jsx
// Pending approvals for CC / HOD / Director
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { CheckCircle, XCircle, Loader2, Clock, ChevronRight } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const ROLES = [
  { key:"CLASS_COORDINATOR", label:"Class Coordinator" },
  { key:"HOD",               label:"HOD" },
  { key:"DIRECTOR",          label:"Director" },
];

export default function StudentLeaveApprovalPage() {
  const navigate = useNavigate();
  const {user}   = useSelector(s=>s.auth);
  const [searchParams] = useSearchParams();
  const [role,   setRole]   = useState(searchParams.get("role")||"CLASS_COORDINATOR");
  const [pending,setPending]= useState([]);
  const [loading,setLoading]= useState(true);
  const [acting, setActing] = useState("");
  const [remarks,setRemarks]= useState({});

  const load = ()=>{
    setLoading(true);
    axiosInstance.get(EP.studentLeave.pending(role))
      .then(r=>setPending(r.data?.data||[]))
      .catch(()=>notify.error("Failed"))
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{load();},[role]);

  const act = async(leaveId, step, action, ap_id)=>{
    setActing(leaveId+action);
    try{
      const ep=action==="approve"?EP.studentLeave.approve(leaveId):EP.studentLeave.reject(leaveId);
      await axiosInstance.post(ep,{step, remarks:remarks[leaveId]||""});
      notify.success(action==="approve"?(step<3?"Approved & forwarded":"Approved"):"Rejected");
      load();
    }catch(e){notify.error(e.response?.data?.message||"Failed");}
    finally{setActing("");}
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clock size={20} className="text-primary"/>Pending Leave Approvals
        </h1>
        <div className="flex gap-1 bg-muted/30 p-1 rounded-xl">
          {ROLES.map(r=>(
            <button key={r.key} onClick={()=>setRole(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${role===r.key?"bg-primary text-primary-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading?<div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        pending.length===0?(
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <CheckCircle size={32} className="mx-auto text-green-400 mb-3"/>
            <p className="text-sm font-medium text-green-600">No pending approvals</p>
            <p className="text-xs text-muted-foreground mt-1">All leaves for {ROLES.find(r2=>r2.key===role)?.label} have been processed</p>
          </div>
        ):(
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{pending.length} application(s) waiting</p>
            {pending.map(ap=>{
              const leave=ap.leave;
              return(
                <div key={ap.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {leave?.student?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{leave?.student?.name}</p>
                      <p className="text-xs text-muted-foreground">{leave?.student?.roll_no} · {leave?.student?.section?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(leave?.from_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} → {new Date(leave?.to_date).toLocaleDateString("en-IN",{dateStyle:"medium"})} ({leave?.total_days} day{leave?.total_days>1?"s":""})
                      </p>
                    </div>
                    <button onClick={()=>navigate(`/admin/student-leave/${leave?.id}`)}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5">
                      Details <ChevronRight size={10}/>
                    </button>
                  </div>

                  <div className="bg-muted/20 rounded-xl p-2.5 text-xs">
                    <span className="font-medium">Reason: </span>{leave?.reason}
                  </div>

                  <div className="space-y-2">
                    <input value={remarks[leave?.id]||""} onChange={e=>setRemarks(prev=>({...prev,[leave?.id]:e.target.value}))}
                      placeholder="Add remarks (optional)…"
                      className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring"/>
                    <div className="flex gap-2">
                      <button onClick={()=>act(leave?.id, ap.step, "reject")} disabled={!!acting}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-60">
                        {acting===leave?.id+"reject"?<Loader2 size={12} className="animate-spin"/>:<XCircle size={12}/>}Reject
                      </button>
                      <button onClick={()=>act(leave?.id, ap.step, "approve")} disabled={!!acting}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60">
                        {acting===leave?.id+"approve"?<Loader2 size={12} className="animate-spin"/>:<CheckCircle size={12}/>}
                        {ap.step<3?"Approve & Forward":"Approve"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
