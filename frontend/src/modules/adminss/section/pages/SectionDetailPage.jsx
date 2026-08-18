// src/modules/section/pages/SectionDetailPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Users, Edit2, Trash2, Plus,
  Loader2, History, Camera, RefreshCw, ChevronDown,
  ChevronRight, GraduationCap, X, Save, Building2,
  Layers, Tag, Clock, AlertCircle, CheckCircle, Info,
  ArrowUp, ArrowDown, MoreVertical, Settings,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import SearchSelect  from "../../../../components/shared/SearchSelect.jsx";

// ── Constants ─────────────────────────────────────────────────
const SUBJECT_TYPES = ["REGULAR","ELECTIVE","TRAINING","SEMINAR","AUDIT","LAB","PROJECT","EXTRA"];
const TYPE_COLOR = {
  REGULAR:"bg-blue-100 text-blue-700",   ELECTIVE:"bg-violet-100 text-violet-700",
  TRAINING:"bg-teal-100 text-teal-700",  SEMINAR:"bg-indigo-100 text-indigo-700",
  AUDIT:"bg-gray-100 text-gray-600",     LAB:"bg-green-100 text-green-700",
  PROJECT:"bg-amber-100 text-amber-700", EXTRA:"bg-rose-100 text-rose-700",
};
const CATEGORY_COLOR = {
  THEORY:"bg-sky-50 text-sky-700", PRACTICAL:"bg-emerald-50 text-emerald-700",
  ELECTIVE:"bg-purple-50 text-purple-700",
};
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";
const fmtT = (d) => d ? new Date(d).toLocaleString("en-IN") : "—";

