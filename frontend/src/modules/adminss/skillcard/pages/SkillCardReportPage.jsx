// src/modules/adminss/skillcard/pages/SkillCardReportPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Award, TrendingUp } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const READINESS_COLOR = {
  PLACEMENT_READY: "bg-green-50 text-green-700 border-green-200",
  JOB_READY:       "bg-blue-50 text-blue-700 border-blue-200",
  FOUNDATIONAL:    "bg-amber-50 text-amber-700 border-amber-200",
};

export default function SkillCardReportPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sections, setSections] = useState([]);
  const [selSection,setSelSection]=useState("");
  const [search,   setSearch]   = useState("");

  useEffect(()=>{
    axiosInstance.get(EP.sections.list+"?status=ACTIVE&limit=200")
      .then(r=>{
        const s=r.data?.data?.sections||r.data?.data||[];
        setSections(s);
        if(s.length){setSelSection(s[0].id);loadStudents(s[0].id);}
      }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const loadStudents = async(secId)=>{
    setLoading(true);
    try{
      const res=await axiosInstance.get(EP.skillCard.mentorView(secId));
      setStudents(res.data?.data||[]);
    }catch{notify.error("Failed");}
    finally{setLoading(false);}
  };

  const getReadiness=(card)=>{
    if(!card)return{level:"NO CARD",pct:0,color:"text-muted-foreground"};
    const pct=card.total_entries>0?Math.round(card.completed_entries/card.total_entries*100):0;
    const level=pct>=80?"PLACEMENT_READY":pct>=50?"JOB_READY":"FOUNDATIONAL";
    return{level,pct,color:pct>=80?"text-green-600":pct>=50?"text-blue-600":"text-amber-600"};
  };

  const filtered=students.filter(s=>!search||s.name?.toLowerCase().includes(search.toLowerCase())||s.roll_no?.toLowerCase().includes(search.toLowerCase()));
  const placementReady=filtered.filter(s=>getReadiness(s.skillCard).level==="PLACEMENT_READY").length;
  const jobReady=filtered.filter(s=>getReadiness(s.skillCard).level==="JOB_READY").length;
  const foundational=filtered.filter(s=>getReadiness(s.skillCard).level==="FOUNDATIONAL").length;
  const noCard=filtered.filter(s=>!s.skillCard).length;

  const exportCSV=()=>{
    const rows=filtered.map(s=>{
      const r=getReadiness(s.skillCard);
      return[s.name,s.roll_no,r.pct+"%",r.level,s.skillCard?.completed_entries||0,s.skillCard?.total_entries||0];
    });
    const csv=[["Name","Roll No","Completion %","Readiness","Completed","Total"],...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`skill-card-report-${sections.find(s=>s.id===selSection)?.name||"section"}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate("/admin/skill-card")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Award size={20} className="text-primary"/>Placement Readiness Report</h1>
        </div>
        <div className="flex gap-2">
          <select value={selSection} onChange={e=>{setSelSection(e.target.value);loadStudents(e.target.value);}}
            className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
            {sections.map(s=><option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Download size={13}/>Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:"Placement Ready",value:placementReady,color:"text-green-600"},
          {label:"Job Ready",      value:jobReady,      color:"text-blue-600"},
          {label:"Foundational",   value:foundational,  color:"text-amber-600"},
          {label:"No Card",        value:noCard,        color:"text-muted-foreground"},
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student…"
        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>

      {loading?<div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>:(
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/20">
              <tr>{["Student","Roll No","Completed","Progress","Readiness","Action"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length===0&&<tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No students found</td></tr>}
              {filtered.map(s=>{
                const r=getReadiness(s.skillCard);
                return(
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-medium">{s.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.roll_no}</td>
                    <td className="px-3 py-2.5">{s.skillCard?`${s.skillCard.completed_entries}/${s.skillCard.total_entries}`:"—"}</td>
                    <td className="px-3 py-2.5 w-28">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{width:`${r.pct}%`}}/>
                      </div>
                      <p className={`text-[10px] font-medium mt-0.5 ${r.color}`}>{r.pct}%</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {s.skillCard?(
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${READINESS_COLOR[r.level]||"bg-muted text-muted-foreground border-border"}`}>
                          {r.level.replace(/_/g," ")}
                        </span>
                      ):<span className="text-[10px] text-muted-foreground">No card</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <button onClick={()=>navigate(`/admin/skill-card/${s.id}`)} className="text-xs text-primary hover:underline">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
