// src/modules/adminss/academics/pages/AcademicCalendarPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Plus, Download, Loader2, ChevronLeft, ChevronRight, Trash2, Edit } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const EVENT_COLORS = {
  COMMENCEMENT_OF_CLASSES: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "Commencement" },
  HOLIDAY: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "Holiday" },
  OFF_SATURDAY: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", label: "Off Saturday" },
  ANNUAL_FEST: { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300", label: "Annual Fest" },
  PTM: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "PTM" },
  SESSIONAL_TEST: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "Sessional Test" },
  SESSIONAL_MARKS_DISPLAY: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", label: "Marks Display" },
  ATTENDANCE_ELIGIBILITY: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "Attendance Check" },
  PRE_UNIVERSITY_EXAM: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "Pre-University" },
  LAST_TEACHING_DAY: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300", label: "Last Teaching Day" },
  UNIVERSITY_PRACTICAL: { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-300", label: "Univ. Practical" },
  UNIVERSITY_THEORY_EXAM: { bg: "bg-red-200", text: "text-red-900", border: "border-red-400", label: "Univ. Theory Exam" },
  CLASS_TEST: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Class Test" },
  INTERNAL_PRACTICAL: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300", label: "Internal Practical" },
  WORKING_SATURDAY: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Working Saturday" },
  SPECIAL_EVENT: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", label: "Special Event" },
  HACKATHON: { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-300", label: "Hackathon" },
  CULTURAL_EVENT: { bg: "bg-fuchsia-100", text: "text-fuchsia-800", border: "border-fuchsia-300", label: "Cultural Event" },
  SPORTS_EVENT: { bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-300", label: "Sports Event" },
};

const ALL_TYPES = Object.entries(EVENT_COLORS).map(([k, v]) => ({ key: k, ...v }));

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function AcademicCalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("month"); // month | list
  const [curDate, setCurDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", event_type: "HOLIDAY", start_date: "", end_date: "", is_holiday: false, description: "" });

  useEffect(() => {
    axiosInstance.get(EP.sessions.list)
      .then(r => {
        const s = r.data?.data || [];
        setSessions(s);
        const cur = s.find(x => x.is_current);
        if (cur) setSessionId(cur.id);
      }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    axiosInstance.get(EP.calendar.list + `?session_id=${sessionId}`)
      .then(r => setEvents(r.data?.data || []))
      .catch(() => notify.error("Failed to load calendar"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const saveEvent = async () => {
    if (!form.title || !form.event_type || !form.start_date) { notify.error("Fill required fields"); return; }
    setSaving(true);
    try {
      const payload = { ...form, session_id: sessionId, end_date: form.end_date || form.start_date, is_holiday: form.is_holiday || false };
      if (editEvent) {
        await axiosInstance.patch(EP.calendar.update(editEvent.id), payload);
        notify.success("Updated");
      } else {
        await axiosInstance.post(EP.calendar.create, payload);
        notify.success("Event added");
      }
      // Refresh
      const r = await axiosInstance.get(EP.calendar.list + `?session_id=${sessionId}`);
      setEvents(r.data?.data || []);
      setShowForm(false); setEditEvent(null);
      setForm({ title: "", event_type: "HOLIDAY", start_date: "", end_date: "", is_holiday: false, description: "" });
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await axiosInstance.delete(EP.calendar.delete(id));
      setEvents(prev => prev.filter(e => e.id !== id));
      notify.success("Deleted");
    } catch { notify.error("Failed to delete"); }
  };

  const startEdit = (ev) => {
    setEditEvent(ev);
    setForm({ title: ev.title, event_type: ev.event_type, start_date: ev.start_date?.slice(0, 10), end_date: ev.end_date?.slice(0, 10), is_holiday: ev.is_holiday, description: ev.description || "" });
    setShowForm(true);
  };

  // Month grid
  const year = curDate.getFullYear();
  const month = curDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7; // Mon=0
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));

  const eventsOnDay = (date) => {
    if (!date) return [];
    const ds = date.toISOString().slice(0, 10);
    return events.filter(e => e.start_date?.slice(0, 10) <= ds && e.end_date?.slice(0, 10) >= ds);
  };

  const inp = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
  const sel = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none";

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={20} className="text-primary" />Academic Calendar
          </h1>
          <p className="text-sm text-muted-foreground">EIT Faridabad — AY 2025-26</p>
        </div>
        <div className="flex gap-2">
          <select value={sessionId} onChange={e => setSessionId(e.target.value)}
            className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
            <option value="">Select Session</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setViewMode(viewMode === "month" ? "list" : "month")}
            className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
            {viewMode === "month" ? "List View" : "Month View"}
          </button>
          <button onClick={() => { setEditEvent(null); setForm({ title: "", event_type: "HOLIDAY", start_date: "", end_date: "", is_holiday: false, description: "" }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14} />Add Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_TYPES.slice(0, 10).map(t => (
          <span key={t.key} className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${t.bg} ${t.text} ${t.border}`}>
            {t.label}
          </span>
        ))}
        <span className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground border border-border">+{ALL_TYPES.length - 10} more</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      ) : viewMode === "month" ? (
        <>
          {/* Month nav */}
          <div className="flex items-center gap-3">
            <button onClick={() => setCurDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft size={16} /></button>
            <h2 className="text-base font-bold">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronRight size={16} /></button>
          </div>

          {/* Calendar grid */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map(d => <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date, idx) => {
                const dayEvents = eventsOnDay(date);
                const isToday = date && date.toDateString() === new Date().toDateString();
                return (
                  <div key={idx} className={`min-h-[80px] p-1.5 border-b border-r border-border/40 last:border-r-0 ${!date ? "bg-muted/5" : ""} ${isToday ? "bg-primary/5" : ""}`}>
                    {date && (
                      <>
                        <p className={`text-xs font-semibold mb-1 ${isToday ? "text-primary" : date.getDay() === 0 || date.getDay() === 6 ? "text-red-400" : "text-foreground"}`}>
                          {date.getDate()}
                        </p>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 2).map(e => {
                            const meta = EVENT_COLORS[e.event_type] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
                            return (
                              <div key={e.id} title={e.title}
                                className={`text-[9px] px-1 py-0.5 rounded truncate font-medium border cursor-pointer ${meta.bg} ${meta.text} ${meta.border}`}
                                onClick={() => startEdit(e)}>
                                {e.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 2} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* List View */
        <div className="space-y-2">
          <p className="text-sm font-medium">{events.length} events total</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {events.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No events. <button onClick={() => setShowForm(true)} className="text-primary hover:underline">Add one →</button></div>}
              {events.map(e => {
                const meta = EVENT_COLORS[e.event_type] || { bg: "bg-muted", text: "text-muted-foreground", label: e.event_type };
                return (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${meta.bg.replace("bg-", "bg-").replace("-100", "-500")}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.start_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        {e.end_date !== e.start_date && ` → ${new Date(e.end_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${meta.bg} ${meta.text}`}>{meta.label}</span>
                    {e.is_holiday && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">Holiday</span>}
                    <button onClick={() => startEdit(e)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Edit size={12} /></button>
                    <button onClick={() => deleteEvent(e.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{editEvent ? "Edit Event" : "Add Calendar Event"}</h2>
              <button onClick={() => { setShowForm(false); setEditEvent(null); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="e.g. Sessional Test-1" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Event Type *</label>
                <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value, is_holiday: ["HOLIDAY", "OFF_SATURDAY"].includes(e.target.value) }))} className={sel}>
                  {ALL_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inp} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} placeholder="Optional notes" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_holiday} onChange={e => setForm(f => ({ ...f, is_holiday: e.target.checked }))} className="w-4 h-4 accent-primary" />
                Mark as Holiday (no attendance)
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditEvent(null); }} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={saveEvent} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Saving…" : editEvent ? "Update" : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}