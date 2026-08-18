// src/modules/adminss/hr/pages/HRReportPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2, Download, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function HRReportPage() {
  const navigate = useNavigate();
  const [report,  setReport]  = useState(null);
  const [slips,   setSlips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [month,   setMonth]   = useState(new Date().getMonth()+1);
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [depts,   setDepts]   = useState([]);
  const [deptFilter,setDeptFilter]=useState("");

  useEffect(()=>{
    axiosInstance.get(EP.departments.list+"?limit=50").then(r=>setDepts(r.data?.data?.departments||r.data?.data||[])).catch(()=>{});
    loadReport();
  },[]);

  const loadReport = async(m=month,y=year,dept="")=>{
    setLoading(true);
    try{
      const params=new URLSearchParams({month:m,year:y});
      if(dept) params.set("dept_id",dept);
      const [rRes,sRes]=await Promise.all([
        axiosInstance.get(EP.hr.hrReport+"?"+params),
        axiosInstance.get(EP.hr.slips+"?month="+m+"&year="+y+"&limit=200"),
      ]);
      setReport(rRes.data?.data);
      setSlips(sRes.data?.data?.items||sRes.data?.data||[]);
    }catch{notify.error("Failed");}
    finally{setLoading(false);}
  };

  const exportCSV=()=>{
    const rows=slips.map(s=>[s.faculty?.name,s.faculty?.emp_id,s.faculty?.designation,s.faculty?.department?.name,s.gross_salary,s.total_deductions,s.net_salary,s.status]);
    const csv=[["Name","Emp ID","Designation","Department","Gross","Deductions","Net","Status"],...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`hr-report-${MONTHS[month]}-${year}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate("/admin/hr")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={18} className="text-primary"/>HR Report</h1>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={13}/>Export CSV
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        <select value={month} onChange={e=>{setMonth(+e.target.value);loadReport(+e.target.value,year,deptFilter);}}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e=>{setYear(+e.target.value);loadReport(month,+e.target.value,deptFilter);}}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select value={deptFilter} onChange={e=>{setDeptFilter(e.target.value);loadReport(month,year,e.target.value);}}
          className="h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">All Departments</option>
          {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Summary */}
      {report&&(
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {label:"Total Slips",   value:report.total_slips,                           color:"text-foreground"},
            {label:"Approved",      value:report.approved,                               color:"text-green-600"},
            {label:"Paid",          value:report.paid,                                   color:"text-blue-600"},
            {label:"Total Gross",   value:`₹${(report.total_gross||0).toLocaleString()}`, color:"text-primary"},
            {label:"Deductions",    value:`₹${(report.total_deductions||0).toLocaleString()}`,color:"text-red-500"},
            {label:"Net Payroll",   value:`₹${(report.total_net||0).toLocaleString()}`,  color:"text-green-600"},
          ].map(s=>(
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading?<div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/20">
              <tr>{["Faculty","Emp ID","Department","Gross","Deductions","Net","Status","Action"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slips.length===0&&<tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No salary slips for {MONTHS[month]} {year}</td></tr>}
              {slips.map(s=>(
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium">{s.faculty?.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.faculty?.emp_id}</td>
                  <td className="px-3 py-2.5">{s.faculty?.department?.name}</td>
                  <td className="px-3 py-2.5">₹{s.gross_salary?.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-red-500">₹{s.total_deductions?.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-bold">₹{s.net_salary?.toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.status==="PAID"?"bg-green-50 text-green-700":s.status==="APPROVED"?"bg-blue-50 text-blue-700":"bg-muted text-muted-foreground"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={()=>navigate(`/admin/hr/slips/${s.id}`)} className="text-xs text-primary hover:underline">View</button>
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
