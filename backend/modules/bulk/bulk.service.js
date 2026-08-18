// backend/modules/bulk/bulk.service.js
// Phase G — All bulk operations for students
// Promote/demote/status individually + via section + via Excel template
import prisma from "../../utils/prisma.js";
import xlsx from "xlsx";
import { changeStudentStatus, promoteStudent, demoteStudent, promoteSectionStudents, bulkStatusChangeBySection, changeStudentSection } from "../student/student.service.js";

// ── Template: Status Change ───────────────────────────────────
export const getStatusChangeTemplate = async () => {
  const wb = xlsx.utils.book_new();
  const HEADERS = ["identifier*", "identifier_type (roll_no|student_id|enrollment_no)", "new_status*", "reason"];
  const VALID = ["ACTIVE", "DETAINED", "ON_HOLD", "PASSED", "LEFT", "TRANSFERRED", "SUSPENDED"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ["22001001", "roll_no", "DETAINED", "Failed in Back exam"],
    ["22001002", "roll_no", "ACTIVE", "Fee cleared"],
    ["22001003", "student_id", "LEFT", "TC issued"],
  ]);
  ws["!cols"] = [{ wch: 20 }, { wch: 42 }, { wch: 14 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(wb, ws, "Status Changes");
  const wsRef = xlsx.utils.aoa_to_sheet([["Valid Status Values"], ...VALID.map((s) => [s])]);
  xlsx.utils.book_append_sheet(wb, wsRef, "Valid Statuses");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Bulk Status Change via Template ──────────────────────────
export const bulkStatusViaTemplate = async (buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Status Changes"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const VALID = ["ACTIVE", "DETAINED", "ON_HOLD", "PASSED", "LEFT", "TRANSFERRED", "SUSPENDED"];
  const results = { updated: [], failed: [], skipped: [], total: 0 };

  const dataRows = rows.filter((r) => String(r["identifier*"] || "").trim());
  results.total = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowLabel = `Row ${i + 2}`;
    const identifier = String(row["identifier*"] || "").trim();
    const identifierType = String(row["identifier_type (roll_no|student_id|enrollment_no)"] || "roll_no").trim();
    const newStatus = String(row["new_status*"] || "").trim().toUpperCase();
    const reason = String(row["reason"] || "").trim() || null;

    if (!identifier || !newStatus) { results.failed.push({ row: rowLabel, reason: "identifier and new_status required" }); continue; }
    if (!VALID.includes(newStatus)) { results.failed.push({ row: rowLabel, reason: `Invalid status: "${newStatus}". Valid: ${VALID.join(", ")}` }); continue; }

    try {
      const where = identifierType === "student_id" ? { id: identifier }
        : identifierType === "enrollment_no" ? { enrollment_no: identifier }
          : { roll_no: identifier };
      const student = await prisma.student.findFirst({ where, select: { id: true, name: true, roll_no: true, status: true } });
      if (!student) { results.failed.push({ row: rowLabel, reason: `Student not found: "${identifier}"` }); continue; }
      if (student.status === newStatus) { results.skipped.push({ row: rowLabel, name: student.name, roll_no: student.roll_no, reason: `Already ${newStatus}` }); continue; }

      await changeStudentStatus(student.id, newStatus, reason, actingUser);
      results.updated.push({ row: rowLabel, name: student.name, roll_no: student.roll_no, from: student.status, to: newStatus });
    } catch (err) { results.failed.push({ row: rowLabel, reason: err.message }); }
  }
  return results;
};

// ── Template: Promotion ───────────────────────────────────────
export const getPromotionTemplate = async () => {
  const branches = await prisma.branch.findMany({ where: { deleted_at: null }, select: { code: true, name: true, program: { select: { name: true } } }, take: 5 });
  const sections = await prisma.section.findMany({ where: { deleted_at: null, status: "ACTIVE" }, select: { code: true, name: true, semester: true, batch: true, branch: { select: { code: true } } }, take: 20, orderBy: [{ branch_id: "asc" }, { semester: "asc" }] });

  const wb = xlsx.utils.book_new();
  const HEADERS = ["roll_no_or_student_id*", "to_section_code*", "reason"];
  const ws = xlsx.utils.aoa_to_sheet([
    HEADERS,
    ["22001001", sections[1]?.code || "BTECH-CSE-S3-A", "End of semester promotion"],
    ["22001002", sections[1]?.code || "BTECH-CSE-S3-A", ""],
  ]);
  ws["!cols"] = [{ wch: 22 }, { wch: 24 }, { wch: 36 }];
  xlsx.utils.book_append_sheet(wb, ws, "Promotions");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([["section_code", "section_name", "semester", "batch", "branch_code"], ...sections.map((s) => [s.code, s.name, s.semester, s.batch, s.branch?.code])]), "Available Sections");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Bulk Promote via Template ─────────────────────────────────
export const bulkPromoteViaTemplate = async (buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Promotions"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { promoted: [], failed: [], skipped: [], total: 0 };

  const allSections = await prisma.section.findMany({ where: { deleted_at: null }, select: { id: true, code: true, semester: true } });
  const sectionMap = Object.fromEntries(allSections.map((s) => [s.code.toUpperCase(), s]));

  const dataRows = rows.filter((r) => String(r["roll_no_or_student_id*"] || "").trim());
  results.total = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowLabel = `Row ${i + 2}`;
    const identifier = String(row["roll_no_or_student_id*"] || "").trim();
    const sectCode = String(row["to_section_code*"] || "").trim().toUpperCase();
    const reason = String(row["reason"] || "").trim() || null;

    if (!identifier || !sectCode) { results.failed.push({ row: rowLabel, reason: "identifier and to_section_code required" }); continue; }
    const toSection = sectionMap[sectCode];
    if (!toSection) { results.failed.push({ row: rowLabel, reason: `Section not found: "${sectCode}"` }); continue; }

    try {
      const student = await prisma.student.findFirst({
        where: { OR: [{ roll_no: identifier }, { id: identifier }, { enrollment_no: identifier }] },
        select: { id: true, name: true, roll_no: true, status: true },
      });
      if (!student) { results.failed.push({ row: rowLabel, reason: `Student not found: "${identifier}"` }); continue; }
      if (student.status === "DETAINED") { results.skipped.push({ row: rowLabel, name: student.name, roll_no: student.roll_no, reason: "DETAINED — handle manually" }); continue; }

      await changeStudentSection(student.id, toSection.id, actingUser);
      results.promoted.push({ row: rowLabel, name: student.name, roll_no: student.roll_no, to_section: sectCode, semester: toSection.semester });
    } catch (err) { results.failed.push({ row: rowLabel, reason: err.message }); }
  }
  return results;
};

