import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFacultyMe } from "../../redux/faculty/facultySlice.js";
import { fetchForms } from "../../redux/feedback/feedbackSlice.js";
import { cn } from "../../lib/utils.js";
import { Loader2, BookOpen, Users, BarChart3, UserCheck, Mail, Phone, Building2, Calendar, Star } from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
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

export default function FacultyDashboard() {
  const dispatch = useDispatch();
  const { myProfile, loading } = useSelector((s) => s.faculty ?? {});
  const forms = useSelector((s) => s.feedback?.forms?.list ?? []);

  useEffect(() => {
    dispatch(fetchFacultyMe());
    dispatch(fetchForms({ limit: 50 }));
  }, []);

  if (loading && !myProfile) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  }

  const f = myProfile;
  const mySubjects = f?.subjects?.map((s) => s.subject) || [];
  const mySections = f?.sectionSubjects || [];
  const myForms = forms.filter((fm) => fm.faculty_id === f?.id);
  const pendingForms = myForms.filter((fm) => fm.is_active && new Date() <= new Date(fm.end_date));

  // Unique sections
  const uniqueSections = [...new Map(mySections.map((ss) => [ss.section?.id, ss.section])).values()].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {f?.name?.split(" ")[0] || "Faculty"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {f?.designation || "Faculty"}{f?.department ? ` · ${f.department.name}` : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Subjects" value={mySubjects.length} color="bg-blue-500" />
        <StatCard icon={Users} label="Sections" value={uniqueSections.length} color="bg-green-500" />
        <StatCard icon={BarChart3} label="Feedback Forms" value={myForms.length} color="bg-purple-500" />
        <StatCard icon={Star} label="Pending Reviews" value={pendingForms.length} color="bg-orange-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {f?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{f?.name}</p>
              <p className="text-sm text-muted-foreground">{f?.designation || "Faculty"}</p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            {f?.user?.email && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail size={13} className="shrink-0" /><span className="truncate">{f.user.email}</span>
              </div>
            )}
            {f?.phone && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone size={13} className="shrink-0" /><span>{f.phone}</span>
              </div>
            )}
            {f?.department && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Building2 size={13} className="shrink-0" /><span>{f.department.name}</span>
              </div>
            )}
            {f?.emp_id && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <UserCheck size={13} className="shrink-0" /><span>Emp ID: {f.emp_id}</span>
              </div>
            )}
            {f?.joining_date && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar size={13} className="shrink-0" />
                <span>Joined {new Date(f.joining_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assigned subjects */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="font-semibold text-foreground">My Subjects</p>
          {mySubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No subjects assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {mySubjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.code}</p>
                  </div>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                    {s.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sections teaching */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="font-semibold text-foreground">Sections I Teach</p>
          {mySections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Not assigned to any sections yet.</p>
          ) : (
            <div className="space-y-2">
              {mySections.map((ss, i) => (
                <div key={i} className="py-2 border-b border-border last:border-0">
                  <p className="text-sm font-medium text-foreground">{ss.section?.name} — Sem {ss.section?.semester}</p>
                  <p className="text-xs text-muted-foreground">{ss.section?.batch}</p>
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    ss.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground")}>
                    {ss.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending feedback */}
      {pendingForms.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="font-semibold text-foreground">Active Feedback Forms</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {pendingForms.map((fm) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(fm.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
              return (
                <div key={fm.id} className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{fm.title}</p>
                    <p className="text-xs text-muted-foreground">{fm._count?.responses || 0} responses</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                    daysLeft <= 2 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700")}>
                    {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
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