// ── Info row ──────────────────────────────────────────────────
function InfoRow({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

// ── Add/Edit Subject Modal ─────────────────────────────────────
function SubjectModal({ existing, sectionId, onClose, onSave }) {
  const [form, setForm] = useState({
    subject_id:    existing?.subject_id || "",
    faculty_id:    existing?.faculty_id || "",
    type:          existing?.type       || "REGULAR",
    _subjectLabel: existing?.subject?.name || "",
    _facultyLabel: existing?.faculty?.name || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.subject_id) { notify.error("Select a subject"); return; }
    setSaving(true);
    try {
      if (existing) {
        await axiosInstance.patch(
          EP.sections.updateSubject(sectionId, existing.subject_id),
          { faculty_id: form.faculty_id || null, type: form.type }
        );
        notify.success("Updated");
      } else {
        await axiosInstance.post(EP.sections.assignSubject(sectionId), {
          subject_id: form.subject_id,
          faculty_id: form.faculty_id || null,
          type: form.type,
        });
        notify.success("Subject assigned");
      }
      onSave();
    } catch (err) { notify.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{existing ? "Edit Assignment" : "Add Subject"}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
        </div>

        {!existing ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Subject *</Label>
            <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
              subLabelKey="code" value={form.subject_id} selectedLabel={form._subjectLabel}
              onChange={(v, opt) => setForm(f => ({ ...f, subject_id: v, _subjectLabel: opt?.name || "" }))}
              placeholder="Search subject…" />
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl px-3 py-2 text-sm">
            <span className="font-medium">{existing.subject?.name}</span>
            <span className="text-muted-foreground ml-2 text-xs">{existing.subject?.code}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <div className="flex gap-1.5 flex-wrap">
            {SUBJECT_TYPES.map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${form.type===t ? TYPE_COLOR[t] : "border-border text-muted-foreground hover:bg-muted"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Faculty <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
            subLabelKey="designation" value={form.faculty_id} selectedLabel={form._facultyLabel}
            onChange={(v, opt) => setForm(f => ({ ...f, faculty_id: v, _facultyLabel: opt?.name || "" }))}
            placeholder="Search faculty…" />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
            {existing ? "Update" : "Assign"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Subject row ───────────────────────────────────────────────
function SubjectRow({ ss, sectionId, onEdit, onRemove }) {
  const [removing, setRemoving] = useState(false);
  const remove = async () => {
    if (!confirm(`Remove ${ss.subject?.name}?`)) return;
    setRemoving(true);
    try {
      await axiosInstance.delete(EP.sections.removeSubject(sectionId, ss.subject_id));
      notify.success("Removed"); onRemove();
    } catch (err) { notify.error(err); }
    finally { setRemoving(false); }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{ss.subject?.name}</p>
          <span className="text-xs font-mono text-muted-foreground shrink-0">{ss.subject?.code}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${TYPE_COLOR[ss.type] || TYPE_COLOR.REGULAR}`}>{ss.type}</span>
          {ss.subject?.category && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${CATEGORY_COLOR[ss.subject.category] || ""}`}>{ss.subject.category}</span>
          )}
          {ss.subject?.credits && <span className="text-[10px] text-muted-foreground shrink-0">{ss.subject.credits} cr</span>}
        </div>
        {ss.faculty
          ? <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><GraduationCap size={10} />{ss.faculty.name} · {ss.faculty.emp_id}</p>
          : <p className="text-xs text-muted-foreground/50 mt-0.5">No faculty assigned</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
        <button onClick={remove} disabled={removing} className="p-1.5 rounded hover:bg-red-50 text-destructive">
          {removing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────
function HistoryTab({ sectionId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const ACTION_COLOR = {
    CREATE:"bg-green-100 text-green-700", UPDATE:"bg-blue-100 text-blue-700",
    PROMOTE:"bg-violet-100 text-violet-700", DEMOTE:"bg-amber-100 text-amber-700",
    ASSIGN:"bg-teal-100 text-teal-700", REMOVE:"bg-red-100 text-red-700",
    FACULTY_CHANGED:"bg-indigo-100 text-indigo-700", ROLLBACK:"bg-slate-100 text-slate-700",
  };
  useEffect(() => {
    axiosInstance.get(EP.sections.history(sectionId))
      .then(r => setHistory(r.data?.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [sectionId]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>;
  if (!history.length) return <div className="text-center py-12 text-sm text-muted-foreground"><History size={28} className="mx-auto mb-3 opacity-20" />No history</div>;

  return (
    <div className="space-y-2">
      {history.map((h, i) => (
        <div key={h.id||i} className="flex gap-3 p-3 bg-card border border-border rounded-xl">
          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 mt-0.5 ${ACTION_COLOR[h.action] || "bg-muted text-muted-foreground"}`}>{h.action}</span>
          <div className="flex-1 min-w-0 space-y-0.5">
            {h.reason && <p className="text-sm">{h.reason}</p>}
            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
              {h.changed_by_name && <span>By: {h.changed_by_name}</span>}
              {h.changed_by_role && <span>{h.changed_by_role}</span>}
              <span className="ml-auto">{fmtT(h.createdAt)}</span>
            </div>
            {h.changed_fields?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {h.changed_fields.map(f => <span key={f} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{f}</span>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Snapshots tab ─────────────────────────────────────────────
function SnapshotsTab({ sectionId }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null);

  useEffect(() => {
    axiosInstance.get(`/sections/${sectionId}/snapshots`)
      .then(r => setSnapshots(r.data?.data || []))
      .catch(() => setSnapshots([]))
      .finally(() => setLoading(false));
  }, [sectionId]);

  const TRIGGER_COLOR = {
    PROMOTE:"bg-violet-100 text-violet-700", DEMOTE:"bg-amber-100 text-amber-700",
    FYE_SPLIT:"bg-teal-100 text-teal-700",   MANUAL:"bg-blue-100 text-blue-700",
    ROLLBACK:"bg-slate-100 text-slate-700",  AUTO:"bg-gray-100 text-gray-600",
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>;
  if (!snapshots.length) return (
    <div className="text-center py-12 space-y-3">
      <Camera size={28} className="mx-auto text-muted-foreground/20" />
      <p className="text-sm text-muted-foreground">No snapshots yet</p>
      <p className="text-xs text-muted-foreground/60">Snapshots are auto-created on promote, demote or split</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {snapshots.map(s => (
        <div key={s.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <button onClick={() => setExpanded(expanded===s.id ? null : s.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/10 text-left">
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${TRIGGER_COLOR[s.trigger] || "bg-muted text-muted-foreground"}`}>
              {s.trigger}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {s.from_semester && s.to_semester ? `Sem ${s.from_semester} → ${s.to_semester}` : "Snapshot"}
              </p>
              <p className="text-xs text-muted-foreground">{s.triggered_by_name||"System"} · {fmtT(s.createdAt)}</p>
            </div>
            {s.rolled_back_at && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Used for rollback</span>}
            {expanded===s.id ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
          </button>
          {expanded===s.id && (
            <div className="border-t border-border p-4 space-y-3 bg-muted/5">
              {s.reason && <p className="text-sm text-muted-foreground">{s.reason}</p>}
              {s.notes  && <p className="text-xs text-muted-foreground">{s.notes}</p>}
              {/* Students at snapshot time */}
              {Array.isArray(s.students_data) && s.students_data.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Students at time of snapshot ({s.students_data.length})</p>
                  <div className="max-h-52 overflow-y-auto space-y-1 border border-border rounded-lg">
                    {s.students_data.slice(0,50).map((st, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-xs border-b border-border last:border-0">
                        <span className="font-medium flex-1 truncate">{st.name}</span>
                        <span className="text-muted-foreground font-mono">{st.roll_no||st.enrollment_no||"—"}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${st.status==="ACTIVE"?"bg-green-100 text-green-700":"bg-muted text-muted-foreground"}`}>{st.status}</span>
                      </div>
                    ))}
                    {s.students_data.length > 50 && <p className="text-xs text-muted-foreground text-center py-2">+{s.students_data.length-50} more</p>}
                  </div>
                </div>
              )}
              {/* Subjects at snapshot time */}
              {Array.isArray(s.subjects_data) && s.subjects_data.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Subjects ({s.subjects_data.length})</p>
                  <div className="flex gap-1 flex-wrap">
                    {s.subjects_data.map((sub, i) => (
                      <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                        {sub.code||sub.subject_code||sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function SectionDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [section,     setSection]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("subjects");
  const [modal,       setModal]       = useState(false);
  const [autoLoading,   setAutoLoading]   = useState(false);
  const [actionModal,   setActionModal]   = useState(null); // 'promote'|'demote'|'status'
  const [actionLoading, setActionLoading] = useState(false);
  const [statusValue,   setStatusValue]   = useState("");
  const [actionReason,  setActionReason]  = useState("");

  const doAction = async (type) => {
    setActionLoading(true);
    try {
      if (type === "promote") {
        await axiosInstance.post(`/sections/${id}/promote`, { reason: actionReason });
        notify.success("Section promoted");
      } else if (type === "demote") {
        await axiosInstance.post(`/sections/${id}/demote`, { reason: actionReason });
        notify.success("Section demoted");
      } else if (type === "status") {
        await axiosInstance.patch(EP.sections.update(id), { status: statusValue, reason: actionReason });
        notify.success(`Status changed to ${statusValue}`);
      }
      setActionModal(null); setActionReason(""); setStatusValue("");
      load();
    } catch (err) { notify.error(err); }
    finally { setActionLoading(false); }
  };

  const load = useCallback(() => {
    setLoading(true);
    axiosInstance.get(EP.sections.byId(id))
      .then(r => setSection(r.data?.data))
      .catch(() => notify.error("Failed to load section"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const autoAssign = async () => {
    setAutoLoading(true);
    try {
      const r = await axiosInstance.post(`/sections/${id}/auto-assign-subjects`);
      const d = r.data?.data;
      notify.success(`Assigned: ${d?.assigned?.length||0} subjects`);
      load();
    } catch (err) { notify.error(err); }
    finally { setAutoLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;
  if (!section) return <div className="text-center py-20 text-sm text-muted-foreground">Section not found</div>;

  const subjects = section.sectionSubjects || [];

  const TYPE_ORDER = ["REGULAR","LAB","ELECTIVE","SEMINAR","TRAINING","AUDIT","PROJECT","EXTRA"];

  // Breadcrumb: Dept › Program › Branch › Section
  const dept    = section.branch?.program?.department;
  const program = section.branch?.program;
  const branch  = section.branch;
  const breadcrumb = [dept?.name, program?.name, branch?.name, section.name].filter(Boolean).join(" › ");

  const TABS = [
    { key:"subjects", label:"Subjects", icon: BookOpen },
    { key:"history",  label:"History",  icon: History  },
    { key:"snapshots",label:"Snapshots",icon: Camera   },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{breadcrumb}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{section.name}</h1>
            <span className="text-xs font-mono text-muted-foreground">{section.code}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${section.status==="ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {section.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/sections/${id}/students`)}>
            <Users size={13} className="mr-1.5" />{section._count?.students||0} Students
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setStatusValue(section?.status||"ACTIVE"); setActionModal("status"); }}>
            <Settings size={13} className="mr-1.5" />Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActionModal("promote")}>
            <ArrowUp size={13} className="mr-1.5" />Promote
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActionModal("demote")}>
            <ArrowDown size={13} className="mr-1.5" />Demote
          </Button>
          <Button size="sm" onClick={() => navigate(`/admin/sections/${id}/edit`)}>
            <Edit2 size={13} className="mr-1.5" />Edit
          </Button>
        </div>
      </div>

      {/* Section info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Semester",     value:`Sem ${section.semester}` },
          { label:"Academic Year",value: section.academic_year || "—" },
          { label:"Batch",        value: section.batch || "—" },
          { label:"Capacity",     value: section.capacity || "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Academic hierarchy */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Academic Details</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoRow label="Department"  value={dept?.name}    />
          <InfoRow label="Program"     value={program?.name} />
          <InfoRow label="Branch"      value={branch?.name}  />
          <InfoRow label="Branch Code" value={branch?.code}  mono />
          <InfoRow label="Room No"     value={section.room_no} />
          <InfoRow label="Description" value={section.description} />
        </div>
        {section.class_coordinator && (
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
            <GraduationCap size={14} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Class Coordinator</p>
              <p className="text-sm font-medium">{section.class_coordinator.name}
                <span className="text-xs text-muted-foreground ml-2">{section.class_coordinator.designation} · {section.class_coordinator.emp_id}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── Subjects Tab — Semester-wise ──────────────────────────── */}
      {tab === "subjects" && (
        <div className="space-y-5">

          {/* Centralized Auto-fetch banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold">Auto-fetch from Curriculum</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pulls all subjects for this section's program from the curriculum and assigns them automatically.
                Existing assignments are preserved.
              </p>
            </div>
            <Button disabled={autoLoading} onClick={autoAssign} className="shrink-0">
              {autoLoading
                ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Fetching…</>
                : <><RefreshCw size={13} className="mr-1.5" />Auto-fetch All Semesters</>}
            </Button>
          </div>

          {/* Semester-wise subject list */}
          {subjects.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
              <BookOpen size={28} className="mx-auto text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
              <p className="text-xs text-muted-foreground/70">
                Use Auto-fetch to load from curriculum, or add subjects manually
              </p>
              <Button size="sm" onClick={() => setModal("new")}><Plus size={13} className="mr-1.5" />Add Subject</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group by semester */}
              {(() => {
                // Build sem → subjects map
                const bySem = {};
                for (const ss of subjects) {
                  const sem = ss.session?.name || "Current";
                  if (!bySem[sem]) bySem[sem] = {};
                  const t = ss.type || "REGULAR";
                  if (!bySem[sem][t]) bySem[sem][t] = [];
                  bySem[sem][t].push(ss);
                }
                // Sort sems — current first
                const semKeys = Object.keys(bySem).sort((a,b) => {
                  if (a === "Current") return -1;
                  if (b === "Current") return 1;
                  return a.localeCompare(b);
                });
                return semKeys.map(sem => {
                  const semSubjects = bySem[sem];
                  const totalInSem  = Object.values(semSubjects).flat().length;
                  return (
                    <div key={sem} className="space-y-2">
                      {/* Sem header */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                            Sem {section.semester}
                          </span>
                          {sem !== "Current" && (
                            <span className="text-xs text-muted-foreground">({sem})</span>
                          )}
                          <span className="text-xs text-muted-foreground">{totalInSem} subject{totalInSem!==1?"s":""}</span>
                        </div>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Type-wise within this sem */}
                      {TYPE_ORDER.filter(t => semSubjects[t]?.length).map(type => (
                        <div key={type} className="bg-card border border-border rounded-2xl overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b border-border">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${TYPE_COLOR[type]}`}>{type}</span>
                            <span className="text-[10px] text-muted-foreground">{semSubjects[type].length}</span>
                          </div>
                          {semSubjects[type].map(ss => (
                            <SubjectRow key={ss.id||ss.subject_id} ss={ss} sectionId={id}
                              onEdit={() => setModal(ss)} onRemove={load} />
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}

              {/* Add manual subject */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">Add elective, training, seminar or extra subject manually</p>
                <Button variant="outline" size="sm" onClick={() => setModal("new")}>
                  <Plus size={13} className="mr-1.5" />Add Subject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "history"   && <HistoryTab   sectionId={id} />}
      {tab === "snapshots" && <SnapshotsTab sectionId={id} />}

      {/* Action Modals */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {actionModal === "promote" ? "Promote Section"
                : actionModal === "demote"  ? "Demote Section"
                : "Change Status"}
              </h3>
              <button onClick={() => { setActionModal(null); setActionReason(""); }}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
            </div>

            {actionModal === "status" && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">New Status</label>
                <select value={statusValue} onChange={e => setStatusValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  {["ACTIVE","INACTIVE","MERGED","DISCONTINUED","GRADUATED"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {actionModal === "promote" && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-700 space-y-1">
                <p className="font-semibold">Promote: Sem {section?.semester} → {(section?.semester||0)+1}</p>
                <p>All active students will move to next semester. A snapshot will be created.</p>
              </div>
            )}
            {actionModal === "demote" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 space-y-1">
                <p className="font-semibold">Demote: Sem {section?.semester} → {(section?.semester||2)-1}</p>
                <p>Section semester will decrease by 1. A snapshot will be created.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Reason (optional)</label>
              <textarea value={actionReason} onChange={e => setActionReason(e.target.value)}
                placeholder="Reason for this change…"
                className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setActionModal(null); setActionReason(""); }}>
                Cancel
              </Button>
              <Button className={`flex-1 ${actionModal==="demote" ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                disabled={actionLoading || (actionModal==="status" && !statusValue)}
                onClick={() => doAction(actionModal)}>
                {actionLoading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : null}
                {actionModal === "promote" ? "Promote"
                : actionModal === "demote"  ? "Demote"
                : "Change Status"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <SubjectModal
          existing={modal==="new" ? null : modal}
          sectionId={id}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); load(); }}
        />
      )}
    </div>
  );
}