// ── Template: Demotion ────────────────────────────────────────
export const getDemotionTemplate = async () => {
  const sections = await prisma.section.findMany({ where: { deleted_at: null, status: "ACTIVE" }, select: { code: true, name: true, semester: true, batch: true }, take: 20, orderBy: { semester: "asc" } });
  const wb = xlsx.utils.book_new();
  const HEADERS = ["roll_no_or_student_id*", "to_section_code*", "reason*"];
  const ws = xlsx.utils.aoa_to_sheet([HEADERS, ["22001001", sections[0]?.code || "BTECH-CSE-S1-A", "Failed in back exam"]]);
  ws["!cols"] = [{ wch: 22 }, { wch: 24 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(wb, ws, "Demotions");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([["section_code", "section_name", "semester", "batch"], ...sections.map((s) => [s.code, s.name, s.semester, s.batch])]), "Available Sections");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ── Bulk Demote via Template ──────────────────────────────────
export const bulkDemoteViaTemplate = async (buffer, actingUser = {}) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Demotions"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { demoted: [], failed: [], total: 0 };

  const allSections = await prisma.section.findMany({ where: { deleted_at: null }, select: { id: true, code: true, semester: true } });
  const sectionMap = Object.fromEntries(allSections.map((s) => [s.code.toUpperCase(), s]));

  const dataRows = rows.filter((r) => String(r["roll_no_or_student_id*"] || "").trim());
  results.total = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowLabel = `Row ${i + 2}`;
    const identifier = String(row["roll_no_or_student_id*"] || "").trim();
    const sectCode = String(row["to_section_code*"] || "").trim().toUpperCase();
    const reason = String(row["reason*"] || "").trim() || null;

    if (!identifier || !sectCode || !reason) { results.failed.push({ row: rowLabel, reason: "identifier, to_section_code, and reason all required" }); continue; }
    const toSection = sectionMap[sectCode];
    if (!toSection) { results.failed.push({ row: rowLabel, reason: `Section not found: "${sectCode}"` }); continue; }

    try {
      const student = await prisma.student.findFirst({ where: { OR: [{ roll_no: identifier }, { id: identifier }, { enrollment_no: identifier }] }, select: { id: true, name: true, roll_no: true } });
      if (!student) { results.failed.push({ row: rowLabel, reason: `Student not found: "${identifier}"` }); continue; }
      await changeStudentSection(student.id, toSection.id, actingUser);
      results.demoted.push({ row: rowLabel, name: student.name, roll_no: student.roll_no, to_section: sectCode, semester: toSection.semester });
    } catch (err) { results.failed.push({ row: rowLabel, reason: err.message }); }
  }
  return results;
};

// ── Section-based: Promote All ────────────────────────────────
export const promoteSectionBulk = (from_section_id, to_section_id, reason, actingUser) =>
  promoteSectionStudents(from_section_id, to_section_id, reason, actingUser);

// ── Section-based: Bulk Status ────────────────────────────────
export const sectionBulkStatus = (section_id, status, reason, actingUser) =>
  bulkStatusChangeBySection(section_id, status, reason, actingUser);

// ── Result export (download results as Excel) ─────────────────
export const exportBulkResults = (results, sheetName = "Results") => {
  const rows = [
    ...(results.promoted || results.updated || results.demoted || []).map((r) => ({ ...r, result: "SUCCESS" })),
    ...(results.skipped || []).map((r) => ({ ...r, result: "SKIPPED" })),
    ...(results.failed || []).map((r) => ({ ...r, result: "FAILED" })),
  ];
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }));
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};