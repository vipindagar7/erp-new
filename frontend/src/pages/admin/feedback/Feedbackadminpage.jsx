import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
    getCategories, createCategory, updateCategory, deleteCategory,
    getQuestions, createQuestion, updateQuestion, deleteQuestion,
    getForms, createForm, updateForm, deleteForm,
    getFormResults,
} from "../../../redux/slice.js";
import { sectionActions, subjectActions } from "../../../redux/slice.js";
import { fetchFaculty } from "../../../redux/faculty/facultySlice.js";
import axiosInstance from "../../../lib/axios.js";
import { notify } from "../../../hooks/notify.js";


// ── Shared helpers ────────────────────────────────────────────────────────────
const inp = (err) => `w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-colors ${err ? "border-destructive" : "border-input"}`;
const sel = (err = false) => `w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-colors ${err ? "border-destructive" : "border-input"}`;

function F({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function Modal({ open, onClose, title, onSubmit, loading, children, wide }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-lg"} mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">{children}</div>
                <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-border pt-4">
                    <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                    <button onClick={onSubmit} disabled={loading}
                        className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// FEEDBACK CATEGORIES PAGE
// ════════════════════════════════════════════════════════════════
function CategoryModal({ open, onClose, onSubmit, initialData, loading }) {
    const [form, setForm] = useState({ name: "", type: "GENERAL" });
    useEffect(() => { if (open) setForm({ name: initialData?.name || "", type: initialData?.type || "GENERAL" }); }, [open, initialData]);
    const handleSubmit = () => { if (!form.name.trim()) return; onSubmit(form); };
    return (
        <Modal open={open} onClose={onClose} title={initialData ? "Edit Category" : "New Category"} onSubmit={handleSubmit} loading={loading}>
            <F label="Category Name *"><input className={inp()} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Teaching Feedback" /></F>
            <F label="Type *">
                <select className={sel()} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="GENERAL">General</option>
                    <option value="TEACHING">Teaching</option>
                </select>
            </F>
        </Modal>
    );
}

export function FeedbackCategoriesPage() {
    const dispatch = useDispatch();
    const { categories = [], loading = false } = useSelector((s) => s.feedback ?? {});
    const [modal, setModal] = useState(null);   // null | "create" | catObj
    const [del, setDel] = useState(null);
    const fileRef = useRef();
    const [results, setResults] = useState(null);

    useEffect(() => { dispatch(getCategories()); }, []);

    const run = async (thunk, args, msg) => {
        const r = await dispatch(thunk(args));
        if (thunk.fulfilled.match(r)) { notify.success(msg); setModal(null); dispatch(getCategories()); return true; }
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
            setResults(res.data.data); dispatch(getCategories());
        } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
        e.target.value = "";
    };

    const handleTemplate = async () => {
        try {
            const res = await axiosInstance.get("/feedback/categories/template", { responseType: "blob" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(res.data); a.download = "category_template.xlsx"; a.click();
        } catch { notify.error("Download failed"); }
    };

    const TYPES = ["TEACHING", "GENERAL", "INFRASTRUCTURE", "OTHER"];
    const TYPE_COLOR = {
        TEACHING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        GENERAL: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        INFRASTRUCTURE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        OTHER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };

    // Inline modal to avoid dependency on external CategoryModal
    const [form, setForm] = useState({ name: "", type: "GENERAL", is_active: true });
    useEffect(() => {
        if (modal && modal !== "create") setForm({ name: modal.name || "", type: modal.type || "GENERAL", is_active: modal.is_active ?? true });
        else if (modal === "create") setForm({ name: "", type: "GENERAL", is_active: true });
    }, [modal]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Feedback Categories</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <input ref={fileRef} type="file" accept=".xlsx" className="sr-only" onChange={handleUpload} />
                    <button onClick={handleTemplate} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg> Template
                    </button>
                    <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg> Bulk Upload
                    </button>
                    <button onClick={() => setModal("create")} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg> New Category
                    </button>
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
                        {loading && categories.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10">
                                <svg className="animate-spin h-5 w-5 mx-auto text-muted-foreground" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            </td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">No categories yet. Create one or bulk upload.</td></tr>
                        ) : categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLOR[cat.type] || TYPE_COLOR.OTHER}`}>{cat.type}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{cat._count?.questions ?? 0}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{cat._count?.forms ?? 0}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cat.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                                        {cat.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => setModal(cat)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button onClick={() => setDel(cat)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
                    <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold">{modal === "create" ? "New Category" : "Edit Category"}</h2>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Name *</label>
                                <input className={inp()} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Teaching Quality" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Type</label>
                                <select className={sel()} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Active</label>
                                <button onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-primary" : "bg-muted"}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_active ? "translate-x-5" : ""}`} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
                            <button onClick={() => modal === "create" ? handleCreate(form) : handleUpdate(form)}
                                disabled={!form.name.trim() || loading}
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {del && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDel(null)} />
                    <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold">Delete Category</h2>
                        <p className="text-sm text-muted-foreground">Delete "<span className="font-medium text-foreground">{del.name}</span>"? Questions using it will also be affected.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDel(null)} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
                            <button onClick={handleDelete} disabled={loading} className="flex-1 h-10 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk upload results */}
            {results && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setResults(null)} />
                    <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold">Bulk Upload Results</h2>
                        <p className="text-sm text-muted-foreground">{results.total} rows processed</p>
                        {results.created?.length > 0 && <div><p className="text-xs font-semibold text-green-600 mb-1">✓ Created ({results.created.length})</p>{results.created.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.name}</p>)}</div>}
                        {results.failed?.length > 0 && <div><p className="text-xs font-semibold text-destructive mb-1">✗ Failed ({results.failed.length})</p>{results.failed.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.reason}</p>)}</div>}
                        <button onClick={() => setResults(null)} className="w-full h-9 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// FEEDBACK QUESTIONS PAGE
