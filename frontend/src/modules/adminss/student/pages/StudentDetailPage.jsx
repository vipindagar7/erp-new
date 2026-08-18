// src/modules/student/pages/StudentDetailPage.jsx  ── V3 REPLACE
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit, History, BookOpen, RotateCcw,
  Shield, ShieldOff, Printer, ChevronRight, AlertTriangle,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";
import { useSelector } from "react-redux";

const TABS = [
  { key: "overview",    label: "Overview"    },
  { key: "enrollment",  label: "Enrollments" },
  { key: "history",     label: "History"     },
  { key: "report",      label: "Report View" },
];

const STATUS_COLOR = {
  ACTIVE:      "bg-green-100 text-green-700",
  DETAINED:    "bg-amber-100 text-amber-700",
  ON_HOLD:     "bg-orange-100 text-orange-700",
  PASSED:      "bg-blue-100 text-blue-700",
  LEFT:        "bg-red-100 text-red-700",
  TRANSFERRED: "bg-gray-100 text-gray-600",
  SUSPENDED:   "bg-red-100 text-red-700",
};

const ACTION_COLOR = {
  CREATE:         "bg-green-100 text-green-700",
  PROFILE_UPDATE: "bg-blue-100 text-blue-700",
  STATUS_CHANGE:  "bg-violet-100 text-violet-700",
  BLOCK:          "bg-red-100 text-red-700",
  UNBLOCK:        "bg-green-100 text-green-700",
  PROMOTE:        "bg-indigo-100 text-indigo-700",
  DETAIN:         "bg-amber-100 text-amber-700",
  SOFT_DELETE:    "bg-red-100 text-red-700",
  RESTORE:        "bg-green-100 text-green-700",
  ROLLBACK:       "bg-rose-100 text-rose-700",
  SECTION_CHANGE: "bg-teal-100 text-teal-700",
};

