// src/modules/academicSession/pages/AcademicSessionPage.jsx
// List + Create/Edit sessions with calendar period builder
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Plus, Lock, Unlock, CheckCircle, Trash2, GripVertical } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";

const PERIOD_TYPES = [
  { value: "ACADEMIC",     label: "Academic",     color: "green" },
  { value: "NON_ACADEMIC", label: "Non-Academic", color: "gray"  },
];

const PERIOD_LABELS = ["Odd Semester", "Even Semester", "Summer Break", "Winter Break", "Mid-Term Break", "Exam Period", "Practical Exams"];

const emptyPeriod = () => ({ type: "ACADEMIC", label: "Odd Semester", start_date: "", end_date: "", notes: "", _key: Date.now() + Math.random() });

export default function AcademicSessionPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);

  const [form, setForm] = useState({
    name: "", code: "", label: "", start_date: "", end_date: "", notes: "",
    periods: [],
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.sessions.list);
      setSessions(r.data?.data || []);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", code: "", label: "", start_date: "", end_date: "", notes: "", periods: [emptyPeriod()] });
    setShowForm(true);
  };

  const openEdit = (session) => {
    setEditId(session.id);
    setForm({
      name:       session.name,
      code:       session.code,
      label:      session.label || "",
      start_date: session.start_date?.slice(0, 10) || "",
      end_date:   session.end_date?.slice(0, 10)   || "",
      notes:      session.notes || "",
      periods:    (session.periods || []).map((p) => ({ ...p, _key: p.id })),
    });
    setShowForm(true);
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const addPeriod    = () => setForm((f) => ({ ...f, periods: [...f.periods, emptyPeriod()] }));
  const removePeriod = (key) => setForm((f) => ({ ...f, periods: f.periods.filter((p) => p._key !== key) }));
  const setPeriod    = (key, field, val) => setForm((f) => ({ ...f, periods: f.periods.map((p) => p._key === key ? { ...p, [field]: val } : p) }));

  const autoCode = (name) => name.replace(/[^0-9]/g, "").slice(0, 7) || name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);

  const save = async () => {
    if (!form.name || !form.start_date || !form.end_date) { notify.error("Name and dates required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        code:    form.code || autoCode(form.name),
        periods: form.periods.map(({ _key, id, ...p }) => p),
      };
      if (editId) {
        await axiosInstance.patch(EP.sessions.update(editId), payload);
        notify.success("Session updated");
      } else {
        await axiosInstance.post(EP.sessions.create, payload);
        notify.success("Session created");
      }
      setShowForm(false); load();
    } catch (err) { notify.error(err); }
    finally { setSaving(false); }
  };

  const setCurrent = async (id) => {
    try { await axiosInstance.post(EP.sessions.setCurrent(id)); notify.success("Current session updated"); load(); }
    catch (err) { notify.error(err); }
  };

  const toggleLock = async (session) => {
    try {
      const ep = session.is_locked ? EP.sessions.unlock?.(session.id) : EP.sessions.lock(session.id);
      await axiosInstance.post(ep);
      notify.success(session.is_locked ? "Session unlocked" : "Session locked");
      load();
    } catch (err) { notify.error(err); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><CalendarDays size={18} /></div>
          <div><h1 className="text-xl font-bold">Academic Sessions</h1><p className="text-sm text-muted-foreground">{sessions.length} sessions</p></div>
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={13} className="mr-1.5" /> New Session</Button>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {loading ? <div className="text-center py-10 text-sm text-muted-foreground">Loading…</div>
        : sessions.map((s) => (
          <div key={s.id} className={`bg-card border rounded-2xl p-5 space-y-3 ${s.is_current ? "border-primary" : "border-border"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold">{s.name}</h2>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{s.code}</span>
                  {s.is_current && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Current</span>}
                  {s.is_locked  && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Locked</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{fmt(s.start_date)} → {fmt(s.end_date)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!s.is_current && !s.is_locked && (
                  <Button size="sm" variant="outline" onClick={() => setCurrent(s.id)}><CheckCircle size={12} className="mr-1" /> Set Current</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => toggleLock(s)}>
                  {s.is_locked ? <><Unlock size={12} className="mr-1" /> Unlock</> : <><Lock size={12} className="mr-1" /> Lock</>}
                </Button>
                {!s.is_locked && <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>}
              </div>
            </div>

            {/* Calendar periods */}
            {s.periods?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {s.periods.map((p) => (
                  <div key={p.id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${p.type === "ACADEMIC" ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                    <span className="font-medium">{p.label}</span>
                    <span className="opacity-70">{fmt(p.start_date)} – {fmt(p.end_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{editId ? "Edit Session" : "New Academic Session"}</h2>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Session Name *</Label>
                <Input value={form.name} onChange={(e) => { set("name")(e.target.value); if (!editId) set("code")(autoCode(e.target.value)); }} placeholder="2024-25" />
              </div>
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())} placeholder="2024-25" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => set("start_date")(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input type="date" value={form.end_date} onChange={(e) => set("end_date")(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Optional notes…" />
              </div>
            </div>

            {/* Calendar periods */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Calendar Periods</Label>
                <Button size="sm" variant="outline" onClick={addPeriod}><Plus size={12} className="mr-1" /> Add Period</Button>
              </div>
              {form.periods.map((p) => (
                <div key={p._key} className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={p.type} onValueChange={(v) => setPeriod(p._key, "type", v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{PERIOD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Select value={p.label} onValueChange={(v) => setPeriod(p._key, "label", v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{PERIOD_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => removePeriod(p._key)} className="p-2 text-destructive hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Start</Label><Input type="date" value={p.start_date} onChange={(e) => setPeriod(p._key, "start_date", e.target.value)} className="h-9" /></div>
                    <div className="space-y-1"><Label className="text-xs">End</Label><Input type="date" value={p.end_date} onChange={(e) => setPeriod(p._key, "end_date", e.target.value)} className="h-9" /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={save}>{saving ? "Saving…" : editId ? "Save Changes" : "Create Session"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}