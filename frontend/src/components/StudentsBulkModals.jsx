import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  bulkPromoteStudents, bulkBlockStudents, bulkSetStatus,
  bulkDeleteStudents, bulkChangeSection, bulkDemoteStudents,
} from "../redux/student/studentSlice.js";
import { fetchSections } from "../redux/academic/academicSlice.js";
import axiosInstance from "../lib/axios.js";
import { cn } from "../lib/utils.js";
import MultiSectionPicker, { formatSection } from "./MultiSectionPicker.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowUp, ArrowDown, Loader2, AlertTriangle, Users, CheckCircle, XCircle,
  ShieldOff, ShieldCheck, UserX, UserCheck, GraduationCap,
  Trash2, ChevronRight, RotateCcw,
} from "lucide-react";
import { notify } from "../hooks/notify.js";


// ─────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────
const STATUS_META = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: UserCheck, desc: "Marks students as active in their current enrollment" },
  DETAINED: { label: "Detained", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: UserX, desc: "Detained students are skipped during promotions" },
  PASSED: { label: "Passed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: GraduationCap, desc: "Marks students as having passed — use for final semester clearance" },
  PROMOTED: { label: "Promoted", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: ArrowUp, desc: "Marks students as promoted (set automatically during promotion)" },
};

function ResultStats({ results, labels = ["Updated", "Failed"] }) {
  const updated = results?.updated?.length ?? results?.promoted?.length ?? 0;
  const skipped = results?.skipped?.length ?? 0;
  const failed = results?.failed?.length ?? 0;
  return (
    <div className={cn("grid gap-3", skipped > 0 ? "grid-cols-3" : "grid-cols-2")}>
      {[
        { label: labels[0], value: updated, cls: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" },
        skipped > 0 && { label: "Skipped", value: skipped, cls: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400" },
        { label: labels[1] || "Failed", value: failed, cls: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" },
      ].filter(Boolean).map(({ label, value, cls }) => (
        <div key={label} className={cn("rounded-xl p-3 text-center border", cls)}>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs">{label}</p>
        </div>
      ))}
    </div>
  );
}

function SkippedList({ items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-yellow-600 mb-1.5">Skipped</p>
      <div className="max-h-28 overflow-y-auto space-y-0.5">
        {items.map((s, i) => (
          <p key={i} className="text-xs text-muted-foreground">{s.name || s.id} — {s.reason}</p>
        ))}
      </div>
    </div>
  );
}

function FailedList({ items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-destructive mb-1.5">Failed</p>
      <div className="max-h-28 overflow-y-auto space-y-0.5">
        {items.map((s, i) => (
          <p key={i} className="text-xs text-muted-foreground">{s.id} — {s.reason}</p>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SELECT BY SECTION MODAL
// ─────────────────────────────────────────────────────────────
export function SelectBySectionModal({ open, onClose, onSelect }) {
  const sections = useSelector((s) => s.academic?.sections?.list ?? s.section?.items ?? []);
  const dispatch = useDispatch();
  const [sectionSel, setSectionSel] = useState(new Set());
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 500 })); }, []);
  useEffect(() => { if (open) setSectionSel(new Set()); }, [open]);

  const handleSelect = async () => {
    if (sectionSel.size === 0) return notify.error("Select at least one section");
    setLoading(true);
    try {
      const results = await Promise.all([...sectionSel].map((section_id) =>
        axiosInstance.get("/students", { params: { section_id, limit: 500 } })
          .then((r) => r.data.data?.students?.map((s) => s.id) || [])
      ));
      const unique = new Set(results.flat());
      onSelect(unique);
      notify.success(`${unique.size} students selected from ${sectionSel.size} section(s)`);
      onClose();
    } catch { notify.error("Failed to fetch students"); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users size={17} /> Select Students by Section</DialogTitle>
            <DialogDescription>All students in selected sections will be added to your selection.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <MultiSectionPicker sections={sections} selected={sectionSel} onChange={setSectionSel} maxHeight="max-h-72" groupByCourse />
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSelect} disabled={sectionSel.size === 0 || loading}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Select ({sectionSel.size} section{sectionSel.size !== 1 ? "s" : ""})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// GENERIC BULK ACTION MODAL
// Handles: Block, Unblock, Detain, Pass, Activate
// ─────────────────────────────────────────────────────────────
export function BulkActionModal({ open, onClose, onSuccess, action, ids = [] }) {
  const dispatch = useDispatch();
  const sections = useSelector((s) => s.academic?.sections?.list ?? s.section?.items ?? []);
  const [step, setStep] = useState("pick"); // pick | confirm | done
  const [sectionSel, setSectionSel] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // action config
  const cfg = {
    block: { label: "Block", icon: ShieldOff, color: "bg-red-600 hover:bg-red-700", warn: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400", confirmText: "Block login access. Students cannot log in.", btnLabel: "Block Students" },
    unblock: { label: "Unblock", icon: ShieldCheck, color: "bg-green-600 hover:bg-green-700", warn: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400", confirmText: "Restore login access for these students.", btnLabel: "Unblock Students" },
    detain: { label: "Detain", icon: UserX, color: "bg-orange-600 hover:bg-orange-700", warn: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400", confirmText: "Detained students are skipped during promotions.", btnLabel: "Mark as Detained" },
    pass: { label: "Mark Passed", icon: GraduationCap, color: "bg-blue-600 hover:bg-blue-700", warn: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400", confirmText: "Marks students as passed. Use for final semester clearance.", btnLabel: "Mark as Passed" },
    activate: { label: "Activate", icon: UserCheck, color: "bg-green-600 hover:bg-green-700", warn: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400", confirmText: "Sets enrollment status to ACTIVE.", btnLabel: "Mark as Active" },
    demote: { label: "Demote", icon: ArrowDown, color: "bg-orange-600 hover:bg-orange-700", warn: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400", confirmText: "Moves students back one semester. A new enrollment record is created.", btnLabel: "Demote Students" },
    re_detained: { label: "Re-Detained", icon: RotateCcw, color: "bg-red-600 hover:bg-red-700", warn: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400", confirmText: "Re-detains students who were detained previously (second time).", btnLabel: "Mark as Re-Detained" },
  }[action] || {};

  const Icon = cfg.icon || Users;
  // If ids already passed (row-level selection), skip pick step
  const hasPreselected = ids.length > 0;

  useEffect(() => {
    if (!open) return;
    setStep(hasPreselected ? "confirm" : "pick");
    setSelectedIds(hasPreselected ? ids : []);
    setResults(null); setRemarks(""); setSectionSel(new Set());
    if (!sections.length) dispatch(fetchSections({ limit: 500 }));
  }, [open, ids.length]);

  const handlePickNext = async () => {
    if (sectionSel.size === 0) return notify.error("Select at least one section");
    setLoading(true);
    try {
      const results = await Promise.all([...sectionSel].map((section_id) =>
        axiosInstance.get("/students", { params: { section_id, limit: 500 } })
          .then((r) => r.data.data?.students?.map((s) => s.id) || [])
      ));
      setSelectedIds([...new Set(results.flat())]);
      setStep("confirm");
    } catch { notify.error("Failed to fetch students"); }
    finally { setLoading(false); }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      let r;
      if (action === "block" || action === "unblock") {
        r = await dispatch(bulkBlockStudents({ ids: selectedIds, isBlocked: action === "block" }));
      } else if (action === "demote") {
        r = await dispatch(bulkDemoteStudents({ ids: selectedIds }));
      } else {
        const statusMap = { detain: "DETAINED", pass: "PASSED", activate: "ACTIVE", re_detained: "RE_DETAINED" };
        r = await dispatch(bulkSetStatus({ ids: selectedIds, status: statusMap[action], remarks }));
      }
      const payload = r.payload?.data ?? r.payload;
      if (r.error) { notify.error(r.payload || "Operation failed"); setLoading(false); return; }
      setResults(payload);
      setStep("done");
      onSuccess?.();
    } catch (err) { notify.error(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon size={17} /> Bulk {cfg.label}
            </DialogTitle>
            <DialogDescription>
              {step === "pick" && `Select sections whose students will be ${cfg.label.toLowerCase()}ed.`}
              {step === "confirm" && `${selectedIds.length} students will be ${cfg.label.toLowerCase()}ed.`}
              {step === "done" && "Operation complete."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* PICK step — section selector */}
          {step === "pick" && (
            <MultiSectionPicker sections={sections} selected={sectionSel} onChange={setSectionSel} maxHeight="max-h-80" groupByCourse />
          )}

          {/* CONFIRM step */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className={cn("p-3 border rounded-xl text-xs", cfg.warn)}>
                <p className="font-semibold">⚠ {cfg.confirmText}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{selectedIds.length}</p>
                  <p className="text-xs text-muted-foreground">students selected</p>
                </div>
                <Icon size={28} className="text-muted-foreground/30" />
              </div>
              {(action === "detain" || action === "pass" || action === "activate" || action === "re_detained") && (
                <div className="space-y-1.5">
                  <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)}
                    placeholder={action === "detain" ? "e.g. Attendance shortage" : action === "pass" ? "e.g. Final semester clearance" : action === "re_detained" ? "e.g. Re-detained due to repeat shortage" : "e.g. Re-activation after appeal"} />
                </div>
              )}
            </div>
          )}

          {/* DONE step */}
          {step === "done" && results && (
            <div className="space-y-4">
              <ResultStats results={results} labels={[cfg.label + "ed", "Failed"]} />
              <SkippedList items={results.skipped} />
              <FailedList items={results.failed} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3 justify-end">
          {step === "pick" && (<>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handlePickNext} disabled={sectionSel.size === 0 || loading}>
              {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}Next <ChevronRight size={13} className="ml-1" />
            </Button>
          </>)}
          {step === "confirm" && (<>
            {!hasPreselected && <Button variant="outline" onClick={() => setStep("pick")}>← Back</Button>}
            {hasPreselected && <Button variant="outline" onClick={onClose}>Cancel</Button>}
            <Button className={cfg.color} onClick={handleExecute} disabled={loading || selectedIds.length === 0}>
              {loading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Icon size={13} className="mr-1.5" />}
              {cfg.btnLabel} ({selectedIds.length})
            </Button>
          </>)}
          {step === "done" && <Button onClick={onClose}>Close</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// PROMOTE BY SECTION MODAL
// ─────────────────────────────────────────────────────────────
export function PromoteBySectionModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const sections = useSelector((s) => s.academic?.sections?.list ?? s.section?.items ?? []);
  const actionLoading = useSelector((s) => s.student?.actionLoading ?? false);
  const [sectionSel, setSectionSel] = useState(new Set());
  const [remarks, setRemarks] = useState("");
  const [step, setStep] = useState("pick");
  const [results, setResults] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 500 })); }, []);
  useEffect(() => { if (open) { setStep("pick"); setResults(null); setRemarks(""); setSectionSel(new Set()); setPreview([]); } }, [open]);

  const handleNext = async () => {
    if (sectionSel.size === 0) return notify.error("Select at least one section");
    setLoading(true);
    try {
      const previews = await Promise.all([...sectionSel].map(async (section_id) => {
        const sec = sections.find((s) => s.id === section_id);
        const res = await axiosInstance.get("/students", { params: { section_id, limit: 500 } });
        const studs = res.data.data?.students || [];
        const curSem = sec?.semester ?? 1;
        const nextSem = curSem + 1;
        const currentEnr = studs[0]?.enrollments?.find((e) => e.is_current);
        const curYear = currentEnr?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const [y1, y2] = curYear.split("-").map(Number);
        const nextYear = curSem % 2 === 0 ? `${y1 + 1}-${y2 + 1}` : curYear;
        return { section_id, name: sec?.name, format: sec ? formatSection(sec) : section_id, students: studs, ids: studs.map((s) => s.id), curSem, nextSem, curYear, nextYear, batch: sec?.batch };
      }));
      setPreview(previews);
      setStep("confirm");
    } catch (err) { notify.error("Failed to fetch students: " + err.message); }
    finally { setLoading(false); }
  };

  const totalStudents = preview.reduce((a, p) => a + p.ids.length, 0);

  const handlePromote = async () => {
    setLoading(true);
    try {
      const allIds = [...new Set(preview.flatMap((p) => p.ids))];
      const r = await dispatch(bulkPromoteStudents({ ids: allIds, remarks }));
      if (!bulkPromoteStudents.fulfilled.match(r)) { notify.error(r.payload || "Promotion failed"); setLoading(false); return; }
      const promoteResults = r.payload?.data ?? r.payload;
      const sectionUpdates = await Promise.allSettled(
        preview.map((p) =>
          axiosInstance.patch(`/sections/${p.section_id}`, { semester: p.nextSem })
            .then(() => ({ section_id: p.section_id, name: p.name, ok: true }))
            .catch((e) => ({ section_id: p.section_id, name: p.name, ok: false, error: e.message }))
        )
      );
      setResults({ ...promoteResults, sectionUpdates: sectionUpdates.map((r) => r.value ?? r.reason) });
      setStep("done");
      onSuccess?.();
    } catch (err) { notify.error(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowUp size={17} className="text-green-600" /> Promote by Section</DialogTitle>
            <DialogDescription>
              {step === "pick" && "Select sections to promote."}
              {step === "confirm" && `${totalStudents} students across ${preview.length} section(s) will be promoted.`}
              {step === "done" && "Promotion complete."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === "pick" && (
            <MultiSectionPicker sections={sections} selected={sectionSel} onChange={setSectionSel} maxHeight="max-h-80" groupByCourse />
          )}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="space-y-2">
                {preview.map((p) => (
                  <div key={p.section_id} className="bg-muted/30 border border-border rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.format}</p>
                        <p className="text-xs text-muted-foreground">{p.ids.length} students</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-muted-foreground">Sem {p.curSem} → <span className="font-semibold text-green-600">Sem {p.nextSem}</span></p>
                        {p.nextYear !== p.curYear && <p className="text-muted-foreground">{p.curYear} → <span className="font-semibold text-green-600">{p.nextYear}</span></p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{preview.length}</p><p className="text-xs text-muted-foreground">Sections</p></div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalStudents}</p><p className="text-xs text-green-600">To promote</p></div>
              </div>
              <div className="space-y-1.5">
                <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. End of semester promotion" />
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-orange-700 dark:text-orange-400">
                ⚠ Detained students will be skipped automatically.
              </div>
            </div>
          )}
          {step === "done" && results && (
            <div className="space-y-4">
              <ResultStats results={results} labels={["Promoted", "Failed"]} />
              {results.sectionUpdates?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Section Updates</p>
                  <div className="space-y-1.5">
                    {results.sectionUpdates.map((u, i) => (
                      <div key={i} className={cn("flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                        u?.ok ? "bg-green-50 dark:bg-green-950/20 text-green-700" : "bg-red-50 dark:bg-red-950/20 text-red-700")}>
                        {u?.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>{u?.name || u?.section_id}</span>
                        {!u?.ok && <span className="opacity-70">— {u?.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <SkippedList items={results.skipped} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3 justify-end">
          {step === "pick" && <><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleNext} disabled={sectionSel.size === 0 || loading}>{loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}Next →</Button></>}
          {step === "confirm" && <><Button variant="outline" onClick={() => setStep("pick")}>← Back</Button><Button onClick={handlePromote} disabled={loading || actionLoading} className="bg-green-600 hover:bg-green-700">{loading || actionLoading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <ArrowUp size={13} className="mr-1.5" />}Promote {totalStudents}</Button></>}
          {step === "done" && <Button onClick={onClose}>Close</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// INSTITUTE-WIDE PROMOTE MODAL
// ─────────────────────────────────────────────────────────────
export function InstituteWidePromoteModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const actionLoading = useSelector((s) => s.student?.actionLoading ?? false);
  const [step, setStep] = useState("warn");
  const [remarks, setRemarks] = useState("");
  const [confirm, setConfirm] = useState("");
  const [results, setResults] = useState(null);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("warn"); setResults(null); setRemarks(""); setConfirm("");
    axiosInstance.get("/students", { params: { limit: 1 } }).then((r) => setCount(r.data.data?.pagination?.total || 0)).catch(() => setCount("?"));
  }, [open]);

  const handlePromote = async () => {
    if (confirm !== "PROMOTE ALL") return notify.error('Type "PROMOTE ALL" to confirm');
    setLoading(true);
    try {
      let allIds = [], page = 1;
      while (true) {
        const res = await axiosInstance.get("/students", { params: { limit: 200, page } });
        const studs = res.data.data?.students || [];
        allIds = [...allIds, ...studs.map((s) => s.id)];
        if (studs.length < 200) break;
        page++;
      }
      const r = await dispatch(bulkPromoteStudents({ ids: allIds, remarks }));
      if (bulkPromoteStudents.fulfilled.match(r)) { setResults(r.payload?.data ?? r.payload); setStep("done"); onSuccess?.(); }
      else notify.error(r.payload);
    } catch (err) { notify.error(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle size={18} /> Institute-Wide Promotion</DialogTitle>
          <DialogDescription>Promotes ALL active students across ALL sections.</DialogDescription>
        </DialogHeader>
        {step === "warn" && (
          <div className="space-y-4 py-2">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">⚠ Major operation</p>
              <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-1 list-disc pl-4">
                <li>ALL ~{count} active students will be promoted</li>
                <li>Detained students will be skipped</li>
                <li>This cannot be undone in bulk</li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Annual promotion 2025" />
            </div>
            <div className="space-y-1.5">
              <Label>Type <strong>PROMOTE ALL</strong> to confirm</Label>
              <Input className="h-9 text-sm font-mono" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="PROMOTE ALL" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={confirm !== "PROMOTE ALL" || loading || actionLoading} onClick={handlePromote}>
                {loading || actionLoading ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Promoting…</> : <><ArrowUp size={13} className="mr-1.5" />Promote All</>}
              </Button>
            </div>
          </div>
        )}
        {step === "done" && results && (
          <div className="space-y-4 py-2">
            <ResultStats results={results} labels={["Promoted", "Failed"]} />
            <Button className="w-full" variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// BULK ACTIONS DROPDOWN — main entry point for toolbar
// Pass checkedIds (from row checkboxes) — empty = section-based mode
// ─────────────────────────────────────────────────────────────
export function BulkActionsMenu({ checkedIds = [], onSuccess, onClearSelection }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // action key
  const [modalIds, setModalIds] = useState([]);

  const openModal = (action) => {
    setModalIds(checkedIds);
    setModal(action);
    setOpen(false);
  };

  const ACTIONS = [
    { key: "promote", label: "Promote", icon: ArrowUp, color: "text-green-600", section: "Status", sectionBased: true },
    { key: "activate", label: "Mark Active", icon: UserCheck, color: "text-green-600", section: "Enrollment Status" },
    { key: "detain", label: "Mark Detained", icon: UserX, color: "text-orange-600", section: "Enrollment Status" },
    { key: "re_detained", label: "Mark Re-Detained", icon: RotateCcw, color: "text-red-600", section: "Enrollment Status" },
    { key: "pass", label: "Mark Passed", icon: GraduationCap, color: "text-blue-600", section: "Enrollment Status" },
    { key: "demote", label: "Demote", icon: ArrowDown, color: "text-orange-600", section: "Status" },
    { key: "block", label: "Block Login", icon: ShieldOff, color: "text-red-600", section: "Account Access" },
    { key: "unblock", label: "Unblock Login", icon: ShieldCheck, color: "text-green-600", section: "Account Access" },
    { key: "delete", label: "Delete", icon: Trash2, color: "text-red-600", section: "Danger", danger: true },
  ];

  const grouped = ACTIONS.reduce((acc, a) => { if (!acc[a.section]) acc[a.section] = []; acc[a.section].push(a); return acc; }, {});

  const countLabel = checkedIds.length > 0 ? ` (${checkedIds.length})` : " by Section";

  return (
    <>
      <div className="relative">
        <button onClick={() => setOpen((p) => !p)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">
          <Users size={13} />
          Bulk Actions{countLabel}
          <ChevronRight size={12} className={cn("transition-transform", open && "rotate-90")} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-popover border border-border rounded-xl shadow-xl overflow-hidden py-1">
              {Object.entries(grouped).map(([section, actions]) => (
                <div key={section}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{section}</p>
                  {actions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button key={a.key} onClick={() => openModal(a.key)}
                        className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                          a.danger && "hover:bg-destructive/10")}>
                        <Icon size={14} className={a.color} />
                        <span className={a.danger ? "text-destructive" : "text-foreground"}>{a.label}</span>
                      </button>
                    );
                  })}
                  <div className="h-px bg-border mx-3 my-1" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Promote modal */}
      <PromoteBySectionModal
        open={modal === "promote"}
        onClose={() => setModal(null)}
        onSuccess={() => { setModal(null); onSuccess?.(); onClearSelection?.(); }}
      />

      {/* Generic status / block modals */}
      {["activate", "detain", "pass", "re_detained", "block", "unblock", "demote"].map((action) => (
        <BulkActionModal
          key={action}
          open={modal === action}
          action={action}
          ids={modalIds}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); onSuccess?.(); onClearSelection?.(); }}
        />
      ))}

      {/* Delete modal */}
      {modal === "delete" && (
        <BulkDeleteModal
          open
          ids={modalIds}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); onSuccess?.(); onClearSelection?.(); }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// BULK DELETE MODAL
// ─────────────────────────────────────────────────────────────
export function BulkDeleteModal({ open, ids = [], onClose, onSuccess }) {
  const dispatch = useDispatch();
  const sections = useSelector((s) => s.academic?.sections?.list ?? s.section?.items ?? []);
  const [step, setStep] = useState("confirm");
  const [selectedIds, setSelectedIds] = useState(ids);
  const [sectionSel, setSectionSel] = useState(new Set());
  const [confirm, setConfirm] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasPreselected = ids.length > 0;

  useEffect(() => {
    if (!open) return;
    setStep(hasPreselected ? "confirm" : "pick");
    setSelectedIds(ids); setConfirm(""); setResults(null); setSectionSel(new Set());
    if (!sections.length) dispatch(fetchSections({ limit: 500 }));
  }, [open]);

  const handlePickNext = async () => {
    if (sectionSel.size === 0) return notify.error("Select at least one section");
    setLoading(true);
    try {
      const res = await Promise.all([...sectionSel].map((sid) =>
        axiosInstance.get("/students", { params: { section_id: sid, limit: 500 } }).then((r) => r.data.data?.students?.map((s) => s.id) || [])
      ));
      setSelectedIds([...new Set(res.flat())]);
      setStep("confirm");
    } catch { notify.error("Failed"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (confirm !== "DELETE") return notify.error('Type "DELETE" to confirm');
    setLoading(true);
    try {
      const r = await dispatch(bulkDeleteStudents(selectedIds));
      const payload = r.payload?.data ?? r.payload;
      if (r.error) { notify.error(r.payload || "Delete failed"); setLoading(false); return; }
      setResults(payload);
      setStep("done");
      onSuccess?.();
    } catch (err) { notify.error(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 size={17} /> Bulk Delete Students</DialogTitle>
            <DialogDescription>This permanently deletes student accounts and all their data.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === "pick" && (
            <MultiSectionPicker sections={sections} selected={sectionSel} onChange={setSectionSel} maxHeight="max-h-72" groupByCourse />
          )}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-destructive">⚠ Permanent deletion</p>
                <p className="text-xs text-destructive/80 mt-1">{selectedIds.length} students and all their data (enrollments, responses, etc.) will be permanently deleted. This cannot be undone.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Type <strong>DELETE</strong> to confirm</Label>
                <Input className="h-9 text-sm font-mono" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
              </div>
            </div>
          )}
          {step === "done" && results && (
            <div className="space-y-4">
              <ResultStats results={results} labels={["Deleted", "Failed"]} />
              <FailedList items={results.failed} />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3 justify-end">
          {step === "pick" && <><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handlePickNext} disabled={sectionSel.size === 0 || loading}>{loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}Next →</Button></>}
          {step === "confirm" && (<>
            {!hasPreselected && <Button variant="outline" onClick={() => setStep("pick")}>← Back</Button>}
            {hasPreselected && <Button variant="outline" onClick={onClose}>Cancel</Button>}
            <Button variant="destructive" onClick={handleDelete} disabled={confirm !== "DELETE" || loading}>
              {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}Delete {selectedIds.length} Students
            </Button>
          </>)}
          {step === "done" && <Button onClick={onClose}>Close</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// DEFAULT EXPORT — single student promote modal (unchanged)
// ─────────────────────────────────────────────────────────────
export default function PromoteModal({ open, student, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  if (!open || !student) return null;

  const enr = student.enrollments?.find((e) => e.is_current) || student.studentEnrollments?.find((e) => e.is_current);
  const sec = student.section;

  const handle = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(`/students/${student.id}/promote`);
      notify.success(`${student.first_name} promoted to Sem ${(enr?.semester || 0) + 1}`);
      onSuccess?.(); onClose();
    } catch (err) { notify.error(err.response?.data?.message || "Promotion failed"); }
    finally { setLoading(false); }
  };

  const statusColor = { ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", DETAINED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", PASSED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", PROMOTED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUp size={17} className="text-green-600" /> Promote Student</DialogTitle></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{student.first_name?.[0] || "S"}</div>
            <div><p className="font-semibold text-foreground">{student.first_name} {student.last_name}</p><p className="text-xs text-muted-foreground font-mono">{student.roll_no || student.roll_number}</p></div>
          </div>
          {enr && (
            <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Enrollment</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sem {enr.semester} · {enr.academic_year}</p>
                  {sec && <p className="text-xs text-muted-foreground mt-0.5">{[sec.course?.program?.name, sec.course?.name].filter(Boolean).join(" › ")} › Sec {sec.name}</p>}
                </div>
                <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusColor[enr.status] || "bg-muted text-muted-foreground")}>{enr.status}</span>
              </div>
            </div>
          )}
          {enr && enr.semester < 8 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">Sem {enr.semester}</span>
              <ArrowUp size={14} className="text-green-600 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">Sem {enr.semester + 1}</span>
              {enr.semester % 2 === 0 && <span className="text-xs text-muted-foreground">· New academic year</span>}
            </div>
          )}
          {enr?.semester >= 8 && <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-orange-700 dark:text-orange-400">⚠ Final semester. Cannot promote further.</div>}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading || !enr || enr.semester >= 8} onClick={handle}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}↑ Promote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}