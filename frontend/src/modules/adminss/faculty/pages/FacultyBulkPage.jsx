// src/modules/faculty/pages/FacultyBulkPage.jsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Upload } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";

export default function FacultyBulkPage() {
  const navigate  = useNavigate();
  const fileRef   = useRef();
  const [uploading, setUploading] = useState(false);
  const [results,   setResults]   = useState(null);

  const downloadTemplate = async () => {
    try {
      const r = await axiosInstance.get(`${EP.faculty.list}/template`, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(r.data);
      a.download = "faculty-template.xlsx"; a.click();
    } catch { notify.error("Failed to download template"); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setResults(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await axiosInstance.post(`${EP.faculty.list}/bulk-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResults(r.data?.data);
      notify.success(`${r.data?.data?.created?.length || 0} faculty created`);
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.faculty.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Bulk Upload Faculty</h1><p className="text-sm text-muted-foreground">Upload multiple faculty members from an Excel file</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span><p className="font-medium text-sm">Download the template</p></div>
        <p className="text-xs text-muted-foreground pl-8">Template contains required columns and a Departments reference sheet.</p>
        <div className="pl-8"><Button variant="outline" size="sm" onClick={downloadTemplate}><Download size={13} className="mr-1.5" /> Download Template</Button></div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span><p className="font-medium text-sm">Fill in the Faculty sheet</p></div>
        <div className="pl-8 space-y-1 text-xs text-muted-foreground">
          <p><span className="font-mono bg-muted px-1 rounded">name*</span> — Full name</p>
          <p><span className="font-mono bg-muted px-1 rounded">email*</span> — Institutional email (used for login)</p>
          <p><span className="font-mono bg-muted px-1 rounded">emp_id</span> — Employee ID (optional, must be unique)</p>
          <p><span className="font-mono bg-muted px-1 rounded">dept_code</span> — From Departments reference sheet</p>
          <p><span className="font-mono bg-muted px-1 rounded">designation</span> — e.g. Professor, Assistant Professor</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span><p className="font-medium text-sm">Upload the filled file</p></div>
        <div className="pl-8">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
          <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload size={13} className="mr-1.5" />{uploading ? "Uploading…" : "Choose File & Upload"}
          </Button>
        </div>
      </div>

      {results && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="font-medium text-sm">Upload Results</p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-semibold">✓ {results.created?.length || 0} created</span>
            <span className="text-destructive font-semibold">✗ {results.failed?.length || 0} failed</span>
            <span className="text-muted-foreground">of {results.total} rows</span>
          </div>
          {results.failed?.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.failed.map((f, i) => <p key={i} className="text-xs text-muted-foreground"><span className="font-mono bg-muted px-1 rounded mr-1">{f.row}</span>{f.reason}</p>)}
            </div>
          )}
          {results.created?.length > 0 && <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.faculty.list)}>View all faculty →</Button>}
        </div>
      )}
    </div>
  );
}
