// src/modules/student/pages/StudentComingSoonPage.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";

export function StudentAttendancePage() {
  return <ComingSoonPage
    title="Attendance Tracking"
    desc="Track daily student attendance per section and subject."
    features={[
      "Mark attendance per lecture / lab / practical",
      "Per-student attendance percentage",
      "Short attendance alerts (below 75%)",
      "Bulk attendance via Excel upload",
      "Monthly / semester attendance reports",
      "Faculty-wise attendance marking",
    ]}
    backPath="/admin/students"
  />;
}

export function StudentFeesPage() {
  return <ComingSoonPage
    title="Fee Management"
    desc="Manage student fee records, dues and payment history."
    features={[
      "Fee structure per course and semester",
      "Per-student fee records and dues",
      "Payment history and receipts",
      "Bulk fee update via Excel",
      "Defaulter list with notifications",
      "Integration with hostel and transport fees",
    ]}
    backPath="/admin/students"
  />;
}

function ComingSoonPage({ title, desc, features, backPath }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(backPath)}
          className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>

      <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Clock size={28} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-semibold">Coming in Next Version</p>
          <p className="text-sm text-muted-foreground mt-1">This module is under development.</p>
        </div>
        <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
          Planned for v2.0
        </span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold">What's planned</p>
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
