// src/modules/timetable/pages/PeriodConfigPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Save, Loader2,
  Settings, Copy, GripVertical, ChevronDown,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS_ALL = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const PERIOD_TYPES = ["LECTURE", "LAB", "LUNCH", "BREAK", "ASSEMBLY", "OTHER"];

const TYPE_COLOR = {
  LECTURE: "bg-blue-50 text-blue-700 border-blue-200",
  LAB: "bg-green-50 text-green-700 border-green-200",
  LUNCH: "bg-amber-50 text-amber-700 border-amber-200",
  BREAK: "bg-orange-50 text-orange-700 border-orange-200",
  ASSEMBLY: "bg-violet-50 text-violet-700 border-violet-200",
  OTHER: "bg-gray-50 text-gray-600 border-gray-200",
};

const PRESETS = {
  "Standard (8 periods + lunch)": [
    { name: "P1", type: "LECTURE", start_time: "08:00", end_time: "08:50", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "P2", type: "LECTURE", start_time: "08:50", end_time: "09:40", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "P3", type: "LECTURE", start_time: "09:40", end_time: "10:30", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "Break", type: "BREAK", start_time: "10:30", end_time: "10:45", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "P4", type: "LECTURE", start_time: "10:45", end_time: "11:35", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "P5", type: "LECTURE", start_time: "11:35", end_time: "12:25", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "Lunch", type: "LUNCH", start_time: "12:25", end_time: "13:05", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "P6", type: "LECTURE", start_time: "13:05", end_time: "13:55", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "P7", type: "LECTURE", start_time: "13:55", end_time: "14:45", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { name: "P8", type: "LECTURE", start_time: "14:45", end_time: "15:35", days: ["MON", "TUE", "WED", "THU", "FRI"] },
  ],
  "Lab alternate days": [
    { name: "L1", type: "LAB", start_time: "08:00", end_time: "09:30", days: ["MON", "WED", "FRI"] },
    { name: "Break", type: "BREAK", start_time: "09:30", end_time: "09:45", days: ["MON", "WED", "FRI"] },
    { name: "L2", type: "LAB", start_time: "09:45", end_time: "11:15", days: ["MON", "WED", "FRI"] },
    { name: "Lunch", type: "LUNCH", start_time: "11:15", end_time: "12:00", days: ["MON", "WED", "FRI"] },
    { name: "L3", type: "LAB", start_time: "12:00", end_time: "13:30", days: ["MON", "WED", "FRI"] },
  ],
  "Saturday short day": [
    { name: "P1", type: "LECTURE", start_time: "08:00", end_time: "08:50", days: ["SAT"] },
    { name: "P2", type: "LECTURE", start_time: "08:50", end_time: "09:40", days: ["SAT"] },
    { name: "P3", type: "LECTURE", start_time: "09:40", end_time: "10:30", days: ["SAT"] },
    { name: "Break", type: "BREAK", start_time: "10:30", end_time: "10:45", days: ["SAT"] },
    { name: "P4", type: "LECTURE", start_time: "10:45", end_time: "11:35", days: ["SAT"] },
  ],
};

// ── Day toggle component ──────────────────────────────────────
function DayToggle({ value, onChange }) {
  // Ensure value is always array
  const days = Array.isArray(value) ? value : (typeof value === "string" ? value.split(",").map(d => d.trim()) : DAYS_ALL);

  return (
    <div className="flex gap-1">
      {DAYS_ALL.map((d) => {
        const active = days.includes(d);
        return (
          <button key={d} type="button"
            onClick={() => {
              const next = active ? days.filter(x => x !== d) : [...days, d];
              onChange(next);
            }}
            className={`text-[10px] font-bold w-7 h-6 rounded transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {d.slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}

// ── Period row ────────────────────────────────────────────────
function PeriodRow({ period, index, onUpdate, onDelete }) {
  return (
    <div className="grid gap-2 px-4 py-2.5 items-center border-b border-border last:border-0 hover:bg-muted/10"
      style={{ gridTemplateColumns: "28px 1fr 130px 100px 100px 1fr 32px" }}>
      <GripVertical size={14} className="text-muted-foreground/30" />

      {/* Name */}
      <Input
        value={period.name}
        onChange={e => onUpdate("name", e.target.value)}
        className="h-8 text-sm font-medium"
        placeholder="P1 / Lunch…"
      />

      {/* Type */}
      <select
        value={period.type}
        onChange={e => onUpdate("type", e.target.value)}
        className={`h-8 px-2 rounded-md border text-xs font-medium w-full ${TYPE_COLOR[period.type] || TYPE_COLOR.OTHER}`}>
        {PERIOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* Start */}
      <Input
        type="time"
        value={period.start_time}
        onChange={e => onUpdate("start_time", e.target.value)}
        className="h-8 text-sm"
      />

      {/* End */}
      <Input
        type="time"
        value={period.end_time}
        onChange={e => onUpdate("end_time", e.target.value)}
        className="h-8 text-sm"
      />

      {/* Days */}
      <DayToggle
        value={period.days}
        onChange={v => onUpdate("days", v)}
      />

      {/* Delete */}
      <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-destructive justify-self-center">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PeriodConfigPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [periods, setPeriods] = useState([]);  // local state — full control
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Load sessions
  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => { });
  }, []);

  // Load existing periods when session changes
  useEffect(() => {
    if (!sessionId) { setPeriods([]); setDirty(false); return; }
    setLoading(true);
    axiosInstance.get(EP.timetable.periods(sessionId))
      .then(r => {
        const loaded = (r.data?.data || []).map(p => ({
          ...p,
          // Ensure days is always an array
          days: Array.isArray(p.days) ? p.days : (p.days ? String(p.days).split(",") : DAYS_ALL.slice(0, -1)),
        }));
        setPeriods(loaded);
        setDirty(false);
      })
      .catch(() => setPeriods([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Update a single period field
  const updatePeriod = (index, field, value) => {
    setPeriods(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  };

  // Add new blank period
  const addPeriod = () => {
    const lectureCount = periods.filter(p => p.type === "LECTURE").length;
    setPeriods(prev => [...prev, {
      _local_id: `new_${Date.now()}`,
      name: `P${lectureCount + 1}`,
      type: "LECTURE",
      start_time: "",
      end_time: "",
      order: prev.length + 1,
      days: ["MON", "TUE", "WED", "THU", "FRI"],
    }]);
    setDirty(true);
  };

  // Remove a period
  const removePeriod = (index) => {
    setPeriods(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  // Apply preset
  const applyPreset = (name) => {
    if (periods.length > 0 && !confirm(`Replace ${periods.length} existing periods with "${name}" preset?`)) return;
    const preset = PRESETS[name].map((p, i) => ({
      _local_id: `preset_${i}_${Date.now()}`,
      ...p,
      order: i + 1,
    }));
    setPeriods(preset);
    setDirty(true);
    setShowPresets(false);
  };

  // Save all — bulk replace
  const save = async () => {
    if (!sessionId) { notify.error("Select a session"); return; }
    const invalid = periods.findIndex(p => !p.name.trim() || !p.start_time || !p.end_time);
    if (invalid >= 0) {
      notify.error(`Row ${invalid + 1}: name, start time and end time are required`);
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post(EP.timetable.bulkPeriods(sessionId), {
        configs: periods.map((p, i) => ({
          name: p.name.trim(),
          type: p.type || "LECTURE",
          start_time: p.start_time,
          end_time: p.end_time,
          order: i + 1,
          days: Array.isArray(p.days) ? p.days : DAYS_ALL.slice(0, -1),
        })),
        replace: true,
      });
      notify.success(`${periods.length} periods saved`);
      setDirty(false);

      // Reload from server to get proper IDs
      const r = await axiosInstance.get(EP.timetable.periods(sessionId));
      setPeriods((r.data?.data || []).map(p => ({
        ...p,
        days: Array.isArray(p.days) ? p.days : (p.days ? String(p.days).split(",") : DAYS_ALL.slice(0, -1)),
      })));
    } catch (err) { notify.error(err); }
    finally { setSaving(false); }
  };

  const lectureCount = periods.filter(p => p.type === "LECTURE").length;
  const lunchCount = periods.filter(p => p.type === "LUNCH").length;
  const breakCount = periods.filter(p => p.type === "BREAK").length;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/timetable")}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            <h1 className="text-xl font-bold">Period Timings</h1>
            {dirty && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Unsaved changes</span>}
          </div>
          <p className="text-sm text-muted-foreground">Define lecture, lab, lunch and break timings per session</p>
        </div>
        <Button disabled={saving || !sessionId || !dirty} onClick={save}>
          {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
          {saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      {/* Top bar — session + actions */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1.5 flex-1 min-w-48">
          <Label className="text-xs">Session *</Label>
          <select value={sessionId} onChange={e => setSessionId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
            <option value="">Select session…</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name || s.code}{s.is_current ? " ●" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Preset dropdown */}
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowPresets(s => !s)} disabled={!sessionId}>
            <Copy size={13} className="mr-1.5" /> Load Preset <ChevronDown size={11} className="ml-1" />
          </Button>
          {showPresets && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden w-64">
              {Object.keys(PRESETS).map(name => (
                <button key={name} onClick={() => applyPreset(name)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={addPeriod} disabled={!sessionId}>
          <Plus size={13} className="mr-1.5" /> Add Period
        </Button>
      </div>

      {/* Periods table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {periods.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <Settings size={32} className="mx-auto text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {sessionId ? "No periods yet. Load a preset or add manually." : "Select a session first."}
              </p>
              {sessionId && (
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => applyPreset("Standard (8 periods + lunch)")}>
                    <Copy size={13} className="mr-1.5" /> Load Standard Preset
                  </Button>
                  <Button size="sm" onClick={addPeriod}>
                    <Plus size={13} className="mr-1.5" /> Add Period
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid gap-2 px-4 py-2 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground"
                style={{ gridTemplateColumns: "28px 1fr 130px 100px 100px 1fr 32px" }}>
                <span></span>
                <span>Name</span>
                <span>Type</span>
                <span>Start</span>
                <span>End</span>
                <span>Days</span>
                <span></span>
              </div>

              {/* Period rows */}
              {periods.map((p, i) => (
                <PeriodRow
                  key={p.id || p._local_id || `row_${i}`}
                  period={p}
                  index={i}
                  onUpdate={(field, value) => updatePeriod(i, field, value)}
                  onDelete={() => removePeriod(i)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Summary */}
      {periods.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <span className={`px-2.5 py-1 rounded-full border ${TYPE_COLOR.LECTURE}`}>{lectureCount} Lectures</span>
          {lunchCount > 0 && <span className={`px-2.5 py-1 rounded-full border ${TYPE_COLOR.LUNCH}`}>{lunchCount} Lunch</span>}
          {breakCount > 0 && <span className={`px-2.5 py-1 rounded-full border ${TYPE_COLOR.BREAK}`}>{breakCount} Break</span>}
          <span className="ml-auto text-muted-foreground">{periods.length} total slots</span>
        </div>
      )}
    </div>
  );
}