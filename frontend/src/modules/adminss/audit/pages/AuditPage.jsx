// src/modules/audit/pages/AuditPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Search, Download, RotateCcw, ChevronDown,
  ChevronRight, Loader2, AlertCircle, Filter, X,
  Monitor, Smartphone, Globe, User,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";

const ACTION_COLORS = {
  CREATE:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RESTORE: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  BLOCK:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  LOGIN:   "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  LOGOUT:  "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  EXPORT:  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  SEARCH:  "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  PROMOTE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  FAILED:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  GRANT_ROLE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  IMPERSONATE:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const MODULES = ["student","faculty","section","department","program","course","subject","curriculum","feedback","admin","audit","auth","session","role","settings"];
const ACTIONS  = ["CREATE","UPDATE","DELETE","RESTORE","BLOCK","LOGIN","LOGOUT","EXPORT","SEARCH","PROMOTE","GRANT_ROLE","IMPERSONATE","FAILED"];

function DiffViewer({ prev, next, fields }) {
  if (!prev && !next) return <p className="text-xs text-muted-foreground">No diff data available</p>;
  const changedFields = fields?.length ? fields : Object.keys({ ...prev, ...next });

  return (
    <div className="space-y-1 max-h-60 overflow-y-auto">
      {changedFields.map((field) => {
        const oldVal = prev?.[field];
        const newVal = next?.[field];
        if (oldVal === newVal) return null;
        return (
          <div key={field} className="grid grid-cols-3 gap-2 text-xs px-2 py-1.5 rounded-lg bg-muted/40">
            <span className="font-mono text-muted-foreground font-medium">{field}</span>
            <span className="text-red-600 dark:text-red-400 truncate" title={String(oldVal ?? "—")}>
              {oldVal !== undefined && oldVal !== null ? String(oldVal) : <em className="opacity-50">empty</em>}
            </span>
            <span className="text-green-600 dark:text-green-400 truncate" title={String(newVal ?? "—")}>
              {newVal !== undefined && newVal !== null ? String(newVal) : <em className="opacity-50">empty</em>}
            </span>
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
}

function AuditRow({ log, onRestore }) {
  const [expanded, setExpanded] = useState(false);
  const color = ACTION_COLORS[log.action] || ACTION_COLORS.UPDATE;

  const DeviceIcon = log.device_type === "mobile" ? Smartphone : Monitor;

  return (
    <>
      <tr className={`border-b border-border last:border-0 transition-colors ${expanded ? "bg-muted/20" : "hover:bg-muted/10"}`}>
        <td className="px-3 py-3">
          <button onClick={() => setExpanded((v) => !v)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </td>
        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </td>
        <td className="px-3 py-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{log.action}</span>
        </td>
        <td className="px-3 py-3 text-xs font-medium capitalize">{log.module}</td>
        <td className="px-3 py-3">
          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{log.user_email || "—"}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{log.user_role?.toLowerCase()}</p>
        </td>
        <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-[120px]" title={log.record_label}>
          {log.record_label || log.record_id?.slice(0,8) || "—"}
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DeviceIcon size={11} />
            <span className="truncate max-w-[80px]">{log.ip || "—"}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{log.browser} · {log.os}</p>
        </td>
        <td className="px-3 py-3">
          {log.reversible && (
            <button onClick={() => onRestore(log)}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors">
              <RotateCcw size={10} /> Restore
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10 border-b border-border">
          <td colSpan={8} className="px-5 py-4">
            <div className="space-y-3">
              {/* Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><p className="text-muted-foreground">Log ID</p><p className="font-mono">{log.id}</p></div>
                <div><p className="text-muted-foreground">User Agent</p><p className="truncate" title={log.user_agent}>{log.user_agent || "—"}</p></div>
                <div><p className="text-muted-foreground">IP Address</p><p className="font-mono">{log.ip || "—"}</p></div>
                <div><p className="text-muted-foreground">Changed Fields</p><p>{log.changed_fields?.join(", ") || "—"}</p></div>
              </div>

              {/* Diff */}
              {(log.prev_data || log.new_data) && (
                <div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-muted-foreground mb-1 px-2">
                    <span>Field</span><span className="text-red-500">Before</span><span className="text-green-500">After</span>
                  </div>
                  <DiffViewer prev={log.prev_data} next={log.new_data} fields={log.changed_fields} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditPage() {
  const { isSuperAdmin } = usePageGuard();

  const [logs, setLogs]         = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [limit]                 = useState(30);
  const [total, setTotal]       = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]   = useState({});
  const [search, setSearch]     = useState("");
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const load = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit, ...overrides };
      if (search) params.search = search;
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get(EP.audit.list, { params });
      setLogs(r.data?.data?.logs || r.data?.logs || []);
      setTotal(r.data?.data?.total || r.data?.total || 0);
    } catch { notify.error("Failed to load audit logs"); }
    finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const r = await axiosInstance.get(EP.audit.stats);
      setStats(r.data?.data ?? r.data);
    } catch {}
  };

  useEffect(() => { load(); }, [page, filters, search]);
  useEffect(() => { loadStats(); }, []);

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      await axiosInstance.post(EP.audit.restore(restoreTarget.id));
      notify.success("Record restored successfully");
      setRestoreTarget(null);
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || "Restore failed");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await axiosInstance.get(`${EP.audit.export}?${params}`, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = `audit-log-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
    } catch { notify.error("Export failed"); }
  };

  if (!isSuperAdmin) return (
    <div className="text-center py-20 text-muted-foreground">
      <Shield size={36} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">Super Admin access required</p>
      <p className="text-xs mt-1">Audit trail is only accessible to Super Admins</p>
    </div>
  );

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <h1 className="text-xl font-bold">Audit Trail</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Super Admin Only</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Complete log of every action performed in the system</p>
        </div>
        <button onClick={handleExport}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Logs",  value: stats.total,          color: "text-foreground"         },
            { label: "Today",       value: stats.today,          color: "text-blue-600"           },
            { label: "Failed Auth", value: stats.failed_auth,    color: "text-red-600"            },
            { label: "Reversible",  value: stats.reversible,     color: "text-violet-600"         },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, record, IP…"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
              activeFilterCount > 0 ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:bg-muted"
            }`}>
            <Filter size={13} /> Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={() => { setFilters({}); setSearch(""); }}
              className="inline-flex items-center gap-1 h-10 px-3 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted">
              <X size={13} /> Reset
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{total} entries</span>
        </div>

        {showFilters && (
          <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { key: "module", label: "Module", options: MODULES },
              { key: "action", label: "Action", options: ACTIONS },
            ].map(({ key, label, options }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <select className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                  value={filters[key] || ""} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value || undefined }))}>
                  <option value="">All</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">From Date</p>
              <input type="date" className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                value={filters.date_from || ""} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">To Date</p>
              <input type="date" className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                value={filters.date_to || ""} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">IP Address</p>
              <input type="text" placeholder="e.g. 192.168.1.1" className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                value={filters.ip || ""} onChange={(e) => setFilters((f) => ({ ...f, ip: e.target.value || undefined }))} />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-8 px-3 py-3" />
                {["Time", "Action", "Module", "User", "Record", "Device / IP", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-3 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : logs.length === 0
                  ? <tr><td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">No audit logs found</td></tr>
                  : logs.map((log) => <AuditRow key={log.id} log={log} onRestore={setRestoreTarget} />)
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">{total} entries · Page {page} of {totalPages || 1}</span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              {[["«",()=>setPage(1),page===1],["‹",()=>setPage(p=>Math.max(1,p-1)),page===1],
                ["›",()=>setPage(p=>Math.min(totalPages,p+1)),page===totalPages],["»",()=>setPage(totalPages),page===totalPages]]
                .map(([l,a,d],i)=>(
                  <button key={i} onClick={a} disabled={d}
                    className="h-8 w-8 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted disabled:opacity-40">
                    {l}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Restore confirm */}
      <ConfirmModal
        open={!!restoreTarget}
        title="Restore Record"
        message={`Restore "${restoreTarget?.record_label || restoreTarget?.record_id}"? This will revert it to its state before the ${restoreTarget?.action?.toLowerCase()} action.`}
        confirmLabel="Restore"
        variant="warning"
        loading={restoreLoading}
        onConfirm={handleRestore}
        onClose={() => setRestoreTarget(null)}
      />
    </div>
  );
}
