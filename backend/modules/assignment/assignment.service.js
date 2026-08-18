// backend/modules/assignment/assignment.service.js
import prisma from "../../utils/prisma.js";

const nf = (msg="Not found") => Object.assign(new Error(msg), { status: 404 });

// ── CRUD ──────────────────────────────────────────────────────
export const listAssignments = async ({ faculty_id, subject_id, section_id, session_id, status, page=1, limit=20 }) => {
  const where = {};
  if (faculty_id)  where.faculty_id  = faculty_id;
  if (subject_id)  where.subject_id  = subject_id;
  if (session_id)  where.session_id  = session_id;
  if (status)      where.status      = status;
  if (section_id)  where.section_ids = { has: section_id };
  where.deleted_at = null;
  const skip = (page-1)*limit;
  const [items, total] = await Promise.all([
    prisma.assignment.findMany({ where, skip, take:+limit, include: { subject:{ select:{id:true,name:true,code:true} }, faculty:{ select:{id:true,name:true} }, _count:{ select:{ submissions:true } } }, orderBy:{ deadline:"asc" } }),
    prisma.assignment.count({ where }),
  ]);
  return { items, total, page:+page, limit:+limit };
};

export const getAssignment = async (id) => {
  const a = await prisma.assignment.findUnique({ where:{ id }, include: { subject:true, faculty:{ select:{id:true,name:true} }, submissions:{ include:{ student:{ select:{id:true,name:true,roll_no:true} } } } } });
  if (!a) throw nf("Assignment not found");
  return a;
};

export const createAssignment = async (data, created_by) =>
  prisma.assignment.create({ data: { ...data, created_by, status:"DRAFT" } });

export const updateAssignment = async (id, data) => {
  const a = await prisma.assignment.findUnique({ where:{ id } });
  if (!a) throw nf();
  if (a.status === "CLOSED") throw Object.assign(new Error("Cannot edit closed assignment"), { status:400 });
  return prisma.assignment.update({ where:{ id }, data });
};

export const publishAssignment = async (id) =>
  prisma.assignment.update({ where:{ id }, data:{ status:"PUBLISHED", published_at:new Date() } });

export const closeAssignment = async (id) =>
  prisma.assignment.update({ where:{ id }, data:{ status:"CLOSED", closed_at:new Date() } });

// ── SUBMISSION ────────────────────────────────────────────────
export const submitAssignment = async (assignment_id, student_id, { text_content, file_urls=[], file_names=[] }) => {
  const a = await prisma.assignment.findUnique({ where:{ id:assignment_id } });
  if (!a) throw nf("Assignment not found");
  if (a.status !== "PUBLISHED") throw Object.assign(new Error("Assignment is not accepting submissions"), { status:400 });

  const now      = new Date();
  const is_late  = now > a.deadline;
  const late_days = is_late ? Math.ceil((now - a.deadline) / (1000*60*60*24)) : 0;
  const can_late  = is_late && a.allow_late && late_days <= a.max_late_days;

  if (is_late && !can_late) throw Object.assign(new Error("Submission deadline has passed"), { status:400 });

  return prisma.assignmentSubmission.upsert({
    where:  { assignment_id_student_id:{ assignment_id, student_id } },
    update: { text_content, file_urls, file_names, status:"SUBMITTED", submitted_at:now, is_late, late_days, updatedAt:now },
    create: { assignment_id, student_id, text_content, file_urls, file_names, status:"SUBMITTED", submitted_at:now, is_late, late_days },
  });
};

export const gradeSubmission = async (submission_id, { obtained_marks, grade_remarks, justify_reason }, graded_by) => {
  const sub = await prisma.assignmentSubmission.findUnique({ where:{ id:submission_id }, include:{ assignment:true } });
  if (!sub) throw nf("Submission not found");

  const a            = sub.assignment;
  const penalty      = sub.is_late ? (sub.late_days * a.late_penalty_pct / 100) * a.total_marks : 0;
  const final_penalty = justify_reason ? 0 : penalty;
  const final_marks  = Math.max(0, obtained_marks - final_penalty);

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submission_id },
    data:  { obtained_marks, penalty_marks: final_penalty, final_marks, grade_remarks, justify_reason, graded_by, graded_at: new Date(), status: "GRADED" },
  });

  await prisma.assignmentGrade.upsert({
    where:  { submission_id },
    update: { marks: final_marks, remarks: grade_remarks, graded_by, graded_at: new Date() },
    create: { assignment_id: sub.assignment_id, submission_id, student_id: sub.student_id, marks: final_marks, remarks: grade_remarks, graded_by, graded_at: new Date() },
  });

  return updated;
};

export const checkPlagiarism = async (assignment_id) => {
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignment_id, text_content: { not: null } },
    select: { id:true, student_id:true, text_content:true },
  });

  // Simple word-overlap similarity (replace with real plagiarism service in prod)
  const results = [];
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i+1; j < submissions.length; j++) {
      const a = new Set(submissions[i].text_content?.toLowerCase().split(/\s+/) || []);
      const b = new Set(submissions[j].text_content?.toLowerCase().split(/\s+/) || []);
      const intersection = new Set([...a].filter(w => b.has(w)));
      const similarity   = a.size > 0 ? (intersection.size / Math.max(a.size, b.size)) * 100 : 0;
      results.push({ sub1: submissions[i].id, sub2: submissions[j].id, similarity_pct: +similarity.toFixed(1) });
    }
  }

  // Flag high-similarity submissions
  const threshold = (await prisma.assignment.findUnique({ where:{ id:assignment_id } }))?.plagiarism_threshold || 30;
  for (const r of results.filter(r => r.similarity_pct >= threshold)) {
    await prisma.assignmentSubmission.update({ where:{ id:r.sub1 }, data:{ plagiarism_flag:true, similarity_pct:r.similarity_pct, checked_at:new Date() } });
    await prisma.assignmentSubmission.update({ where:{ id:r.sub2 }, data:{ plagiarism_flag:true, similarity_pct:r.similarity_pct, checked_at:new Date() } });
  }

  return results;
};

export const getReport = async (assignment_id) => {
  const [assignment, submissions] = await Promise.all([
    prisma.assignment.findUnique({ where:{ id:assignment_id }, include:{ subject:true, faculty:{ select:{id:true,name:true} } } }),
    prisma.assignmentSubmission.findMany({ where:{ assignment_id }, include:{ student:{ select:{ id:true, name:true, roll_no:true, section:{ select:{ name:true } } } } } }),
  ]);
  return {
    assignment,
    summary: {
      total: submissions.length,
      submitted: submissions.filter(s => s.status !== "DRAFT").length,
      graded:    submissions.filter(s => s.status === "GRADED").length,
      late:      submissions.filter(s => s.is_late).length,
      flagged:   submissions.filter(s => s.plagiarism_flag).length,
      avg_marks: submissions.filter(s => s.final_marks!=null).length
        ? +(submissions.reduce((sum,s) => sum+(s.final_marks||0), 0) / submissions.filter(s=>s.final_marks!=null).length).toFixed(1)
        : 0,
    },
    submissions,
  };
};
