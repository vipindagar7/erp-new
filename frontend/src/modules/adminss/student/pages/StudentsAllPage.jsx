// src/modules/student/pages/StudentsAllPage.jsx
// Full student list: search, filters, select-all, bulk delete (root), view detail
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Trash2, Eye, Users, ChevronDown,
  ChevronUp, X, RotateCcw, Download,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";
import { useSelector } from "react-redux";

const STATUS_COLOR = {
  ACTIVE:      "bg-green-100 text-green-700",
  DETAINED:    "bg-amber-100 text-amber-700",
  ON_HOLD:     "bg-orange-100 text-orange-700",
  PASSED:      "bg-blue-100 text-blue-700",
  LEFT:        "bg-red-100 text-red-700",
  TRANSFERRED: "bg-gray-100 text-gray-600",
  SUSPENDED:   "bg-red-100 text-red-700",
};

const STATUSES = ["ACTIVE","DETAINED","ON_HOLD","PASSED","LEFT","TRANSFERRED","SUSPENDED"];

export default function StudentsAllPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isRoot = user?.is_root;

  // ── Filter state ─────────────────────────────────────────────
  const [search,      setSearch]      = useState("");
  const [filters,     setFilters]     = useState({
    dept_id: "", program_id: "", branch_id: "", section_id: "",
    status: "", semester: "", batch_year: "", gender: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // ── Data state ───────────────────────────────────────────────
  const [students,  setStudents]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const LIMIT = 50;

  // ── Selection state ──────────────────────────────────────────
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false); // all pages

  // ── Action state ─────────────────────────────────────────────
  const [delConfirm, setDelConfirm] = useState(false);
  const [acting,     setActing]     = useState(false);

  const timer = useRef(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = {
        page: pg, limit: LIMIT,
        search:     search       || undefined,
        dept_id:    filters.dept_id    || undefined,
        program_id: filters.program_id || undefined,
        branch_id:  filters.branch_id  || undefined,
        section_id: filters.section_id || undefined,
        status:     filters.status     || undefined,
        batch_year: filters.batch_year || undefined,
        gender:     filters.gender     || undefined,
      };
      // semester filter — needs section/enrollment join
      if (filters.semester) params.semester = filters.semester;

      const r = await axiosInstance.get(EP.students.list, { params });
      const d = r.data?.data;
      setStudents(d?.students || []);
      setTotal(d?.pagination?.total || 0);
      setPage(pg);
      setSelected(new Set()); // clear selection on reload
      setSelectAll(false);
    } catch { notify.error("Failed to load students"); }
    finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(1), 300);
    return () => clearTimeout(timer.current);
  }, [load]);

  const setFilter = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  const resetFilters = () => {
    setFilters({ dept_id:"", program_id:"", branch_id:"", section_id:"", status:"", semester:"", batch_year:"", gender:"" });
    setSearch("");
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Selection ─────────────────────────────────────────────────
  const toggleOne = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePage = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (permanent = false) => {
    setActing(true);
    try {
      const ids = [...selected];
      if (permanent && isRoot) {
        await axiosInstance.delete(`${EP.students.list}/bulk-delete-permanent`, { data: { ids } });
        notify.success(`${ids.length} students permanently deleted`);
      } else {
        const results = { deleted: [], failed: [] };
        for (const id of ids) {
          try { await axiosInstance.delete(EP.students.delete(id)); results.deleted.push(id); }
          catch { results.failed.push(id); }
        }
        notify.success(`${results.deleted.length} deleted${results.failed.length ? `, ${results.failed.length} failed` : ""}`);
      }
      setDelConfirm(false); load(1);
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h1 className="text-xl font-bold">All Students</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selected.size > 0 && (
            <>
              <span className="text-xs text-primary font-medium self-center">{selected.size} selected</span>
              {isRoot && (
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30"
                  onClick={() => setDelConfirm("permanent")}>
                  <Trash2 size={13} className="mr-1.5" /> Delete Selected
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
                <X size={13} className="mr-1.5" /> Clear
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters((f) => !f)}>
            <Filter size={13} className="mr-1.5" />
            Filters {activeFilterCount > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, roll no, email…" className="pl-9" />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</p>
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw size={11} /> Reset all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <SearchSelect endpoint={EP.departments.list} dataPath="departments" valueKey="id" labelKey="name"
                value={filters.dept_id} onChange={setFilter("dept_id")} placeholder="All depts" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Program</Label>
              <SearchSelect endpoint={EP.programs.list} dataPath="programs" valueKey="id" labelKey="name"
                extraParams={filters.dept_id ? { dept_id: filters.dept_id } : {}}
                value={filters.program_id} onChange={setFilter("program_id")} placeholder="All programs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Branch</Label>
              <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
                extraParams={filters.program_id ? { program_id: filters.program_id } : {}}
                value={filters.branch_id} onChange={setFilter("branch_id")} placeholder="All branches" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
                subLabelKey="branch.name"
                extraParams={filters.branch_id ? { branch_id: filters.branch_id } : {}}
                value={filters.section_id} onChange={setFilter("section_id")} placeholder="All sections" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <select value={filters.status} onChange={(e) => setFilter("status")(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Semester</Label>
              <select value={filters.semester} onChange={(e) => setFilter("semester")(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">All semesters</option>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Batch Year</Label>
              <Input value={filters.batch_year} onChange={(e) => setFilter("batch_year")(e.target.value)}
                placeholder="e.g. 2024" type="number" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <select value={filters.gender} onChange={(e) => setFilter("gender")(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">All</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <input type="checkbox" className="w-4 h-4"
            checked={selected.size === students.length && students.length > 0}
            onChange={togglePage} />
          {selected.size > 0 && (
            <button onClick={() => { setSelectAll(true); setSelected(new Set(students.map(s => s.id))); }}
              className="text-xs text-primary hover:underline">
              Select all {total} students matching filters
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {loading ? "Loading…" : `Showing ${students.length} of ${total}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/10">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                {["Student","Roll No","Section","Sem","Branch","Status",""].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">Loading…</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-sm text-muted-foreground">No students found</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className={`hover:bg-muted/10 transition-colors ${selected.has(s.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" className="w-4 h-4" checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{s.roll_no || "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.section?.name || "—"}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-bold text-primary">{s.section?.semester || "—"}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.branch?.name || "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[s.status] || "bg-muted"}`}>{s.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => navigate(ROUTES.students.detail(s.id))}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
            <p className="text-xs text-muted-foreground">Page {page} of {pages} · {total} students</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1}
                onClick={() => load(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= pages}
                onClick={() => load(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold text-destructive">
              {delConfirm === "permanent" ? "Permanently Delete?" : "Soft Delete?"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {delConfirm === "permanent"
                ? `This will permanently remove ${selected.size} student record(s) from the database. This cannot be undone.`
                : `This will soft-delete ${selected.size} student(s). They can be restored later.`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDelConfirm(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={acting}
                onClick={() => handleDelete(delConfirm === "permanent")}>
                {acting ? "Deleting…" : delConfirm === "permanent" ? "Delete Forever" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
