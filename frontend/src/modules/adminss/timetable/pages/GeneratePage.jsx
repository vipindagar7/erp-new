// src/modules/adminss/timetable/pages/GeneratePage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, CheckCircle, AlertCircle, Loader2, Printer,
  ChevronDown, ChevronUp, Users, Settings, RotateCcw,
  Calendar, Clock, Building2,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const DAYS_ALL = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABEL = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };
const inp = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

// ─────────────────────────────────────────────────────────────
// PRINT MODAL — all timetables
// ─────────────────────────────────────────────────────────────
function PrintModal({ sections, onClose, settings }) {
  const printRef = useRef();
  const DAYS = settings?.working_days || ["MON", "TUE", "WED", "THU", "FRI"];

  const doPrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Timetables — EIT Faridabad</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9px; }
  .page { padding: 8mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .institute { text-align:center; font-size:13px; font-weight:900; margin-bottom:2px; }
  .subtitle { text-align:center; font-size:10px; font-weight:700; color:#333; margin-bottom:1px; }
  .meta { text-align:center; font-size:8px; color:#666; margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; }
  th,td { border:1px solid #94a3b8; padding:3px 5px; vertical-align:middle; }
  th { background:#f1f5f9; font-weight:700; text-align:center; font-size:8px; }
  .pcol { text-align:left; min-width:70px; }
  .pname { font-weight:700; font-size:9px; }
  .ptime { color:#888; font-size:7px; }
  .lec  { background:#dbeafe; }
  .lab  { background:#dcfce7; }
  .tut  { background:#f3e8ff; }
  .brk  { background:#fef9c3; color:#92400e; text-align:center; font-size:8px; }
  .code { font-weight:700; font-size:9px; }
  .fac  { font-size:8px; color:#475569; margin-top:1px; }
  .room { font-size:7px; color:#94a3b8; }
  .legend { display:flex; gap:12px; margin-top:4px; font-size:7px; justify-content:flex-end; }
  .leg-item { display:flex; align-items:center; gap:3px; }
  .leg-box { width:10px; height:10px; border:1px solid #94a3b8; }
  @media print {
    @page { size:A4 landscape; margin:0; }
    body { padding:0; }
    .page { padding:6mm; }
  }
</style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col" style={{ maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-lg">All Timetables Preview</h2>
            <p className="text-xs text-muted-foreground">{sections.length} sections — A4 Landscape format</p>
          </div>
          <div className="flex gap-2">
            <button onClick={doPrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
              <Printer size={14} />Print All / Save PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">Close</button>
          </div>
        </div>

        <div ref={printRef} className="overflow-y-auto flex-1">
          {sections.map((sec, si) => {
            const periods = sec.periods || [];
            const entries = sec.tt?.entries || [];
            const grid = {};
            DAYS.forEach(d => { grid[d] = {}; });
            entries.forEach(e => { if (grid[e.day]) grid[e.day][e.period_config_id] = e; });

            return (
              <div key={sec.section_id} className="page p-6">
                {/* Header */}
                <div className="institute">ECHELON INSTITUTE OF TECHNOLOGY, FARIDABAD</div>
                <div className="subtitle">Class Timetable</div>
                <div className="meta">
                  Section: <strong>{sec.section_name}</strong> &nbsp;|&nbsp;
                  Semester: <strong>{sec.semester}</strong> &nbsp;|&nbsp;
                  Batch: <strong>{sec.batch}</strong> &nbsp;|&nbsp;
                  Branch: <strong>{sec.branch}</strong>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th className="pcol" style={{ textAlign: "left" }}>Period / Time</th>
                      {DAYS.map(d => <th key={d}>{DAY_LABEL[d]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(p => {
                      const isBreak = ["BREAK", "LUNCH", "ASSEMBLY"].includes(p.type);
                      if (isBreak) return (
                        <tr key={p.id}>
                          <td className="pcol brk">
                            <span className="pname">{p.name}</span>
                            <span className="ptime"> ({p.start_time}–{p.end_time})</span>
                          </td>
                          {DAYS.map(d => <td key={d} className="brk">{p.name}</td>)}
                        </tr>
                      );
                      return (
                        <tr key={p.id}>
                          <td className="pcol">
                            <div className="pname">{p.name}</div>
                            <div className="ptime">{p.start_time}–{p.end_time}</div>
                          </td>
                          {DAYS.map(d => {
                            const e = grid[d]?.[p.id];
                            const cls = !e ? "" : e.entry_type === "LAB" ? "lab" : e.entry_type === "TUTORIAL" ? "tut" : "lec";
                            return (
                              <td key={d} className={cls} style={{ minWidth: 80 }}>
                                {e ? (
                                  <>
                                    <div className="code">{e.subject?.code || e.subject?.name}</div>
                                    {e.faculty && <div className="fac">{e.faculty.name?.split(" ").slice(-1)[0]}</div>}
                                    {e.room && <div className="room">{e.room.name}</div>}
                                    {e.entry_type === "LAB" && e.span_periods > 1 && <div className="room">Lab×{e.span_periods}</div>}
                                  </>
                                ) : <span style={{ color: "#e2e8f0" }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Legend */}
                <div className="legend">
                  {[["Lecture", "#dbeafe"], ["Lab", "#dcfce7"], ["Tutorial", "#f3e8ff"]].map(([l, c]) => (
                    <div key={l} className="leg-item">
                      <div className="leg-box" style={{ background: c }} />
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION RESULT CARD
// ─────────────────────────────────────────────────────────────
function SectionCard({ s }) {
  const [open, setOpen] = useState(false);
  const hasIssues = s.issues?.length > 0;
  return (
    <div className={`rounded-xl border p-3 ${hasIssues ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => hasIssues && setOpen(v => !v)}>
        {hasIssues
          ? <AlertCircle size={13} className="text-amber-500 shrink-0" />
          : <CheckCircle size={13} className="text-green-500 shrink-0" />
        }
        <p className="text-sm font-medium flex-1 truncate">{s.section_name}</p>
        <span className="text-xs text-muted-foreground shrink-0">{s.assigned} slots placed</span>
        {hasIssues && <span className="text-xs text-amber-600 shrink-0">{s.issues.length} issues</span>}
        {hasIssues && (open ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </div>
      {open && hasIssues && (
        <div className="mt-2 pl-5 space-y-0.5 border-t border-amber-200 pt-2">
          {s.issues.map((f, i) => (
            <p key={i} className="text-xs text-amber-700">
              <strong>{f.subject || f.subject_name || "Subject"}</strong>
              {f.needed != null && <span className="text-amber-500 ml-1">— needed {f.needed}, got {f.got || 0}</span>}
              {f.reason && <span className="text-amber-400 ml-1">({f.reason})</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTINGS PANEL
// ─────────────────────────────────────────────────────────────
function SettingsPanel({ config, onChange }) {
  const toggle = (day) => {
    const days = config.working_days.includes(day)
      ? config.working_days.filter(d => d !== day)
      : [...config.working_days, day];
    onChange({ ...config, working_days: days });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold flex items-center gap-2"><Settings size={14} />Generation Settings</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Theory periods/week</label>
          <input type="number" min={1} max={8} value={config.theory_periods_per_week}
            onChange={e => onChange({ ...config, theory_periods_per_week: parseInt(e.target.value) || 4 })}
            className={inp} />
          <p className="text-[10px] text-muted-foreground">How many slots per week for theory subjects</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Lab periods/week</label>
          <input type="number" min={1} max={6} value={config.lab_periods_per_week}
            onChange={e => onChange({ ...config, lab_periods_per_week: parseInt(e.target.value) || 2 })}
            className={inp} />
          <p className="text-[10px] text-muted-foreground">Lab = 2 consecutive slots counted as 1 session</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Max periods/day</label>
          <input type="number" min={4} max={12} value={config.max_periods_per_day}
            onChange={e => onChange({ ...config, max_periods_per_day: parseInt(e.target.value) || 8 })}
            className={inp} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Working Days</label>
        <div className="flex gap-2">
          {DAYS_ALL.map(d => (
            <button key={d} onClick={() => toggle(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${config.working_days.includes(d)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
                }`}>
              {d.slice(0, 2)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={config.lab_consecutive}
            onChange={e => onChange({ ...config, lab_consecutive: e.target.checked })}
            className="w-4 h-4 mt-0.5 accent-primary" />
          <div>
            <p className="text-xs font-medium">Lab consecutive slots</p>
            <p className="text-[10px] text-muted-foreground">Place lab in 2 back-to-back periods</p>
          </div>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={config.allow_combined_sections}
            onChange={e => onChange({ ...config, allow_combined_sections: e.target.checked })}
            className="w-4 h-4 mt-0.5 accent-primary" />
          <div>
            <p className="text-xs font-medium">Allow combined sections</p>
            <p className="text-[10px] text-muted-foreground">Same faculty+subject across sections</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  theory_periods_per_week: 4,
  lab_periods_per_week: 2,
  lab_consecutive: true,
  max_periods_per_day: 8,
  working_days: ["MON", "TUE", "WED", "THU", "FRI"],
  allow_combined_sections: false,
};


// ── Template Upload Tab ────────────────────────────────────────
function TemplateTab({ sectionId, sessionId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const downloadTemplate = async () => {
    try {
      const res = await axiosInstance.get(
        `/api/timetable/template/${sectionId}?session_id=${sessionId}`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = "timetable_template.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch { notify.error("Failed to download template"); }
  };

  const upload = async () => {
    if (!file) return notify.error("Select an Excel file");
    setUploading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("session_id", sessionId);
      const res = await axiosInstance.post(
        `/api/timetable/template/${sectionId}/upload`, fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(res.data?.data);
      notify.success(`Done — ${res.data?.data?.created || 0} entries created`);
    } catch (e) { notify.error(e.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-semibold">How to use template:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-xs">
          <li>Download the template below (pre-filled with periods and days)</li>
          <li>Fill Subject, Faculty (EmpID), Room, Type columns</li>
          <li>Leave blank for free/lunch periods</li>
          <li>Upload the filled template</li>
        </ol>
      </div>

      <button onClick={downloadTemplate}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">
        <Download size={14} />Download Template (.xlsx)
      </button>

      <div onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${file ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
        <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{file ? file.name : "Click to select filled template"}</p>
        <p className="text-xs text-muted-foreground mt-1">.xlsx files only</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)} />
      </div>

      <button onClick={upload} disabled={uploading || !file}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
        {uploading ? <><Loader2 size={14} className="animate-spin" />Generating…</> : <><Upload size={14} />Generate from Template</>}
      </button>

      {result && (
        <div className={`rounded-xl p-4 space-y-2 ${result.errors?.length ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
          <p className="text-sm font-semibold text-green-700">✓ {result.created} entries created</p>
          {result.skipped > 0 && <p className="text-xs text-muted-foreground">⚠ {result.skipped} rows skipped (empty)</p>}
          {result.errors?.slice(0, 5).map((e, i) => (
            <p key={i} className="text-xs text-red-600">Row {e.row}: {e.error}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [loadingPrint, setLoadingPrint] = useState(false);
  const [depts, setDepts] = useState([]);
  const [deptId, setDeptId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.sessions?.list || "/api/sessions"),
      axiosInstance.get(EP.departments?.list || "/api/departments"),
    ]).then(([sRes, dRes]) => {
      const ses = sRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
      setDepts(dRes.data?.data?.departments || dRes.data?.data || []);
    }).catch(() => { });

    // Load saved gen config
    axiosInstance.get(EP.timetable.genConfig)
      .then(r => { if (r.data?.data && Object.keys(r.data.data).length) setConfig(c => ({ ...c, ...r.data.data })); })
      .catch(() => { });
  }, []);

  const saveConfig = async () => {
    try {
      await axiosInstance.post(EP.timetable.genConfig, { ...config, session_id: sessionId });
      notify.success("Settings saved");
    } catch { notify.error("Failed to save settings"); }
  };

  const generateAll = async () => {
    if (!sessionId) { notify.error("No active session"); return; }
    setLoading(true); setResult(null);
    try {
      // Save config first
      await axiosInstance.post(EP.timetable.genConfig, { ...config, session_id: sessionId }).catch(() => { });
      const res = await axiosInstance.post(EP.timetable.generateAll, {
        session_id: sessionId,
        dept_id: deptId || undefined,
        force,
        ...config,
      });
      setResult(res.data?.data);
      notify.success(res.data?.message || "Generation complete");
    } catch (e) { notify.error(e.response?.data?.message || "Generation failed"); }
    finally { setLoading(false); }
  };

  const openPrint = async () => {
    if (!result?.success?.length) return;
    setLoadingPrint(true);
    try {
      const [ttsRes, periodsRes] = await Promise.all([
        axiosInstance.get(EP.timetable.global, { params: { session_id: sessionId } }),
        axiosInstance.get(EP.timetable.periods(sessionId)),
      ]);
      const tts = ttsRes.data?.data || [];
      const periods = periodsRes.data?.data || [];

      const printSections = result.success.map(s => {
        const tt = tts.find(t => t.section_id === s.section_id);
        return {
          section_id: s.section_id,
          section_name: s.section_name,
          semester: tt?.section?.semester || "",
          batch: tt?.section?.batch || "",
          branch: tt?.section?.branch?.name || "",
          periods,
          tt,
        };
      }).filter(s => s.tt?.entries?.length);

      if (!printSections.length) { notify.error("No timetable data to print"); return; }
      setPrintData(printSections);
    } catch { notify.error("Failed to load print data"); }
    finally { setLoadingPrint(false); }
  };

  const successCount = result?.success_count || 0;
  const failedCount = result?.failed_count || 0;
  const totalCount = result?.total || 0;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />Generate All Timetables
          </h1>
          <p className="text-sm text-muted-foreground">One click — all active sections get a timetable</p>
        </div>
        <button onClick={() => navigate("/admin/timetable/sections")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">
          View Section TT
        </button>
      </div>

      {/* Session + Dept */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium flex items-center gap-1"><Calendar size={11} />Session</label>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={inp}>
            <option value="">Select…</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name || s.code}{s.is_current ? " (Current)" : ""}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium flex items-center gap-1"><Building2 size={11} />Department (optional)</label>
          <select value={deptId} onChange={e => setDeptId(e.target.value)} className={inp}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Settings toggle */}
      <div>
        <button onClick={() => setShowSettings(v => !v)}
          className="flex items-center gap-2 text-sm text-primary hover:underline">
          <Settings size={13} />
          {showSettings ? "Hide" : "Show"} Generation Settings
          {showSettings ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {showSettings && (
        <div>
          <SettingsPanel config={config} onChange={setConfig} />
          <button onClick={saveConfig} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
            Save settings for next time
          </button>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">Before generating:</p>
        <p>✓ <button onClick={() => navigate("/admin/timetable/periods")} className="underline">Period config</button> must be set for this session</p>
        <p>✓ Faculty must be assigned to subjects in each section</p>
        <p>✓ Lab subjects → category = PRACTICAL (auto placed in 2 consecutive slots)</p>
      </div>

      {/* Force + Generate button */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="w-4 h-4 mt-0.5 accent-primary" />
          <div>
            <p className="text-sm font-medium">Force regenerate</p>
            <p className="text-xs text-muted-foreground">Clears existing timetable before generating fresh</p>
          </div>
        </label>

        <button onClick={generateAll} disabled={loading || !sessionId}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
          {loading
            ? <><Loader2 size={16} className="animate-spin" />Generating all sections…</>
            : <><Zap size={16} />Generate All Sections</>
          }
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Sections", value: totalCount, color: "text-foreground" },
              { label: "Generated ✓", value: successCount, color: "text-green-600" },
              { label: "Failed ✗", value: failedCount, color: failedCount > 0 ? "text-red-500" : "text-muted-foreground" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Print button */}
          {successCount > 0 && (
            <button onClick={openPrint} disabled={loadingPrint}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 disabled:opacity-60 transition-colors">
              {loadingPrint
                ? <><Loader2 size={14} className="animate-spin" />Loading…</>
                : <><Printer size={14} />Print All {successCount} Timetables (A4 PDF)</>
              }
            </button>
          )}

          {/* Failed */}
          {result.failed?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                <AlertCircle size={14} />Failed ({failedCount} sections)
              </p>
              {result.failed.map((f, i) => (
                <p key={i} className="text-xs text-red-600">
                  <strong>{f.section_name}</strong> — {f.reason}
                </p>
              ))}
            </div>
          )}

          {/* Success list */}
          {result.success?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} />Sections ({successCount})
              </p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {result.success.map((s, i) => <SectionCard key={i} s={s} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Print Modal */}
      {printData && (
        <PrintModal sections={printData} settings={config} onClose={() => setPrintData(null)} />
      )}
    </div>
  );
}