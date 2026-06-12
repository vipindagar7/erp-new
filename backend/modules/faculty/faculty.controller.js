// backend/modules/faculty/faculty.controller.js
import * as facultyService from "./faculty.service.js";
import { logExportEvent } from "../../middlewares/audit.middleware.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadMiddleware = upload.single("photo");

// ── CRUD ──────────────────────────────────────────────────────
export async function getAll(req, res) {
  try {
    const { page = 1, limit = 20, search, dept_id, designation, employee_type, gender, status } = req.query;
    const result = await facultyService.getAllFaculty({ page: Number(page), limit: Number(limit), search, dept_id, designation, employee_type, gender, status });
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

export async function getOne(req, res) {
  try {
    const data = await facultyService.getFacultyById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

export async function getMe(req, res) {
  try {
    const faculty = await facultyService.getFacultyByUserId(req.user.id);
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty profile not found" });
    res.json({ success: true, data: faculty });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

export async function create(req, res) {
  try {
    const data = await facultyService.createFaculty(req.validatedData ?? req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

export async function update(req, res) {
  try {
    const data = await facultyService.updateFaculty(req.params.id, req.validatedData ?? req.body);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

export async function remove(req, res) {
  try {
    await facultyService.deleteFaculty(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

export async function restore(req, res) {
  try {
    const data = await facultyService.restoreFaculty(req.params.id);
    res.json({ success: true, data });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

export async function block(req, res) {
  try {
    const data = await facultyService.toggleFacultyBlock(req.params.id);
    res.json({ success: true, data });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

export async function assignSubjects(req, res) {
  try {
    const data = await facultyService.assignSubjects(req.params.id, req.body?.subject_ids || []);
    res.json({ success: true, data });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

// ── Photo upload ──────────────────────────────────────────────
export async function uploadPhoto(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const data = await facultyService.uploadFacultyPhoto(req.params.id, req.file);
    res.json({ success: true, data: { photo_url: data.photo_url } });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

// ── Sensitive data (require OTP action token) ─────────────────
export async function getSalary(req, res) {
  try {
    const actionToken = req.headers["x-action-token"];
    const data = await facultyService.getFacultySalary(req.params.id, req.user.id, actionToken);
    res.json({ success: true, data });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
}

export async function getBankDetails(req, res) {
  try {
    const actionToken = req.headers["x-action-token"];
    const data = await facultyService.getFacultyBank(req.params.id, req.user.id, actionToken);
    res.json({ success: true, data });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
}

// ── Analytics ─────────────────────────────────────────────────
export async function getAnalytics(req, res) {
  try {
    const data = await facultyService.getFacultyAnalytics();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// ── Export ────────────────────────────────────────────────────
export async function exportAdvanced(req, res) {
  try {
    await logExportEvent(req, "faculty", req.query);
    const buffer = await facultyService.exportFacultyAdvanced(req.query);
    const filename = `faculty-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

export async function exportBasic(req, res) {
  try {
    const buffer = await facultyService.exportFacultyReport();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="faculty.xlsx"');
    res.send(buffer);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// ── Bulk upload ───────────────────────────────────────────────
export async function bulkUpload(req, res) {
  try {
    const result = await facultyService.bulkUploadFaculty(req.file?.buffer, req.user);
    res.json({ success: true, data: result });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
}

export async function getTemplate(req, res) {
  try {
    const buffer = await facultyService.getFacultyTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="faculty-template.xlsx"');
    res.send(buffer);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

// ── PDF ID Card ───────────────────────────────────────────────
export async function getIdCardPdf(req, res) {
  try {
    const faculty = await facultyService.getFacultyById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: "Not found" });

    // Generate PDF using pdfkit
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: [242, 153], margin: 10 }); // CR80 card size in points

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="ID-${faculty.emp_id || faculty.id}.pdf"`);
    doc.pipe(res);

    // Background
    doc.rect(0, 0, 242, 153).fill("#1e1b4b");

    // Header bar
    doc.rect(0, 0, 242, 30).fill("rgba(255,255,255,0.1)");
    doc.fillColor("white").fontSize(7).font("Helvetica-Bold")
      .text("ECHELON INSTITUTE OF TECHNOLOGY", 10, 8);
    doc.fillColor("rgba(255,255,255,0.7)").fontSize(5).font("Helvetica")
      .text("Faridabad, Haryana", 10, 18);

    // FACULTY badge
    doc.fillColor("rgba(255,255,255,0.3)").rect(195, 6, 38, 12).fill();
    doc.fillColor("white").fontSize(6).font("Helvetica-Bold").text("FACULTY", 197, 10);

    // Photo placeholder
    doc.rect(10, 38, 45, 58).fill("rgba(255,255,255,0.1)").stroke("rgba(255,255,255,0.3)");
    if (!faculty.photo_url) {
      doc.fillColor("rgba(255,255,255,0.4)").fontSize(18).text("👤", 20, 52);
    }

    // Details
    doc.fillColor("white").fontSize(9).font("Helvetica-Bold").text(faculty.name, 62, 40, { width: 170 });
    doc.fillColor("rgba(255,255,255,0.8)").fontSize(7).font("Helvetica")
      .text(faculty.designation || "Faculty", 62, 53)
      .text(faculty.department?.name || "", 62, 62);

    doc.fillColor("rgba(255,255,255,0.6)").fontSize(6)
      .text(`EMP ID: ${faculty.emp_id || "—"}`, 62, 75)
      .text(`Valid Until: Mar ${new Date().getFullYear() + 1}`, 62, 84);

    // Bottom bar
    doc.rect(0, 138, 242, 15).fill("rgba(0,0,0,0.4)");
    doc.fillColor("rgba(255,255,255,0.5)").fontSize(5)
      .text("If found, return to EIT Faridabad | www.eitfaridabad.ac.in", 10, 142);

    doc.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}