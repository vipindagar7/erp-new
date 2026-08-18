// src/modules/adminss/leave/pages/LeaveHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, CheckCircle, XCircle, Settings, Tag, BarChart2, ArrowRight, Loader2, Users, Calendar } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";

const QuickLink = ({ icon: Icon, label, path, desc, badge }) => {
  const nav = useNavigate();
  return (
    <button onClick={()=>nav(path)}
      className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:bg-muted/20 transition-all w-full text-left group">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon size={16}/></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      {badge != null && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{badge}</span>}
      <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"/>
    </button>
  );
};

const StatCard = ({ icon: Icon, label, value, color="text-primary", onClick }) => (
  <button onClick={onClick}
    className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md transition-all hover:-translate-y-0.5 w-full">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 mb-3 ${color}`}><Icon size={18}/></div>
    <p className={`text-2xl font-bold ${color}`}>{value ?? "—"}</p>
    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
  </button>
);

export default function LeaveHubPage() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState({});
  const [types, setTypes]   = useState([]);
  const [loading,setLoading]= useState(true);

  useEffect(()=>{
    Promise.all([
      axiosInstance.get("/leave?status=PENDING&limit=1").catch(()=>({data:{}})),
      axiosInstance.get("/leave?status=APPROVED&limit=1").catch(()=>({data:{}})),
      axiosInstance.get("/leave/types?all=true").catch(()=>({data:{data:[]}})),
    ]).then(([pRes, aRes, tRes]) => {
      setStats({
        pending:  pRes.data?.meta?.total ?? pRes.data?.total ?? "?",
        approved: aRes.data?.meta?.total ?? aRes.data?.total ?? "?",
      });
      setTypes(tRes.data?.data || []);
    }).finally(()=>setLoading(false));
  },[]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage leave requests, types, rules and approval flows</p>
      </div>

      {loading ? <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Clock}        label="Pending Approval" value={stats.pending}  color="text-amber-600"  onClick={()=>navigate("/admin/leave/pending")}/>
            <StatCard icon={CheckCircle}  label="Approved Today"   value={stats.approved} color="text-green-600"  onClick={()=>navigate("/admin/leave/list")}/>
            <StatCard icon={Tag}          label="Leave Types"       value={types.length}   color="text-blue-600"   onClick={()=>navigate("/admin/leave/types")}/>
            <StatCard icon={Settings}     label="Credit Rules"      value="→"              color="text-violet-600" onClick={()=>navigate("/admin/holidays/leave-rules")}/>
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <QuickLink icon={Clock}        label="Pending Requests"  path="/admin/leave/pending"              desc="Review and approve pending leave applications" badge={stats.pending}/>
              <QuickLink icon={ClipboardList}label="All Requests"      path="/admin/leave/list"                 desc="View all leave applications"/>
              <QuickLink icon={Tag}          label="Leave Types"       path="/admin/leave/types"                desc="Manage CL, EL, ML, OD and other leave categories"/>
              <QuickLink icon={Settings}     label="Leave Credit Rules" path="/admin/holidays/leave-rules"      desc="Configure auto-credit rules per leave type"/>
              <QuickLink icon={Calendar}     label="Holiday Master"    path="/admin/holidays"                   desc="Mark holidays — attendance & leave not counted"/>
              <QuickLink icon={BarChart2}    label="Approval Flows"    path="/admin/leave/flows"                desc="Configure reporting officers and approval chains"/>
            </div>
          </div>

          {/* Leave types summary */}
          {types.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold">Configured Leave Types</p>
              <div className="flex flex-wrap gap-2">
                {types.map(t=>(
                  <div key={t.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${t.is_active?"border-border bg-muted/30":"border-border bg-muted/10 opacity-50"}`}>
                    <span className="font-bold text-primary">{t.code}</span>
                    <span className="text-muted-foreground">{t.name}</span>
                    <span className="text-[10px] bg-muted px-1 rounded">{t.max_days_per_year}d/yr</span>
                  </div>
                ))}
              </div>
              {types.length === 0 && (
                <button onClick={()=>navigate("/admin/leave/types")}
                  className="text-sm text-primary hover:underline">+ Set up leave types first</button>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1.5">
            <p className="font-semibold">Leave approval flow:</p>
            <p>• <strong>Non-teaching staff</strong>: Reporting Officer → HR Admin</p>
            <p>• <strong>Faculty (teaching)</strong>: HOD → HR Admin</p>
            <p>• <strong>HOD</strong>: Principal → HR Admin</p>
            <p>Set reporting officers via Faculty profile → HR tab</p>
          </div>
        </>
      )}
    </div>
  );
}