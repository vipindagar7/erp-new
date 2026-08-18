// src/components/shared/ModuleHistoryPage.jsx
// ─────────────────────────────────────────────────────────────
// Reusable history page for ANY module.
// Reads audit logs filtered by module name.
// Used by: DepartmentHistoryPage, ProgramHistoryPage,
//          CourseHistoryPage, SubjectHistoryPage, etc.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { History, Filter, Download, X, ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { notify } from "../../hooks/notify.js";

const ACTION_COLORS = {
  CREATE:  "bg-green-100 text-green-700",
  UPDATE:  "bg-blue-100 text-blue-700",
  DELETE:  "bg-red-100 text-red-700",
  RESTORE: "bg-violet-100 text-violet-700",
  PROMOTE: "bg-emerald-100 text-emerald-700",
  DEMOTE:  "bg-orange-100 text-orange-700",
  ASSIGN:  "bg-teal-100 text-teal-700",
  REMOVE:  "bg-amber-100 text-amber-700",
  BULK_PROMOTE: "bg-emerald-100 text-emerald-700",
  BULK_DEMOTE:  "bg-orange-100 text-orange-700",
};

function DiffViewer({ prev, next, fields }) {
  if (!prev && !next) return <p className="text-xs text-muted-foreground italic">No diff data</p>;
  const changed = fields?.length
    ? fields
    : Object.keys({ ...prev, ...next }).filter((k) => JSON.stringify(prev?.[k]) !== JSON.stringify(next?.[k]));
  if (!changed.length) return <p className="text-xs text-muted-foreground italic">No fields changed</p>;

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-muted-foreground pb-1 border-b border-border">
        <span>Field</span><span className="text-red-500">Before</span><span className="text-green-600">After</span>
      </div>
      {changed.map((field) => (
        <div key={field} className="grid grid-cols-3 gap-2 text-[10px]">
          <span className="font-medium capitalize">{field.replace(/_/g, " ")}</span>
          <span className="text-red-500 truncate">{JSON.stringify(prev?.[field] ?? "—")}</span>
          <span className="text-green-600 font-medium truncate">{JSON.stringify(next?.[field] ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

function LogRow({ log }) {
  const [open, setOpen] = useState(false);
  const hasDiff = log.prev_data || log.new_data;

  return (
    <>
      <tr onClick={() => hasDiff && setOpen((v) => !v)}
        className={`border-b border-border last:border-0 hover:bg-muted/10 ${hasDiff ? "cursor-pointer" : ""}`}>
        <td className="px-4 py-3">
          {hasDiff ? (
            open ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronRight size={13} className="text-muted-foreground" />
          ) : <span className="w-[13px] inline-block" />}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </td>
        <td className="px-4 py-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || "bg-muted text-muted-foreground"}`}>
            {log.action}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-medium">{log.record_label || log.record_id || "—"}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{log.user_email || "—"}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{log.user_role || "—"}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{log.ip || "—"}</td>
      </tr>
      {open && hasDiff && (
        <tr className="bg-muted/10 border-b border-border">
          <td colSpan={7} className="px-8 py-3">
            <DiffViewer prev={log.prev_data} next={log.new_data} fields={log.changed_fields} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function ModuleHistoryPage({
  module,          // e.g. "department", "section", "student"
  title,           // e.g. "Department History"
  icon: Icon,      // Lucide icon component
  recordId,        // optional — filter to one specific record
  extraFilters,    // optional — extra default filter params
  actions,         // optional — array of action options to show
}) {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ action: "", search: "", date_from: "", date_to: "" });
  const limit = 30;

  const load = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        module,
        page,
        limit,
        ...(recordId && { record_id: recordId }),
        ...(extraFilters || {}),
        ...(filters.action    && { action:    filters.action    }),
        ...(filters.search    && { search:    filters.search    }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to   && { date_to:   filters.date_to   }),
        ...overrides,
      };
      const r = await axiosInstance.get(EP.audit.list, { params });
      setLogs(r.data?.data?.logs || []);
      setTotal(r.data?.data?.pagination?.total || 0);
    } catch { notify.error("Failed to load history"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, module, recordId]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ module, ...(recordId && { record_id: recordId }) });
      const r = await axiosInstance.get(`${EP.audit.export}?${params}`, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.data]));
      a.download = `${module}_history.csv`; a.click();
    } catch { notify.error("Export failed"); }
  };

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const totalPages = Math.ceil(total / limit);
  const ACTIONS_LIST = actions || ["CREATE","UPDATE","DELETE","RESTORE","PROMOTE","DEMOTE","ASSIGN","REMOVE"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {Icon ? <Icon size={20} /> : <History size={20} />}
            {title || `${module} History`}
          </h1>
          <p className="text-sm text-muted-foreground">{total} entries</p>
        </div>
        <button onClick={handleExport}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={filters.search} onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Search record or user…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={filters.action} onChange={(e) => setFilter("action", e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
          <option value="">All Actions</option>
          {ACTIONS_LIST.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilter("date_from", e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none" />
        <span className="text-xs text-muted-foreground">to</span>
        <input type="date" value={filters.date_to} onChange={(e) => setFilter("date_to", e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none" />
        <button onClick={() => { setPage(1); load({ page: 1 }); }}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          Apply
        </button>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => { setFilters({ action: "", search: "", date_from: "", date_to: "" }); setPage(1); load({ page: 1, action: undefined, search: undefined, date_from: undefined, date_to: undefined }); }}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted">
            <X size={13} /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-8 px-4 py-3" />
                {["Time","Action","Record","User","Role","IP"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[1,2,3,4,5,6,7].map((j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                </tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No history found</td></tr>
              ) : logs.map((log) => <LogRow key={log.id} log={log} />)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">{total} entries · Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              {[["«",1],["‹",Math.max(1,page-1)],["›",Math.min(totalPages,page+1)],["»",totalPages]].map(([l,p],i) => (
                <button key={i} onClick={() => { setPage(p); load({ page: p }); }}
                  disabled={(l==="«"||l==="‹") && page===1 || (l==="›"||l==="»") && page===totalPages}
                  className="h-8 w-8 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted disabled:opacity-40">{l}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
