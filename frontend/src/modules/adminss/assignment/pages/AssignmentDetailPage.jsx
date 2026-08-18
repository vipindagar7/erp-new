// src/modules/adminss/assignment/pages/AssignmentDetailPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Loader2, CheckCircle, XCircle, AlertCircle, BarChart2, Download, Clock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const badge = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";
const STATUS_COLOR = { SUBMITTED:"bg-blue-50 text-blue-700 border-blue-200", GRADED:"bg-green-50 text-green-700 border-green-200", LATE:"bg-amber-50 text-amber-700 border-amber-200", PLAGIARISM_FLAGGED:"bg-red-50 text-red-700 border-red-200", DRAFT:"bg-muted text-muted-foreground border-border" };

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Submissions");
  const [grading, setGrading] = useState({}); // { sub_id: { marks, remarks } }
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(EP.assignments.byId(id));
      const a = res.data?.data;
      setAssignment(a);
      setSubmissions(a?.submissions || []);
      const init = {};
      (a?.submissions||[]).forEach(s => { init[s.id] = { marks: s.final_marks ?? "", remarks: s.grade_remarks || "" }; });
      setGrading(init);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const gradeSubmission = async (subId) => {
    const g = grading[subId];
    if (g.marks === "" || g.marks === null) { notify.error("Enter marks"); return; }
    try {
      await axiosInstance.post(EP.assignments.grade(subId), { obtained_marks: parseFloat(g.marks), grade_remarks: g.remarks });
      notify.success("Graded");
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  const runPlagiarism = async () => {
    setChecking(true);
    try {
      const res = await axiosInstance.post(EP.assignments.plagiarism(id));
      const flagged = (res.data?.data||[]).filter(r => r.similarity_pct >= (assignment?.plagiarism_threshold||30));
      notify.success(`Check complete. ${flagged.length} pair(s) flagged`);
      load();
    } catch { notify.error("Plagiarism check failed"); }
    finally { setChecking(false); }
  };

  const closeAssignment = async () => {
    if (!confirm("Close this assignment? Students won't be able to submit after this.")) return;
    try {
      await axiosInstance.post(EP.assignments.close(id));
      notify.success("Assignment closed");
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!assignment) return <div className="text-center py-20 text-sm text-muted-foreground">Assignment not found</div>;

  const a = assignment;
  const isOverdue = new Date(a.deadline) < new Date();
  const submitted = submissions.filter(s => s.status !== "DRAFT").length;
  const graded    = submissions.filter(s => s.status === "GRADED").length;
  const flagged   = submissions.filter(s => s.plagiarism_flag).length;
  const avgMarks  = graded > 0 ? (submissions.filter(s=>s.final_marks!=null).reduce((s,x)=>s+(x.final_marks||0),0)/graded).toFixed(1) : "—";

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/assignments")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{a.title}</h1>
          <p className="text-sm text-muted-foreground">
            {a.subject?.name} · Due: {new Date(a.deadline).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}
            {isOverdue && <span className="text-red-500 ml-2">OVERDUE</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {a.status === "PUBLISHED" && (
            <button onClick={closeAssignment} className="px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40">Close</button>
          )}
          {a.plagiarism_check && (
            <button onClick={runPlagiarism} disabled={checking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40 disabled:opacity-60">
              {checking?<Loader2 size={11} className="animate-spin"/>:<AlertCircle size={11}/>}
              Check Plagiarism
            </button>
          )}
          <button onClick={() => navigate(`/admin/assignments/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40"><Edit size={11}/>Edit</button>
          <button onClick={() => navigate(`/admin/assignments/${id}/report`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted/40"><BarChart2 size={11}/>Report</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label:"Total Marks",  value:a.total_marks,     color:"text-foreground" },
          { label:"Submitted",    value:submitted,          color:"text-blue-600"   },
          { label:"Graded",       value:graded,             color:"text-green-600"  },
          { label:"Avg Marks",    value:avgMarks,           color:"text-violet-600" },
          { label:"Flagged",      value:flagged,            color:flagged>0?"text-red-500":"text-muted-foreground" },
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      {a.description && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
          <p className="text-sm text-muted-foreground">{a.description}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {["Submissions","Details"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab===t?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Submissions */}
      {tab==="Submissions" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {submissions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No submissions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {submissions.map(sub => {
                const g = grading[sub.id] || { marks:"", remarks:"" };
                return (
                  <div key={sub.id} className={`px-4 py-3 space-y-2 ${sub.plagiarism_flag?"bg-red-50/20":""}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{sub.student?.name}</p>
                          <span className={`${badge} ${STATUS_COLOR[sub.plagiarism_flag?"PLAGIARISM_FLAGGED":sub.status]||"bg-muted text-muted-foreground border-border"}`}>
                            {sub.plagiarism_flag?"⚠ Flagged":sub.status}
                          </span>
                          {sub.is_late && <span className={`${badge} bg-amber-50 text-amber-700 border-amber-200`}>LATE +{sub.late_days}d</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{sub.student?.roll_no} · {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"}) : "Not submitted"}</p>
                        {sub.similarity_pct && <p className="text-[10px] text-red-500">Similarity: {sub.similarity_pct}%</p>}
                      </div>
                      {sub.status !== "DRAFT" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <input type="number" min="0" max={a.total_marks}
                            value={g.marks} onChange={e=>setGrading(prev=>({...prev,[sub.id]:{...prev[sub.id],marks:e.target.value}}))}
                            placeholder="Marks" className="w-20 h-8 px-2 text-center rounded-lg border border-input bg-background text-sm outline-none"/>
                          <span className="text-xs text-muted-foreground">/{a.total_marks}</span>
                          <button onClick={()=>gradeSubmission(sub.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700">
                            Grade
                          </button>
                        </div>
                      )}
                    </div>
                    {sub.text_content && (
                      <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground max-h-20 overflow-y-auto">
                        {sub.text_content}
                      </div>
                    )}
                    {sub.file_urls?.length > 0 && (
                      <div className="flex gap-2">
                        {sub.file_urls.map((url,i)=>(
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Download size={10}/>File {i+1}
                          </a>
                        ))}
                      </div>
                    )}
                    {sub.status === "GRADED" && (
                      <p className="text-xs text-green-600 font-medium">✓ Graded: {sub.final_marks}/{a.total_marks} {sub.grade_remarks && `— ${sub.grade_remarks}`}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Details tab */}
      {tab==="Details" && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          {[
            ["Status",        a.status],
            ["Deadline",      new Date(a.deadline).toLocaleString("en-IN")],
            ["Total Marks",   a.total_marks],
            ["Passing Marks", a.passing_marks],
            ["Late Policy",   a.allow_late ? `${a.late_penalty_pct}%/day, max ${a.max_late_days} days` : "Not allowed"],
            ["Submission",    [a.allow_file&&"File",a.allow_text&&"Text"].filter(Boolean).join(" + ")],
            ["Plagiarism",    a.plagiarism_check ? `Enabled (threshold: ${a.plagiarism_threshold}%)` : "Disabled"],
            ["Sections",      a.section_ids?.length ? `${a.section_ids.length} sections` : "All"],
          ].map(([l,v])=>(
            <div key={l} className="flex justify-between text-sm">
              <span className="text-xs text-muted-foreground">{l}</span>
              <span className="text-xs font-medium">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
