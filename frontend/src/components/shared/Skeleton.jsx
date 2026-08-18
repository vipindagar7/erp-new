// src/components/shared/Skeleton.jsx
import { cn } from "../../lib/utils.js";

export function Skeleton({ className, style }) {
  return <div style={style} className={cn("bg-muted rounded animate-pulse", className)} />;
}

export function SkeletonRow({ cols = 5 }) {
  const widths = [48, 32, 24, 16, 12, 10, 8];
  return (
    <tr className="border-b border-border">
      {Array(cols).fill(0).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${(widths[i] || 16) * 4}px` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      {Array(lines).fill(0).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: `${(lines - i) * 20 + 30}%` }} />
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default Skeleton;
