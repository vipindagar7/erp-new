// src/modules/curriculum/pages/CurriculumHubPage.jsx
import { useNavigate } from "react-router-dom";
import { BookOpen, Upload, Download, Settings, List, History } from "lucide-react";

const COLOR = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-green-50 text-green-600 border-green-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  teal: "bg-teal-50 text-teal-600 border-teal-100",
};
const ACTIONS = [
  { label: "View / Manage", icon: List, path: "/admin/curriculum/manage", color: "blue", desc: "View and edit curriculum subject-by-subject" },
  { label: "Download Template", icon: Download, path: "/admin/curriculum/manage", color: "green", desc: "Get Excel template for active sections only" },
  { label: "Bulk Upload", icon: Upload, path: "/admin/curriculum/manage", color: "violet", desc: "Upload filled template to set curriculum" },
  { label: "History", icon: History, path: "/admin/curriculum/history", color: "amber", desc: "View changes to curriculum over time" },
];

export default function CurriculumHubPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <BookOpen size={22} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Curriculum</h1>
          <p className="text-sm text-muted-foreground">Manage program/branch subject list per semester</p>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">How it works:</p>
        <p>Curriculum is defined at <strong>Program + Semester</strong> level. Each semester has a list of subjects (theory, lab, elective etc). Once set, sections auto-fetch their subjects from this curriculum.</p>
        <p className="text-xs text-blue-600 mt-1">Template only downloads <strong>ACTIVE</strong> sections. Inactive sections are listed in the Summary sheet.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map(({ label, icon: Icon, path, color, desc }) => (
          <button key={label} onClick={() => navigate(path)}
            className="text-left bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all group space-y-2">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${COLOR[color]}`}>
              <Icon size={18} />
            </div>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold">Setup Steps</p>
        {[
          { n: "1", t: "Select Program + Branch", d: "Choose the program (e.g. B.Tech) and branch (e.g. CSE)" },
          { n: "2", t: "Download Template", d: "Template has one sheet per active section, Sem 1–8 tables" },
          { n: "3", t: "Fill Subject Codes", d: "Enter subject codes from the Subjects (Reference) sheet" },
          { n: "4", t: "Upload", d: "Upload filled template — curriculum is saved automatically" },
          { n: "5", t: "Auto-assign to Sections", d: "Go to any Section → Subjects tab → Auto-fetch Curriculum" },
        ].map(({ n, t, d }) => (
          <div key={n} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
            <div><p className="text-sm font-medium">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}