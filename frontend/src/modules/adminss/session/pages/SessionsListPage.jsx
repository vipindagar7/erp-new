// src/modules/sessions/pages/SessionsListPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Plus, Lock, CheckCircle, Eye } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";

export default function SessionsListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form,  setForm]  = useState({ name: "", start_date: "", end_date: "" });
  const [confirm, setConfirm] = useState(null);

  const load = () =>
    axiosInstance.get(EP.sessions.list)
      .then((r) => setSessions(r.data?.data?.sessions || r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.start_date || !form.end_date) { notify.error("All fields required"); return; }
    setCreating(true);
    try {
      await axiosInstance.post(EP.sessions.create, form);
      notify.success("Session created"); setShowForm(false); setForm({ name: "", start_date: "", end_date: "" }); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setCreating(false); }
  };

  const setCurrent = async (id) => {
    try { await axiosInstance.post(EP.sessions.setCurrent(id)); notify.success("Current session updated"); load(); }
    catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const lock = async (id) => {
    try { await axiosInstance.post(EP.sessions.lock(id)); notify.success("Session locked"); load(); }
    catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><CalendarDays size={18} /></div>
          <div><h1 className="text-xl font-bold">Academic Sessions</h1><p className="text-sm text-muted-foreground">{sessions.length} sessions</p></div>
        </div>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}><Plus size={13} className="mr-1.5" /> New Session</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold">Create Session</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label className="text-xs">Session Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="2025-26" /></div>
            <div className="space-y-1"><Label className="text-xs">Start Date *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">End Date *</Label><Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={creating} onClick={create}>{creating ? "Creating…" : "Create"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>{["Name","Start","End","Status",""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">Loading…</td></tr>
            : sessions.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">No sessions yet</td></tr>
            : sessions.map((s) => (
              <tr key={s.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.name}</p>
                    {s.is_current && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Current</span>}
                    {s.is_locked  && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Locked</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(s.start_date)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(s.end_date)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.is_current ? "bg-green-100 text-green-700" : s.is_locked ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600"}`}>
                    {s.is_current ? "Active" : s.is_locked ? "Locked" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => navigate(ROUTES.sessions.detail(s.id))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye size={13} /></button>
                    {!s.is_current && !s.is_locked && <button onClick={() => setConfirm({ type: "setCurrent", id: s.id })} className="text-xs text-primary hover:underline">Set Current</button>}
                    {!s.is_locked && <button onClick={() => setConfirm({ type: "lock", id: s.id })} className="text-xs text-muted-foreground hover:text-foreground"><Lock size={12} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        title={confirm?.type === "setCurrent" ? "Set as Current Session?" : "Lock Session?"}
        description={confirm?.type === "lock" ? "Locking prevents further modifications to this session." : "This will make the selected session the current active session."}
        confirmLabel={confirm?.type === "setCurrent" ? "Set Current" : "Lock"}
        onConfirm={async () => { confirm?.type === "setCurrent" ? await setCurrent(confirm.id) : await lock(confirm.id); setConfirm(null); }} />
    </div>
  );
}