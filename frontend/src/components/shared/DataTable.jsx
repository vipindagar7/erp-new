// src/components/shared/DataTable.jsx
// columns = [{ key, header, render?(row), className?, headerClass? }]
import { cn } from "../../lib/utils.js";
import { SkeletonRow } from "./Skeleton.jsx";
import EmptyState from "./EmptyState.jsx";

export function DataTable({ columns = [], data = [], loading = false, onRowClick, keyField = "id", emptyTitle, emptyDescription, className }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap", col.headerClass)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading
            ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            : data.length === 0
            ? <tr><td colSpan={columns.length}><EmptyState title={emptyTitle} description={emptyDescription} /></td></tr>
            : data.map((row) => (
              <tr key={row[keyField]} onClick={() => onRowClick?.(row)}
                className={cn("hover:bg-muted/20 transition-colors", onRowClick && "cursor-pointer")}>
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3.5", col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
export default DataTable;
