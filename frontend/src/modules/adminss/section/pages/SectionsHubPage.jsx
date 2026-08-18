// src/modules/section/pages/SectionsHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers, History, Download, Upload,
  ChevronUp, GitBranch, AlertCircle, Loader2,Plus,Users,Settings,GraduationCap,ArrowRight
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES, withQuery } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { notify } from "../../../../hooks/notify.js";

const QUICK_ACTIONS = [
  { label: "All Sections", icon: Layers, path: ROUTES.sections.list, perm: "sections.view", color: "blue", desc: "Flat list — search, filter, manage" },
  { label: "New Section", icon: Plus, path: ROUTES.sections.new, perm: "sections.create", color: "green", desc: "Create a single section" },
  { label: "Bulk Upload", icon: Upload, path: ROUTES.sections.bulk, perm: "sections.create", color: "teal", desc: "Create sections via Excel template" },
  { label: "Bulk Promote/Demote", icon: ChevronUp, path: "/admin/sections/bulk-promote", perm: "students.promote", color: "violet", desc: "Multiselect sections → promote/demote" },
  { label: "Graduate Sections", icon: GraduationCap, path: "/admin/sections/graduate", perm: "students.promote", color: "emerald", desc: "Mark final-sem sections as PASSED" },
  { label: "Transfer Students", icon: ArrowRight, path: "/admin/sections/transfer", perm: "students.promote", color: "indigo", desc: "Move students between sections" },
  { label: "Bulk Status Change", icon: Settings, path: "/admin/students/bulk-status", perm: "students.update", color: "amber", desc: "Change student status via Excel template" },
  { label: "Bulk Student Ops", icon: Users, path: "/admin/students/bulk-ops", perm: "students.promote", color: "rose", desc: "Promote, status, section assign" },
  { label: "Section History", icon: History, path: ROUTES.sections.history, perm: "sections.view", color: "gray", desc: "All change logs across sections" },
];

const STATUS_CARDS = [
  { key: "active", label: "Active Sections", color: "green", path: withQuery(ROUTES.sections.list, { status: "ACTIVE" }) },
  { key: "inactive", label: "Inactive Sections", color: "slate", path: withQuery(ROUTES.sections.list, { status: "INACTIVE" }) },
];

const COLOR = {
  green: "bg-green-50 text-green-600", blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600", teal: "bg-teal-50 text-teal-600",
  amber: "bg-amber-50 text-amber-600", emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-50 text-slate-600",
};

export default function SectionsHubPage() {
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosInstance.get(EP.sections.stats)
      .then((r) => setStats(r.data?.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleTemplateDownload = async () => {
    try {
      const r = await axiosInstance.get(EP.sections.assignmentTemplate, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.data]));
      a.download = "section_assignment_template.xlsx"; a.click();
    } catch { notify.error("Download failed"); }
  };

  const handleBulkAssign = (file) => {
    const fd = new FormData(); fd.append("file", file);
    axiosInstance.post(EP.sections.assignmentUpload, fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => {
        const total = Object.values(r.data?.data || {}).reduce((a, s) => a + (s.assigned?.length || 0), 0);
        notify.success(`${total} students assigned`);
      })
      .catch(() => notify.error("Upload failed"));
  };

  return (
    <div className="space-y-8 max-w-6xl">

      <div>
        <h1 className="text-2xl font-bold">Section Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Create sections, assign subjects & faculty, manage students, promote/demote.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <AlertCircle size={15} /> Could not load stats.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sections", value: stats?.total, color: "blue", path: ROUTES.sections.list },
          { label: "Active", value: stats?.active, color: "green", path: withQuery(ROUTES.sections.list, { status: "ACTIVE" }) },
          { label: "Inactive", value: stats?.inactive, color: "slate", path: withQuery(ROUTES.sections.list, { status: "INACTIVE" }) },
          { label: "Semesters", value: stats?.bySemester?.length, color: "violet", path: ROUTES.sections.list },
        ].map(({ label, value, color, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${COLOR[color].split(" ")[1]}`}>
              {loading ? <Loader2 size={20} className="animate-spin inline" /> : (value ?? "—")}
            </p>
          </button>
        ))}
      </div>

      {stats?.bySemester?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sections by Semester</h2>
          <div className="flex gap-2 flex-wrap">
            {stats.bySemester.map((s) => (
              <button key={s.semester} onClick={() => navigate(withQuery(ROUTES.sections.list, { semester: s.semester }))}
                className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 hover:bg-muted/50 hover:border-primary/30 transition-all">
                <span className="text-xs font-semibold">Sem {s.semester}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{s.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Browse by Status</h2>
        <div className="grid grid-cols-2 gap-3">
          {STATUS_CARDS.map((card) => (
            <button key={card.key} onClick={() => navigate(card.path)}
              className={`group rounded-xl border bg-white p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 border-${card.color}-100`}>
              <div className={`w-9 h-9 rounded-lg ${COLOR[card.color]} flex items-center justify-center`}>
                <Layers size={18} />
              </div>
              <p className="text-sm font-semibold">{card.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.filter((a) => isSuperAdmin || can(a.perm)).map((action) => {
            const Icon = action.icon;
            const isDownload = action.path === "#template";
            const isBulk = action.path === "#bulk-assign";

            if (isDownload) return (
              <button key={action.label} onClick={handleTemplateDownload}
                className="group bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl ${COLOR[action.color]} flex items-center justify-center`}><Icon size={18} /></div>
                <p className="text-xs font-medium text-gray-700">{action.label}</p>
              </button>
            );

            if (isBulk) return (
              <label key={action.label}
                className="group bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2 cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${COLOR[action.color]} flex items-center justify-center`}><Icon size={18} /></div>
                <p className="text-xs font-medium text-gray-700">{action.label}</p>
                <input type="file" accept=".xlsx" className="sr-only" onChange={(e) => e.target.files[0] && handleBulkAssign(e.target.files[0])} />
              </label>
            );

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
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coming Soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Attendance Tracking", desc: "Daily attendance per section, alerts for low attendance" },
            { label: "Timetable", desc: "Section-wise timetable with room allocation" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-dashed border-border rounded-2xl p-5 flex items-center gap-4 opacity-60">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Layers size={18} className="text-muted-foreground" />
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