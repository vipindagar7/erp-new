import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../../lib/axios.js";
import { cn } from "../../lib/utils.js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RefreshCw, Download, RotateCcw, Search, Filter, ChevronDown,
  ChevronRight, AlertTriangle, Loader2, Shield, User, Clock,
  FileText, Activity, BarChart2, X,
} from "lucide-react";
import { notify } from "../../hooks/notify.js";

// ── Constants ──────────────────────────────────────────────────
const ACTIONS = ["all", "CREATE", "UPDATE", "DELETE", "RESTORE", "PROMOTE", "DEMOTE", "BLOCK", "UNBLOCK", "ASSIGN", "REMOVE", "BULK_PROMOTE", "BULK_STATUS", "LOGIN", "LOGOUT", "EXPORT", "IMPORT"];
const MODULES = ["all", "student", "faculty", "section", "subject", "course", "program", "department", "feedback_form", "feedback_category", "feedback_group", "curriculum", "enrollment", "section_subject", "auth"];

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RESTORE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  PROMOTE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  DEMOTE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  BLOCK: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  UNBLOCK: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ASSIGN: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  REMOVE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  LOGIN: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  LOGOUT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  EXPORT: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  IMPORT: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

const fmtDate = (d) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── Diff viewer ────────────────────────────────────────────────
function DiffViewer({ prev, next, changedFields }) {
  if (!prev && !next) return <p className="text-xs text-muted-foreground">No data recorded.</p>;
  const fields = changedFields?.length > 0 ? changedFields : Object.keys({ ...prev, ...next });
  const skip = new Set(["updatedAt", "createdAt", "passwordHash"]);
  const relevant = fields.filter(f => !skip.has(f));
  if (!relevant.length) return <p className="text-xs text-muted-foreground">No field changes recorded.</p>;
  return (
    <div className="space-y-1.5">
      {relevant.map((field) => {
        const pv = prev?.[field];
        const nv = next?.[field];
        const changed = JSON.stringify(pv) !== JSON.stringify(nv);
        return (
          <div key={field} className={cn("grid grid-cols-[120px_1fr_1fr] gap-2 text-xs rounded-lg px-3 py-2", changed ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-muted/30")}>
            <span className="font-mono font-semibold text-muted-foreground truncate">{field}</span>
            <span className={cn("font-mono truncate", changed && "line-through text-red-600 dark:text-red-400")}>
              {pv == null ? <span className="opacity-40 italic">null</span> : JSON.stringify(pv)}
            </span>
            <span className={cn("font-mono truncate", changed && "text-green-700 dark:text-green-400 font-semibold")}>
              {nv == null ? <span className="opacity-40 italic">null</span> : JSON.stringify(nv)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Log detail modal ───────────────────────────────────────────
function LogDetailModal({ log, open, onClose, onRestore, isSuperAdmin }) {
  const [restoring, setRestoring] = useState(false);
  if (!open || !log) return null;

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await axiosInstance.post(`/audit/${log.id}/restore`);
      notify.success(`${log.module} record restored`);
      onRestore();
      onClose();
    } catch (e) { notify.error(e.response?.data?.message || "Restore failed"); }
    finally { setRestoring(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity size={16} />
              Audit Log Detail
            </DialogTitle>
            <DialogDescription>{log.id}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              ["Action", <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", ACTION_COLORS[log.action] || "bg-muted text-muted-foreground")}>{log.action}</span>],
              ["Module", <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{log.module}</span>],
              ["Record", <span className="font-mono text-xs text-muted-foreground truncate">{log.record_label || log.record_id || "—"}</span>],
              ["User", <span className="text-xs">{log.user_email || "System"} <span className="text-muted-foreground">({log.user_role || "—"})</span></span>],
              ["Time", <span className="text-xs text-muted-foreground">{fmtDate(log.createdAt)}</span>],
              ["IP", <span className="font-mono text-xs text-muted-foreground">{log.ip || "—"}</span>],
            ].map(([label, val]) => (
              <div key={label} className="bg-muted/30 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                {val}
              </div>
            ))}
          </div>

          {/* Changed fields */}
          {(log.prev_data || log.new_data) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Field Changes</p>
                {log.changed_fields?.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {log.changed_fields.length} field{log.changed_fields.length !== 1 ? "s" : ""} changed
                  </span>
                )}
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr] gap-2 text-[10px] font-semibold text-muted-foreground px-3 uppercase tracking-wide">
                <span>Field</span><span className="text-red-500">Before</span><span className="text-green-600">After</span>
              </div>
              <DiffViewer prev={log.prev_data} next={log.new_data} changedFields={log.changed_fields} />
            </div>
          )}

          {/* Restore info */}
          {log.restored_at && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-700 dark:text-purple-400">
              <p className="font-semibold">✓ Already restored on {fmtDate(log.restored_at)}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center gap-3">
          {isSuperAdmin && log.reversible && !log.restored_at && (
            <Button onClick={handleRestore} disabled={restoring}
              className="bg-purple-600 hover:bg-purple-700 text-white">
              {restoring ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <RotateCcw size={13} className="mr-1.5" />}
              Restore to this state
            </Button>
          )}
          {!log.reversible && <p className="text-xs text-muted-foreground">This action cannot be restored.</p>}
          <Button variant="outline" className="ml-auto" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stats mini-cards ───────────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Actions (7d)", value: stats.total, icon: Activity, color: "text-blue-600" },
        { label: "Top module", value: stats.byModule?.[0]?.module || "—", icon: FileText, color: "text-purple-600" },
        { label: "Top action", value: stats.byAction?.[0]?.action || "—", icon: BarChart2, color: "text-amber-600" },
        { label: "Most active", value: stats.byUser?.[0]?.user_email?.split("@")[0] || "—", icon: User, color: "text-green-600" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <Icon size={18} className={cn(color, "shrink-0")} />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold text-sm text-foreground truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function AuditTrailPage() {
  const { user } = useSelector((s) => s.auth);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [detailLog, setDetailLog] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [action, setAction] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const searchTO = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (module !== "all") params.module = module;
      if (action !== "all") params.action = action;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const r = await axiosInstance.get("/audit", { params });
      setLogs(r.data?.data?.logs || []);
      setPagination(r.data?.data?.pagination || {});
    } catch { notify.error("Failed to load audit logs"); }
    finally { setLoading(false); }
  }, [page, search, module, action, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    axiosInstance.get("/audit/stats")
      .then((r) => setStats(r.data?.data))
      .catch(() => { });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (module !== "all") params.set("module", module);
      if (action !== "all") params.set("action", action);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await axiosInstance.get(`/audit/export?${params}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { notify.error("Export failed"); }
    finally { setExporting(false); }
  };

  const totalPages = pagination?.pages || 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield size={20} className="text-muted-foreground" />
            Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete activity log — every action by every user across all modules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </Button>
          {isSuperAdmin && (
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input defaultValue={search} onChange={(e) => { clearTimeout(searchTO.current); searchTO.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 350); }}
            placeholder="Search user, record, module…"
            className="w-full h-9 pl-8 pr-3 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Select value={module} onValueChange={(v) => { setModule(v); setPage(1); }}>
          <SelectTrigger className="h-9 text-sm w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODULES.map((m) => <SelectItem key={m} value={m}>{m === "all" ? "All Modules" : m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="h-9 text-sm w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === "all" ? "All Actions" : a}</SelectItem>)}
          </SelectContent>
        </Select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-9 px-3 text-sm border border-input rounded-lg bg-background outline-none" />
        <span className="text-muted-foreground text-sm">–</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-9 px-3 text-sm border border-input rounded-lg bg-background outline-none" />
        {(search || module !== "all" || action !== "all" || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setModule("all"); setAction("all"); setDateFrom(""); setDateTo(""); setPage(1); }}>
            <X size={13} className="mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="space-y-0 divide-y divide-border">
            {[...Array(8)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-muted/30" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <Shield size={32} className="text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">No audit logs found for these filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {["Time", "User", "Action", "Module", "Record", "Changed Fields", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 cursor-pointer transition-colors group"
                    onClick={() => setDetailLog(log)}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-medium text-foreground">{fmtAgo(log.createdAt)}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(log.createdAt).split(",")[0]}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{log.user_email || "System"}</p>
                      <p className="text-[10px] text-muted-foreground">{log.user_role || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", ACTION_COLORS[log.action] || "bg-muted text-muted-foreground")}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{log.module}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-xs text-foreground truncate">{log.record_label || "—"}</p>
                      {log.record_id && <p className="text-[10px] font-mono text-muted-foreground truncate">{log.record_id.slice(0, 12)}…</p>}
                    </td>
                    <td className="px-4 py-3">
                      {log.changed_fields?.length > 0 ? (
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {log.changed_fields.slice(0, 3).map((f) => (
                            <span key={f} className="text-[10px] font-mono bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded">{f}</span>
                          ))}
                          {log.changed_fields.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{log.changed_fields.length - 3}</span>
                          )}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {log.reversible && !log.restored_at && isSuperAdmin && (
                          <span className="text-[10px] text-purple-600 font-medium">Restorable</span>
                        )}
                        {log.restored_at && (
                          <span className="text-[10px] text-muted-foreground">Restored</span>
                        )}
                        <ChevronRight size={13} className="text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {pagination?.total?.toLocaleString()} total entries
            </span>
            <div className="flex gap-1">
              {[["«", 1], ["‹", page - 1], ["›", page + 1], ["»", totalPages]].map(([l, t], i) => (
                <button key={i} onClick={() => setPage(Math.max(1, Math.min(totalPages, t)))}
                  disabled={t < 1 || t > totalPages || t === page}
                  className="h-8 w-8 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <LogDetailModal
        log={detailLog}
        open={!!detailLog}
        onClose={() => setDetailLog(null)}
        onRestore={load}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}