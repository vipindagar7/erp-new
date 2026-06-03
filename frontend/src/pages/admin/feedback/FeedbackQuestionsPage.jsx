import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
  getCategories,
} from "../../../redux/slice.js";
import axiosInstance from "../../../lib/axios.js";
import { cn } from "../../../lib/utils.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload, Download, Pencil, Trash2, Loader2, X } from "lucide-react";
import { notify } from "../../../hooks/notify.js";

const Q_TYPES = ["RATING", "TEXT", "MCQ"];
const TYPE_COLOR = {
  RATING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TEXT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MCQ: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const BLANK = { category_id: "", question: "", type: "RATING", options: [], is_required: true, order: 0 };

function QuestionModal({ open, onClose, onSubmit, initialData, loading, categories }) {
  const [form, setForm] = useState(BLANK);
  const [optInput, setOptInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setOptInput("");
    setForm(initialData ? {
      category_id: initialData.category_id || initialData.category?.id || "",
      question: initialData.question || "",
      type: initialData.type || "RATING",
      options: initialData.options || [],
      is_required: initialData.is_required ?? true,
      order: initialData.order ?? 0,
    } : BLANK);
  }, [open, initialData]);

  if (!open) return null;

  const addOpt = () => {
    if (optInput.trim()) { setForm((f) => ({ ...f, options: [...f.options, optInput.trim()] })); setOptInput(""); }
  };
  const remOpt = (i) => setForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }));

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initialData ? "Edit Question" : "New Question"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {categories.length === 0
                  ? <SelectItem value="__none__" disabled>No categories</SelectItem>
                  : categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Question *</Label>
            <Input className="h-9 text-sm" value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="Enter the question text…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v, options: v === "MCQ" ? f.options : [] }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{Q_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Input type="number" className="h-9 text-sm" value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          {form.type === "MCQ" && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex gap-2">
                <Input className="h-9 text-sm flex-1" value={optInput}
                  onChange={(e) => setOptInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOpt())}
                  placeholder="Type and press Enter…" />
                <Button variant="outline" size="sm" className="h-9" onClick={addOpt}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.options.map((o, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    {o}
                    <button onClick={() => remOpt(i)} className="text-muted-foreground hover:text-foreground"><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between py-1">
            <Label>Required</Label>
            <Switch checked={form.is_required} onCheckedChange={(v) => setForm((f) => ({ ...f, is_required: v }))} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1"
            disabled={!form.question.trim() || !form.category_id || loading}
            onClick={() => onSubmit(form)}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FeedbackQuestionsPage() {
  const dispatch = useDispatch();
  // shared slice → s.feedback
  const questions = useSelector((s) => s.feedback?.questions ?? []);
  const categories = useSelector((s) => s.feedback?.categories ?? []);
  const loading = useSelector((s) => s.feedback?.loading ?? false);
  const actionLoading = useSelector((s) => s.feedback?.actionLoading ?? false);

  const [filterCat, setFilterCat] = useState("all");
  const [modal, setModal] = useState(null);   // null | "create" | questionObj
  const [del, setDel] = useState(null);
  const fileRef = useRef();

  const load = useCallback(() => {
    dispatch(getQuestions(filterCat !== "all" ? filterCat : undefined));
  }, [dispatch, filterCat]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!categories.length) dispatch(getCategories()); }, []);

  const run = async (thunk, args, msg) => {
    const r = await dispatch(thunk(args));
    if (thunk.fulfilled.match(r)) { notify.success(msg); setModal(null); load(); return true; }
    notify.error(r.payload); return false;
  };

  const handleCreate = (data) => run(createQuestion, data, "Question created");
  const handleUpdate = (data) => run(updateQuestion, { id: modal.id, data }, "Updated");
  const handleDelete = async () => { await run(deleteQuestion, del.id, "Deleted"); setDel(null); };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await axiosInstance.post("/feedback/questions/bulk-upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const d = res.data.data;
      notify.success(`${d?.created?.length ?? 0} created, ${d?.failed?.length ?? 0} failed`);
      load();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    e.target.value = "";
  };

  const handleTemplate = async () => {
    try {
      const res = await axiosInstance.get("/feedback/questions/template", { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(res.data); a.download = "question_template.xlsx"; a.click();
    } catch { notify.error("Download failed"); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Feedback Questions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{questions.length} questions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx" className="sr-only" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={handleTemplate}>
            <Download size={13} className="mr-1.5" />Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={13} className="mr-1.5" />Bulk Upload
          </Button>
          <Button size="sm" onClick={() => setModal("create")}>
            <Plus size={13} className="mr-1.5" />New Question
          </Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-9 text-sm w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {filterCat !== "all" && (
          <button onClick={() => setFilterCat("all")}
            className="text-xs text-muted-foreground hover:text-foreground">
            Clear ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["#", "Question", "Category", "Type", "Required", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && questions.length === 0
              ? <tr><td colSpan={6} className="text-center py-10">
                <Loader2 size={18} className="animate-spin mx-auto text-muted-foreground" />
              </td></tr>
              : questions.length === 0
                ? <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                  No questions yet.
                </td></tr>
                : questions.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground w-10">{q.order}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{q.question}</p>
                      {q.options?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">{q.options.join(" · ")}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {q.category?.name || categories.find((c) => c.id === q.category_id)?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                        TYPE_COLOR[q.type] || "bg-muted text-muted-foreground")}>
                        {q.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                        q.is_required
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-muted text-muted-foreground")}>
                        {q.is_required ? "Required" : "Optional"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModal(q)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDel(q)}
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

      {/* Create / Edit modal */}
      <QuestionModal
        open={!!modal} onClose={() => setModal(null)}
        onSubmit={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        loading={actionLoading} categories={categories} />

      {/* Delete confirm */}
      {del && (
        <Dialog open onOpenChange={(v) => { if (!v) setDel(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Question</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Delete "<span className="font-medium text-foreground">{del.question}</span>"? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDel(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading && <Loader2 size={13} className="mr-1.5 animate-spin" />} Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}