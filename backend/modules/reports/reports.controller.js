// backend/modules/reports/reports.controller.js
import * as svc from "./reports.service.js";

const sendXlsx = (res, buf, name) => {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition",`attachment; filename="${name}"`);
  res.setHeader("Content-Length", b.length);
  res.end(b);
};
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success:false, message:e.message })
  : next(e);

// ── Catalog — list all available reports ─────────────────────
export const getCatalog = (req, res) => {
  res.json({ success:true, data: svc.REPORT_CATALOG });
};

// ── Generic dispatcher ───────────────────────────────────────
export const generate = async (req, res, next) => {
  try {
    const { report_id } = req.params;
    const filters = { ...req.query, ...req.body };
    const buf = await svc.generateReport(report_id, filters);
    const name = `${report_id}-${new Date().toISOString().slice(0,10)}.xlsx`;
    sendXlsx(res, buf, name);
  } catch(e) { fail(res,e,next); }
};

// ── Legacy individual endpoints ──────────────────────────────
export const studentsAll      = async (req, res, next) => { try { sendXlsx(res, await svc.buildStudentsAllReport(req.query),     `students-all-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };
export const studentsBySection= async (req, res, next) => { try { sendXlsx(res, await svc.buildStudentsBySectionReport(req.query),`students-section-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };
export const studentsByDept   = async (req, res, next) => { try { sendXlsx(res, await svc.buildStudentsByDeptReport(req.query),  `students-dept-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };
export const facultyAll       = async (req, res, next) => { try { sendXlsx(res, await svc.buildFacultyAllReport(req.query),      `faculty-all-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };
export const facultyWorkload  = async (req, res, next) => { try { sendXlsx(res, await svc.buildFacultyWorkloadReport(req.query), `faculty-workload-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };
export const sectionsAll      = async (req, res, next) => { try { sendXlsx(res, await svc.buildSectionsReport(req.query),        `sections-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };
export const sectionSubjects  = async (req, res, next) => { try { sendXlsx(res, await svc.buildSectionSubjectReport(req.query),  `section-subjects-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };
export const enrollments      = async (req, res, next) => { try { sendXlsx(res, await svc.buildEnrollmentReport(req.query),      `enrollments-${new Date().toISOString().slice(0,10)}.xlsx`); } catch(e) { fail(res,e,next); } };