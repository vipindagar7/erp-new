// src/modules/reports/pages/ReportsPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, Download, Loader2, Search, Users,
  GraduationCap, Layers, ClipboardList, BookOpen,
  Building2, GitBranch, CheckCircle, ChevronDown,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const sel = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm";

const MODULE_META = {
  students: { icon: Users, color: "blue" },
  faculty: { icon: GraduationCap, color: "violet" },
  departments: { icon: Building2, color: "teal" },
  programs: { icon: BookOpen, color: "green" },
  branches: { icon: GitBranch, color: "indigo" },
  sections: { icon: Layers, color: "amber" },
  enrollments: { icon: ClipboardList, color: "rose" },
};
const COLOR = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  teal: "bg-teal-50 text-teal-600 border-teal-100",
  green: "bg-green-50 text-green-600 border-green-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};

// ── Single report download ────────────────────────────────────
async function downloadReport(report_id, filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  const url = `/reports/generate/${report_id}${params ? "?" + params : ""}`;
  const r = await axiosInstance.get(url, { responseType: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(r.data);
  a.download = `${report_id}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click(); URL.revokeObjectURL(a.href);
}

// ── Filters per report ────────────────────────────────────────
function ReportFilters({ report, onGenerate }) {
  const [filters, setFilters] = useState({});
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setFilters(f => ({ ...f, session_id: cur.id }));
    }).catch(() => { });
  }, []);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const go = async () => {
    setLoading(true);
    try { await downloadReport(report.id, filters); notify.success(`${report.label} downloaded`); }
    catch { notify.error("Report generation failed"); }
    finally { setLoading(false); }
  };

  const mod = report.module;
  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="grid grid-cols-2 gap-2">
        {["enrollments", "sections"].includes(mod) && (
          <div className="space-y-1">
            <Label className="text-[10px]">Session</Label>
            <select value={filters.session_id || ""} onChange={e => set("session_id", e.target.value)} className={sel}>
              <option value="">All</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name || s.code}{s.is_current ? " ●" : ""}</option>)}
            </select>
          </div>
        )}
        {["students", "faculty", "sections", "branches"].includes(mod) && (
          <div className="space-y-1">
            <Label className="text-[10px]">Department</Label>
            <SearchSelect endpoint={EP.departments.list} dataPath="departments" valueKey="id" labelKey="name"
              value={filters.dept_id || ""} onChange={v => set("dept_id", v)} placeholder="All depts" />
          </div>
        )}
        {["students", "sections"].includes(mod) && (
          <div className="space-y-1">
            <Label className="text-[10px]">Branch</Label>
            <SearchSelect endpoint={EP.branches?.list || EP.departments.list} dataPath="branches" valueKey="id" labelKey="name"
              value={filters.branch_id || ""} onChange={v => set("branch_id", v)} placeholder="All branches" />
          </div>
        )}
        {["students"].includes(mod) && (
          <div className="space-y-1">
            <Label className="text-[10px]">Section</Label>
            <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
              value={filters.section_id || ""} onChange={v => set("section_id", v)} placeholder="All sections" />
          </div>
        )}
        {report.id === "students_by_status" && (
          <div className="space-y-1">
            <Label className="text-[10px]">Status</Label>
            <select value={filters.status || ""} onChange={e => set("status", e.target.value)} className={sel}>
              <option value="">All</option>
              {["ACTIVE", "DETAINED", "ON_HOLD", "LEFT", "TRANSFERRED", "SUSPENDED", "PASSED"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        {report.id === "faculty_workload" && (
          <div className="space-y-1">
            <Label className="text-[10px]">Session</Label>
            <select value={filters.session_id || ""} onChange={e => set("session_id", e.target.value)} className={sel}>
              <option value="">All</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name || s.code}</option>)}
            </select>
          </div>
        )}
      </div>
      <Button className="w-full h-9" disabled={loading} onClick={go}>
        {loading
          ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Generating…</>
          : <><Download size={13} className="mr-1.5" />Download</>}
      </Button>
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────
function ReportCard({ report }) {
  const [open, setOpen] = useState(false);
  const meta = MODULE_META[report.module] || MODULE_META.students;
  const Icon = meta.icon;
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 p-4 hover:bg-muted/10 text-left">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${COLOR[meta.color]}`}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{report.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{report.desc}</p>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <ReportFilters report={report} />
        </div>
      )}
    </div>
  );
}

