// src/modules/student/pages/StudentBulkOpsPage.jsx
// Dedicated bulk operations: promote, demote, status change, section assign
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowUp, ArrowDown, Settings, GitMerge,
  Search, CheckCircle, XCircle, AlertCircle,
  Download, Upload, Loader2, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const STATUS_COLOR = {
  ACTIVE:"bg-green-100 text-green-700", DETAINED:"bg-amber-100 text-amber-700",
  ON_HOLD:"bg-orange-100 text-orange-700", PASSED:"bg-blue-100 text-blue-700",
  LEFT:"bg-red-100 text-red-700", TRANSFERRED:"bg-gray-100 text-gray-600", SUSPENDED:"bg-red-100 text-red-700",
};
const STATUSES = ["ACTIVE","DETAINED","ON_HOLD","LEFT","TRANSFERRED","SUSPENDED","PASSED"];
const TABS = [
  { key: "promote", label: "Promote / Demote", icon: ArrowUp  },
  { key: "status",  label: "Status Change",    icon: Settings },
  { key: "section", label: "Section Assign",   icon: GitMerge },
];

// ── Reusable student multi-select ─────────────────────────────
function StudentPicker({ onSelect }) {
  const [search,       setSearch]       = useState("");
  const [semFilter,    setSemFilter]    = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [sectionFilter,setSectionFilter]= useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [students,     setStudents]     = useState([]);
  const [selected,     setSelected]     = useState(new Set());
  const [loading,      setLoading]      = useState(false);
  const timer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.students.list, {
        params: {
          limit: 200,
          search:     search       || undefined,
          branch_id:  branchFilter  || undefined,
          section_id: sectionFilter || undefined,
          status:     statusFilter  || undefined,
          semester:   semFilter     || undefined,
        },
      });
      setStudents(r.data?.data?.students || []);
    } catch {}
    finally { setLoading(false); }
  }, [search, branchFilter, sectionFilter, statusFilter, semFilter]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(load, 300);
    return () => clearTimeout(timer.current);
  }, [load]);

  const toggle    = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = ()   => setSelected((p) => p.size === students.length ? new Set() : new Set(students.map((s) => s.id)));
  useEffect(() => { onSelect([...selected]); }, [selected]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="relative col-span-2 sm:col-span-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-9 text-xs" />
        </div>
        <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
          value={branchFilter} onChange={(v) => setBranchFilter(v)} placeholder="Branch" />
        <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
          subLabelKey="branch.name" extraParams={branchFilter ? { branch_id: branchFilter } : {}}
          value={sectionFilter} onChange={(v) => setSectionFilter(v)} placeholder="Section" />
        <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
          className="h-10 px-2 rounded-md border border-input bg-background text-xs">
          <option value="">All Sems</option>
          {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-2 rounded-md border border-input bg-background text-xs">
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border">
          <input type="checkbox" className="w-3.5 h-3.5"
            checked={selected.size === students.length && students.length > 0} onChange={toggleAll} />
          <span className="text-xs text-muted-foreground">{loading ? "Loading…" : `${students.length} students`}</span>
          {selected.size > 0 && <span className="ml-auto text-xs font-medium text-primary">{selected.size} selected</span>}
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border">
          {students.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">No students found</p>
          ) : students.map((s) => (
            <label key={s.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/10 ${selected.has(s.id) ? "bg-primary/5" : ""}`}>
              <input type="checkbox" className="w-3.5 h-3.5 shrink-0" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.roll_no} · {s.section?.name} · Sem {s.section?.semester}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${STATUS_COLOR[s.status] || "bg-muted"}`}>{s.status}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Result panel ──────────────────────────────────────────────
function ResultPanel({ result, labels = {} }) {
  const [showFail, setShowFail] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  if (!result) return null;
  const ok_   = result.created || result.assigned || result.promoted || result.demoted || result.updated || [];
  const fail_ = result.failed  || [];
  const skip_ = result.skipped || [];
  const total = result.total   || (ok_.length + fail_.length + skip_.length);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase">Results</p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: labels.ok   || "Updated", value: ok_.length,   color: "green" },
          { label: labels.skip || "Skipped", value: skip_.length,  color: "amber" },
          { label: labels.fail || "Failed",  value: fail_.length,  color: "red"   },
          { label: "Total",                  value: total,          color: "gray"  },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-2 text-center`}>
            <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
            <p className={`text-[10px] text-${color}-700`}>{label}</p>
          </div>
        ))}
      </div>
      {ok_.length > 0 && (
        <div className="max-h-24 overflow-y-auto space-y-0.5">
          {ok_.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle size={10} className="text-green-500 shrink-0" />
              <span className="font-mono text-muted-foreground">{r.uid || r.roll_no || r.row || r.id}</span>
              <span className="truncate">{r.name}</span>
              {(r.from || r.to) && <span className="ml-auto text-muted-foreground shrink-0">{r.from} → {r.to}</span>}
            </div>
          ))}
        </div>
      )}
      {skip_.length > 0 && (
        <div>
          <button onClick={() => setShowSkip((s) => !s)} className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            {showSkip ? <ChevronUp size={11}/> : <ChevronDown size={11}/>} {skip_.length} skipped
          </button>
          {showSkip && (
            <div className="mt-1 max-h-20 overflow-y-auto space-y-0.5">
              {skip_.map((r, i) => <div key={i} className="flex gap-2 text-xs"><AlertCircle size={10} className="text-amber-500 shrink-0 mt-0.5" /><span className="font-mono text-muted-foreground">{r.uid || r.row}</span><span className="text-amber-600">{r.reason}</span></div>)}
            </div>
          )}
        </div>
      )}
      {fail_.length > 0 && (
        <div>
          <button onClick={() => setShowFail((s) => !s)} className="text-xs text-destructive hover:underline flex items-center gap-1">
            {showFail ? <ChevronUp size={11}/> : <ChevronDown size={11}/>} {fail_.length} failed
          </button>
          {showFail && (
            <div className="mt-1 max-h-20 overflow-y-auto space-y-0.5">
              {fail_.map((r, i) => <div key={i} className="flex gap-2 text-xs"><XCircle size={10} className="text-destructive shrink-0 mt-0.5" /><span className="font-mono text-muted-foreground">{r.uid || r.row || r.id}</span><span className="text-destructive">{r.reason}</span></div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function StudentBulkOpsPage() {
  const [tab,      setTab]     = useState("promote");
  const [selected, setSelected]= useState([]);
  const [result,   setResult]  = useState(null);
  const [acting,   setActing]  = useState(false);
  const fileRef = useRef(null);

  // Promote/Demote
  const [proAction, setProAction] = useState("promote");
  const [proReason, setProReason] = useState("");

  // Status
  const [newStatus,    setNewStatus]    = useState("");
  const [statusReason, setStatusReason] = useState("");

  // Section assign
  const [uploadMode,     setUploadMode]     = useState("template");
  const [toSectionId,    setToSectionId]    = useState("");
  const [toSectionLabel, setToSectionLabel] = useState("");
  const [secReason,      setSecReason]      = useState("");
  const [secDownloading, setSecDownloading] = useState(false);
  const [secUploading,   setSecUploading]   = useState(false);

  const handlePromote = async () => {
    if (!selected.length) { notify.error("Select students first"); return; }
    setActing(true); setResult(null);
    const results = { promoted: [], demoted: [], failed: [], total: selected.length };
    for (const id of selected) {
      try {
        if (proAction === "promote") {
          await axiosInstance.post(EP.students.promote(id));
          results.promoted.push({ id });
        } else {
          await axiosInstance.post(EP.students.demote(id));
          results.demoted.push({ id });
        }
      } catch (e) { results.failed.push({ id, reason: e.response?.data?.message || e.message }); }
    }
    setResult(proAction === "promote"
      ? { promoted: results.promoted, failed: results.failed, total: results.total }
      : { demoted:  results.demoted,  failed: results.failed, total: results.total });
    notify.success(`${(results.promoted.length || results.demoted.length)} students ${proAction}d`);
    setActing(false);
  };

  const handleStatusChange = async () => {
    if (!selected.length) { notify.error("Select students first"); return; }
    if (!newStatus)        { notify.error("Select a status"); return; }
    setActing(true); setResult(null);
    const results = { created: [], failed: [], total: selected.length };
    for (const id of selected) {
      try {
        await axiosInstance.post(EP.students.status(id), { status: newStatus, reason: statusReason });
        results.created.push({ id });
      } catch (e) { results.failed.push({ id, reason: e.response?.data?.message || e.message }); }
    }
    setResult(results);
    notify.success(`${results.created.length} students → ${newStatus}`);
    setActing(false);
  };

  const handleSectionPicker = async () => {
    if (!selected.length) { notify.error("Select students first"); return; }
    if (!toSectionId)     { notify.error("Select target section"); return; }
    setActing(true); setResult(null);
    try {
      const r = await axiosInstance.post(`${EP.students.list}/bulk-change-section`, {
        student_ids: selected, section_id: toSectionId,
      });
      const d = r.data?.data;
      setResult({ assigned: d?.success || [], failed: d?.failed || [], total: selected.length });
      notify.success(`${d?.success?.length || 0} moved to ${toSectionLabel}`);
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  const downloadSectionTemplate = async () => {
    setSecDownloading(true);
    try {
      const r = await axiosInstance.get(EP.students.sectionAssignTemplate, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = `section-assign-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { notify.error("Download failed"); }
    finally { setSecDownloading(false); }
  };

  const uploadSectionTemplate = async (file) => {
    setSecUploading(true); setResult(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r  = await axiosInstance.post(EP.students.sectionAssignUpload, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(r.data?.data);
      const d = r.data?.data;
      notify.success(`${d?.assigned?.length || 0} assigned · ${d?.skipped?.length || 0} skipped · ${d?.failed?.length || 0} failed`);
    } catch (err) { notify.error(err); }
    finally { setSecUploading(false); }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold">Student Bulk Operations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Promote, change status, or reassign sections for multiple students at once.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setResult(null); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── PROMOTE / DEMOTE ─────────────────────────────────── */}
      {tab === "promote" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex gap-2">
            <Info size={13} className="shrink-0 mt-0.5" />
            Promote: next semester enrollment created. Demote: reverts one semester. Only ACTIVE students affected by promote; all by demote.
          </div>
          <div className="flex gap-2">
            {["promote","demote"].map((a) => (
              <button key={a} onClick={() => setProAction(a)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all
                  ${proAction === a
                    ? a === "promote" ? "bg-primary text-primary-foreground border-primary" : "bg-destructive text-destructive-foreground border-destructive"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
                {a === "promote" ? <ArrowUp size={13}/> : <ArrowDown size={13}/>}
                {a === "promote" ? "Promote (+1 Sem)" : "Demote (−1 Sem)"}
              </button>
            ))}
          </div>
          <StudentPicker onSelect={setSelected} />
          {selected.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">{selected.length} student{selected.length !== 1 ? "s" : ""} selected</p>
              <Textarea value={proReason} onChange={(e) => setProReason(e.target.value)} rows={2} placeholder="Reason (optional)…" />
              <Button className={`w-full ${proAction === "demote" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                disabled={acting} onClick={handlePromote}>
                {acting ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Processing…</>
                  : <>{proAction === "promote" ? <ArrowUp size={13} className="mr-1.5"/> : <ArrowDown size={13} className="mr-1.5"/>}
                    {proAction === "promote" ? "Promote" : "Demote"} {selected.length} Students</>}
              </Button>
            </div>
          )}
          <ResultPanel result={result} labels={{ ok: proAction === "promote" ? "Promoted" : "Demoted" }} />
        </div>
      )}

      {/* ── STATUS CHANGE ────────────────────────────────────── */}
      {tab === "status" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">New Status *</Label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">Select status…</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Input value={statusReason} onChange={(e) => setStatusReason(e.target.value)} placeholder="Optional…" />
              </div>
            </div>
            {["ON_HOLD","LEFT","TRANSFERRED","SUSPENDED","PASSED"].includes(newStatus) && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠ <strong>{newStatus}</strong> will block login.{newStatus === "PASSED" && " Students become alumni."}
              </p>
            )}
          </div>
          <StudentPicker onSelect={setSelected} />
          {selected.length > 0 && newStatus && (
            <Button className="w-full" disabled={acting} onClick={handleStatusChange}>
              {acting ? <><Loader2 size={13} className="mr-1.5 animate-spin"/>Updating…</>
                : <><Settings size={13} className="mr-1.5"/>Set {selected.length} Students → {newStatus}</>}
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Prefer Excel?{" "}
            <a href="/admin/students/bulk-status" className="text-primary hover:underline">Use the template-based page</a>
          </p>
          <ResultPanel result={result} />
        </div>
      )}

      {/* ── SECTION ASSIGN ───────────────────────────────────── */}
      {tab === "section" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[{ key:"template", label:"Via Excel Template" }, { key:"picker", label:"Via Section Picker" }].map(({ key, label }) => (
              <button key={key} onClick={() => { setUploadMode(key); setResult(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${uploadMode === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>

          {uploadMode === "template" && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Template Format</p>
                <div className="text-xs font-mono bg-muted/40 rounded-lg px-4 py-3 space-y-1">
                  <p><strong>uid*</strong> — Roll No or Enrollment No</p>
                  <p><strong>new_section_code*</strong> — From reference sheet</p>
                  <p><strong>reason</strong> — Optional</p>
                  <p className="text-muted-foreground">Other columns: info only, not read</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" disabled={secDownloading} onClick={downloadSectionTemplate}>
                    {secDownloading ? <Loader2 size={13} className="mr-1.5 animate-spin"/> : <Download size={13} className="mr-1.5"/>}
                    Download Template
                  </Button>
                  <Button disabled={secUploading} onClick={() => fileRef.current?.click()}>
                    {secUploading ? <Loader2 size={13} className="mr-1.5 animate-spin"/> : <Upload size={13} className="mr-1.5"/>}
                    {secUploading ? "Uploading…" : "Upload Filled Template"}
                  </Button>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value=""; uploadSectionTemplate(f); } }} />
                </div>
              </div>
              <ResultPanel result={result} labels={{ ok: "Assigned" }} />
            </div>
          )}

          {uploadMode === "picker" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Target Section *</Label>
                <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
                  subLabelKey="branch.name" value={toSectionId}
                  onChange={(v, opt) => { setToSectionId(v); setToSectionLabel(opt?.name || ""); }}
                  placeholder="Search target section…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Input value={secReason} onChange={(e) => setSecReason(e.target.value)} placeholder="Optional…" />
              </div>
              <StudentPicker onSelect={setSelected} />
              {selected.length > 0 && toSectionId && (
                <Button className="w-full" disabled={acting} onClick={handleSectionPicker}>
                  {acting ? <><Loader2 size={13} className="mr-1.5 animate-spin"/>Assigning…</>
                    : <><GitMerge size={13} className="mr-1.5"/>Move {selected.length} Students → {toSectionLabel}</>}
                </Button>
              )}
              <ResultPanel result={result} labels={{ ok: "Assigned" }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
