// src/modules/faculty/pages/FacultyDetailPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit, ShieldOff, Shield, Upload, Loader2,
  BookOpen, Layers, User, Phone, Mail, Calendar, MapPin,
  Briefcase, Heart, CreditCard, History, Clock, GraduationCap,
  Building2, CalendarDays, Users, Lock, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Tag,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { SensitiveField, ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────
const fmt  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
const fmtT = (d) => d ? new Date(d).toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

function Row({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-muted/20 transition-colors text-left">
        {Icon && <Icon size={14} className="text-muted-foreground shrink-0" />}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">{title}</p>
        {badge && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{badge}</span>}
        {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  );
}

function Grid2({ children }) { return <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>; }
function Grid3({ children }) { return <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{children}</div>; }

// ── Days of week map ──────────────────────────────────────────
const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];

// ── Timetable mini-view ───────────────────────────────────────
function TimetableSection({ facultyId, sessionId }) {
  const [entries,  setEntries]  = useState([]);
  const [periods,  setPeriods]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!facultyId || !sessionId) { setLoading(false); return; }
    Promise.all([
      axiosInstance.get(EP.timetable.byFaculty(facultyId), { params: { session_id: sessionId } }),
      axiosInstance.get(EP.timetable.periods(sessionId)),
    ]).then(([eRes, pRes]) => {
      setEntries(eRes.data?.data || []);
      setPeriods((pRes.data?.data || []).filter(p => !["LUNCH","BREAK","ASSEMBLY"].includes(p.type)));
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [facultyId, sessionId]);

  if (loading) return <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  if (!entries.length) return <p className="text-sm text-muted-foreground text-center py-4">No timetable for this session</p>;

  // Build map: day → period_id → entry
  const map = {};
  for (const e of entries) {
    if (!map[e.day]) map[e.day] = {};
    map[e.day][e.period_config_id] = e;
  }

  // Weekly hours
  const weeklyHours = entries.filter(e => !["FREE","LUNCH","BREAK"].includes(e.entry_type)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock size={12} /> <span className="font-medium text-foreground">{weeklyHours}</span> hrs/week
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs w-full border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground bg-muted/30 rounded-tl-lg border border-border">Period</th>
              {DAYS.map(d => <th key={d} className="px-2 py-1.5 font-semibold text-muted-foreground bg-muted/30 border border-border text-center">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map(p => (
              <tr key={p.id}>
                <td className="px-2 py-1.5 border border-border bg-card">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.start_time}–{p.end_time}</p>
                </td>
                {DAYS.map(d => {
                  const e = map[d]?.[p.id];
                  if (!e) return <td key={d} className="border border-border text-center text-muted-foreground/30">—</td>;
                  return (
                    <td key={d} className="border border-border px-1.5 py-1">
                      <div className="bg-blue-50 text-blue-700 rounded px-1.5 py-1">
                        <p className="font-semibold truncate">{e.subject?.code || "—"}</p>
                        <p className="text-[10px] truncate opacity-75">{e.timetable?.section?.name}</p>
                        {e.room && <p className="text-[10px] opacity-60">{e.room.code}</p>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Classes assigned (section subjects) ───────────────────────
function ClassesSection({ facultyId }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get sections where this faculty teaches
    axiosInstance.get(EP.sections.list + `?limit=200`)
      .then(r => {
        const sections = r.data?.data?.sections || r.data?.data || [];
        // Filter where faculty is assigned to any subject
        const mine = sections.filter(s =>
          s.sectionSubjects?.some(ss => ss.faculty_id === facultyId || ss.faculty?.id === facultyId)
        );
        setClasses(mine);
      })
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, [facultyId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  if (!classes.length) return <p className="text-sm text-muted-foreground text-center py-4">No classes assigned</p>;

  return (
    <div className="space-y-2">
      {classes.map(s => {
        const mySubjects = (s.sectionSubjects || []).filter(ss => ss.faculty_id === facultyId || ss.faculty?.id === facultyId);
        return (
          <div key={s.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border">
            <Layers size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">{s.name}</p>
                <span className="text-xs text-muted-foreground">Sem {s.semester}</span>
                {s.branch?.name && <span className="text-xs text-muted-foreground">{s.branch.name}</span>}
              </div>
              <div className="flex gap-1 flex-wrap mt-1">
                {mySubjects.map(ss => (
                  <span key={ss.subject_id} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                    {ss.subject?.code} — {ss.subject?.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Career History ─────────────────────────────────────────────
function CareerHistory({ facultyId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.faculty.careerHistory(facultyId))
      .then(r => setHistory(r.data?.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [facultyId]);

  const ACTION_COLOR = {
    PROFILE_UPDATE:"bg-blue-100 text-blue-700", DESIGNATION_CHANGE:"bg-violet-100 text-violet-700",
    PROMOTION:"bg-green-100 text-green-700", SALARY_GRADE_CHANGE:"bg-amber-100 text-amber-700",
    STATUS_CHANGE:"bg-red-100 text-red-700", JOINING:"bg-teal-100 text-teal-700",
    HR_UPDATE:"bg-indigo-100 text-indigo-700", ROLLBACK:"bg-slate-100 text-slate-700",
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  if (!history.length) return <p className="text-sm text-muted-foreground text-center py-4">No career history recorded</p>;

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {history.map((h, i) => (
        <div key={h.id || i} className="flex gap-3 p-3 bg-muted/20 rounded-xl border border-border">
          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 mt-0.5 ${ACTION_COLOR[h.action] || "bg-muted text-muted-foreground"}`}>
            {h.action?.replace(/_/g," ")}
          </span>
          <div className="flex-1 min-w-0 space-y-0.5">
            {(h.prev_designation || h.new_designation) && (
              <p className="text-xs">{h.prev_designation} → {h.new_designation}</p>
            )}
            {(h.prev_status || h.new_status) && (
              <p className="text-xs">{h.prev_status} → {h.new_status}</p>
            )}
            {h.reason && <p className="text-xs text-muted-foreground">{h.reason}</p>}
            <p className="text-[10px] text-muted-foreground">{fmtT(h.createdAt)} {h.changed_by_name && `· ${h.changed_by_name}`}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function FacultyDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { can, isSuperAdmin } = usePageGuard?.() || { can: () => true, isSuperAdmin: true };
  const fileRef      = useRef();

  const [faculty,        setFaculty]        = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [selectedSession,setSelectedSession]= useState("");
  const [loading,        setLoading]        = useState(true);
  const [blockOpen,      setBlockOpen]      = useState(false);
  const [blockLoading,   setBlockLoading]   = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const load = useCallback(() => {
    axiosInstance.get(EP.faculty.byId(id))
      .then(r => setFaculty(r.data?.data ?? r.data))
      .catch(() => notify.error("Failed to load faculty"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSelectedSession(cur.id);
    }).catch(() => {});
  }, [load]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData(); fd.append("photo", file);
      await axiosInstance.post(`/faculty/${id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      notify.success("Photo updated"); load();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    finally { setPhotoUploading(false); }
  };

  const handleBlock = async () => {
    setBlockLoading(true);
    try {
      const isBlocked = faculty?.user?.isBlocked;
      await axiosInstance.patch(isBlocked ? EP.faculty.unblock(id) : EP.faculty.block(id));
      notify.success(isBlocked ? "Faculty unblocked" : "Faculty blocked");
      setBlockOpen(false); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setBlockLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;
  if (!faculty)  return <div className="text-center py-20 text-sm text-muted-foreground">Faculty not found</div>;

  const blocked = faculty?.user?.isBlocked;
  const f = faculty;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1" />
        <div className="flex gap-2 flex-wrap">
          {blocked
            ? <Button variant="outline" size="sm" onClick={() => setBlockOpen(true)} className="text-green-600"><Shield size={13} className="mr-1.5" />Unblock</Button>
            : <Button variant="outline" size="sm" onClick={() => setBlockOpen(true)} className="text-destructive"><ShieldOff size={13} className="mr-1.5" />Block</Button>
          }
          <Button size="sm" onClick={() => navigate(`/admin/faculty/${id}/edit`)}>
            <Edit size={13} className="mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      {/* ── Profile card ───────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Photo */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
              {f.photo_url
                ? <img src={f.photo_url} alt={f.name} className="w-full h-full object-cover" />
                : <User size={32} className="text-muted-foreground" />
              }
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={photoUploading}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90">
              {photoUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={11} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          {/* Name + quick info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold">{f.name}</h1>
              {blocked && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">BLOCKED</span>}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${f.status==="ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {f.status || "ACTIVE"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{f.designation} · {f.department?.name}</p>
            <p className="text-xs text-muted-foreground">{f.user?.email}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: "Emp ID",        value: f.emp_id,            mono: true },
                { label: "Employee Code", value: f.employee_code,     mono: true },
                { label: "Type",          value: f.employee_type?.replace("_"," ") },
                { label: "Joining Date",  value: fmt(f.joining_date)  },
                { label: "Experience",    value: f.experience_years ? `${f.experience_years} yrs` : null },
                { label: "Salary Grade",  value: f.salary_grade       },
                { label: "Blood Group",   value: f.blood_group        },
                { label: "Teaching",      value: f.is_teaching ? "Yes" : "Non-Teaching" },
              ].map(({ label, value, mono }) => value ? (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Details ───────────────────────────────── */}
      <Section title="Identity & Personal" icon={User}>
        <Grid2>
          <Row label="First Name"     value={f.first_name} />
          <Row label="Last Name"      value={f.last_name} />
          <Row label="Nick Name"      value={f.nick_name} />
          <Row label="Gender"         value={f.gender} />
          <Row label="Date of Birth"  value={fmt(f.dob)} />
          <Row label="Category"       value={f.category} />
          <Row label="Religion"       value={f.religion} />
          <Row label="Blood Group"    value={f.blood_group} />
          <Row label="Aadhar No"      value={f.aadhar_no} mono />
          <Row label="PAN No"         value={f.pan_no}    mono />
          <Row label="Personal Email" value={f.personal_email} />
          <Row label="Phone"          value={f.phone} />
        </Grid2>
      </Section>

      {/* ── Address ────────────────────────────────────────── */}
      {(f.address || f.city || f.state) && (
        <Section title="Address" icon={MapPin} defaultOpen={false}>
          <Grid2>
            <Row label="Address"  value={f.address} />
            <Row label="City"     value={f.city} />
            <Row label="State"    value={f.state} />
            <Row label="Pincode"  value={f.pincode} />
          </Grid2>
        </Section>
      )}

      {/* ── Academic & Professional ────────────────────────── */}
      <Section title="Academic & Professional" icon={GraduationCap}>
        <Grid2>
          <Row label="Department"     value={f.department?.name} />
          <Row label="Designation"    value={f.designation} />
          <Row label="Qualification"  value={f.qualification} />
          <Row label="Specialization" value={f.specialization} />
          <Row label="Experience"     value={f.experience_years ? `${f.experience_years} years` : null} />
          <Row label="Employee Type"  value={f.employee_type?.replace("_"," ")} />
          <Row label="Joining Date"   value={fmt(f.joining_date)} />
          <Row label="Retirement"     value={fmt(f.retirement_date)} />
          <Row label="Is Teaching"    value={f.is_teaching ? "Yes" : "No"} />
          <Row label="Exit Reason"    value={f.exit_reason} />
        </Grid2>
      </Section>

      {/* ── Contact & Emergency ────────────────────────────── */}
      <Section title="Contact & Emergency" icon={Phone} defaultOpen={false}>
        <Grid2>
          <Row label="Phone"               value={f.phone} />
          <Row label="Personal Email"      value={f.personal_email} />
          <Row label="Emergency Contact"   value={f.emergency_contact} />
          <Row label="Emergency Phone"     value={f.emergency_phone} />
          <Row label="Relationship"        value={f.emergency_relation} />
        </Grid2>
      </Section>

      {/* ── HR & Payroll ───────────────────────────────────── */}
      <Section title="HR & Payroll" icon={CreditCard} defaultOpen={false}>
        <Grid2>
          <Row label="Salary Grade" value={f.salary_grade} />
          <Row label="PF Number"    value={f.pf_number}    mono />
          <Row label="ESI Number"   value={f.esi_number}   mono />
          <Row label="Bank Name"    value={f.bank_name} />
          <Row label="IFSC Code"    value={f.bank_ifsc}    mono />
          {isSuperAdmin && (
            <>
              <SensitiveField label="Salary (Monthly)" value={f.salary_encrypted} purpose="salary_view"
                title="View Salary" description={`OTP will be sent to view salary for ${f.name}`} />
              <SensitiveField label="Bank Account No" value={f.bank_account_encrypted} purpose="bank_view"
                title="View Bank Account" description={`OTP will be sent to view bank account for ${f.name}`} />
            </>
          )}
        </Grid2>
      </Section>

      {/* ── Subjects Assigned ──────────────────────────────── */}
      <Section title="Subjects Assigned" icon={BookOpen}
        badge={f.subjects?.length ? String(f.subjects.length) : null}>
        {f.subjects?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {f.subjects.map(fs => (
              <div key={fs.subject?.id || fs.id}
                className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border">
                <BookOpen size={12} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fs.subject?.name}</p>
                  <p className="text-xs text-muted-foreground">{fs.subject?.code}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${fs.subject?.category === "THEORY" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {fs.subject?.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-3">No subjects assigned</p>
        )}
      </Section>

      {/* ── Coordinating Sections ──────────────────────────── */}
      <Section title="Coordinating Sections" icon={Layers}
        badge={f.coordinating_sections?.length ? String(f.coordinating_sections.length) : null}
        defaultOpen={!!f.coordinating_sections?.length}>
        {f.coordinating_sections?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {f.coordinating_sections.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border">
                <Layers size={12} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.branch?.name} · Sem {s.semester} · {s.batch}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-3">Not a coordinator of any section</p>
        )}
      </Section>

      {/* ── Classes (section subjects) ─────────────────────── */}
      <Section title="Classes Assigned" icon={Users} defaultOpen={false}>
        <ClassesSection facultyId={id} />
      </Section>

      {/* ── Timetable ──────────────────────────────────────── */}
      <Section title="Timetable" icon={CalendarDays} defaultOpen={false}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Session:</label>
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
              className="h-8 px-3 rounded-lg border border-input bg-background text-sm flex-1 max-w-64">
              <option value="">Select session…</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.code}{s.is_current ? " ●" : ""}</option>
              ))}
            </select>
          </div>
          <TimetableSection facultyId={id} sessionId={selectedSession} />
        </div>
      </Section>

      {/* ── Leave History ──────────────────────────────────── */}
      <Section title="Leave History" icon={Calendar} defaultOpen={false}>
        <LeaveHistory facultyId={id} />
      </Section>

      {/* ── Career History ─────────────────────────────────── */}
      <Section title="Career History" icon={History} defaultOpen={false}>
        <CareerHistory facultyId={id} />
      </Section>

      {/* Block confirm */}
      <ConfirmModal
        open={blockOpen}
        title={blocked ? "Unblock Faculty" : "Block Faculty"}
        message={blocked
          ? `Unblock ${f.name}? They will be able to log in again.`
          : `Block ${f.name}? They will not be able to log in.`}
        confirmLabel={blocked ? "Unblock" : "Block"}
        variant={blocked ? "info" : "warning"}
        loading={blockLoading}
        onConfirm={handleBlock}
        onClose={() => setBlockOpen(false)}
      />
    </div>
  );
}

// ── Leave History component ───────────────────────────────────
function LeaveHistory({ facultyId }) {
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/leave/faculty/${facultyId}`)
      .then(r => setLeaves(r.data?.data || []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }, [facultyId]);

  const STATUS_COLOR = {
    PENDING:"bg-amber-100 text-amber-700", APPROVED:"bg-green-100 text-green-700",
    REJECTED:"bg-red-100 text-red-700",   CANCELLED:"bg-gray-100 text-gray-600",
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  if (!leaves.length) return <p className="text-sm text-muted-foreground text-center py-4">No leave requests</p>;

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {leaves.map(l => (
        <div key={l.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border">
          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 mt-0.5 ${STATUS_COLOR[l.status] || "bg-muted text-muted-foreground"}`}>
            {l.status}
          </span>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{l.leave_type?.replace("_"," ")} — {l.total_days} day{l.total_days !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground">{fmt(l.from_date)} → {fmt(l.to_date)}</p>
            {l.reason && <p className="text-xs text-muted-foreground">{l.reason}</p>}
            {l.rejection_reason && <p className="text-xs text-red-600">Rejected: {l.rejection_reason}</p>}
            <p className="text-[10px] text-muted-foreground">{fmtT(l.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}