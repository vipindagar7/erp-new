import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../../lib/axios.js";
import { EP } from "../../../config/api.config.js";

import { cn } from "../../../lib/utils.js";
import { fetchSections } from "../../../redux/academic/academicSlice.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, UserCheck, Plus, Search, Trash2, Pencil, ArrowLeft,
  Mail, Layers, X, Loader2, RefreshCw, MoreHorizontal, ChevronRight,
  UserPlus, Upload,
} from "lucide-react";
import { notify } from "../../../hooks/notify.js";

// ── Constants ──────────────────────────────────────────────────
const GROUP_TYPES = ["EVENT", "SCHOLARSHIP", "COMMITTEE", "SPORTS", "OTHER"];
const FG_TYPES = ["DEPARTMENT", "COMMITTEE", "EVENT", "OTHER"];
const TYPE_STYLE = {
  EVENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  SCHOLARSHIP: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMMITTEE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SPORTS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DEPARTMENT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  OTHER: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function Spinner({ size = 14 }) { return <Loader2 size={size} className="animate-spin" />; }

// ── Group modal ────────────────────────────────────────────────
function GroupModal({ open, onClose, onSubmit, initialData, loading, types }) {
  const [form, setForm] = useState({ name: "", description: "", type: "OTHER", is_active: true });
  useEffect(() => {
    if (open) setForm({
      name: initialData?.name || "",
      description: initialData?.description || "",
      type: initialData?.type || "OTHER",
      is_active: initialData?.is_active ?? true,
    });
  }, [open, initialData]);
  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Group" : "New Group"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input className="h-9 text-sm" value={form.name} onChange={set("name")} placeholder="e.g. NSS Volunteers 2025" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input className="h-9 text-sm" value={form.description} onChange={set("description")} placeholder="Optional description" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between py-1">
            <Label>Active</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!form.name.trim() || loading}
            onClick={() => onSubmit(form)}>
            {loading && <Spinner />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add members modal (3-way: by search / by email / by section) ──
function AddMembersModal({ open, onClose, onAddById, onAddByEmail, onAddBySection, loading, isFaculty }) {
  const [tab, setTab] = useState("search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [emailText, setEmailText] = useState("");
  const [remarks, setRemarks] = useState("");
  const sections = useSelector((s) => s.academic?.sections?.list ?? []);
  const [selectedSections, setSelectedSections] = useState(new Set());

  useEffect(() => {
    if (!open) { setSearch(""); setResults([]); setSelected(new Set()); setEmailText(""); setRemarks(""); setSelectedSections(new Set()); }
  }, [open]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return setResults([]);
    setSearching(true);
    try {
      const url = isFaculty ? EP.faculty.list : EP.students.list;
      const res = await axiosInstance.get(url, { params: { search: q, limit: 15 } });
      const d = res.data?.data;
      setResults(isFaculty ? (d?.faculty || []) : (d?.students || []));
    } catch { } finally { setSearching(false); }
  }, [isFaculty]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSec = (id) => setSelectedSections((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAdd = () => {
    if (tab === "search") {
      if (!selected.size) return notify.error("Select at least one");
      const ids = [...selected];
      isFaculty ? onAddById({ faculty_ids: ids, remarks }) : onAddById({ student_ids: ids, remarks });
    } else if (tab === "email") {
      const emails = emailText.split(/[\n,;]/).map((e) => e.trim()).filter(Boolean);
      if (!emails.length) return notify.error("Enter at least one email");
      onAddByEmail({ emails, remarks });
    } else {
      if (!selectedSections.size) return notify.error("Select at least one section");
      onAddBySection({ section_ids: [...selectedSections], remarks });
    }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add {isFaculty ? "Faculty" : "Students"}</DialogTitle>
          <DialogDescription>Search, paste emails, or select by section</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 shrink-0">
            <TabsTrigger value="search" className="text-xs"><Search size={12} className="mr-1" />Search</TabsTrigger>
            <TabsTrigger value="email" className="text-xs"><Mail size={12} className="mr-1" />By Email</TabsTrigger>
            {!isFaculty && <TabsTrigger value="section" className="text-xs"><Layers size={12} className="mr-1" />By Section</TabsTrigger>}
            {isFaculty && <TabsTrigger value="section" className="text-xs" disabled>—</TabsTrigger>}
          </TabsList>

          {/* Search tab */}
          <TabsContent value="search" className="flex-1 flex flex-col min-h-0 space-y-2 mt-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input className="pl-8 h-9 text-sm" placeholder={`Search ${isFaculty ? "faculty" : "students"} by name, email…`}
                value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
            </div>
            {selected.size > 0 && (
              <p className="text-xs text-primary font-medium px-1">{selected.size} selected</p>
            )}
            <div className="flex-1 overflow-y-auto border border-border rounded-xl min-h-0 max-h-52">
              {searching ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : results.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {search ? "No results" : "Start typing to search…"}
                </p>
              ) : results.map((item) => (
                <label key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0">
                  <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggle(item.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.user?.email} {item.roll_no ? `· ${item.roll_no}` : ""} {item.emp_id ? `· ${item.emp_id}` : ""}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </TabsContent>

          {/* Email tab */}
          <TabsContent value="email" className="mt-3 space-y-2">
            <Label className="text-xs text-muted-foreground">One email per line, or comma/semicolon separated</Label>
            <textarea
              className="w-full h-32 px-3 py-2 text-sm border border-input rounded-xl bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={emailText} onChange={(e) => setEmailText(e.target.value)}
              placeholder={"student1@college.edu\nstudent2@college.edu\nstudent3@college.edu"} />
            <p className="text-xs text-muted-foreground">
              {emailText.split(/[\n,;]/).map((e) => e.trim()).filter(Boolean).length} email(s) entered
            </p>
          </TabsContent>

          {/* Section tab */}
          {!isFaculty && (
            <TabsContent value="section" className="mt-3 space-y-2">
              <Label className="text-xs text-muted-foreground">All active students from selected sections will be added</Label>
              <div className="border border-border rounded-xl overflow-y-auto max-h-48">
                {sections.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No sections loaded</p>
                ) : sections.map((s) => (
                  <label key={s.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0">
                    <Checkbox checked={selectedSections.has(s.id)} onCheckedChange={() => toggleSec(s.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.course?.name} · Sem {s.semester} · {s.batch}</p>
                    </div>
                  </label>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Remarks */}
        <div className="space-y-1.5 mt-3 shrink-0">
          <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Added for NSS camp" />
        </div>

        <div className="flex gap-3 pt-3 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={handleAdd}>
            {loading && <Spinner />}
            <UserPlus size={13} className="mr-1.5" />
            Add {isFaculty ? "Faculty" : "Students"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Result mini-modal ──────────────────────────────────────────
function ResultModal({ open, onClose, data, title }) {
  if (!open || !data) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm max-h-[60vh] flex flex-col">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-2 py-1 text-sm">
          {data.added?.length > 0 && <p className="text-green-600">✓ Added: {data.added.length}</p>}
          {data.skipped?.length > 0 && <p className="text-yellow-600">⚠ Already in group: {data.skipped.length}</p>}
          {data.not_found?.length > 0 && <p className="text-destructive">✗ Not found: {data.not_found.length}<span className="text-xs text-muted-foreground ml-1">{data.not_found.map((r) => r.email).join(", ")}</span></p>}
          {data.failed?.length > 0 && <p className="text-destructive">✗ Failed: {data.failed.length}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}

// ── Group detail view (members list) ──────────────────────────
function GroupDetail({ group, onBack, onAddMembers, onRemoveMember, loading, isFaculty }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [bulkRemoving, setBulkRemoving] = useState(false);

  const members = group?.members || [];
  const filtered = members.filter((m) => {
    const item = isFaculty ? m.faculty : m.student;
    return !search || item?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item?.user?.email?.toLowerCase().includes(search.toLowerCase());
  });

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSel = filtered.length > 0 && filtered.every((m) => {
    const id = isFaculty ? m.faculty?.id : m.student?.id;
    return selected.has(id);
  });

  const handleBulkRemove = async () => {
    setBulkRemoving(true);
    const ids = [...selected];
    await (isFaculty ? onRemoveMember({ faculty_ids: ids }) : onRemoveMember({ student_ids: ids }));
    setSelected(new Set());
    setBulkRemoving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{group.name}</h2>
          <p className="text-xs text-muted-foreground">
            {group._count?.members ?? members.length} member{(group._count?.members ?? members.length) !== 1 ? "s" : ""}
            {group.description && ` · ${group.description}`}
          </p>
        </div>
        <Button size="sm" onClick={onAddMembers}>
          <UserPlus size={13} className="mr-1.5" /> Add
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search members…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {selected.size > 0 && (
          <Button variant="destructive" size="sm" disabled={bulkRemoving} onClick={handleBulkRemove}>
            {bulkRemoving ? <Spinner /> : <Trash2 size={13} className="mr-1" />}
            Remove {selected.size}
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="w-10 px-3 py-3">
                <Checkbox checked={allSel}
                  onCheckedChange={() => {
                    if (allSel) setSelected(new Set());
                    else setSelected(new Set(filtered.map((m) => (isFaculty ? m.faculty?.id : m.student?.id))));
                  }} />
              </th>
              <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {isFaculty ? "Faculty" : "Student"}
              </th>
              <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                {isFaculty ? "Designation" : "Section"}
              </th>
              <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Added</th>
              <th className="text-right px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                {members.length === 0 ? "No members yet. Add some above." : "No results for your search."}
              </td></tr>
            ) : filtered.map((m) => {
              const item = isFaculty ? m.faculty : m.student;
              const id = item?.id;
              return (
                <tr key={m.id} className={cn("hover:bg-muted/30", selected.has(id) && "bg-primary/5")}>
                  <td className="px-3 py-3">
                    <Checkbox checked={selected.has(id)} onCheckedChange={() => toggle(id)} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {item?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item?.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {isFaculty ? (item?.designation || "—") : (item?.section?.name ? `${item.section.name} · Sem ${item.section.semester}` : "—")}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(m.addedAt).toLocaleDateString()}
                    {m.remarks && <span className="ml-1 text-muted-foreground/60">· {m.remarks}</span>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => {
                      const payload = isFaculty ? { faculty_ids: [id] } : { student_ids: [id] };
                      onRemoveMember(payload);
                    }}
                      className="text-muted-foreground hover:text-destructive transition-colors">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Group list ─────────────────────────────────────────────────
function GroupList({ groups, loading, onSelect, onEdit, onDelete, onCreate, title, icon: Icon, types }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Icon size={17} className="text-muted-foreground" /> {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{groups.length} groups</p>
        </div>
        <Button size="sm" onClick={onCreate}><Plus size={13} className="mr-1.5" />New Group</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={20} /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-10 space-y-2 border-2 border-dashed border-border rounded-2xl">
          <Icon size={28} className="text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">No groups yet.</p>
          <Button size="sm" variant="outline" onClick={onCreate}><Plus size={13} className="mr-1" />Create first group</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {groups.map((g) => (
            <div key={g.id}
              className={cn("bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-primary/30 transition-all cursor-pointer")}
              onClick={() => onSelect(g)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_STYLE[g.type] || TYPE_STYLE.OTHER)}>
                      {g.type}
                    </span>
                    {!g.is_active && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-foreground truncate">{g.name}</p>
                  {g.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{g.description}</p>}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onEdit(g)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => onDelete(g)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {g._count?.members ?? 0} member{(g._count?.members ?? 0) !== 1 ? "s" : ""}
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function SpecialGroupsPage() {
  const dispatch = useDispatch();
  const sections = useSelector((s) => s.academic?.sections?.list ?? []);

  // Student groups state
  const [sGroups, setSGroups] = useState([]);
  const [sLoading, setSLoading] = useState(false);
  const [sSelected, setSSelected] = useState(null);  // selected group for detail
  const [sDetail, setSDetail] = useState(null);  // full detail of selected group
  const [sModal, setSModal] = useState(null);  // create/edit modal
  const [sAddModal, setSAddModal] = useState(false);
  const [sResult, setSResult] = useState(null);
  const [sActLoading, setSActLoad] = useState(false);

  // Faculty groups state
  const [fGroups, setFGroups] = useState([]);
  const [fLoading, setFLoading] = useState(false);
  const [fSelected, setFSelected] = useState(null);
  const [fDetail, setFDetail] = useState(null);
  const [fModal, setFModal] = useState(null);
  const [fAddModal, setFAddModal] = useState(false);
  const [fResult, setFResult] = useState(null);
  const [fActLoading, setFActLoad] = useState(false);

  const [tab, setTab] = useState("students");
  const [delConfirm, setDelConfirm] = useState(null);

  // Load sections
  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 200 })); }, []);

  // ── Load student groups ───────────────────────────────────
  const loadSGroups = useCallback(async () => {
    setSLoading(true);
    try {
      const res = await axiosInstance.get(EP.groups.list);
      setSGroups(res.data?.data?.groups || []);
    } catch { notify.error("Failed to load groups"); }
    finally { setSLoading(false); }
  }, []);

  // ── Load faculty groups ───────────────────────────────────
  const loadFGroups = useCallback(async () => {
    setFLoading(true);
    try {
      const res = await axiosInstance.get(EP.groups.facultyList);
      setFGroups(res.data?.data?.groups || []);
    } catch { notify.error("Failed to load faculty groups"); }
    finally { setFLoading(false); }
  }, []);

  useEffect(() => { loadSGroups(); loadFGroups(); }, []);

  // ── Load group detail ─────────────────────────────────────
  const loadSDetail = async (group) => {
    setSSelected(group);
    try {
      const res = await axiosInstance.get(EP.groups.byId(group.id));
      setSDetail(res.data?.data);
    } catch { notify.error("Failed to load group details"); }
  };

  const loadFDetail = async (group) => {
    setFSelected(group);
    try {
      const res = await axiosInstance.get(EP.groups.facultyById(group.id));
      setFDetail(res.data?.data);
    } catch { notify.error("Failed to load group details"); }
  };

  // ── Student group CRUD ────────────────────────────────────
  const handleSCreate = async (data) => {
    setSActLoad(true);
    try {
      await axiosInstance.post(EP.groups.create, data);
      notify.success("Group created"); setSModal(null); loadSGroups();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSActLoad(false); }
  };

  const handleSUpdate = async (data) => {
    setSActLoad(true);
    try {
      await axiosInstance.patch(EP.groups.update(sModal.id), data);
      notify.success("Updated"); setSModal(null); loadSGroups();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSActLoad(false); }
  };

  const handleSDelete = async () => {
    setSActLoad(true);
    try {
      await axiosInstance.delete(EP.groups.delete(delConfirm.id));
      notify.success("Deleted"); setDelConfirm(null); loadSGroups();
      if (sSelected?.id === delConfirm.id) { setSSelected(null); setSDetail(null); }
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSActLoad(false); }
  };

  // ── Student group members ─────────────────────────────────
  const handleSAddById = async (data) => {
    setSActLoad(true);
    try {
      const res = await axiosInstance.post(EP.groups.addById(sSelected.id), data);
      setSResult(res.data?.data); loadSDetail(sSelected); setSAddModal(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSActLoad(false); }
  };
  const handleSAddByEmail = async (data) => {
    setSActLoad(true);
    try {
      const res = await axiosInstance.post(EP.groups.addByEmail(sSelected.id), data);
      setSResult(res.data?.data); loadSDetail(sSelected); setSAddModal(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSActLoad(false); }
  };
  const handleSAddBySection = async (data) => {
    setSActLoad(true);
    try {
      const res = await axiosInstance.post(EP.groups.addBySection(sSelected.id), data);
      setSResult(res.data?.data); loadSDetail(sSelected); setSAddModal(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSActLoad(false); }
  };
  const handleSRemove = async (data) => {
    setSActLoad(true);
    try {
      if (data.student_ids?.length === 1) {
        await axiosInstance.delete(EP.groups.removeMember(sSelected.id, data.student_ids[0]));
      } else {
        await axiosInstance.delete(EP.groups.removeMembers(sSelected.id), { data });
      }
      notify.success("Removed"); loadSDetail(sSelected);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSActLoad(false); }
  };

  // ── Faculty group CRUD ────────────────────────────────────
  const handleFCreate = async (data) => {
    setFActLoad(true);
    try {
      await axiosInstance.post(EP.groups.facultyCreate, data);
      notify.success("Faculty group created"); setFModal(null); loadFGroups();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setFActLoad(false); }
  };
  const handleFUpdate = async (data) => {
    setFActLoad(true);
    try {
      await axiosInstance.patch(EP.groups.facultyUpdate(fModal.id), data);
      notify.success("Updated"); setFModal(null); loadFGroups();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setFActLoad(false); }
  };
  const handleFDelete = async () => {
    setFActLoad(true);
    try {
      await axiosInstance.delete(EP.groups.facultyDelete(delConfirm.id));
      notify.success("Deleted"); setDelConfirm(null); loadFGroups();
      if (fSelected?.id === delConfirm.id) { setFSelected(null); setFDetail(null); }
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setFActLoad(false); }
  };
  const handleFAddById = async (data) => {
    setFActLoad(true);
    try {
      const res = await axiosInstance.post(EP.groups.facultyAddById(fSelected.id), data);
      setFResult(res.data?.data); loadFDetail(fSelected); setFAddModal(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setFActLoad(false); }
  };
  const handleFAddByEmail = async (data) => {
    setFActLoad(true);
    try {
      const res = await axiosInstance.post(EP.groups.facultyAddByEmail(fSelected.id), data);
      setFResult(res.data?.data); loadFDetail(fSelected); setFAddModal(false);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setFActLoad(false); }
  };
  const handleFRemove = async (data) => {
    setFActLoad(true);
    try {
      if (data.faculty_ids?.length === 1) {
        await axiosInstance.delete(EP.groups.facultyRemoveOne(fSelected.id, data.faculty_ids[0]));
      } else {
        await axiosInstance.delete(EP.groups.facultyRemove(fSelected.id), { data });
      }
      notify.success("Removed"); loadFDetail(fSelected);
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setFActLoad(false); }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      {!sSelected && !fSelected && (
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users size={20} className="text-muted-foreground" /> Special Groups
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage student and faculty groups for targeted feedback and events.
          </p>
        </div>
      )}

      {/* Student groups detail view */}
      {sSelected && sDetail && (
        <GroupDetail
          group={sDetail}
          isFaculty={false}
          onBack={() => { setSSelected(null); setSDetail(null); }}
          onAddMembers={() => setSAddModal(true)}
          onRemoveMember={handleSRemove}
          loading={sActLoading}
        />
      )}

      {/* Faculty group detail view */}
      {fSelected && fDetail && (
        <GroupDetail
          group={fDetail}
          isFaculty={true}
          onBack={() => { setFSelected(null); setFDetail(null); }}
          onAddMembers={() => setFAddModal(true)}
          onRemoveMember={handleFRemove}
          loading={fActLoading}
        />
      )}

      {/* Lists */}
      {!sSelected && !fSelected && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full sm:w-64">
            <TabsTrigger value="students">
              <Users size={13} className="mr-1.5" /> Student Groups
            </TabsTrigger>
            <TabsTrigger value="faculty">
              <UserCheck size={13} className="mr-1.5" /> Faculty Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-5">
            <GroupList
              groups={sGroups} loading={sLoading}
              title="Student Groups" icon={Users} types={GROUP_TYPES}
              onSelect={loadSDetail}
              onEdit={(g) => setSModal(g)}
              onDelete={(g) => setDelConfirm({ ...g, _tab: "student" })}
              onCreate={() => setSModal("create")}
            />
          </TabsContent>

          <TabsContent value="faculty" className="mt-5">
            <GroupList
              groups={fGroups} loading={fLoading}
              title="Faculty Groups" icon={UserCheck} types={FG_TYPES}
              onSelect={loadFDetail}
              onEdit={(g) => setFModal(g)}
              onDelete={(g) => setDelConfirm({ ...g, _tab: "faculty" })}
              onCreate={() => setFModal("create")}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      {/* Student group create/edit */}
      <GroupModal open={!!sModal} onClose={() => setSModal(null)}
        onSubmit={sModal === "create" ? handleSCreate : handleSUpdate}
        initialData={sModal !== "create" ? sModal : null}
        loading={sActLoading} types={GROUP_TYPES} />

      {/* Faculty group create/edit */}
      <GroupModal open={!!fModal} onClose={() => setFModal(null)}
        onSubmit={fModal === "create" ? handleFCreate : handleFUpdate}
        initialData={fModal !== "create" ? fModal : null}
        loading={fActLoading} types={FG_TYPES} />

      {/* Add student members */}
      <AddMembersModal open={sAddModal} onClose={() => setSAddModal(false)}
        onAddById={handleSAddById} onAddByEmail={handleSAddByEmail}
        onAddBySection={handleSAddBySection}
        loading={sActLoading} isFaculty={false} />

      {/* Add faculty members */}
      <AddMembersModal open={fAddModal} onClose={() => setFAddModal(false)}
        onAddById={handleFAddById} onAddByEmail={handleFAddByEmail}
        onAddBySection={() => { }}
        loading={fActLoading} isFaculty={true} />

      {/* Results */}
      <ResultModal open={!!sResult} onClose={() => setSResult(null)} data={sResult} title="Add Members Result" />
      <ResultModal open={!!fResult} onClose={() => setFResult(null)} data={fResult} title="Add Faculty Result" />

      {/* Delete confirm */}
      {delConfirm && (
        <Dialog open onOpenChange={(v) => { if (!v) setDelConfirm(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Group</DialogTitle>
              <DialogDescription>
                Delete "{delConfirm.name}"? All {delConfirm._count?.members ?? 0} member associations will also be removed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDelConfirm(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1"
                disabled={sActLoading || fActLoading}
                onClick={delConfirm._tab === "faculty" ? handleFDelete : handleSDelete}>
                {(sActLoading || fActLoading) && <Spinner />} Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}