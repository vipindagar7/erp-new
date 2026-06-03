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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ClipboardList, Plus, Upload, Download, Search, Filter, RefreshCw,
  MoreHorizontal, Pencil, Trash2, CheckCircle, X, Loader2,
  ChevronLeft, ChevronRight, Star, Users, BookOpen,
} from "lucide-react";
import { notify } from "../../../hooks/notify.js";

// ── Constants ──────────────────────────────────────────────────
const STATUSES = ["ACTIVE", "DETAINED", "PASSED", "LEFT", "TRANSFERRED", "PROMOTED"];
const STATUS_STYLE = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DETAINED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PASSED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  LEFT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  TRANSFERRED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PROMOTED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function Spinner({ size = 13 }) { return <Loader2 size={size} className="animate-spin" />; }

// ── Enrollment Modal (create / edit) ──────────────────────────
function EnrollmentModal({ open, onClose, onSubmit, initialData, loading, sections }) {
  const BLANK = {
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    semester: "1", batch_year: String(new Date().getFullYear()),
    status: "ACTIVE", is_current: false,
    section_id: "none", remarks: "",
    enrolled_at: new Date().toISOString().split("T")[0],
  };
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        academic_year: initialData.academic_year || "",
        semester: String(initialData.semester || 1),
        batch_year: String(initialData.batch_year || ""),
        status: initialData.status || "ACTIVE",
        is_current: initialData.is_current || false,
        section_id: initialData.section_id || "none",
        remarks: initialData.remarks || "",
        enrolled_at: initialData.enrolled_at
          ? new Date(initialData.enrolled_at).toISOString().split("T")[0] : "",
      });
    } else { setForm(BLANK); }
  }, [open, initialData]);

  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.academic_year.trim()) return notify.error("Academic year required");
    if (!form.semester) return notify.error("Semester required");
    onSubmit({
      ...form,
      section_id: form.section_id === "none" ? undefined : form.section_id,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Enrollment" : "Add Enrollment"}</DialogTitle>
          {initialData?.student && (
            <DialogDescription>
              Student: <strong>{initialData.student?.name}</strong> ({initialData.student?.roll_no || "—"})
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Academic Year <span className="text-destructive">*</span></Label>
              <Input className="h-9 text-sm" value={form.academic_year} onChange={set("academic_year")}
                placeholder="e.g. 2024-2025" />
            </div>
            <div className="space-y-1.5">
              <Label>Semester <span className="text-destructive">*</span></Label>
              <Select value={form.semester} onValueChange={setV("semester")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Batch Year</Label>
              <Input className="h-9 text-sm" type="number" value={form.batch_year}
                onChange={set("batch_year")} placeholder="e.g. 2024" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={setV("status")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Section <span className="text-muted-foreground text-xs">(overrides student's section)</span></Label>
            <Select value={form.section_id} onValueChange={setV("section_id")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Use student's current section</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.course?.name} (Sem {s.semester})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Enrolled At</Label>
            <Input className="h-9 text-sm" type="date" value={form.enrolled_at}
              onChange={set("enrolled_at")} />
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input className="h-9 text-sm" value={form.remarks} onChange={set("remarks")}
              placeholder="Optional notes" />
          </div>
          <div className="flex items-center gap-2 py-1">
            <Checkbox checked={form.is_current}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_current: v }))} />
            <Label className="cursor-pointer font-normal">
              Set as current enrollment
              <span className="text-xs text-muted-foreground ml-1">(will unset any existing current)</span>
            </Label>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading && <Spinner />} {initialData ? "Update" : "Add Enrollment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add for Student modal (picks student first) ────────────────
function AddForStudentModal({ open, onClose, onSubmit, loading, sections }) {
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [pickedStudent, setPickedStudent] = useState(null);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    semester: "1", batch_year: String(new Date().getFullYear()),
    status: "ACTIVE", is_current: true, section_id: "none", remarks: "", enrolled_at: new Date().toISOString().split("T")[0],
  });

  useEffect(() => { if (!open) { setPickedStudent(null); setStudentSearch(""); setStudents([]); } }, [open]);

  const searchStudents = async (q) => {
    if (!q.trim()) return setStudents([]);
    setSearching(true);
    try {
      const res = await axiosInstance.get(EP.students.list, { params: { search: q, limit: 10 } });
      setStudents(res.data?.data?.students || []);
    } catch { } finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchStudents(studentSearch), 350);
    return () => clearTimeout(t);
  }, [studentSearch]);

  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!pickedStudent) return notify.error("Select a student");
    if (!form.academic_year.trim()) return notify.error("Academic year required");
    onSubmit(pickedStudent.id, { ...form, section_id: form.section_id === "none" ? undefined : form.section_id });
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Enrollment</DialogTitle>
          <DialogDescription>Search for a student and add an enrollment record.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Student search */}
          <div className="space-y-2">
            <Label>Student <span className="text-destructive">*</span></Label>
            {pickedStudent ? (
              <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {pickedStudent.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{pickedStudent.name}</p>
                  <p className="text-xs text-muted-foreground">{pickedStudent.user?.email}</p>
                </div>
                <button onClick={() => setPickedStudent(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input className="pl-8 h-9 text-sm" placeholder="Search by name, roll no, email…"
                    value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                </div>
                {searching && <p className="text-xs text-muted-foreground px-1">Searching…</p>}
                {students.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {students.map((s) => (
                      <button key={s.id} onClick={() => { setPickedStudent(s); setStudents([]); setStudentSearch(""); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 text-left transition-colors border-b border-border/50 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {s.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.roll_no || s.user?.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enrollment fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Academic Year <span className="text-destructive">*</span></Label>
              <Input className="h-9 text-sm" value={form.academic_year} onChange={set("academic_year")} />
            </div>
            <div className="space-y-1.5">
              <Label>Semester <span className="text-destructive">*</span></Label>
              <Select value={form.semester} onValueChange={setV("semester")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={setV("status")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batch Year</Label>
              <Input className="h-9 text-sm" type="number" value={form.batch_year} onChange={set("batch_year")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Section <span className="text-muted-foreground text-xs">(optional override)</span></Label>
            <Select value={form.section_id} onValueChange={setV("section_id")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Use student's section</SelectItem>
                {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — Sem {s.semester}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Enrolled At</Label>
            <Input className="h-9 text-sm" type="date" value={form.enrolled_at} onChange={set("enrolled_at")} />
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input className="h-9 text-sm" value={form.remarks} onChange={set("remarks")} placeholder="Optional" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.is_current}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_current: v }))} />
            <Label className="font-normal text-sm cursor-pointer">Set as current enrollment</Label>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!pickedStudent || loading} onClick={handleSubmit}>
            {loading && <Spinner />} Add Enrollment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Bulk Status Modal ──────────────────────────────────────────
function BulkStatusModal({ open, onClose, onSubmit, count, loading }) {
  const [status, setStatus] = useState("ACTIVE");
  const [remarks, setRemarks] = useState("");
  useEffect(() => { if (open) { setStatus("ACTIVE"); setRemarks(""); } }, [open]);
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Bulk Update Status</DialogTitle>
          <DialogDescription>Update status for {count} selected enrollment(s).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Remarks <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input className="h-9 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={loading} onClick={() => onSubmit(status, remarks)}>
            {loading && <Spinner />} Update {count} Record{count !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Results Modal ──────────────────────────────────────────────
function ResultsModal({ open, onClose, data, title }) {
  if (!open || !data) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader><DialogTitle>{title}</DialogTitle>
          <DialogDescription>{data.total} rows processed</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-3 py-1">
          {data.created?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 mb-1">✓ Created ({data.created.length})</p>
              {data.created.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.name}</p>)}
            </div>
          )}
          {data.skipped?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-600 mb-1">⚠ Skipped ({data.skipped.length})</p>
              {data.skipped.map((r, i) => <p key={i} className="text-xs text-muted-foreground">{r.name} — {r.reason}</p>)}
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
export default function EnrollmentPage() {
  const dispatch = useDispatch();
  const sections = useSelector((s) => s.academic?.sections?.list ?? []);

  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [actionLoad, setActionLoad] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const [filters, setFilters] = useState({
    search: "", section_id: "all", status: "all",
    semester: "all", academic_year: "", is_current: "all",
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [bulkStatusModal, setBulkStatusModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [bulkDelConfirm, setBulkDelConfirm] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  // Load sections
  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 200 })); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (filters.search) params.search = filters.search;
    if (filters.section_id !== "all") params.section_id = filters.section_id;
    if (filters.status !== "all") params.status = filters.status;
    if (filters.semester !== "all") params.semester = filters.semester;
    if (filters.academic_year) params.academic_year = filters.academic_year;
    if (filters.is_current !== "all") params.is_current = filters.is_current === "current";
    try {
      const res = await axiosInstance.get(EP.enrollments.list, { params });
      // Fallback to direct EP
      const d = res.data?.data;
      setList(d?.enrollments || []);
      setPagination(d?.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
      setSelected(new Set());
    } catch { notify.error("Failed to load enrollments"); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const setF = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  const allIds = list.map((e) => e.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  // ── Actions ────────────────────────────────────────────────
  const handleAddForStudent = async (student_id, data) => {
    setActionLoad(true);
    try {
      await axiosInstance.post(EP.enrollments.create, { student_id, ...data });
      notify.success("Enrollment added"); setAddModal(false); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActionLoad(false); }
  };

  const handleUpdate = async (data) => {
    setActionLoad(true);
    try {
      await axiosInstance.patch(EP.enrollments.update(editModal.id), data);
      notify.success("Updated"); setEditModal(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActionLoad(false); }
  };

  const handleDelete = async (enrollment) => {
    setActionLoad(true);
    try {
      await axiosInstance.delete(EP.enrollments.delete(enrollment.id));
      notify.success("Deleted"); setDelConfirm(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActionLoad(false); }
  };

  const handleSetCurrent = async (enrollment) => {
    try {
      await axiosInstance.patch(EP.enrollments.setCurrent(enrollment.id));
      notify.success("Set as current enrollment"); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const handleBulkStatus = async (status, remarks) => {
    setActionLoad(true);
    try {
      await axiosInstance.patch(EP.enrollments.bulkStatus, { ids: [...selected], status, remarks });
      notify.success(`${selected.size} enrollment(s) updated`);
      setBulkStatusModal(false); setSelected(new Set()); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActionLoad(false); }
  };

  const handleBulkDelete = async () => {
    setActionLoad(true);
    try {
      await axiosInstance.delete(EP.enrollments.bulkDelete, { data: { ids: [...selected] } });
      notify.success("Deleted"); setBulkDelConfirm(false); setSelected(new Set()); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActionLoad(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    setActionLoad(true);
    try {
      const res = await axiosInstance.post(EP.enrollments.bulkUpload, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResults(res.data.data); load();
    } catch (err) { notify.error(err.response?.data?.message || "Upload failed"); }
    finally { setActionLoad(false); e.target.value = ""; }
  };

  const handleTemplate = async () => {
    try {
      const res = await axiosInstance.get(EP.enrollments.template, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(res.data);
      a.download = "enrollment_template.xlsx"; a.click();
    } catch { notify.error("Download failed"); }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (filters.section_id !== "all") params.section_id = filters.section_id;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.semester !== "all") params.semester = filters.semester;
      const res = await axiosInstance.get(EP.enrollments.export, { params, responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(res.data);
      a.download = "enrollments_export.xlsx"; a.click();
      notify.success("Exported");
    } catch { notify.error("Export failed"); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardList size={20} className="text-muted-foreground" /> Enrollments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pagination.total} records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="sr-only" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={handleTemplate}><Download size={13} className="mr-1.5" />Template</Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload size={13} className="mr-1.5" />Bulk Upload</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download size={13} className="mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => setAddModal(true)}><Plus size={13} className="mr-1.5" />Add Enrollment</Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search student name, roll no…"
            value={filters.search} onChange={(e) => setF("search", e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}
          className={cn(showFilters && "bg-accent")}>
          <Filter size={13} className="mr-1.5" /> Filters
          {Object.entries(filters).some(([k, v]) => k !== "search" && v !== "all" && v !== "") && (
            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
          <RefreshCw size={13} className={cn(loading && "animate-spin")} />
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 bg-muted/40 rounded-xl border border-border">
          <Select value={filters.section_id} onValueChange={(v) => setF("section_id", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setF("status", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.semester} onValueChange={(v) => setF("semester", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {SEMESTERS.map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="h-9 text-sm" placeholder="Academic Year" value={filters.academic_year}
            onChange={(e) => setF("academic_year", e.target.value)} />
          <Select value={filters.is_current} onValueChange={(v) => setF("is_current", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Records</SelectItem>
              <SelectItem value="current">Current Only</SelectItem>
              <SelectItem value="historical">Historical</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="text-muted-foreground h-9"
            onClick={() => { setFilters({ search: "", section_id: "all", status: "all", semester: "all", academic_year: "", is_current: "all" }); setPage(1); }}>
            <X size={12} className="mr-1" /> Clear
          </Button>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl flex-wrap">
          <span className="text-sm font-medium text-foreground mr-1">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setBulkStatusModal(true)}>
            <CheckCircle size={12} className="mr-1" /> Bulk Status
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10"
            onClick={() => setBulkDelConfirm(true)}>
            <Trash2 size={12} className="mr-1" /> Delete Selected
          </Button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="w-10 px-3 py-3"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Section</th>
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sem / Year</th>
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Enrolled</th>
                <th className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 size={20} className="animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Loading…</p>
                </td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <ClipboardList size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No enrollment records found.</p>
                </td></tr>
              ) : list.map((e) => (
                <tr key={e.id} className={cn("hover:bg-muted/30 transition-colors", selected.has(e.id) && "bg-primary/5")}>
                  <td className="px-3 py-3"><Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggleSel(e.id)} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {e.student?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate text-sm flex items-center gap-1.5">
                          {e.student?.name}
                          {e.is_current && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">Current</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{e.student?.roll_no || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <p className="text-sm text-foreground">{e.section?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{e.section?.batch || ""}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-foreground">Sem {e.semester}</p>
                    <p className="text-xs text-muted-foreground">{e.academic_year}</p>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", STATUS_STYLE[e.status] || STATUS_STYLE.ACTIVE)}>
                      {e.status}
                    </span>
                    {e.remarks && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[100px]">{e.remarks}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setEditModal(e)}>
                            <Pencil size={13} className="mr-2" /> Edit
                          </DropdownMenuItem>
                          {!e.is_current && (
                            <DropdownMenuItem onClick={() => handleSetCurrent(e)}>
                              <Star size={13} className="mr-2" /> Set as Current
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive"
                            onClick={() => setDelConfirm(e)}>
                            <Trash2 size={13} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
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
      <AddForStudentModal open={addModal} onClose={() => setAddModal(false)}
        onSubmit={handleAddForStudent} loading={actionLoad} sections={sections} />

      <EnrollmentModal open={!!editModal} onClose={() => setEditModal(null)}
        onSubmit={handleUpdate} initialData={editModal}
        loading={actionLoad} sections={sections} />

      <BulkStatusModal open={bulkStatusModal} onClose={() => setBulkStatusModal(false)}
        onSubmit={handleBulkStatus} count={selected.size} loading={actionLoad} />

      {delConfirm && (
        <Dialog open onOpenChange={(v) => { if (!v) setDelConfirm(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Enrollment</DialogTitle>
              <DialogDescription>
                Delete Sem {delConfirm.semester} ({delConfirm.academic_year}) record for <strong>{delConfirm.student?.name}</strong>?
                {delConfirm.is_current && " This is the current enrollment — it cannot be deleted."}
              </DialogDescription>
            </DialogHeader>
            {delConfirm.is_current ? (
              <Button variant="outline" onClick={() => setDelConfirm(null)}>Close</Button>
            ) : (
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setDelConfirm(null)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" disabled={actionLoad}
                  onClick={() => handleDelete(delConfirm)}>
                  {actionLoad && <Spinner />} Delete
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {bulkDelConfirm && (
        <Dialog open onOpenChange={(v) => { if (!v) setBulkDelConfirm(false); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete {selected.size} Enrollment(s)</DialogTitle>
              <DialogDescription>This cannot be undone. Current enrollments cannot be deleted.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setBulkDelConfirm(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={actionLoad}
                onClick={handleBulkDelete}>
                {actionLoad && <Spinner />} Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ResultsModal open={!!results} onClose={() => setResults(null)}
        data={results} title="Bulk Upload Results" />
    </div>
  );
}