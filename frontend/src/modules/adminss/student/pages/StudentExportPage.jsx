// src/modules/student/pages/StudentExportPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDepartments, fetchPrograms, fetchCourses, fetchSections } from "../../../../redux/academic/academicSlice.js";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";

const sel = () => "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

const SHEETS_INFO = [
  { key: "summary",         label: "Summary",              desc: "Overview counts — status, dept, gender, semester" },
  { key: "all",             label: "All Students",          desc: "Complete data for every student" },
  { key: "active",          label: "Active",                desc: "Currently active enrollment" },
  { key: "detained",        label: "Detained",              desc: "Detained students only" },
  { key: "passed",          label: "Passed / Graduated",    desc: "Students who have passed" },
  { key: "left",            label: "Left / Transferred",    desc: "Students who left" },
  { key: "promoted",        label: "Promoted",              desc: "Students with more than one enrollment" },
  { key: "gender",          label: "Gender Analysis",       desc: "Male / Female breakdown per department" },
  { key: "department",      label: "Department-wise",       desc: "Section-wise counts per department" },
  { key: "section_summary", label: "Section-wise Summary",  desc: "All sections with status counts" },
  { key: "sections",        label: "Per-Section Sheets",    desc: "One sheet per section (named by section)" },
];

export default function StudentExportPage() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const departments = useSelector((s) => s.academic?.departments?.list ?? []);
  const programs    = useSelector((s) => s.academic?.programs?.list ?? []);
  const courses     = useSelector((s) => s.academic?.courses?.list ?? []);
  const sections    = useSelector((s) => s.academic?.sections?.list ?? []);

  const [filters, setFilters]   = useState({});
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
    if (!programs.length)    dispatch(fetchPrograms({ limit: 200 }));
    if (!courses.length)     dispatch(fetchCourses({ limit: 200 }));
    if (!sections.length)    dispatch(fetchSections({ limit: 500 }));
  }, []);

  const setFilter = (k, v) => setFilters((p) => ({ ...p, [k]: v || undefined }));

  const handleExport = async () => {
    setLoading(true); setDone(false);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await axiosInstance.get(
        `/admin/students/export-advanced?${params}`,
        { responseType: "blob" }
      );
      const filename = `students-${new Date().toISOString().slice(0,10)}.xlsx`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = filename; a.click();
      setDone(true);
      notify.success("Export downloaded");
    } catch (err) {
      notify.error(err.response?.data?.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/students")}
          className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Export Students</h1>
          <p className="text-sm text-muted-foreground">Multi-sheet Excel with full student data</p>
        </div>
      </div>

      {/* What's included */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold">Sheets Included</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SHEETS_INFO.map((s) => (
            <div key={s.key} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40">
              <FileSpreadsheet size={14} className="text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Filter Export (Optional)</p>
          {activeFilters > 0 && (
            <button onClick={() => setFilters({})}
              className="text-xs text-primary hover:underline">
              Clear filters ({activeFilters})
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Leave blank to export all students. Apply filters to export a subset.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Department</label>
            <select className={sel()} value={filters.dept_id || ""} onChange={(e) => setFilter("dept_id", e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Program</label>
            <select className={sel()} value={filters.program_id || ""} onChange={(e) => setFilter("program_id", e.target.value)}>
              <option value="">All Programs</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Course</label>
            <select className={sel()} value={filters.course_id || ""} onChange={(e) => setFilter("course_id", e.target.value)}>
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Section</label>
            <select className={sel()} value={filters.section_id || ""} onChange={(e) => setFilter("section_id", e.target.value)}>
              <option value="">All Sections</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Batch Year</label>
            <input
              type="number"
              placeholder="e.g. 2024"
              value={filters.batch_year || ""}
              onChange={(e) => setFilter("batch_year", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Export button */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <FileSpreadsheet size={16} className="text-green-600" />
          <span>
            {activeFilters > 0
              ? `Export will include ${activeFilters} active filter${activeFilters > 1 ? "s" : ""}`
              : "Export will include all students"}
          </span>
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
            hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Generating Excel…</>
          ) : done ? (
            <><Check size={16} /> Downloaded Successfully</>
          ) : (
            <><Download size={16} /> Download Multi-sheet Excel</>
          )}
        </button>
        {done && (
          <p className="text-center text-xs text-green-600 font-medium">
            ✓ File downloaded to your Downloads folder
          </p>
        )}
      </div>
    </div>
  );
}
