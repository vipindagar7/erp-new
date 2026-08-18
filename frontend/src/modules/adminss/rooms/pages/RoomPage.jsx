// src/modules/rooms/pages/RoomsPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
    Building2, Plus, Search, Upload, Download, Edit2, Trash2,
    X, Loader2, Users, BookOpen, Tag, Filter,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const ROOM_TYPES = ["CLASSROOM", "LAB", "SEMINAR_HALL", "AUDITORIUM", "TRAINING_ROOM", "CONFERENCE_ROOM", "LIBRARY", "OTHER"];
const TYPE_COLOR = {
    CLASSROOM: "bg-blue-100 text-blue-700", LAB: "bg-green-100 text-green-700",
    SEMINAR_HALL: "bg-violet-100 text-violet-700", AUDITORIUM: "bg-amber-100 text-amber-700",
    TRAINING_ROOM: "bg-teal-100 text-teal-700", CONFERENCE_ROOM: "bg-indigo-100 text-indigo-700",
    LIBRARY: "bg-rose-100 text-rose-700", OTHER: "bg-gray-100 text-gray-600",
};

const STAFF_ROLES = [
    { value: "LAB_STAFF", label: "Lab Staff" },
    { value: "IT_PERSON", label: "IT Person" },
    { value: "INCHARGE", label: "Room Incharge" },
    { value: "MAINTENANCE", label: "Maintenance" },
];

const EMPTY_FORM = { name: "", code: "", type: "CLASSROOM", capacity: "60", block: "", floor: "", dept_id: "", description: "", is_active: true };

