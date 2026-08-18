// src/modules/timetable/pages/SpecialSessionsPage.jsx
import { useState, useEffect } from "react";
import { Video, Plus, X, Loader2, Users, Calendar } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";

const sel   = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const TYPES = ["SEMINAR","WORKSHOP","TRAINING","GUEST_LECTURE"];
const TYPE_COLOR = {
  SEMINAR:"bg-blue-100 text-blue-700", WORKSHOP:"bg-violet-100 text-violet-700",
  TRAINING:"bg-teal-100 text-teal-700", GUEST_LECTURE:"bg-amber-100 text-amber-700",
};
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" }) : "—";

function CreateModal({ sessions, onClose, onSave }) {
  const [form, setForm] = useState({
    session_id:"", title:"", type:"SEMINAR", organizer:"", venue:"",
    from_date:"", to_date:"", from_time:"", to_time:"",
    attendance_counts_as:"PRESENT", description:"",
    section_ids:[], faculty_ids:[],
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  const save = async () => {
    if (!form.title || !form.from_date || !form.session_id) { notify.error("Title, session and start date required"); return; }
    setSaving(true);
    try {
      await axiosInstance.post(EP.timetable.specialSessions, { ...form, to_date: form.to_date || form.from_date });
      notify.success("Special session created");
      onSave();
    } catch (err) { notify.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">New Special Session</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={set("title")} placeholder="Annual Tech Seminar 2025" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Session *</Label>
            <select value={form.session_id} onChange={set("session_id")} className={sel}>
              <option value="">Select…</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <select value={form.type} onChange={set("type")} className={sel}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From Date *</Label>
            <Input type="date" value={form.from_date} onChange={set("from_date")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={form.to_date} onChange={set("to_date")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start Time</Label>
            <Input type="time" value={form.from_time} onChange={set("from_time")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End Time</Label>
            <Input type="time" value={form.to_time} onChange={set("to_time")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Organizer</Label>
            <Input value={form.organizer} onChange={set("organizer")} placeholder="Dept of CSE" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Venue</Label>
            <Input value={form.venue} onChange={set("venue")} placeholder="Main Auditorium" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Attendance Counts As</Label>
            <select value={form.attendance_counts_as} onChange={set("attendance_counts_as")} className={sel}>
              <option value="PRESENT">PRESENT — counts as regular attendance</option>
              <option value="EXCUSED">EXCUSED — excused absence</option>
              <option value="SPECIAL">SPECIAL — separate tracking only</option>
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Description</Label>
            <textarea value={form.description} onChange={set("description")} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none outline-none focus:ring-2 focus:ring-ring"
              placeholder="Details about the event…" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : null}Create
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SpecialSessionsPage() {
  const [sessions,  setSessions]  = useState([]);
  const [sessions2, setSessions2] = useState([]);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [typeFilter,setTypeFilter]= useState("");

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions2(list);
    }).catch(() => {});
    load();
  }, []);

  const load = () => {
    setLoading(true);
    const params = typeFilter ? `?type=${typeFilter}` : "";
    axiosInstance.get(EP.timetable.specialSessions + params)
      .then(r => setItems(r.data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [typeFilter]);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2"><Video size={20} className="text-primary" /><h1 className="text-xl font-bold">Special Sessions</h1></div>
        <Button size="sm" onClick={() => setCreating(true)}><Plus size={13} className="mr-1.5" />Add Session</Button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter("")}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${!typeFilter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
          All
        </button>
        {TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${typeFilter===t ? TYPE_COLOR[t] : "border-border text-muted-foreground hover:bg-muted"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        <p className="font-semibold mb-1">How special session attendance works:</p>
        <p>When a seminar/workshop is scheduled, mark attendance in that session. If <strong>Attendance Counts As = PRESENT</strong>, it's included in student's regular attendance percentage automatically.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-14">
          <Video size={28} className="mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">No special sessions yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreating(true)}><Plus size={13} className="mr-1.5" />Create First</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  {item.organizer && <p className="text-xs text-muted-foreground">{item.organizer}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${TYPE_COLOR[item.type]}`}>{item.type}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar size={10} />{fmt(item.from_date)}{item.to_date && item.to_date !== item.from_date ? ` – ${fmt(item.to_date)}` : ""}</div>
                {item.venue && <div className="flex items-center gap-1 truncate">📍 {item.venue}</div>}
                {item.from_time && <div>⏰ {item.from_time}{item.to_time ? ` – ${item.to_time}` : ""}</div>}
                <div className={`font-medium ${item.attendance_counts_as==="PRESENT" ? "text-green-600" : "text-muted-foreground"}`}>
                  Attendance: {item.attendance_counts_as}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"
                  onClick={() => notify.info("Mark attendance via section detail page")}>
                  <Users size={11} className="mr-1" />Mark Attendance
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <CreateModal sessions={sessions2} onClose={() => setCreating(false)} onSave={() => { setCreating(false); load(); }} />}
    </div>
  );
}