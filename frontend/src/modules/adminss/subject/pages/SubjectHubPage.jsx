// src/modules/subject/pages/SubjectHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Upload, Download, History, AlertCircle, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES, withQuery } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

const QUICK_ACTIONS = [
  { label: "Add Subject", icon: Plus,     path: withQuery(ROUTES.subjects.list, { action: "create" }), perm: "subjects.create", color: "indigo" },
  { label: "Bulk Upload", icon: Upload,   path: ROUTES.subjects.list,    perm: "subject:bulk_upload", color: "violet" },
  { label: "Export",      icon: Download, path: ROUTES.subjects.list,    perm: "subjects.view",       color: "teal"   },
  { label: "History",     icon: History,  path: ROUTES.subjects.history,perm: "audit.view",          color: "amber"  },
];

const CAT_COLOR = {
  THEORY:    "bg-blue-100 text-blue-700",
  PRACTICAL: "bg-green-100 text-green-700",
  TRAINING:  "bg-amber-100 text-amber-700",
  OTHER:     "bg-muted text-muted-foreground",
};

const COLOR = {
  indigo: "bg-indigo-50 text-indigo-600", violet: "bg-violet-50 text-violet-600",
  teal:   "bg-teal-50 text-teal-600",     amber:  "bg-amber-50 text-amber-600",
};

const toArray = (res, ...keys) => {
  let d = res?.data?.data ?? res?.data ?? [];
  for (const k of keys) { if (d && typeof d === "object" && !Array.isArray(d)) d = d[k] ?? d; }
  return Array.isArray(d) ? d : [];
};

export default function SubjectHubPage() {
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.subjects.list, { params: { limit: 200 } }),
      axiosInstance.get(EP.subjects.stats),
    ])
      .then(([s, st]) => {
        setSubjects(toArray(s, "subjects"));
        setStats(st.data?.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const byCategory = ["THEORY","PRACTICAL","TRAINING","OTHER"].map((cat) => ({
    cat,
    subjects: subjects.filter((s) => (s.category || "OTHER") === cat),
  })).filter((g) => g.subjects.length > 0);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Subject Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all subjects — theory, practical, training.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <AlertCircle size={15} /> Could not load data.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Subjects", value: stats?.total     ?? subjects.length,                                    color: "indigo", path: ROUTES.subjects.list },
          { label: "Theory",         value: stats?.theory    ?? subjects.filter((s) => s.category === "THEORY").length,    color: "blue",   path: withQuery(ROUTES.subjects.list, { category: "THEORY" })    },
          { label: "Practical",      value: stats?.practical ?? subjects.filter((s) => s.category === "PRACTICAL").length, color: "green",  path: withQuery(ROUTES.subjects.list, { category: "PRACTICAL" }) },
          { label: "In Sections",    value: subjects.reduce((a, s) => a + (s._count?.sectionSubjects || 0), 0),            color: "teal",   path: ROUTES.sections.hub  },
        ].map(({ label, value, color, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 text-${color}-600`}>
              {loading ? <Loader2 size={20} className="animate-spin inline" /> : (value ?? "—")}
            </p>
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.filter((a) => isSuperAdmin || can(a.perm)).map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.label} onClick={() => navigate(action.path)}
                className="group bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl ${COLOR[action.color]} flex items-center justify-center`}><Icon size={18} /></div>
                <p className="text-xs font-medium text-gray-700">{action.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subjects by Category</h2>
          {can("subjects.create") && (
            <button onClick={() => navigate(withQuery(ROUTES.subjects.list, { action: "create" }))}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
              <Plus size={12} /> Add Subject
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : byCategory.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
            <BookOpen size={32} className="mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground">No subjects yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {byCategory.map(({ cat, subjects: subs }) => (
              <div key={cat} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLOR[cat] || CAT_COLOR.OTHER}`}>{cat}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{subs.length} subjects</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      {["Subject","Code","Credits","Used In"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr key={s.id} onClick={() => navigate(ROUTES.subjects.list)}
                        className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-sm">{s.name}</p>
                          {s.nickname && <p className="text-[10px] text-muted-foreground">{s.nickname}</p>}
                        </td>
                        <td className="px-4 py-2.5"><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{s.code}</code></td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.credits}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{s._count?.sectionSubjects ?? 0} sections</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coming Soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Syllabus Upload",   desc: "Attach PDF syllabus per subject" },
            { label: "Subject Analytics", desc: "Feedback scores per subject across sessions" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-dashed border-border rounded-2xl p-5 flex items-center gap-4 opacity-60">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <BookOpen size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}