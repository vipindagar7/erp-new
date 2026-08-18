// src/modules/course/pages/CourseDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Layers, Users, BookOpen } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { notify } from "../../../../hooks/notify.js";

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePageGuard();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.courses.byId(id))
      .then((r) => setCourse(r.data?.data))
      .catch(() => notify.error("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!course) return <div className="text-center py-16 text-muted-foreground">Course not found</div>;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("/admin/courses")} className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center shrink-0 mt-0.5"><ArrowLeft size={16} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{course.name}</h1>
            {course.code && <code className="text-xs px-2 py-0.5 rounded-lg bg-muted font-mono">{course.code}</code>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{course.program?.name} · {course.program?.program?.department?.name || course.program?.department?.name}</p>
        </div>
        {can("academic.update") && (
          <button onClick={() => navigate(`/admin/courses/${id}/edit`)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shrink-0">
            <Edit size={14} /> Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Sections", value: course._count?.sections ?? 0, icon: Layers, color: "green",  path: `/admin/sections?course_id=${id}` },
          { label: "Students", value: course._count?.students ?? 0, icon: Users,  color: "blue",   path: `/admin/students?course_id=${id}` },
        ].map(({ label, value, icon: Icon, color, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`w-8 h-8 rounded-lg bg-${color}-50 text-${color}-600 flex items-center justify-center mb-2`}><Icon size={15} /></div>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {course.sections?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold">Sections</p>
            {can("sections.create") && (
              <button onClick={() => navigate(`/admin/sections/new?course_id=${id}`)}
                className="text-xs text-primary hover:underline">+ Add Section</button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">{["Section","Code","Semester","Students","Status"].map((h) => <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {course.sections.map((s) => (
                <tr key={s.id} onClick={() => navigate(`/admin/sections/${s.id}`)} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3"><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{s.code || "—"}</code></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">Sem {s.semester}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{s._count?.students ?? 0}</td>
                  <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
