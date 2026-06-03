import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";


/** Build a workbook with a data sheet + an optional reference sheet */
const buildWorkbook = (dataHeaders, sampleRow, refSheet = null) => {
  const wb = xlsx.utils.book_new();

  // Main data sheet
  const ws = xlsx.utils.aoa_to_sheet([dataHeaders, sampleRow]);
  ws["!cols"] = dataHeaders.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");

  // Reference sheet (IDs for lookup)
  if (refSheet) {
    const { name, headers, rows } = refSheet;
    const refWs = xlsx.utils.aoa_to_sheet([headers, ...rows]);
    refWs["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
    xlsx.utils.book_append_sheet(wb, refWs, name);
  }

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const departmentTemplate = () =>
  buildWorkbook(["Name*"], ["Computer Science"]);

export const programTemplate = async () => {
  const depts = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return buildWorkbook(
    ["Name*", "Department ID*"],
    ["B. Tech.", depts[0]?.id || "<dept-id>"],
    {
      name: "Departments (Reference)",
      headers: ["Department ID", "Department Name"],
      rows: depts.map((d) => [d.id, d.name]),
    }
  );
};

export const courseTemplate = async () => {
  const programs = await prisma.program.findMany({
    orderBy: { name: "asc" },
    include: { department: true },
  });
  return buildWorkbook(
    ["Name*", "Program ID*"],
    ["CSE AIML", programs[0]?.id || "<program-id>"],
    {
      name: "Programs (Reference)",
      headers: ["Program ID", "Program Name", "Department"],
      rows: programs.map((p) => [p.id, p.name, p.department?.name || ""]),
    }
  );
};

export const subjectTemplate = () =>
  buildWorkbook(
    ["Name*", "Code*", "Nickname", "Category", "Credits"],
    ["Data Structures", "CS301", "DS", "THEORY", "4"]
  );

export const sectionTemplate = async () => {
  const headers = ["Name*", "Course ID*", "Semester* (1-8)", "Batch*", "Room No", "Class Coordinator ID"];
  const example = ["A", "<course-uuid>", "1", "2024-2028", "Room 101", ""];
  const ws = xlsx.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Data");
  return { buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }), filename: "sections_template.xlsx" };
};

export const sectionSubjectTemplate = async () => {
  // Fetch all sections with their course/program info and already-assigned subjects
  const sections = await prisma.section.findMany({
    include: {
      course: { select: { id: true, name: true, program: { select: { name: true, department: { select: { name: true } } } } } },
      sectionSubjects: {
        include: {
          subject: { select: { code: true, name: true } },
          faculty: { select: { user: { select: { email: true } }, name: true } },
        },
      },
    },
    orderBy: [{ course: { program: { name: "asc" } } }, { name: "asc" }, { semester: "asc" }],
  });

  // Fetch lookup data for reference sheet
  const [allSubjects, allFaculty] = await Promise.all([
    prisma.subject.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true, category: true, credits: true, nickname: true } }),
    prisma.faculty.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, emp_id: true, user: { select: { email: true } } } }),
  ]);

  const wb = xlsx.utils.book_new();
  // Sheet name: "Program Course–Sec SemX" — includes program to avoid collisions
  const usedNames = new Set();
  const safeSheet = (sec) => {
    const prog = sec.course?.program?.name || "";
    const course = sec.course?.name || "";
    const base = `${prog} ${course}–${sec.name} Sem${sec.semester}`.replace(/[\[\]:*?/\\]/g, "").trim().slice(0, 31);
    let n = base;
    if (usedNames.has(n)) { let i = 2; while (usedNames.has(n)) { const s = `(${i++})`; n = base.slice(0, 31 - s.length) + s; } }
    usedNames.add(n); return n;
  };

  // ── One sheet per section ─────────────────────────────────────────────────
  for (const sec of sections) {
    const prog = sec.course?.program?.name || "";
    const course = sec.course?.name || "";
    const dept = sec.course?.program?.department?.name || "";
    const sheetName = safeSheet(sec);

    // Header rows — full section info
    const infoRows = [
      ["SECTION SUBJECT ASSIGNMENT"],
      [`Program: ${prog}`, `Course: ${course}`, `Section: ${sec.name}`, `Sem: ${sec.semester}`, `Batch: ${sec.batch || ""}`],
      [`Dept: ${dept}`],
      [],
      // Column headers
      ["Subject Code *", "Faculty Email", "Type", "Status", "— Subject Name (auto info)", "— Faculty Name (auto info)"],
    ];

    // Pre-fill existing assignments as examples
    const dataRows = sec.sectionSubjects.length
      ? sec.sectionSubjects.map((ss) => [
        ss.subject?.code || "",
        ss.faculty?.user?.email || "",
        "REGULAR",
        "ACTIVE",
        ss.subject?.name || "",
        ss.faculty?.name || "",
      ])
      : [["", "", "REGULAR", "ACTIVE", "← enter subject code", "← enter faculty email (optional)"]];

    const ws = xlsx.utils.aoa_to_sheet([...infoRows, ...dataRows]);
    ws["!cols"] = [{ wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 24 }];
    // Style the header row (row index 4, 0-based = row 5 in Excel)
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
  }

  // ── Subject Reference sheet ───────────────────────────────────────────────
  const subHeaders = ["Subject Code", "Name", "Nickname", "Category", "Credits"];
  const subRows = allSubjects.map((s) => [s.code, s.name, s.nickname || "", s.category, s.credits]);
  const subWs = xlsx.utils.aoa_to_sheet([subHeaders, ...subRows]);
  subWs["!cols"] = [{ wch: 16 }, { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 8 }];
  xlsx.utils.book_append_sheet(wb, subWs, "Subjects (Reference)");

  // ── Faculty Reference sheet ───────────────────────────────────────────────
  const facHeaders = ["Email", "Name", "Emp ID"];
  const facRows = allFaculty.map((f) => [f.user?.email || "", f.name, f.emp_id || ""]);
  const facWs = xlsx.utils.aoa_to_sheet([facHeaders, ...facRows]);
  facWs["!cols"] = [{ wch: 36 }, { wch: 28 }, { wch: 14 }];
  xlsx.utils.book_append_sheet(wb, facWs, "Faculty (Reference)");

  // ── Instructions sheet ────────────────────────────────────────────────────
  const instrWs = xlsx.utils.aoa_to_sheet([
    ["HOW TO USE THIS TEMPLATE"],
    [],
    ["1. Each sheet = one section. Fill in Subject Code and Faculty Email columns."],
    ["2. Subject Code must match exactly — see the 'Subjects (Reference)' sheet."],
    ["3. Faculty Email is optional. Leave blank to assign subject without faculty."],
    ["4. Faculty Email must match exactly — see the 'Faculty (Reference)' sheet."],
    ["5. Type: REGULAR | ELECTIVE | COMBINED | TRAINING | OTHER (default: REGULAR)"],
    ["6. Status: ACTIVE | COMPLETED | REMOVED (default: ACTIVE)"],
    ["7. Do not rename or delete sheets. Do not change columns A-D."],
    ["8. Columns E-F (Subject Name, Faculty Name) are for reference — they are ignored on upload."],
    [],
    ["Upload via: Sections page → Bulk Assign button"],
  ]);
  instrWs["!cols"] = [{ wch: 80 }];
  xlsx.utils.book_append_sheet(wb, instrWs, "Instructions");

  return {
    buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }),
    filename: `section_subject_template_${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
};