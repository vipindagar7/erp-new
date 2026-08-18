// src/modules/adminss/skillcard/pages/SkillCardStudentPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Printer, Loader2, Award, ExternalLink } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const TYPE_BADGE = {
  INSTITUTE_OFFLINE: "bg-blue-50 text-blue-700 border-blue-200",
  COMPANY_WORKSHOP:  "bg-violet-50 text-violet-700 border-violet-200",
  SELF_LEARNING:     "bg-green-50 text-green-700 border-green-200",
};
const YEAR_LABEL = ["","Year 1 — Foundation Building","Year 2 — Programming & Problem-Solving Core","Year 3 — Technical Depth + Domain Specialization","Year 4 — Cloud Mastery + Corporate Placement"];

export default function SkillCardStudentPage() {
  const { sid } = useParams();
  const navigate  = useNavigate();
  const [student, setStudent] = useState(null);
  const [card,    setCard]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState({});
  const printRef = useRef();

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.students.byId(sid)),
      axiosInstance.get(EP.skillCard.student(sid)),
    ]).then(([sRes, cRes]) => {
      setStudent(sRes.data?.data);
      setCard(cRes.data?.data);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [sid]);

  const toggleComplete = async (entry) => {
    setSaving(prev => ({ ...prev, [entry.id]: true }));
    try {
      const res = await axiosInstance.patch(EP.skillCard.updateEntry(entry.id), {
        is_completed: !entry.is_completed,
        completion_date: !entry.is_completed ? new Date().toISOString().slice(0,10) : null,
      });
      setCard(prev => ({
        ...prev,
        entries: prev.entries.map(e => e.id === entry.id ? { ...e, ...res.data?.data } : e),
      }));
    } catch { notify.error("Failed to update"); }
    finally { setSaving(prev => ({ ...prev, [entry.id]: false })); }
  };

  const verifyEntry = async (entry) => {
    setSaving(prev => ({ ...prev, [entry.id]: true }));
    try {
      await axiosInstance.patch(EP.skillCard.updateEntry(entry.id), { is_verified: !entry.is_verified });
      setCard(prev => ({
        ...prev,
        entries: prev.entries.map(e => e.id === entry.id ? { ...e, is_verified: !entry.is_verified } : e),
      }));
      notify.success(entry.is_verified ? "Verification removed" : "Entry verified");
    } catch { notify.error("Failed"); }
    finally { setSaving(prev => ({ ...prev, [entry.id]: false })); }
  };

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Skill Card - ${student?.name}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;font-size:10px;}td,th{border:1px solid #e2e8f0;padding:6px 8px;}th{background:#f1f5f9;font-weight:700;}h2,h3{text-align:center;}@media print{@page{size:A4;margin:10mm;}}</style>
    </head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),300);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  // Group entries by year then semester
  const grouped = {};
  (card?.entries || []).forEach(e => {
    if (!grouped[e.year_no]) grouped[e.year_no] = {};
    if (!grouped[e.year_no][e.semester_no]) grouped[e.year_no][e.semester_no] = [];
    grouped[e.year_no][e.semester_no].push(e);
  });

  const completed  = card?.completed_entries || 0;
  const total      = card?.total_entries || 0;
  const pct        = total > 0 ? Math.round(completed/total*100) : 0;
  const readiness  = pct >= 80 ? "PLACEMENT_READY" : pct >= 50 ? "JOB_READY" : "FOUNDATIONAL";
  const readColor  = readiness === "PLACEMENT_READY" ? "text-green-600" : readiness === "JOB_READY" ? "text-blue-600" : "text-amber-600";

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><Award size={18} className="text-primary"/>Skill Card</h1>
          <p className="text-sm text-muted-foreground">{student?.name} · {student?.roll_no} · {student?.branch?.name}</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Printer size={14}/>Print
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{completed}/{total}</p>
          <p className="text-xs text-muted-foreground">Entries Completed</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{pct}%</p>
          <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${pct}%`}}/></div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className={`text-sm font-bold ${readColor}`}>{readiness.replace(/_/g," ")}</p>
          <p className="text-xs text-muted-foreground mt-1">Placement Readiness</p>
        </div>
      </div>

      {/* Card content */}
      {!card ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <Award size={32} className="mx-auto text-muted-foreground/30 mb-3"/>
          <p className="text-sm text-muted-foreground">Skill card not initialized</p>
          <button onClick={() => navigate("/admin/skill-card/init")} className="mt-2 text-xs text-primary hover:underline">Initialize →</button>
        </div>
      ) : (
        <div ref={printRef} className="space-y-6">
          {/* Print header */}
          <div className="hidden print:block text-center space-y-1">
            <h2 className="text-lg font-black">ECHELON INSTITUTE OF TECHNOLOGY</h2>
            <h3 className="text-base font-bold">Student Skill Card — Training & Certification Passport</h3>
            <p className="text-sm">{student?.name} | {student?.roll_no} | {student?.branch?.name}</p>
          </div>

          {[1,2,3,4].map(year => {
            const sems = grouped[year] || {};
            if (!Object.keys(sems).length) return null;
            return (
              <div key={year} className="space-y-3">
                <h2 className="text-base font-bold text-primary border-b-2 border-primary pb-1">{YEAR_LABEL[year]}</h2>
                {Object.keys(sems).sort().map(sem => (
                  <div key={sem} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 bg-muted/30 border-b border-border">
                      <p className="text-xs font-bold text-muted-foreground">SEMESTER {sem}</p>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="border-b border-border bg-muted/20">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Training / Course</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Provider</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">Duration</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">Done</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">Verified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(sems[sem]||[]).sort((a,b)=>a.entry_no-b.entry_no).map(e => (
                          <tr key={e.id} className={e.is_completed ? "bg-green-50/30" : ""}>
                            <td className="px-3 py-2 text-muted-foreground">{e.entry_no}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium leading-tight">{e.course_name}</p>
                                  <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${TYPE_BADGE[e.type]||"bg-muted text-muted-foreground border-border"}`}>
                                    {e.type?.replace(/_/g," ")}
                                  </span>
                                </div>
                                {e.course_url && (
                                  <a href={`https://${e.course_url}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary mt-0.5 shrink-0">
                                    <ExternalLink size={10}/>
                                  </a>
                                )}
                              </div>
                              {e.certificate_url && <a href={e.certificate_url} target="_blank" className="text-[10px] text-green-600 hover:underline">📜 Certificate</a>}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{e.provider}</td>
                            <td className="px-3 py-2 text-center text-muted-foreground">{e.duration||"—"}</td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => toggleComplete(e)} disabled={saving[e.id]}
                                className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto transition-all
                                  ${e.is_completed ? "bg-green-500 text-white hover:bg-green-600" : "border-2 border-muted-foreground/30 hover:border-green-400"}`}>
                                {saving[e.id] ? <Loader2 size={10} className="animate-spin"/> : e.is_completed ? <CheckCircle size={12}/> : null}
                              </button>
                              {e.completion_date && <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(e.completion_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</p>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => verifyEntry(e)} disabled={saving[e.id]}
                                className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all
                                  ${e.is_verified ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground hover:bg-muted/60"}`}>
                                {e.is_verified ? "✓ Verified" : "Verify"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Summary table */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">4-Year Roadmap Summary</p>
            <table className="w-full text-xs border border-border rounded-xl overflow-hidden">
              <thead className="bg-muted/30">
                <tr>{["Year","Semesters","Offline","Workshops","Self-Learning","Total"].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1,2,3,4].map(y => {
                  const sems = grouped[y]||{};
                  const all  = Object.values(sems).flat();
                  return (
                    <tr key={y} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium text-primary">Year {y}</td>
                      <td className="px-3 py-2">Sem {(y-1)*2+1} & {y*2}</td>
                      <td className="px-3 py-2">{all.filter(e=>e.type==="INSTITUTE_OFFLINE").length}</td>
                      <td className="px-3 py-2">{all.filter(e=>e.type==="COMPANY_WORKSHOP").length}</td>
                      <td className="px-3 py-2">{all.filter(e=>e.type==="SELF_LEARNING").length}</td>
                      <td className="px-3 py-2 font-bold">{all.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
