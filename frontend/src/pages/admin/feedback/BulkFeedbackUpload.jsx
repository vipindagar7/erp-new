import { useState, useRef } from "react";
import axiosInstance from "../../../lib/axios.js";

import { cn } from "@/lib/utils.js";
import { Upload, Download, Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
// import { notify } from "../../hooks/notify.js";
import { notify } from "@/hooks/notify.js";


// Receives selectedFormId + forms from parent (feedbackResultPage)
// so form selection is already done — no duplicate selector needed
export default function BulkFeedbackUpload({ selectedFormId = "", forms = [] }) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const selectedFormObj = forms.find((f) => f.id === selectedFormId);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await axiosInstance.get(
        `/feedback/forms/${selectedFormId}/bulk-template`,
        { responseType: "blob" }
      );
      const cd = res.headers["content-disposition"] || "";
      const name = cd.match(/filename="?([^"]+)"?/)?.[1] || "bulk_template.xlsx";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = name; a.click();
      URL.revokeObjectURL(a.href);
    } catch { notify.error("Template download failed"); }
    finally { setDownloading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axiosInstance.post(
        `/feedback/forms/${selectedFormId}/bulk-submit`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const d = res.data?.data ?? res.data;
      setResult(d);
      notify.success(`${d.success?.length ?? 0} submitted, ${d.failed?.length ?? 0} failed`);
    } catch (err) {
      notify.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // No form selected — prompt user to select from the form selector above
  if (!selectedFormId) {
    return (
      <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
        <div className="text-4xl mb-3">📤</div>
        <p className="font-medium text-foreground">Select a form above to bulk submit</p>
        <p className="text-sm text-muted-foreground mt-1">Choose a form from the selector, then come back to this tab</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Selected form info */}
      {selectedFormObj && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">{selectedFormObj.title}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {selectedFormObj.category && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {selectedFormObj.category.name}
              </span>
            )}
            {selectedFormObj.faculty && <span>👤 {selectedFormObj.faculty.name}</span>}
            {selectedFormObj.subject && <span>📘 {selectedFormObj.subject.name}</span>}
            {selectedFormObj.section && <span>🏫 Section {selectedFormObj.section.name}</span>}
            <span>· {selectedFormObj._count?.responses ?? 0} responses so far</span>
          </div>
        </div>
      )}

      {/* Step 1 — Download template */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <p className="text-sm font-semibold text-foreground">Download Template</p>
        </div>
        <p className="text-xs text-muted-foreground pl-8">
          Template has one column per question. Fill in <code className="bg-muted px-1 rounded">student_email</code> and answers, then upload.
          Do not change column headers.
        </p>
        <div className="pl-8">
          <button
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download Template
          </button>
        </div>
      </div>

      {/* Step 2 — Upload */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</span>
          <p className="text-sm font-semibold text-foreground">Upload Filled Template</p>
        </div>
        <p className="text-xs text-muted-foreground pl-8">
          Upload the filled xlsx. Each row = one student submission. Existing submissions are skipped.
        </p>
        <div className="pl-8 flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={handleUpload} />
          <button
            onClick={() => { setResult(null); fileRef.current?.click(); }}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin" />Uploading…</>
              : <><Upload size={14} />Upload & Submit</>}
          </button>
          <span className="text-xs text-muted-foreground">.xlsx or .xls</span>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Upload Results</p>
            <button onClick={() => setResult(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <RefreshCw size={11} /> Clear
            </button>
          </div>

          {/* Summary pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.success?.length ?? 0}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Submitted</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{result.failed?.length ?? 0}</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Failed</p>
            </div>
            <div className="bg-muted border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{result.total ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Rows</p>
            </div>
          </div>

          {/* Successes */}
          {result.success?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle size={12} /> Submitted ({result.success.length})
              </p>
              <div className="max-h-36 overflow-y-auto space-y-0.5 pl-1">
                {result.success.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-green-500">✓</span>
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className="opacity-60">({r.email})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failures */}
          {result.failed?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                <XCircle size={12} /> Failed ({result.failed.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pl-1">
                {result.failed.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2.5 bg-destructive/5 border border-destructive/20 rounded-xl">
                    <AlertTriangle size={11} className="text-destructive shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground">Row {r.row}</span>
                      {r.email && r.email !== "—" && (
                        <span className="text-muted-foreground ml-1.5">({r.email})</span>
                      )}
                      <span className="text-destructive ml-1.5">— {r.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}