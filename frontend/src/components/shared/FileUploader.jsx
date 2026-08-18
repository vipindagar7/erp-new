// src/components/shared/FileUploader.jsx
import { useRef, useState } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils.js";

export function FileUploader({ accept = ".xlsx,.xls", maxSizeMB = 10, label = "Choose file", hint, onUpload, className }) {
  const ref = useRef();
  const [state,   setState]   = useState("idle");
  const [file,    setFile]    = useState(null);
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState("");

  const handleFile = async (f) => {
    if (!f) return;
    if (f.size > maxSizeMB * 1024 * 1024) { setError(`File must be under ${maxSizeMB}MB`); return; }
    setFile(f); setError(""); setState("uploading"); setResults(null);
    try { const res = await onUpload(f); setResults(res); setState("done"); }
    catch (err) { setError(err.message || "Upload failed"); setState("error"); }
  };

  const reset = () => { setState("idle"); setFile(null); setResults(null); setError(""); if (ref.current) ref.current.value = ""; };

  return (
    <div className={cn("space-y-3", className)}>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      {state === "idle" && (
        <button onClick={() => ref.current?.click()}
          className="w-full flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/60 p-8 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
            <Upload size={18} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{label}</p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
            <p className="text-xs text-muted-foreground mt-1">Max {maxSizeMB}MB · {accept}</p>
          </div>
        </button>
      )}
      {state === "uploading" && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center animate-pulse">
            <File size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file?.name}</p>
            <p className="text-xs text-muted-foreground">Uploading…</p>
          </div>
        </div>
      )}
      {state === "done" && results && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-sm font-medium">Upload complete</p>
            <button onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-semibold">✓ {results.created?.length || 0} created</span>
            {results.failed?.length > 0 && <span className="text-destructive font-semibold">✗ {results.failed.length} failed</span>}
            <span className="text-muted-foreground">of {results.total} rows</span>
          </div>
          {results.failed?.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {results.failed.map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-1 rounded mr-1">{f.row}</span>{f.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {state === "error" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
export default FileUploader;
