// src/components/shared/BulkUploadPanel.jsx
// Reusable panel: Download Template → Upload → Show Results
// Used by Department, Program, Branch, Section bulk pages
import { useRef, useState } from "react";
import { Download, Upload, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { notify } from "../../hooks/notify.js";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────
// Props:
//   templateUrl  — GET endpoint to download the template
//   uploadUrl    — POST multipart endpoint
//   templateName — filename for downloaded file
//   module       — display name e.g. "Department"
//   onSuccess    — called after successful upload (refresh list)
//   fields       — array of { label, required, notes } for inline help
// ─────────────────────────────────────────────────────────────
export default function BulkUploadPanel({
  templateUrl, uploadUrl, templateName = "template.xlsx",
  module = "Record", onSuccess, fields = [],
}) {
  const fileRef  = useRef(null);
  const [result,    setResult]    = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showHelp,  setShowHelp]  = useState(false);
  const [showFail,  setShowFail]  = useState(false);

  const downloadTemplate = async () => {
    try {
      const r = await axiosInstance.get(templateUrl, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = templateName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { notify.error(err); }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await axiosInstance.post(uploadUrl, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = r.data?.data;
      setResult(d);
      const created = d?.created?.length || 0;
      const failed  = d?.failed?.length  || 0;
      const skipped = d?.skipped?.length || 0;
      if (created > 0) {
        notify.success(`${created} ${module}${created !== 1 ? "s" : ""} created${skipped ? `, ${skipped} skipped` : ""}${failed ? `, ${failed} failed` : ""}`);
        onSuccess?.();
      } else if (failed > 0) {
        notify.error(`All ${failed} row${failed !== 1 ? "s" : ""} failed. Check errors below.`);
      } else {
        notify.warning("No rows processed.");
      }
    } catch (err) { notify.error(err); }
    finally { setUploading(false); }
  };

  const created = result?.created?.length || 0;
  const failed  = result?.failed?.length  || 0;
  const skipped = result?.skipped?.length || 0;
  const total   = result?.total   || 0;

  return (
    <div className="space-y-4">
      {/* Step 1 & 2 */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bulk Add {module}s</p>

        <div className="flex items-start gap-4">
          {/* Step 1 */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
              <p className="text-sm font-medium">Download Template</p>
            </div>
            <p className="text-xs text-muted-foreground pl-7">Get the Excel template with reference sheets showing valid codes.</p>
            <div className="pl-7">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download size={13} className="mr-1.5" /> Download Template
              </Button>
            </div>
          </div>

          <div className="w-px bg-border self-stretch" />

          {/* Step 2 */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
              <p className="text-sm font-medium">Fill & Upload</p>
            </div>
            <p className="text-xs text-muted-foreground pl-7">Fill in the template and upload. Duplicate codes are skipped.</p>
            <div className="pl-7">
              <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading
                  ? <><Loader2 size={13} className="mr-1.5 animate-spin" /> Processing…</>
                  : <><Upload size={13} className="mr-1.5" /> Upload Excel</>}
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={upload} />
            </div>
          </div>
        </div>

        {/* Field help */}
        {fields.length > 0 && (
          <div>
            <button
              onClick={() => setShowHelp((s) => !s)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showHelp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showHelp ? "Hide" : "Show"} field reference
            </button>
            {showHelp && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Field</th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Required</th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fields.map((f) => (
                      <tr key={f.label} className="hover:bg-muted/10">
                        <td className="px-3 py-2 font-mono font-medium">{f.label}</td>
                        <td className="px-3 py-2">
                          {f.required
                            ? <span className="text-destructive font-semibold">YES</span>
                            : <span className="text-muted-foreground">no</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{f.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Results</p>

          {/* Summary bar */}
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={14} />{created} created</span>
            {skipped > 0 && <span className="text-amber-600 font-semibold flex items-center gap-1"><AlertCircle size={14} />{skipped} skipped</span>}
            {failed  > 0 && <span className="text-destructive font-semibold flex items-center gap-1"><XCircle size={14} />{failed} failed</span>}
            <span className="text-muted-foreground ml-auto">of {total} rows</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            {created > 0 && <div className="bg-green-500 h-full" style={{ width: `${(created / total) * 100}%` }} />}
            {skipped > 0 && <div className="bg-amber-400 h-full" style={{ width: `${(skipped / total) * 100}%` }} />}
            {failed  > 0 && <div className="bg-destructive h-full" style={{ width: `${(failed  / total) * 100}%` }} />}
          </div>

          {/* Created list (collapsed if many) */}
          {created > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-700">Created:</p>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {result.created.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <span className="font-mono bg-green-50 text-green-700 px-1 rounded">{r.code || r.row}</span> {r.name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Skipped */}
          {skipped > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-700">Skipped (already exist):</p>
              <div className="max-h-24 overflow-y-auto space-y-0.5">
                {result.skipped.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <span className="font-mono bg-amber-50 text-amber-700 px-1 rounded">{r.row}</span> {r.name} — {r.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Failures */}
          {failed > 0 && (
            <div className="space-y-1">
              <button onClick={() => setShowFail((s) => !s)} className="flex items-center gap-1.5 text-xs text-destructive font-medium hover:underline">
                {showFail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showFail ? "Hide" : "Show"} {failed} failure{failed !== 1 ? "s" : ""}
              </button>
              {showFail && (
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {result.failed.map((r, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="font-mono bg-red-50 text-destructive px-1 rounded">{r.row}</span>{r.name ? ` ${r.name}` : ""} — {r.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
