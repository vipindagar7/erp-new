// src/modules/adminss/hr/pages/SalaryApprovePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ChevronRight } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SalaryApprovePage() {
  const navigate  = useNavigate();
  const [slips,   setSlips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState("");

  const load = () => {
    setLoading(true);
    axiosInstance.get(EP.hr.slips + "?status=GENERATED&limit=100")
      .then(r => setSlips(r.data?.data?.items || r.data?.data || []))
      .catch(() => notify.error("Failed"))
      .finally(() => setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const approve = async (id) => {
    setActing(id+"-approve");
    try {
      await axiosInstance.post(EP.hr.approve(id));
      notify.success("Approved");
      load();
    } catch(e) { notify.error(e.response?.data?.message||"Failed"); }
    finally { setActing(""); }
  };

  const markPaid = async (id) => {
    setActing(id+"-paid");
    try {
      await axiosInstance.post(EP.hr.markPaid(id));
      notify.success("Marked as paid");
      load();
    } catch(e) { notify.error(e.response?.data?.message||"Failed"); }
    finally { setActing(""); }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold">Approve Salary Slips</h1>
        <span className="text-sm text-muted-foreground">{slips.length} pending approval</span>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {slips.length===0 && <div className="py-10 text-center text-sm text-muted-foreground">No slips pending approval</div>}
            {slips.map(s=>(
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.faculty?.name}</p>
                  <p className="text-xs text-muted-foreground">{s.faculty?.designation} · {MONTHS[s.month]} {s.year} · Net: ₹{s.net_salary?.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>navigate(`/admin/hr/slips/${s.id}`)} className="text-xs text-primary hover:underline">View</button>
                  <button onClick={()=>approve(s.id)} disabled={!!acting}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60">
                    {acting===s.id+"-approve"?<Loader2 size={11} className="animate-spin"/>:<CheckCircle size={11}/>}Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
