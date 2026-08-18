// src/modules/section/pages/SectionTransferPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Download, Upload, Search,
  CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2,
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
  ON_HOLD:"bg-orange-100 text-orange-700",
};

function ResultPanel({ result }) {
  const [showFail, setShowFail] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  if (!result) return null;
  const ok_   = result.transferred || result.assigned || [];
  const fail_ = result.failed  || [];
  const skip_ = result.skipped || [];
  const total = result.total   || (ok_.length + fail_.length + skip_.length);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase">Results</p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Transferred", value: ok_.length,   color: "green" },
          { label: "Skipped",     value: skip_.length,  color: "amber" },
          { label: "Failed",      value: fail_.length,  color: "red"   },
          { label: "Total",       value: total,          color: "gray"  },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-2 text-center`}>
            <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
            <p className={`text-[10px] text-${color}-700`}>{label}</p>
          </div>
        ))}
      </div>
      {ok_.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-0.5">
          {ok_.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle size={10} className="text-green-500 shrink-0" />
              <span className="font-mono text-muted-foreground">{r.uid}</span>
              <span className="truncate">{r.name}</span>
              <span className="ml-auto text-muted-foreground shrink-0">{r.from} → <strong>{r.to}</strong></span>
            </div>
          ))}
        </div>
      )}
      {skip_.length > 0 && (
        <div>
          <button onClick={() => setShowSkip(s => !s)} className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            {showSkip ? <ChevronUp size={11}/> : <ChevronDown size={11}/>} {skip_.length} skipped
          </button>
          {showSkip && skip_.map((r, i) => (
            <div key={i} className="flex gap-2 text-xs mt-0.5">
              <AlertCircle size={10} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="font-mono text-muted-foreground">{r.uid}</span>
              <span className="text-amber-600">{r.reason}</span>
            </div>
          ))}
        </div>
      )}
      {fail_.length > 0 && (
        <div>
          <button onClick={() => setShowFail(s => !s)} className="text-xs text-destructive hover:underline flex items-center gap-1">
            {showFail ? <ChevronUp size={11}/> : <ChevronDown size={11}/>} {fail_.length} failed
          </button>
          {showFail && fail_.map((r, i) => (
            <div key={i} className="flex gap-2 text-xs mt-0.5">
              <XCircle size={10} className="text-destructive shrink-0 mt-0.5" />
              <span className="font-mono text-muted-foreground">{r.uid || r.row}</span>
              <span className="text-destructive">{r.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SectionTransferPage() {
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef(null);

  const [mode,        setMode]        = useState("template"); // template | picker
  const [result,      setResult]      = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [acting,      setActing]      = useState(false);

  // Template filters
  const [sectionFilter, setSectionFilter] = useState(searchParams.get("section_id") || "");
  const [branchFilter,  setBranchFilter]  = useState(searchParams.get("branch_id")  || "");
  const [semFilter,     setSemFilter]     = useState(searchParams.get("semester")    || "");

  // Picker mode
  const [students,    setStudents]    = useState([]);
  const [selected,    setSelected]    = useState(new Set());
  const [toSectionId, setToSectionId] = useState("");
  const [toLabel,     setToLabel]     = useState("");
  const [reason,      setReason]      = useState("");
  const [search,      setSearch]      = useState("");
  const [statusF,     setStatusF]     = useState("ACTIVE");
  const [loading,     setLoading]     = useState(false);
  const timer = useRef(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.students.list, {
        params: {
          limit: 200,
          search:     search        || undefined,
          section_id: sectionFilter || undefined,
          branch_id:  branchFilter  || undefined,
          semester:   semFilter     || undefined,
          status:     statusF       || undefined,
        },
      });
      setStudents(r.data?.data?.students || []);
    } catch {}
    finally { setLoading(false); }
  }, [search, sectionFilter, branchFilter, semFilter, statusF]);

  useEffect(() => {
    if (mode === "picker") {
      clearTimeout(timer.current);
      timer.current = setTimeout(loadStudents, 300);
      return () => clearTimeout(timer.current);
    }
  }, [loadStudents, mode]);

  const toggle    = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = ()   => setSelected((p) => p.size === students.length ? new Set() : new Set(students.map((s) => s.id)));

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const params = {
        section_id: sectionFilter || undefined,
        branch_id:  branchFilter  || undefined,
        semester:   semFilter     || undefined,
      };
      const r = await axiosInstance.get(EP.sections.transferTemplate, { params, responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = `transfer-template-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { notify.error("Download failed"); }
    finally { setDownloading(false); }
  };

  const uploadTemplate = async (file) => {
    setUploading(true); setResult(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r  = await axiosInstance.post(EP.sections.transferUpload, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data?.data);
      const d = r.data?.data;
      notify.success(`${d?.transferred?.length || 0} transferred · ${d?.skipped?.length || 0} skipped · ${d?.failed?.length || 0} failed`);
    } catch (err) { notify.error(err); }
    finally { setUploading(false); }
  };

  const handlePickerTransfer = async () => {
    if (!selected.size) { notify.error("Select students"); return; }
    if (!toSectionId)   { notify.error("Select target section"); return; }
    setActing(true); setResult(null);
    try {
      const r = await axiosInstance.post(`${EP.students.list}/bulk-change-section`, {
        student_ids: [...selected],
        section_id:  toSectionId,
      });
      const d = r.data?.data;
      setResult({ transferred: d?.success || [], failed: d?.failed || [], total: selected.size });
      notify.success(`${d?.success?.length || 0} transferred to ${toLabel}`);
      setSelected(new Set());
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <ArrowRight size={18} className="text-primary" />
            <h1 className="text-xl font-bold">Transfer Students Between Sections</h1>
          </div>
          <p className="text-sm text-muted-foreground">Move students from one section to another.</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {[{ key:"template", label:"Via Excel Template" }, { key:"picker", label:"Via Section Picker" }].map(({ key, label }) => (
          <button key={key} onClick={() => { setMode(key); setResult(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${mode === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Template mode ──────────────────────────────────────── */}
      {mode === "template" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold">Step 1 — Filter & Download Template</p>
            <p className="text-xs text-muted-foreground">Template contains: uid | name | current_section | branch | group | target_section_code (blank — you fill this)</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Filter by Section</Label>
                <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
                  subLabelKey="branch.name" value={sectionFilter} onChange={(v) => setSectionFilter(v)} placeholder="All sections" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Filter by Branch</Label>
                <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
                  value={branchFilter} onChange={(v) => setBranchFilter(v)} placeholder="All branches" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Filter by Semester</Label>
                <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div className="text-xs font-mono bg-muted/40 rounded-lg px-4 py-3 space-y-0.5">
              <p><strong>uid*</strong> — Roll No or Enrollment No (pre-filled)</p>
              <p><strong>target_section_code*</strong> — Fill this from the Sections reference sheet</p>
              <p><strong>reason</strong> — Optional</p>
              <p className="text-muted-foreground">Other columns: info only, not read on upload</p>
            </div>

            <Button variant="outline" disabled={downloading} onClick={downloadTemplate}>
              {downloading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
              Download Template
            </Button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold">Step 2 — Upload Filled Template</p>
            <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />}
              {uploading ? "Uploading…" : "Upload Excel"}
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value=""; uploadTemplate(f); } }} />
          </div>

          <ResultPanel result={result} />
        </div>
      )}

      {/* ── Picker mode ────────────────────────────────────────── */}
      {mode === "picker" && (
        <div className="space-y-4">
          {/* Target section */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Target Section *</Label>
                <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
                  subLabelKey="branch.name" value={toSectionId}
                  onChange={(v, opt) => { setToSectionId(v); setToLabel(opt?.name || ""); }}
                  placeholder="Search target section…" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional…" />
              </div>
            </div>
          </div>

          {/* Source filters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="relative col-span-2 sm:col-span-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-9 text-xs" />
            </div>
            <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
              value={branchFilter} onChange={(v) => setBranchFilter(v)} placeholder="Branch" />
            <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
              subLabelKey="branch.name" value={sectionFilter} onChange={(v) => setSectionFilter(v)} placeholder="From section" />
            <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
              className="h-10 px-2 rounded-md border border-input bg-background text-xs">
              <option value="">All Sems</option>
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
              className="h-10 px-2 rounded-md border border-input bg-background text-xs">
              <option value="">All Status</option>
              {["ACTIVE","DETAINED","ON_HOLD"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Student list */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border">
              <input type="checkbox" className="w-3.5 h-3.5"
                checked={selected.size === students.length && students.length > 0} onChange={toggleAll} />
              <span className="text-xs text-muted-foreground">{loading ? "Loading…" : `${students.length} students`}</span>
              {selected.size > 0 && <span className="ml-auto text-xs font-medium text-primary">{selected.size} selected</span>}
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {students.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted-foreground">No students found — adjust filters</p>
              ) : students.map((s) => (
                <label key={s.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/10 ${selected.has(s.id) ? "bg-primary/5" : ""}`}>
                  <input type="checkbox" className="w-3.5 h-3.5 shrink-0" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.roll_no} · {s.section?.name} · Sem {s.section?.semester}{s.group_no ? ` · ${s.group_no}` : ""}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${STATUS_COLOR[s.status] || "bg-muted"}`}>{s.status}</span>
                </label>
              ))}
            </div>
          </div>

          {selected.size > 0 && toSectionId && (
            <Button className="w-full" disabled={acting} onClick={handlePickerTransfer}>
              {acting ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Transferring…</>
                : <><ArrowRight size={13} className="mr-1.5" />Transfer {selected.size} Students → {toLabel}</>}
            </Button>
          )}

          <ResultPanel result={result} />
        </div>
      )}
    </div>
  );
}
