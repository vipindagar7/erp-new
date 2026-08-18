// src/modules/branch/pages/BranchHistoryPage.jsx
// Shows all audit log entries for the "branch" module.
// Every CREATE, UPDATE, DEACTIVATE, RESTORE is logged here.
// Root-only: full rollback capability (via AuditPage pattern).
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Eye } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACTION_COLORS = {
  CREATE:  "bg-green-100 text-green-700",
  UPDATE:  "bg-blue-100 text-blue-700",
  DELETE:  "bg-red-100 text-red-700",
  RESTORE: "bg-violet-100 text-violet-700",
};

function DiffView({ prev, next }) {
  if (!prev && !next) return null;
  const keys = [...new Set([...Object.keys(prev || {}), ...Object.keys(next || {})])].filter((k) => {
    if (k === "updatedAt" || k === "deleted_at") return false;
    return JSON.stringify((prev || {})[k]) !== JSON.stringify((next || {})[k]);
  });
  if (!keys.length) return <p className="text-xs text-muted-foreground">No visible field changes</p>;
  return (
    <div className="space-y-1.5 mt-2">
      {keys.map((k) => (
        <div key={k} className="grid grid-cols-3 gap-2 text-xs">
          <span className="text-muted-foreground font-mono">{k}</span>
          <span className="text-red-600 line-through truncate">{String((prev || {})[k] ?? "—")}</span>
          <span className="text-green-600 font-medium truncate">{String((next || {})[k] ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

export default function BranchHistoryPage() {
  const navigate  = useNavigate();
  const { isRoot } = usePageGuard();

  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.audit.list, { params: { module: "branch", page, limit } });
      const d = r.data?.data;
      setLogs(d?.logs || d || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load history"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleRollback = async () => {
    setRollbackLoading(true);
    try {
      await axiosInstance.post(EP.audit.restore(rollbackTarget.id));
      notify.success("Rolled back successfully");
      setRollbackTarget(null);
      load();
    } catch (err) { notify.error(err.response?.data?.message || "Rollback failed"); }
    finally { setRollbackLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.hub)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Branch History</h1>
          <p className="text-sm text-muted-foreground">{total} audit log entries — every action on every branch</p>
        </div>
      </div>

      {/* Log table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["Action", "Branch", "By", "Role", "When", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
            )) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No history yet</td></tr>
            ) : logs.map((log) => (
              <>
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || "bg-muted text-muted-foreground"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{log.record_label || log.record_id?.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.user_email || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.user_role  || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="View changes">
                        <Eye size={13} />
                      </button>
                      {isRoot && log.reversible && !log.restored_at && (
                        <button onClick={() => setRollbackTarget(log)}
                          className="p-1.5 rounded-lg hover:bg-muted text-amber-600" title="Rollback">
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded === log.id && (
                  <tr key={`${log.id}-exp`} className="bg-muted/10">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-3 gap-2 text-xs mb-1 font-semibold text-muted-foreground">
                        <span>Field</span><span>Before</span><span>After</span>
                      </div>
                      <DiffView prev={log.prev_data} next={log.new_data} />
                      {log.restored_at && (
                        <p className="text-xs text-violet-600 mt-2">
                          Rolled back on {new Date(log.restored_at).toLocaleString("en-IN")} by {log.restored_by}
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!rollbackTarget} onClose={() => setRollbackTarget(null)}
        title="Rollback Change"
        description={`Restore the previous state of "${rollbackTarget?.record_label}"? This action is also logged.`}
        confirmLabel="Rollback"
        onConfirm={handleRollback} loading={rollbackLoading} />
    </div>
  );
}
