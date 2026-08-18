// src/modules/section/pages/SectionBulkPromotePage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowUp, ArrowDown, Search, CheckCircle, XCircle, AlertCircle,
  Loader2, ChevronDown, ChevronUp, Info, Settings, Download, Upload,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

// ── helpers ───────────────────────────────────────────────────
const SEM_COLOR = ["", "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-green-100 text-green-700", "bg-amber-100 text-amber-700", "bg-orange-100 text-orange-700", "bg-pink-100 text-pink-700", "bg-teal-100 text-teal-700", "bg-rose-100 text-rose-700"];
const sessionChanges = (sem, action) => action === "promote" ? sem % 2 === 0 : sem % 2 === 1;
const nextSession = (label) => { const m = label?.match(/^(\d{4})-(\d{2,4})$/); if (!m) return label; return `${+m[1] + 1}-${String(+m[1] + 2).slice(-2)}`; };
const prevSession = (label) => { const m = label?.match(/^(\d{4})-(\d{2,4})$/); if (!m) return label; return `${+m[1] - 1}-${String(+m[1]).slice(-2)}`; };

const STATUSES = ["ACTIVE", "DETAINED", "ON_HOLD", "LEFT", "TRANSFERRED", "SUSPENDED", "PASSED"];
const STATUS_WARN = { ON_HOLD: "Login will be blocked.", LEFT: "Login will be blocked.", TRANSFERRED: "Login will be blocked.", SUSPENDED: "Login will be blocked.", PASSED: "Students become alumni. Login blocked." };

