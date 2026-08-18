// src/modules/feedback/pages/FacultyFeedbackPage.jsx
import { useEffect, useState } from "react";
import { MessageSquare, Loader2, AlertCircle, BarChart2, ChevronDown, ChevronRight } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";

function ResponseRow({ form }) {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadResults = async () => {
        if (results) return setOpen((v) => !v);
        setLoading(true);
        try {
            const r = await axiosInstance.get(`/api/feedback/forms/${form.id}/results`);
            setResults(r.data?.data ?? r.data);
            setOpen(true);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const responseCount = form._count?.responses ?? form.response_count ?? 0;

    return (
        <div className="border border-border rounded-xl overflow-hidden">
            <button onClick={loadResults}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors">
                {open ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{form.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {form.subject?.name && `${form.subject.name} · `}
                        {form.section?.name && `${form.section.name} · `}
                        Due: {new Date(form.end_date).toLocaleDateString("en-IN")}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{responseCount}</p>
                    <p className="text-[10px] text-muted-foreground">responses</p>
                </div>
                {loading && <Loader2 size={14} className="animate-spin text-muted-foreground shrink-0" />}
            </button>

            {open && results && (
                <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/10">
                    <div className="space-y-4 mt-3">
                        {results.questions?.map((q) => (
                            <div key={q.id} className="space-y-2">
                                <p className="text-xs font-semibold">{q.question}</p>
                                {q.type === "RATING" && q.avg_rating !== undefined && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(q.avg_rating / 5) * 100}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-primary">{Number(q.avg_rating).toFixed(1)}/5</span>
                                        <span className="text-xs text-muted-foreground">({q.count} responses)</span>
                                    </div>
                                )}
                                {q.type === "MCQ" && q.options_count && (
                                    <div className="space-y-1.5">
                                        {Object.entries(q.options_count).map(([opt, count]) => (
                                            <div key={opt} className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-24 truncate">{opt}</span>
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(count / responseCount) * 100}%` }} />
                                                </div>
                                                <span className="text-xs font-medium w-8 text-right">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {q.type === "TEXT" && q.sample_answers?.length > 0 && (
                                    <div className="space-y-1.5">
                                        {q.sample_answers.slice(0, 3).map((ans, i) => (
                                            <p key={i} className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg">"{ans}"</p>
                                        ))}
                                        {q.count > 3 && <p className="text-xs text-muted-foreground">+{q.count - 3} more responses</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FacultyFeedbackPage() {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        axiosInstance.get("/api/feedback/faculty/forms")
            .then((r) => setForms(r.data?.data || r.data || []))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    const active = forms.filter((f) => f.is_active && new Date(f.end_date) >= new Date());
    const past = forms.filter((f) => !f.is_active || new Date(f.end_date) < new Date());

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquare size={20} /> Feedback</h1>
                <p className="text-sm text-muted-foreground mt-1">View feedback forms assigned to you and their responses</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
            ) : error ? (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle size={15} /> Failed to load feedback forms.
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
                    <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No feedback forms found for you</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {active.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Active ({active.length})</p>
                            {active.map((f) => <ResponseRow key={f.id} form={f} />)}
                        </div>
                    )}
                    {past.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past ({past.length})</p>
                            {past.map((f) => <ResponseRow key={f.id} form={f} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}