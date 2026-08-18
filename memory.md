# EIT Faridabad ERP V3 — Project Memory
**Developer:** Vipin Dagar | **Repo:** vipindagar7/erp-new
**Stack:** Node.js ESM · Express · PostgreSQL · Prisma 7 · React 18 · Vite · Redux Toolkit · Tailwind · shadcn/ui

---

## SCHEMA — Final State
**File:** `prisma/schema.prisma` (from `/mnt/user-data/outputs/phase1/schema/schema_final.prisma`)
**Models:** 119 total · 13 enums · 0 duplicates · 0 back-relation issues

### New models added (Phase 1 — 22 models)
AcademicCalendarEvent, ExtraAttendance, StudentLeaveApproval, Assignment, AssignmentSubmission, AssignmentGrade, Exam, ExamSchedule, ExamRoom, ExamSeating, HallTicket, QuestionPaper, ExamMark, FeeStructure, FeePayment, Scholarship, SalaryComponent, SalarySlip, SalarySlipComponent, StudentSkillCard, SkillCardEntry, AdminDeptScope

### New models added (Phase 2 HR — 5 models)
LeaveRulePolicy, LeaveRule, FacultyLeaveQuota (NOT LeaveBalance — original exists), LeaveSlot, SalaryCycle

### Key schema facts
- `LeaveBalance` — ORIGINAL model (linked to LeaveType). DO NOT create another one.
- `FacultyLeaveQuota` — our new model for HR leave rules (renamed to avoid conflict)
- `SalarySlip` — has `cycle_id String?` and `cycle SalaryCycle?` relation
- `Faculty` back-relations: `assignments[]`, `questionPapers[]`, `salarySlips[]`, `leaveBalances[]` (original), `leaveQuotas[]` (new FacultyLeaveQuota)
- `AcademicSession` back-relations: `leavePolicies[]`, `leaveSlots[]`, `salaryCycles[]`, `facultyLeaveQuotas[]`

### Migration commands
```bash
npx prisma db push          # safest for dev
npx prisma generate
# HR Leave separate migration:
psql -U root -d erp_feedback -f migration_hr_leave.sql
```

---

## BACKEND — All Services & Routes

### File locations
```
backend/modules/student/
  student.service.js          — generateStudentTemplate, bulkCreateStudents (existing)
  student.nosection.service.js — generateTemplateNoSection, bulkCreateStudentsNoSection (NEW)
  student.nosection.routes.js  — 2 routes to ADD to student.routes.js

backend/modules/hr/
  leave-rules.service.js      — policy CRUD, balance init, 7-rule validation, slots
  leave-rules.routes.js       — /api/hr/leave/*
  salary-calculator.service.js — cycle CRUD, preview, bulk generate, report
  salary-calculator.routes.js  — /api/hr/salary/*
```

### Register in index.js
```js
import leaveRulesRouter   from "./modules/hr/leave-rules.routes.js";
import salaryCalcRouter   from "./modules/hr/salary-calculator.routes.js";
app.use("/api/hr/leave",  leaveRulesRouter);
app.use("/api/hr/salary", salaryCalcRouter);
// Student no-section: add 2 routes from student.nosection.routes.js to student.routes.js
```

### New API endpoints
```
GET  /api/students/template/no-section      — download no-section template
POST /api/students/bulk-upload/no-section   — bulk create without section
GET  /api/hr/leave/policies                 — list policies
POST /api/hr/leave/policies                 — create policy
POST /api/hr/leave/policies/:id/rules       — upsert rule
POST /api/hr/leave/policies/:id/init-balances — init balances for all faculty
GET  /api/hr/leave/my-balance               — faculty self-view balance
POST /api/hr/leave/validate-leave           — real-time 7-rule validation
GET  /api/hr/leave/slots                    — list break slots
POST /api/hr/leave/slots                    — create slot
GET  /api/hr/salary/cycles                  — list cycles
POST /api/hr/salary/cycles                  — create cycle (auto-calc working days)
POST /api/hr/salary/cycles/:id/lock         — lock cycle
POST /api/hr/salary/preview                 — preview salary for any date range
POST /api/hr/salary/bulk-generate           — generate all slips for a cycle
GET  /api/hr/salary/report                  — salary report with filters
```

### 7 Leave Validation Rules (leave-rules.service.js)
1. Balance check (available days)
2. Consecutive days limit (max_consecutive)
3. Monthly limit (max_in_month)
4. Slot-based restriction (SLOT type — winter/summer only)
5. Timetable conflict → cover faculty required
6. Min notice days
7. Session-level quota

---

## FRONTEND — All Pages

### New pages built
```
src/modules/adminss/hr/pages/
  HRLeaveRulesPage.jsx       → /admin/hr/leave-rules
  SalaryCyclePage.jsx        → /admin/hr/cycles

src/modules/adminss/faculty/pages/
  FacultyLeaveApplyPage.jsx  → /admin/faculty/leave/apply

src/modules/admin/pages/
  AdminDashboard.jsx         → /admin (REPLACED)

src/modules/student/pages/
  StudentBulkPage.jsx        → /admin/students/bulk (REPLACED — 6 tabs)
```

