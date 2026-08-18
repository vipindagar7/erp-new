// src/modules/adminss/faculty/pages/FacultyCareerPage.jsx
// Career history timeline for a single faculty (opens from faculty detail)
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Settings, DollarSign, Building2, User } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";

const ACTION_META = {
  PROMOTION: { label: "Promotion", icon: TrendingUp, color: "green" },
  DEMOTION: { label: "Demotion", icon: TrendingDown, color: "red" },
  DESIGNATION_CHANGE: { label: "Designation Change", icon: User, color: "blue" },
  SALARY_GRADE_CHANGE: { label: "Salary Grade Change", icon: DollarSign, color: "amber" },
  DEPARTMENT_CHANGE: { label: "Department Change", icon: Building2, color: "violet" },
  STATUS_CHANGE: { label: "Status Change", icon: Settings, color: "orange" },
  PROFILE_UPDATE: { label: "Profile Updated", icon: Settings, color: "gray" },
};

export default function FacultyCareerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.faculty.byId(id)),
      axiosInstance.get(EP.faculty.careerHistory(id)),
    ]).then(([fr, hr]) => {
      setFaculty(fr.data?.data);
      setHistory(hr.data?.data?.history || hr.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";
  const fmtTime = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.faculty.detail(id))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold">Career History</h1>
          <p className="text-sm text-muted-foreground">{faculty?.name} — {history.length} events</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-2xl">No career history yet</div>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-5 top-4 bottom-4 w-px bg-border" />
          {history.map((h, i) => {
            const meta = ACTION_META[h.action] || { label: h.action, icon: Settings, color: "gray" };
            const Icon = meta.icon;
            return (
              <div key={h.id || i} className="relative flex gap-4 pb-6">
                <div className={`relative z-10 w-10 h-10 rounded-full bg-${meta.color}-100 text-${meta.color}-600 flex items-center justify-center shrink-0 border-2 border-background`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-sm">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{fmtTime(h.createdAt || h.changed_at)}</p>
                  </div>
                  {h.reason && <p className="text-xs text-muted-foreground italic">"{h.reason}"</p>}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {h.prev_designation && <div><span className="text-muted-foreground">From:</span> {h.prev_designation}</div>}
                    {h.new_designation && <div><span className="text-muted-foreground">To:</span>   {h.new_designation}</div>}
                    {h.prev_status && <div><span className="text-muted-foreground">From:</span> {h.prev_status}</div>}
                    {h.new_status && <div><span className="text-muted-foreground">To:</span>   {h.new_status}</div>}
                    {h.prev_salary_grade && <div><span className="text-muted-foreground">From grade:</span> {h.prev_salary_grade}</div>}
                    {h.new_salary_grade && <div><span className="text-muted-foreground">To grade:</span>   {h.new_salary_grade}</div>}
                    {h.effective_date && <div className="col-span-2"><span className="text-muted-foreground">Effective:</span> {fmt(h.effective_date)}</div>}
                  </div>
                  {h.changed_by_name && <p className="text-xs text-muted-foreground">By: {h.changed_by_name}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}