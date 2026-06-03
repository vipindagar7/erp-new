import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchForms, fetchFormResults, clearResults } from "../../redux/feedback/feedbackSlice.js";

import { cn } from "../../lib/utils.js";
import { Button } from "@/components/ui/button";
import { BarChart3, Star, CheckCircle, Clock, Loader2, ArrowLeft, Users } from "lucide-react";
import { notify } from "../../hooks/notify.js";

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} size={13} className={cn(n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />
      ))}
    </div>
  );
}

function RatingBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-14 text-right">{count} ({pct}%)</span>
    </div>
  );
}

export default function FacultyFeedbackPage() {
  const dispatch = useDispatch();
  const feedbackState =
  useSelector((s) => s.feedback) || {};

const formsState =
  feedbackState?.forms || {};

const list = formsState?.list || [];

const formsLoading =
  formsState?.loading || false;

const results =
  feedbackState?.results || null;

const actionLoading =
  feedbackState?.actionLoading || false;
  const { user } = useSelector((s) => s.auth);
  const [selected, setSelected] = useState(null);

  // Load forms for this faculty
  useEffect(() => {
    if (user?.faculty?.id) {
      dispatch(fetchForms({ faculty_id: user.faculty.id, limit: 50 }));
    } else {
      dispatch(fetchForms({ limit: 50 }));
    }
  }, [user]);

  const handleViewResults = (form) => {
    setSelected(form);
    dispatch(fetchFormResults(form.id));
  };

  const handleBack = () => {
    setSelected(null);
    dispatch(clearResults());
  };

  // ── Results view ──────────────────────────────────────────────
  if (selected && results) {
    const { question_stats, total_responses, total_eligible, response_rate } = results;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{selected.title}</h1>
            <p className="text-sm text-muted-foreground">{selected.category?.name}{selected.subject && ` · ${selected.subject.name}`}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Responses",    value: total_responses },
            { label: "Eligible",     value: total_eligible ?? "—" },
            { label: "Response Rate",value: response_rate !== null ? `${response_rate}%` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Action taken from admin */}
        {results.form?.action_taken && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle size={15} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Admin Action Taken</p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">{results.form.action_taken}</p>
              </div>
            </div>
          </div>
        )}

        {/* Questions — anonymous (no student names) */}
        <div className="space-y-4">
          {question_stats?.map((q, i) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Q{i + 1} · {q.type}</p>
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                </div>
                {q.avg_rating && (
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-bold text-foreground">{q.avg_rating}</p>
                    <Stars rating={q.avg_rating} />
                  </div>
                )}
              </div>

              {q.type === "RATING" && q.distribution && (
                <div className="space-y-2">
                  {[5,4,3,2,1].map((n) => (
                    <RatingBar key={n}
                      label={["","Poor","Fair","Average","Good","Excellent"][n]}
                      count={q.distribution[n] || 0}
                      total={q.total_answers}
                      color={["bg-red-400","bg-orange-400","bg-yellow-400","bg-lime-400","bg-green-500"][n-1]} />
                  ))}
                </div>
              )}
              {q.type === "MCQ" && q.distribution && (
                <div className="space-y-2">
                  {Object.entries(q.distribution).sort((a,b) => b[1]-a[1]).map(([opt, cnt]) => (
                    <RatingBar key={opt} label={opt} count={cnt} total={q.total_answers} color="bg-primary/60" />
                  ))}
                </div>
              )}
              {q.type === "TEXT" && (
                <div className="space-y-2">
                  {/* Faculty sees text answers but NOT linked to student names */}
                  {(q.text_answers || []).map((t, j) => (
                    <div key={j} className="text-sm bg-muted/50 rounded-lg px-3 py-2 border border-border">{t}</div>
                  ))}
                  {(!q.text_answers?.length) && <p className="text-xs text-muted-foreground">No text responses</p>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{q.total_answers} response{q.total_answers !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Forms list ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BarChart3 size={20} className="text-muted-foreground" /> My Feedback
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Feedback forms assigned to you</p>
      </div>

      {formsLoading && (list?.length || 0) === 0 ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : (list?.length || 0) === 0 ? (
        <div className="text-center py-16">
          <BarChart3 size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No feedback forms assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list?.map((form) => {
            const now     = new Date();
            const isOpen  = now >= new Date(form.start_date) && now <= new Date(form.end_date);
            const expired = now > new Date(form.end_date);
            const responses = form._count?.responses ?? 0;
            return (
              <div key={form.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{form.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{form.category?.name}</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                    !form.is_active ? "bg-muted text-muted-foreground border-border" :
                    expired         ? "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400" :
                    isOpen          ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" :
                                      "bg-yellow-100 text-yellow-700 border-yellow-200"
                  )}>
                    {!form.is_active ? "Inactive" : expired ? "Expired" : isOpen ? "Open" : "Upcoming"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {form.subject && <p>📚 {form.subject.name}</p>}
                  {form.section && <p>🗂️ {form.section.name}</p>}
                  <p className="flex items-center gap-1.5"><Users size={11} />{responses} response{responses !== 1 ? "s" : ""}</p>
                </div>
                <Button size="sm" variant="outline" className="w-full h-8 text-xs"
                  onClick={() => handleViewResults(form)} disabled={actionLoading}>
                  {actionLoading && selected?.id === form.id
                    ? <Loader2 size={12} className="mr-1.5 animate-spin" />
                    : <BarChart3 size={12} className="mr-1.5" />}
                  View Results
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
