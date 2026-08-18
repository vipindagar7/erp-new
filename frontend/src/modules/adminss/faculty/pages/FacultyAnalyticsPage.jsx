// src/modules/adminss/faculty/pages/FacultyAnalyticsPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2, Loader2, Download, Calendar, BookOpen, Clock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function FacultyAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [slips, setSlips] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.faculty.byId(id)),
      axiosInstance.get(EP.leave.faculty(id)).catch(() => ({ data: { data: [] } })),
      axiosInstance.get(EP.hr.slips + `?faculty_id=${id}`).catch(() => ({ data: { data: { items: [] } } })),
      axiosInstance.get(`/api/training/mentor/${id}/report`).catch(() => ({ data: { data: { trainings: [] } } })),
    ]).then(([fRes, lRes, sRes, tRes]) => {
      setFaculty(fRes.data?.data);
      setLeaves(lRes.data?.data || []);
      setSlips(sRes.data?.data?.items || []);
      setTrainings(tRes.data?.data?.trainings || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const exportCSV = () => {
    if (!faculty) return;
    const rows = [
      ["Name", faculty.name],
      ["Emp ID", faculty.emp_id],
      ["Designation", faculty.designation],
      ["Department", faculty.department?.name],
      ["Status", faculty.status],
      ["Joining Date", faculty.joining_date ? new Date(faculty.joining_date).toLocaleDateString("en-IN") : "—"],
      ["Total Leaves", leaves.length],
      ["Approved Leaves", leaves.filter(l => l.status === "APPROVED").length],
      ["Total Trainings as Mentor", trainings.length],
      ["Total Students Mentored", trainings.reduce((s, t) => s + t.total_students, 0)],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `faculty-${faculty.name?.replace(/ /g, "-")}-analytics.csv`;
    a.click();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;
  if (!faculty) return <div className="text-center py-20 text-sm text-muted-foreground">Faculty not found</div>;

  const approvedLeaves = leaves.filter(l => l.status === "APPROVED");
  const totalLeaveDays = approvedLeaves.reduce((s, l) => s + (l.total_days || 0), 0);
  const pendingLeaves = leaves.filter(l => l.status === "PENDING").length;
  const latestSlip = slips[0];
  const mentorStudents = trainings.reduce((s, t) => s + t.total_students, 0);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/faculty/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={18} className="text-primary" />Faculty Analytics</h1>
          <p className="text-sm text-muted-foreground">{faculty.name} · {faculty.designation} · {faculty.department?.name}</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={13} />Export
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Leave Days Used", value: totalLeaveDays, color: "text-amber-600", icon: Calendar },
          { label: "Pending Leaves", value: pendingLeaves, color: "text-orange-600", icon: Clock },
          { label: "Trainings Mentored", value: trainings.length, color: "text-violet-600", icon: BookOpen },
          { label: "Students Mentored", value: mentorStudents, color: "text-green-600", icon: BarChart2 },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className={`${s.color} mb-2`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[["overview", "Overview"], ["leave", "Leave History"], ["salary", "Salary"], ["training", "Training"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          {[
            ["Full Name", faculty.name],
            ["Employee ID", faculty.emp_id],
            ["Designation", faculty.designation],
            ["Department", faculty.department?.name],
            ["Employee Type", faculty.employee_type],
            ["Status", faculty.status],
            ["Joining Date", faculty.joining_date ? new Date(faculty.joining_date).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—"],
            ["Experience", faculty.experience_years ? `${faculty.experience_years} years` : "—"],
            ["Qualification", faculty.qualification],
            ["Specialization", faculty.specialization],
          ].map(([k, v]) => v && (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="text-xs font-medium">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Leave */}
      {tab === "leave" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Applied", value: leaves.length, color: "text-foreground" },
              { label: "Approved", value: approvedLeaves.length, color: "text-green-600" },
              { label: "Days Used", value: totalLeaveDays, color: "text-amber-600" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/20">
                <tr>{["From", "To", "Days", "Type", "Status"].map(h => <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No leave records</td></tr>}
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2.5">{new Date(l.startDate || l.from_date).toLocaleDateString("en-IN", { dateStyle: "short" })}</td>
                    <td className="px-3 py-2.5">{new Date(l.endDate || l.to_date).toLocaleDateString("en-IN", { dateStyle: "short" })}</td>
                    <td className="px-3 py-2.5">{l.total_days || l.totalDays || 1}</td>
                    <td className="px-3 py-2.5">{l.leaveType?.name || l.type || "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${l.status === "APPROVED" ? "bg-green-50 text-green-700" : l.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary */}
      {tab === "salary" && (
        <div className="space-y-3">
          {latestSlip && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Latest Slip — {latestSlip.month}/{latestSlip.year}
              </p>
              {[
                ["Gross", `₹${latestSlip.gross_salary?.toLocaleString()}`],
                ["Deductions", `₹${latestSlip.total_deductions?.toLocaleString()}`],
                ["Net", `₹${latestSlip.net_salary?.toLocaleString()}`],
                ["Status", latestSlip.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-xs text-muted-foreground">{k}</span>
                  <span className="text-xs font-bold">{v}</span>
                </div>
              ))}
            </div>
          )}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/20">
                <tr>{["Month", "Year", "Gross", "Net", "Status"].map(h => <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slips.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No salary slips</td></tr>}
                {slips.map(s => (
                  <tr key={s.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/admin/hr/slips/${s.id}`)}>
                    <td className="px-3 py-2.5">{s.month}</td>
                    <td className="px-3 py-2.5">{s.year}</td>
                    <td className="px-3 py-2.5">₹{s.gross_salary?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-medium">₹{s.net_salary?.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.status === "PAID" ? "bg-green-50 text-green-700" : s.status === "APPROVED" ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Training */}
      {tab === "training" && (
        <div className="space-y-3">
          {trainings.length === 0 ? (
            <div className="text-center py-10 bg-card border border-border rounded-2xl text-sm text-muted-foreground">No training records as mentor</div>
          ) : trainings.map(t => (
            <div key={t.training_id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.code} · {t.type} · Role: {t.role}</p>
                </div>
                <button onClick={() => navigate(`/admin/training/${t.training_id}`)} className="text-xs text-primary hover:underline">View →</button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[["Students", t.total_students], ["Completed", t.completed], ["Avg Attend", t.avg_attendance + "%"]].map(([l, v]) => (
                  <div key={l} className="bg-muted/20 rounded-xl p-2">
                    <p className="font-bold">{v}</p>
                    <p className="text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}