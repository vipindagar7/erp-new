// backend/modules/marks/marks.routes.js
import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import prisma from "../../utils/prisma.js";

const router = Router();
const ok   = (res, data, msg="OK", s=200) => res.status(s).json({ success:true, message:msg, data });
const fail = (res, e, next) => e.status ? res.status(e.status).json({ success:false, message:e.message }) : next(e);

router.use(authenticate);

// Get marks for a section/subject/exam
router.get("/", requirePerm("attendance:view"), async (req,res,next) => {
  try {
    if (!prisma.studentMark) return ok(res, []);
    const { section_id, subject_id, session_id, student_id, exam_type, exam_name } = req.query;
    const where = {};
    if (section_id)  where.section_id  = section_id;
    if (subject_id)  where.subject_id  = subject_id;
    if (session_id)  where.session_id  = session_id;
    if (student_id)  where.student_id  = student_id;
    if (exam_type)   where.exam_type   = exam_type;
    if (exam_name)   where.exam_name   = exam_name;
    const marks = await prisma.studentMark.findMany({
      where,
      include:{ student:{ select:{ id:true, name:true, roll_no:true } }, subject:{ select:{ name:true, code:true } } },
      orderBy:{ student:{ roll_no:"asc" } },
    });
    ok(res, marks);
  } catch(e){ fail(res,e,next); }
});

// Bulk save marks (upsert)
router.post("/bulk", requirePerm("attendance:mark"), async (req,res,next) => {
  try {
    if (!prisma.studentMark) return ok(res, { saved:0, message:"Run migration" });
    const records = req.body.records || [];
    const results = [];
    for (const r of records) {
      try {
        const saved = await prisma.studentMark.upsert({
          where: { student_id_subject_id_session_id_exam_type_exam_name: {
            student_id:r.student_id, subject_id:r.subject_id, session_id:r.session_id,
            exam_type:r.exam_type, exam_name:r.exam_name||"",
          }},
          update: { marks_obtained:r.marks_obtained??null, is_absent:r.is_absent||false, max_marks:r.max_marks||100, entered_by:req.user?.id||null },
          create: { ...r, exam_name:r.exam_name||"", entered_by:req.user?.id||null },
        });
        results.push(saved);
      } catch(e) { results.push({ error:e.message, student_id:r.student_id }); }
    }
    ok(res, { saved:results.filter(r=>!r.error).length, failed:results.filter(r=>r.error).length });
  } catch(e){ fail(res,e,next); }
});

// Student's marks summary
router.get("/student/:student_id", async (req,res,next) => {
  try {
    if (!prisma.studentMark) return ok(res, []);
    const marks = await prisma.studentMark.findMany({
      where:{ student_id:req.params.student_id, session_id:req.query.session_id||undefined },
      include:{ subject:{ select:{ name:true, code:true } } },
      orderBy:[{ subject:{ name:"asc" } },{ exam_type:"asc" }],
    });
    ok(res, marks);
  } catch(e){ fail(res,e,next); }
});

export default router;
