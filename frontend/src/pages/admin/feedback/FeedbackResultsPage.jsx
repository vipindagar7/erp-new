import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getForms, getFormResults } from "../../../redux/slice.js";
import axiosInstance from "../../../lib/axios.js";
import BulkFeedbackUpload from "./BulkFeedbackUpload.jsx";
import { cn } from "@/lib/utils.js";
import { notify } from "../../../hooks/notify.js";

// ── Action Taken Modal ────────────────────────────────────────────────────────
function ActionTakenModal({ open, onClose, formId, currentValue, onSave }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setValue(currentValue || ""); }, [open, currentValue]);
  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/feedback/forms/${formId}/action`, { action_taken: value.trim() || null });
      notify.success("Action saved");
      onSave(value.trim() || null);
      onClose();
    } catch (err) { notify.error(err?.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Action Taken</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Document what action was taken after reviewing this feedback. Included in exports.</p>
        <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={5}
          placeholder="e.g. Discussed with faculty, arranged remedial classes, updated course material..."
          className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
            Save Action
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form Selector (shared, visual card grid) ──────────────────────────────────
function FormSelector({ forms, selectedForm, onSelect, loading }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatus] = useState("all");

  const now = new Date();

  const filtered = forms.filter((f) => {
    if (typeFilter !== "all" && f.category?.type !== typeFilter) return false;
    if (statusFilter === "open" && !(f.is_active && new Date(f.end_date) >= now)) return false;
    if (statusFilter === "closed" && (f.is_active && new Date(f.end_date) >= now)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.title?.toLowerCase().includes(q) ||
      f.faculty?.name?.toLowerCase().includes(q) ||
      f.subject?.name?.toLowerCase().includes(q) ||
      f.subject?.code?.toLowerCase().includes(q) ||
      f.section?.name?.toLowerCase().includes(q) ||
      f.category?.name?.toLowerCase().includes(q)
    );
  });

  const types = ["all", ...Array.from(new Set(forms.map((f) => f.category?.type).filter(Boolean)))];

  const selectedObj = forms.find((f) => f.id === selectedForm);

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="text"
            placeholder="Search by title, faculty, subject, section…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {/* Type pills */}
        <div className="flex gap-1 flex-wrap">
          {types.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 h-9 rounded-lg text-xs font-medium transition-colors",
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}>
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
        {/* Status pills */}
        <div className="flex gap-1">
          {[["all", "All"], ["open", "Open"], ["closed", "Closed"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)}
              className={cn(
                "px-3 h-9 rounded-lg text-xs font-medium transition-colors",
                statusFilter === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} form{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Selected form banner */}
      {selectedObj && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedObj.title}</p>
            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
              {selectedObj.faculty && <span>👤 {selectedObj.faculty.name}</span>}
              {selectedObj.subject && <span>📘 {selectedObj.subject.name}</span>}
              {selectedObj.section && <span>🏫 Sec {selectedObj.section.name}</span>}
              <span>· {selectedObj._count?.responses ?? 0} responses</span>
            </div>
          </div>
          <button onClick={() => onSelect("")}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors shrink-0">
            Change
          </button>
        </div>
      )}

      {/* Card grid — hidden if a form is selected */}
      {!selectedObj && (
        loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            No forms match your filters
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {filtered.map((f) => {
              const isOpen = f.is_active && new Date(f.end_date) >= now;
              const responses = f._count?.responses ?? 0;
              const typeColor = f.category?.type === "TEACHING"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : f.category?.type === "GENERAL"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
              return (
                <button key={f.id} onClick={() => onSelect(f.id)}
                  className="flex flex-col gap-2.5 p-4 bg-card border border-border rounded-2xl text-left hover:border-primary/40 hover:shadow-sm transition-all group">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {f.category?.type && (
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", typeColor)}>
                        {f.category.type}
                      </span>
                    )}
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      isOpen
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {isOpen ? "Open" : "Closed"}
                    </span>
                    {responses > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                        {responses} response{responses !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {f.title}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {f.faculty && <span className="text-[11px] text-muted-foreground">👤 {f.faculty.name}</span>}
                    {f.subject && <span className="text-[11px] text-muted-foreground">📘 {f.subject.name}</span>}
                    {f.section && <span className="text-[11px] text-muted-foreground">🏫 Sec {f.section.name}</span>}
                  </div>

                  {/* Date */}
                  <div className="flex items-center justify-between pt-1 border-t border-border mt-auto">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(f.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-[10px] text-primary font-medium group-hover:underline">
                      Select →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────────────────────
function ResultsTab({ selectedForm, forms }) {
  const dispatch = useDispatch();
  const feedbackState = useSelector((s) => s.feedback ?? {});
  const loading = feedbackState.loading ?? false;
  const rawRes = feedbackState.results;
  const results = rawRes?.title ? rawRes : rawRes?.data?.title ? rawRes.data : null;
  const [actionOpen, setActionOpen] = useState(false);
  const [localActionTaken, setLocalActionTaken] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (selectedForm) { dispatch(getFormResults(selectedForm)); setLocalActionTaken(null); }
  }, [selectedForm]);

  const actionTaken = localActionTaken !== null ? localActionTaken : results?.action_taken;

  const overallAvgRating = () => {
    if (!results?.responses?.length) return null;
    const all = results.responses.flatMap((r) => r.answers)
      .filter((a) => a.rating != null).map((a) => a.rating);
    return all.length ? (all.reduce((a, b) => a + b, 0) / all.length).toFixed(2) : null;
  };
  const getRatingAvg = (qid) => {
    const r = results?.responses?.flatMap((r) => r.answers)
      .filter((a) => a.question_id === qid && a.rating != null).map((a) => a.rating) || [];
    return r.length ? (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1) : null;
  };
  const getTextAnswers = (qid) =>
    results?.responses?.flatMap((r) => r.answers)
      .filter((a) => a.question_id === qid && a.answer_text).map((a) => a.answer_text) || [];
  const getMCQCounts = (qid) => {
    const ans = results?.responses?.flatMap((r) => r.answers)
      .filter((a) => a.question_id === qid && a.selected) || [];
    return ans.reduce((acc, a) => { acc[a.selected] = (acc[a.selected] || 0) + 1; return acc; }, {});
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axiosInstance.get(`/feedback/forms/${selectedForm}/export`, { responseType: "blob" });
      const cd = res.headers["content-disposition"] || "";
      const name = cd.match(/filename="?([^"]+)"?/)?.[1] || "feedback_export.xlsx";
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = name; a.click(); URL.revokeObjectURL(a.href);
      notify.success("Export downloaded");
    } catch { notify.error("Export failed"); }
    finally { setExporting(false); }
  };

  if (!selectedForm) return (
    <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
      <div className="text-4xl mb-3">📊</div>
      <p className="font-medium text-foreground">Select a form above to view results</p>
      <p className="text-sm text-muted-foreground mt-1">Analytics, student submissions and export will appear here</p>
    </div>
  );

  if (loading && !results) return (
    <div className="text-center py-16 text-sm text-muted-foreground flex items-center justify-center gap-2">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
      Loading results…
    </div>
  );

  if (!results) return (
    <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
      No results data available for this form.
    </div>
  );

  const avgRating = overallAvgRating();

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-foreground text-lg">{results.title}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              {results.category && (
                <span className={cn("px-2 py-0.5 rounded-full font-medium",
                  results.category.type === "TEACHING"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                )}>
                  {results.category.name}
                </span>
              )}
              {results.faculty && <span>👤 {results.faculty.name}</span>}
              {results.subject && <span>📖 {results.subject.name} ({results.subject.code})</span>}
              {results.section && <span>🏫 Section {results.section.name}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(results.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              {" → "}
              {new Date(results.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {avgRating && (
              <div className="text-center bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{avgRating}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">Avg Rating</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className={cn("w-3 h-3 rounded-full", parseFloat(avgRating) >= s ? "bg-yellow-400" : "bg-yellow-100 dark:bg-yellow-900")} />
                  ))}
                </div>
              </div>
            )}
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{results._count?.responses ?? results.responses?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Responses</p>
            </div>
          </div>
        </div>

        {/* Action taken */}
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

      {/* Submissions table */}
      {results.responses?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Submissions ({results.responses.length})</p>
            <p className="text-xs text-muted-foreground">Full student details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["#", "Student", "Roll No", "Department", "Program", "Course", "Section", "Batch", "Submitted At"].map((h) => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.responses.map((r, idx) => {
                  const s = r.student;
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground text-sm whitespace-nowrap">{s?.name}</p>
                        <p className="text-xs text-muted-foreground">{s?.user?.email}</p>
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{s?.roll_no || s?.roll_number || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{s?.department?.name || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{s?.program?.name || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{s?.course?.name || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{s?.section?.name || "—"}{s?.section?.semester && <span className="ml-1 opacity-60">Sem {s.section.semester}</span>}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{s?.section?.batch || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-question analytics */}
      {results.category?.questions?.map((q) => (
        <div key={q.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5",
              q.type === "TEXT" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                q.type === "RATING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            )}>{q.type}</span>
            <p className="font-medium text-foreground text-sm">{q.question}</p>
          </div>
          {q.type === "RATING" && (() => {
            const avg = getRatingAvg(q.id);
            const rats = results.responses?.flatMap((r) => r.answers).filter((a) => a.question_id === q.id && a.rating != null).map((a) => a.rating) || [];
            const dist = [1, 2, 3, 4, 5].map((s) => ({ star: s, count: rats.filter((r) => r === s).length }));
            const tot = rats.length;
            return avg ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-foreground">{avg}</span>
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                          parseFloat(avg) >= s ? "bg-yellow-400 text-yellow-900" : "bg-muted text-muted-foreground")}>{s}</div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{tot} rating{tot !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[...dist].reverse().map(({ star, count }) => {
                    const pct = tot ? Math.round((count / tot) * 100) : 0;
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

      <ActionTakenModal
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        formId={selectedForm}
        currentValue={actionTaken}
        onSave={(val) => setLocalActionTaken(val)}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeedbackResultsPage() {
  const { form_id: urlFormId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const feedbackState = useSelector((s) => s.feedback ?? {});
  const forms = feedbackState.forms ?? [];
  const loading = feedbackState.loading ?? false;

  // Shared form selection across tabs
  const [selectedForm, setSelectedForm] = useState(
    urlFormId && urlFormId !== "undefined" ? urlFormId : ""
  );
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    dispatch(getForms({ limit: 500 }));
  }, []);

  // Sync URL when form changes
  const handleSelect = (id) => {
    setSelectedForm(id);
    if (id) navigate(`/admin/feedback/results/${id}`, { replace: true });
  };

  const tabs = [
    { label: "📊 Results", id: "results" },
    { label: "📤 Bulk Submit", id: "bulk" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Feedback Results</h1>
        <p className="text-sm text-muted-foreground mt-0.5">View responses, analytics, export data and record actions taken</p>
      </div>

      {/* Shared form selector */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Select Form
          {forms.length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({forms.length} available)</span>}
        </p>
        <FormSelector
          forms={forms}
          selectedForm={selectedForm}
          onSelect={handleSelect}
          loading={loading && !forms.length}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {tabs.map((tab, i) => (
          <button key={tab.id} onClick={() => setActiveTab(i)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === i
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — both receive the same selectedForm */}
      {activeTab === 0 && <ResultsTab selectedForm={selectedForm} forms={forms} />}
      {activeTab === 1 && <BulkFeedbackUpload selectedFormId={selectedForm} forms={forms} />}
    </div>
  );
}