// src/components/shared/AuditLogs.jsx
import { useState } from "react";
import { RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { SkeletonRow } from "./Skeleton.jsx";
import { ConfirmDialog } from "./ConfirmDialog.jsx";
import { Pagination } from "./Pagination.jsx";
import { cn } from "../../lib/utils.js";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { notify } from "../../hooks/notify.js";

function DiffView({ prev, next }) {
  if (!prev && !next) return <p className="text-xs text-muted-foreground">No field changes recorded</p>;
  const skip = new Set(["updatedAt","deleted_at","createdAt"]);
  const keys = [...new Set([...Object.keys(prev||{}), ...Object.keys(next||{})])]
    .filter((k) => !skip.has(k) && JSON.stringify((prev||{})[k]) !== JSON.stringify((next||{})[k]));
  if (!keys.length) return <p className="text-xs text-muted-foreground">No visible field changes</p>;
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-muted-foreground pb-1 border-b border-border">
        <span>Field</span><span>Before</span><span>After</span>
      </div>
      {keys.map((k) => (
        <div key={k} className="grid grid-cols-3 gap-3 text-xs">
          <span className="font-mono text-muted-foreground">{k}</span>
          <span className="text-red-600 line-through truncate">{String((prev||{})[k] ?? "—")}</span>
          <span className="text-green-600 font-medium truncate">{String((next||{})[k] ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

export function AuditLogs({ logs=[], total=0, page=1, limit=20, loading=false, onPageChange, isRoot=false, onRollbackSuccess, className }) {
  const [expanded, setExpanded] = useState(null);
  const [rt,  setRt]  = useState(null);
  const [rl,  setRl]  = useState(false);
  const totalPages = Math.ceil(total / limit);

  const handleRollback = async () => {
    setRl(true);
    try {
      await axiosInstance.post(EP.audit.restore(rt.id));
      notify.success("Rolled back successfully");
      setRt(null);
      onRollbackSuccess?.();
    } catch (err) { notify.error(err.response?.data?.message || "Rollback failed"); }
    finally { setRl(false); }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["Action","Record","By","Role","When",""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : logs.length === 0
              ? <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No history yet</td></tr>
              : logs.map((log) => (
                <>
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3"><StatusBadge status={log.action} size="xs" label={log.action} /></td>
                    <td className="px-4 py-3 text-xs font-medium max-w-[180px] truncate">{log.record_label || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{log.user_email || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.user_role || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                          {expanded === log.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                        {isRoot && log.reversible && !log.restored_at && (
                          <button onClick={() => setRt(log)}
                            className="p-1.5 rounded-lg hover:bg-muted text-amber-600">
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr key={`${log.id}-exp`} className="bg-muted/10 border-b border-border">
                      <td colSpan={6} className="px-6 py-4 space-y-3">
                        <DiffView prev={log.prev_data} next={log.new_data} />
                        {log.restored_at && (
                          <p className="text-xs text-violet-600 pt-2 border-t border-border">
                            Rolled back on {new Date(log.restored_at).toLocaleString("en-IN")}
                            {log.restored_by && ` by ${log.restored_by}`}
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
      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={onPageChange} />
      <ConfirmDialog open={!!rt} onClose={() => setRt(null)}
        title="Rollback Change"
        description={`Restore the previous state of "${rt?.record_label}"? This action will itself be logged.`}
        confirmLabel="Rollback" variant="destructive"
        onConfirm={handleRollback} loading={rl} />
    </div>
  );
}
export default AuditLogs;
