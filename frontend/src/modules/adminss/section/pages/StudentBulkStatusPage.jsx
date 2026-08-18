// src/modules/student/pages/StudentBulkStatusPage.jsx
import { useState, useRef } from "react";
import { Download, Upload, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, Users } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Label }  from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const STATUSES = ["ACTIVE","DETAINED","ON_HOLD","LEFT","TRANSFERRED","SUSPENDED","PASSED"];
const STATUS_META = {
  ACTIVE:      { color: "green",  desc: "Normal active student"              },
  DETAINED:    { color: "amber",  desc: "Detained — stays in current sem"    },
  ON_HOLD:     { color: "orange", desc: "On hold — login blocked"            },
  LEFT:        { color: "red",    desc: "Left college — login blocked"       },
  TRANSFERRED: { color: "gray",   desc: "Transferred — login blocked"        },
  SUSPENDED:   { color: "red",    desc: "Suspended — login blocked"          },
  PASSED:      { color: "blue",   desc: "Graduated — becomes alumni"         },
};

export default function StudentBulkStatusPage() {
  const fileRef      = useRef(null);
  const [sectionFilter, setSectionFilter]   = useState("");
  const [branchFilter,  setBranchFilter]    = useState("");
  const [globalStatus,  setGlobalStatus]    = useState("");
  const [downloading,   setDownloading]     = useState(false);
  const [uploading,     setUploading]       = useState(false);
  const [result,        setResult]          = useState(null);
  const [showFail,      setShowFail]        = useState(false);
  const [showSkip,      setShowSkip]        = useState(false);

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const params = {};
      if (sectionFilter) params.section_id = sectionFilter;
      if (branchFilter)  params.branch_id  = branchFilter;
      const r = await axiosInstance.get(
        `${EP.sections.list.replace("/sections","")}/sections/student-status-template`,
        { params, responseType: "blob" }
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = `student-status-template-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { notify.error("Download failed"); }
    finally { setDownloading(false); }
  };

  const upload = async (file) => {
    setUploading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (globalStatus) fd.append("global_status", globalStatus);
      const r = await axiosInstance.post(
        `${EP.sections.list.replace("/sections","")}/sections/student-status-upload`,
        fd, { headers: { "Content-Type": "multipart/form-data" } }
      );
      const d = r.data?.data;
      setResult(d);
      notify.success(`${d.created?.length || 0} updated · ${d.skipped?.length || 0} skipped · ${d.failed?.length || 0} failed`);
    } catch (err) { notify.error(err); }
    finally { setUploading(false); }
  };

  const created = result?.created?.length || 0;
  const failed  = result?.failed?.length  || 0;
  const skipped = result?.skipped?.length || 0;
  const total   = result?.total           || 0;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Bulk Student Status Change</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Download template, fill statuses, upload to apply changes.</p>
      </div>

      {/* Step 1 — Filter + Download */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <p className="font-medium text-sm">Download Template</p>
        </div>
        <p className="text-xs text-muted-foreground pl-8">Filter to get a specific section's students, or download all students at once.</p>

        <div className="pl-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Filter by Section <span className="text-muted-foreground">(optional)</span></Label>
              <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
                subLabelKey="branch.name" value={sectionFilter}
                onChange={(v) => setSectionFilter(v)} placeholder="All sections" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Filter by Branch <span className="text-muted-foreground">(optional)</span></Label>
              <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
                value={branchFilter} onChange={(v) => setBranchFilter(v)} placeholder="All branches" />
            </div>
          </div>
          <Button variant="outline" disabled={downloading} onClick={downloadTemplate}>
            {downloading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
            Download Template
          </Button>
        </div>

        <div className="pl-8 pt-1 space-y-1">
          <p className="text-xs text-muted-foreground">Template columns:</p>
          <div className="text-xs font-mono bg-muted/40 rounded-lg px-3 py-2 space-y-0.5">
            <p><strong>uid*</strong> — Roll No or Enrollment No (required)</p>
            <p><strong>new_status*</strong> — Fill this: ACTIVE | DETAINED | ON_HOLD | LEFT | TRANSFERRED | SUSPENDED | PASSED</p>
            <p><strong>reason</strong> — Optional reason</p>
            <p className="text-muted-foreground">student_name, email, current_status, section — info only, not read on upload</p>
          </div>
        </div>
      </div>

      {/* Step 2 — Choose global status (optional) */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</span>
          <p className="font-medium text-sm">Apply Status from UI <span className="text-xs text-muted-foreground font-normal">(optional override)</span></p>
        </div>
        <p className="text-xs text-muted-foreground pl-8">
          Set a status here to apply it to <strong>all rows</strong> in the uploaded file, ignoring the new_status column. Leave blank to use each row's own new_status value.
        </p>
        <div className="pl-8">
          <select value={globalStatus} onChange={(e) => setGlobalStatus(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm w-64">
            <option value="">Use each row's own status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {globalStatus && (
            <div className={`mt-2 text-xs px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700`}>
              ⚠ All students in uploaded file will be set to <strong>{globalStatus}</strong> regardless of what's in the file.
              {["ON_HOLD","LEFT","TRANSFERRED","SUSPENDED","PASSED"].includes(globalStatus) && " Login will be blocked."}
              {globalStatus === "PASSED" && " Students will become alumni."}
            </div>
          )}
        </div>

        {/* Status reference */}
        <div className="pl-8">
          <p className="text-xs text-muted-foreground mb-2">Status reference:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUSES.map((s) => (
              <div key={s} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  STATUS_META[s].color === "green"  ? "bg-green-500"  :
                  STATUS_META[s].color === "amber"  ? "bg-amber-500"  :
                  STATUS_META[s].color === "orange" ? "bg-orange-500" :
                  STATUS_META[s].color === "red"    ? "bg-red-500"    :
                  STATUS_META[s].color === "blue"   ? "bg-blue-500"   : "bg-gray-400"
                }`} />
                <span><strong>{s}</strong> — {STATUS_META[s].desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3 — Upload */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">3</span>
          <p className="font-medium text-sm">Upload Filled Template</p>
        </div>
        <div className="pl-8">
          <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />}
            {uploading ? "Uploading…" : "Upload Excel"}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ""; upload(f); } }} />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold">Upload Results</p>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Rows",  value: total,   color: "gray"  },
              { label: "Updated",     value: created, color: "green" },
              { label: "Skipped",     value: skipped, color: "amber" },
              { label: "Failed",      value: failed,  color: "red"   },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-3 text-center bg-${color}-50 border border-${color}-200`}>
                <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                <p className={`text-xs text-${color}-700`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              {created > 0 && <div className="bg-green-500 h-full transition-all" style={{ width: `${(created/total)*100}%` }} />}
              {skipped > 0 && <div className="bg-amber-400 h-full transition-all" style={{ width: `${(skipped/total)*100}%` }} />}
              {failed  > 0 && <div className="bg-red-500 h-full transition-all"   style={{ width: `${(failed/total)*100}%`  }} />}
            </div>
          )}

          {/* Created list */}
          {created > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">Updated ({created}):</p>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {result.created.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle size={11} className="text-green-500 shrink-0" />
                    <span className="font-mono text-muted-foreground">{r.uid}</span>
                    <span>{r.name}</span>
                    <span className="ml-auto text-muted-foreground">{r.from} → <strong>{r.to}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skipped */}
          {skipped > 0 && (
            <div>
              <button onClick={() => setShowSkip(s => !s)} className="flex items-center gap-1.5 text-xs text-amber-700 font-medium hover:underline">
                {showSkip ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Skipped ({skipped})
              </button>
              {showSkip && (
                <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5">
                  {result.skipped.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <AlertCircle size={11} className="text-amber-500 shrink-0" />
                      <span className="font-mono text-muted-foreground">{r.uid}</span>
                      <span className="text-amber-600">{r.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Failed */}
          {failed > 0 && (
            <div>
              <button onClick={() => setShowFail(s => !s)} className="flex items-center gap-1.5 text-xs text-destructive font-medium hover:underline">
                {showFail ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Failed ({failed})
              </button>
              {showFail && (
                <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5">
                  {result.failed.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <XCircle size={11} className="text-destructive shrink-0" />
                      <span className="font-mono text-muted-foreground">{r.uid || r.row}</span>
                      <span className="text-destructive">{r.reason}</span>
                    </div>
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
