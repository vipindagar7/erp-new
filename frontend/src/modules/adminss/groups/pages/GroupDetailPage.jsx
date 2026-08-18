// src/modules/groups/pages/GroupDetailPage.jsx
// Group detail with 7 feature tabs: Announcements, Attendance, Tasks, Polls, Files, Notices, Bookings
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Users, Megaphone, Calendar, CheckSquare, BarChart3, FolderOpen, Bell, DoorOpen, X } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Textarea}from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TABS = [
  { key: "members",       label: "Members",     icon: Users },
  { key: "announcements", label: "Announce",    icon: Megaphone },
  { key: "attendance",    label: "Attendance",  icon: Calendar },
  { key: "tasks",         label: "Tasks",       icon: CheckSquare },
  { key: "polls",         label: "Polls",       icon: BarChart3 },
  { key: "files",         label: "Files",       icon: FolderOpen },
  { key: "notices",       label: "Notices",     icon: Bell },
  { key: "bookings",      label: "Bookings",    icon: DoorOpen },
];

function useTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "members";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });
  return [tab, setTab];
}

function Section({ title, children, action }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>{action}</div>
      {children}
    </div>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab,  setTab]  = useTab();
  const [group, setGroup] = useState(null);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({});

  const loadGroup = async () => {
    try { const r = await axiosInstance.get(EP.groups.byId(id)); setGroup(r.data?.data); }
    catch { notify.error("Group not found"); navigate(ROUTES.groups.list); }
    finally { setLoading(false); }
  };

  const loadTab = async () => {
    if (tab === "members") { setData(null); return; }
    try {
      const EP_MAP = {
        announcements: EP.groups.announcements(id),
        attendance:    EP.groups.attendance(id),
        tasks:         EP.groups.tasks(id),
        polls:         EP.groups.polls(id),
        files:         EP.groups.files(id),
        notices:       EP.groups.notices(id),
        bookings:      EP.groups.bookings(id),
      };
      const r = await axiosInstance.get(EP_MAP[tab]);
      setData(r.data?.data?.items || r.data?.data || []);
    } catch { setData([]); }
  };

  useEffect(() => { loadGroup(); }, [id]);
  useEffect(() => { loadTab(); }, [tab]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (k) => (e) => set(k)(e.target.value);

  const create = async (url, payload) => {
    setCreating(true);
    try {
      await axiosInstance.post(url, payload);
      notify.success("Created");
      setForm({});
      loadTab();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setCreating(false); }
  };

  const del = async (url) => {
    if (!confirm("Delete this item?")) return;
    await axiosInstance.delete(url).catch(() => {});
    loadTab();
  };

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!group)  return null;

  const members = group.members || [];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.groups.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{group.name}</h1>
            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{group.type}</span>
            {!group.is_active && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Inactive</span>}
          </div>
          {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
        </div>
        <div className="ml-auto flex gap-2">
          <span className="text-xs text-muted-foreground self-center">{group._count?.members || members.length} members</span>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.groups.edit(id))}>Edit</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ─── Members ──────────────────────────── */}
      {tab === "members" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>{["Student","Roll No","Section","Department"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-sm text-muted-foreground">No members yet</td></tr>
                : members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{m.student?.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{m.student?.roll_no}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.student?.section?.name} — Sem {m.student?.section?.semester}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.student?.department?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Announcements ──────────────────── */}
      {tab === "announcements" && (
        <div className="space-y-4">
          <Section title="Post Announcement" action={null}>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={form.title||""} onChange={setE("title")} placeholder="Announcement title…" /></div>
              <div className="space-y-1"><Label className="text-xs">Body</Label><Textarea value={form.body||""} onChange={setE("body")} rows={3} placeholder="Message…" /></div>
              <Button size="sm" disabled={creating} onClick={() => create(EP.groups.announcements(id), { title: form.title, body: form.body, priority: "MEDIUM" })}>
                <Plus size={12} className="mr-1" />{creating ? "Posting…" : "Post"}
              </Button>
            </div>
          </Section>
          <Section title={`Announcements (${(data||[]).length})`}>
            <div className="space-y-2">
              {(data||[]).map((a) => (
                <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-1"><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground mt-0.5">{a.body}</p></div>
                  <button onClick={() => del(`${EP.groups.announcements(id)}/${a.id}`)} className="p-1.5 text-muted-foreground hover:text-destructive"><X size={13} /></button>
                </div>
              ))}
              {(data||[]).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No announcements yet</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ─── Tasks ──────────────────────────── */}
      {tab === "tasks" && (
        <div className="space-y-4">
          <Section title="Create Task">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={form.title||""} onChange={setE("title")} placeholder="Task title" /></div>
                <div className="space-y-1"><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date||""} onChange={setE("due_date")} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={form.description||""} onChange={setE("description")} rows={2} /></div>
              <Button size="sm" disabled={creating} onClick={() => create(EP.groups.tasks(id), { title: form.title, description: form.description, due_date: form.due_date, priority: "MEDIUM" })}>
                <Plus size={12} className="mr-1" />{creating ? "Creating…" : "Create Task"}
              </Button>
            </div>
          </Section>
          <Section title={`Tasks (${(data||[]).length})`}>
            <div className="space-y-2">
              {(data||[]).map((t) => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                    {t.due_date && <p className="text-xs text-muted-foreground mt-0.5">Due: {new Date(t.due_date).toLocaleDateString("en-IN")}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.status === "DONE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{t.status||"OPEN"}</span>
                </div>
              ))}
              {(data||[]).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No tasks yet</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ─── Notices ────────────────────────── */}
      {tab === "notices" && (
        <div className="space-y-4">
          <Section title="Post Notice">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={form.title||""} onChange={setE("title")} placeholder="Notice title…" /></div>
              <div className="space-y-1"><Label className="text-xs">Body</Label><Textarea value={form.body||""} onChange={setE("body")} rows={3} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="mandatory" checked={!!form.is_mandatory} onChange={(e) => set("is_mandatory")(e.target.checked)} />
                <Label htmlFor="mandatory" className="text-xs font-normal">Mark as mandatory</Label>
              </div>
              <Button size="sm" disabled={creating} onClick={() => create(EP.groups.notices(id), { title: form.title, body: form.body, is_mandatory: !!form.is_mandatory })}>
                <Plus size={12} className="mr-1" />{creating ? "Posting…" : "Post Notice"}
              </Button>
            </div>
          </Section>
          <Section title={`Notices (${(data||[]).length})`}>
            <div className="space-y-2">
              {(data||[]).map((n) => (
                <div key={n.id} className={`bg-card border rounded-xl p-4 flex gap-3 ${n.is_mandatory ? "border-amber-300" : "border-border"}`}>
                  <div className="flex-1"><p className="font-medium text-sm">{n.title}</p><p className="text-xs text-muted-foreground mt-0.5">{n.body}</p></div>
                  {n.is_mandatory && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium self-start">Mandatory</span>}
                </div>
              ))}
              {(data||[]).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No notices yet</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ─── Polls ──────────────────────────── */}
      {tab === "polls" && (
        <div className="space-y-4">
          <Section title="Create Poll">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="space-y-1"><Label className="text-xs">Question</Label><Input value={form.question||""} onChange={setE("question")} placeholder="Poll question…" /></div>
              <div className="space-y-1"><Label className="text-xs">Choices (one per line)</Label><Textarea value={form.choices_raw||""} onChange={setE("choices_raw")} rows={3} placeholder={"Option A\nOption B\nOption C"} /></div>
              <Button size="sm" disabled={creating} onClick={() => create(EP.groups.polls(id), { question: form.question, choices: (form.choices_raw||"").split("\n").map((s)=>s.trim()).filter(Boolean), poll_type: "SINGLE" })}>
                <Plus size={12} className="mr-1" />{creating ? "Creating…" : "Create Poll"}
              </Button>
            </div>
          </Section>
          <Section title={`Polls (${(data||[]).length})`}>
            <div className="space-y-3">
              {(data||[]).map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <p className="font-medium text-sm">{p.question}</p>
                  <div className="space-y-1">
                    {(p.choices||[]).map((c) => {
                      const count  = c._count?.responses || 0;
                      const total  = p._count?.responses || 1;
                      const pct    = Math.round((count / total) * 100);
                      return (
                        <div key={c.id} className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                          <p className="text-xs w-32 truncate">{c.text}</p>
                          <p className="text-xs text-muted-foreground w-10 text-right">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">{p._count?.responses || 0} total responses · {p.is_active ? "Active" : "Closed"}</p>
                </div>
              ))}
              {(data||[]).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No polls yet</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ─── Files ──────────────────────────── */}
      {tab === "files" && (
        <div className="space-y-4">
          <Section title="Share File">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">File Name</Label><Input value={form.file_name||""} onChange={setE("file_name")} placeholder="report.pdf" /></div>
                <div className="space-y-1"><Label className="text-xs">File URL</Label><Input value={form.file_url||""} onChange={setE("file_url")} placeholder="https://…" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Description (optional)</Label><Input value={form.description||""} onChange={setE("description")} /></div>
              <Button size="sm" disabled={creating} onClick={() => create(EP.groups.files(id), { file_name: form.file_name, file_url: form.file_url, description: form.description })}>
                <Plus size={12} className="mr-1" />{creating ? "Adding…" : "Add File"}
              </Button>
            </div>
          </Section>
          <Section title={`Files (${(data||[]).length})`}>
            <div className="space-y-2">
              {(data||[]).map((f) => (
                <div key={f.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1"><p className="font-medium text-sm">{f.file_name}</p>{f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}</div>
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open</a>
                </div>
              ))}
              {(data||[]).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No files shared yet</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ─── Attendance ─────────────────────── */}
      {tab === "attendance" && (
        <div className="space-y-4">
          <Section title="Request Attendance Exemption">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Event Name</Label><Input value={form.event_name||""} onChange={setE("event_name")} /></div>
                <div className="space-y-1"><Label className="text-xs">Event Date</Label><Input type="date" value={form.event_date||""} onChange={setE("event_date")} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Reason</Label><Textarea value={form.reason||""} onChange={setE("reason")} rows={2} /></div>
              <Button size="sm" disabled={creating} onClick={() => create(EP.groups.attendance(id), { event_name: form.event_name, event_date: form.event_date, reason: form.reason })}>
                <Plus size={12} className="mr-1" />{creating ? "Requesting…" : "Submit Request"}
              </Button>
            </div>
          </Section>
          <Section title={`Requests (${(data||[]).length})`}>
            <div className="space-y-2">
              {(data||[]).map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div><p className="font-medium text-sm">{r.event_name}</p><p className="text-xs text-muted-foreground">{new Date(r.event_date).toLocaleDateString("en-IN")}</p></div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.status === "APPROVED" ? "bg-green-100 text-green-700" : r.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                  </div>
                </div>
              ))}
              {(data||[]).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No attendance requests</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ─── Bookings ───────────────────────── */}
      {tab === "bookings" && (
        <div className="space-y-4">
          <Section title="Request Room Booking">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Room Name</Label><Input value={form.room_name||""} onChange={setE("room_name")} placeholder="Seminar Hall A" /></div>
                <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={form.booking_date||""} onChange={setE("booking_date")} /></div>
                <div className="space-y-1"><Label className="text-xs">From Time</Label><Input type="time" value={form.from_time||""} onChange={setE("from_time")} /></div>
                <div className="space-y-1"><Label className="text-xs">To Time</Label><Input type="time" value={form.to_time||""} onChange={setE("to_time")} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Purpose</Label><Input value={form.purpose||""} onChange={setE("purpose")} /></div>
              <Button size="sm" disabled={creating} onClick={() => create(EP.groups.bookings(id), { room_name: form.room_name, booking_date: form.booking_date, from_time: form.from_time, to_time: form.to_time, purpose: form.purpose })}>
                <Plus size={12} className="mr-1" />{creating ? "Requesting…" : "Request Booking"}
              </Button>
            </div>
          </Section>
          <Section title={`Bookings (${(data||[]).length})`}>
            <div className="space-y-2">
              {(data||[]).map((b) => (
                <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.room_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.booking_date).toLocaleDateString("en-IN")} · {b.from_time}–{b.to_time}</p>
                    <p className="text-xs text-muted-foreground">{b.purpose}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${b.status === "APPROVED" ? "bg-green-100 text-green-700" : b.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{b.status}</span>
                </div>
              ))}
              {(data||[]).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No bookings yet</p>}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}