### StudentBulkPage — 6 tabs
1. **Bulk Upload** — With Section / Without Section toggle
2. **Bulk Promote** — Excel / By Section / Institution-wide
3. **Bulk Demote** — Excel template upload
4. **Bulk Status** — Excel / By Section (ACTIVE/DETAINED/ON_HOLD/PASSED/LEFT/TRANSFERRED/SUSPENDED)
5. **Block/Unblock** — By section
6. **Change Section** — From → To + remarks

### AdminDashboard — 3 views based on role
- **SUPER_ADMIN** — all 23 modules, stat strip, recent activity, quick links per module
- **ADMIN (multi-module)** — only permitted modules with quick links
- **ADMIN (single-module)** — `SingleModuleDashboard` focused view with all quick links

---

## CONFIG FILES

### nav.config.js (`src/config/nav.config.js`)
**21 exports:** ADMIN_NAV + 20 module navs
**Rule:** Only use safe lucide icons — define aliases for risky ones:
```js
const Briefcase     = ClipboardList;
const ClipboardCheck= CheckSquare;
const Calculator    = BarChart2;
const FileCheck     = FileText;
const UserCheck     = UserCircle;
const Target        = BarChart3;
const Laptop        = Settings;
const Lock          = Shield;
const Printer       = Download;
const MapPin        = Navigation;
const Star          = Award;
const Users2        = Users;
```
**Module navs exported:**
STUDENT_MODULE_NAV, FACULTY_MODULE_NAV, ADMIN_MODULE_NAV, DEPARTMENTS_MODULE_NAV, PROGRAMS_MODULE_NAV, SECTIONS_MODULE_NAV, TIMETABLE_MODULE_NAV, ATTENDANCE_MODULE_NAV, LEAVE_MODULE_NAV, EXAM_MODULE_NAV, FEE_MODULE_NAV, HR_MODULE_NAV, ASSIGNMENT_MODULE_NAV, TRAINING_MODULE_NAV, SKILLCARD_MODULE_NAV, STUDENT_LEAVE_MODULE_NAV, FEEDBACK_MODULE_NAV, GROUPS_MODULE_NAV

### AdminLayout.jsx (`src/layouts/AdminLayout.jsx`)
19 prefix → module nav mappings, longest-prefix-first matching

### api.config.js (`src/config/api.config.js`)
New EP keys added:
- `EP.students.templateNoSection`
- `EP.students.bulkUploadNoSection`

---

## SIDEBAR FIX
`src/components/bars/Sidebar.jsx` — NavItem has icon guard:
```js
const Icon = item.icon;
if (!Icon) {
  console.warn("[Sidebar] NavItem missing icon:", item.key, item.label);
  return null;
}
```
**Always check:** If NavItem crashes → look for `icon: undefined` in nav config.

---

## KEY DECISIONS & GOTCHAS

| Topic | Decision |
|---|---|
| LeaveBalance naming | Original model kept as `LeaveBalance` (linked to LeaveType). New model = `FacultyLeaveQuota` |
| Lucide icons | Only import universally available icons. Use `const X = SafeIcon` aliases for rest |
| Prisma back-relations | ALL relations need explicit back-relation on the other model. Prisma 7 strict. |
| Migration SQL ordering | Tables must be created BEFORE their indexes and FKs. Use `IF NOT EXISTS`, `DO $$ EXCEPTION` for enums |
| Single-module admin | Dashboard detects `visibleModules.length === 1` → `SingleModuleDashboard` |
| No-section upload | Students created with no section_id — assign later via Change Section |
| Salary cycle | Working days = total_days - sundays - holidays (from AcademicCalendarEvent) |

---

## OUTPUT FILE LOCATIONS (all deliverables)
```
/mnt/user-data/outputs/
  phase1/schema/schema_final.prisma     — MASTER SCHEMA
  phase1/backend/                        — Phase 1 backend services
  hr_leave/                              — HR Leave + Salary backend
  ALIGNED/router.jsx                     — Master router (274 routes)
  fixes/
    nav.config.js                        — Complete nav (21 exports)
    AdminDashboard.jsx                   — Permission-based dashboard
    StudentBulkPage.jsx                  — 6-tab bulk operations
    Sidebar.jsx                          — With icon guard
    api.config.js                        — With new EP keys
    student.nosection.service.js         — No-section bulk service
    student.nosection.routes.js          — 2 routes to add
  DROP_IN/src/layouts/AdminLayout.jsx    — 19 module nav mappings
  phase3/hr/
    HRLeaveRulesPage.jsx
    SalaryCyclePage.jsx
  phase3/faculty/
    FacultyLeaveApplyPage.jsx
```

---

## PENDING / NEXT STEPS
- [ ] Wire `EP.bulk.*` endpoints in api.config.js (statusTemplate, promoteTemplate, demoteTemplate, sectionPromote, sectionStatus)
- [ ] Register backend routes for all Phase 1 modules in index.js
- [ ] Run `npx prisma db push` after schema finalized
- [ ] Test FacultyLeaveApplyPage — requires faculty.user_id linked to logged-in user
- [ ] AdminDashboard `/api/admins/dashboard` endpoint must return: counts, enrollments, leave, exam, fee, hr, feedback, recent.students, recent.faculty