function RoomModal({ room, onClose, onSave }) {
    const [form, setForm] = useState(room ? {
        name: room.name, code: room.code, type: room.type, capacity: String(room.capacity),
        block: room.block || "", floor: room.floor || "", dept_id: room.dept_id || "",
        description: room.description || "", is_active: room.is_active,
    } : { ...EMPTY_FORM });
    const [subjects, setSubjects] = useState(room?.subjects?.map(s => s.subject) || []);
    const [staff, setStaff] = useState(room?.staff || []);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState("basic");

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async () => {
        if (!form.name.trim()) { notify.error("Name required"); return; }
        if (!form.code.trim()) { notify.error("Code required"); return; }
        setSaving(true);
        try {
            const payload = {
                ...form,
                capacity: parseInt(form.capacity) || 60,
                subject_ids: subjects.map(s => s.id),
                staff_ids: staff.map(s => ({ user_id: s.user_id || s.user?.id, role: s.role })),
            };
            if (room) {
                await axiosInstance.patch(EP.rooms.byId(room.id), payload);
            } else {
                await axiosInstance.post(EP.rooms.list, payload);
            }
            notify.success(room ? "Room updated" : "Room created");
            onSave();
        } catch (err) { notify.error(err); }
        finally { setSaving(false); }
    };

    const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2 className="font-semibold">{room ? "Edit Room/Lab" : "Add Room/Lab"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X size={15} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border shrink-0">
                    {[["basic", "Basic Info"], ["subjects", "Subjects"], ["staff", "Staff"]].map(([k, l]) => (
                        <button key={k} onClick={() => setTab(k)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
                            {l}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {/* Basic Info */}
                    {tab === "basic" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Name *</Label>
                                    <input className={inp} value={form.name} onChange={set("name")} placeholder="Room 101 / CSE Lab A" autoFocus />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Code * <span className="text-muted-foreground font-normal">(unique)</span></Label>
                                    <input className={inp} value={form.code} onChange={set("code")} placeholder="R101 / CSE-LAB-A"
                                        style={{ textTransform: "uppercase" }} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Type *</Label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {ROOM_TYPES.map((t) => (
                                        <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${form.type === t ? TYPE_COLOR[t] : "border-border text-muted-foreground hover:bg-muted"}`}>
                                            {t.replace("_", " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Capacity</Label>
                                    <input className={inp} type="number" value={form.capacity} onChange={set("capacity")} placeholder="60" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Block</Label>
                                    <input className={inp} value={form.block} onChange={set("block")} placeholder="Block A" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Floor</Label>
                                    <input className={inp} value={form.floor} onChange={set("floor")} placeholder="Ground" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Department <span className="text-muted-foreground font-normal">(for labs)</span></Label>
                                <SearchSelect endpoint={EP.departments.list} dataPath="departments" valueKey="id" labelKey="name"
                                    value={form.dept_id} onChange={(v) => setForm(f => ({ ...f, dept_id: v }))} placeholder="Select department (optional)" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Description</Label>
                                <input className={inp} value={form.description} onChange={set("description")} placeholder="30 computers, AC, projector…" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                <span className="text-sm">Active</span>
                            </label>
                        </div>
                    )}

                    {/* Subjects */}
                    {tab === "subjects" && (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">Assign subjects taught in this room/lab. Students and faculty can see this.</p>
                            <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
                                subLabelKey="code" placeholder="Search and add subject…"
                                value="" onChange={(id, opt) => {
                                    if (opt && !subjects.find(s => s.id === id)) setSubjects(prev => [...prev, { id, name: opt.name, code: opt.code, category: opt.category }]);
                                }} />
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {subjects.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No subjects assigned yet</p>
                                ) : subjects.map((s) => (
                                    <div key={s.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
                                        <BookOpen size={13} className="text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium">{s.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{s.code} · {s.category || ""}</p>
                                        </div>
                                        <button onClick={() => setSubjects(prev => prev.filter(x => x.id !== s.id))}
                                            className="p-1 rounded hover:bg-red-50 text-destructive shrink-0"><X size={11} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Staff */}
                    {tab === "staff" && (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">Assign lab staff, IT persons, or room incharges. They can be contacted for this room.</p>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
                                        subLabelKey="designation" placeholder="Search faculty/staff…"
                                        value="" onChange={(id, opt) => {
                                            if (opt && !staff.find(s => (s.user_id || s.user?.id) === id)) {
                                                setStaff(prev => [...prev, { user_id: id, role: "LAB_STAFF", user: { email: opt.email, faculty: [{ name: opt.name, designation: opt.designation }] } }]);
                                            }
                                        }} />
                                </div>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {staff.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No staff assigned yet</p>
                                ) : staff.map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
                                        <Users size={13} className="text-muted-foreground shrink-0" />
                                        <p className="text-xs font-medium flex-1">{s.user?.faculty?.[0]?.name || s.user?.email || "Staff"}</p>
                                        <select value={s.role}
                                            onChange={(e) => setStaff(prev => prev.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
                                            className="h-7 px-2 rounded border border-input bg-background text-xs">
                                            {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                        <button onClick={() => setStaff(prev => prev.filter((_, j) => j !== i))}
                                            className="p-1 rounded hover:bg-red-50 text-destructive"><X size={11} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" disabled={saving} onClick={save}>
                        {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : null}
                        {saving ? "Saving…" : room ? "Save Changes" : "Create Room"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
export default function RoomsPage() {
    const fileRef = useRef(null);
    const [rooms, setRooms] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [modal, setModal] = useState(false); // false | "new" | room obj
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const timer = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await axiosInstance.get(EP.rooms.list, {
                params: { search: search || undefined, type: typeFilter || undefined, limit: 100 },
            });
            const d = r.data?.data;
            setRooms(d?.rooms || []);
            setTotal(d?.pagination?.total || 0);
        } catch { notify.error("Failed to load rooms"); }
        finally { setLoading(false); }
    }, [search, typeFilter]);

    useEffect(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(load, 300);
        return () => clearTimeout(timer.current);
    }, [load]);

    const downloadTemplate = async () => {
        setDownloading(true);
        try {
            const r = await axiosInstance.get(EP.rooms.template, { responseType: "blob" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(r.data);
            a.download = "room-template.xlsx"; a.click();
        } catch { notify.error("Download failed"); }
        finally { setDownloading(false); }
    };

    const uploadTemplate = async (file) => {
        setUploading(true);
        try {
            const fd = new FormData(); fd.append("file", file);
            const r = await axiosInstance.post(EP.rooms.bulkUpload, fd, { headers: { "Content-Type": "multipart/form-data" } });
            const d = r.data?.data;
            notify.success(`${d?.created?.length || 0} rooms created · ${d?.failed?.length || 0} failed`);
            load();
        } catch (err) { notify.error(err); }
        finally { setUploading(false); }
    };

    const del = async (id) => {
        if (!confirm("Delete this room?")) return;
        try { await axiosInstance.delete(EP.rooms.byId(id)); notify.success("Deleted"); load(); }
        catch (err) { notify.error(err); }
    };

    // Group by block
    const byBlock = {};
    for (const r of rooms) {
        const b = r.block || "Other";
        if (!byBlock[b]) byBlock[b] = [];
        byBlock[b].push(r);
    }

    return (
        <div className="space-y-5 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Building2 size={20} className="text-primary" />
                    <h1 className="text-xl font-bold">Rooms & Labs</h1>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{total}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" disabled={downloading} onClick={downloadTemplate}>
                        {downloading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />} Template
                    </Button>
                    <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />} Bulk Upload
                    </Button>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ""; uploadTemplate(f); } }} />
                    <Button size="sm" onClick={() => setModal("new")}><Plus size={13} className="mr-1.5" />Add Room</Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rooms…" className="pl-9 h-9" />
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-input bg-background text-sm">
                    <option value="">All Types</option>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
            </div>

            {/* Rooms grouped by block */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
            ) : rooms.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
                    <Building2 size={32} className="mx-auto text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">No rooms yet. Add manually or bulk upload.</p>
                    <Button size="sm" onClick={() => setModal("new")}><Plus size={13} className="mr-1.5" />Add First Room</Button>
                </div>
            ) : (
                <div className="space-y-5">
                    {Object.entries(byBlock).sort().map(([block, blockRooms]) => (
                        <div key={block}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{block}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {blockRooms.map((room) => (
                                    <div key={room.id} className={`bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-all ${!room.is_active ? "opacity-50" : ""}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-sm truncate">{room.name}</p>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{room.code}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{room.floor || ""}{room.floor && room.block ? " · " : ""}{room.block || ""}</p>
                                            </div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${TYPE_COLOR[room.type] || "bg-muted"}`}>
                                                {room.type?.replace("_", " ")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>Cap: {room.capacity}</span>
                                            {room.department && <span>· {room.department.name}</span>}
                                        </div>

                                        {/* Subjects */}
                                        {room.subjects?.length > 0 && (
                                            <div className="flex gap-1 flex-wrap">
                                                {room.subjects.slice(0, 3).map(({ subject: s }) => (
                                                    <span key={s.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s.code}</span>
                                                ))}
                                                {room.subjects.length > 3 && <span className="text-[10px] text-muted-foreground">+{room.subjects.length - 3} more</span>}
                                            </div>
                                        )}

                                        {/* Staff */}
                                        {room.staff?.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Users size={11} />
                                                <span>{room.staff.map(s => s.user?.faculty?.name || "Staff").slice(0, 2).join(", ")}{room.staff.length > 2 ? ` +${room.staff.length - 2}` : ""}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => setModal(room)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit2 size={13} /></button>
                                            <button onClick={() => del(room.id)} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <RoomModal
                    room={modal === "new" ? null : modal}
                    onClose={() => setModal(false)}
                    onSave={() => { setModal(false); load(); }}
                />
            )}
        </div>
    );
}