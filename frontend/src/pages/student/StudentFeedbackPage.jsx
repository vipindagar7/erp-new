import { useEffect, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { fetchMyForms, submitFeedback } from "../../redux/feedback/feedbackSlice.js";

import { cn } from "../../lib/utils.js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MessageSquareText, Clock, CheckCircle, Star, Loader2, ChevronRight } from "lucide-react";
import { notify } from "../../hooks/notify.js";

// ── Rating input ───────────────────────────────────────────────
function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 active:scale-95">
          <Star size={28} className={cn("transition-colors",
            n <= (hover || value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30 hover:text-yellow-300"
          )} />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {["","Poor","Fair","Average","Good","Excellent"][value]}
        </span>
      )}
    </div>
  );
}

// ── Form fill modal ────────────────────────────────────────────
function FillFormModal({ open, onClose, onSubmit, form, loading }) {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const questions = form?.category?.questions || [];

  useEffect(() => { if (open) { setAnswers({}); setStep(0); } }, [open, form]);

  if (!open || !form) return null;

  const setAnswer = (qId, field, value) =>
    setAnswers((a) => ({ ...a, [qId]: { ...a[qId], question_id: qId, [field]: value } }));

  const currentQ = questions[step];
  const isLast   = step === questions.length - 1;

  const canNext = () => {
    if (!currentQ?.is_required) return true;
    const a = answers[currentQ.id];
    if (currentQ.type === "RATING") return (a?.rating ?? 0) > 0;
    if (currentQ.type === "TEXT")   return !!a?.answer_text?.trim();
    if (currentQ.type === "MCQ")    return !!a?.selected;
    return true;
  };

  const handleSubmit = () => {
    const missing = questions.filter((q) => {
      if (!q.is_required) return false;
      const a = answers[q.id];
      if (q.type === "RATING") return !a?.rating;
      if (q.type === "TEXT")   return !a?.answer_text?.trim();
      if (q.type === "MCQ")    return !a?.selected;
      return false;
    });
    if (missing.length) return notify.error(`${missing.length} required question(s) not answered`);
    onSubmit(form.id, Object.values(answers));
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{form.title}</DialogTitle>
          <DialogDescription>
            {form.faculty && `Faculty: ${form.faculty.name}`}
            {form.subject && ` · ${form.subject.name}`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / Math.max(questions.length, 1)) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{step + 1}/{questions.length}</span>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto py-2">
          {currentQ ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                  Question {step + 1}
                  {currentQ.is_required && <span className="text-destructive ml-1">*</span>}
                </p>
                <p className="text-base font-medium text-foreground">{currentQ.question}</p>
              </div>

              {currentQ.type === "RATING" && (
                <RatingInput value={answers[currentQ.id]?.rating || 0}
                  onChange={(v) => setAnswer(currentQ.id, "rating", v)} />
              )}
              {currentQ.type === "TEXT" && (
                <Textarea rows={4} placeholder="Your answer…"
                  value={answers[currentQ.id]?.answer_text || ""}
                  onChange={(e) => setAnswer(currentQ.id, "answer_text", e.target.value)} />
              )}
              {currentQ.type === "MCQ" && (
                <div className="space-y-2">
                  {(currentQ.options || []).map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setAnswer(currentQ.id, "selected", opt)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                        answers[currentQ.id]?.selected === opt
                          ? "border-primary bg-primary/5 text-foreground font-medium"
                          : "border-border bg-card hover:border-primary/40 text-foreground"
                      )}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No questions in this form.</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-3 border-t border-border">
          <Button variant="outline" className="flex-1"
            onClick={() => step > 0 ? setStep((s) => s - 1) : onClose()}>
            {step === 0 ? "Cancel" : "← Back"}
          </Button>
          {isLast ? (
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || !canNext()}>
              {loading
                ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Submitting…</>
                : "Submit Feedback"}
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Next →
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Form card ──────────────────────────────────────────────────
function FormCard({ form, onFill }) {
  const deadline  = new Date(form.end_date);
  const now       = new Date();
  const daysLeft  = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
  const urgent    = daysLeft <= 2;

  return (
    <div className={cn(
      "bg-card border rounded-2xl p-5 space-y-4 transition-all",
      form.submitted
        ? "border-border opacity-70"
        : urgent
          ? "border-orange-300 dark:border-orange-800"
          : "border-border hover:border-primary/30"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{form.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {form.category && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {form.category.name}
              </span>
            )}
            {form.faculty && <span className="text-xs text-muted-foreground">👨‍🏫 {form.faculty.name}</span>}
            {form.subject && <span className="text-xs text-muted-foreground">📚 {form.subject.name}</span>}
          </div>
        </div>
        {form.submitted ? (
          <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
            <CheckCircle size={11} /> Submitted
          </span>
        ) : (
          <span className={cn(
            "shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full",
            urgent
              ? "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30"
              : "text-muted-foreground bg-muted"
          )}>
            <Clock size={11} /> {daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
          </span>
        )}
      </div>
      {!form.submitted && (
        <Button className="w-full h-9" onClick={() => onFill(form)}>
          Fill Feedback <ChevronRight size={14} className="ml-1" />
        </Button>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function StudentFeedbackPage() {
  const dispatch      = useDispatch();
  const myForms       = useSelector((s) => s.feedbackNew?.myForms       || [], shallowEqual);
  const actionLoading = useSelector((s) => s.feedbackNew?.actionLoading ?? false);
  const fetchError    = useSelector((s) => s.feedbackNew?.error         ?? null);
  const [fillForm,   setFillForm]   = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    dispatch(fetchMyForms()).then(() => setHasFetched(true)).catch(() => setHasFetched(true));
  }, []);

  const pending   = myForms.filter((f) => !f.submitted);
  const completed = myForms.filter((f) =>  f.submitted);

  const handleSubmit = async (form_id, answers) => {
    const r = await dispatch(submitFeedback({ form_id, answers }));
    if (submitFeedback.fulfilled.match(r)) {
      notify.success("Feedback submitted! Thank you.");
      setFillForm(null);
      dispatch(fetchMyForms());
    } else {
      notify.error(r.payload);
    }
  };

  // Show spinner until we've attempted the fetch
  const isLoading = !hasFetched || actionLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <MessageSquareText size={20} className="text-muted-foreground" /> Feedback
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Submit feedback for your courses and faculty</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : fetchError ? (
        <div className="text-center py-16">
          <MessageSquareText size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-destructive font-medium">Failed to load: {fetchError}</p>
        </div>
      ) : myForms.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquareText size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No feedback forms available right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Pending</p>
                <span className="text-[11px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                  {pending.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {pending.map((f) => <FormCard key={f.id} form={f} onFill={setFillForm} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Completed ({completed.length})</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {completed.map((f) => <FormCard key={f.id} form={f} onFill={() => {}} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <FillFormModal
        open={!!fillForm} onClose={() => setFillForm(null)}
        onSubmit={handleSubmit} form={fillForm} loading={actionLoading} />
    </div>
  );
}