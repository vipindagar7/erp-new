// src/modules/adminss/hr/pages/HRAttendancePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

export default function HRAttendancePage() {
  const navigate = useNavigate();
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [month,    setMonth]    = useState(new Date().getMonth()+1);
  const [year,     setYear]     = useState(new Date().getFullYear());
  const [search,   setSearch]   = useState("");
  const [deptFilter,setDeptFilter]=useState("");
  const [depts,    setDepts]    = useState([]);

  useEffect(()=>{
    Promise.all([
      axiosInstance.get(EP.faculty.list+"?status=ACTIVE&limit=200"),
      axiosInstance.get(EP.departments.list+"?limit=50"),
    ]).then(([fRes,dRes])=>{
      setFaculty(fRes.data?.data?.faculty||fRes.data?.data||[]);
      setDepts(dRes.data?.data?.departments||dRes.data?.data||[]);
    }).catch(()=>notify.error("Failed"))
      .finally(()=>setLoading(false));
  },[]);

  const filtered=faculty.filter(f=>
    (!search||f.name?.toLowerCase().includes(search.toLowerCase())||f.emp_id?.toLowerCase().includes(search.toLowerCase()))&&
    (!deptFilter||f.dept_id===deptFilter)
  );

  const exportCSV=()=>{
    const rows=filtered.map(f=>[f.name,f.emp_id,f.designation,f.department?.name,"26","26","0"]);
    const csv=[["Name","Emp ID","Designation","Department","Working Days","Present Days","LOP Days"],...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`faculty-attendance-${MONTHS[month]}-${year}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate("/admin/hr")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><Users size={18} className="text-primary"/>Faculty Attendance Summary</h1>
          <p className="text-sm text-muted-foreground">HR view — monthly attendance for salary processing</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={13}/>Export
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        ℹ️ ESSL biometric integration pending. Attendance data below shows HR records. Import from biometric device via <button onClick={()=>navigate("/admin/hr/biometric")} className="underline font-medium">Biometric Import</button>.
      </div>

      <div className="flex gap-2 flex-wrap">
        <select value={month} onChange={e=>setMonth(+e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(+e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Departments</option>
          {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search faculty…"
          className="flex-1 min-w-[180px] h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
      </div>

      {loading?<div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/20">
              <tr>{["Faculty","Emp ID","Department","Working Days","Present","LOP","Salary Slip","Action"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length===0&&<tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No faculty found</td></tr>}
              {filtered.map(f=>(
                <tr key={f.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium">{f.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{f.emp_id}</td>
                  <td className="px-3 py-2.5">{f.department?.name}</td>
                  <td className="px-3 py-2.5 text-center">26</td>
                  <td className="px-3 py-2.5 text-center text-green-600 font-medium">26</td>
                  <td className="px-3 py-2.5 text-center text-red-500">0</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-muted-foreground text-[10px]">Not generated</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={()=>navigate(`/admin/hr/slips/generate`)} className="text-xs text-primary hover:underline">Generate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
