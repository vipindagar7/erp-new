// src/modules/course/pages/CourseHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, History, AlertCircle, Loader2, Layers, FileText } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

const QUICK_ACTIONS = [
    { label: "Add Course", icon: Plus, path: ROUTES.courses.new, perm: "academic.create", color: "teal" },
    { label: "History", icon: History, path: ROUTES.courses.history, perm: "audit.view", color: "violet" },
    { label: "All Sections", icon: Layers, path: ROUTES.sections.hub, perm: "sections.view", color: "green" },
];

const COLOR = {
    teal: "bg-teal-50 text-teal-600", violet: "bg-violet-50 text-violet-600",
    green: "bg-green-50 text-green-600", blue: "bg-blue-50 text-blue-600",
};

const toArray = (res, ...keys) => {
    let d = res?.data?.data ?? res?.data ?? [];
    for (const k of keys) { if (d && typeof d === "object" && !Array.isArray(d)) d = d[k] ?? d; }
    return Array.isArray(d) ? d : [];
};

export default function CourseHubPage() {
    const navigate = useNavigate();
    const { can, isSuperAdmin } = usePageGuard();
    const [courses, setCourses] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        Promise.all([
            axiosInstance.get(EP.courses.list),
            axiosInstance.get(EP.programs.list, { params: { limit: 200 } }),
        ])
            .then(([c, p]) => {
                setCourses(toArray(c, "courses"));
                setPrograms(toArray(p, "programs"));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    const byProgram = programs.map((p) => ({
        ...p,
        courses: courses.filter((c) => c.program_id === p.id || c.program?.id === p.id),
    })).filter((p) => p.courses.length > 0);

    const totalSections = courses.reduce((a, c) => a + (c._count?.sections || 0), 0);

    return (
        <div className="space-y-8 max-w-6xl">
            <div>
                <h1 className="text-2xl font-bold">Course Management</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage course batches under each program.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    <AlertCircle size={15} /> Could not load data.
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { label: "Total Courses", value: courses.length, color: "teal", path: ROUTES.courses.list },
                    { label: "Programs", value: programs.length, color: "violet", path: ROUTES.programs.hub },
                    { label: "Total Sections", value: totalSections, color: "green", path: ROUTES.sections.hub },
                ].map(({ label, value, color, path }) => (
                    <button key={label} onClick={() => navigate(path)}
                        className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <p className="text-xs text-muted-foreground font-medium">{label}</p>
                        <p className={`text-3xl font-bold mt-1 ${COLOR[color].split(" ")[1]}`}>
                            {loading ? <Loader2 size={20} className="animate-spin inline" /> : (value ?? "—")}
                        </p>
                    </button>
                ))}
            </div>

            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.filter((a) => isSuperAdmin || can(a.perm)).map((action) => {
                        const Icon = action.icon;
                        return (
                            <button key={action.label} onClick={() => navigate(action.path)}
                                className="group bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-xl ${COLOR[action.color]} flex items-center justify-center`}><Icon size={18} /></div>
                                <p className="text-xs font-medium text-gray-700">{action.label}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Courses by Program</h2>
                    {can("academic.create") && (
                        <button onClick={() => navigate(ROUTES.courses.new)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
                            <Plus size={12} /> Add Course
                        </button>
                    )}
                </div>
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
                ) : byProgram.length === 0 ? (
                    <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
                        <BookOpen size={32} className="mx-auto text-muted-foreground/20 mb-2" />
                        <p className="text-sm text-muted-foreground">No courses yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {byProgram.map((prog) => (
                            <div key={prog.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
                                    <FileText size={14} className="text-violet-600" />
                                    <p className="text-sm font-semibold">{prog.name}</p>
                                    {prog.code && <code className="text-[10px] font-mono bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded ml-1">{prog.code}</code>}
                                    <span className="ml-auto text-xs text-muted-foreground">{prog.courses.length} courses</span>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/10">
                                            {["Course", "Code", "Sections", "Students"].map((h) => (
                                                <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prog.courses.map((c) => (
                                            <tr key={c.id} onClick={() => navigate(ROUTES.courses.detail(c.id))}
                                                className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                                                <td className="px-4 py-2.5 font-medium text-sm">{c.name}</td>
                                                <td className="px-4 py-2.5"><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.code || "—"}</code></td>
                                                <td className="px-4 py-2.5 text-xs text-muted-foreground">{c._count?.sections ?? 0}</td>
                                                <td className="px-4 py-2.5 text-xs text-muted-foreground">{c._count?.students ?? 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}