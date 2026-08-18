// src/modules/adminss/hr/pages/HRHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, CheckCircle, BarChart2, Plus, Loader2, Upload } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function HRHubPage() {
  const navigate = useNavigate();
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    axiosInstance.get(EP.hr.hrReport + `?month=${now.getMonth()+1}&year=${now.getFullYear()}`)
      .then(r => setReport(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label:"Total Slips",   value:report?.total_slips||0,   color:"text-foreground" },
    { label:"Approved",      value:report?.approved||0,       color:"text-green-600"  },
    { label:"Paid",          value:report?.paid||0,           color:"text-blue-600"   },
    { label:"Net Payroll",   value:`₹${(report?.total_net||0).toLocaleString()}`, color:"text-primary" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-primary"/>HR Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Salary slips, components and faculty attendance — {now.toLocaleString("en-IN",{month:"long",year:"numeric"})}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/admin/hr/slips/generate")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14}/>Generate Slips
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label:"Salary Components", path:"/admin/hr/components",     icon:FileText    },
          { label:"All Slips",         path:"/admin/hr/slips",          icon:FileText    },
          { label:"Approve Slips",     path:"/admin/hr/slips/approve",  icon:CheckCircle },
          { label:"Biometric Import",  path:"/admin/hr/biometric",      icon:Upload      },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 p-3 rounded-xl border border-border text-xs font-medium hover:bg-muted/30">
            <a.icon size={14} className="text-primary"/>{a.label}
          </button>
        ))}
      </div>

      {/* Payroll summary */}
      {report && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payroll Summary — {now.toLocaleString("en-IN",{month:"long",year:"numeric"})}
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Gross",       `₹${(report.total_gross||0).toLocaleString()}`,       "text-foreground" ],
              ["Deductions",  `₹${(report.total_deductions||0).toLocaleString()}`,  "text-red-500"    ],
              ["Net Payroll", `₹${(report.total_net||0).toLocaleString()}`,          "text-green-600"  ],
            ].map(([l,v,c]) => (
              <div key={l} className="text-center">
                <p className={`text-xl font-bold ${c}`}>{v}</p>
                <p className="text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
