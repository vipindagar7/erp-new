// src/modules/adminss/leave/pages/StudentLeaveHubPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckCircle, XCircle, Clock, Users, ChevronRight, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function StudentLeaveHubPage() {
  const navigate   = useNavigate();
  const { user }   = useSelector(s => s.auth);
  const [leaves,   setLeaves]   = useState([]);
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Determine user's approval role
  const myRole = user?.extra_roles?.includes("HOD") ? "HOD"
    : user?.extra_roles?.includes("CLASS_COORDINATOR") ? "CLASS_COORDINATOR"
    : user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" ? "DIRECTOR"
    : null;

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.studentLeave.list + "?limit=20"),
      myRole ? axiosInstance.get(EP.studentLeave.pending(myRole)) : Promise.resolve({ data:{ data:[] } }),
    ]).then(([lRes, pRes]) => {
      setLeaves(lRes.data?.data || []);
      setPending(pRes.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [myRole]);

  const stats = [
    { label:"Total",    value:leaves.length,                                       color:"text-foreground", icon:Calendar     },
    { label:"Pending",  value:leaves.filter(l=>l.status==="PENDING").length,       color:"text-amber-600",  icon:Clock        },
    { label:"Approved", value:leaves.filter(l=>l.status==="APPROVED").length,      color:"text-green-600",  icon:CheckCircle  },
    { label:"Rejected", value:leaves.filter(l=>l.status==="REJECTED").length,      color:"text-red-500",    icon:XCircle      },
  ];

  const handleAction = async (leave_id, step, action) => {
    try {
      const ep = action === "APPROVE" ? EP.studentLeave.approve(leave_id) : EP.studentLeave.reject(leave_id);
      await axiosInstance.post(ep, { step, remarks:"" });
      notify.success(action === "APPROVE" ? "Approved" : "Rejected");
      // Refresh
      const [lRes, pRes] = await Promise.all([
        axiosInstance.get(EP.studentLeave.list + "?limit=20"),
        myRole ? axiosInstance.get(EP.studentLeave.pending(myRole)) : Promise.resolve({ data:{ data:[] } }),
      ]);
      setLeaves(lRes.data?.data || []);
      setPending(pRes.data?.data || []);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={20} className="text-primary"/>Student Leave Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Approval workflow: Class Coordinator → HOD → Director
          </p>
        </div>
        <div className="flex gap-2">
          {["CLASS_COORDINATOR","HOD","DIRECTOR"].map(role => (
            <button key={role} onClick={() => navigate(`/admin/student-leave/pending?role=${role}`)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                ${myRole===role ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/30"}`}>
              {role.replace(/_/g," ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className={`${s.color} mb-2`}/>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals for current user's role */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-600">
            ⚠️ {pending.length} pending approval(s) for you ({myRole?.replace(/_/g," ")})
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {pending.slice(0,5).map(ap => {
                const leave = ap.leave;
                return (
                  <div key={ap.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{leave?.student?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {leave?.student?.roll_no} · {new Date(leave?.from_date).toLocaleDateString("en-IN")} → {new Date(leave?.to_date).toLocaleDateString("en-IN")} · {leave?.total_days} day(s)
                      </p>
                      <p className="text-xs text-muted-foreground italic">"{leave?.reason?.slice(0,60)}"</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleAction(leave?.id, ap.step, "APPROVE")}
                        className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700">
                        Approve
                      </button>
                      <button onClick={() => handleAction(leave?.id, ap.step, "REJECT")}
                        className="px-3 py-1 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {pending.length > 5 && (
              <div className="px-4 py-2.5 border-t border-border">
                <button onClick={() => navigate(`/admin/student-leave/pending?role=${myRole}`)} className="text-xs text-primary hover:underline">
                  View all {pending.length} pending →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All recent leaves */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-medium">All Leave Applications</p>
          <button onClick={() => navigate("/admin/student-leave/list")} className="text-xs text-primary hover:underline">View all</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>
        ) : (
          <div className="divide-y divide-border">
            {leaves.slice(0,8).map(l => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer"
                onClick={() => navigate(`/admin/student-leave/${l.id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.student?.name}</p>
                  <p className="text-xs text-muted-foreground">{l.student?.roll_no} · {l.total_days} day(s) · {l.reason?.slice(0,40)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                  ${l.status==="APPROVED"?"bg-green-50 text-green-700":l.status==="REJECTED"?"bg-red-50 text-red-700":l.status==="PENDING"?"bg-amber-50 text-amber-700":"bg-muted text-muted-foreground"}`}>
                  {l.status}
                </span>
                <ChevronRight size={13} className="text-muted-foreground shrink-0"/>
              </div>
            ))}
            {leaves.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">No leave applications</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
