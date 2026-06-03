import { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../../../lib/axios.js";
import { useSelector, useDispatch } from "react-redux";
import { fetchPrograms, fetchCourses, fetchSections } from "../../../redux/academic/academicSlice.js";
import { cn } from "../../../lib/utils.js";
import { fmtSection, sectionOption } from "../../../lib/formatSection.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    BookOpen, Plus, Trash2, Loader2, RefreshCw, Copy, Zap, CheckCircle,
    ChevronDown, ChevronRight, GraduationCap, AlertTriangle, Info, Users,
    Download, Upload,
} from "lucide-react";
import { notify } from "../../../hooks/notify.js";

const TYPE_COLORS = {
    REGULAR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    ELECTIVE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    PRACTICAL: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    TRAINING: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    OTHER: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

// ── Add Subject to Curriculum Modal ──────────────────────────────────────────
function AddSubjectModal({ open, onClose, onSaved, courseId, programId, semester, subjects }) {
    const [sel, setSel] = useState("");
    const [type, setType] = useState("REGULAR");
    const [isCore, setIsCore] = useState(true);
    const [credits, setCredits] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (open) { setSel(""); setType("REGULAR"); setIsCore(true); setCredits(""); } }, [open]);

    const handle = async () => {
        if (!sel) { notify.error("Select a subject"); return; }
        setSaving(true);
        try {
            await axiosInstance.post("/curriculum", {
                program_id: programId, course_id: courseId, semester,
                subject_id: sel, type, is_core: isCore, credits: credits || undefined,
            });
            notify.success("Subject added to curriculum");
            onSaved();
        } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Plus size={16} /> Add Subject &mdash; Sem {semester}</DialogTitle>
                    <DialogDescription>Add a subject to the curriculum template for this semester.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Subject</Label>
                        <Select value={sel} onValueChange={setSel}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose subject…" /></SelectTrigger>
                            <SelectContent>
                                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["REGULAR", "ELECTIVE", "PRACTICAL", "TRAINING", "OTHER"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Credits override</Label>
                            <Input type="number" className="h-9 text-sm" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="Default from subject" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div><p className="text-sm font-medium">Core subject</p><p className="text-xs text-muted-foreground">Unchecked = elective choice</p></div>
                        <Switch checked={isCore} onCheckedChange={setIsCore} />
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={handle} disabled={saving || !sel}>
                            {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}Add Subject
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Copy Semester Modal ───────────────────────────────────────────────────────
function CopySemModal({ open, onClose, onSaved, courseId, programId, fromSem, maxSem }) {
    const [toSem, setToSem] = useState("");
    const [saving, setSaving] = useState(false);

    const handle = async () => {
        if (!toSem) { notify.error("Select target semester"); return; }
        setSaving(true);
        try {
            const r = await axiosInstance.post("/curriculum/copy-semester", {
                course_id: courseId, program_id: programId, from_semester: fromSem, to_semester: parseInt(toSem),
            });
            notify.success(`Copied ${r.data?.data?.length || 0} subjects to Sem ${toSem}`);
            onSaved();
        } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Copy size={16} /> Copy Sem {fromSem} subjects</DialogTitle>
                    <DialogDescription>Copy all subjects from Semester {fromSem} to another semester as a starting point.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Copy to Semester</Label>
                        <Select value={toSem} onValueChange={setToSem}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose…" /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: maxSem }, (_, i) => i + 1).filter((s) => s !== fromSem).map((s) => (
                                    <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={handle} disabled={saving || !toSem}>
                            {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}Copy Subjects
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Auto-Assign Panel ─────────────────────────────────────────────────────────
function AutoAssignPanel({ sections, courseId }) {
    const [sel, setSel] = useState("all");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const courseSections = sections.filter((s) => s.course_id === courseId);

    const handleAssign = async () => {
        setLoading(true);
        setResults(null);
        try {
            let r;
            if (sel === "all") {
                r = await axiosInstance.post("/curriculum/bulk-auto-assign", {
                    section_ids: courseSections.map((s) => s.id),
                });
                setResults(r.data?.data);
            } else {
                r = await axiosInstance.post(`/curriculum/auto-assign/${sel}`);
                setResults({ [sel]: r.data?.data });
            }
            notify.success("Auto-assign complete");
        } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
        finally { setLoading(false); }
    };

    return (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
                <Zap size={15} className="text-amber-500" />
                <p className="text-sm font-semibold">Auto-assign subjects to sections</p>
            </div>
            <p className="text-xs text-muted-foreground">Applies this course's curriculum template to section(s). Existing faculty assignments are preserved.</p>
            <div className="flex gap-2">
                <Select value={sel} onValueChange={setSel}>
                    <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All sections of this course</SelectItem>
                        {courseSections.map((s) => <SelectItem key={s.id} value={s.id}>{fmtSection(s)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAssign} disabled={loading || courseSections.length === 0}>
                    {loading ? <Loader2 size={13} className="animate-spin mr-1" /> : <Zap size={13} className="mr-1" />}Apply
                </Button>
            </div>
            {results && (
                <div className="space-y-1.5 pt-1">
                    {Object.entries(results).map(([sid, r]) => {
                        const sec = courseSections.find((s) => s.id === sid);
                        if (r?.error) return (
                            <div key={sid} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <AlertTriangle size={11} />{fmtSection(sec) || sid}: {r.error}
                            </div>
                        );
                        return (
                            <div key={sid} className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <CheckCircle size={11} />
                                <span className="font-medium">{fmtSection(sec) || sid}</span>
                                <span>&mdash; {r.assigned?.length || 0} assigned, {r.already_had?.length || 0} already set</span>
                                {r.message && <span className="text-muted-foreground">{r.message}</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Semester Block ────────────────────────────────────────────────────────────
function SemesterBlock({ sem, rows, courseId, programId, subjects, onRefresh, maxSem }) {
    const [open, setOpen] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [copOpen, setCopOpen] = useState(false);
    const [delId, setDelId] = useState(null);

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/curriculum/${id}`);
            notify.success("Removed from curriculum");
            onRefresh();
        } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
        setDelId(null);
    };

    return (
        <div className="border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className={cn("flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors", open && "border-b border-border bg-muted/10")} onClick={() => setOpen((p) => !p)}>
                <div className="flex items-center gap-2.5">
                    {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                    <GraduationCap size={15} className="text-primary" />
                    <span className="font-semibold text-foreground">Semester {sem}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{rows.length} subjects</span>
                </div>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setCopOpen(true)}>
                        <Copy size={11} />Copy to sem
                    </Button>
                    <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setAddOpen(true)}>
                        <Plus size={11} />Add
                    </Button>
                </div>
            </div>

            {/* Subjects table */}
            {open && (
                <div>
                    {rows.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                            <BookOpen size={24} className="text-muted-foreground/30 mx-auto" />
                            <p className="text-sm text-muted-foreground">No subjects defined for Semester {sem}</p>
                            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus size={12} className="mr-1" />Add first subject</Button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30">
                                <tr>
                                    {["Subject", "Code", "Type", "Credits", "Core", ""].map((h) => (
                                        <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.map((r) => (
                                    <tr key={r.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-4 py-2.5">
                                            <p className="font-medium text-foreground">{r.subject?.name}</p>
                                            {r.subject?.nickname && <p className="text-xs text-muted-foreground">{r.subject.nickname}</p>}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{r.subject?.code}</td>
                                        <td className="px-4 py-2.5"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_COLORS[r.type])}>{r.type}</span></td>
                                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.credits ?? r.subject?.credits ?? "\u2014"}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", r.is_core ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}>
                                                {r.is_core ? "Core" : "Elective"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                {delId === r.id ? (
                                                    <>
                                                        <button onClick={() => handleDelete(r.id)} className="text-xs text-destructive border border-destructive/30 px-2 py-1 rounded-md hover:bg-destructive/10">Confirm</button>
                                                        <button onClick={() => setDelId(null)} className="text-xs text-muted-foreground border border-border px-2 py-1 rounded-md hover:bg-muted">Cancel</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => setDelId(r.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <AddSubjectModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); onRefresh(); }} courseId={courseId} programId={programId} semester={sem} subjects={subjects} />
            <CopySemModal open={copOpen} onClose={() => setCopOpen(false)} onSaved={() => { setCopOpen(false); onRefresh(); }} courseId={courseId} programId={programId} fromSem={sem} maxSem={maxSem} />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function CurriculumPage() {
    const dispatch = useDispatch();
    const programs = useSelector((s) => s.academic?.programs?.list ?? s.program?.items ?? []);
    const courses = useSelector((s) => s.academic?.courses?.list ?? s.course?.items ?? []);
    const sections = useSelector((s) => s.academic?.sections?.list ?? s.section?.items ?? []);

    const [programId, setProgramId] = useState("");
    const [courseId, setCourseId] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [curriculum, setCurriculum] = useState({});
    const [loading, setLoading] = useState(false);
    const [maxSem, setMaxSem] = useState(8);

    useEffect(() => {
        dispatch(fetchPrograms({ limit: 200 }));
        dispatch(fetchCourses({ limit: 200 }));
        dispatch(fetchSections({ limit: 500, status: "ACTIVE" }));
        axiosInstance.get("/subjects", { params: { limit: 300 } })
            .then((r) => setSubjects(r.data?.data?.subjects || r.data?.data || []))
            .catch(() => { });
    }, []);

    const filteredCourses = programId ? courses.filter((c) => c.program_id === programId) : courses;

    const load = useCallback(async () => {
        if (!courseId) return;
        setLoading(true);
        try {
            const r = await axiosInstance.get("/curriculum", { params: { course_id: courseId } });
            setCurriculum(r.data?.data || {});
            // Determine max sem from existing or default 8
            const keys = Object.keys(r.data?.data || {}).map(Number);
            setMaxSem(Math.max(8, ...(keys.length ? keys : [8])));
        } catch (e) { notify.error("Failed to load curriculum"); }
        finally { setLoading(false); }
    }, [courseId]);

    useEffect(() => { load(); }, [load]);

    const selectedCourse = courses.find((c) => c.id === courseId);
    const selectedProgram = programs.find((p) => p.id === (selectedCourse?.program_id || programId));

    // All semesters to show - at least 1-8, plus any with data
    const semList = [...new Set([...Array.from({ length: maxSem }, (_, i) => i + 1), ...Object.keys(curriculum).map(Number)])].sort((a, b) => a - b);

    const fileRef = useRef();
    const [templateLoading, setTemplateLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    const handleDownloadTemplate = async () => {
        setTemplateLoading(true);
        try {
            const res = await axiosInstance.get("/curriculum/template", { responseType: "blob" });
            const cd = res.headers["content-disposition"] || "";
            const name = cd.match(/filename="?([^"]+)"?/)?.[1] || "curriculum_template.xlsx";
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a"); a.href = url; a.download = name; a.click();
            URL.revokeObjectURL(url);
            notify.success("Template downloaded — one sheet per course x semester");
        } catch (e) { notify.error(e.response?.data?.message || "Download failed"); }
        finally { setTemplateLoading(false); }
    };

    const handleBulkUpload = async (file) => {
        setUploadLoading(true);
        setUploadResults(null);
        try {
            const fd = new FormData(); fd.append("file", file);
            const res = await axiosInstance.post("/curriculum/bulk-upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setUploadResults(res.data?.data);
            notify.success(res.data?.message || "Bulk upload complete");
            load();
        } catch (e) { notify.error(e.response?.data?.message || "Upload failed"); }
        finally { setUploadLoading(false); }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2"><BookOpen size={20} className="text-muted-foreground" />Curriculum</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Define subjects per semester. Used to auto-assign subjects when promoting students.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load} disabled={!courseId}><RefreshCw size={13} className={cn(loading && "animate-spin")} /></Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={templateLoading}>
                        {templateLoading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
                        Curriculum Template
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadLoading}>
                        {uploadLoading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />}
                        Bulk Upload
                    </Button>
                    <input ref={fileRef} type="file" accept=".xlsx" className="sr-only"
                        onChange={(e) => { if (e.target.files[0]) { handleBulkUpload(e.target.files[0]); e.target.value = ""; } }} />
                </div>
            </div>

            {/* Upload results */}
            {uploadResults && (
                <div className={cn("p-3 rounded-xl border flex items-start gap-3 text-sm",
                    uploadResults.failed?.length > 0
                        ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                        : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800")}>
                    <CheckCircle size={15} className="text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                        <p className="font-medium text-foreground">
                            Upload complete — {uploadResults.created} added, {uploadResults.updated || 0} updated
                            {uploadResults.failed?.length > 0 && `, ${uploadResults.failed.length} failed`}
                            {uploadResults.sheets_processed != null && ` (${uploadResults.sheets_processed} sheets processed)`}
                        </p>
                        {uploadResults.failed?.length > 0 && (
                            <div className="max-h-24 overflow-y-auto space-y-0.5">
                                {uploadResults.failed.map((f, i) => (
                                    <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
                                        [{f.sheet}] {f.code || f.row || ""} — {f.reason}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setUploadResults(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                        <Trash2 size={12} />
                    </button>
                </div>
            )}

            {/* Info banner */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-3">
                <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <p className="font-semibold">How it works</p>
                    <p>1. Select a course and define its subjects per semester here (do this once).</p>
                    <p>2. When students are promoted, subjects for the new semester are auto-assigned to their section.</p>
                    <p>3. Faculty assignments already set on sections are preserved. Only new subject rows are created.</p>
                    <p>4. You can also manually trigger "Apply" to any section at any time.</p>
                </div>
            </div>

            {/* Course picker */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Select course</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label>Program</Label>
                        <Select value={programId || "__all__"} onValueChange={(v) => { setProgramId(v === "__all__" ? "" : v); setCourseId(""); setCurriculum({}); }}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All programs" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All programs</SelectItem>
                                {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Course <span className="text-destructive">*</span></Label>
                        <Select value={courseId} onValueChange={(v) => { setCourseId(v); setCurriculum({}); }}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select course…" /></SelectTrigger>
                            <SelectContent>
                                {filteredCourses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.program?.name || programs.find(p => p.id === c.program_id)?.name || ""})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Label>Max semesters</Label>
                    <div className="flex gap-1">
                        {[4, 6, 8, 10].map((n) => (
                            <button key={n} onClick={() => setMaxSem(n)} className={cn("h-7 px-2.5 rounded-lg text-xs font-medium transition-colors", maxSem === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{n}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Auto-assign panel */}
            {courseId && <AutoAssignPanel sections={sections} courseId={courseId} />}

            {/* Curriculum grid */}
            {!courseId ? (
                <div className="text-center py-20 bg-card border border-border rounded-2xl space-y-3">
                    <BookOpen size={36} className="text-muted-foreground/20 mx-auto" />
                    <p className="text-muted-foreground text-sm">Select a course to view or edit its curriculum</p>
                </div>
            ) : loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : (
                <div className="space-y-3">
                    {semList.map((sem) => (
                        <SemesterBlock
                            key={sem} sem={sem}
                            rows={curriculum[sem] || []}
                            courseId={courseId}
                            programId={selectedCourse?.program_id || programId}
                            subjects={subjects}
                            onRefresh={load}
                            maxSem={maxSem}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}