// ── Shared result panel ───────────────────────────────────────
function ResultPanel({ result, labels = {} }) {
  const [showFail, setShowFail] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [showOk, setShowOk] = useState(false);
  if (!result) return null;

  const ok_ = result.sections?.promoted || result.sections?.demoted || result.created || result.updated || [];
  const fail_ = result.sections?.failed || result.failed || [];
  const skip_ = result.sections?.skipped || result.skipped || [];
  const stuUp = result.students?.promoted || result.students?.demoted || 0;
  const total = result.total_sections || result.total || (ok_.length + fail_.length + skip_.length);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold">Results</p>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: labels.ok || "Updated", value: ok_.length, color: "green" },
          { label: labels.skip || "Skipped", value: skip_.length, color: "amber" },
          { label: labels.fail || "Failed", value: fail_.length, color: "red" },
          { label: stuUp > 0 ? "Students" : "Total", value: stuUp > 0 ? stuUp : total, color: "blue" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold text-${color}-600`}>{value ?? 0}</p>
            <p className={`text-xs text-${color}-700`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Detained skipped note */}
      {result.students?.skipped > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {result.students.skipped} DETAINED student{result.students.skipped !== 1 ? "s" : ""} skipped (remain at current semester)
        </p>
      )}

      {/* Success rows */}
      {ok_.length > 0 && (
        <div>
          <button onClick={() => setShowOk(v => !v)} className="text-xs font-medium text-green-700 hover:underline flex items-center gap-1">
            {showOk ? <ChevronUp size={11} /> : <ChevronDown size={11} />} ✓ {ok_.length} {labels.ok || "updated"}
          </button>
          {showOk && (
            <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
              {ok_.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={11} className="text-green-500 shrink-0" />
                  <span className="font-medium">{s.name || s.uid || s.id}</span>
                  {s.from_sem && <span>Sem {s.from_sem} → {s.to_sem}</span>}
                  {s.session_changed && <span className="text-primary font-medium">{s.from_session} → {s.to_session}</span>}
                  {s.from && <span>{s.from} → <strong>{s.to}</strong></span>}
                  <span className="ml-auto">{s.students_promoted || s.students_demoted ? `${s.students_promoted || s.students_demoted} students` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {skip_.length > 0 && (
        <div>
          <button onClick={() => setShowSkip(v => !v)} className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            {showSkip ? <ChevronUp size={11} /> : <ChevronDown size={11} />} ⚠ {skip_.length} skipped
          </button>
          {showSkip && (
            <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {skip_.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <AlertCircle size={11} className="text-amber-500 shrink-0" />
                  <span className="text-muted-foreground">{s.name || s.uid || s.id}</span>
                  <span className="ml-auto text-amber-600">{s.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {fail_.length > 0 && (
        <div>
          <button onClick={() => setShowFail(v => !v)} className="text-xs text-destructive hover:underline flex items-center gap-1">
            {showFail ? <ChevronUp size={11} /> : <ChevronDown size={11} />} ✗ {fail_.length} failed
          </button>
          {showFail && (
            <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {fail_.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <XCircle size={11} className="text-destructive shrink-0" />
                  <span className="text-muted-foreground">{s.name || s.uid || s.id}</span>
                  <span className="ml-auto text-destructive">{s.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section selector (shared between promote/demote tabs) ──────
function SectionSelector({ selected, setSelected, search, setSearch, branchFilter, setBranchFilter, semFilter, setSemFilter, action, statusFilter = "ACTIVE", setStatusFilter }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.sections.list, {
        params: {
          limit: 200,
          status: statusFilter || "ACTIVE",
          branch_id: branchFilter || undefined,
          semester: semFilter || undefined,
          search: search || undefined,
        },
      });
      setSections(r.data?.data?.sections || []);
    } catch { notify.error("Failed to load sections"); }
    finally { setLoading(false); }
  }, [branchFilter, semFilter, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleAll = () => {
    if (selected.size === sections.length) setSelected(new Set());
    else setSelected(new Set(sections.map((s) => s.id)));
  };
  const toggle = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections…" className="pl-9 h-9" />
        </div>
        <div className="w-52">
          <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
            subLabelKey="program.name" value={branchFilter} onChange={(v) => setBranchFilter(v)} placeholder="All branches" />
        </div>
        <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        {setStatusFilter && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="ACTIVE">Active only</option>
            <option value="">All sections</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        )}
      </div>

      {/* Section list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <input type="checkbox" className="w-4 h-4"
            checked={selected.size === sections.length && sections.length > 0} onChange={toggleAll} />
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {loading ? "Loading…" : `${sections.length} sections`}
          </span>
          {selected.size > 0 && <span className="ml-auto text-xs font-medium text-primary">{selected.size} selected</span>}
        </div>
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : sections.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No active sections found</div>
          ) : sections.map((s) => {
            const isSelected = selected.has(s.id);
            const willChange = isSelected && action && sessionChanges(s.semester, action);
            const newSem = action === "promote" ? s.semester + 1 : action === "demote" ? s.semester - 1 : null;
            const newSession = willChange
              ? (action === "promote" ? nextSession(s.academic_year) : prevSession(s.academic_year))
              : s.academic_year;

            return (
              <label key={s.id} className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                <input type="checkbox" className="w-4 h-4 shrink-0" checked={isSelected} onChange={() => toggle(s.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{s.name}</p>
                    <span className="text-xs font-mono text-muted-foreground">{s.code}</span>
                    {s.is_combined && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Combined</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.branch?.name} · {s.branch?.program?.name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${SEM_COLOR[s.semester] || "bg-muted"}`}>Sem {s.semester}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.academic_year || "—"}</p>
                  </div>
                  {isSelected && newSem !== null && (
                    <>
                      <span className="text-muted-foreground text-xs">{action === "promote" ? "→" : "←"}</span>
                      <div className="text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${newSem >= 1 && newSem <= 8 ? SEM_COLOR[newSem] || "bg-muted" : "bg-red-100 text-red-700"}`}>
                          Sem {newSem}
                        </span>
                        <p className={`text-[10px] mt-0.5 ${willChange ? "text-primary font-medium" : "text-muted-foreground"}`}>
                          {newSession || "—"}{willChange ? " ✦" : ""}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-medium">{s._count?.students || 0}</p>
                    <p className="text-[10px] text-muted-foreground">students</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function SectionBulkPromotePage() {
  const [tab, setTab] = useState("promote"); // promote | demote | status

  // Shared section filter state
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");

  // Promote/Demote
  const [proSelected, setProSelected] = useState(new Set());
  const [proReason, setProReason] = useState("");
  const [proActing, setProActing] = useState(false);
  const [proResult, setProResult] = useState(null);

  // Status change
  const [statSelected, setStatSelected] = useState(new Set());
  const [newStatus, setNewStatus] = useState("");
  const [statReason, setStatReason] = useState("");
  const [statActing, setStatActing] = useState(false);
  const [statResult, setStatResult] = useState(null);
  const [statMode, setStatMode] = useState("picker"); // picker | template
  const statFileRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [secStatusFilter, setSecStatusFilter] = useState("ACTIVE");
  const resetFilters = () => { setSearch(""); setBranchFilter(""); setSemFilter(""); setSecStatusFilter("ACTIVE"); };

  // ── Promote / Demote ─────────────────────────────────────────
  const submitPromote = async (action) => {
    if (!proSelected.size) { notify.error("Select at least one section"); return; }
    setProActing(true); setProResult(null);
    try {
      const url = action === "promote" ? EP.sections.bulkPromote : EP.sections.bulkDemote;
      const r = await axiosInstance.post(url, { section_ids: [...proSelected], reason: proReason || undefined });
      setProResult(r.data?.data);
      const d = r.data?.data;
      const cnt = d?.sections?.promoted?.length || d?.sections?.demoted?.length || 0;
      notify.success(`${cnt} section${cnt !== 1 ? "s" : ""} ${action}d`);
      setProSelected(new Set());
    } catch (err) { notify.error(err); }
    finally { setProActing(false); }
  };

  // ── Status — picker ───────────────────────────────────────────
  const submitStatusPicker = async () => {
    if (!statSelected.size) { notify.error("Select sections"); return; }
    if (!newStatus) { notify.error("Select a status"); return; }
    setStatActing(true); setStatResult(null);

    const results = { created: [], failed: [], skipped: [], total: 0 };

    // For each selected section, fetch ALL ACTIVE students
    for (const section_id of [...statSelected]) {
      try {
        const sr = await axiosInstance.get(EP.students.list, {
          params: { section_id, status: "ACTIVE", limit: 2000 },
        });
        const students = sr.data?.data?.students || [];
        results.total += students.length;

        for (const s of students) {
          if (s.status === newStatus) {
            results.skipped.push({ id: s.id, name: s.name, reason: `Already ${newStatus}` });
            continue;
          }
          try {
            await axiosInstance.post(EP.students.status(s.id), {
              status: newStatus,
              reason: statReason || undefined,
            });
            results.created.push({ id: s.id, name: s.name, from: s.status, to: newStatus });
          } catch (e) {
            results.failed.push({ id: s.id, name: s.name, reason: e.response?.data?.message || e.message });
          }
        }
      } catch (e) {
        results.failed.push({ id: section_id, reason: `Failed to fetch students: ${e.message}` });
      }
    }

    // Update section status based on new student status
    const SECTION_STATUS_MAP = {
      PASSED: "COMPLETED", ACTIVE: "ACTIVE", DETAINED: "ACTIVE",
      ON_HOLD: "ACTIVE", LEFT: "ACTIVE", TRANSFERRED: "ACTIVE", SUSPENDED: "ACTIVE",
    };
    const newSectionStatus = SECTION_STATUS_MAP[newStatus];
    for (const section_id of [...statSelected]) {
      try {
        await axiosInstance.patch(EP.sections.update(section_id), { status: newSectionStatus });
      } catch (e) { console.warn("Section status update:", e.message); }
    }

    setStatResult(results);
    notify.success(`${results.created.length} students updated · ${[...statSelected].length} sections → ${newSectionStatus}`);
    setStatSelected(new Set());
    setStatActing(false);
  };

  // ── Status — template ─────────────────────────────────────────
  const downloadStatusTemplate = async () => {
    setDownloading(true);
    try {
      const params = {};
      if (statSelected.size > 0) params.section_ids = [...statSelected].join(",");
      if (semFilter) params.semester = semFilter;
      if (branchFilter) params.branch_id = branchFilter;
      const r = await axiosInstance.get(EP.sections.studentStatusTemplate, { params, responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(r.data);
      a.download = `student-status-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
      URL.revokeObjectURL(a.href);
    } catch { notify.error("Download failed"); }
    finally { setDownloading(false); }
  };

  const uploadStatusTemplate = async (file) => {
    setUploading(true); setStatResult(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      if (newStatus) fd.append("global_status", newStatus);
      const r = await axiosInstance.post(EP.sections.studentStatusUpload, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setStatResult(r.data?.data);
      const d = r.data?.data;
      notify.success(`${d?.created?.length || 0} updated · ${d?.skipped?.length || 0} skipped · ${d?.failed?.length || 0} failed`);
    } catch (err) { notify.error(err); }
    finally { setUploading(false); }
  };

  const TABS = [
    { key: "promote", label: "Promote", icon: ArrowUp },
    { key: "demote", label: "Demote", icon: ArrowDown },
    { key: "status", label: "Student Status", icon: Settings },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Section Bulk Operations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Promote, demote, or bulk-change student status for multiple sections at once.</p>
      </div>

      {/* Session logic info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex gap-2">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>Session logic: Sem 1→2 same session · Sem 2→3 new session auto-created · Only ACTIVE students promoted · DETAINED stay in current sem</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); resetFilters(); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── PROMOTE ──────────────────────────────────────────── */}
      {tab === "promote" && (
        <div className="space-y-4">
          <SectionSelector selected={proSelected} setSelected={setProSelected}
            search={search} setSearch={setSearch}
            branchFilter={branchFilter} setBranchFilter={setBranchFilter}
            semFilter={semFilter} setSemFilter={setSemFilter}
            action="promote" statusFilter={secStatusFilter} setStatusFilter={setSecStatusFilter} />

          {proSelected.size > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">{proSelected.size} section{proSelected.size !== 1 ? "s" : ""} selected</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea value={proReason} onChange={(e) => setProReason(e.target.value)} rows={2} placeholder="Reason for promote…" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setProSelected(new Set())}>Clear</Button>
                <Button className="flex-1" disabled={proActing} onClick={() => submitPromote("promote")}>
                  {proActing ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Processing…</>
                    : <><ArrowUp size={13} className="mr-1.5" />Promote {proSelected.size} Section{proSelected.size !== 1 ? "s" : ""}</>}
                </Button>
              </div>
            </div>
          )}
          <ResultPanel result={proResult} labels={{ ok: "Sections Promoted" }} />
        </div>
      )}

      {/* ── DEMOTE ───────────────────────────────────────────── */}
      {tab === "demote" && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            ⚠ Demotion moves ALL students (ACTIVE + DETAINED) in selected sections back one semester.
          </div>
          <SectionSelector selected={proSelected} setSelected={setProSelected}
            search={search} setSearch={setSearch}
            branchFilter={branchFilter} setBranchFilter={setBranchFilter}
            semFilter={semFilter} setSemFilter={setSemFilter}
            action="demote" statusFilter={secStatusFilter} setStatusFilter={setSecStatusFilter} />

          {proSelected.size > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">{proSelected.size} section{proSelected.size !== 1 ? "s" : ""} selected</p>
              <Textarea value={proReason} onChange={(e) => setProReason(e.target.value)} rows={2} placeholder="Reason for demote…" />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setProSelected(new Set())}>Clear</Button>
                <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={proActing}
                  onClick={() => submitPromote("demote")}>
                  {proActing ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Processing…</>
                    : <><ArrowDown size={13} className="mr-1.5" />Demote {proSelected.size} Section{proSelected.size !== 1 ? "s" : ""}</>}
                </Button>
              </div>
            </div>
          )}
          <ResultPanel result={proResult} labels={{ ok: "Sections Demoted" }} />
        </div>
      )}

      {/* ── STUDENT STATUS ────────────────────────────────────── */}
      {tab === "status" && (
        <div className="space-y-4">

          {/* Status selector + mode */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">New Status *</Label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">Select status…</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {newStatus && STATUS_WARN[newStatus] && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">⚠ {STATUS_WARN[newStatus]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Input value={statReason} onChange={(e) => setStatReason(e.target.value)} placeholder="Optional…" />
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              {[{ key: "picker", label: "Pick Sections" }, { key: "template", label: "Via Template" }].map(({ key, label }) => (
                <button key={key} onClick={() => setStatMode(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statMode === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Picker mode — select sections, apply status to all their ACTIVE students */}
          {statMode === "picker" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Select sections → all ACTIVE students in those sections will get the new status.</p>
              <SectionSelector selected={statSelected} setSelected={setStatSelected}
                search={search} setSearch={setSearch}
                branchFilter={branchFilter} setBranchFilter={setBranchFilter}
                semFilter={semFilter} setSemFilter={setSemFilter}
                action={null} statusFilter={secStatusFilter} setStatusFilter={setSecStatusFilter} />

              {statSelected.size > 0 && newStatus && (
                <Button className="w-full" disabled={statActing} onClick={submitStatusPicker}>
                  {statActing
                    ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Updating…</>
                    : <><Settings size={13} className="mr-1.5" />Set all ACTIVE students in {statSelected.size} section{statSelected.size !== 1 ? "s" : ""} → {newStatus}</>}
                </Button>
              )}
              {(!newStatus && statSelected.size > 0) && (
                <p className="text-xs text-center text-amber-600">Select a status above first</p>
              )}
            </div>
          )}

          {/* Template mode */}
          {statMode === "template" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Download template (optionally filter by section/sem/branch first) → fill new_status per student → upload.
                If a status is selected above, it overrides all rows in the upload.
              </p>

              {/* Optional section filter for template */}
              <SectionSelector selected={statSelected} setSelected={setStatSelected}
                search={search} setSearch={setSearch}
                branchFilter={branchFilter} setBranchFilter={setBranchFilter}
                semFilter={semFilter} setSemFilter={setSemFilter}
                action={null} statusFilter={secStatusFilter} setStatusFilter={setSecStatusFilter} />

              <div className="flex gap-3">
                <Button variant="outline" disabled={downloading} onClick={downloadStatusTemplate}>
                  {downloading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
                  Download Template {statSelected.size > 0 ? `(${statSelected.size} sections)` : "(all)"}
                </Button>
                <Button disabled={uploading} onClick={() => statFileRef.current?.click()}>
                  {uploading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />}
                  {uploading ? "Uploading…" : "Upload Filled Template"}
                </Button>
                <input ref={statFileRef} type="file" accept=".xlsx,.xls" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ""; uploadStatusTemplate(f); } }} />
              </div>

              <div className="text-xs font-mono bg-muted/40 rounded-lg px-4 py-3 space-y-0.5">
                <p><strong>uid*</strong> — Roll No or Enrollment No (pre-filled)</p>
                <p><strong>new_status*</strong> — Fill: ACTIVE | DETAINED | ON_HOLD | LEFT | TRANSFERRED | SUSPENDED | PASSED</p>
                <p><strong>reason</strong> — Optional per-row reason</p>
                <p className="text-muted-foreground">Other columns are info-only</p>
              </div>
            </div>
          )}

          <ResultPanel result={statResult} labels={{ ok: "Students Updated" }} />
        </div>
      )}
    </div>
  );
}