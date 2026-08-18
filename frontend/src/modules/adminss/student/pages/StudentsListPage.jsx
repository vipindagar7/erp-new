// src/modules/student/pages/StudentsListPage.jsx
// Dept-scope filtered student list
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search, Filter, Download, Loader2, ChevronRight,
  ShieldOff, ShieldCheck, Eye, MoreVertical,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { CanDo } from "../../../../components/shared/PermGuard.jsx";

const STATUS_COLOR = {
  ACTIVE: "bg-green-100 text-green-700",
  DETAINED: "bg-red-100 text-red-700",
  BLOCKED: "bg-amber-100 text-amber-700",
  PASSED: "bg-blue-100 text-blue-700",
};

export default function StudentsListPage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const departments = useSelector(s => s.academic?.departments?.list ?? []);

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    dept_id: user?.dept_ids?.[0] || "", // pre-fill with user's dept scope
    branch_id: "",
    section_id: "",
  });
  const [page, setPage] = useState(1);

  // Dept scope enforcement
  // useMemo to prevent new array ref on every render (causes infinite loop)
  const deptIds = useMemo(() => user?.dept_ids || [], [user?.dept_ids?.join(',')]);
  const hasDeptScope = deptIds.length > 0 && user?.role !== "SUPER_ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, q: search || undefined, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      // If user has dept scope, add dept_ids filter
      if (hasDeptScope && !params.dept_id) params.dept_ids = deptIds.join(",");

      const res = await axiosInstance.get(EP.students.list, { params });
      setStudents(res.data?.data?.students || res.data?.data || []);
      setPagination(res.data?.data?.pagination || { total: 0, page: 1, pages: 1 });
    } catch { notify.error("Failed to load students"); }
    finally { setLoading(false); }
  }, [page, search, filters, deptIds, hasDeptScope]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filters]);

  const toggleBlock = async (student) => {
    const action = student.user?.isBlocked ? "unblock" : "block";
    try {
      await axiosInstance.patch(`/api/students/${student.id}/block`);
      notify.success(`Student ${action}ed`);
      load();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} total
            {hasDeptScope && <span className="ml-1 text-amber-600">· dept-scoped</span>}
          </p>
        </div>
        <CanDo perm="students.export">
          <button onClick={() => navigate("/admin/students/export")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted">
            <Download size={13} />Export
          </button>
        </CanDo>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none"
            placeholder="Search name, roll no, email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
          <option value="">All Status</option>
          {["ACTIVE", "DETAINED", "PASSED", "BLOCKED"].map(s => <option key={s}>{s}</option>)}
        </select>
        {/* Dept filter — only show if user has institute-wide access */}
        {!hasDeptScope && (
          <select value={filters.dept_id} onChange={e => setFilters(f => ({ ...f, dept_id: e.target.value }))}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/20">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Roll No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Section</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Loader2 size={18} className="animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {s.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{s.roll_no || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {s.section?.name || "—"}
                  {s.section?.branch && <span className="ml-1 opacity-60">· {s.section.branch.name}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status] || "bg-muted text-muted-foreground"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/admin/students/${s.id}`)}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
                      <Eye size={13} />
                    </button>
                    <CanDo perm="students.block">
                      <button onClick={() => toggleBlock(s)}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
                        {s.user?.isBlocked ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                      </button>
                    </CanDo>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {students.length} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="h-8 px-3 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40">
              ← Prev
            </button>
            <span className="h-8 px-3 flex items-center text-xs text-muted-foreground">
              {page} / {pagination.pages}
            </span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="h-8 px-3 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}