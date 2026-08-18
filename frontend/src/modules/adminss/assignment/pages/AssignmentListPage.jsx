// src/modules/adminss/assignment/pages/AssignmentListPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, ChevronRight, Loader2, Clock, AlertCircle } from "lucide-react";
import { useSelector } from "react-redux";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const STATUS_STYLE = {
  DRAFT:"bg-muted text-muted-foreground border-border",
  PUBLISHED:"bg-green-50 text-green-700 border-green-200",
  CLOSED:"bg-amber-50 text-amber-700 border-amber-200",
  GRADED:"bg-blue-50 text-blue-700 border-blue-200",
};

export default function AssignmentListPage() {
  const navigate = useNavigate();
  const {user}   = useSelector(s=>s.auth);
  const [searchParams] = useSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState(searchParams.get("status")||"");
  const [subjects, setSubjects] = useState([]);
  const [subjectId,setSubjectId]= useState("");
  const [page,     setPage]     = useState(1);
  const LIMIT = 20;

  useEffect(()=>{
    axiosInstance.get(EP.subjects.list+"?limit=200").then(r=>setSubjects(r.data?.data?.subjects||r.data?.data||[])).catch(()=>{});
  },[]);

  useEffect(()=>{
    setLoading(true);
    const params=new URLSearchParams({limit:LIMIT,page});
    if(status)    params.set("status",    status);
    if(subjectId) params.set("subject_id",subjectId);
    if(user?.faculty?.id) params.set("faculty_id",user.faculty.id);
    axiosInstance.get(EP.assignments.list+"?"+params)
      .then(r=>setAssignments(r.data?.data?.items||[]))
      .catch(()=>notify.error("Failed"))
      .finally(()=>setLoading(false));
  },[status,subjectId,page]);

  const filtered = assignments.filter(a=>!search||a.title?.toLowerCase().includes(search.toLowerCase())||a.subject?.name?.toLowerCase().includes(search.toLowerCase()));
  const overdue  = filtered.filter(a=>a.status==="PUBLISHED"&&new Date(a.deadline)<new Date());

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold">All Assignments</h1>
        <button onClick={()=>navigate("/admin/assignments/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14}/>New Assignment
        </button>
      </div>

      {overdue.length>0&&(
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
          <AlertCircle size={13} className="shrink-0"/>
          {overdue.length} assignment(s) past deadline with no submissions closed yet
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assignments…"
            className="w-full h-10 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Status</option>
          {["DRAFT","PUBLISHED","CLOSED","GRADED"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={subjectId} onChange={e=>{setSubjectId(e.target.value);setPage(1);}}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Subjects</option>
          {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading?<div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.length===0&&<div className="py-10 text-center text-sm text-muted-foreground">No assignments found</div>}
            {filtered.map(a=>{
              const isOverdue=a.status==="PUBLISHED"&&new Date(a.deadline)<new Date();
              return(
                <div key={a.id} onClick={()=>navigate(`/admin/assignments/${a.id}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.subject?.name} · {a.faculty?.name} · Due: {new Date(a.deadline).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}
                      {isOverdue&&<span className="text-red-500 ml-1 font-semibold">OVERDUE</span>}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLE[a.status]||"bg-muted"}`}>{a.status}</span>
                  <span className="text-xs text-muted-foreground">{a._count?.submissions||0} sub.</span>
                  <ChevronRight size={13} className="text-muted-foreground shrink-0"/>
                </div>
              );
            })}
          </div>
          {assignments.length===LIMIT&&(
            <div className="px-4 py-3 border-t border-border text-center">
              <button onClick={()=>setPage(p=>p+1)} className="text-xs text-primary hover:underline">Load more →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
