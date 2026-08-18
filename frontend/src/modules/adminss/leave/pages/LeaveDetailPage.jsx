// src/modules/leave/pages/LeaveDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { SkeletonPage } from "../../../../components/shared/Skeleton.jsx";
import StatusBadge      from "../../../../components/shared/StatusBadge.jsx";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSelector } from "react-redux";

export default function LeaveDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [leave,   setLeave]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // { action: "APPROVED"|"REJECTED" }
  const [remarks, setRemarks] = useState("");
  const [acting,  setActing]  = useState(false);

  const load = async () => {
    try { const r = await axiosInstance.get(EP.leave.byId(id)); setLeave(r.data?.data); }
    catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const myStep = leave?.approvalSteps?.find((s) => s.approver?.id === user?.faculty?.id && s.status === "PENDING");
  const canAct = !!myStep && ["PENDING","FORWARDED"].includes(leave?.status);

  const confirm = async () => {
    setActing(true);
    try {
      await axiosInstance.post(EP.leave.action(id), { action: modal.action, remarks, approver_faculty_id: user?.faculty?.id });
      notify.success(modal.action === "APPROVED" ? "Leave approved" : "Leave rejected");
      setModal(null); setRemarks(""); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  if (loading) return <SkeletonPage />;
  if (!leave) return <div className="text-center py-20 text-muted-foreground">Not found.</div>;

  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.leave.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{leave.faculty?.name}</h1>
            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{leave.leave_type}</span>
            <StatusBadge status={leave.status} />
          </div>
          <p className="text-sm text-muted-foreground">{fmt(leave.from_date)} → {fmt(leave.to_date)} · {leave.total_days} day{leave.total_days > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave Details</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Faculty</p><p className="font-medium">{leave.faculty?.name}</p></div>
          <div><p className="text-xs text-muted-foreground">Department</p><p>{leave.faculty?.department?.name || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Leave Type</p><p className="font-medium">{leave.leave_type}</p></div>
          <div><p className="text-xs text-muted-foreground">Total Days</p><p className="font-medium">{leave.total_days}</p></div>
          <div><p className="text-xs text-muted-foreground">From</p><p>{fmt(leave.from_date)}</p></div>
          <div><p className="text-xs text-muted-foreground">To</p><p>{fmt(leave.to_date)}</p></div>
        </div>
        {leave.reason && <div><p className="text-xs text-muted-foreground mb-1">Reason</p><p className="text-sm bg-muted rounded-lg p-3">{leave.reason}</p></div>}
        {leave.rejection_reason && <div className="p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-xs font-medium text-red-700">Rejection Reason</p><p className="text-sm text-red-600 mt-0.5">{leave.rejection_reason}</p></div>}
      </div>

      {/* Approval Chain */}
      {leave.approvalSteps?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval Chain</p>
          <div className="space-y-2">
            {leave.approvalSteps.map((step) => (
              <div key={step.id} className={`flex items-center gap-3 p-3 rounded-xl border ${step.status === "APPROVED" ? "bg-green-50 border-green-200" : step.status === "REJECTED" ? "bg-red-50 border-red-200" : step.approver_id === user?.faculty?.id ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border"}`}>
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{step.level}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.approver?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{step.approver?.designation || "—"}</p>
                  {step.remarks && <p className="text-xs text-muted-foreground mt-0.5 italic">"{step.remarks}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  {step.status === "APPROVED"  && <CheckCircle size={16} className="text-green-600" />}
                  {step.status === "REJECTED"  && <XCircle    size={16} className="text-red-600" />}
                  {step.status === "PENDING"   && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                  {step.actioned_at && <span className="text-xs text-muted-foreground">{fmt(step.actioned_at)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {canAct && (
        <div className="flex gap-3">
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setModal({ action: "APPROVED" }); setRemarks(""); }}>
            <CheckCircle size={14} className="mr-1.5" /> Approve
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => { setModal({ action: "REJECTED" }); setRemarks(""); }}>
            <XCircle size={14} className="mr-1.5" /> Reject
          </Button>
        </div>
      )}

      <ConfirmDialog open={!!modal} onClose={() => setModal(null)}
        title={modal?.action === "APPROVED" ? "Approve Leave" : "Reject Leave"}
        description={
          <div className="space-y-3">
            <p className="text-sm">{modal?.action === "APPROVED" ? "Approve this leave request?" : "Reject this leave request? Please provide a reason."}</p>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder={modal?.action === "REJECTED" ? "Rejection reason (required)" : "Remarks (optional)"} rows={3} />
          </div>
        }
        confirmLabel={modal?.action === "APPROVED" ? "Approve" : "Reject"}
        variant={modal?.action === "REJECTED" ? "destructive" : "default"}
        onConfirm={confirm} loading={acting} />
    </div>
  );
}