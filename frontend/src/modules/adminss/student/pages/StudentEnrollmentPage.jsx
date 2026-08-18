// src/modules/student/pages/StudentEnrollmentPage.jsx
import { useEffect, useState } from "react";
import { BookOpen, Loader2, AlertCircle, GraduationCap, Layers, Calendar } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function StudentEnrollmentPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosInstance.get("/api/students/me")
      .then((r) => setProfile(r.data?.data ?? r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const current = profile?.enrollments?.find((e) => e.is_current);
  const previous = profile?.enrollments?.filter((e) => !e.is_current) ?? [];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm max-w-lg">
      <AlertCircle size={15} /> Failed to load enrollment details.
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen size={20} /> My Enrollment</h1>
        <p className="text-sm text-muted-foreground mt-1">Your academic enrollment details</p>
      </div>

      {/* Student identity */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Student Profile</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Row label="Name" value={profile?.name} />
          <Row label="Roll No" value={profile?.roll_no} />
          <Row label="Enrollment No" value={profile?.enrollment_no} />
          <Row label="Program" value={profile?.program?.name} />
          <Row label="Course" value={profile?.course?.name} />
          <Row label="Department" value={profile?.department?.name} />
          <Row label="Batch Year" value={profile?.batch_year} />
          <Row label="Admission Year" value={profile?.admission_year} />
          <Row label="Mode" value={profile?.mode_of_admission} />
        </div>
      </div>

      {/* Current enrollment */}
      {current && (
        <div className="bg-card border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={16} className="text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Current Enrollment</p>
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${current.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                current.status === "DETAINED" ? "bg-red-100 text-red-700" :
                  "bg-muted text-muted-foreground"
              }`}>{current.status}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Row label="Academic Year" value={current.academic_year} />
            <Row label="Semester" value={`Semester ${current.semester}`} />
            <Row label="Section" value={profile?.section?.name} />
            <Row label="Enrolled On" value={new Date(current.enrolled_at).toLocaleDateString("en-IN")} />
            {current.remarks && <Row label="Remarks" value={current.remarks} />}
          </div>

          {/* Current subjects */}
          {profile?.subjects?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-3">Enrolled Subjects</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profile.subjects.map((ss) => (
                  <div key={ss.subject.id} className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg border border-border">
                    <BookOpen size={12} className="text-muted-foreground shrink-0" />
                    <p className="text-xs font-medium truncate">{ss.subject.name}</p>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground shrink-0">{ss.subject.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous enrollments */}
      {previous.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previous Enrollments</p>
          </div>
          <div className="space-y-3">
            {previous.sort((a, b) => b.semester - a.semester).map((e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2.5 bg-muted/30 rounded-xl border border-border">
                <div>
                  <p className="text-sm font-medium">Semester {e.semester} · {e.academic_year}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString("en-IN")}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${e.status === "PASSED" ? "bg-green-100 text-green-700" :
                    e.status === "DETAINED" ? "bg-red-100 text-red-700" :
                      e.status === "PROMOTED" ? "bg-blue-100 text-blue-700" :
                        "bg-muted text-muted-foreground"
                  }`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!current && !loading && (
        <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">
          <Layers size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No active enrollment found</p>
        </div>
      )}
    </div>
  );
}