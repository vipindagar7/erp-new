// backend/modules/student/student-enrollment.routes.js
// Add to your existing student routes file or register separately
import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import prisma from "../../utils/prisma.js";

const router = express.Router();

// GET /students/my-enrollments — student sees own enrollment history
router.get("/my-enrollments", authenticate, authorize("STUDENT"), async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where:  { user_id: req.user.id },
      select: {
        id:            true,
        name:          true,
        roll_no:       true,
        enrollment_no: true,
        batch_year:    true,
        admission_year:true,
        status:        true,
        department:    { select: { id: true, name: true } },
        course:        { select: { id: true, name: true } },
        program:       { select: { id: true, name: true } },
        section:       { select: { id: true, name: true, semester: true, batch: true } },
      },
    });

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const enrollments = await prisma.studentEnrollment.findMany({
      where:   { student_id: student.id },
      include: {
        section:    { select: { id: true, name: true, semester: true, batch: true, room_no: true } },
        course:     { select: { id: true, name: true } },
        program:    { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ academic_year: "desc" }, { semester: "desc" }],
    });

    res.json({ success: true, student, enrollments });
  } catch (e) {
    console.error("[StudentEnrollment] my-enrollments:", e);
    res.status(500).json({ success: false, message: "Failed to fetch enrollment history" });
  }
});

export default router;
