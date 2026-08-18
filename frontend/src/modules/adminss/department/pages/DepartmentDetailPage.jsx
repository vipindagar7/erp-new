// src/modules/department/pages/DepartmentDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, History, RotateCcw, Building2, Users, BookOpen, ChevronRight, Printer } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import { useSelector } from "react-redux";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "programs", label: "Programs" },
  { key: "history",  label: "History"  },
  { key: "report",   label: "Report View" },
];

const ACTION_COLOR = {
  CREATE:    "bg-green-100 text-green-700",
  UPDATE:    "bg-blue-100 text-blue-700",
  HOD_CHANGE:"bg-violet-100 text-violet-700",
  SOFT_DELETE:"bg-red-100 text-red-700",
  RESTORE:   "bg-green-100 text-green-700",
  ROLLBACK:  "bg-rose-100 text-rose-700",
};

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isRoot = user?.is_root;

  const [tab,     setTab]     = useState("overview");
  const [dept,    setDept]    = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollbackReason, setRollbackReason] = useState("");

  const load = async () => {
    setLoading(true);
    try { setDept((await axiosInstance.get(EP.departments.byId(id))).data?.data); }
    catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try { setHistory((await axiosInstance.get(`${EP.departments.byId(id)}/history`)).data?.data || []); }
    catch {}
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab]);

  const doRollback = async () => {
    setActing(true);
    try {
      await axiosInstance.post(`${EP.departments.byId(id)}/rollback/${rollbackTarget.id}`, { reason: rollbackReason });
      notify.success("Department rolled back");
      setRollbackTarget(null); setRollbackReason(""); load(); loadHistory();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!dept)   return <div className="py-20 text-center text-sm text-muted-foreground">Not found.</div>;

  const fmtTime = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(ROUTES.departments.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-muted-foreground" />
            <h1 className="text-xl font-bold">{dept.name}</h1>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{dept.code}</span>
            {dept.deleted_at && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Deleted</span>}
          </div>
          {dept.description && <p className="text-sm text-muted-foreground mt-0.5 ml-7">{dept.description}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.departments.edit(id))}><Edit size={13} className="mr-1" /> Edit</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 col-span-2">
            {[
              { label: "Faculty",  value: dept._count?.faculties, icon: Users,    color: "blue"   },
              { label: "Students", value: dept._count?.students,  icon: Users,    color: "green"  },
              { label: "Programs", value: dept._count?.programs,  icon: BookOpen, color: "violet" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${color}-100 text-${color}-600 flex items-center justify-center`}><Icon size={18} /></div>
                <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value ?? 0}</p></div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</p>
            <div className="space-y-2 text-sm">
              {[
                ["Code",             dept.code],
                ["Website",          dept.website || "—"],
                ["Phone",            dept.phone   || "—"],
                ["Established",      dept.established_year || "—"],
              ].map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>)}
            </div>
          </div>

          {/* HOD */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Head of Department</p>
            {dept.hod ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{dept.hod.name[0]}</div>
                <div>
                  <p className="font-medium">{dept.hod.name}</p>
                  <p className="text-xs text-muted-foreground">{dept.hod.designation} · {dept.hod.emp_id}</p>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">No HOD assigned</p>}
          </div>
        </div>
      )}

      {/* Programs */}
      {tab === "programs" && (
        <div className="space-y-2">
          {(dept.programs || []).length === 0
            ? <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">No programs</div>
            : (dept.programs || []).map((p) => (
              <div key={p.id} onClick={() => navigate(ROUTES.programs.detail(p.id))} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/20">
                <BookOpen size={15} className="text-muted-foreground shrink-0" />
                <div className="flex-1"><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p._count?.branches} branches</p></div>
                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{p.code}</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            ))}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0
            ? <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">No history yet</div>
            : history.map((h) => (
              <div key={h.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${ACTION_COLOR[h.action] || "bg-muted"}`}>{h.action}</span>
                <div className="flex-1 min-w-0">
                  {h.changed_fields?.length > 0 && (
                    <p className="text-xs text-muted-foreground">Changed: {h.changed_fields.join(", ")}</p>
                  )}
                  {h.reason && <p className="text-xs text-muted-foreground">Reason: {h.reason}</p>}
                  <p className="text-xs text-muted-foreground">By: {h.changed_by_name || "—"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-muted-foreground">{fmtTime(h.createdAt)}</p>
                  {isRoot && h.prev_data && !h.is_rollback && (
                    <button onClick={() => { setRollbackTarget(h); setRollbackReason(""); }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><RotateCcw size={13} /></button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Report View */}
      {tab === "report" && (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={13} className="mr-1.5" /> Print</Button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">{dept.name} — Department Report</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                ["Code", dept.code], ["HOD", dept.hod?.name || "—"],
                ["Faculty", dept._count?.faculties], ["Students", dept._count?.students],
                ["Programs", dept._count?.programs], ["Established", dept.established_year || "—"],
                ["Website", dept.website || "—"], ["Phone", dept.phone || "—"],
                ["Status", dept.deleted_at ? "Deleted" : "Active"],
              ].map(([k, v]) => <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>)}
            </div>
          </div>
        </div>
      )}

      {/* Rollback dialog */}
      <ConfirmDialog open={!!rollbackTarget} onClose={() => setRollbackTarget(null)}
        title="Rollback Department?"
        description={
          <div className="space-y-3">
            <p className="text-sm">Restore department to state from <strong>{fmtTime(rollbackTarget?.createdAt)}</strong></p>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700">
              Fields that will be restored: {rollbackTarget?.changed_fields?.join(", ") || "all fields"}
            </div>
            <Textarea value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)} rows={2} placeholder="Reason for rollback…" />
          </div>
        }
        confirmLabel="Rollback" variant="destructive"
        onConfirm={doRollback} loading={acting} />
    </div>
  );
}