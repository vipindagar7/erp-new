// src/modules/adminss/training/pages/TrainingDetailPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate }            from "react-router-dom";
import {
  ArrowLeft, Edit, Loader2, Users, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle, BarChart2,
  Megaphone, GraduationCap, Wifi, Briefcase,
  IndianRupee, Shield, BookOpen, Plus, Trash2,
  ChevronRight, RefreshCw,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

const badge = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";
const TYPE_COLOR  = { MANDATORY:"bg-red-50 text-red-700 border-red-200", ELECTIVE:"bg-blue-50 text-blue-700 border-blue-200", OPTIONAL:"bg-green-50 text-green-700 border-green-200" };
const STATUS_COLOR= { DRAFT:"bg-muted text-muted-foreground border-border", ACTIVE:"bg-green-50 text-green-700 border-green-200", ONGOING:"bg-blue-50 text-blue-700 border-blue-200", COMPLETED:"bg-violet-50 text-violet-700 border-violet-200", CANCELLED:"bg-red-50 text-red-700 border-red-200" };

const TABS = ["Overview","Students","Attendance","Mentors","Updates","Fee","Online Courses"];

export default function TrainingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [training,     setTraining]     = useState(null);
  const [enrollments,  setEnrollments]  = useState([]);
  const [attendance,   setAttendance]   = useState([]);
  const [updates,      setUpdates]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("Overview");
  const [actionLoading,setActionLoading]= useState("");

  // Update post state
  const [newUpdate, setNewUpdate] = useState({ title:"", body:"", type:"GENERAL" });
  const [postingUpdate, setPostingUpdate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tRes, eRes, uRes] = await Promise.all([
        axiosInstance.get(EP.training.byId(id)),
        axiosInstance.get(EP.training.enrollments(id), { params: { limit: 100 } }),
        axiosInstance.get(EP.training.updates(id)),
      ]);
      setTraining(tRes.data?.data);
      setEnrollments(eRes.data?.data?.enrollments || []);
      setUpdates(uRes.data?.data || []);
    } catch { notify.error("Failed to load"); }
    finally  { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action, label, extra = {}) => {
    if (!confirm(`${label}?`)) return;
    setActionLoading(action);
    try {
      const reason = extra.reason || (action === "cancel" ? prompt("Reason for cancellation:") : undefined);
      if (action === "cancel") await axiosInstance.post(EP.training.cancel(id),      { reason });
      if (action === "deactivate") await axiosInstance.post(EP.training.deactivate(id), {});
      if (action === "activate")   await axiosInstance.post(EP.training.activate(id),   {});
      notify.success(`${label} successful`);
      load();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(""); }
  };

  const postUpdate = async () => {
    if (!newUpdate.title || !newUpdate.body) { notify.error("Title and body required"); return; }
    setPostingUpdate(true);
    try {
      await axiosInstance.post(EP.training.updates(id), newUpdate);
      notify.success("Update posted");
      setNewUpdate({ title:"", body:"", type:"GENERAL" });
      const uRes = await axiosInstance.get(EP.training.updates(id));
      setUpdates(uRes.data?.data || []);
    } catch { notify.error("Failed to post"); }
    finally { setPostingUpdate(false); }
  };

  const removeUpdate = async (uid) => {
    if (!confirm("Delete this update?")) return;
    try {
      await axiosInstance.delete(EP.training.deleteUpdate(uid));
      setUpdates(prev => prev.filter(u => u.id !== uid));
      notify.success("Deleted");
    } catch { notify.error("Failed"); }
  };

  const dropStudent = async (student_id) => {
    const reason = prompt("Reason for dropping?");
    if (!reason) return;
    try {
      await axiosInstance.delete(EP.training.dropStudent(id, student_id), { data: { reason } });
      notify.success("Student dropped");
      const eRes = await axiosInstance.get(EP.training.enrollments(id), { params: { limit: 100 } });
      setEnrollments(eRes.data?.data?.enrollments || []);
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
  );
  if (!training) return <div className="text-center py-20 text-muted-foreground">Training not found</div>;

  const t = training;
  const totalStudents = enrollments.length;
  const completed     = enrollments.filter(e => e.status === "COMPLETED").length;
  const avgAttend     = totalStudents
    ? Math.round(enrollments.reduce((s,e) => s + (e.attendance_pct||0), 0) / totalStudents)
    : 0;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/training")}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground mt-0.5"><ArrowLeft size={18}/></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{t.title}</h1>
            <span className={`${badge} ${TYPE_COLOR[t.type]||"bg-muted"}`}>{t.type}</span>
            <span className={`${badge} ${STATUS_COLOR[t.status]||"bg-muted"}`}>{t.status}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{t.code} · {t.mode} · {t.department?.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {t.status === "DRAFT"  && <button onClick={() => doAction("activate","Activate")}   className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700">{actionLoading==="activate"?<Loader2 size={11} className="animate-spin"/>:"Activate"}</button>}
          {t.status === "ACTIVE" && <button onClick={() => doAction("deactivate","Deactivate")} className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600">{actionLoading==="deactivate"?<Loader2 size={11} className="animate-spin"/>:"Deactivate"}</button>}
          {["DRAFT","ACTIVE","ONGOING"].includes(t.status) && (
            <button onClick={() => doAction("cancel","Cancel Training")}
              className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50">Cancel</button>
          )}
          <button onClick={() => navigate(`/admin/training/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted/40">
            <Edit size={12}/>Edit
          </button>
          <button onClick={() => navigate(`/admin/training/${id}/enroll`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
            <Users size={12}/>Enroll Students
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Enrolled",    value:totalStudents, icon:Users,        color:"text-blue-600"   },
          { label:"Completed",   value:completed,     icon:CheckCircle,  color:"text-green-600"  },
          { label:"Avg Attend",  value:avgAttend+"%", icon:BarChart2,    color:"text-violet-600" },
          { label:"Sections",    value:t._count?.sections||0, icon:BookOpen, color:"text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className={`${s.color} mb-2`}/>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab===tb ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tb}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "Overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</p>
            {[
              ["Start Date", new Date(t.start_date).toLocaleDateString("en-IN",{dateStyle:"medium"})],
              ["End Date",   new Date(t.end_date).toLocaleDateString("en-IN",{dateStyle:"medium"})],
              ["Total Hours", t.total_hours ? `${t.total_hours} hrs` : "—"],
              ["Venue", t.venue || t.room?.name || "—"],
              ["Online Link", t.online_link || "—"],
              ["Min Attendance", `${t.attendance_pct_required}%`],
              ["Fee", t.has_fee ? `₹${t.fee_amount}` : "Free"],
            ].map(([k,v]) => (
              <div key={k} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-muted-foreground text-xs">{k}</span>
                <span className="text-xs font-medium text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {/* Description */}
            {t.description && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-muted-foreground">{t.description}</p>
              </div>
            )}
            {/* Assigned sections */}
            {t.sections?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assigned Sections ({t.sections.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.sections.map(s => (
                    <span key={s.id} className="px-2 py-1 bg-muted rounded-lg text-xs">{s.section?.name}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Actions */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
              {[
                { label:"Mark Attendance",   path:`/admin/training/${id}/attendance`, icon:CheckCircle },
                { label:"View Full Report",  path:`/admin/training/${id}/report`,     icon:BarChart2   },
                { label:"Manage Sections",   path:`/admin/training/${id}/enroll`,     icon:BookOpen    },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border hover:bg-muted/30 text-sm transition-colors">
                  <div className="flex items-center gap-2"><a.icon size={13}/>{a.label}</div>
                  <ChevronRight size={12} className="text-muted-foreground"/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Students ── */}
      {tab === "Students" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{enrollments.length} students enrolled</p>
            <button onClick={() => navigate(`/admin/training/${id}/enroll`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
              <Plus size={11}/>Add Students
            </button>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
              No students enrolled yet
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {enrollments.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {e.student?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.student?.name}</p>
                      <p className="text-xs text-muted-foreground">{e.student?.roll_no} · {e.student?.section?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{e.attendance_pct?.toFixed(0) || 0}%</p>
                      <p className="text-[10px] text-muted-foreground">{e.attended_sessions}/{e.total_sessions} sessions</p>
                    </div>
                    <span className={`${badge} ${
                      e.status==="COMPLETED"?"bg-green-50 text-green-700 border-green-200":
                      e.status==="DROPPED"?"bg-red-50 text-red-700 border-red-200":
                      "bg-muted text-muted-foreground border-border"}`}>
                      {e.status}
                    </span>
                    {e.status === "ENROLLED" && (
                      <button onClick={() => dropStudent(e.student?.id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                        <XCircle size={13}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === "Attendance" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Attendance Sessions</p>
            <button onClick={() => navigate(`/admin/training/${id}/attendance`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
              <Plus size={11}/>Mark Attendance
            </button>
          </div>
          {/* Attendance summary table */}
          {enrollments.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">No students enrolled</div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/30">
                  <tr>{["Student","Section","Present","Absent","Late","Attendance %"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.map(e => (
                    <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5 font-medium">{e.student?.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{e.student?.section?.name}</td>
                      <td className="px-3 py-2.5 text-green-600 font-medium">{e.attended_sessions||0}</td>
                      <td className="px-3 py-2.5 text-red-500">{(e.total_sessions||0)-(e.attended_sessions||0)}</td>
                      <td className="px-3 py-2.5 text-amber-600">—</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
                            <div className="h-full bg-primary rounded-full" style={{width:`${e.attendance_pct||0}%`}}/>
                          </div>
                          <span className={`font-medium ${(e.attendance_pct||0) < (t.attendance_pct_required||75) ? "text-red-500" : "text-green-600"}`}>
                            {(e.attendance_pct||0).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Mentors ── */}
      {tab === "Mentors" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t.mentors?.length || 0} mentor(s) assigned</p>
            <button onClick={() => navigate(`/admin/training/${id}/mentors`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
              <Plus size={11}/>Assign Mentor
            </button>
          </div>
          {(t.mentors||[]).length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
              No mentors assigned yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {t.mentors.map(m => (
                <div key={m.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{m.faculty?.name}</p>
                      <p className="text-xs text-muted-foreground">{m.faculty?.designation} · {m.faculty?.department?.name}</p>
                    </div>
                    <span className={`${badge} ${m.is_primary ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {m.role}{m.is_primary ? " · Primary" : ""}
                    </span>
                  </div>
                  <button onClick={() => navigate(`/admin/training/mentors/${m.faculty?.id}/report`)}
                    className="text-xs text-primary hover:underline">
                    View Track Record →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Updates ── */}
      {tab === "Updates" && (
        <div className="space-y-4">
          {/* Post new update */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post Update</p>
            <select value={newUpdate.type} onChange={e => setNewUpdate(u => ({...u, type: e.target.value}))}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
              {["GENERAL","NOTICE","RESULT","SCHEDULE_CHANGE"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select>
            <input value={newUpdate.title} onChange={e => setNewUpdate(u => ({...u, title: e.target.value}))}
              placeholder="Update title…"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
            <textarea value={newUpdate.body} onChange={e => setNewUpdate(u => ({...u, body: e.target.value}))}
              placeholder="Write update body…"
              className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none"/>
            <div className="flex justify-end">
              <button disabled={postingUpdate} onClick={postUpdate}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
                {postingUpdate ? <Loader2 size={11} className="animate-spin"/> : <Megaphone size={11}/>}
                {postingUpdate ? "Posting…" : "Post Update"}
              </button>
            </div>
          </div>
          {/* Updates list */}
          {updates.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
              No updates posted yet
            </div>
          ) : (
            <div className="space-y-2">
              {updates.map(u => (
                <div key={u.id} className="bg-card border border-border rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {u.is_pinned && <span className="text-[10px] text-amber-600 font-bold mr-2">📌 PINNED</span>}
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 mr-2">{u.type}</span>
                      <span className="font-semibold text-sm">{u.title}</span>
                    </div>
                    <button onClick={() => removeUpdate(u.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{u.body}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(u.createdAt).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Fee ── */}
      {tab === "Fee" && (
        <div className="space-y-3">
          {!t.has_fee ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
              This training is free — no fee configured
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:"Fee Amount",   value:`₹${t.fee_amount}`,                                                                 color:"text-foreground"   },
                  { label:"Collected",    value:`₹${enrollments.reduce((s,e)=>s+(e.fee_paid_amount||0),0).toFixed(0)}`,              color:"text-green-600"    },
                  { label:"Pending",      value:`₹${enrollments.filter(e=>e.fee_status==="PENDING").reduce((s,e)=>s+(e.fee_amount||0),0).toFixed(0)}`, color:"text-amber-600" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>{["Student","Roll No","Fee Amount","Paid","Status","Action"].map(h =>
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
                    )}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrollments.map(e => (
                      <tr key={e.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-medium">{e.student?.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{e.student?.roll_no}</td>
                        <td className="px-3 py-2.5">₹{e.fee_amount}</td>
                        <td className="px-3 py-2.5 text-green-600">₹{e.fee_paid_amount||0}</td>
                        <td className="px-3 py-2.5">
                          <span className={`${badge} ${
                            e.fee_status==="PAID"?"bg-green-50 text-green-700 border-green-200":
                            e.fee_status==="PENDING"?"bg-amber-50 text-amber-700 border-amber-200":
                            e.fee_status==="REFUNDED"?"bg-violet-50 text-violet-700 border-violet-200":
                            "bg-muted text-muted-foreground border-border"
                          }`}>{e.fee_status}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => navigate(`/admin/training/${id}/fee/${e.student?.id}`)}
                            className="text-primary hover:underline">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Online Courses ── */}
      {tab === "Online Courses" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Online Course Records</p>
            <p className="text-xs text-muted-foreground">Students submit completion certificates here</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Verify submissions and credit attendance units from this tab.
            Extra units granted: <strong>{t.extra_attendance_units}</strong> per completion.
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
              No students enrolled
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {enrollments.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.student?.name}</p>
                      <p className="text-xs text-muted-foreground">{e.student?.roll_no}</p>
                    </div>
                    <span className={`${badge} ${e.extra_units_granted>0 ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"}`}>
                      {e.extra_units_granted>0 ? `${e.extra_units_granted} units credited` : "Not credited"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
