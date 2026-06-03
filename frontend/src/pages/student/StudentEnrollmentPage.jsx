// frontend/src/pages/student/StudentEnrollmentPage.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

import { cn } from "../../lib/utils.js";
import {
  ClipboardCheck, Star, BookOpen, Layers,
  Building2, GraduationCap, Calendar, Loader2,
} from "lucide-react";
import { notify } from "../../hooks/notify.js";

const STATUS_COLOR = {
  ACTIVE:      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PROMOTED:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DETAINED:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PASSED:      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  LEFT:        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  TRANSFERRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  INACTIVE:    "bg-muted text-muted-foreground",
};

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function StudentEnrollmentPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.students.myEnrollments)
      .then((res) => setData(res.data))
      .catch(() => notify.error("Failed to load enrollment history"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-16 text-muted-foreground text-sm">
      No enrollment data found.
    </div>
  );

  const { student, enrollments } = data;
  const current = enrollments.find((e) => e.is_current);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <ClipboardCheck size={19} className="text-muted-foreground" /> My Enrollment
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your academic enrollment history
        </p>
      </div>

      {/* Current snapshot card */}
      {student && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-foreground">{student.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1">
                {student.roll_no      && <span className="text-xs text-muted-foreground">Roll: <span className="font-mono font-medium text-foreground">{student.roll_no}</span></span>}
                {student.enrollment_no && <span className="text-xs text-muted-foreground">Enroll: <span className="font-mono font-medium text-foreground">{student.enrollment_no}</span></span>}
              </div>
            </div>
            <span className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0",
              STATUS_COLOR[student.status] ?? STATUS_COLOR.INACTIVE
            )}>
              {student.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoItem icon={Building2}    label="Department" value={student.department?.name} />
            <InfoItem icon={BookOpen}     label="Course"     value={student.course?.name} />
            <InfoItem icon={GraduationCap} label="Program"   value={student.program?.name} />
            <InfoItem icon={Layers}       label="Section"    value={student.section?.name} />
            <InfoItem icon={Star}         label="Semester"   value={student.section?.semester ? `Semester ${student.section.semester}` : null} />
            <InfoItem icon={Calendar}     label="Batch"      value={student.batch_year ? `Batch ${student.batch_year}` : null} />
          </div>
        </div>
      )}

      {/* Enrollment timeline */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Enrollment History</h2>

        {enrollments.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground bg-card border border-border rounded-2xl">
            No enrollment records found.
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((e, idx) => (
              <div key={e.id}
                className={cn(
                  "bg-card border rounded-2xl p-4 transition-all",
                  e.is_current
                    ? "border-primary/40 shadow-sm shadow-primary/10"
                    : "border-border"
                )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center mt-1">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 shrink-0",
                        e.is_current
                          ? "bg-primary border-primary"
                          : "bg-muted border-muted-foreground/30"
                      )} />
                      {idx < enrollments.length - 1 && (
                        <div className="w-0.5 h-full mt-1 bg-border min-h-6" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground text-sm">
                          Semester {e.semester} · {e.academic_year}
                        </span>
                        {e.is_current && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Star size={9} fill="currentColor" /> Current
                          </span>
                        )}
                        <span className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full",
                          STATUS_COLOR[e.status] ?? STATUS_COLOR.INACTIVE
                        )}>
                          {e.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        {e.section    && <span>📍 Section: <span className="text-foreground font-medium">{e.section.name}</span></span>}
                        {e.course     && <span>📚 Course: <span className="text-foreground font-medium">{e.course.name}</span></span>}
                        {e.program    && <span>🎓 Program: <span className="text-foreground font-medium">{e.program.name}</span></span>}
                        {e.department && <span>🏛 Dept: <span className="text-foreground font-medium">{e.department.name}</span></span>}
                        {e.batch_year > 0 && <span>📅 Batch: <span className="text-foreground font-medium">{e.batch_year}</span></span>}
                        {e.enrolled_at && (
                          <span>🗓 Enrolled: <span className="text-foreground font-medium">
                            {new Date(e.enrolled_at).toLocaleDateString()}
                          </span></span>
                        )}
                      </div>

                      {e.remarks && (
                        <p className="text-xs text-muted-foreground italic mt-1.5 border-l-2 border-border pl-2">
                          {e.remarks}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Completed date */}
                  {e.completed_at && (
                    <span className="text-xs text-muted-foreground shrink-0 mt-1">
                      Completed {new Date(e.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
