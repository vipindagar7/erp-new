import { useState, useEffect } from "react";
import axiosInstance from "../lib/axios.js";
import { EP } from "../config/api.config.js";

import { cn } from "../lib/utils.js";
import MultiSectionPicker from "../components/MultiSectionPicker.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUp, Users, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { notify } from "../hooks/notify.js";
import { useSelector } from "react-redux";

// ── Results display ─────────────────────────────────────────────
function PromoteResults({ results }) {
  const [expanded, setExpanded] = useState({});
  // results can be single object or array of per-section objects
  const list = Array.isArray(results) ? results : [results];
  const totalPromoted = list.reduce((s, r) => s + (r.promoted?.length || 0), 0);
  const totalSkipped = list.reduce((s, r) => s + (r.skipped?.length || 0), 0);
  const totalFailed = list.reduce((s, r) => s + (r.failed?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-700 dark:text-green-400">{totalPromoted}</p>
          <p className="text-xs text-green-600">Promoted</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{totalSkipped}</p>
          <p className="text-xs text-yellow-600">Skipped</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-700 dark:text-red-400">{totalFailed}</p>
          <p className="text-xs text-red-600">Failed</p>
        </div>
      </div>

      {/* Per-section breakdown */}
      {list.map((r, i) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 text-sm font-medium text-foreground transition-colors">
            <span>{r.section_name || `Section ${i + 1}`}{r.course_name ? ` — ${r.course_name}` : ""}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-green-600">{r.promoted?.length || 0} ↑</span>
              <span className="text-xs text-yellow-600">{r.skipped?.length || 0} ⚠</span>
              {expanded[i] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </button>

          {expanded[i] && (
            <div className="px-4 py-3 space-y-3 divide-y divide-border">
              {r.promoted?.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <p className="text-xs font-semibold text-green-600 mb-1.5">✓ Promoted ({r.promoted.length})</p>
                  <div className="space-y-1">
                    {r.promoted.map((s, j) => (
                      <div key={j} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{s.name}</span>
                        <span className="text-muted-foreground">{s.from} → {s.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.skipped?.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-yellow-600 mb-1.5">⚠ Skipped ({r.skipped.length})</p>
                  {r.skipped.map((s, j) => (
                    <p key={j} className="text-xs text-muted-foreground">{s.name} — {s.reason}</p>
                  ))}
                </div>
              )}
              {r.failed?.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-destructive mb-1.5">✗ Failed ({r.failed.length})</p>
                  {r.failed.map((s, j) => (
                    <p key={j} className="text-xs text-muted-foreground">{s.name} — {s.reason}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROMOTE SECTIONS MODAL
// Works for single section OR multiple sections
// ══════════════════════════════════════════════════════════════
export function PromoteSectionsModal({ open, onClose, sections, initialSelected, onSuccess }) {
  const [step, setStep] = useState("pick"); // pick | confirm | done
  const [selected, setSelected] = useState(new Set());
  const [counts, setCounts] = useState({});
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setResults(null);
    setRemarks("");
    setSelected(initialSelected ? new Set(initialSelected) : new Set());
  }, [open, initialSelected]);

  // Fetch counts when moving to confirm step
  const handleNext = async () => {
    if (selected.size === 0) return notify.error("Select at least one section");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/sections/student-counts", { section_ids: [...selected] });
      const countsMap = {};
      res.data.data.forEach((c) => { countsMap[c.id] = c; });
      setCounts(countsMap);
      setStep("confirm");
    } catch { notify.error("Failed to fetch student counts"); }
    finally { setLoading(false); }
  };

  const handlePromote = async () => {
    setLoading(true);
    try {
      let res;
      if (selected.size === 1) {
        const [id] = [...selected];
        res = await axiosInstance.post(`/sections/${id}/promote`, { remarks });
        setResults([{ ...res.data.data, section_name: counts[id]?.name, course_name: counts[id]?.course }]);
      } else {
        res = await axiosInstance.post("/sections/promote-multiple", { section_ids: [...selected], remarks });
        setResults(res.data.data);
      }
      setStep("done");
      onSuccess?.();
    } catch (err) {
      notify.error(err.response?.data?.message || "Promotion failed");
    } finally { setLoading(false); }
  };

  const totalActive = [...selected].reduce((s, id) => s + (counts[id]?.active || 0), 0);
  const totalDetained = [...selected].reduce((s, id) => s + (counts[id]?.detained || 0), 0);

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp size={18} className="text-green-600" /> Promote Sections
            </DialogTitle>
            <DialogDescription>
              {step === "pick" && "Select one or more sections to promote all active students."}
              {step === "confirm" && `${selected.size} section${selected.size !== 1 ? "s" : ""} selected — review before promoting.`}
              {step === "done" && "Promotion complete."}
            </DialogDescription>
          </DialogHeader>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {["pick", "confirm", "done"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                  step === s ? "bg-primary text-primary-foreground" :
                    ["pick", "confirm", "done"].indexOf(step) > i ? "bg-green-500 text-white" :
                      "bg-muted text-muted-foreground")}>
                  {["pick", "confirm", "done"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                <span className={cn("text-xs capitalize hidden sm:block",
                  step === s ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {s === "pick" ? "Select" : s === "confirm" ? "Review" : "Done"}
                </span>
                {i < 2 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Step 1: Pick sections */}
          {step === "pick" && (
            <MultiSectionPicker
              sections={sections}
              selected={selected}
              onChange={setSelected}
              maxHeight="max-h-80"
              groupByCourse={true}
            />
          )}

          {/* Step 2: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{selected.size}</p>
                  <p className="text-xs text-muted-foreground">Sections</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">{totalActive}</p>
                  <p className="text-xs text-green-600">Will be promoted</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{totalDetained}</p>
                  <p className="text-xs text-yellow-600">Will be skipped</p>
                </div>
              </div>

              {/* Per-section breakdown */}
              <div className="space-y-2">
                {[...selected].map((id) => {
                  const c = counts[id];
                  return c ? (
                    <div key={id} className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.course} · {c.program} · Sem {c.semester}</p>
                      </div>
                      <div className="text-right shrink-0 text-xs space-y-0.5">
                        <p className="text-green-600 font-medium">{c.active} active</p>
                        {c.detained > 0 && <p className="text-yellow-600">{c.detained} detained (skip)</p>}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="space-y-1.5">
                <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. End of semester promotion" />
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  ⚠ This will create new enrollment records for all {totalActive} active student{totalActive !== 1 ? "s" : ""}.
                  Detained students will be skipped and must be manually undetained first.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === "done" && results && <PromoteResults results={results} />}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3 justify-end">
          {step === "pick" && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleNext} disabled={selected.size === 0 || loading}>
                {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                Review ({selected.size}) →
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("pick")}>← Back</Button>
              <Button onClick={handlePromote} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading
                  ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Promoting…</>
                  : <><ArrowUp size={14} className="mr-1.5" />Promote {totalActive} Students</>}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={onClose}>Close</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION BULK STATUS MODAL
// ══════════════════════════════════════════════════════════════
export function SectionBulkStatusModal({ open, onClose, section, onSuccess }) {
  const [status, setStatus] = useState("DETAINED");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => { if (open) { setResults(null); setRemarks(""); setStatus("DETAINED"); } }, [open]);

  const STATUS_OPTS = [
    { value: "DETAINED", label: "Detain All", color: "text-red-600" },
    { value: "ACTIVE", label: "Mark All Active", color: "text-green-600" },
    { value: "PASSED", label: "Mark All Passed", color: "text-blue-600" },
    { value: "LEFT", label: "Mark All Left", color: "text-zinc-600" },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.patch(`/sections/${section.id}/bulk-status`, { status, remarks });
      setResults(res.data);
      notify.success(res.data.message);
      onSuccess?.();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  if (!open || !section) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Section Bulk Status</DialogTitle>
          <DialogDescription>Update status for all students in <strong>{section.name}</strong></DialogDescription>
        </DialogHeader>
        {results ? (
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 text-center border border-green-200 dark:border-green-800">
                <p className="text-xl font-bold text-green-700 dark:text-green-400">{results.data?.updated?.length || 0}</p>
                <p className="text-xs text-green-600">Updated</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-center border border-red-200 dark:border-red-800">
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{results.data?.failed?.length || 0}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              {STATUS_OPTS.map((o) => (
                <label key={o.value}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    status === o.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                  <input type="radio" className="sr-only" checked={status === o.value} onChange={() => setStatus(o.value)} />
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    status === o.value ? "border-primary" : "border-muted-foreground")}>
                    {status === o.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className={cn("text-sm font-medium", o.color)}>{o.label}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Reason…" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : null} Apply
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ChangeSectionModal({ open, onClose, onSuccess, student, selectedStudents }) {
  const sections = useSelector((s) => s.section?.items ?? s.academic?.sections?.list ?? []);
  const [sectionId, setSectionId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const isBulk = Array.isArray(selectedStudents) && selectedStudents.length > 0;
  const count = isBulk ? selectedStudents.length : 1;
  const label = isBulk ? `${count} students` : `${student?.first_name || "student"}`;

  useEffect(() => {
    if (open) { setSectionId(""); setRemarks(""); }
  }, [open]);

  const handleSubmit = async () => {
    if (!sectionId) return notify.error("Select a section");
    setLoading(true);
    try {
      if (isBulk) {
        await axiosInstance.post("/students/bulk-change-section", {
          student_ids: selectedStudents.map((s) => s.id),
          section_id: sectionId,
          remarks: remarks || undefined,
        });
        notify.success(`${count} students moved`);
      } else {
        await axiosInstance.patch(`/students/${student.id}/section`, {
          section_id: sectionId,
          remarks: remarks || undefined,
        });
        notify.success("Section changed");
      }
      onSuccess?.();
      onClose();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Section</DialogTitle>
          <DialogDescription>Move {label} to a different section.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>New Section *</Label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              <option value="">Select section…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name} · Sem {s.semester} · {s.course?.name || ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Remarks <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!sectionId || loading} onClick={handleSubmit}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />} Move
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}