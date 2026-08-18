// backend/utils/pdfReport.js
import PDFDocument from "pdfkit";

// ── Generate a simple student summary report as a PDF buffer ─────
export const generateStudentReportPdf = (student) =>
    new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on("data", (c) => chunks.push(c));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        doc.fontSize(20).text("Student Report", { align: "center" });
        doc.moveDown();

        doc.fontSize(14).text(student.name);
        doc.fontSize(10).fillColor("#666").text(student.roll_no || student.enrollment_no || "—");
        doc.moveDown();

        const row = (label, value) => {
            doc.fontSize(11).fillColor("#000").text(`${label}: `, { continued: true }).fillColor("#333").text(value ?? "—");
        };

        row("Email", student.user?.email);
        row("Department", student.department?.name);
        row("Program", student.program?.name);
        row("Course", student.course?.name);
        row("Section", student.section?.name);
        row("Semester", student.section?.semester);
        row("Status", student.status);
        row("Father's Name", student.father_name);
        row("Mother's Name", student.mother_name);
        row("Phone", student.phone);
        row("Address", [student.address, student.city, student.state, student.pincode].filter(Boolean).join(", "));

        doc.moveDown();
        doc.fontSize(13).text("Enrollment History");
        doc.moveDown(0.5);
        (student.enrollments || []).forEach((e) => {
            doc.fontSize(10).fillColor("#333").text(
                `${e.academic_year} · Sem ${e.semester} · ${e.section?.name || "—"} · ${e.status}`
            );
        });

        if (student.specialGroupMembers?.length) {
            doc.moveDown();
            doc.fontSize(13).fillColor("#000").text("Special Groups");
            doc.moveDown(0.5);
            student.specialGroupMembers.forEach((m) => {
                doc.fontSize(10).fillColor("#333").text(`• ${m.group?.name}`);
            });
        }

        doc.end();
    });