import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
} from "../../../redux/slice.js";
import axiosInstance from "../../../lib/axios.js";
import { cn } from "../../../lib/utils.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, Download, Pencil, Trash2, Loader2 } from "lucide-react";
import { notify } from "../../../hooks/notify.js";

const TYPES = ["TEACHING", "GENERAL", "INFRASTRUCTURE", "GROUP", "OTHER"];
const TYPE_COLOR = {
  TEACHING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  GENERAL: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  INFRASTRUCTURE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  OTHER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  GROUP: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function CategoryModal({ open, onClose, onSubmit, initialData, loading }) {
  const [form, setForm] = useState({ name: "", type: "GENERAL", is_active: true });
  useEffect(() => {
    if (open) setForm({
      name: initialData?.name || "",
      type: initialData?.type || "GENERAL",
      is_active: initialData?.is_active ?? true,
    });
  }, [open, initialData]);
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{initialData ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input className="h-9 text-sm" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Teaching Quality" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Active</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!form.name.trim() || loading} onClick={() => onSubmit(form)}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, desc, loading }) {
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{desc}</DialogDescription></DialogHeader>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />} Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FeedbackCategoriesPage() {
  const dispatch = useDispatch();
  // shared slice stores into s.feedback
  const categories = useSelector((s) => s.feedback?.categories ?? []);
  const loading = useSelector((s) => s.feedback?.loading ?? false);
  const actionLoading = useSelector((s) => s.feedback?.actionLoading ?? false);

  const [modal, setModal] = useState(null);   // null | "create" | catObj
  const [del, setDel] = useState(null);
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  const load = useCallback(() => dispatch(getCategories()), [dispatch]);
  useEffect(() => { load(); }, [load]);

  const run = async (thunk, args, msg) => {
    const r = await dispatch(thunk(args));
    if (thunk.fulfilled.match(r)) { notify.success(msg); setModal(null); load(); return true; }
    notify.error(r.payload); return false;
  };

  const handleCreate = (data) => run(createCategory, data, "Category created");
  const handleUpdate = (data) => run(updateCategory, { id: modal.id, data }, "Updated");
  const handleDelete = async () => { await run(deleteCategory, del.id, "Deleted"); setDel(null); };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await axiosInstance.post("/feedback/categories/bulk-upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResults(res.data.data); load();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    e.target.value = "";
  };

  const handleTemplate = async () => {
    try {
      const res = await axiosInstance.get("/feedback/categories/template", { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(res.data); a.download = "category_template.xlsx"; a.click();
    } catch { notify.error("Download failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Feedback Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx" className="sr-only" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={handleTemplate}><Download size={13} className="mr-1.5" />Template</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload size={13} className="mr-1.5" />Bulk Upload</Button>
          <Button size="sm" onClick={() => setModal("create")}><Plus size={13} className="mr-1.5" />New Category</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["Name", "Type", "Questions", "Forms", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && categories.length === 0
              ? <tr><td colSpan={6} className="text-center py-10"><Loader2 size={18} className="animate-spin mx-auto text-muted-foreground" /></td></tr>
              : categories.length === 0
                ? <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">No categories yet.</td></tr>
                : categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", TYPE_COLOR[cat.type] || TYPE_COLOR.OTHER)}>
                        {cat.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cat._count?.questions ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cat._count?.forms ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                        cat.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground")}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModal(cat)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDel(cat)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <CategoryModal
        open={!!modal} onClose={() => setModal(null)}
        onSubmit={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        loading={actionLoading} />

      <ConfirmModal
        open={!!del} onClose={() => setDel(null)} onConfirm={handleDelete}
        title="Delete Category"
        desc={`Delete "${del?.name}"? Questions using it will also be affected.`}
        loading={actionLoading} />

      {results && (
        <Dialog open onOpenChange={() => setResults(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Bulk Upload Results</DialogTitle><DialogDescription>{results.total} rows processed</DialogDescription></DialogHeader>
            <div className="space-y-3 py-1 max-h-60 overflow-y-auto">
              {results.created?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">✓ Created ({results.created.length})</p>
                  {results.created.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.name}</p>)}
                </div>
              )}
              {results.failed?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-destructive mb-1">✗ Failed ({results.failed.length})</p>
                  {results.failed.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.reason}</p>)}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setResults(null)}>Close</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}