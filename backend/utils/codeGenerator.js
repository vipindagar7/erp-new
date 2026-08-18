// backend/utils/codeGenerator.js
// ─────────────────────────────────────────────────────────────
// Human-readable code generator for all entities.
// Codes are short, unique, and usable in Excel templates.
// ─────────────────────────────────────────────────────────────
import prisma from "./prisma.js";

// ── Sanitize name to short uppercase slug ─────────────────────
const slug = (name, maxLen = 6) =>
  name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, maxLen);

// ── Ensure uniqueness by appending counter ────────────────────
const makeUnique = async (base, checkFn) => {
  let code = base;
  let i = 2;
  while (await checkFn(code)) {
    code = `${base}${i}`;
    i++;
  }
  return code;
};

// ── Department: DEPT-CA, DEPT-CS ─────────────────────────────
export const suggestDeptCode = (name) => `DEPT-${slug(name, 4)}`;

export const generateDeptCode = async (name, override = null) => {
  if (override) {
    const clean = override.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const exists = await prisma.department.findUnique({ where: { code: clean } });
    if (exists) throw Object.assign(new Error(`Code "${clean}" already taken`), { status: 409 });
    return clean;
  }
  const base = suggestDeptCode(name);
  return makeUnique(base, async (c) => !!(await prisma.department.findUnique({ where: { code: c } })));
};

// ── Program: PROG-BCA, PROG-MCA ──────────────────────────────
export const suggestProgramCode = (name) => `PROG-${slug(name, 5)}`;

export const generateProgramCode = async (name, override = null) => {
  if (override) {
    const clean = override.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const exists = await prisma.program.findUnique({ where: { code: clean } });
    if (exists) throw Object.assign(new Error(`Code "${clean}" already taken`), { status: 409 });
    return clean;
  }
  const base = suggestProgramCode(name);
  return makeUnique(base, async (c) => !!(await prisma.program.findUnique({ where: { code: c } })));
};

// ── Course: CRS-BCA1, CRS-MCA2 ───────────────────────────────
export const suggestCourseCode = (name) => `CRS-${slug(name, 5)}`;

export const generateCourseCode = async (name, override = null) => {
  if (override) {
    const clean = override.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const exists = await prisma.course.findUnique({ where: { code: clean } });
    if (exists) throw Object.assign(new Error(`Code "${clean}" already taken`), { status: 409 });
    return clean;
  }
  const base = suggestCourseCode(name);
  return makeUnique(base, async (c) => !!(await prisma.course.findUnique({ where: { code: c } })));
};

// ── Section: SEC-BCA-A, SEC-BCA-B ────────────────────────────
export const suggestSectionCode = (name) => `SEC-${slug(name, 6)}`;

export const generateSectionCode = async (name, override = null) => {
  if (override) {
    const clean = override.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const exists = await prisma.section.findUnique({ where: { code: clean } });
    if (exists) throw Object.assign(new Error(`Code "${clean}" already taken`), { status: 409 });
    return clean;
  }
  const base = suggestSectionCode(name);
  return makeUnique(base, async (c) => !!(await prisma.section.findUnique({ where: { code: c } })));
};

// ── Session: SES-2425, SES-2526 ──────────────────────────────
export const suggestSessionCode = (name) => `SES-${slug(name, 6)}`;

export const generateSessionCode = async (name, override = null) => {
  if (override) {
    const clean = override.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const exists = await prisma.academicSession.findUnique({ where: { code: clean } });
    if (exists) throw Object.assign(new Error(`Code "${clean}" already taken`), { status: 409 });
    return clean;
  }
  const base = suggestSessionCode(name);
  return makeUnique(base, async (c) => !!(await prisma.academicSession.findUnique({ where: { code: c } })));
};

// ── Student: STU-00001 ────────────────────────────────────────
export const generateStudentCode = async () => {
  const count = await prisma.student.count();
  const base = `STU-${String(count + 1).padStart(5, "0")}`;
  return makeUnique(base, async (c) => !!(await prisma.student.findUnique({ where: { code: c } })));
};

// ── Resolve any entity by code or UUID ───────────────────────
// Used in Excel uploads where user provides code instead of UUID
export const resolveByCodeOrId = async (model, value) => {
  if (!value) return null;

  // Try UUID pattern first
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return prisma[model].findUnique({ where: { id: value } });
  }

  // Otherwise treat as code
  return prisma[model].findUnique({ where: { code: value.toUpperCase() } });
};

// ── Resolve section by code, name, or UUID ───────────────────
export const resolveSection = async (value) => {
  if (!value) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return prisma.section.findUnique({ where: { id: value } });
  }
  // Try code
  const byCode = await prisma.section.findUnique({ where: { code: value.toUpperCase() } });
  if (byCode) return byCode;
  // Try name
  return prisma.section.findFirst({ where: { name: { equals: value, mode: "insensitive" } } });
};

// ── Resolve student by code, email, or roll_no ───────────────
export const resolveStudent = async (value) => {
  if (!value) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return prisma.student.findUnique({ where: { id: value } });
  }
  if (value.toUpperCase().startsWith("STU-")) {
    return prisma.student.findUnique({ where: { code: value.toUpperCase() } });
  }
  if (value.includes("@")) {
    const user = await prisma.user.findUnique({ where: { email: value.toLowerCase() }, include: { student: true } });
    return user?.student || null;
  }
  // Try roll_no
  return prisma.student.findUnique({ where: { roll_no: value } });
};
