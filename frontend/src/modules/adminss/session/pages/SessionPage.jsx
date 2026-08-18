// frontend/src/pages/admin/SessionsPage.jsx
import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../../../lib/axios.js";
import { invalidateSessionCache } from "../../../../hooks/useCurrentSession.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { cn } from "../../../../lib/utils.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarDays, Plus, Lock, Unlock, Check, RefreshCw, Loader2, BarChart3, ChevronRight } from "lucide-react";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtRange = (s, e) => `${fmtDate(s)} – ${fmtDate(e)}`;

// ── Session form modal ─────────────────────────────────────────
function SessionModal({ open, onClose, onSave, saving }) {
    const [form, setForm] = useState({ name: "", label: "", start_date: "", end_date: "", notes: "" });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => { if (open) setForm({ name: "", label: "", start_date: "", end_date: "", notes: "" }); }, [open]);

    if (!open) return null;
    return (
        <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><CalendarDays size={16} /> New Academic Session</DialogTitle>
                    <DialogDescription>Create a new academic year session. All future data will be tagged to this session.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Session Name *</Label>
                            <Input className="h-9 text-sm" placeholder="2025-2026"
                                value={form.name} onChange={(e) => set("name", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Display Label</Label>
                            <Input className="h-9 text-sm" placeholder="Session 2025-26"
                                value={form.label} onChange={(e) => set("label", e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Start Date *</Label>
                            <Input type="date" className="h-9 text-sm"
                                value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>End Date *</Label>
                            <Input type="date" className="h-9 text-sm"
                                value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Notes</Label>
                        <Input className="h-9 text-sm" placeholder="Optional notes…"
                            value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400">
                        After creating, go to <strong>Set as Current</strong> to make this the active session. New enrollments, feedback, and curriculum entries will be tagged to the current session automatically.
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button className="flex-1" disabled={saving || !form.name || !form.start_date || !form.end_date}
                            onClick={() => onSave(form)}>
                            {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                            Create Session
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Summary panel ──────────────────────────────────────────────
function SummaryPanel({ sessionId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get(EP.sessions.summary(sessionId))
            .then((r) => setData(r.data?.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [sessionId]);

    if (loading) return <div className="p-6 flex justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
    if (!data) return null;

    const stats = [
        { label: "Total Enrollments", value: data.summary.enrollments.total },
        { label: "Active Enrollments", value: data.summary.enrollments.active },
        { label: "Section Subjects", value: data.summary.section_subjects },
        { label: "Curriculum Entries", value: data.summary.curriculum_entries },
        { label: "Section Changes", value: data.summary.section_changes },
    ];

    return (
        <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><BarChart3 size={16} /> Session Summary</DialogTitle>
                    <DialogDescription>{data.session.name} · {fmtRange(data.session.start_date, data.session.end_date)}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2 py-2">
                    {stats.map(({ label, value }) => (
                        <div key={label} className="p-3 bg-muted/30 rounded-xl">
                            <p className="text-2xl font-bold text-foreground">{value?.toLocaleString() || "0"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
                <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
            </DialogContent>
        </Dialog>
    );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function SessionsPage() {
    const { isSuperAdmin } = usePageGuard();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [summaryId, setSummaryId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await axiosInstance.get(EP.sessions.list);
            setSessions(r.data?.data || []);
        } catch { notify.error("Failed to load sessions"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (form) => {
        setSaving(true);
        try {
            await axiosInstance.post(EP.sessions.create, form);
            notify.success("Session created");
            setCreateOpen(false);
            load();
        } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
        finally { setSaving(false); }
    };

    const handleSetCurrent = async (id) => {
        try {
            await axiosInstance.patch(EP.sessions.setCurrent(id));
            invalidateSessionCache(); // force all pages to re-fetch current session
            notify.success("Session activated — all new data will be tagged to this session");
            load();
        } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    };

    const handleLock = async (id, isLocked) => {
        try {
            await axiosInstance.patch(EP.sessions.lock(id));
            notify.success(isLocked ? "Session unlocked" : "Session locked");
            load();
        } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        <CalendarDays size={20} className="text-muted-foreground" /> Academic Sessions
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Each session (e.g. 2024-2025) scopes all enrollments, subjects, feedback, and curriculum.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
                        <RefreshCw size={13} className={cn(loading && "animate-spin")} />
                    </Button>
                    {isSuperAdmin && (
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus size={13} className="mr-1.5" /> New Session
                        </Button>
                    )}
                </div>
            </div>

            {/* Info banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <p className="font-semibold">How sessions work</p>
                <p>Only one session can be <strong>current</strong> at a time. All new enrollments, feedback forms, curriculum entries, and section subject assignments are automatically tagged to the current session. Locking a session prevents any changes to it. Historical data is always viewable by filtering on session.</p>
            </div>

            {/* Sessions list */}
            <div className="space-y-3">
                {loading && sessions.length === 0 ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-card border border-border rounded-2xl animate-pulse" />
                    ))
                ) : sessions.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-border rounded-2xl space-y-3">
                        <CalendarDays size={32} className="text-muted-foreground/20 mx-auto" />
                        <p className="text-sm text-muted-foreground">No sessions yet</p>
                        {isSuperAdmin && (
                            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                                <Plus size={13} className="mr-1" /> Create first session
                            </Button>
                        )}
                    </div>
                ) : sessions.map((s) => (
                    <div key={s.id}
                        className={cn(
                            "bg-card border rounded-2xl p-4 transition-all",
                            s.is_current
                                ? "border-primary/30 shadow-sm shadow-primary/10 ring-1 ring-primary/20"
                                : "border-border"
                        )}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="space-y-1 min-w-0">
                                {/* Session name + badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-semibold text-foreground">{s.label || s.name}</h3>
                                    {s.is_current && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                                            <Check size={9} strokeWidth={3} /> Current
                                        </span>
                                    )}
                                    {s.is_locked && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                                            <Lock size={9} /> Locked
                                        </span>
                                    )}
                                </div>
                                {/* Date range */}
                                <p className="text-sm text-muted-foreground">{fmtRange(s.start_date, s.end_date)}</p>
                                {s.notes && <p className="text-xs text-muted-foreground italic">{s.notes}</p>}
                                {/* Quick counts */}
                                {s._count && (
                                    <div className="flex gap-3 pt-1">
                                        {[
                                            ["Enrollments", s._count.enrollments],
                                            ["Sec. Subjects", s._count.sectionSubjects],
                                            ["Curriculum", s._count.curriculumSubjects],
                                        ].map(([label, count]) => (
                                            <div key={label} className="text-xs text-muted-foreground">
                                                <strong className="text-foreground font-medium">{count || 0}</strong> {label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1"
                                    onClick={() => setSummaryId(s.id)}>
                                    <BarChart3 size={12} /> Summary
                                </Button>
                                {isSuperAdmin && !s.is_current && !s.is_locked && (
                                    <Button size="sm" variant="outline" className="h-8 text-xs"
                                        onClick={() => handleSetCurrent(s.id)}>
                                        <Check size={12} className="mr-1" /> Set Current
                                    </Button>
                                )}
                                {isSuperAdmin && !s.is_current && (
                                    <Button size="sm" variant="ghost"
                                        className={cn("h-8 w-8 p-0", s.is_locked ? "text-amber-600" : "text-muted-foreground")}
                                        onClick={() => handleLock(s.id, s.is_locked)}
                                        title={s.is_locked ? "Unlock session" : "Lock session"}>
                                        {s.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <SessionModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} saving={saving} />
            {summaryId && <SummaryPanel sessionId={summaryId} onClose={() => setSummaryId(null)} />}
        </div>
    );
}