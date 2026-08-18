// src/modules/branch/pages/BranchDiscontinuationPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Users, GraduationCap } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";

export default function BranchDiscontinuationPage() {
  const navigate  = useNavigate();
  const [report,  setReport]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`${EP.branches.list}/report/discontinuation`)
      .then((r) => setReport(r.data?.data || []))
      .catch(() => notify.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.hub)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Discontinued Branches</h1>
          <p className="text-sm text-muted-foreground">
            Branches that no longer admit new students. Existing students continue until graduation.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : report.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No discontinued branches.</p>
          <p className="text-xs mt-1">All branches are currently active and accepting admissions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {report.map((b) => (
            <div key={b.id} className="bg-card border border-amber-200 rounded-2xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold">{b.name}</h2>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{b.code}</span>
                    <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                      Discontinued
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.department?.name}</p>
                </div>
                <button
                  onClick={() => navigate(ROUTES.branches.detail(b.id))}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View details →
                </button>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Started admissions</p>
                  <p className="font-semibold mt-0.5">{b.start_session || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last intake session</p>
                  <p className="font-semibold mt-0.5">{b.end_session || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discontinued on</p>
                  <p className="font-semibold mt-0.5">
                    {new Date(b.discontinued_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last batch graduates</p>
                  <p className="font-semibold mt-0.5">{b.graduating_by || "—"}</p>
                </div>
              </div>

              {/* Student status */}
              <div className="flex items-center gap-6 text-xs border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users size={12} />
                  <span>{b.total_students ?? 0} total students enrolled historically</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <GraduationCap size={12} />
                  <span>{b.active_students ?? 0} still studying</span>
                </div>
              </div>

              {/* Reason */}
              {b.discontinued_reason && (
                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  <span className="font-medium">Reason: </span>
                  {b.discontinued_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
