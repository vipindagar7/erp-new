// src/modules/portal/faculty/pages/FacultyDashboard.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays, Users, BookOpen, GraduationCap, ClipboardList,
    BarChart2, FileText, Video, Loader2, ChevronRight,
    CheckCircle, AlertCircle, Clock,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";

const COLOR = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-green-50 border-green-100 text-green-600",
    violet: "bg-violet-50 border-violet-100 text-violet-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    teal: "bg-teal-50 border-teal-100 text-teal-600",
    rose: "bg-rose-50 border-rose-100 text-rose-600",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
};

export default function FacultyDashboard() {
    const user = useSelector(s => s.auth?.user);
    const faculty = user?.faculty;
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [today, setToday] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!faculty?.id) { setLoading(false); return; }
        const today = new Date().toISOString().slice(0, 10);
        Promise.all([
            axiosInstance.get(EP.timetable.topics, { params: { faculty_id: faculty.id, date: today } }).catch(() => ({ data: { data: [] } })),
            axiosInstance.get(EP.timetable.workload, { params: { faculty_id: faculty.id } }).catch(() => ({ data: { data: [] } })),
            axiosInstance.get(EP.faculty.subjectRequests, { params: { faculty_id: faculty.id } }).catch(() => ({ data: { data: [] } })),
        ]).then(([topicsRes, wlRes, reqRes]) => {
            const topics = topicsRes.data?.data || [];
            const workloads = wlRes.data?.data || [];
            const requests = reqRes.data?.data || [];
            const totalHrs = workloads.reduce((s, w) => s + (w.weekly_hours || 0), 0);
            setStats({
                total_subjects: workloads.length,
                weekly_hours: totalHrs,
                topics_today: topics.length,
                pending_requests: requests.filter(r => r.status === "PENDING").length,
                approved_subjects: requests.filter(r => r.status === "APPROVED").length,
            });
            setToday(topics);
        }).finally(() => setLoading(false));
    }, [faculty?.id]);

    const QUICK_ACTIONS = [
        { label: "My Timetable", icon: CalendarDays, path: "/portal/faculty/timetable", color: "blue", desc: "View your class schedule" },
        { label: "Mark Attendance", icon: CheckCircle, path: "/portal/faculty/attendance", color: "green", desc: "Mark student attendance" },
        { label: "Topics Taught", icon: BookOpen, path: "/portal/faculty/topics", color: "violet", desc: "Log topics covered in today's class" },
        { label: "Course Structure", icon: FileText, path: "/portal/faculty/course-structure", color: "teal", desc: "Upload/view your syllabus" },
        { label: "Subject Preferences", icon: GraduationCap, path: "/portal/faculty/subject-prefs", color: "indigo", desc: "Request subjects for next session" },
        { label: "Leave", icon: ClipboardList, path: "/portal/faculty/leave", color: "amber", desc: "Apply for leave" },
        { label: "Special Sessions", icon: Video, path: "/portal/faculty/special-sessions", color: "rose", desc: "Seminars, workshops" },
        { label: "Daily Reports", icon: BarChart2, path: "/portal/faculty/reports", color: "orange", desc: "View your daily teaching reports" },
    ];

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;

    const today_str = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Greeting */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
                <p className="text-sm text-muted-foreground">{today_str}</p>
                <h1 className="text-2xl font-bold mt-0.5">
                    Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},
                    {" "}{faculty?.name?.split(" ")[0] || "Faculty"} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{faculty?.designation} · {faculty?.department?.name}</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Subjects Assigned", value: stats.total_subjects, color: "text-blue-600" },
                        { label: "Hrs/Week", value: stats.weekly_hours, color: "text-violet-600" },
                        { label: "Topics Today", value: stats.topics_today, color: "text-green-600" },
                        { label: "Pending Requests", value: stats.pending_requests, color: "text-amber-600" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
                            <p className={`text-3xl font-bold ${color}`}>{value ?? "—"}</p>
                            <p className="text-xs text-muted-foreground mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Today's topics */}
            {today.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-semibold">Today's Topics Taught</p>
                    <div className="space-y-1.5">
                        {today.map(t => (
                            <div key={t.id} className="flex items-center gap-3 text-sm p-2 bg-green-50 rounded-xl">
                                <CheckCircle size={14} className="text-green-600 shrink-0" />
                                <span className="font-medium flex-1">{t.topic_text}</span>
                                <span className="text-xs text-muted-foreground">{t.subject?.name} · {t.period_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick actions */}
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map(({ label, icon: Icon, path, color, desc }) => (
                        <button key={path} onClick={() => navigate(path)}
                            className="text-left bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all group space-y-2">
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${COLOR[color]}`}>
                                <Icon size={18} />
                            </div>
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}