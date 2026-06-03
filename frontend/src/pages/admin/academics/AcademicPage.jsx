import { useRef, useState } from "react";
import axiosInstance from "../../../lib/axios.js";
import { notify } from "../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Download, Search, MoreHorizontal, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils.js";

export function Spinner({ size = 14, className }) {
  return <Loader2 size={size} className={cn("animate-spin", className)} />;
}

// ── Results modal for bulk uploads ─────────────────────────────
export function ResultsModal({ open, onClose, title, data }) {
  if (!open || !data) return null;
  const created = data.created || data.success || [];
  const failed  = data.failed  || [];
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{created.length} created · {failed.length} failed out of {data.total}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-3 py-1">
          {created.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 mb-1">✓ Created ({created.length})</p>
              {created.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.name || r.email || r.id}</p>)}
            </div>
          )}
          {failed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-destructive mb-1">✗ Failed ({failed.length})</p>
              {failed.map((r, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {r.row ? JSON.stringify(r.row).slice(0, 60) : r.id} — {r.reason}
                </p>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="mt-2">Close</Button>
      </DialogContent>
    </Dialog>
  );
}

// ── Confirm modal ───────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, description, loading }) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading && <Spinner size={13} />} Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Table shell ─────────────────────────────────────────────────
export function TableShell({ icon: Icon, title, subtitle, onAdd, templateUrl, bulkUploadUrl, onRefresh,
  loading, children, search, onSearch, filters, pagination, onPageChange }) {
  const fileRef = useRef();
  const [results, setResults] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await axiosInstance.post(bulkUploadUrl, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResults(res.data.data);
      onRefresh?.();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    e.target.value = "";
  };

  const handleTemplate = async () => {
    try {
      const res = await axiosInstance.get(templateUrl, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement("a"); a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_template.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch { notify.error("Template download failed"); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {Icon && <Icon size={19} className="text-muted-foreground" />} {title}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="sr-only" onChange={handleUpload} />
          {templateUrl  && <Button variant="outline" size="sm" onClick={handleTemplate}><Download size={13} className="mr-1.5" />Template</Button>}
          {bulkUploadUrl && <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload size={13} className="mr-1.5" />Bulk Upload</Button>}
          {onAdd && <Button size="sm" onClick={onAdd}><Plus size={13} className="mr-1.5" />Add</Button>}
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {onSearch !== undefined && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input className="pl-8 h-9 text-sm" placeholder="Search…" value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}
        {filters}
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onRefresh}>
          <RefreshCw size={13} className={cn(loading && "animate-spin")} />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {children}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <span>
              {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}><ChevronLeft size={13} /></Button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const p = pagination.pages <= 5 ? i + 1 : Math.max(1, pagination.page - 2) + i;
                return p <= pagination.pages ? (
                  <Button key={p} variant={p === pagination.page ? "default" : "outline"}
                    size="icon" className="h-7 w-7 text-xs" onClick={() => onPageChange(p)}>{p}</Button>
                ) : null;
              })}
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={pagination.page >= pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}><ChevronRight size={13} /></Button>
            </div>
          </div>
        )}
      </div>

      <ResultsModal open={!!results} onClose={() => setResults(null)} title="Bulk Upload Results" data={results} />
    </div>
  );
}

// ── Row actions menu ────────────────────────────────────────────
export function RowActions({ onEdit, onDelete, extra = [] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {onEdit   && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
        {extra.map(({ label, onClick, className }) => (
          <DropdownMenuItem key={label} onClick={onClick} className={className}>{label}</DropdownMenuItem>
        ))}
        {onDelete && (
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>Delete</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Th / Td helpers ─────────────────────────────────────────────
export const Th = ({ children, className }) => (
  <th className={cn("text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide", className)}>
    {children}
  </th>
);
export const Td = ({ children, className }) => (
  <td className={cn("px-3 py-3 text-sm text-foreground", className)}>{children}</td>
);

// ── Empty + Loading rows ────────────────────────────────────────
export function EmptyRow({ colSpan, message = "No records found" }) {
  return (
    <tr><td colSpan={colSpan} className="text-center py-12 text-sm text-muted-foreground">{message}</td></tr>
  );
}
export function LoadingRow({ colSpan }) {
  return (
    <tr><td colSpan={colSpan} className="text-center py-12">
      <Spinner size={20} className="mx-auto text-muted-foreground" />
    </td></tr>
  );
}
