// src/modules/adminss/assignment/pages/AssignmentHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, BarChart2, Clock, CheckCircle, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function AssignmentHubPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.assignments.list + "?limit=50")
      .then(r => setAssignments(r.data?.data?.items || []))
      .catch(e => { if (e.response?.status !== 500) notify.error("Failed to load assignments"); })
      .finally(() => setLoading(false));
  }, []);

  const published = assignments.filter(a => a.status === "PUBLISHED");
  const needGrading = assignments.filter(a => a.status === "CLOSED");
  const overdue = published.filter(a => new Date(a.deadline) < new Date());
  const drafts = assignments.filter(a => a.status === "DRAFT");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="text-primary" />Assignments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, manage and grade student assignments</p>
        </div>
        <button onClick={() => navigate("/admin/assignments/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14} />New Assignment
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Published", value: published.length, color: "text-green-600", icon: CheckCircle },
          { label: "Needs Grading", value: needGrading.length, color: "text-amber-600", icon: AlertCircle },
          { label: "Overdue", value: overdue.length, color: "text-red-500", icon: Clock },
          { label: "Drafts", value: drafts.length, color: "text-muted-foreground", icon: FileText },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className={`${s.color} mb-2`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Needs grading alert */}
      {needGrading.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-amber-700 font-medium">
            ⚠️ {needGrading.length} assignment(s) waiting to be graded
          </span>
          <button onClick={() => navigate("/admin/assignments/list?status=CLOSED")}
            className="text-xs text-amber-700 hover:underline font-medium">Grade now →</button>
        </div>
      )}

      {/* Recent assignments */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium">Recent Assignments</p>
            <button onClick={() => navigate("/admin/assignments/list")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="divide-y divide-border">
            {assignments.slice(0, 8).map(a => (
              <div key={a.id} onClick={() => navigate(`/admin/assignments/${a.id}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.subject?.name} · Due: {new Date(a.deadline).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    {new Date(a.deadline) < new Date() && a.status === "PUBLISHED" && <span className="text-red-500 ml-1">OVERDUE</span>}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                  ${a.status === "PUBLISHED" ? "bg-green-50 text-green-700" : a.status === "CLOSED" ? "bg-amber-50 text-amber-700" : a.status === "GRADED" ? "bg-violet-50 text-violet-700" : "bg-muted text-muted-foreground"}`}>
                  {a.status}
                </span>
                <span className="text-xs text-muted-foreground">{a._count?.submissions || 0} sub.</span>
                <ChevronRight size={13} className="text-muted-foreground shrink-0" />
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No assignments yet. <button onClick={() => navigate("/admin/assignments/new")} className="text-primary hover:underline">Create one →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}