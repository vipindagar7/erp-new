// src/modules/adminss/skillcard/pages/SkillCardBulkPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, Loader2, CheckCircle, AlertCircle, Plus } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function SkillCardBulkPage() {
  const navigate = useNavigate();
  const [sections, setSections]     = useState([]);
  const [selSection, setSelSection] = useState("");
  const [initLoading, setInitLoading] = useState(false);
  const [bulkFile,  setBulkFile]    = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [results,   setResults]     = useState(null);
  const [domainTrack, setDomainTrack] = useState("");
  const [batchYear,   setBatchYear]   = useState(new Date().getFullYear());

  useEffect(() => {
    axiosInstance.get(EP.sections.list + "?status=ACTIVE&limit=200")
      .then(r => {
        const s = r.data?.data?.sections || r.data?.data || [];
        setSections(s);
        if (s.length) setSelSection(s[0].id);
      }).catch(() => {});
  }, []);

  const downloadTemplate = () => {
    const headers = ["student_id","entry_id","is_completed","completion_date","certificate_url"];
    const csv     = headers.join(",") + "\n" + "student-uuid-here,entry-uuid-here,true,2025-01-15,https://certificate-url";
    const a = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = "skill-card-bulk-template.csv";
    a.click();
  };

  const initSection = async () => {
    if (!selSection) { notify.error("Select a section"); return; }
    setInitLoading(true);
    try {
      const res = await axiosInstance.post(EP.skillCard.bulkInit, {
        section_id:   selSection,
        domain_track: domainTrack,
        batch_year:   parseInt(batchYear),
      });
      const data = res.data?.data || [];
      const success = data.filter(r => r.success).length;
      const failed  = data.filter(r => !r.success).length;
      notify.success(`${success} cards initialized${failed ? `, ${failed} failed` : ""}`);
      setResults({ type:"init", data });
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setInitLoading(false); }
  };

  const uploadBulk = async () => {
    if (!bulkFile) { notify.error("Select a CSV file"); return; }
    setUploading(true);
    try {
      // Parse CSV
      const text    = await bulkFile.text();
      const lines   = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      const records = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim());
        const obj  = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return { ...obj, is_completed: obj.is_completed === "true" };
      }).filter(r => r.student_id && r.entry_id);

      const res = await axiosInstance.post(EP.skillCard.bulkUpdate, { records });
      const data = res.data?.data || [];
      const success = data.filter(r => r.success).length;
      notify.success(`${success}/${data.length} entries updated`);
      setResults({ type:"bulk", data });
    } catch(e) { notify.error(e.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/skill-card")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold">Bulk Skill Card Operations</h1>
      </div>

      {/* Initialize section */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initialize Cards for Section</p>
        <p className="text-xs text-muted-foreground">Creates 62-entry skill cards (8 semesters) for all active students in a section</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Section</label>
            <select value={selSection} onChange={e => setSelSection(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
              {sections.map(s => <option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Batch Year</label>
            <input type="number" value={batchYear} onChange={e => setBatchYear(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none"/>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Domain Track (optional)</label>
          <input value={domainTrack} onChange={e => setDomainTrack(e.target.value)}
            placeholder="e.g. AI/ML, Full Stack, Cybersecurity…"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none"/>
        </div>
        <button onClick={initSection} disabled={initLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {initLoading ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
          {initLoading ? "Initializing…" : "Initialize Cards for Section"}
        </button>
      </div>

      {/* Bulk update via template */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bulk Update via Template</p>
        <p className="text-xs text-muted-foreground">Download template → fill completion data → upload back</p>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={13}/>Download CSV Template
        </button>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Upload Filled Template</label>
          <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0]||null)}
            className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-medium"/>
        </div>
        {bulkFile && (
          <button onClick={uploadBulk} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60">
            {uploading ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}
            {uploading ? "Uploading…" : `Upload ${bulkFile.name}`}
          </button>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {results.type === "init" ? "Initialization Results" : "Upload Results"}
          </p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ {results.data.filter(r=>r.success).length} success</span>
            <span className="text-red-500 font-medium">✗ {results.data.filter(r=>!r.success).length} failed</span>
          </div>
          {results.data.filter(r => !r.success).slice(0,5).map((r,i) => (
            <p key={i} className="text-xs text-red-500">{r.student_id || r.entry_id}: {r.error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
