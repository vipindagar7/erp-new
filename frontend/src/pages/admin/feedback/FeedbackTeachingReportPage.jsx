import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../../lib/axios.js";
import { EP } from "../../../config/api.config.js";
import { cn } from "../../../lib/utils.js";
import {
  ChevronDown, ChevronRight, Download, Loader2,
  Building2, BookOpen, Users, GraduationCap, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "../../../hooks/notify.js";

// ── Rating badge ───────────────────────────────────────────────
function RatingBadge({ avg }) {
  if (avg == null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = avg >= 4 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : avg >= 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full", color)}>
      ⭐ {Number(avg).toFixed(2)}
    </span>
  );
}

// ── Download button ────────────────────────────────────────────
function DownloadBtn({ level, id, categoryId, label }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ level, id });
      if (categoryId) params.append("category_id", categoryId);
      const res = await axiosInstance.get(`${EP.feedback.exportLevel}?${params}`, { responseType: "blob" });
      const cd = res.headers["content-disposition"] || "";
      const name = cd.match(/filename="?([^"]+)"?/)?.[1] || `${level}_report.xlsx`;
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch { notify.error("Export failed"); }
    finally { setLoading(false); }
  };
  return (
    <button onClick={handle} disabled={loading}
      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors whitespace-nowrap">
      {loading
        ? <Loader2 size={11} className="animate-spin" />
        : <Download size={11} />}
      {label || "Download"}
    </button>
  );
}

// ── Form row ───────────────────────────────────────────────────
function FormRow({ form, categoryId }) {
  const now = new Date();
  const status = !form.is_active ? "Inactive"
    : new Date(form.end_date) < now ? "Expired"
      : new Date(form.start_date) > now ? "Scheduled"
        : "Active";
  const stCls = status === "Active" ? "bg-green-100 text-green-700"
    : status === "Expired" ? "bg-red-100 text-red-700"
      : status === "Scheduled" ? "bg-blue-100 text-blue-700"
        : "bg-zinc-100 text-zinc-600";
  return (
    <tr className="hover:bg-muted/20 transition-colors group">
      <td className="pl-16 pr-4 py-2.5">
        <p className="text-sm font-medium text-foreground">{form.faculty?.name}</p>
        <p className="text-xs text-muted-foreground">{form.faculty?.nick_name || ""}</p>
      </td>
      <td className="px-4 py-2.5">
        <p className="text-sm text-foreground">{form.subject?.name}</p>
        <p className="text-xs font-mono text-muted-foreground">{form.subject?.code}</p>
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">{form.subject?.nickname || "—"}</td>
      <td className="px-4 py-2.5 text-center">
        <span className="text-sm font-bold text-foreground">{form.responses}</span>
      </td>
      <td className="px-4 py-2.5">
        <RatingBadge avg={form.avg_rating} />
      </td>
      <td className="px-4 py-2.5">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", stCls)}>{status}</span>
      </td>
      <td className="px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <DownloadBtn level="section" id={form.section_id || ""} categoryId={categoryId} label="Report" />
      </td>
    </tr>
  );
}

