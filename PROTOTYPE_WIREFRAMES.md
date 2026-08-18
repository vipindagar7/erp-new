# EIT ERP V3 — PROTOTYPE WIREFRAMES
# (Text-based layout reference before build)

═══════════════════════════════════════
STUDENT SKILL CARD — based on PDF
═══════════════════════════════════════

Page: /admin/students/:id/skill-card
Also: /student/skill-card (student portal, own only)

Layout:
┌─────────────────────────────────────────────────┐
│ ECHELON INSTITUTE OF TECHNOLOGY   [LOGO]        │
│ Student Skill Card — B.Tech CSE 2026 Odd Sem    │
├──────────────────┬──────────────────────────────┤
│ Name: __________ │ Roll No: ___________         │
│ Batch: _________ │ Branch: CSE Core             │
│ Domain Track: __ │ Card Issue Date: ___         │
│                  │ [Student Photo]              │
├──────────────────┴──────────────────────────────┤
│ YEAR 1 — Foundation Building                    │
│ ┌────┬──────────────────┬──────────┬───────┬───┐│
│ │ #  │ Training/Course  │ Provider │ Hours │ ✓ ││
│ ├────┼──────────────────┼──────────┼───────┼───┤│
│ │ 1  │ Sem 1 Offline... │Institute │ 30hrs │ ✓ ││
│ │ 2  │ MS365 Workshop   │Microsoft │ 1 day │   ││
│ │... │                  │          │       │   ││
│ └────┴──────────────────┴──────────┴───────┴───┘│
│ YEAR 2 — Programming Core          [same table] │
│ YEAR 3 — Technical Depth           [same table] │
│ YEAR 4 — Cloud + Placement         [same table] │
├─────────────────────────────────────────────────┤
│ Summary:  Total: 62 | Done: X | Pending: Y      │
│ Placement Status: Foundational/Job-Ready/Ready  │
└─────────────────────────────────────────────────┘

Actions: [Download PDF] [Mark Complete] [Verify]

Admin can bulk-generate for all students via template.
Mentor can update completion per assigned students.

═══════════════════════════════════════
ACADEMIC CALENDAR — based on PDF
═══════════════════════════════════════

Page: /admin/academic/calendar

Layout:
┌─────────────────────────────────────────────────┐
│ Academic Calendar AY 2025-26  [Add Event][Export]│
│ Session: [ODD SEM ▼] [Even Sem ▼]              │
│ View: [Week▼] [Month▼] [List▼]                  │
├─────────────────────────────────────────────────┤
│ Week │ Month │ Mon  Tue  Wed  Thu  Fri  Sat  Sun │
│  1   │  JAN  │  12   13   14   15   16   17   18 │
│      │       │  [CLASS START]              [H]  │
│  2   │       │  19   20   21   22   23   24   25 │
│      │       │            [SESSIONAL]  [H]  [S]  │
├─────────────────────────────────────────────────┤
│ Legend: [CLASS][HOLIDAY][OFF SAT][SESSIONAL]    │
│         [PTM][FEST][EXAM][PRACTICAL][LAST DAY]  │
├─────────────────────────────────────────────────┤
│ Events this week:                               │
│ • 12 Jan — Commencement of Classes             │
│ • 23 Jan — Basant Panchami (Holiday)            │
│ • 26 Jan — Republic Day (Holiday)              │
└─────────────────────────────────────────────────┘

Event types (from PDF):
- COMMENCEMENT, HOLIDAY, OFF_SATURDAY, FEST_WEEK
- PTM, SESSIONAL_TEST, SESSIONAL_MARKS_DISPLAY  
- ATTENDANCE_ELIGIBILITY_DISPLAY, PRE_UNIVERSITY
- LAST_TEACHING_DAY, UNIVERSITY_PRACTICAL
- UNIVERSITY_THEORY_EXAM (tentative)
- CLASS_TEST, INTERNAL_PRACTICAL

Color coding same as PDF.
Bulk add events via Excel template.
Export to PDF (matches institute format).

═══════════════════════════════════════
STUDENT ANALYTICS PAGE
═══════════════════════════════════════

Page: /admin/students/:id/analytics

