// src/modules/feedback/pages/StudentFeedbackPage.jsx
import { useEffect, useState } from "react";
import { MessageSquare, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";

function FeedbackFormCard({ form, onSubmit }) {
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(form.submitted || false);

    const handleSubmit = async () => {
        const missing = form.questions?.filter((q) => q.is_required && !answers[q.id]);
        if (missing?.length) return notify.error(`Please answer all required questions`);
        setSubmitting(true);
        try {
            await axiosInstance.post(`/api/feedback/forms/${form.id}/submit`, {
                answers: Object.entries(answers).map(([question_id, val]) => ({
                    question_id,
                    ...(typeof val === "number" ? { rating: val } : { answer_text: val }),
                })),
            });
            setSubmitted(true);
            notify.success("Feedback submitted!");
            onSubmit?.();
        } catch (err) {
            notify.error(err.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const isExpired = new Date(form.end_date) < new Date();

    if (submitted) return (
        <div className="bg-card border border-green-200 rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 shrink-0" />
            <div>
                <p className="text-sm font-semibold">{form.title}</p>
                <p className="text-xs text-green-600 font-medium">Submitted ✓</p>
            </div>
        </div>
    );

    if (isExpired) return (
        <div className="bg-card border border-border rounded-2xl p-5 opacity-60 flex items-center gap-3">
            <Clock size={20} className="text-muted-foreground shrink-0" />
            <div>
                <p className="text-sm font-semibold">{form.title}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
            </div>
        </div>
    );

    return (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold">{form.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Due: {new Date(form.end_date).toLocaleDateString("en-IN")}
                    </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold shrink-0">Pending</span>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                {form.questions?.map((q) => (
                    <div key={q.id} className="space-y-2">
                        <p className="text-xs font-medium">
                            {q.question}
                            {q.is_required && <span className="text-destructive ml-1">*</span>}
                        </p>
                        {q.type === "RATING" ? (
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                                        className={`w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all ${answers[q.id] === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                                            }`}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        ) : q.type === "MCQ" ? (
                            <div className="space-y-1.5">
                                {q.options?.map((opt) => (
                                    <label key={opt} className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors ${answers[q.id] === opt ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                                        <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))} className="sr-only" />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${answers[q.id] === opt ? "border-primary" : "border-muted-foreground"}`}>
                                            {answers[q.id] === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
                                        </div>
                                        <span className="text-xs">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea rows={3} value={answers[q.id] || ""}
                                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                                placeholder="Your answer…"
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
                        )}
                    </div>
                ))}
            </div>

            <button onClick={handleSubmit} disabled={submitting}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Submit Feedback
            </button>
        </div>
    );
}

export default function StudentFeedbackPage() {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = () => {
        setLoading(true);
        axiosInstance.get("/api/feedback/student/forms")
            .then((r) => setForms(r.data?.data || r.data || []))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const pending = forms.filter((f) => !f.submitted && new Date(f.end_date) >= new Date());
    const submitted = forms.filter((f) => f.submitted);
    const expired = forms.filter((f) => !f.submitted && new Date(f.end_date) < new Date());

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquare size={20} /> Feedback Forms</h1>
                <p className="text-sm text-muted-foreground mt-1">Submit your feedback for assigned forms</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
            ) : error ? (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle size={15} /> Failed to load feedback forms.
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
                    <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No feedback forms assigned to you</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {pending.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending ({pending.length})</p>
                            {pending.map((f) => <FeedbackFormCard key={f.id} form={f} onSubmit={load} />)}
                        </div>
                    )}
                    {submitted.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Submitted ({submitted.length})</p>
                            {submitted.map((f) => <FeedbackFormCard key={f.id} form={f} />)}
                        </div>
                    )}
                    {expired.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expired ({expired.length})</p>
                            {expired.map((f) => <FeedbackFormCard key={f.id} form={f} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}