// ── Bulk generate ─────────────────────────────────────────────
function BulkGenerate({ catalog }) {
  const [selected, setSelected] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => { });
  }, []);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const go = async () => {
    if (!selected.length) { notify.error("Select at least one report"); return; }
    setLoading(true); setResults([]);
    const newResults = [];
    for (const id of selected) {
      const report = catalog.find(r => r.id === id);
      try {
        await downloadReport(id, { session_id: sessionId, dept_id: deptId });
        newResults.push({ id, label: report?.label, ok: true });
        await new Promise(r => setTimeout(r, 400));
      } catch {
        newResults.push({ id, label: report?.label, ok: false });
      }
    }
    setResults(newResults);
    setLoading(false);
    const ok = newResults.filter(r => r.ok).length;
    notify.success(`${ok}/${selected.length} reports downloaded`);
  };

  const modules = [...new Set(catalog.map(r => r.module))];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 size={16} className="text-primary" />
        <p className="text-sm font-semibold">Bulk Report Generation</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Session</Label>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={sel}>
            <option value="">All sessions</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name || s.code}{s.is_current ? " ●" : ""}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Department</Label>
          <SearchSelect endpoint={EP.departments.list} dataPath="departments" valueKey="id" labelKey="name"
            value={deptId} onChange={v => setDeptId(v)} placeholder="All departments" />
        </div>
      </div>

      {/* Module-grouped selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Select Reports</Label>
          <div className="flex gap-2">
            <button onClick={() => setSelected(catalog.map(r => r.id))} className="text-xs text-primary underline">All</button>
            <button onClick={() => setSelected([])} className="text-xs text-muted-foreground underline">Clear</button>
          </div>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {modules.map(mod => {
            const meta = MODULE_META[mod] || MODULE_META.students;
            const Icon = meta.icon;
            const modReports = catalog.filter(r => r.module === mod);
            return (
              <div key={mod} className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-1 ${COLOR[meta.color].split(" ")[1]}`}>
                  <Icon size={10} />{mod}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {modReports.map(r => (
                    <label key={r.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs transition-all ${selected.includes(r.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/20"}`}>
                      <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-tight">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Button className="w-full" disabled={loading || !selected.length} onClick={go}>
        {loading
          ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Generating {selected.length} reports…</>
          : <><Download size={13} className="mr-1.5" />Download {selected.length || ""} Selected</>}
      </Button>

      {results.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {results.map(r => (
            <div key={r.id} className={`flex items-center gap-2 text-xs p-1.5 rounded-lg ${r.ok ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}>
              {r.ok ? <CheckCircle size={11} /> : <Download size={11} />}
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");

  useEffect(() => {
    axiosInstance.get("/reports/catalog")
      .then(r => setCatalog(r.data?.data || []))
      .catch(() => setCatalog([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = catalog.filter(r =>
    (!module || r.module === module) &&
    (!search || r.label.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const modules = [...new Set(catalog.map(r => r.module))];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <BarChart2 size={22} className="text-primary" />
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and download Excel reports — single or bulk</p>
        </div>
      </div>

      {!loading && <BulkGenerate catalog={catalog} />}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…" className="pl-9 h-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setModule("")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${!module ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
            All
          </button>
          {modules.map(m => {
            const meta = MODULE_META[m] || MODULE_META.students;
            return (
              <button key={m} onClick={() => setModule(m)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize ${module === m ? COLOR[meta.color] : "border-border text-muted-foreground hover:bg-muted"}`}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">No reports match</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}