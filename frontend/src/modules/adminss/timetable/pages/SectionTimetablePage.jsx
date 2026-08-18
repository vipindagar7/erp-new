// src/modules/timetable/pages/SectionTimetablePage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Lock, Unlock, Loader2, Plus, X, Save,
  History, Camera, RotateCcw, ChevronDown, ChevronRight,
  GripVertical, CheckCircle, AlertCircle, Building2,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import { Input }     from "@/components/ui/input";
import SearchSelect  from "../../../../components/shared/SearchSelect.jsx";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const DAY_LABELS = { MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday", SAT:"Saturday" };
const ENTRY_COLOR = {
  LECTURE: "bg-blue-50 text-blue-800 border-blue-200",
  LAB:     "bg-green-50 text-green-800 border-green-200",
  TUTORIAL:"bg-violet-50 text-violet-800 border-violet-200",
  SEMINAR: "bg-amber-50 text-amber-800 border-amber-200",
  TRAINING:"bg-teal-50 text-teal-800 border-teal-200",
};
const TYPES = ["LECTURE","LAB","TUTORIAL","SEMINAR","TRAINING"];
const sel = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

// ── Room Selector (with clash indicator) ─────────────────────
function RoomSelector({ value, onChange, sessionId, day, periodId, entryId }) {
  const [rooms,    setRooms]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [freeText, setFreeText] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(EP.timetable.rooms, {
      params:{ session_id:sessionId, day, period_config_id:periodId, exclude_entry_id:entryId||undefined },
    }).then(r => setRooms(r.data?.data || [])).catch(() => setRooms([]))
    .finally(() => setLoading(false));
  }, [sessionId, day, periodId]);

  if (freeText) return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Room (free text)</Label>
        <button onClick={() => setFreeText(false)} className="text-xs text-primary underline">Use dropdown</button>
      </div>
      <Input placeholder="Room name / number" value={value?.name||""} onChange={e => onChange({ name:e.target.value, id:null })} className="h-9" />
    </div>
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Room</Label>
        <button onClick={() => setFreeText(true)} className="text-xs text-muted-foreground underline">Free text</button>
      </div>
      {loading ? <div className="text-xs text-muted-foreground py-2">Loading rooms…</div> : (
        <select value={value?.id||""} onChange={e => {
          const r = rooms.find(r => r.id === e.target.value);
          onChange(r ? { id:r.id, name:r.name, code:r.code } : null);
        }} className={sel}>
          <option value="">No room</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id} disabled={!r.available}>
              {r.code} — {r.name} (cap:{r.capacity}){!r.available ? ` ⚠ ${r.clash}` : " ✓"}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ── Entry modal with room selector ───────────────────────────
function EntryModal({ entry, period, day, timetableId, sessionId, onClose, onSave }) {
  const [form, setForm] = useState({
    subject_id:    entry?.subject_id  || "",
    faculty_id:    entry?.faculty_id  || "",
    room_id:       entry?.room_id     || null,
    room_obj:      entry?.room        || null,
    entry_type:    entry?.entry_type  || "LECTURE",
    span_periods:  entry?.span_periods || (entry?.entry_type === "LAB" ? 2 : 1),
    notes:         entry?.notes       || "",
    _subjectLabel: entry?.subject?.name || "",
    _facultyLabel: entry?.faculty?.name || "",
  });
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        day, period_config_id: period.id,
        subject_id:   form.subject_id||null,
        faculty_id:   form.faculty_id||null,
        room_id:      form.room_obj?.id||null,
        entry_type:   form.entry_type,
        span_periods: form.span_periods || 1,
        notes:        form.notes||null,
      };
      if (entry?.id) {
        await axiosInstance.patch(EP.timetable.updateEntry(entry.id), payload);
        notify.success("Slot updated");
      } else {
        await axiosInstance.post(EP.timetable.addEntry(timetableId), payload);
        notify.success("Slot added");
      }
      onSave();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!entry?.id) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(EP.timetable.removeEntry(entry.id));
      notify.success("Slot cleared"); onSave();
    } catch { notify.error("Failed"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{entry ? "Edit Slot" : "Add Slot"}</h3>
            <p className="text-xs text-muted-foreground">{DAY_LABELS[day]} · {period.name} ({period.start_time}–{period.end_time})</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Subject</Label>
          <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
            subLabelKey="code" value={form.subject_id} selectedLabel={form._subjectLabel}
            onChange={(v,opt) => setForm(f => ({ ...f, subject_id:v, _subjectLabel:opt?.name||"" }))}
            placeholder="Search subject…" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Faculty</Label>
          <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
            subLabelKey="designation" value={form.faculty_id} selectedLabel={form._facultyLabel}
            onChange={(v,opt) => setForm(f => ({ ...f, faculty_id:v, _facultyLabel:opt?.name||"" }))}
            placeholder="Search faculty…" />
        </div>

        <RoomSelector
          value={form.room_obj} sessionId={sessionId}
          day={day} periodId={period.id} entryId={entry?.id}
          onChange={r => setForm(f => ({ ...f, room_obj:r, room_id:r?.id||null }))}
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <select value={form.entry_type} onChange={e => {
              const t = e.target.value;
              setForm(f => ({ ...f, entry_type:t, span_periods: t==="LAB" ? 2 : 1 }));
            }} className={sel}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} placeholder="Optional" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Periods Span <span className="text-muted-foreground">(LAB=2)</span></Label>
            <select value={form.span_periods} onChange={e=>setForm(f=>({...f,span_periods:parseInt(e.target.value)}))} className={sel}>
              <option value={1}>1 — Single period</option>
              <option value={2}>2 — Double (Lab / 2hr)</option>
              <option value={3}>3 — Triple</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          {entry && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30" disabled={deleting} onClick={remove}>
              {deleting ? <Loader2 size={12} className="animate-spin" /> : "Clear"}
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Save size={13} className="mr-1"/>}
            {entry ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Draggable slot cell ───────────────────────────────────────
function SlotCell({ entry, period, day, timetableId, locked, onEdit, onDrop, onSplit }) {
  const [dragOver, setDragOver] = useState(false);

  if (["LUNCH","BREAK"].includes(period.type)) return (
    <div className="min-h-[68px] rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center text-xs font-medium text-amber-700">
      {period.name} · {period.start_time}–{period.end_time}
    </div>
  );

  const cls = entry ? (ENTRY_COLOR[entry.entry_type] || ENTRY_COLOR.LECTURE) : "";

  return (
    <div
      className={`${entry?.span_periods===2?"row-span-2 min-h-[140px]":entry?.span_periods===3?"row-span-3 min-h-[210px]":"min-h-[68px]"} rounded-lg border-2 transition-all ${
        dragOver
          ? "border-primary bg-primary/5 scale-105"
          : entry
            ? `${cls} cursor-pointer hover:shadow-sm border`
            : `border-dashed border-border hover:border-primary/40 hover:bg-primary/5 ${locked ? "" : "cursor-pointer"}`
      }`}
      draggable={!locked && !!entry}
      onDragStart={e => {
        if (!entry) return;
        e.dataTransfer.setData("text/json", JSON.stringify({ entry, day, period, timetableId }));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={e => { if (locked) return; e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        if (locked) return;
        e.preventDefault(); setDragOver(false);
        try {
          const src = JSON.parse(e.dataTransfer.getData("text/json"));
          onDrop(src, { day, period, timetableId });
        } catch {}
      }}
      onClick={() => !locked && onEdit()}
    >
      {entry ? (
        <div className="p-2">
          <div className="flex items-start justify-between gap-1">
            <p className="text-[11px] font-bold truncate leading-tight">{entry.subject?.code || "—"}</p>
            {!locked && <GripVertical size={10} className="text-muted-foreground/40 shrink-0 cursor-grab mt-0.5" />}
          </div>
          <p className="text-[10px] truncate opacity-80 leading-tight">{entry.subject?.name || ""}</p>
          {entry.faculty && <p className="text-[10px] font-medium truncate mt-0.5 opacity-90">{entry.faculty.name}</p>}
          {entry.room && (
            <p className="text-[9px] mt-0.5 opacity-60 flex items-center gap-0.5">
              <Building2 size={8}/>{entry.room.code}
            </p>
          )}
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[9px] px-1 rounded ${cls}`}>{entry.entry_type}</span>
            <div className="flex gap-0.5">
              {entry.is_combined && (
                <span className="text-[9px] bg-violet-100 text-violet-700 px-1 rounded">
                  ×{entry.span_periods||2}
                </span>
              )}
              <button
                onClick={e=>{ e.stopPropagation(); onMarkAttendance && onMarkAttendance(entry, day, period); }}
                className="text-[9px] bg-green-100 text-green-700 px-1 rounded hover:bg-green-200 transition-colors"
                title="Mark attendance">✓</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[68px] text-muted-foreground/30">
          <Plus size={14} />
        </div>
      )}
    </div>
  );
}

// ── Snapshots panel ───────────────────────────────────────────
function SnapshotsPanel({ timetableId, onActivate }) {
  const [snaps,   setSnaps]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  useEffect(() => {
    axiosInstance.get(EP.timetable.snapshots(timetableId))
      .then(r => setSnaps(r.data?.data || []))
      .catch(() => setSnaps([]))
      .finally(() => setLoading(false));
  }, [timetableId]);

  const activate = async (snapId) => {
    if (!confirm("Restore this version? Current timetable will be saved first.")) return;
    setActivating(snapId);
    try {
      await axiosInstance.post(EP.timetable.activateSnap(snapId));
      notify.success("Snapshot restored"); onActivate();
    } catch { notify.error("Restore failed"); }
    finally { setActivating(null); }
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  if (!snaps.length) return <div className="text-xs text-muted-foreground text-center py-6">No snapshots yet. Lock/Publish to create one.</div>;

  return (
    <div className="space-y-2">
      {snaps.map(s => (
        <div key={s.id} className={`border rounded-xl p-3 space-y-1.5 ${s.is_active ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{s.label || `Version ${s.version}`}</p>
                {s.is_active && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">ACTIVE</span>}
              </div>
              <p className="text-xs text-muted-foreground">v{s.version} · {new Date(s.createdAt).toLocaleString("en-IN")}</p>
              {s.published_by_name && <p className="text-xs text-muted-foreground">By: {s.published_by_name}</p>}
              {s.reason && <p className="text-xs text-muted-foreground italic">{s.reason}</p>}
            </div>
            {!s.is_active && (
              <Button variant="outline" size="sm" disabled={!!activating} onClick={() => activate(s.id)}>
                {activating===s.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} className="mr-1" />}
                Restore
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── History panel ─────────────────────────────────────────────
function HistoryPanel({ timetableId }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.timetable.history, { params:{ timetable_id:timetableId } })
      .then(r => setLogs(r.data?.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [timetableId]);

  const ACTION_COLOR = {
    ASSIGN:"bg-blue-100 text-blue-700", CLEAR:"bg-red-100 text-red-700",
    SWAP:"bg-violet-100 text-violet-700", DRAG:"bg-teal-100 text-teal-700",
    PUBLISH:"bg-green-100 text-green-700", AUTO_GENERATE:"bg-amber-100 text-amber-700",
    RESTORE:"bg-orange-100 text-orange-700",
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  if (!logs.length) return <div className="text-xs text-muted-foreground text-center py-6">No changes logged yet.</div>;

  return (
    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
      {logs.map(l => (
        <div key={l.id} className="flex gap-2 p-2.5 bg-card border border-border rounded-xl">
          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 mt-0.5 ${ACTION_COLOR[l.action]||"bg-muted text-muted-foreground"}`}>
            {l.action}
          </span>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-xs font-medium">{l.day !== "ALL" ? `${l.day} · ${l.period_config_id}` : "All Slots"}</p>
            {l.notes && <p className="text-xs text-muted-foreground">{l.notes}</p>}
            {l.new_subject_id && !l.notes && <p className="text-xs text-muted-foreground">Subject changed</p>}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {l.changed_by_name && <span>{l.changed_by_name}</span>}
              {l.section?.name && <span>→ {l.section.name}</span>}
              <span className="ml-auto">{new Date(l.createdAt).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground text-center py-2">History cannot be deleted</p>
    </div>
  );
}


// ── Combine confirmation modal ────────────────────────────────
function CombineModal({ show, onConfirm, onCancel, combining, sessionId, day }) {
  const [form, setForm] = useState({
    subject_id:"", faculty_id:"", room_id:null, room_obj:null,
    entry_type:"LAB", combined_label:"",
    _subjectLabel:"", _facultyLabel:"",
  });
  const [open, setOpen] = useState(false);
  useEffect(() => { if (show) setOpen(true); }, [show]);
  if (!show) return null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="bg-violet-600 hover:bg-violet-700">
        Combine {/* show count from parent */}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Combine Selected Slots</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-xs text-violet-700">
              All selected periods will share the same subject, faculty and room.
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
                subLabelKey="code" value={form.subject_id} selectedLabel={form._subjectLabel}
                onChange={(v,opt) => setForm(f => ({ ...f, subject_id:v, _subjectLabel:opt?.name||"" }))}
                placeholder="Search subject…" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Faculty</Label>
              <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
                value={form.faculty_id} selectedLabel={form._facultyLabel}
                onChange={(v,opt) => setForm(f => ({ ...f, faculty_id:v, _facultyLabel:opt?.name||"" }))}
                placeholder="Search faculty…" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select value={form.entry_type} onChange={e => setForm(f => ({ ...f, entry_type:e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                  {["LAB","LECTURE","SEMINAR","TRAINING"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input value={form.combined_label} onChange={e => setForm(f => ({ ...f, combined_label:e.target.value }))}
                  placeholder="e.g. Lab Session" className="h-9" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setOpen(false); onCancel(); }}>Cancel</Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700" disabled={combining}
                onClick={() => { setOpen(false); onConfirm({ subject_id:form.subject_id||null, faculty_id:form.faculty_id||null, room_id:form.room_obj?.id||null, entry_type:form.entry_type, combined_label:form.combined_label||null }); }}>
                {combining ? <Loader2 size={13} className="mr-1 animate-spin"/> : null}Combine
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function SectionTimetablePage() {
  const navigate = useNavigate();
  const [sessions,   setSessions]   = useState([]);
  const [periods,    setPeriods]    = useState([]);
  const [timetable,  setTimetable]  = useState(null);
  const [sessionId,  setSessionId]  = useState("");
  const [sectionId,  setSectionId]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [toggling,   setToggling]   = useState(false);
  const [modal,      setModal]      = useState(null);
  const [panel,      setPanel]      = useState("timetable"); // timetable | snapshots | history
  const [snapping,   setSnapping]   = useState(false);
  const [snapLabel,  setSnapLabel]  = useState("");
  // Combine mode
  const [combineMode,setCombineMode]= useState(false);
  const [selectedDay,setSelectedDay]= useState("MON");
  const [combineSelected, setCombineSelected] = useState([]); // period ids
  const [combining,  setCombining]  = useState(false);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    axiosInstance.get(EP.timetable.periods(sessionId))
      .then(r => setPeriods(r.data?.data || [])).catch(() => setPeriods([]));
  }, [sessionId]);

  const load = useCallback(() => {
    if (!sectionId || !sessionId) return;
    setLoading(true);
    axiosInstance.get(EP.timetable.bySection(sectionId), { params:{ session_id:sessionId } })
      .then(r => setTimetable(r.data?.data || null))
      .catch(() => setTimetable(null))
      .finally(() => setLoading(false));
  }, [sectionId, sessionId]);

  useEffect(() => { load(); }, [load]);

  const locked = timetable?.locked || false;
  const entries = timetable?.entries || [];

  const getEntry = (day, periodId) => entries.find(e => e.day===day && e.period_config_id===periodId) || null;

  // ── Drag & drop handler ───────────────────────────────────
  const handleDrop = async (src, target) => {
    if (src.day === target.day && src.period.id === target.period.id && src.timetableId === target.timetableId) return;
    try {
      const targetEntry = getEntry(target.day, target.period.id);
      await axiosInstance.post(EP.timetable.dragDrop, {
        source_entry_id:     src.entry.id,
        source_timetable_id: src.timetableId,
        source_day:          src.day,
        source_period_id:    src.period.id,
        target_timetable_id: target.timetableId,
        target_day:          target.day,
        target_period_id:    target.period.id,
        swap:                !!targetEntry, // swap if target has entry, move if empty
      });
      notify.success(targetEntry ? "Slots swapped" : "Slot moved");
      load();
    } catch (err) { notify.error(err.response?.data?.message || "Drag failed"); }
  };

  // ── Combine slots ────────────────────────────────────────
  const handleCombine = async (payload) => {
    setCombining(true);
    try {
      await axiosInstance.post(EP.timetable.combine, {
        timetable_id: timetable.id,
        day:          selectedDay,
        period_ids:   combineSelected,
        ...payload,
      });
      notify.success(`${combineSelected.length} slots combined`);
      setCombineSelected([]); setCombineMode(false); load();
    } catch (err) { notify.error(err.response?.data?.message || "Combine failed"); }
    finally { setCombining(false); }
  };

  const handleSplit = async (entryId) => {
    try {
      await axiosInstance.post(EP.timetable.splitEntry(entryId));
      notify.success("Slot split"); load();
    } catch { notify.error("Split failed"); }
  };

  // ── Lock / Publish ────────────────────────────────────────────
  const toggleLock = async () => {
    if (!timetable) return;
    setToggling(true);
    try {
      if (timetable.locked) {
        await axiosInstance.post(EP.timetable.unlock(timetable.id));
        notify.success("Unlocked");
      } else {
        await axiosInstance.post(EP.timetable.lock(timetable.id), {
          label:  snapLabel || "Published Version",
          reason: "Manual publish",
        });
        notify.success("Published & snapshot created");
        setSnapLabel("");
      }
      load();
    } catch { notify.error("Failed"); }
    finally { setToggling(false); }
  };

  // ── Manual snapshot ───────────────────────────────────────
  const createManualSnap = async () => {
    if (!timetable) return;
    setSnapping(true);
    try {
      await axiosInstance.post(EP.timetable.createSnap(timetable.id), {
        label:  snapLabel || "Manual Snapshot",
        reason: "Manual save",
      });
      notify.success("Snapshot saved");
      setSnapLabel("");
    } catch { notify.error("Snapshot failed"); }
    finally { setSnapping(false); }
  };

  const teachingPeriods = periods.filter(p => p.type !== "ASSEMBLY");

  const PANELS = [
    { key:"timetable", label:"Timetable" },
    { key:"snapshots", label:"Snapshots" },
    { key:"history",   label:"History" },
  ];

  return (
    <div className="space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/timetable")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18}/>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Section Timetable</h1>
          {timetable && (
            <p className="text-sm text-muted-foreground">
              {timetable.status}{locked ? " · 🔒 Locked & Published" : " · Draft"}
              {" · "}{entries.length} slots
            </p>
          )}
        </div>
        {timetable && (
          <div className="flex gap-2 items-center">
            <Input value={snapLabel} onChange={e => setSnapLabel(e.target.value)}
              placeholder="Label (optional)…" className="h-9 w-40 text-xs" />
            <Button variant="outline" size="sm" disabled={snapping} onClick={createManualSnap}>
              {snapping ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} className="mr-1"/>}
              Save Snapshot
            </Button>
            <Button variant={locked?"outline":"default"} size="sm" disabled={toggling} onClick={toggleLock}>
              {toggling ? <Loader2 size={13} className="animate-spin mr-1.5" /> : locked ? <Unlock size={13} className="mr-1.5"/> : <Lock size={13} className="mr-1.5"/>}
              {locked ? "Unlock" : "Lock & Publish"}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end bg-card border border-border rounded-2xl p-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Session</Label>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} className="h-9 px-3 rounded-lg border border-input bg-background text-sm min-w-44">
            <option value="">Select session…</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-64 space-y-1.5">
          <Label className="text-xs">Section</Label>
          <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
            subLabelKey="branch.name" value={sectionId} onChange={v => setSectionId(v)} placeholder="Search section…" />
        </div>
      </div>

      {!sectionId && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <p className="text-sm text-muted-foreground">Select a section to view its timetable</p>
        </div>
      )}

      {sectionId && loading && <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div>}

      {sectionId && !loading && !timetable && (
        <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No timetable generated for this section</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/timetable/generate")}>Go to Generate</Button>
        </div>
      )}

      {sectionId && !loading && timetable && (
        <div className="space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {PANELS.map(({ key, label }) => (
              <button key={key} onClick={() => setPanel(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${panel===key?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
                {key==="snapshots" && <Camera size={13}/>}
                {key==="history"   && <History size={13}/>}
                {label}
              </button>
            ))}
          </div>

          {/* Timetable grid */}
          {panel === "timetable" && (
            <div className="space-y-2">
              {!locked && (
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2 flex-1">
                    <GripVertical size={12}/>
                    Drag to move · Drop on filled slot to swap · Click to edit
                  </div>
                  <div className="flex gap-2 items-center">
                    {combineMode ? (
                      <>
                        <select value={selectedDay} onChange={e => { setSelectedDay(e.target.value); setCombineSelected([]); }}
                          className="h-8 px-2 rounded-lg border border-input bg-background text-xs">
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <span className="text-xs text-muted-foreground">{combineSelected.length} selected</span>
                        <CombineModal
                          show={combineSelected.length >= 2}
                          onConfirm={handleCombine}
                          onCancel={() => { setCombineSelected([]); setCombineMode(false); }}
                          combining={combining}
                          sessionId={sessionId} day={selectedDay}
                        />
                        <Button variant="outline" size="sm" onClick={() => { setCombineMode(false); setCombineSelected([]); }}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setCombineMode(true)}>
                        <Plus size={12} className="mr-1"/>Combine Slots
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="border-collapse text-xs w-full" style={{ minWidth:`${DAYS.length*160+160}px` }}>
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="sticky left-0 z-20 bg-muted border-b border-r border-border px-3 py-2.5 text-left font-semibold text-muted-foreground min-w-[150px]">Period</th>
                      {DAYS.map(day => (
                        <th key={day} className="px-2 py-2.5 border-b border-r border-border bg-muted text-center min-w-[150px]">
                          <p className="font-semibold">{DAY_LABELS[day]}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">{entries.filter(e=>e.day===day).length} slots</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teachingPeriods.map(period => (
                      <tr key={period.id} className={["LUNCH","BREAK"].includes(period.type) ? "bg-amber-50/30" : "hover:bg-muted/5"}>
                        <td className={`sticky left-0 z-10 border-b border-r border-border px-3 py-1.5 ${["LUNCH","BREAK"].includes(period.type) ? "bg-amber-50" : "bg-card"}`}>
                          <p className={`font-bold text-xs ${["LUNCH","BREAK"].includes(period.type)?"text-amber-700":""}`}>{period.name}</p>
                          <p className={`text-[10px] ${["LUNCH","BREAK"].includes(period.type)?"text-amber-600":"text-muted-foreground"}`}>{period.start_time}–{period.end_time}</p>
                        </td>
                        {DAYS.map(day => (
                          <td key={day} className="border-b border-r border-border p-1.5">
                            <SlotCell
                              entry={getEntry(day, period.id)}
                              period={period} day={day}
                              timetableId={timetable.id}
                              locked={locked}
                              onEdit={() => setModal({ entry:getEntry(day,period.id), period, day })}
                              onDrop={handleDrop}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {panel === "snapshots" && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
                Snapshots are <strong>immutable</strong> — they cannot be deleted. Activating a snapshot restores the timetable to that version and auto-saves the current state first.
              </div>
              <SnapshotsPanel timetableId={timetable.id} onActivate={load} />
            </div>
          )}

          {panel === "history" && (
            <div className="space-y-3">
              <div className="bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-xs text-muted-foreground">
                Every slot change, drag, swap, publish and restore is logged permanently and cannot be deleted.
              </div>
              <HistoryPanel timetableId={timetable.id} />
            </div>
          )}
        </div>
      )}

      {modal && (
        <EntryModal
          entry={modal.entry} period={modal.period} day={modal.day}
          timetableId={timetable?.id} sessionId={sessionId}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
