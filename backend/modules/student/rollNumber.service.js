// backend/modules/student/rollNumber.service.js
import prisma from "../../utils/prisma.js";
import { getSetting } from "../erpSettings/erp.settings.service.js";

// Department/Course models have no dedicated `code` field — derive
// a short uppercase code from the name (first letters of each word,
// max 4 chars) as a stable fallback. e.g. "Computer Science" -> "CS",
// "Bachelor of Computer Applications" -> "BCOA".
const deriveCode = (name) => {
  if (!name) return "GEN";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
};

// ── Generate the next university roll number per the configured format ──
// Tokens supported: {YEAR}, {DEPT}, {COURSE}, {SEQ:N}
export const generateUniversityRollNumber = async ({ admission_year, dept_id, course_id }) => {
  const format = (await getSetting("university_roll_format")) || "{YEAR}{DEPT}{SEQ:5}";
  const resetMode = (await getSetting("university_roll_seq_reset")) || "yearly";

  const [dept, course] = await Promise.all([
    dept_id ? prisma.department.findUnique({ where: { id: dept_id }, select: { name: true } }) : null,
    course_id ? prisma.course.findUnique({ where: { id: course_id }, select: { name: true } }) : null,
  ]);

  const deptCode = deriveCode(dept?.name);
  const courseCode = deriveCode(course?.name);
  const year = admission_year || new Date().getFullYear();

  const seqWhere = resetMode === "yearly" ? { admission_year: year } : {};
  const count = await prisma.student.count({
    where: { ...seqWhere, university_roll_no: { not: null } },
  });
  const nextSeq = count + 1;

  let result = format
    .replace("{YEAR}", String(year))
    .replace("{DEPT}", deptCode)
    .replace("{COURSE}", courseCode);

  const seqMatch = result.match(/\{SEQ:(\d+)\}/);
  if (seqMatch) {
    const padLength = parseInt(seqMatch[1], 10);
    result = result.replace(seqMatch[0], String(nextSeq).padStart(padLength, "0"));
  }

  let candidate = result;
  let suffix = 0;
  while (await prisma.student.findUnique({ where: { university_roll_no: candidate } })) {
    suffix += 1;
    candidate = `${result}-${suffix}`;
  }

  return candidate;
};