┌─────────────────────────────────────────────────┐
│ [← Back] Rahul Sharma — Analytics              │
│ Roll: 22CSE001 | Sec: A | Sem 4 | CSE           │
├──────────┬──────────┬──────────┬────────────────┤
│ Attend % │ CGPA     │ Leave    │ Trainings      │
│   72.5%  │  8.4     │  3 used  │  4/8 done      │
│ ⚠ Below  │ ↑ Good   │          │ 2 pending      │
├──────────┴──────────┴──────────┴────────────────┤
│ ATTENDANCE (Subject-wise)                       │
│ DSA         ████████░░ 78%  (2 absent)         │
│ DBMS        ██████░░░░ 62% ⚠️ (5 absent)       │
│ OS          █████████░ 88%  (1 absent)         │
│ [Classes needed for 75%: 3 in DBMS]            │
├─────────────────────────────────────────────────┤
│ MARKS (Sessional-wise)                          │
│ Subject │ CT1 │ CT2 │ Mid │ Pre-U │ Grade      │
│ DSA     │ 18  │ 20  │ 35  │ —     │ B+         │
│ DBMS    │ 12  │ 15  │ 28  │ —     │ C          │
├─────────────────────────────────────────────────┤
│ TRAINING & SKILL CARD                           │
│ Sem 1: ✓ Completed  Sem 2: ✓  Sem 3: ⚠ Partial│
│ Certifications: [IBM AI][Oracle SQL][MS Azure]  │
├─────────────────────────────────────────────────┤
│ LEAVE HISTORY                                   │
│ 3 leaves used | 2 pending approval             │
│ Last leave: 15 Jan (Medical) — APPROVED        │
├─────────────────────────────────────────────────┤
│ ASSIGNMENTS                                     │
│ Submitted: 8/10 | Avg Grade: B+                │
│ Pending: [DSA Assignment 3] [DBMS Lab Report]  │
├─────────────────────────────────────────────────┤
│ FEES                                            │
│ Total: ₹85,000 | Paid: ₹42,500 | Due: ₹42,500 │
│ Next installment: 1 Feb                        │
└─────────────────────────────────────────────────┘

═══════════════════════════════════════
EXAM MODULE
═══════════════════════════════════════

ExamHubPage: /admin/exam
┌─────────────────────────────────────────────────┐
│ EXAM MODULE  [Create Exam][Datesheet][Seating]  │
├──────────┬──────────┬──────────┬────────────────┤
│ Total    │ Active   │ Results  │ Hall Tickets   │
│ 12 exams │ 3 active │ 5 done   │ 890 generated  │
├─────────────────────────────────────────────────┤
│ Upcoming: Internal-2 | 24 Sep | 6 subjects     │
│ Seating: Auto-generated for 3 halls            │
├─────────────────────────────────────────────────┤
│ [Sessional Test-1] [Sessional Test-2] [Mid Term]│
│ [Pre-University] [University Theory] [Practical]│
└─────────────────────────────────────────────────┘

ExamDatesheetPage:
┌─────────────────────────────────────────────────┐
│ Auto-Generate Datesheet  [Generate] [Export PDF]│
├───────┬──────────┬────────┬──────────┬──────────┤
│ Date  │ Subject  │ Time   │ Duration │ Branches │
│ 24Sep │ DSA      │ 10am   │ 3hrs     │ CSE,IT   │
│ 25Sep │ DBMS     │ 10am   │ 3hrs     │ CSE      │
│ 26Sep │ OS       │ 10am   │ 3hrs     │ CSE,IT   │
└───────┴──────────┴────────┴──────────┴──────────┘
[Add Row] [Auto-fill from Academic Calendar]

ExamSeatingPage:
┌─────────────────────────────────────────────────┐
│ Seating Plan — DSA | 24 Sep 2025               │
│ [Auto-Generate] [Download PDF] [Manual Override]│
├─────────────────────────────────────────────────┤
│ Hall A (50 seats)  Hall B (40 seats)            │
│ ┌────────────┐     ┌────────────┐              │
│ │Roll  Seat  │     │Roll  Seat  │              │
│ │22CSE001 A1 │     │22IT001  B1 │              │
│ │22CSE002 A2 │     │22IT002  B2 │              │
│ └────────────┘     └────────────┘              │
│ Mix branches in same hall ✓                    │
└─────────────────────────────────────────────────┘

