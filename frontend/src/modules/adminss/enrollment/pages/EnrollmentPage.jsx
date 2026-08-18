// src/modules/enrollment/pages/EnrollmentPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Plus, Search, Filter, Download, Upload, Edit, Trash2, X, Loader2, CheckCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";

const STATUS_COLORS = {
  ACTIVE: "bg-green-100 text-green-700",
  DETAINED: "bg-red-100 text-red-700",
  PASSED: "bg-blue-100 text-blue-700",
  LEFT: "bg-gray-100 text-gray-600",
  TRANSFERRED: "bg-amber-100 text-amber-700",
  PROMOTED: "bg-emerald-100 text-emerald-700",
};

const STATUSES = ["ACTIVE", "DETAINED", "PASSED", "LEFT", "TRANSFERRED", "PROMOTED"];

function EnrollmentModal({ enrollment, sessions, sections, onSave, onClose }) {
  const isEdit = !!enrollment?.id;
  const [form, setForm] = useState({
    student_id: enrollment?.student_id || "",
    session_id: enrollment?.session_id || "",
    academic_year: enrollment?.academic_year || "",
    semester: enrollment?.semester || "",
    batch_year: enrollment?.batch_year || "",
    section_id: enrollment?.section_id || "",
    status: enrollment?.status || "ACTIVE",
    is_current: enrollment?.is_current ?? false,
    remarks: enrollment?.remarks || "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  const handleSave = async () => {
    if (!form.academic_year || !form.semester) return notify.error("Academic year and semester required");
    setLoading(true);
    try {
      const payload = { ...form, semester: Number(form.semester), batch_year: Number(form.batch_year) || 0 };
      if (isEdit) {
        await axiosInstance.patch(`/students/enrollments/${enrollment.id}`, payload);
      } else {
        await axiosInstance.post("/students/enrollments", payload);
      }
      notify.success(isEdit ? "Updated" : "Enrollment created");
      onSave();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <h2 className="text-base font-semibold">{isEdit ? "Edit" : "Add"} Enrollment</h2>
        <div className="grid grid-cols-2 gap-3">
          {!isEdit && (
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">Student ID *</label>
              <input className={inp} value={form.student_id} onChange={set("student_id")} placeholder="UUID" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Academic Year *</label>
            <input className={inp} value={form.academic_year} onChange={set("academic_year")} placeholder="2024-25" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Semester *</label>
            <select className={inp} value={form.semester} onChange={set("semester")}>
              <option value="">Select…</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Section</label>
            <select className={inp} value={form.section_id} onChange={set("section_id")}>
              <option value="">None</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Status</label>
            <select className={inp} value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Batch Year</label>
            <input className={inp} type="number" value={form.batch_year} onChange={set("batch_year")} />
          </div>
          <div className="space-y-1.5 flex items-center gap-2 pt-5">
            <input type="checkbox" id="is_current" checked={form.is_current} onChange={(e) => setForm((f) => ({ ...f, is_current: e.target.checked }))} />
            <label htmlFor="is_current" className="text-xs font-medium cursor-pointer">Set as Current</label>
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium">Remarks</label>
            <input className={inp} value={form.remarks} onChange={set("remarks")} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EnrollmentPage() {
  const { can } = usePageGuard();
  const [enrollments, setEnrollments] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/sections", { params: { limit: 500 } }),
      axiosInstance.get("/sessions"),
    ]).then(([s, se]) => {
      setSections(s.data?.data?.sections || []);
      setSessions(se.data?.data || []);
    }).catch(() => { });
    load();
  }, []);

  const load = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit, ...filters, ...overrides };
      const r = await axiosInstance.get("/students/enrollments", { params });
      setEnrollments(r.data?.data?.enrollments || r.data?.data || []);
      setTotal(r.data?.data?.pagination?.total || 0);
      setSearched(true);
    } catch { notify.error("Failed to load enrollments"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/students/enrollments/${deleteTarget.id}`);
      notify.success("Deleted"); setDeleteTarget(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setDeleteLoading(false); }
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return notify.error("Select enrollments and status");
    try {
      await axiosInstance.patch("/students/enrollments/bulk-status", { ids: [...selected], status: bulkStatus });
      notify.success(`${selected.size} enrollments updated`);
      setSelected(new Set()); setBulkStatus(""); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(filters);
      const res = await axiosInstance.get(`/students/enrollments/export?${params}`, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([res.data])); a.download = "enrollments.xlsx"; a.click();
    } catch { notify.error("Export failed"); }
  };

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v || undefined }));
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><GraduationCap size={20} /> Enrollments</h1>
          <p className="text-sm text-muted-foreground">{searched ? `${total} enrollments` : "Search to load"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
            <Download size={14} /> Export
          </button>
          {can("students.create") && (
            <button onClick={() => setModal({ enrollment: null })}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              <Plus size={14} /> Add Enrollment
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
          <span className="text-xs font-medium text-primary">{selected.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
            className="h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none">
            <option value="">Change Status…</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleBulkStatus} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Apply</button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Clear</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium ${activeFilters ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:bg-muted"}`}>
          <Filter size={13} /> Filters {activeFilters > 0 && `(${activeFilters})`}
        </button>
        <button onClick={() => load({ page: 1 })} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Load</button>
        {activeFilters > 0 && (
          <button onClick={() => { setFilters({}); load({ page: 1 }); }} className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted">
            <X size={13} /> Reset
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "section_id", label: "Section", options: sections.map((s) => ({ value: s.id, label: `${s.name} (Sem ${s.semester})` })) },
            { key: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })) },
            { key: "semester", label: "Semester", options: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `Semester ${n}` })) },
          ].map(({ key, label, options }) => (
            <div key={key} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <select className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none"
                value={filters[key] || ""} onChange={(e) => setFilter(key, e.target.value)}>
                <option value="">All</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Academic Year</p>
            <input value={filters.academic_year || ""} onChange={(e) => setFilter("academic_year", e.target.value)}
              placeholder="2024-25" className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none" />
          </div>
          <div className="col-span-4 flex justify-end">
            <button onClick={() => load({ page: 1 })} className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Apply</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={selected.size === enrollments.length && enrollments.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? new Set(enrollments.map((en) => en.id)) : new Set())} />
                </th>
                {["Student", "Section", "Semester", "Academic Year", "Status", "Current", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => <td key={j} className="px-3 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                </tr>
              )) : enrollments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">{searched ? "No enrollments found" : "Apply filters to load"}</td></tr>
              ) : enrollments.map((en) => (
                <tr key={en.id} className="border-b border-border last:border-0 hover:bg-muted/20 group">
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.has(en.id)} onChange={() => toggleSelect(en.id)} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium">{en.student?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{en.student?.roll_no}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{en.section?.name || "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">Sem {en.semester}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{en.academic_year}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[en.status] || "bg-muted text-muted-foreground"}`}>
                      {en.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {en.is_current && <CheckCircle size={14} className="text-green-600" />}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 justify-end">
                      <button onClick={() => setModal({ enrollment: en })} className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Edit size={12} /></button>
                      <button onClick={() => setDeleteTarget(en)} className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">{total} · Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              {[["«", () => { setPage(1); load({ page: 1 }) }, page === 1], ["‹", () => { const p = Math.max(1, page - 1); setPage(p); load({ page: p }) }, page === 1],
              ["›", () => { const p = Math.min(totalPages, page + 1); setPage(p); load({ page: p }) }, page === totalPages], ["»", () => { setPage(totalPages); load({ page: totalPages }) }, page === totalPages]]
                .map(([l, a, d], i) => <button key={i} onClick={a} disabled={d} className="h-8 w-8 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted disabled:opacity-40">{l}</button>)}
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <EnrollmentModal enrollment={modal.enrollment} sessions={sessions} sections={sections}
          onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
      )}
      <ConfirmModal open={!!deleteTarget} title="Delete Enrollment" variant="danger"
        message={`Delete enrollment for ${deleteTarget?.student?.name}?`}
        confirmLabel="Delete" loading={deleteLoading}
        onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}