// ════════════════════════════════════════════════════════════════
export function FeedbackQuestionsPage() {
    const dispatch = useDispatch();
    const { questions = [], categories = [], loading = false } = useSelector((s) => s.feedback ?? {});
    const [filterCat, setFilterCat] = useState("all");
    const [modal, setModal] = useState(null);
    const [del, setDel] = useState(null);
    const fileRef = useRef();

    const load = () => {
        dispatch(getQuestions(filterCat !== "all" ? filterCat : undefined));
    };
    useEffect(() => { load(); }, [filterCat]);
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
            notify.success(`${res.data.data?.created?.length ?? 0} questions created`); load();
        } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
        e.target.value = "";
    };

    const handleTemplate = async () => {
        try {
            const res = await axiosInstance.get("/feedback/questions/template", { responseType: "blob" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(res.data); a.download = "question_template.xlsx"; a.click();
        } catch { notify.error("Download failed"); }
    };

    const Q_TYPES = ["RATING", "TEXT", "MCQ"];
    const TYPE_COLOR = {
        RATING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        TEXT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        MCQ: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };

    // Inline Question Modal state
    const BLANK = { category_id: "", question: "", type: "RATING", options: [], is_required: true, order: 0 };
    const [qForm, setQForm] = useState(BLANK);
    const [optInput, setOptInput] = useState("");
    useEffect(() => {
        if (!modal) return;
        setQForm(modal === "create" ? BLANK : {
            category_id: modal.category_id || modal.category?.id || "",
            question: modal.question || "",
            type: modal.type || "RATING",
            options: modal.options || [],
            is_required: modal.is_required ?? true,
            order: modal.order ?? 0,
        });
        setOptInput("");
    }, [modal]);

    const addOpt = () => { if (optInput.trim()) { setQForm((f) => ({ ...f, options: [...f.options, optInput.trim()] })); setOptInput(""); } };
    const remOpt = (i) => setQForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Feedback Questions</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{questions.length} questions</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <input ref={fileRef} type="file" accept=".xlsx" className="sr-only" onChange={handleUpload} />
                    <button onClick={handleTemplate} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg> Template
                    </button>
                    <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg> Bulk Upload
                    </button>
                    <button onClick={() => setModal("create")} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg> New Question
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
                <select className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring w-52"
                    value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

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
                        {loading && questions.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10">
                                <svg className="animate-spin h-5 w-5 mx-auto text-muted-foreground" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            </td></tr>
                        ) : questions.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">No questions yet.</td></tr>
                        ) : questions.map((q) => (
                            <tr key={q.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 text-xs text-muted-foreground">{q.order}</td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-foreground">{q.question}</p>
                                    {q.options?.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">{q.options.join(" · ")}</p>}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{q.category?.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLOR[q.type] || "bg-muted text-muted-foreground"}`}>{q.type}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${q.is_required ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                                        {q.is_required ? "Required" : "Optional"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => setModal(q)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button onClick={() => setDel(q)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Question create/edit modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
                    <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold">{modal === "create" ? "New Question" : "Edit Question"}</h2>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Category *</label>
                                <select className={sel()} value={qForm.category_id} onChange={(e) => setQForm((f) => ({ ...f, category_id: e.target.value }))}>
                                    <option value="">Select category…</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Question *</label>
                                <input className={inp()} value={qForm.question} onChange={(e) => setQForm((f) => ({ ...f, question: e.target.value }))} placeholder="Enter the question text…" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Type</label>
                                    <select className={sel()} value={qForm.type} onChange={(e) => setQForm((f) => ({ ...f, type: e.target.value, options: e.target.value === "MCQ" ? f.options : [] }))}>
                                        {Q_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Order</label>
                                    <input type="number" className={inp()} value={qForm.order} onChange={(e) => setQForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
                                </div>
                            </div>
                            {qForm.type === "MCQ" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Options</label>
                                    <div className="flex gap-2">
                                        <input className={`${inp()} flex-1`} value={optInput} onChange={(e) => setOptInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOpt())} placeholder="Add option…" />
                                        <button onClick={addOpt} className="h-10 px-3 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {qForm.options.map((o, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                                                {o}<button onClick={() => remOpt(i)} className="text-muted-foreground hover:text-foreground">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Required</label>
                                <button onClick={() => setQForm((f) => ({ ...f, is_required: !f.is_required }))}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${qForm.is_required ? "bg-primary" : "bg-muted"}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${qForm.is_required ? "translate-x-5" : ""}`} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
                            <button onClick={() => modal === "create" ? handleCreate(qForm) : handleUpdate(qForm)}
                                disabled={!qForm.question.trim() || !qForm.category_id || loading}
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {del && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDel(null)} />
                    <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold">Delete Question</h2>
                        <p className="text-sm text-muted-foreground">Delete this question? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDel(null)} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
                            <button onClick={handleDelete} disabled={loading} className="flex-1 h-10 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Sections/Faculties/Subjects fetched via sectionActions already imported ──

// ════════════════════════════════════════════════════════════════
// FORM MODAL — create + edit
// ════════════════════════════════════════════════════════════════
// ── Inline delete confirm button ─────────────────────────────
function DeleteButton({ onDelete }) {
    const [confirm, setConfirm] = useState(false);
    if (confirm) return (
        <div className="flex items-center gap-1">
            <button onClick={onDelete} className="h-7 px-2 rounded-md bg-destructive text-destructive-foreground text-[11px] font-medium hover:bg-destructive/90">Yes</button>
            <button onClick={() => setConfirm(false)} className="h-7 px-2 rounded-md border border-input text-[11px] font-medium hover:bg-muted">No</button>
        </div>
    );
    return (
        <button onClick={() => setConfirm(true)} title="Delete"
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
        </button>
    );
}

function FormModal({ open, onClose, onSubmit, initialData, loading }) {
    const dispatch = useDispatch();
    const categories = useSelector((s) => s.feedback?.categories ?? []);
    const sections = useSelector((s) => s.section?.items ?? s.academic?.sections?.list ?? []);
    const subjects = useSelector((s) => s.subject?.items ?? []);
    const faculty = useSelector((s) => s.faculty?.list ?? s.faculty?.items ?? []);

    const currentYear = new Date().getFullYear();
    const YEARS = Array.from({ length: 5 }, (_, i) => { const y = currentYear - 2 + i; return `${y}-${y + 1}`; });

    const BLANK = {
        title: "", category_id: "", start_date: "", end_date: "",
        faculty_id: "", subject_id: "", section_id: "",
        is_active: true, all_students: false,
    };
    const [form, setForm] = useState(BLANK);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;
        setErrors({});
        if (initialData) {
            setForm({
                title: initialData.title || "",
                category_id: initialData.category_id || "",
                start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().slice(0, 10) : "",
                end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().slice(0, 10) : "",
                faculty_id: initialData.faculty_id || initialData.faculty?.id || "",
                subject_id: initialData.subject_id || initialData.subject?.id || "",
                section_id: initialData.section_id || initialData.section?.id || "",
                is_active: initialData.is_active ?? true,
                all_students: initialData.all_students ?? false,
            });
        } else {
            setForm(BLANK);
        }
    }, [open, initialData]);

    useEffect(() => {
        if (open) {
            if (!categories.length) dispatch(getCategories());
            if (!sections.length) dispatch(sectionActions.getAll({ limit: 500 }));
            if (!subjects.length) dispatch(subjectActions.getAll({ limit: 500 }));
            if (!faculty.length) dispatch(fetchFaculty({ limit: 200 }));
        }
    }, [open]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const handleSubmit = () => {
        const e = {};
        if (!form.title.trim()) e.title = "Required";
        if (!form.category_id) e.category_id = "Required";
        if (!form.start_date) e.start_date = "Required";
        if (!form.end_date) e.end_date = "Required";
        if (Object.keys(e).length) return setErrors(e);
        const payload = { ...form };
        Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
        onSubmit(payload);
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
                    <h2 className="text-lg font-semibold">{initialData ? "Edit Form" : "New Feedback Form"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
                    <F label="Title" error={errors.title} required>
                        <input className={inp(errors.title)} value={form.title} onChange={set("title")} placeholder="e.g. End Semester Teaching Feedback" />
                    </F>
                    <F label="Category" error={errors.category_id} required>
                        <select className={sel(errors.category_id)} value={form.category_id} onChange={set("category_id")}>
                            <option value="">Select category…</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                        </select>
                    </F>
                    <div className="grid grid-cols-2 gap-4">
                        <F label="Start Date" error={errors.start_date} required>
                            <input type="date" className={inp(errors.start_date)} value={form.start_date} onChange={set("start_date")} />
                        </F>
                        <F label="End Date" error={errors.end_date} required>
                            <input type="date" className={inp(errors.end_date)} value={form.end_date} onChange={set("end_date")} />
                        </F>
                    </div>
                    <div className="pt-2 border-t border-border space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target (optional)</p>
                        <F label="Faculty">
                            <select className={sel()} value={form.faculty_id} onChange={set("faculty_id")}>
                                <option value="">All Faculty / Not specified</option>
                                {faculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </F>
                        <F label="Subject">
                            <select className={sel()} value={form.subject_id} onChange={set("subject_id")}>
                                <option value="">All Subjects / Not specified</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                        </F>
                        <F label="Section">
                            <select className={sel()} value={form.section_id} onChange={set("section_id")}>
                                <option value="">All Sections</option>
                                {sections.map((s) => <option key={s.id} value={s.id}>{s.course?.program?.name} › {s.course?.name} › Sec {s.name} · Sem {s.semester}</option>)}
                            </select>
                        </F>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="rounded" />
                                <span>Active</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="checkbox" checked={form.all_students} onChange={set("all_students")} className="rounded" />
                                <span>All Students</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="px-6 pb-5 flex gap-3 shrink-0 border-t border-border pt-4">
                    <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
                        {initialData ? "Save Changes" : "Create Form"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Action Taken Modal ────────────────────────────────────────
function ActionTakenModal({ open, onClose, form, onSave }) {
    const [value, setValue] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (open) setValue(form?.action_taken || ""); }, [open, form]);
    if (!open || !form) return null;
    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosInstance.patch(`/feedback/forms/${form.id}/action`, { action_taken: value.trim() || null });
            notify.success("Action saved");
            onSave(value.trim() || null);
            onClose();
        } catch (err) { notify.error(err.response?.data?.message || "Failed to save"); }
        finally { setSaving(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold">Record Action Taken</h2>
                <p className="text-xs text-muted-foreground">Form: <span className="font-medium text-foreground">{form.title}</span></p>
                <textarea rows={4} value={value} onChange={(e) => setValue(e.target.value)}
                    placeholder="Describe what action was taken based on this feedback…"
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
                        Save Action
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Form Card ─────────────────────────────────────────────────
function FormCard({ form, onEdit, onDelete, onActionTaken }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const now = new Date();
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const isActive = form.is_active && start <= now && end >= now;
    const isExpired = end < now;
    const isPending = start > now;

    const status = !form.is_active ? { label: "Inactive", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" }
        : isExpired ? { label: "Expired", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
            : isPending ? { label: "Scheduled", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" }
                : { label: "Active", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };

    return (
        <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{form.title}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${status.cls}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
                        {form.category && <span className="bg-muted px-2 py-0.5 rounded-full">{form.category.name}</span>}
                        {form.faculty && <span>👤 {form.faculty.name}</span>}
                        {form.subject && <span>📖 {form.subject.name}</span>}
                        {form.section && <span>🏫 Sec {form.section.name}</span>}
                        <span>📅 {new Date(form.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} → {new Date(form.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <span className="font-medium text-foreground">{form._count?.responses ?? 0} responses</span>
                    </div>
                    {form.action_taken && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1.5 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-lg border border-green-200 dark:border-green-800">
                            ✓ Action: {form.action_taken}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onActionTaken(form)} title="Record action taken"
                        className="h-8 px-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-input transition-colors">
                        {form.action_taken ? "Edit Action" : "+ Action"}
                    </button>
                    <button onClick={() => onEdit(form)} title="Edit form"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    {!confirmDelete ? (
                        <button onClick={() => setConfirmDelete(true)} title="Delete"
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <button onClick={() => onDelete(form.id)}
                                className="h-8 px-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors">
                                Confirm
                            </button>
                            <button onClick={() => setConfirmDelete(false)}
                                className="h-8 px-2 rounded-lg border border-input text-xs font-medium hover:bg-muted transition-colors">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function FeedbackFormsPage() {
    const dispatch = useDispatch();
    const allForms = useSelector((s) => s.feedback?.forms ?? [], shallowEqual);
    const loading = useSelector((s) => s.feedback?.loading ?? false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [actionOpen, setActionOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const PER_PAGE = 15;

    useEffect(() => { dispatch(getForms({ limit: 500 })); }, []);

    const reload = () => dispatch(getForms({ limit: 500 }));

    const handleCreate = async (data) => {
        const r = await dispatch(createForm(data));
        if (createForm.fulfilled.match(r)) { notify.success("Form created"); setCreateOpen(false); reload(); }
        else notify.error(r.payload);
    };
    const handleEdit = async (data) => {
        const r = await dispatch(updateForm({ id: selected.id, data }));
        if (updateForm.fulfilled.match(r)) { notify.success("Form updated"); setEditOpen(false); setSelected(null); reload(); }
        else notify.error(r.payload);
    };
    const handleDelete = async (id) => {
        const r = await dispatch(deleteForm(id));
        if (deleteForm.fulfilled.match(r)) { notify.success("Deleted"); reload(); }
        else notify.error(r.payload);
    };

    const now = new Date();
    const getStatus = (f) => {
        if (!f.is_active) return { label: "Inactive", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" };
        if (new Date(f.end_date) < now) return { label: "Expired", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
        if (new Date(f.start_date) > now) return { label: "Scheduled", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
        return { label: "Active", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    };

    const filtered = allForms.filter((f) => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            f.title.toLowerCase().includes(q) ||
            f.category?.name.toLowerCase().includes(q) ||
            f.faculty?.name?.toLowerCase().includes(q) ||
            f.subject?.name?.toLowerCase().includes(q);
        if (!matchSearch) return false;
        const s = getStatus(f).label.toLowerCase();
        if (filter === "active") return s === "active";
        if (filter === "inactive") return s === "inactive";
        if (filter === "expired") return s === "expired";
        if (filter === "scheduled") return s === "scheduled";
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const counts = {
        all: allForms.length,
        active: allForms.filter((f) => getStatus(f).label === "Active").length,
        scheduled: allForms.filter((f) => getStatus(f).label === "Scheduled").length,
        expired: allForms.filter((f) => getStatus(f).label === "Expired").length,
        inactive: allForms.filter((f) => getStatus(f).label === "Inactive").length,
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Feedback Forms</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {allForms.length} forms · {counts.active} active · {counts.scheduled} scheduled
                    </p>
                </div>
                <button onClick={() => setCreateOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    New Form
                </button>
            </div>

            {/* Search + filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <input type="text" placeholder="Search title, category, faculty…" value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex gap-1 flex-wrap">
                    {[
                        ["all", "All", counts.all],
                        ["active", "Active", counts.active],
                        ["scheduled", "Scheduled", counts.scheduled],
                        ["expired", "Expired", counts.expired],
                        ["inactive", "Inactive", counts.inactive],
                    ].map(([v, l, c]) => (
                        <button key={v} onClick={() => { setFilter(v); setPage(1); }}
                            className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${filter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                            {l} <span className="opacity-60 ml-0.5">{c}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                        <tr>
                            {["Title", "Category", "Target", "Dates", "Responses", "Status", "Action"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading && paginated.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10">
                                <svg className="animate-spin h-5 w-5 mx-auto text-muted-foreground" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            </td></tr>
                        ) : paginated.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                                {search ? `No forms matching "${search}"` : "No forms yet. Create one!"}
                            </td></tr>
                        ) : paginated.map((form) => {
                            const st = getStatus(form);
                            return (
                                <tr key={form.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 max-w-[200px]">
                                        <p className="font-medium text-foreground truncate">{form.title}</p>
                                        {form.action_taken && (
                                            <p className="text-[10px] text-green-600 mt-0.5 truncate">✓ {form.action_taken}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-xs text-muted-foreground">{form.category?.name || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        <div className="space-y-0.5">
                                            {form.faculty && <p>👤 {form.faculty.name}</p>}
                                            {form.subject && <p>📖 {form.subject.name}</p>}
                                            {form.section && <p>🏫 Sec {form.section.name}</p>}
                                            {!form.faculty && !form.subject && !form.section && <p>All</p>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        <p>{new Date(form.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                                        <p>{new Date(form.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-sm font-semibold text-foreground">{form._count?.responses ?? 0}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => { setSelected(form); setActionOpen(true); }}
                                                title="Record action"
                                                className="h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-input transition-colors whitespace-nowrap">
                                                {form.action_taken ? "✎ Action" : "+ Action"}
                                            </button>
                                            <button onClick={() => { setSelected(form); setEditOpen(true); }}
                                                title="Edit"
                                                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <DeleteButton onDelete={() => handleDelete(form.id)} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                        <span className="text-xs text-muted-foreground">
                            {filtered.length} forms · page {page} of {totalPages}
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

            <FormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} loading={loading} />
            <FormModal open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} onSubmit={handleEdit} initialData={selected} loading={loading} />
            <ActionTakenModal open={actionOpen} onClose={() => { setActionOpen(false); setSelected(null); }} form={selected} onSave={reload} />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// FEEDBACK RESULTS PAGE  — avg rating + action_taken + export
// ════════════════════════════════════════════════════════════════
export function FeedbackResultsAdminPage() {
    const { form_id: urlFormId } = useParams();
    const dispatch = useDispatch();
    const rawResults = useSelector((s) => s.feedback?.results);
    const forms = useSelector((s) => s.feedback?.forms ?? []);
    const loading = useSelector((s) => s.feedback?.loading ?? false);
    const [selectedForm, setSelectedForm] = useState(urlFormId && urlFormId !== "undefined" ? urlFormId : "");

    // Normalize results — handle both flat shape and wrapped { success, data } shape
    const results = rawResults
        ? (rawResults.title ? rawResults                           // already flat
            : rawResults.data?.title ? rawResults.data               // wrapped one level
                : null)
        : null;
    const [actionOpen, setActionOpen] = useState(false);
    const [localActionTaken, setLocalActionTaken] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => { dispatch(getForms({ limit: 100 })); }, []);
    useEffect(() => {
        if (selectedForm) {
            dispatch(getFormResults ? getFormResults(selectedForm) : null);
            setLocalActionTaken(null);
        }
    }, [selectedForm]);

    // Compute overall avg rating across all rating questions
    const overallAvgRating = () => {
        if (!results?.responses?.length) return null;
        const allRatings = results.responses.flatMap((r) => r.answers).filter((a) => a.rating !== null && a.rating !== undefined).map((a) => a.rating);
        if (!allRatings.length) return null;
        return (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2);
    };

    const getRatingAvg = (question_id) => {
        const ratings = results?.responses?.flatMap((r) => r.answers).filter((a) => a.question_id === question_id && a.rating !== null).map((a) => a.rating) || [];
        if (!ratings.length) return null;
        return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    };
    const getTextAnswers = (question_id) => results?.responses?.flatMap((r) => r.answers).filter((a) => a.question_id === question_id && a.answer_text).map((a) => a.answer_text) || [];
    const getMCQCounts = (question_id) => {
        const answers = results?.responses?.flatMap((r) => r.answers).filter((a) => a.question_id === question_id && a.selected) || [];
        return answers.reduce((acc, a) => { acc[a.selected] = (acc[a.selected] || 0) + 1; return acc; }, {});
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await axiosInstance.get(`/feedback/forms/${selectedForm}/export`, { responseType: "blob" });
            const cd = res.headers["content-disposition"] || "";
            const name = cd.match(/filename="?([^"]+)"?/)?.[1] || `feedback_export.xlsx`;
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a"); a.href = url; a.download = name; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { notify.error("Export failed"); }
        finally { setExporting(false); }
    };

    const teachingForms = forms.filter((f) => f.category?.type === "TEACHING");
    const generalForms = forms.filter((f) => f.category?.type !== "TEACHING");
    const avgRating = overallAvgRating();
    const actionTaken = localActionTaken !== null ? localActionTaken : results?.action_taken;

    return (
        <div className="max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Feedback Results</h1>
                <p className="text-sm text-muted-foreground mt-1">View and export student feedback responses</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">Select a Feedback Form</p>
                <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-colors"
                    value={selectedForm} onChange={(e) => setSelectedForm(e.target.value)}>
                    <option value="">Select form to view results…</option>
                    {teachingForms.length > 0 && (
                        <optgroup label="── Teaching Feedback ──">
                            {teachingForms.map((f) => <option key={f.id} value={f.id}>{f.title}{f.faculty ? ` — ${f.faculty.name}` : ""}{f.subject ? ` · ${f.subject.code}` : ""}{f.section ? ` · Sec ${f.section.name}` : ""} ({f._count?.responses ?? 0} responses)</option>)}
                        </optgroup>
                    )}
                    {generalForms.length > 0 && (
                        <optgroup label="── General Feedback ──">
                            {generalForms.map((f) => <option key={f.id} value={f.id}>{f.title} ({f._count?.responses ?? 0} responses)</option>)}
                        </optgroup>
                    )}
                </select>
            </div>

            {selectedForm && (!results || results.id !== selectedForm) && loading && <div className="text-center py-16 text-sm text-muted-foreground">Loading results…</div>}

            {results && selectedForm && results.id === selectedForm && (
                <div className="space-y-5">
                    {/* Summary */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="font-semibold text-foreground text-lg">{results.title}</h2>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                    {results.category && <span className={`px-2 py-0.5 rounded-full font-medium ${results.category.type === "TEACHING" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{results.category.name}</span>}
                                    {results.faculty && <span>👤 {results.faculty.name}</span>}
                                    {results.subject && <span>📖 {results.subject.name} ({results.subject.code})</span>}
                                    {results.section && <span>🏫 Section {results.section.name}</span>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(results.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} → {new Date(results.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Overall avg rating badge */}
                                {avgRating && (
                                    <div className="text-center bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
                                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{avgRating}</p>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-500">Avg Rating</p>
                                        <div className="flex gap-0.5 justify-center mt-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <div key={s} className={`w-3 h-3 rounded-full ${parseFloat(avgRating) >= s ? "bg-yellow-400" : "bg-yellow-100 dark:bg-yellow-900"}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-foreground">{results._count?.responses ?? 0}</p>
                                    <p className="text-xs text-muted-foreground">Responses</p>
                                </div>
                            </div>
                        </div>

                        {/* Action taken section */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Action Taken</p>
                                    {actionTaken
                                        ? <p className="text-sm text-foreground bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">{actionTaken}</p>
                                        : <p className="text-sm text-muted-foreground italic">No action recorded yet</p>}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => setActionOpen(true)}
                                        className="h-8 px-3 rounded-lg border border-input bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                        {actionTaken ? "Edit" : "+ Add"} Action
                                    </button>
                                    <button onClick={handleExport} disabled={exporting}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">
                                        {exporting
                                            ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
                                        Export Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submissions table with student details */}
                    {results.responses?.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-border">
                                <p className="text-sm font-semibold text-foreground">Submissions ({results.responses.length})</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40">
                                            {["#", "Student", "Roll No", "Dept", "Section", "Batch", "Submitted At"].map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.responses.map((r, idx) => (
                                            <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-foreground text-sm">{r.student?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{r.student?.user?.email}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{r.student?.roll_number}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{r.student?.department?.name || "—"}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {r.student?.section?.name || "—"}
                                                    {r.student?.section?.batch && <span className="ml-1 text-muted-foreground/70">· {r.student.section.batch}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{r.student?.batch_year || "—"}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {new Date(r.submittedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Per-question analytics */}
                    {results.category?.questions?.map((q) => (
                        <div key={q.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${q.type === "TEXT" ? "bg-blue-100 text-blue-700" : q.type === "RATING" ? "bg-yellow-100 text-yellow-700" : "bg-purple-100 text-purple-700"}`}>{q.type}</span>
                                <p className="font-medium text-foreground text-sm">{q.question}</p>
                            </div>

                            {q.type === "RATING" && (() => {
                                const avg = getRatingAvg(q.id);
                                const ratings = results.responses?.flatMap((r) => r.answers).filter((a) => a.question_id === q.id && a.rating !== null).map((a) => a.rating) || [];
                                const dist = [1, 2, 3, 4, 5].map((s) => ({ star: s, count: ratings.filter((r) => r === s).length }));
                                const total = ratings.length;
                                return avg ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl font-bold text-foreground">{avg}</span>
                                            <div>
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <div key={s} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${parseFloat(avg) >= s ? "bg-yellow-400 text-yellow-900" : "bg-muted text-muted-foreground"}`}>{s}</div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{total} rating{total !== 1 ? "s" : ""}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            {[...dist].reverse().map(({ star, count }) => {
                                                const pct = total ? Math.round((count / total) * 100) : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-2 text-xs">
                                                        <span className="w-3 text-muted-foreground text-right">{star}</span>
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="w-16 text-muted-foreground">{count} ({pct}%)</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No ratings yet</p>;
                            })()}

                            {q.type === "TEXT" && (
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                    {getTextAnswers(q.id).length === 0
                                        ? <p className="text-sm text-muted-foreground">No answers yet</p>
                                        : getTextAnswers(q.id).map((text, i) => (
                                            <div key={i} className="text-sm text-foreground bg-muted/40 rounded-lg px-3 py-2.5 border border-border">"{text}"</div>
                                        ))}
                                </div>
                            )}

                            {q.type === "MCQ" && (() => {
                                const counts = getMCQCounts(q.id);
                                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                                return total > 0 ? (
                                    <div className="space-y-2">
                                        {q.options.map((opt) => {
                                            const count = counts[opt] || 0;
                                            const pct = total ? Math.round((count / total) * 100) : 0;
                                            return (
                                                <div key={opt}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-foreground font-medium">{opt}</span>
                                                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No answers yet</p>;
                            })()}
                        </div>
                    ))}
                </div>
            )}

            {!selectedForm && (
                <div className="text-center py-20 bg-card border border-border rounded-2xl">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="font-medium text-foreground">Select a feedback form above</p>
                    <p className="text-sm text-muted-foreground mt-1">Results and analytics will appear here</p>
                </div>
            )}

            {/* Action taken modal */}
            <ActionTakenModal
                open={actionOpen}
                onClose={() => setActionOpen(false)}
                form={results ? { ...results, id: selectedForm } : null}
                onSave={(val) => setLocalActionTaken(val)}
            />
        </div>
    );
}