// ── Section block ──────────────────────────────────────────────
function SectionBlock({ section, deptId, courseId, categoryId }) {
  const [open, setOpen] = useState(false);
  const totalResp = section.total_responses;
  return (
    <div className="border-l-2 border-border ml-8 mt-1">
      {/* Section header row */}
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer rounded-lg mx-1 transition-colors",
        open && "bg-muted/20"
      )} onClick={() => setOpen((p) => !p)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? <ChevronDown size={13} className="text-muted-foreground shrink-0" />
            : <ChevronRight size={13} className="text-muted-foreground shrink-0" />}
          <Users size={12} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold text-foreground">Sec {section.name}</span>
          {section.semester && <span className="text-xs text-muted-foreground">· Sem {section.semester}</span>}
          {section.batch && <span className="text-xs text-muted-foreground">· {section.batch}</span>}
          <span className="text-xs text-muted-foreground ml-1">({section.forms?.length || 0} forms)</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">{totalResp} responses</span>
          <RatingBadge avg={section.avg_rating} />
          <div onClick={(e) => e.stopPropagation()}>
            <DownloadBtn level="section" id={section.id} categoryId={categoryId} label="Section Report" />
          </div>
        </div>
      </div>

      {/* Forms table */}
      {open && section.forms?.length > 0 && (
        <div className="mt-1 mb-2 mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="text-left pl-16 pr-4 py-2">Faculty</th>
                <th className="text-left px-4 py-2">Subject</th>
                <th className="text-left px-4 py-2">Nick</th>
                <th className="text-center px-4 py-2">Resp.</th>
                <th className="text-left px-4 py-2">Avg</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {section.forms.map((f) => (
                <FormRow key={f.id} form={{ ...f, section_id: section.id }} categoryId={categoryId} />
              ))}
            </tbody>
            {/* Section average footer */}
            <tfoot>
              <tr className="bg-muted/30 text-xs font-semibold">
                <td colSpan={3} className="pl-16 pr-4 py-2 text-muted-foreground uppercase tracking-wide">Section Average</td>
                <td className="px-4 py-2 text-center font-bold">{totalResp}</td>
                <td className="px-4 py-2"><RatingBadge avg={section.avg_rating} /></td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Course block ───────────────────────────────────────────────
function CourseBlock({ course, deptId, categoryId }) {
  const [open, setOpen] = useState(false);
  const allForms = course.sections?.flatMap(s => s.forms || []) || [];
  const totalResp = course.sections?.reduce((s, sec) => s + (sec.total_responses || 0), 0) || 0;
  const allAvgs = course.sections?.map(s => s.avg_rating).filter(v => v != null) || [];
  const avgRating = allAvgs.length ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length : null;

  return (
    <div className="border-l-2 border-border/60 ml-6 mt-1">
      {/* Course header */}
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer rounded-lg mx-1 transition-colors",
        open && "bg-muted/20"
      )} onClick={() => setOpen((p) => !p)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? <ChevronDown size={14} className="text-muted-foreground shrink-0" />
            : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
          <BookOpen size={13} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold text-foreground">{course.name}</span>
          <span className="text-xs text-muted-foreground">({course.sections?.length || 0} sections)</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">{totalResp} responses</span>
          <RatingBadge avg={avgRating} />
          <div onClick={(e) => e.stopPropagation()}>
            <DownloadBtn level="course" id={course.id} categoryId={categoryId} label="Course Report" />
          </div>
        </div>
      </div>

      {open && course.sections?.map((sec) => (
        <SectionBlock key={sec.id} section={sec} deptId={deptId} courseId={course.id} categoryId={categoryId} />
      ))}
    </div>
  );
}

// ── Dept block ─────────────────────────────────────────────────
function DeptBlock({ dept, categoryId }) {
  const [open, setOpen] = useState(false);
  const totalResp = dept.courses?.reduce((s, c) =>
    s + (c.sections?.reduce((ss, sec) => ss + (sec.total_responses || 0), 0) || 0), 0) || 0;
  const allSecAvgs = dept.courses?.flatMap(c => c.sections?.map(s => s.avg_rating).filter(v => v != null) || []) || [];
  const avgRating = allSecAvgs.length ? allSecAvgs.reduce((a, b) => a + b, 0) / allSecAvgs.length : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Dept header */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors",
        open && "border-b border-border"
      )} onClick={() => setOpen((p) => !p)}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {open ? <ChevronDown size={15} className="text-muted-foreground shrink-0" />
            : <ChevronRight size={15} className="text-muted-foreground shrink-0" />}
          <Building2 size={15} className="text-primary shrink-0" />
          <span className="font-semibold text-foreground">{dept.name}</span>
          <span className="text-xs text-muted-foreground">({dept.courses?.length || 0} courses)</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground">{totalResp} responses</span>
          <RatingBadge avg={avgRating} />
          <div onClick={(e) => e.stopPropagation()}>
            <DownloadBtn level="dept" id={dept.id} categoryId={categoryId} label="Dept Report" />
          </div>
        </div>
      </div>

      {open && (
        <div className="p-3 space-y-1">
          {dept.courses?.map((course) => (
            <CourseBlock key={course.id} course={course} deptId={dept.id} categoryId={categoryId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function FeedbackTeachingReportPage() {
  const [tree, setTree] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  // Load categories for filter
  useEffect(() => {
    axiosInstance.get(EP.feedback.categories)
      .then((r) => {
        const cats = r.data?.data?.categories || r.data?.data || [];
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => { });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = categoryId ? `?category_id=${categoryId}` : "";
      const res = await axiosInstance.get(`${EP.feedback.teachingReport}${params}`);
      setTree(res.data?.data || []);
    } catch { notify.error("Failed to load teaching report"); }
    finally { setLoading(false); }
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  // Stats
  const totalDepts = tree.length;
  const totalCourses = tree.reduce((s, d) => s + (d.courses?.length || 0), 0);
  const allSections = tree.flatMap((d) => d.courses?.flatMap((c) => c.sections || []) || []);
  const allForms = allSections.flatMap((sec) => sec.forms || []);
  const totalSections = allSections.length;
  const totalForms = allForms.length;
  const totalResp = allSections.reduce((s, sec) => s + (sec.total_responses || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <GraduationCap size={20} className="text-muted-foreground" />
            Teaching Feedback Report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalDepts} depts · {totalCourses} courses · {totalSections} sections · {totalForms} forms · {totalResp} total responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={load}>
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring min-w-[200px]">
          <option value="">All Categories</option>
          {categories.filter(c => c.type === "TEACHING" || c.type === "GENERAL").map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Click on any department, course, or section to expand. Download report at any level.
        </span>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <GraduationCap size={36} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-foreground">No teaching feedback forms found</p>
          <p className="text-sm text-muted-foreground mt-1">Create teaching-type forms in Feedback → Forms</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tree.map((dept) => (
            <DeptBlock key={dept.id} dept={dept} categoryId={categoryId} />
          ))}
        </div>
      )}
    </div>
  );
}