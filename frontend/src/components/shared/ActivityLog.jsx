// src/components/shared/ActivityLog.jsx
import { cn } from "../../lib/utils.js";
import StatusBadge from "./StatusBadge.jsx";
import { Skeleton } from "./Skeleton.jsx";

export function ActivityLog({ entries = [], loading = false, maxItems = 20, className }) {
  if (loading) return (
    <div className="space-y-3">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
        </div>
      ))}
    </div>
  );
  if (!entries.length) return <p className="text-xs text-muted-foreground text-center py-8">No activity yet</p>;
  return (
    <div className={cn("space-y-4", className)}>
      {entries.slice(0, maxItems).map((e) => (
        <div key={e.id} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
            {(e.user || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={e.action} size="xs" />
              <span className="text-xs font-medium truncate">{e.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {e.user} · {e.role} · {new Date(e.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
export default ActivityLog;
