// src/components/shared/Pagination.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils.js";

export function Pagination({ page, totalPages, total, limit, onPageChange, className }) {
  if (!totalPages || totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className={cn("flex items-center justify-between text-sm text-muted-foreground", className)}>
      <span>Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={cn("w-8 h-8 rounded-lg text-xs font-medium", p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
export default Pagination;
