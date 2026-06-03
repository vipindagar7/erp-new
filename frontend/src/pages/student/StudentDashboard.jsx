import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyForms } from "../../redux/feedback/feedbackSlice.js";
import axiosInstance from "../../lib/axios.js";
import { cn } from "../../lib/utils.js";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, BookOpen, ClipboardList, User, Mail, Phone,
  Building2, Calendar, ChevronRight, Loader2, Star, Clock, CheckCircle,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div onClick={onClick} className={cn("bg-card border border-border rounded-xl p-5 transition-all",
      onClick && "cursor-pointer hover:border-primary/30 hover:shadow-sm")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value ?? "—"}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const myForms = useSelector((s) => s.feedback?.myForms ?? []);
  const actionLoading = useSelector((s) => s.feedback?.actionLoading ?? false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchMyForms());
    axiosInstance.get("/students/me")
      .then((r) => setProfile(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const pending = myForms.filter((f) => !f.submitted);
  const completed = myForms.filter((f) => f.submitted);
  const enrollment = profile?.enrollments?.find((e) => e.is_current);
  const subjects = profile?.section?.sectionSubjects || [];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {profile?.first_name || user?.email?.split("@")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {profile?.section?.name ? `Section ${profile.section.name}` : ""}
          {enrollment ? ` · Semester ${enrollment.semester}` : ""}
          {enrollment?.academic_year ? ` · ${enrollment.academic_year}` : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Pending Feedback" value={pending.length}
          color="bg-orange-500" onClick={() => navigate("/student/feedback")} />
        <StatCard icon={CheckCircle} label="Completed" value={completed.length} color="bg-green-500" />
        <StatCard icon={BookOpen} label="Subjects" value={subjects.length} color="bg-blue-500" />
        <StatCard icon={GraduationCap} label="Semester"
          value={enrollment?.semester ? `Sem ${enrollment.semester}` : "—"} color="bg-purple-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {profile?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile?.name || "Student"}</p>
              <p className="text-sm text-muted-foreground">
                {profile?.roll_no ? `Roll: ${profile.roll_no}` : profile?.enrollment_no ? `Enroll: ${profile.enrollment_no}` : "Student"}
              </p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            {profile?.user?.email && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail size={13} className="shrink-0" /><span className="truncate">{profile.user.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone size={13} className="shrink-0" /><span>{profile.phone}</span>
              </div>
            )}
            {profile?.department && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Building2 size={13} className="shrink-0" /><span>{profile.department.name}</span>
              </div>
            )}
            {profile?.section && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <GraduationCap size={13} className="shrink-0" />
                <span>{profile.section.course?.program?.name} · {profile.section.course?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">Current Enrollment</p>
          </div>
          {!enrollment ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active enrollment found.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Section", value: profile?.section?.name },
                  { label: "Semester", value: `Sem ${enrollment.semester}` },
                  { label: "Academic Year", value: enrollment.academic_year },
                  { label: "Batch", value: profile?.section?.batch },
                  { label: "Course", value: profile?.section?.course?.name },
                  { label: "Program", value: profile?.section?.course?.program?.name },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{value || "—"}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full",
                  enrollment.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    enrollment.status === "DETAINED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      enrollment.status === "PASSED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-muted text-muted-foreground")}>
                  {enrollment.status}
                </span>
              </div>
            </div>
          )}

          {/* Enrollment history */}
          {profile?.enrollments?.length > 1 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">History</p>
              <div className="space-y-1.5">
                {profile.enrollments.filter((e) => !e.is_current).map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sem {e.semester} · {e.academic_year}</span>
                    <span className={cn("font-medium",
                      e.status === "PROMOTED" ? "text-green-600" :
                        e.status === "TRANSFERRED" ? "text-blue-600" : "text-muted-foreground")}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subjects */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="font-semibold text-foreground">My Subjects</p>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No subjects assigned to your section yet.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((ss) => (
                <div key={ss.id} className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ss.subject?.name}</p>
                    <p className="text-xs text-muted-foreground">{ss.subject?.code}</p>
                    {ss.faculty && (
                      <p className="text-xs text-muted-foreground mt-0.5">👨‍🏫 {ss.faculty?.name}</p>
                    )}
                  </div>
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
                    {ss.subject?.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending feedback */}
      {pending.length > 0 && (
        <div className="bg-card border border-orange-200 dark:border-orange-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              Pending Feedback ({pending.length})
            </p>
            <button onClick={() => navigate("/student/feedback")}
              className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pending.slice(0, 4).map((f) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(f.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
              return (
                <div key={f.id} className="flex items-center justify-between gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                    {f.faculty && <p className="text-xs text-muted-foreground">👨‍🏫 {f.faculty.name}</p>}
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                    daysLeft <= 2 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700")}>
                    {daysLeft === 0 ? "Today" : `${daysLeft}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}