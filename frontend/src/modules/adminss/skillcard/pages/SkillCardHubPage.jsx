// src/modules/adminss/skillcard/pages/SkillCardHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Users, CheckCircle, BarChart2, Plus, Upload, ChevronRight, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const READINESS_COLOR = {
  FOUNDATIONAL:    "bg-amber-50 text-amber-700",
  JOB_READY:       "bg-blue-50 text-blue-700",
  PLACEMENT_READY: "bg-green-50 text-green-700",
};

export default function SkillCardHubPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Award size={20} className="text-primary"/>Student Skill Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track semester-wise training completion — IBM, Microsoft, Oracle, Google Cloud & more
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/admin/skill-card/bulk")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            <Upload size={14}/>Bulk Update
          </button>
          <button onClick={() => navigate("/admin/skill-card/init")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14}/>Initialize Cards
          </button>
        </div>
      </div>

      {/* Card structure info */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-primary">📋 Skill Card Structure (based on B.Tech 4-Year Plan)</p>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { year:"Year 1", sems:"Sem 1-2", total:"16 entries", desc:"Foundation Building" },
            { year:"Year 2", sems:"Sem 3-4", total:"16 entries", desc:"Programming Core"    },
            { year:"Year 3", sems:"Sem 5-6", total:"15 entries", desc:"Technical Depth"     },
            { year:"Year 4", sems:"Sem 7-8", total:"15 entries", desc:"Cloud + Placement"   },
          ].map(y => (
            <div key={y.year} className="bg-background rounded-xl p-2.5 text-center">
              <p className="font-bold text-primary">{y.year}</p>
              <p className="text-muted-foreground">{y.sems}</p>
              <p className="font-medium">{y.total}</p>
              <p className="text-[10px] text-muted-foreground">{y.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">62 total entries per student · Institute + Company Workshops + Self-Learning Courses</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label:"Initialize for Section", path:"/admin/skill-card/init",   icon:Plus    },
          { label:"All Student Cards",      path:"/admin/skill-card/list",   icon:Users   },
          { label:"Mentor View",            path:"/admin/skill-card/mentor", icon:Award   },
          { label:"Placement Report",       path:"/admin/skill-card/report", icon:BarChart2},
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 p-3 rounded-xl border border-border text-xs font-medium hover:bg-muted/30">
            <a.icon size={14} className="text-primary"/>{a.label}
          </button>
        ))}
      </div>

      {/* Readiness levels explanation */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Placement Readiness Levels</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { level:"FOUNDATIONAL",    pct:"0–49%",  desc:"Just started — building foundation skills" },
            { level:"JOB_READY",       pct:"50–79%", desc:"Good progress — eligible for job roles"    },
            { level:"PLACEMENT_READY", pct:"80%+",   desc:"Fully prepared — placement-ready status"   },
          ].map(r => (
            <div key={r.level} className={`rounded-xl p-3 ${READINESS_COLOR[r.level]}`}>
              <p className="text-xs font-bold">{r.level.replace(/_/g," ")}</p>
              <p className="text-lg font-bold">{r.pct}</p>
              <p className="text-[10px] mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
