// backend/modules/reports/reports.controller.js
import {
  buildStudentsBySectionWorkbook,
  buildStudentsByDeptWorkbook,
  buildFacultyWorkbook,
  buildEnrollmentWorkbook,
  buildFeedbackWorkbook,
} from "./reports.service.js";

const sendXlsx = async (res, workbook, filename) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

export const exportStudentsBySection = async (req, res) => {
  try {
    const { section_id } = req.query;
    const wb = await buildStudentsBySectionWorkbook(section_id);
    await sendXlsx(res, wb, "students_by_section.xlsx");
  } catch (error) {
    console.error("[Reports] exportStudentsBySection:", error);
    res.status(500).json({ message: "Export failed" });
  }
};

export const exportStudentsByDept = async (req, res) => {
  try {
    const { dept_id } = req.query;
    const wb = await buildStudentsByDeptWorkbook(dept_id);
    await sendXlsx(res, wb, "students_by_department.xlsx");
  } catch (error) {
    console.error("[Reports] exportStudentsByDept:", error);
    res.status(500).json({ message: "Export failed" });
  }
};

export const exportFacultyList = async (req, res) => {
  try {
    const wb = await buildFacultyWorkbook();
    await sendXlsx(res, wb, "faculty_list.xlsx");
  } catch (error) {
    console.error("[Reports] exportFacultyList:", error);
    res.status(500).json({ message: "Export failed" });
  }
};

export const exportEnrollmentSummary = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const wb = await buildEnrollmentWorkbook(academic_year);
    await sendXlsx(res, wb, "enrollment_summary.xlsx");
  } catch (error) {
    console.error("[Reports] exportEnrollmentSummary:", error);
    res.status(500).json({ message: "Export failed" });
  }
};

export const exportFeedbackSummary = async (req, res) => {
  try {
    const { formId } = req.params;
    const wb = await buildFeedbackWorkbook(formId);
    if (!wb) return res.status(404).json({ message: "Feedback form not found" });
    await sendXlsx(res, wb, `feedback_${formId}.xlsx`);
  } catch (error) {
    console.error("[Reports] exportFeedbackSummary:", error);
    res.status(500).json({ message: "Export failed" });
  }
};
