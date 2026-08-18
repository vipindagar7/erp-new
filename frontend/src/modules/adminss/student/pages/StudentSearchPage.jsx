// src/modules/student/pages/StudentSearchPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, X, ArrowLeft } from "lucide-react";
import { getStudents } from "../../../../redux/student/studentSlice.js";
import { fetchSections, fetchDepartments, fetchPrograms, fetchCourses } from "../../../../redux/academic/academicSlice.js";
import { StudentTable } from "../components/StudentTable.jsx";
import { PromoteModal, ChangeSectionModal } from "../components/StudentModals.jsx";
import { notify } from "../../../../hooks/notify.js";
import { deleteStudent, toggleStudentBlock } from "../../../../redux/student/studentSlice.js";
import { useDispatch as useD } from "react-redux";

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => { const y = currentYear - 3 + i; return `${y}-${y + 1}`; });
const SEMESTERS   = [1,2,3,4,5,6,7,8];
const GENDERS     = ["MALE","FEMALE","OTHER"];
const STATUSES    = ["ACTIVE","DETAINED","PASSED","LEFT","TRANSFERRED"];

const sel = () => "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const inp = () => "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

function FilterGroup({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

export default function StudentSearchPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { items: students, pagination, loading } = useSelector((s) => s.student);
  const sections    = useSelector((s) => s.academic?.sections?.list ?? []);
  const departments = useSelector((s) => s.academic?.departments?.list ?? []);
  const programs    = useSelector((s) => s.academic?.programs?.list ?? []);
  const courses     = useSelector((s) => s.academic?.courses?.list ?? []);

  const [query, setQuery]     = useState("");
  const [filters, setFilters] = useState({});
  const [searched, setSearched] = useState(false);
  const [page, setPage]       = useState(1);
  const [limit]               = useState(20);

  const [promoteTarget, setPromoteTarget]         = useState(null);
  const [changeSectionTarget, setChangeSectionTarget] = useState(null);
  const [checkedIds, setCheckedIds]               = useState([]);

  useEffect(() => {
    if (!sections.length)    dispatch(fetchSections({ limit: 500 }));
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
    if (!programs.length)    dispatch(fetchPrograms({ limit: 200 }));
    if (!courses.length)     dispatch(fetchCourses({ limit: 200 }));
  }, []);

  const setFilter = (k, v) => setFilters((p) => ({ ...p, [k]: v || undefined }));

  const handleSearch = () => {
    const params = { page, limit };
    if (query) params.search = query;
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params[k] = v; });
    dispatch(getStudents(params));
    setSearched(true);
  };

  const handleReset = () => { setQuery(""); setFilters({}); setSearched(false); };

  const handleToggleBlock = async (s) => {
    await dispatch(toggleStudentBlock({ id: s.id, isBlocked: !s.user?.isBlocked }));
    handleSearch();
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete ${s.first_name} ${s.last_name}?`)) return;
    const r = await dispatch(deleteStudent(s.id));
    if (!r.error) handleSearch();
    else notify.error(r.payload);
  };

  const toggleCheck  = (id) => setCheckedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll    = () => setCheckedIds(checkedIds.length === (students || []).length ? [] : (students || []).map((s) => s.id));

  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "").length + (query ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/students")}
          className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Search Students</h1>
          <p className="text-sm text-muted-foreground">Use filters to find specific students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Filter panel */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
            {/* Text search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Name, roll, email…"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <FilterGroup title="Academic Structure">
              <select className={sel()} value={filters.dept_id || ""} onChange={(e) => setFilter("dept_id", e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className={sel()} value={filters.program_id || ""} onChange={(e) => setFilter("program_id", e.target.value)}>
                <option value="">All Programs</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className={sel()} value={filters.course_id || ""} onChange={(e) => setFilter("course_id", e.target.value)}>
                <option value="">All Courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={sel()} value={filters.section_id || ""} onChange={(e) => setFilter("section_id", e.target.value)}>
                <option value="">All Sections</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
              </select>
            </FilterGroup>

            <FilterGroup title="Enrollment">
              <select className={sel()} value={filters.academic_year || ""} onChange={(e) => setFilter("academic_year", e.target.value)}>
                <option value="">All Academic Years</option>
                {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className={sel()} value={filters.semester || ""} onChange={(e) => setFilter("semester", e.target.value)}>
                <option value="">All Semesters</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              <select className={sel()} value={filters.status || ""} onChange={(e) => setFilter("status", e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className={inp()} type="number" placeholder="Batch year e.g. 2024" value={filters.batch_year || ""} onChange={(e) => setFilter("batch_year", e.target.value)} />
            </FilterGroup>

            <FilterGroup title="Personal">
              <select className={sel()} value={filters.gender || ""} onChange={(e) => setFilter("gender", e.target.value)}>
                <option value="">All Genders</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className={sel()} value={filters.isBlocked ?? ""} onChange={(e) => setFilter("isBlocked", e.target.value)}>
                <option value="">Account — Any</option>
                <option value="false">Active</option>
                <option value="true">Blocked</option>
              </select>
              <select className={sel()} value={filters.is_hosteller ?? ""} onChange={(e) => setFilter("is_hosteller", e.target.value)}>
                <option value="">Hosteller — Any</option>
                <option value="true">Hosteller Only</option>
                <option value="false">Day Scholars Only</option>
              </select>
            </FilterGroup>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button onClick={handleSearch}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                Search
              </button>
              {activeCount > 0 && (
                <button onClick={handleReset}
                  className="w-full h-9 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted flex items-center justify-center gap-1.5">
                  <X size={13} /> Reset ({activeCount} active)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {!searched ? (
            <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-2xl">
              <Search size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Set filters and click Search</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{pagination?.total ?? 0} results</p>
              </div>
              <StudentTable
                students={students || []}
                loading={loading}
                page={page}
                limit={limit}
                checkedIds={checkedIds}
                onToggleCheck={toggleCheck}
                onToggleAll={toggleAll}
                onPromote={setPromoteTarget}
                onChangeSection={setChangeSectionTarget}
                onToggleBlock={handleToggleBlock}
                onDelete={handleDelete}
                activeFilterCount={activeCount}
              />
            </>
          )}
        </div>
      </div>

      <PromoteModal open={!!promoteTarget} student={promoteTarget} onClose={() => setPromoteTarget(null)} onSuccess={handleSearch} />
      <ChangeSectionModal open={!!changeSectionTarget} student={changeSectionTarget} sections={sections} onClose={() => setChangeSectionTarget(null)} onSuccess={handleSearch} />
    </div>
  );
}
