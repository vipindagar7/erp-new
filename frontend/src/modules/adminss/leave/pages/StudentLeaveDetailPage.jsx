// src/modules/adminss/leave/pages/StudentLeaveDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock, User } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const STEP_ROLES = ["","Class Coordinator","HOD","Director"];
const STATUS_COLOR = { PENDING:"text-amber-600", APPROVED:"text-green-600", REJECTED:"text-red-500", FORWARDED:"text-blue-600" };

export default function StudentLeaveDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [leave,   setLeave]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState("");
  const [remarks, setRemarks] = useState("");

  const load = () => {
    axiosInstance.get(EP.studentLeave.byId(id))
      .then(r => setLeave(r.data?.data))
      .catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const act = async (action) => {
    const step = leave?.approvals?.find(a => a.status === "PENDING")?.step;
    if (!step) { notify.error("No pending step"); return; }
    setActing(action);
    try {
      const ep = action === "approve" ? EP.studentLeave.approve(id) : EP.studentLeave.reject(id);
      await axiosInstance.post(ep, { step, remarks });
      notify.success(action === "approve" ? "Approved" : "Rejected");
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActing(""); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!leave)  return <div className="text-center py-20 text-sm text-muted-foreground">Not found</div>;

  const l = leave;
  const pendingApproval = l.approvals?.find(a => a.status === "PENDING");
  const canAct = pendingApproval && (
    user?.role === "SUPER_ADMIN" ||
    (pendingApproval.role === "CLASS_COORDINATOR" && user?.extra_roles?.includes("CLASS_COORDINATOR")) ||
    (pendingApproval.role === "HOD" && user?.extra_roles?.includes("HOD"))
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Leave Application</h1>
          <p className="text-sm text-muted-foreground">{l.student?.name} · {l.student?.roll_no}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
          l.status==="APPROVED"?"bg-green-50 text-green-700 border-green-200":
          l.status==="REJECTED"?"bg-red-50 text-red-700 border-red-200":
          l.status==="PENDING"?"bg-amber-50 text-amber-700 border-amber-200":
          "bg-muted text-muted-foreground border-border"}`}>
          {l.status}
        </span>
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave Details</p>
        {[
          ["Student",    l.student?.name],
          ["Roll No",    l.student?.roll_no],
          ["Section",    l.student?.section?.name],
          ["From",       new Date(l.from_date).toLocaleDateString("en-IN",{dateStyle:"long"})],
          ["To",         new Date(l.to_date).toLocaleDateString("en-IN",{dateStyle:"long"})],
          ["Total Days", `${l.total_days} day(s)`],
          ["Applied on", new Date(l.createdAt).toLocaleDateString("en-IN",{dateStyle:"medium"})],
        ].map(([k,v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-xs text-muted-foreground">{k}</span>
            <span className="text-xs font-medium">{v}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Reason</p>
          <p className="text-sm">{l.reason}</p>
        </div>
      </div>

      {/* Approval timeline */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval Workflow</p>
        <div className="relative space-y-0">
          <div className="absolute left-4 top-4 bottom-4 w-px bg-border"/>
          {(l.approvals||[]).sort((a,b) => a.step-b.step).map((ap, i) => (
            <div key={ap.id} className="relative flex gap-4 pb-5">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-background
                ${ap.status==="APPROVED"?"bg-green-500 text-white":ap.status==="REJECTED"?"bg-red-500 text-white":ap.status==="PENDING"?"bg-amber-400 text-white":"bg-muted text-muted-foreground"}`}>
                {ap.status==="APPROVED" ? <CheckCircle size={14}/> : ap.status==="REJECTED" ? <XCircle size={14}/> : ap.status==="PENDING" ? <Clock size={14}/> : <User size={14}/>}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold">{STEP_ROLES[ap.step]}</p>
                <p className={`text-xs font-medium ${STATUS_COLOR[ap.status]||"text-muted-foreground"}`}>{ap.status}</p>
                {ap.remarks && <p className="text-xs text-muted-foreground mt-1 italic">"{ap.remarks}"</p>}
                {ap.acted_at && <p className="text-[10px] text-muted-foreground">{new Date(ap.acted_at).toLocaleString("en-IN")}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action panel */}
      {canAct && l.status === "PENDING" && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Action Required — Step {pendingApproval.step} ({pendingApproval.role.replace(/_/g," ")})
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Remarks (optional)</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="Add remarks or comments…"
              className="w-full h-16 px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-ring"/>
          </div>
          <div className="flex gap-3">
            <button onClick={() => act("reject")} disabled={!!acting}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-60">
              {acting==="reject" ? <Loader2 size={13} className="animate-spin"/> : <XCircle size={13}/>}Reject
            </button>
            <button onClick={() => act("approve")} disabled={!!acting}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60">
              {acting==="approve" ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle size={13}/>}
              {pendingApproval.step < 3 ? "Approve & Forward" : "Approve"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