const VALID_STATUSES = ["ACTIVE","DETAINED","ON_HOLD","PASSED","LEFT","TRANSFERRED","SUSPENDED"];

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isRoot       = user?.is_root;
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || isRoot;

  const [tab,        setTab]        = useState("overview");
  const [student,    setStudent]    = useState(null);
  const [history,    setHistory]    = useState([]);
  const [enrollments,setEnrollments]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState(false);

  // Modals
  const [statusModal,   setStatusModal]   = useState(false);
  const [promoteModal,  setPromoteModal]  = useState(false);
  const [rollbackModal, setRollbackModal] = useState(null);

  // Form
  const [newStatus,      setNewStatus]      = useState("");
  const [statusReason,   setStatusReason]   = useState("");
  const [toSectionId,    setToSectionId]    = useState("");
  const [toSectionLabel, setToSectionLabel] = useState("");
  const [promoteReason,  setPromoteReason]  = useState("");
  const [rollbackReason, setRollbackReason] = useState("");

  const load = async () => {
    setLoading(true);
    try { setStudent((await axiosInstance.get(EP.students.byId(id))).data?.data); }
    catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try {
      const r = await axiosInstance.get(`${EP.students.byId(id)}/history`);
      setHistory(r.data?.data || []);
    } catch {}
  };

  const loadEnrollments = async () => {
    try {
      const r = await axiosInstance.get(EP.students.enrollments(id));
      setEnrollments(r.data?.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (tab === "history")    loadHistory();
    if (tab === "enrollment") loadEnrollments();
  }, [tab]);

  // ── Status Change ─────────────────────────────────────────
  const doStatusChange = async () => {
    if (!newStatus) { notify.error("Select a status"); return; }
    setActing(true);
    try {
      await axiosInstance.post(EP.students.status(id), { status: newStatus, reason: statusReason });
      notify.success(`Status changed to ${newStatus}`);
      setStatusModal(false); setNewStatus(""); setStatusReason(""); load(); if (tab === "history") loadHistory();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  // ── Promote to new section ────────────────────────────────
  const doPromote = async () => {
    if (!toSectionId) { notify.error("Select target section"); return; }
    setActing(true);
    try {
      await axiosInstance.post(`/api/sections/${student.section_id}/promote-student`, {
        student_id:    id,
        to_section_id: toSectionId,
        reason:        promoteReason,
      });
      notify.success(`Moved to ${toSectionLabel}`);
      setPromoteModal(false); setToSectionId(""); setPromoteReason(""); load();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  // ── Rollback ──────────────────────────────────────────────
  const doRollback = async () => {
    setActing(true);
    try {
      await axiosInstance.post(`${EP.students.byId(id)}/rollback/${rollbackModal.id}`, { reason: rollbackReason });
      notify.success("Student rolled back");
      setRollbackModal(null); load(); if (tab === "history") loadHistory();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  // ── Block / Unblock ───────────────────────────────────────
  const toggleBlock = async () => {
    const blocked = student?.user?.isBlocked;
    setActing(true);
    try {
      await axiosInstance.post(blocked ? EP.students.unblock(id) : EP.students.block(id));
      notify.success(blocked ? "Student unblocked" : "Student blocked");
      load();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!student) return <div className="py-20 text-center text-sm text-muted-foreground">Not found.</div>;

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";
  const fmtTime = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const blocked = student.user?.isBlocked;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(ROUTES.students.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{student.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[student.status] || "bg-muted"}`}>{student.status}</span>
            {blocked && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Login Blocked</span>}
            {student.is_alumni && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Alumni</span>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span>{student.roll_no || "No Roll No"}</span>
            {student.enrollment_no && <><span>·</span><span>{student.enrollment_no}</span></>}
            <span>·</span>
            <span>{student.section?.name || "No Section"}</span>
            {student.section?.semester && <><span>·</span><span>Sem {student.section.semester}</span></>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={toggleBlock} disabled={acting}>
            {blocked ? <><ShieldOff size={13} className="mr-1" /> Unblock</> : <><Shield size={13} className="mr-1" /> Block</>}
          </Button>
          {isSuperAdmin && (
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-200" onClick={() => { setStatusModal(true); setNewStatus(student.status); setStatusReason(""); }}>
              <AlertTriangle size={13} className="mr-1" /> Change Status
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setPromoteModal(true)}>
            <BookOpen size={13} className="mr-1" /> Move Section
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.students.edit(id))}>
            <Edit size={13} className="mr-1" /> Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Personal */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Info</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Name",         student.name],
                ["Roll No",      student.roll_no      || "—"],
                ["Enrollment No",student.enrollment_no || "—"],
                ["Email",        student.user?.email   || "—"],
                ["Phone",        student.phone         || "—"],
                ["Gender",       student.gender        || "—"],
                ["DOB",          fmt(student.dob)],
                ["Blood Group",  student.blood_group   || "—"],
                ["Aadhar",       student.aadhar_no     || "—"],
                ["Category",     student.category      || "—"],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium truncate">{v}</p></div>
              ))}
            </div>
          </div>

          {/* Academic */}
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Info</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Department", student.department?.name || "—"],
                  ["Program",    student.program?.name    || "—"],
                  ["Branch",     student.branch?.name     || "—"],
                  ["Section",    student.section?.name    || "—"],
                  ["Semester",   student.section?.semester || "—"],
                  ["Batch Year", student.batch_year        || "—"],
                  ["Admission",  student.admission_year    || "—"],
                  ["Status",     student.status],
                ].map(([k, v]) => (
                  <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium">{v}</p></div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hierarchy</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <span>{student.department?.name}</span>
                <ChevronRight size={11} />
                <span>{student.program?.name}</span>
                <ChevronRight size={11} />
                <span>{student.branch?.name}</span>
                <ChevronRight size={11} />
                <span className="text-primary font-medium">{student.section?.name || "—"}</span>
              </div>
            </div>
          </div>

          {/* Parent info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parent Info</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Father",       student.father_name  || "—"],
                ["Father Phone", student.father_phone || "—"],
                ["Mother",       student.mother_name  || "—"],
                ["Mother Phone", student.mother_phone || "—"],
                ["Emergency",    student.emergency_contact || "—"],
                ["Emergency Ph", student.emergency_phone   || "—"],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium">{v}</p></div>
              ))}
            </div>
          </div>

          {/* Academic scores */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Scores</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["10th %",        student.tenth_percentage   || "—"],
                ["12th %",        student.twelfth_percentage || "—"],
                ["Lateral Entry", student.lateral_entry ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-sm font-medium">{v}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Enrollments ──────────────────────────────────── */}
      {tab === "enrollment" && (
        <div className="space-y-2">
          {enrollments.length === 0
            ? <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">No enrollment history</div>
            : enrollments.map((e) => (
              <div key={e.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 ${e.is_current ? "border-primary" : "border-border"}`}>
                <div className="text-center w-12">
                  <p className="text-2xl font-bold text-primary">{e.semester}</p>
                  <p className="text-xs text-muted-foreground">Sem</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{e.academic_year || "—"} · {e.session?.name || e.session_id?.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">Batch {e.batch_year} · {e.section?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[e.status] || "bg-muted"}`}>{e.status}</span>
                  {e.is_current && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Current</span>}
                </div>
                {e.completed_at && <p className="text-xs text-muted-foreground shrink-0">{fmt(e.completed_at)}</p>}
              </div>
            ))}
        </div>
      )}

      {/* ── History ──────────────────────────────────────── */}
      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0
            ? <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-2xl">No history yet</div>
            : history.map((h) => (
              <div key={h.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 mt-0.5 ${ACTION_COLOR[h.action] || "bg-muted"}`}>{h.action}</span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  {h.prev_data && h.new_data && h.action === "STATUS_CHANGE" && (
                    <p className="text-sm font-medium">{h.prev_data.status} → {h.new_data.status}</p>
                  )}
                  {h.changed_fields?.length > 0 && h.action !== "STATUS_CHANGE" && (
                    <p className="text-xs text-muted-foreground">Changed: {h.changed_fields.join(", ")}</p>
                  )}
                  {h.new_data?.reason && <p className="text-xs text-muted-foreground">Reason: {h.new_data.reason}</p>}
                  <p className="text-xs text-muted-foreground">By: {h.changed_by_name || "—"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-muted-foreground">{fmtTime(h.createdAt)}</p>
                  {isRoot && h.prev_data && !h.is_rollback && (
                    <button onClick={() => { setRollbackModal(h); setRollbackReason(""); }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors">
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Report View ───────────────────────────────────── */}
      {tab === "report" && (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={13} className="mr-1.5" /> Print</Button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-bold">{student.name} — Student Report</h2>
              <p className="text-xs text-muted-foreground">Roll No: {student.roll_no} · Enrollment: {student.enrollment_no} · Generated: {fmtTime(new Date())}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                ["Status",       student.status],
                ["Department",   student.department?.name || "—"],
                ["Program",      student.program?.name    || "—"],
                ["Branch",       student.branch?.name     || "—"],
                ["Section",      student.section?.name    || "—"],
                ["Semester",     student.section?.semester || "—"],
                ["Batch Year",   student.batch_year       || "—"],
                ["Admission Yr", student.admission_year   || "—"],
                ["10th %",       student.tenth_percentage  || "—"],
                ["12th %",       student.twelfth_percentage|| "—"],
                ["Blood Group",  student.blood_group      || "—"],
                ["Category",     student.category         || "—"],
              ].map(([k, v]) => <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>)}
            </div>
            {enrollments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Enrollment History</p>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-muted/30">{["Sem","Session","Section","Status","Year"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
                  <tbody>{enrollments.map((e) => <tr key={e.id} className="border-t border-border"><td className="px-3 py-1.5">{e.semester}</td><td className="px-3 py-1.5">{e.academic_year}</td><td className="px-3 py-1.5">{e.section?.name || "—"}</td><td className="px-3 py-1.5">{e.status}</td><td className="px-3 py-1.5">{e.batch_year}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Status Change Modal ───────────────────────────── */}
      <ConfirmDialog open={statusModal} onClose={() => setStatusModal(false)}
        title="Change Student Status"
        description={
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">New Status</Label>
              <Select value={newStatus || "none"} onValueChange={(v) => setNewStatus(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select…</SelectItem>
                  {VALID_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value)} rows={2} placeholder="Reason for status change…" />
            </div>
            {["PASSED","LEFT","SUSPENDED"].includes(newStatus) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ This will <strong>block login</strong> for the student.
              </div>
            )}
          </div>
        }
        confirmLabel="Change Status"
        onConfirm={doStatusChange} loading={acting} />

      {/* ── Promote/Move Modal ────────────────────────────── */}
      <ConfirmDialog open={promoteModal} onClose={() => setPromoteModal(false)}
        title="Move Student to Section"
        description={
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current: <strong>{student.section?.name || "No section"}</strong> (Sem {student.section?.semester})</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Section *</Label>
              <SearchSelect
                endpoint={EP.sections.list}
                dataPath="sections"
                valueKey="id"
                labelKey="name"
                subLabelKey="branch.name"
                value={toSectionId}
                onChange={(v, opt) => { setToSectionId(v); setToSectionLabel(opt?.name || ""); }}
                placeholder="Search sections…"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea value={promoteReason} onChange={(e) => setPromoteReason(e.target.value)} rows={2} placeholder="Reason for section change…" />
            </div>
          </div>
        }
        confirmLabel="Move Student"
        onConfirm={doPromote} loading={acting} />

      {/* ── Rollback Modal ────────────────────────────────── */}
      <ConfirmDialog open={!!rollbackModal} onClose={() => setRollbackModal(null)}
        title="Rollback Student to this State?"
        description={
          <div className="space-y-3">
            <p className="text-sm">Restore student to state from <strong>{fmtTime(rollbackModal?.createdAt)}</strong></p>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700">
              Action: {rollbackModal?.action} · Fields: {rollbackModal?.changed_fields?.join(", ") || "all"}
            </div>
            <Textarea value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)} rows={2} placeholder="Reason for rollback…" />
          </div>
        }
        confirmLabel="Rollback" variant="destructive"
        onConfirm={doRollback} loading={acting} />
    </div>
  );
}