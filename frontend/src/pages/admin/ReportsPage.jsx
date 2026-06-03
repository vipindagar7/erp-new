import { useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../../lib/axios.js";

import { cn } from "../../lib/utils.js";
import { useDispatch } from "react-redux";
import { fetchSections } from "../../redux/academic/academicSlice.js";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, FileSpreadsheet, Users, GraduationCap,
  BookOpen, Loader2, BarChart3, ClipboardList,
} from "lucide-react";
import { notify } from "../../hooks/notify.js";

const download = async (url, filename, setLoading) => {
  setLoading(true);
  try {
    const res = await axiosInstance.get(url, { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    notify.success(`${filename} downloaded`);
  } catch (err) {
    notify.error(err.response?.data?.message || "Export failed");
  } finally { setLoading(false); }
};

function ReportCard({ icon: Icon, title, description, color, action }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function ReportsPage() {
  const dispatch = useDispatch();
  const sections = useSelector((s) => s.academic?.sections?.list ?? []);
  const departments = useSelector((s) => s.academic?.departments?.list ?? []);
  const [filterSection, setFilterSection] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (!sections.length) dispatch(fetchSections({ limit: 200 }));
  }, []);

  const setL = (key, val) => setLoading((l) => ({ ...l, [key]: val }));

  const reports = [
    {
      icon: GraduationCap,
      title: "Students Report",
      description: "Export all students with enrollment, section, contact and academic details.",
      color: "bg-blue-500",
      action: (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {s.course?.name} (Sem {s.semester})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full h-8 text-xs" disabled={loading.students}
            onClick={() => {
              const url = filterSection !== "all"
                ? `/admin/reports/students?section_id=${filterSection}`
                : "/admin/reports/students";
              download(url, "students_report.xlsx", (v) => setL("students", v));
            }}>
            {loading.students
              ? <Loader2 size={12} className="mr-1.5 animate-spin" />
              : <Download size={12} className="mr-1.5" />}
            Export Excel
          </Button>
        </div>
      ),
    },
    {
      icon: Users,
      title: "Faculty Report",
      description: "Export all faculty with designations, departments, assigned subjects and sections.",
      color: "bg-purple-500",
      action: (
        <Button size="sm" className="w-full h-8 text-xs" disabled={loading.faculty}
          onClick={() => download("/admin/reports/faculty", "faculty_report.xlsx", (v) => setL("faculty", v))}>
          {loading.faculty
            ? <Loader2 size={12} className="mr-1.5 animate-spin" />
            : <Download size={12} className="mr-1.5" />}
          Export Excel
        </Button>
      ),
    },
    {
      icon: ClipboardList,
      title: "Enrollment Report",
      description: "Export current enrollment records with semester, academic year and status.",
      color: "bg-green-500",
      action: (
        <Button size="sm" className="w-full h-8 text-xs" disabled={loading.enroll}
          onClick={() => download("/admin/reports/enrollments", "enrollment_report.xlsx", (v) => setL("enroll", v))}>
          {loading.enroll
            ? <Loader2 size={12} className="mr-1.5 animate-spin" />
            : <Download size={12} className="mr-1.5" />}
          Export Excel
        </Button>
      ),
    },
    {
      icon: BarChart3,
      title: "Feedback Results",
      description: "Export detailed feedback results with per-question analysis. Go to a specific form to export.",
      color: "bg-rose-500",
      action: (
        <Button size="sm" variant="outline" className="w-full h-8 text-xs"
          onClick={() => window.location.href = "/admin/feedback/forms"}>
          Go to Feedback Forms →
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-muted-foreground" /> Reports & Exports
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Download data exports for students, faculty, enrollments and feedback.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {reports.map((r) => <ReportCard key={r.title} {...r} />)}
      </div>
    </div>
  );
}