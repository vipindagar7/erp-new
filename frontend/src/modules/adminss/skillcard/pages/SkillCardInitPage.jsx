// src/modules/adminss/skillcard/pages/SkillCardInitPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Loader2, CheckCircle, Users } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function SkillCardInitPage() {
  const navigate = useNavigate();
  const [sections,setSections]=useState([]);
  const [selSection,setSelSection]=useState("");
  const [domainTrack,setDomainTrack]=useState("");
  const [batchYear,setBatchYear]=useState(new Date().getFullYear());
  const [loading,setLoading]=useState(true);
  const [initializing,setInitializing]=useState(false);
  const [results,setResults]=useState(null);

  useEffect(()=>{
    axiosInstance.get(EP.sections.list+"?status=ACTIVE&limit=200")
      .then(r=>{
        const s=r.data?.data?.sections||r.data?.data||[];
        setSections(s);
        if(s.length) setSelSection(s[0].id);
      }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const sectionStudentCount = sections.find(s=>s.id===selSection)?._count?.students||0;

  const init = async()=>{
    if(!selSection){notify.error("Select a section");return;}
    setInitializing(true);
    try{
      const res=await axiosInstance.post(EP.skillCard.bulkInit,{section_id:selSection,domain_track:domainTrack,batch_year:parseInt(batchYear)});
      const data=res.data?.data||[];
      const ok=data.filter(r=>r.success).length;
      const fail=data.filter(r=>!r.success).length;
      notify.success(`${ok} skill cards initialized${fail?`, ${fail} failed`:""}`);
      setResults(data);
    }catch(e){notify.error(e.response?.data?.message||"Failed");}
    finally{setInitializing(false);}
  };

  const inp="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
  const sel2="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate("/admin/skill-card")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex items-center gap-2"><Plus size={18} className="text-primary"/>Initialize Skill Cards</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        Creates a 62-entry vaccination-style skill card for each student in the selected section.
        All 8 semesters × company workshops + self-learning courses are pre-populated from the official curriculum.
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Section *</label>
          {loading?<div className="h-10 bg-muted rounded-lg animate-pulse"/>:(
            <select className={sel2} value={selSection} onChange={e=>setSelSection(e.target.value)}>
              {sections.map(s=><option key={s.id} value={s.id}>{s.name} — Sem {s.semester} ({s._count?.students||0} students)</option>)}
            </select>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Batch Year</label>
            <input type="number" value={batchYear} onChange={e=>setBatchYear(e.target.value)} className={inp}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Domain Track</label>
            <input value={domainTrack} onChange={e=>setDomainTrack(e.target.value)}
              placeholder="e.g. AI/ML, Full Stack…" className={inp}/>
          </div>
        </div>

        {selSection&&(
          <div className="bg-muted/20 rounded-xl p-3 flex items-center gap-2 text-sm">
            <Users size={14} className="text-primary"/>
            <span>Will initialize <strong>{sectionStudentCount}</strong> skill cards × 62 entries each</span>
          </div>
        )}

        <button onClick={init} disabled={initializing||!selSection}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60">
          {initializing?<Loader2 size={15} className="animate-spin"/>:<Plus size={15}/>}
          {initializing?"Initializing…":"Initialize Skill Cards"}
        </button>
      </div>

      {results&&(
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results</p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={13}/>{results.filter(r=>r.success).length} created</span>
            <span className="text-red-500 font-medium">{results.filter(r=>!r.success).length} failed</span>
          </div>
          {results.filter(r=>!r.success).slice(0,3).map((r,i)=>(
            <p key={i} className="text-xs text-red-500">{r.student_id}: {r.error}</p>
          ))}
          {results.filter(r=>r.success).length>0&&(
            <button onClick={()=>navigate("/admin/skill-card/mentor")} className="text-xs text-primary hover:underline">
              View in Mentor Dashboard →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
