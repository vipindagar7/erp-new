// src/modules/adminss/leave/pages/LeaveApprovalFlowPage.jsx
// Set reporting officers for non-teaching staff + view approval chains
import { useState, useEffect } from "react";
import { Users, Search, Save, Loader2, ArrowRight, UserCheck, Shield } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FLOW = {
  FACULTY:     ["HOD", "HR Admin"],
  NON_TEACHING:["Reporting Officer", "HR Admin"],
  HOD:         ["Principal", "HR Admin"],
  DEFAULT:     ["Reporting Officer", "HR Admin"],
};

export default function LeaveApprovalFlowPage() {
  const [faculty,    setFaculty]    = useState([]);
  const [officers,   setOfficers]   = useState({});  // faculty_id → reporter
  const [allFaculty, setAllFaculty] = useState([]);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("NON_TEACHING"); // show non-teaching first
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState({});

  useEffect(()=>{
    axiosInstance.get(EP.faculty.list + "?limit=200&include_non_teaching=true")
      .then(r=>{
        const list = r.data?.data?.faculty || r.data?.data || [];
        setFaculty(list);
        setAllFaculty(list);
        // Pre-fill reporting officers
        const map = {};
        list.forEach(f=>{ if(f.reporting_officer_id) map[f.id]=f.reporting_officer_id; });
        setOfficers(map);
      }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const saveOfficer = async (facultyId, officerId) => {
    setSaving(s=>({...s,[facultyId]:true}));
    try {
      await axiosInstance.post("/leave/reporting-officer", { faculty_id:facultyId, officer_id:officerId||null });
      notify.success("Reporting officer updated");
      setOfficers(o=>({...o,[facultyId]:officerId}));
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(s=>({...s,[facultyId]:false})); }
  };

  const filtered = faculty.filter(f=>{
    const matchSearch = !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.emp_id?.includes(search);
    const matchFilter = filter==="ALL" || (filter==="NON_TEACHING"?!f.is_teaching:f.is_teaching);
    return matchSearch && matchFilter;
  });

  const approverOptions = allFaculty.filter(f=>
    f.is_teaching || ["HOD","DEPT_ADMIN","ADMIN"].includes(f.erp_role)
  );

  const sel = "h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-2">
        <UserCheck size={20} className="text-primary"/>
        <div>
          <h1 className="text-xl font-bold">Leave Approval Flows</h1>
          <p className="text-sm text-muted-foreground">Set reporting officers for non-teaching staff</p>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { role:"Teaching Faculty", flow:["HOD", "HR Admin"], color:"bg-blue-50 border-blue-200 text-blue-700" },
          { role:"Non-Teaching Staff", flow:["Reporting Officer", "HR Admin"], color:"bg-amber-50 border-amber-200 text-amber-700" },
          { role:"HOD / Dept Admin", flow:["Principal", "HR Admin"], color:"bg-violet-50 border-violet-200 text-violet-700" },
        ].map(({role,flow,color})=>(
          <div key={role} className={`border rounded-2xl p-4 space-y-2 ${color}`}>
            <p className="text-xs font-bold uppercase">{role}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {flow.map((s,i)=>(
                <span key={s} className="flex items-center gap-1">
                  <span className="bg-white/60 px-2 py-0.5 rounded text-xs font-medium">{s}</span>
                  {i<flow.length-1 && <ArrowRight size={10}/>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, emp ID…" className="pl-8 h-10"/>
        </div>
        <div className="flex gap-1">
          {["NON_TEACHING","TEACHING","ALL"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter===f?"bg-primary text-primary-foreground":"border border-border text-muted-foreground hover:bg-muted"}`}>
              {f==="NON_TEACHING"?"Non-Teaching":f==="TEACHING"?"Teaching":"All"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} staff</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 px-4 py-2 border-b border-border">
            <span className="col-span-3">Name</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-2">Approval Flow</span>
            <span className="col-span-4">Reporting Officer</span>
            <span className="col-span-1"/>
          </div>
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {filtered.map(f=>{
              const isTeaching  = f.is_teaching;
              const officerId   = officers[f.id] || "";
              const officerName = allFaculty.find(o=>o.id===officerId)?.name;
              const flow = isTeaching ? FLOW.FACULTY : FLOW.NON_TEACHING;
              return (
                <div key={f.id} className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-muted/10 gap-2">
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{f.emp_id||f.designation}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${isTeaching?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>
                      {isTeaching?"Teaching":"Non-Teaching"}
                    </span>
                  </div>
                  <div className="col-span-2 text-[10px] text-muted-foreground">
                    {flow.join(" → ")}
                  </div>
                  <div className="col-span-4">
                    {!isTeaching ? (
                      <select value={officerId} onChange={e=>setOfficers(o=>({...o,[f.id]:e.target.value}))}
                        className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:ring-1 focus:ring-ring">
                        <option value="">No reporting officer</option>
                        {approverOptions.filter(o=>o.id!==f.id).map(o=>(
                          <option key={o.id} value={o.id}>{o.name} ({o.designation||o.erp_role})</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">HOD (automatic)</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {!isTeaching && (
                      <button
                        disabled={saving[f.id]}
                        onClick={()=>saveOfficer(f.id, officers[f.id])}
                        className="text-[10px] px-2 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium">
                        {saving[f.id]?<Loader2 size={10} className="animate-spin"/>:"Save"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length===0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No staff found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}