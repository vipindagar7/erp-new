// src/modules/curriculum/pages/Curriculumpage.jsx
// Exact filename: Curriculumpage.jsx (matches router import)
import { useState, useEffect, useCallback } from "react";
import {
    Download, Upload, Loader2, Plus, Trash2, RefreshCw,
    ChevronDown, ChevronRight, BookOpen, X, Save, Info,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const SEMS = [1, 2, 3, 4, 5, 6, 7, 8];
const TYPE_COLOR = {
    REGULAR: "bg-blue-100 text-blue-700", LAB: "bg-green-100 text-green-700",
    ELECTIVE: "bg-violet-100 text-violet-700", SEMINAR: "bg-amber-100 text-amber-700",
    TRAINING: "bg-teal-100 text-teal-700", AUDIT: "bg-gray-100 text-gray-600",
    PROJECT: "bg-orange-100 text-orange-700", OTHER: "bg-rose-100 text-rose-700",
};
const TYPES = Object.keys(TYPE_COLOR);

// ── Add Subject Modal ─────────────────────────────────────────
function AddSubjectModal({ semester, programId, branchId, sessionId, onClose, onSave }) {
    const [subjectId, setSubjectId] = useState("");
    const [type, setType] = useState("REGULAR");
    const [isCore, setIsCore] = useState(true);
    const [credits, setCredits] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!subjectId) { notify.error("Select a subject"); return; }
        setSaving(true);
        try {
            await axiosInstance.post(EP.curriculum.create, {
                program_id: programId,
                branch_id: branchId || null,
                subject_id: subjectId,
                semester,
                type,
                is_core: isCore,
                credits: credits ? parseInt(credits) : null,
                session_id: sessionId || null,
            });
            notify.success("Subject added");
            onSave();
        } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Add Subject — Sem {semester}</h3>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Subject *</Label>
                    <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
                        subLabelKey="code" value={subjectId} onChange={v => setSubjectId(v)} placeholder="Search subject…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <select value={type} onChange={e => setType(e.target.value)} className={sel}>
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Credits</Label>
                        <Input type="number" value={credits} onChange={e => setCredits(e.target.value)} placeholder="Default" className="h-10" />
                    </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isCore} onChange={e => setIsCore(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Core/Mandatory subject</span>
                </label>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" disabled={saving || !subjectId} onClick={save}>
                        {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Semester block ────────────────────────────────────────────
function SemBlock({ sem, subjects, programId, branchId, sessionId, onRefresh }) {
    const [open, setOpen] = useState(sem <= 4);
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const remove = async (id, name) => {
        if (!confirm(`Remove "${name}" from Sem ${sem}?`)) return;
        setDeleting(id);
        try {
            await axiosInstance.delete(EP.curriculum.delete(id));
            notify.success("Removed");
            onRefresh();
        } catch { notify.error("Failed to remove"); }
        finally { setDeleting(null); }
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/10 text-left">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                    {sem}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">Semester {sem}</p>
                    <p className="text-xs text-muted-foreground">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</p>
                </div>
                {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
            </button>

            {open && (
                <div className="border-t border-border">
                    {subjects.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                            <p className="text-sm text-muted-foreground mb-3">No subjects defined for Sem {sem}</p>
                            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                                <Plus size={13} className="mr-1.5" />Add Subject
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <table className="w-full text-sm">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        {["#", "Subject", "Code", "Type", "Credits", "Core", ""].map(h => (
                                            <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {subjects.map((cs, i) => (
                                        <tr key={cs.id} className="hover:bg-muted/10">
                                            <td className="px-3 py-2 text-xs text-muted-foreground w-8">{cs.order ?? i + 1}</td>
                                            <td className="px-3 py-2 font-medium">{cs.subject?.name || "—"}</td>
                                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{cs.subject?.code || ""}</td>
                                            <td className="px-3 py-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${TYPE_COLOR[cs.type] || "bg-muted text-muted-foreground"}`}>
                                                    {cs.type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-muted-foreground">{cs.credits ?? cs.subject?.credits ?? "—"}</td>
                                            <td className="px-3 py-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${cs.is_core !== false ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                                                    {cs.is_core !== false ? "Core" : "Opt"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button onClick={() => remove(cs.id, cs.subject?.name)}
                                                    disabled={deleting === cs.id}
                                                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                                                    {deleting === cs.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-4 py-2 border-t border-border">
                                <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                                    <Plus size={12} className="mr-1" />Add Subject to Sem {sem}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {adding && (
                <AddSubjectModal
                    semester={sem} programId={programId} branchId={branchId} sessionId={sessionId}
                    onClose={() => setAdding(false)}
                    onSave={() => { setAdding(false); onRefresh(); }}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function CurriculumPage() {
    const [sessions, setSessions] = useState([]);
    const [sessionId, setSessionId] = useState("");
    const [programId, setProgramId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [curriculum, setCurriculum] = useState({});
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [autoLoading, setAutoLoading] = useState(false);

    useEffect(() => {
        axiosInstance.get(EP.sessions.list).then(r => {
            const list = r.data?.data || [];
            setSessions(list);
            const cur = list.find(s => s.is_current);
            if (cur) setSessionId(cur.id);
        }).catch(() => { });
    }, []);

    const load = useCallback(() => {
        if (!programId) { setCurriculum({}); return; }
        setLoading(true);
        axiosInstance.get(EP.curriculum.list, {
            params: {
                program_id: programId,
                branch_id: branchId || undefined,
                session_id: sessionId || undefined,
            },
        }).then(r => setCurriculum(r.data?.data || {}))
            .catch(() => setCurriculum({}))
            .finally(() => setLoading(false));
    }, [programId, branchId, sessionId]);

    useEffect(() => { load(); }, [load]);

    const downloadTemplate = async () => {
        setDownloading(true);
        try {
            const r = await axiosInstance.get(EP.curriculum.template, { responseType: "blob" });
            const cd = r.headers["content-disposition"] || "";
            const name = cd.match(/filename="?([^"]+)"?/)?.[1] || "curriculum-template.xlsx";
            const a = document.createElement("a"); a.href = URL.createObjectURL(r.data);
            a.download = name; a.click(); URL.revokeObjectURL(a.href);
            notify.success("Template downloaded");
        } catch { notify.error("Download failed"); }
        finally { setDownloading(false); }
    };

    const upload = async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true); setUploadResult(null);
        const fd = new FormData(); fd.append("file", file);
        try {
            const r = await axiosInstance.post(EP.curriculum.bulkUpload, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const d = r.data?.data;
            setUploadResult(d);
            notify.success(`${d?.created || 0} subjects saved, ${d?.failed?.length || 0} failed`);
            load();
        } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
        finally { setUploading(false); e.target.value = ""; }
    };

    const autoAssignAll = async () => {
        setAutoLoading(true);
        try {
            const r = await axiosInstance.post(EP.curriculum.bulkAutoAssign, {});
            const d = r.data?.data || {};
            const count = Object.keys(d).length;
            notify.success(`Auto-assigned to ${count} sections`);
        } catch { notify.error("Auto-assign failed"); }
        finally { setAutoLoading(false); }
    };

    const totalSubjects = Object.values(curriculum).flat().length;

    return (
        <div className="space-y-5 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <BookOpen size={20} className="text-primary" />
                    <h1 className="text-xl font-bold">Curriculum</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" disabled={downloading} onClick={downloadTemplate}>
                        {downloading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
                        Template
                    </Button>
                    <label>
                        <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={upload} />
                        <Button asChild variant="outline" size="sm" disabled={uploading}>
                            <span className="cursor-pointer">
                                {uploading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />}
                                Upload
                            </span>
                        </Button>
                    </label>
                    <Button variant="outline" size="sm" disabled={autoLoading} onClick={autoAssignAll}>
                        {autoLoading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <RefreshCw size={13} className="mr-1.5" />}
                        Auto-assign to All Sections
                    </Button>
                </div>
            </div>

            {/* Template note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
                <Info size={13} className="shrink-0 mt-0.5" />
                <span>Template downloads <strong>ACTIVE sections only</strong>. Inactive sections are listed in the Summary sheet but not included.</span>
            </div>

            {/* Filters — Program + Branch + Session */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter Curriculum</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Program — NOT course */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Program *</Label>
                        <SearchSelect
                            endpoint={EP.programs.list}
                            dataPath="programs"
                            valueKey="id"
                            labelKey="name"
                            subLabelKey="code"
                            value={programId}
                            onChange={v => { setProgramId(v); setBranchId(""); }}
                            placeholder="Select program…"
                        />
                        <p className="text-[10px] text-muted-foreground">e.g. B.Tech, MCA, MBA</p>
                    </div>
                    {/* Branch */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Branch <span className="text-muted-foreground">(optional)</span></Label>
                        <SearchSelect
                            endpoint={programId ? `${EP.branches?.list || EP.programs.list}?program_id=${programId}` : EP.branches?.list || ""}
                            dataPath="branches"
                            valueKey="id"
                            labelKey="name"
                            subLabelKey="code"
                            value={branchId}
                            onChange={v => setBranchId(v)}
                            placeholder={programId ? "All branches" : "Select program first"}
                            disabled={!programId}
                        />
                        <p className="text-[10px] text-muted-foreground">e.g. CSE, ECE, Mechanical</p>
                    </div>
                    {/* Session */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Session</Label>
                        <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={sel}>
                            <option value="">All sessions</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>{s.name || s.code}{s.is_current ? " ●" : ""}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* No program selected */}
            {!programId && (
                <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-2">
                    <BookOpen size={28} className="mx-auto text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground font-medium">Select a Program to view curriculum</p>
                    <p className="text-xs text-muted-foreground/70">Curriculum is defined at program level, optionally filtered by branch</p>
                </div>
            )}

            {/* Loading */}
            {programId && loading && (
                <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            )}

            {/* Semester-wise curriculum */}
            {programId && !loading && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {totalSubjects} total subjects across {SEMS.length} semesters
                        </p>
                    </div>
                    {SEMS.map(sem => (
                        <SemBlock
                            key={sem}
                            sem={sem}
                            subjects={curriculum[sem] || []}
                            programId={programId}
                            branchId={branchId}
                            sessionId={sessionId}
                            onRefresh={load}
                        />
                    ))}
                </div>
            )}

            {/* Upload result */}
            {uploadResult && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-semibold">Upload Results</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                            { label: "Created", value: uploadResult.created || 0, cls: "text-green-600" },
                            { label: "Failed", value: uploadResult.failed?.length || 0, cls: "text-red-600" },
                            { label: "Sheets Processed", value: uploadResult.sheets_processed || 0, cls: "text-blue-600" },
                        ].map(({ label, value, cls }) => (
                            <div key={label} className="bg-muted/20 rounded-xl p-3">
                                <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </div>
                    {uploadResult.failed?.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {uploadResult.failed.map((f, i) => (
                                <div key={i} className="text-xs bg-red-50 text-red-700 rounded-lg px-3 py-1.5">
                                    {f.sheet && <span className="font-medium">{f.sheet}</span>}
                                    {f.sem && <span> · Sem {f.sem}</span>}
                                    {f.code && <span> · {f.code}</span>}
                                    {" — "}{f.reason}
                                </div>
                            ))}
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setUploadResult(null)}>Dismiss</Button>
                </div>
            )}
        </div>
    );
}