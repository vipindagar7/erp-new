// src/modules/sessions/pages/SessionDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Layers, CheckCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";

export default function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.sessions.byId(id)),
      axiosInstance.get(EP.sessions.summary(id)).catch(() => ({ data: null })),
    ]).then(([sr, smr]) => {
      setSession(sr.data?.data);
      setSummary(smr.data?.data);
    }).catch(() => notify.error("Failed to load")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!session) return <div className="py-20 text-center text-sm text-muted-foreground">Not found.</div>;

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.sessions.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{session.name}</h1>
            {session.is_current && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Current</span>}
            {session.is_locked  && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Locked</span>}
          </div>
          <p className="text-sm text-muted-foreground">{fmt(session.start_date)} → {fmt(session.end_date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Students",   value: summary?.student_count ?? "—",  icon: Users,  color: "blue" },
          { label: "Sections",   value: summary?.section_count ?? "—",  icon: Layers, color: "indigo" },
          { label: "Enrollments",value: summary?.enrollment_count ?? "—",icon: CheckCircle, color: "green" },
          { label: "Departments",value: summary?.dept_count ?? "—",     icon: Users,  color: "violet" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Details</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{session.name}</p></div>
          <div><p className="text-xs text-muted-foreground">Start</p><p>{fmt(session.start_date)}</p></div>
          <div><p className="text-xs text-muted-foreground">End</p><p>{fmt(session.end_date)}</p></div>
          <div><p className="text-xs text-muted-foreground">Created</p><p>{fmt(session.createdAt)}</p></div>
          <div><p className="text-xs text-muted-foreground">Is Current</p><p className="font-medium">{session.is_current ? "Yes" : "No"}</p></div>
          <div><p className="text-xs text-muted-foreground">Locked</p><p>{session.is_locked ? "Yes" : "No"}</p></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// src/modules/sessions/pages/SessionHistoryPage.jsx
// ─────────────────────────────────────────────────────────────
export function SessionHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list)
      .then((r) => setSessions(r.data?.data?.sessions || r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.sessions.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold">Session History</h1>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>{["Session","Start","End","Students","Status"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">Loading…</td></tr>
            : sessions.map((s) => (
              <tr key={s.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.sessions.detail(s.id))}>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(s.start_date)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(s.end_date)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.is_current ? "bg-green-100 text-green-700" : s.is_locked ? "bg-gray-100 text-gray-600" : "bg-muted text-muted-foreground"}`}>
                    {s.is_current ? "Active" : s.is_locked ? "Locked" : "Past"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}