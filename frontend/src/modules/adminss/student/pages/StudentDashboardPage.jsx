// src/modules/student/pages/StudentDashboardPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BookOpen, MessageSquare, User, Loader2, AlertCircle, GraduationCap } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosInstance.get("/api/students/me")
      .then((r) => setProfile(r.data?.data ?? r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const enrollment = profile?.enrollments?.find((e) => e.is_current);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-600 text-xl font-bold">{profile?.name?.[0] || "S"}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{loading ? "Welcome!" : `Welcome, ${profile?.name || "Student"}!`}</h1>
            <p className="text-sm text-muted-foreground">
              {profile?.roll_no && `Roll No: ${profile.roll_no}`}
              {profile?.enrollment_no && ` · Enrollment: ${profile.enrollment_no}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm">
          <AlertCircle size={15} /> Could not load profile data.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Department", value: profile?.department?.name || "—", color: "text-violet-600", icon: GraduationCap },
          { label: "Semester", value: enrollment?.semester ? `Sem ${enrollment.semester}` : "—", color: "text-blue-600", icon: BookOpen },
          { label: "Section", value: profile?.section?.name || "—", color: "text-green-600", icon: User },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-sm font-bold ${color}`}>
              {loading ? <Loader2 size={16} className="animate-spin inline" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/student/feedback")}
          className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <MessageSquare size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">Feedback Forms</p>
            <p className="text-xs text-muted-foreground">Submit pending feedback</p>
          </div>
        </button>
        <button onClick={() => navigate("/student/enrollment")}
          className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">My Enrollment</p>
            <p className="text-xs text-muted-foreground">View enrollment details</p>
          </div>
        </button>
      </div>

      {/* Current enrollment details */}
      {enrollment && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Current Enrollment</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Program", value: profile?.program?.name },
              { label: "Course", value: profile?.course?.name },
              { label: "Section", value: profile?.section?.name },
              { label: "Semester", value: enrollment?.semester },
              { label: "Academic Year", value: enrollment?.academic_year },
              { label: "Status", value: enrollment?.status },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium mt-0.5">{value}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
}