// ─────────────────────────────────────────────────────────────
// All module-specific history pages — thin wrappers around
// ModuleHistoryPage. Each one just sets the module name.
// ─────────────────────────────────────────────────────────────

// src/modules/department/pages/DepartmentHistoryPage.jsx
import { Building2 } from "lucide-react";
import ModuleHistoryPage from "../../../../components/shared/ModuleHistoryPage.jsx";
export function DepartmentHistoryPage() {
  return <ModuleHistoryPage module="department" title="Department History" icon={Building2}
    actions={["CREATE","UPDATE","DELETE","RESTORE"]} />;
}

// src/modules/programs/pages/ProgramHistoryPage.jsx
import { FileText } from "lucide-react";
export function ProgramHistoryPage() {
  return <ModuleHistoryPage module="program" title="Program History" icon={FileText}
    actions={["CREATE","UPDATE","DELETE","RESTORE"]} />;
}

// src/modules/course/pages/CourseHistoryPage.jsx
import { BookOpen } from "lucide-react";
export function CourseHistoryPage() {
  return <ModuleHistoryPage module="course" title="Course History" icon={BookOpen}
    actions={["CREATE","UPDATE","DELETE","RESTORE"]} />;
}

// src/modules/subject/pages/SubjectHistoryPage.jsx
export function SubjectHistoryPage() {
  return <ModuleHistoryPage module="subject" title="Subject History" icon={BookOpen}
    actions={["CREATE","UPDATE","DELETE","RESTORE"]} />;
}

// src/modules/session/pages/SessionHistoryPage.jsx
import { CalendarDays } from "lucide-react";
export function SessionHistoryPage() {
  return <ModuleHistoryPage module="session" title="Session History" icon={CalendarDays}
    actions={["CREATE","UPDATE","SET_CURRENT","LOCK","DELETE"]} />;
}

// src/modules/curriculum/pages/CurriculumHistoryPage.jsx
import { Navigation } from "lucide-react";
export function CurriculumHistoryPage() {
  return <ModuleHistoryPage module="curriculum" title="Curriculum History" icon={Navigation}
    actions={["CREATE","UPDATE","DELETE"]} />;
}

// src/modules/enrollment/pages/EnrollmentHistoryPage.jsx
import { ClipboardList } from "lucide-react";
export function EnrollmentHistoryPage() {
  return <ModuleHistoryPage module="enrollment" title="Enrollment History" icon={ClipboardList}
    actions={["CREATE","UPDATE","DELETE","BULK_PROMOTE","BULK_DEMOTE"]} />;
}

// For per-record history (pass recordId as prop):
// e.g. <DepartmentRecordHistory id="dept-uuid" />
export function DepartmentRecordHistory({ id }) {
  return <ModuleHistoryPage module="department" title="Department Changes" icon={Building2} recordId={id}
    actions={["CREATE","UPDATE","DELETE","RESTORE"]} />;
}
