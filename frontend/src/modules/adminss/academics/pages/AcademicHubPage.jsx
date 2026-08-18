// src/modules/academic/pages/AcademicHubPage.jsx
// Hub for all academic structure pages
import { useNavigate } from "react-router-dom";
import { Building2, FileText, Layers, BookOpen, Users, Award, ChevronRight } from "lucide-react";
import { CanDo } from "../../../../components/shared/PermGuard.jsx";

const MODULES = [
  { label:"Departments",   desc:"Manage departments",              icon:Building2, path:"/admin/departments",  perm:"departments.view", color:"bg-blue-50 text-blue-600 border-blue-100" },
  { label:"Programs",      desc:"Programs, branches, affiliations",icon:FileText,  path:"/admin/programs",     perm:"academic.view",    color:"bg-violet-50 text-violet-600 border-violet-100" },
  { label:"Sections",      desc:"Class sections management",       icon:Layers,    path:"/admin/sections",     perm:"academic.view",    color:"bg-indigo-50 text-indigo-600 border-indigo-100" },
  { label:"Subjects",      desc:"Subject catalog and curriculum",  icon:BookOpen,  path:"/admin/subjects",     perm:"curriculum.view",  color:"bg-cyan-50 text-cyan-600 border-cyan-100" },
  { label:"Students",      desc:"Student management",              icon:Users,     path:"/admin/students",     perm:"students.view",    color:"bg-green-50 text-green-600 border-green-100" },
];

export default function AcademicHubPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Academic Structure</h1>
        <p className="text-sm text-muted-foreground">Manage departments, programs, branches, sections and curriculum</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map(m => (
          <CanDo key={m.label} perm={m.perm}>
            <button onClick={() => navigate(m.path)}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left hover:shadow-md hover:-translate-y-0.5 transition-all group ${m.color}`}>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm shrink-0">
                <m.icon size={18}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{m.desc}</p>
              </div>
              <ChevronRight size={14} className="opacity-40 group-hover:opacity-100 shrink-0"/>
            </button>
          </CanDo>
        ))}
      </div>
    </div>
  );
}