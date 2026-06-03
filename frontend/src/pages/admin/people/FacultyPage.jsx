import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFaculty, createFaculty, updateFaculty, deleteFaculty,
  toggleBlockFaculty, assignSubjects,
} from "../../../redux/faculty/facultySlice.js";
import { fetchDepartments, fetchSubjects } from "../../../redux/academic/academicSlice.js";
import axiosInstance from "../../../lib/axios.js";
import { EP } from "../../../config/api.config.js";
import { notify } from "../../../hooks/notify.js";
import { cn } from "../../../lib/utils.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Users, Plus, Upload, Download, Search, Filter, MoreHorizontal,
  Lock, Unlock, Trash2, Pencil, BookOpen, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, X,
} from "lucide-react";
import FacultyFormWizard from '../../../components/FacultyFormWizard.jsx'
import AdminUserActions from "../../../components/admin/AdminUserActions.jsx";
function Spinner({ size = 14 }) { return <Loader2 size={size} className="animate-spin" />; }

// ── Faculty Modal ───────────────────────────────────────────────
function FacultyModal({ open, onClose, onSubmit, initialData, loading, departments }) {
  const BLANK = { email: "", password: "Faculty@123", name: "", emp_id: "", designation: "", phone: "", dept_id: "none", gender: "none", joining_date: "" };
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        email: initialData.user?.email || "",
        password: "",
        name: initialData.name || "",
        emp_id: initialData.emp_id || "",
        designation: initialData.designation || "",
        phone: initialData.phone || "",
        dept_id: initialData.dept_id || "none",
        gender: initialData.gender || "none",
        joining_date: initialData.joining_date
          ? new Date(initialData.joining_date).toISOString().split("T")[0] : "",
      });
    } else { setForm(BLANK); }
  }, [open, initialData]);

  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) return notify.error("Name required");
    if (!initialData && !form.email.trim()) return notify.error("Email required");
    onSubmit({
      ...form,
      dept_id: form.dept_id === "none" ? null : form.dept_id,
      gender: form.gender === "none" ? null : form.gender,
      joining_date: form.joining_date || undefined,
      emp_id: form.emp_id.trim() || undefined,
      designation: form.designation.trim() || undefined,
      phone: form.phone.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {!initialData && (
            <>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input className="h-9 text-sm" value={form.email} onChange={set("email")} placeholder="faculty@college.edu" />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input className="h-9 text-sm" value={form.password} onChange={set("password")} placeholder="Default: Faculty@123" />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input className="h-9 text-sm" value={form.name} onChange={set("name")} placeholder="Dr. John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Emp ID</Label>
              <Input className="h-9 text-sm" value={form.emp_id} onChange={set("emp_id")} placeholder="EMP001" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input className="h-9 text-sm" value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Input className="h-9 text-sm" value={form.designation} onChange={set("designation")} placeholder="Assistant Professor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.dept_id} onValueChange={setV("dept_id")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={setV("gender")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Joining Date</Label>
            <Input type="date" className="h-9 text-sm" value={form.joining_date} onChange={set("joining_date")} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading && <Spinner size={13} />} {initialData ? "Update" : "Add Faculty"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Subjects Modal ───────────────────────────────────────
function AssignSubjectsModal({ open, onClose, onSubmit, faculty, loading, subjects }) {
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (open && faculty) {
      const ids = faculty.subjects?.map((s) => s.subject_id) || [];
      setSelected(new Set(ids));
    }
  }, [open, faculty]);

  if (!open) return null;
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Subjects</DialogTitle>
          <DialogDescription>{faculty?.name} — {selected.size} selected</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-1 py-1">
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No subjects available</p>
          ) : subjects.map((s) => (
            <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.code} · {s.category}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3 pt-3 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={() => onSubmit([...selected])}>
            {loading && <Spinner size={13} />} Save Assignments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Results Modal ───────────────────────────────────────────────
function ResultsModal({ open, onClose, data }) {
  if (!open || !data) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader><DialogTitle>Bulk Upload Results</DialogTitle></DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-3 py-1">
          {data.created?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 mb-1">✓ Created ({data.created.length})</p>
              {data.created.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.name} — {r.email}</p>)}
            </div>
          )}
          {data.failed?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-destructive mb-1">✗ Failed ({data.failed.length})</p>
              {data.failed.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.reason}</p>)}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="mt-2">Close</Button>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function FacultyPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading, actionLoading } = useSelector((s) => s.faculty ?? { list: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 }, loading: false, actionLoading: false });
  const { list: departments } = useSelector((s) => s.academic?.departments ?? { list: [] });
  const { list: subjects } = useSelector((s) => s.academic?.subjects ?? { list: [] });

  const [search, setSearch] = useState("");
  const [filterDept, setFDept] = useState("all");
  const [filterBlocked, setFBlock] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [assignModal, setAssign] = useState(null);
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  const load = useCallback(() => {
    dispatch(fetchFaculty({
      page, limit: 20,
      ...(search && { search }),
      ...(filterDept !== "all" && { dept_id: filterDept }),
      ...(filterBlocked !== "all" && { isBlocked: filterBlocked === "blocked" }),
    }));
  }, [page, search, filterDept, filterBlocked, dispatch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
    if (!subjects.length) dispatch(fetchSubjects({ limit: 500 }));
  }, []);

  const run = async (thunk, args, msg) => {
    const r = await dispatch(thunk(args));
    if (thunk.fulfilled.match(r)) { notify.success(msg); setModal(null); load(); return true; }
    notify.error(r.payload); return false;
  };

  const handleCreate = (data) => run(createFaculty, data, "Faculty created");
  const handleUpdate = (data) => run(updateFaculty, { id: modal.id, data }, "Updated");
  const handleDelete = async () => { await run(deleteFaculty, del.id, "Deleted"); setDel(null); };
  const handleBlock = (id, v) => run(toggleBlockFaculty, { id, isBlocked: v }, v ? "Blocked" : "Unblocked");
  const handleAssignSubmit = (subject_ids) => run(assignSubjects, { id: assignModal.id, subject_ids }, "Subjects updated");

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await axiosInstance.post(EP.faculty.bulkUpload, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResults(res.data.data); load();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    e.target.value = "";
  };

  const handleTemplate = async () => {
    try {
      const res = await axiosInstance.get(EP.faculty.template, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url; a.download = "faculty_template.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch { notify.error("Template download failed"); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users size={20} className="text-muted-foreground" /> Faculty
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination.total} members</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="sr-only" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={handleTemplate}><Download size={13} className="mr-1.5" />Template</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload size={13} className="mr-1.5" />Bulk Upload</Button>
          <Button size="sm" onClick={() => setModal("create")}><Plus size={13} className="mr-1.5" />Add Faculty</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search name, emp ID, email…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={filterDept} onValueChange={(v) => { setFDept(v); setPage(1); }}>
          <SelectTrigger className="h-9 text-sm w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterBlocked} onValueChange={(v) => { setFBlock(v); setPage(1); }}>
          <SelectTrigger className="h-9 text-sm w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
          <RefreshCw size={13} className={cn(loading && "animate-spin")} />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Faculty</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Emp ID</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Designation</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Subjects</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Spinner size={20} /><p className="text-sm text-muted-foreground mt-2">Loading…</p>
                </td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Users size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No faculty found.</p>
                </td></tr>
              ) : list.map((f) => {
                const isBlocked = f.user?.isBlocked;
                return (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                          {f.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{f.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell font-mono">
                      {f.emp_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {f.designation || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {f.department?.name || "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {f.subjects?.length || 0} subjects
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                        isBlocked
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      )}>
                        {isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setModal(f)}>
                              <Pencil size={13} className="mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAssign(f)}>
                              <BookOpen size={13} className="mr-2" /> Assign Subjects
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleBlock(f.id, !isBlocked)}>
                              {isBlocked
                                ? <><Unlock size={13} className="mr-2" />Unblock</>
                                : <><Lock size={13} className="mr-2" />Block</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive"
                              onClick={() => setDel(f)}>
                              <Trash2 size={13} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AdminUserActions
                          userId={f.user_id}
                          userEmail={f.user?.email}
                          userRole="FACULTY"
                          userName={f.name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}><ChevronLeft size={13} /></Button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const p = pagination.pages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                return p <= pagination.pages ? (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="icon"
                    className="h-7 w-7 text-xs" onClick={() => setPage(p)}>{p}</Button>
                ) : null;
              })}
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}><ChevronRight size={13} /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FacultyFormWizard
        open={!!modal}
        onClose={() => setModal(null)}
        initialData={modal !== "create" ? modal : null}
        onSuccess={load} />

      <AssignSubjectsModal open={!!assignModal} onClose={() => setAssign(null)}
        onSubmit={handleAssignSubmit} faculty={assignModal}
        loading={actionLoading} subjects={subjects} />

      {del && (
        <Dialog open onOpenChange={(v) => { if (!v) setDel(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Faculty</DialogTitle>
              <DialogDescription>Delete {del.name}? This cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDel(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading && <Spinner size={13} />} Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ResultsModal open={!!results} onClose={() => setResults(null)} data={results} />
    </div>
  );
}