HallTicketPage:
┌─────────────────────────────────────────────────┐
│ [EIT LOGO]  ECHELON INSTITUTE OF TECHNOLOGY    │
│ HALL TICKET — Sessional Test 1 (2025-26)        │
├──────────────────────┬──────────────────────────┤
│ Name: Rahul Sharma   │ [Photo]                 │
│ Roll: 22CSE001       │                         │
│ Branch: CSE | Sem 4  │                         │
├──────────────────────┴──────────────────────────┤
│ Date      │ Subject │ Time  │ Hall │ Seat       │
│ 24 Sep    │ DSA     │ 10am  │ A    │ A-15       │
│ 25 Sep    │ DBMS    │ 10am  │ A    │ A-15       │
├─────────────────────────────────────────────────┤
│ Instructions: ...                               │
│ Controller Signature: _______                   │
└─────────────────────────────────────────────────┘
[Generate All] [Download PDF] [Bulk Download ZIP]

═══════════════════════════════════════
HR MODULE
═══════════════════════════════════════

SalarySlipPage (faculty view):
┌─────────────────────────────────────────────────┐
│ My Salary Slips  [July 2025 ▼] [Download PDF]  │
├─────────────────────────────────────────────────┤
│ ECHELON INSTITUTE OF TECHNOLOGY                │
│ Salary Slip — July 2025                        │
│ Dr. Rajesh Sharma | EIT-FAC-001 | Prof.        │
├──────────────────────┬──────────────────────────┤
│ EARNINGS             │ DEDUCTIONS               │
│ Basic:    45,000     │ PF:        5,400         │
│ HRA:      18,000     │ ESI:         750         │
│ DA:        9,000     │ TDS:       4,500         │
│ TA:        3,000     │ Prof Tax:    200         │
│           ─────      │           ──────         │
│ Gross:   75,000      │ Total:    10,850         │
├──────────────────────┴──────────────────────────┤
│ NET SALARY: ₹64,150                            │
│ In Words: Sixty Four Thousand One Fifty Only   │
│ Status: APPROVED ✓                             │
└─────────────────────────────────────────────────┘

═══════════════════════════════════════
STUDENT FEE MODULE
═══════════════════════════════════════

FeeStudentViewPage (student portal):
┌─────────────────────────────────────────────────┐
│ My Fee Status — AY 2025-26                     │
├─────────────────────────────────────────────────┤
│ Total Fee: ₹85,000                             │
│ Paid:      ₹42,500  ████████░░░░ 50%           │
│ Pending:   ₹42,500                             │
├─────────────────────────────────────────────────┤
│ Installment │ Amount  │ Due Date │ Status       │
│ 1st         │ ₹42,500 │ 15 Jul   │ ✓ PAID      │
│ 2nd         │ ₹42,500 │ 1 Feb    │ ⚠ PENDING   │
├─────────────────────────────────────────────────┤
│ Scholarship: MERIT 10% = ₹8,500 APPLIED       │
│ [Download Receipt]                             │
└─────────────────────────────────────────────────┘

═══════════════════════════════════════
ASSIGNMENT MODULE
═══════════════════════════════════════

AssignmentCreatePage (faculty):
┌─────────────────────────────────────────────────┐
│ Create Assignment                               │
│ Title: _____________ Subject: [DSA ▼]          │
│ Section: [CSE-A ▼] [CSE-B ▼] (multiselect)    │
│ Deadline: [Date] [Time]                        │
│ Total Marks: ___  Late Penalty: ___% per day   │
│ Max Late: ___ days                             │
│ Type: [○ File Upload ○ Text ○ Both]            │
│ Plagiarism Check: [✓ Enable]                   │
│ Instructions: [text area]                       │
│                              [Save as Draft]    │
│                              [Publish]          │
└─────────────────────────────────────────────────┘

AssignmentSubmitPage (student portal):
┌─────────────────────────────────────────────────┐
│ DSA Assignment 3 — Due: 25 Jan 10:00 PM        │
│ ⏰ Time remaining: 2 days 4 hours              │
│ [Drag & drop file OR type answer below]        │
│ [Upload File] [.pdf .doc .zip ≤20MB]           │
│ ─── OR ───────────────────────────────────────  │
│ [Text area for written answer]                  │
│                              [Submit]           │
│ ⚠ Late submissions lose 5% per day             │
└─────────────────────────────────────────────────┘
