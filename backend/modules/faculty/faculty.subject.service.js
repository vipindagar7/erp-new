// backend/modules/faculty/faculty.subject.service.js
import prisma from "../../utils/prisma.js";

const guard = () => {
  if (!prisma.facultySubjectRequest) throw Object.assign(new Error("Run migration"), { status:503 });
};

// Faculty requests a subject preference
export const requestSubjectPreference = async (faculty_id, data, actingUser = {}) => {
  guard();
  const { subject_id, session_id, preference = 1 } = data;
  if (!subject_id || !session_id) throw Object.assign(new Error("subject_id and session_id required"), { status:400 });
  if (![1,2].includes(parseInt(preference))) throw Object.assign(new Error("preference must be 1 or 2"), { status:400 });

  // Check faculty already has 2 approved/pending preferences
  const existing = await prisma.facultySubjectRequest.findMany({
    where: { faculty_id, session_id, status: { in: ["PENDING","APPROVED"] } },
  });
  if (existing.length >= 2) throw Object.assign(new Error("You can only request up to 2 subject preferences"), { status:400 });

  return prisma.facultySubjectRequest.upsert({
    where: { faculty_id_subject_id_session_id: { faculty_id, subject_id, session_id } },
    update: { preference: parseInt(preference), status: "PENDING", reviewed_by: null, reviewed_at: null, review_note: null },
    create: { faculty_id, subject_id, session_id, preference: parseInt(preference) },
    include: {
      subject: { select: { id:true, name:true, code:true } },
      faculty: { select: { id:true, name:true, emp_id:true } },
    },
  });
};

// List requests — for dept admin (all) or faculty (own)
export const listRequests = async (filters = {}) => {
  guard();
  const { faculty_id, session_id, dept_id, status } = filters;
  const where = {};
  if (faculty_id) where.faculty_id = faculty_id;
  if (session_id) where.session_id = session_id;
  if (status)     where.status     = status;
  if (dept_id)    where.faculty    = { dept_id };

  return prisma.facultySubjectRequest.findMany({
    where,
    include: {
      subject: { select: { id:true, name:true, code:true, category:true } },
      faculty: {
        select: { id:true, name:true, emp_id:true, designation:true,
                  department: { select: { id:true, name:true } } },
      },
    },
    orderBy: [{ faculty: { name:"asc" } }, { preference:"asc" }],
  });
};

// Dept admin approves or rejects
export const reviewRequest = async (request_id, action, reviewer, note) => {
  guard();
  if (!["APPROVED","REJECTED"].includes(action))
    throw Object.assign(new Error("action must be APPROVED or REJECTED"), { status:400 });

  const req = await prisma.facultySubjectRequest.findUnique({
    where: { id: request_id },
    include: { faculty:true, subject:true },
  });
  if (!req) throw Object.assign(new Error("Request not found"), { status:404 });

  const updated = await prisma.facultySubjectRequest.update({
    where: { id: request_id },
    data: {
      status:      action,
      reviewed_by: reviewer?.id   || null,
      reviewed_at: new Date(),
      review_note: note           || null,
    },
    include: {
      subject: { select: { id:true, name:true, code:true } },
      faculty: { select: { id:true, name:true, emp_id:true } },
    },
  });

  // If approved — auto-assign to FacultySubject
  if (action === "APPROVED") {
    await prisma.facultySubject.upsert({
      where: { faculty_id_subject_id: { faculty_id: req.faculty_id, subject_id: req.subject_id } },
      update: {},
      create: { faculty_id: req.faculty_id, subject_id: req.subject_id },
    }).catch(() => {});
  }

  return updated;
};

// Bulk review
export const bulkReview = async (request_ids, action, reviewer, note) => {
  const results = [];
  for (const id of request_ids) {
    try { results.push(await reviewRequest(id, action, reviewer, note)); }
    catch (e) { results.push({ id, error: e.message }); }
  }
  return results;
};