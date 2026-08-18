// backend/modules/training/training.service.js
import prisma from "../../utils/prisma.js";

const notFound = (msg = "Training not found") =>
  Object.assign(new Error(msg), { status: 404 });

const computeAttendancePct = (attended, total) =>
  total > 0 ? Math.round((attended / total) * 100 * 10) / 10 : 0;

// ── Training CRUD ─────────────────────────────────────────────
export const listTrainings = async ({ session_id, status, type, dept_id, mode, search, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (session_id) where.session_id = session_id;
  if (status)     where.status     = status;
  if (type)       where.type       = type;
  if (dept_id)    where.dept_id    = dept_id;
  if (mode)       where.mode       = mode;
  if (search)     where.OR = [
    { title:       { contains: search, mode: "insensitive" } },
    { code:        { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
  ];
  const skip = (page - 1) * limit;
  const [trainings, total] = await Promise.all([
    prisma.training.findMany({
      where, skip, take: +limit,
      include: {
        department: { select: { id: true, name: true } },
        mentors: { include: { faculty: { select: { id: true, name: true, designation: true } } } },
        _count: { select: { enrollments: true, sections: true } },
      },
      orderBy: [{ start_date: "desc" }],
    }),
    prisma.training.count({ where }),
  ]);
  return { trainings, total, page: +page, limit: +limit, pages: Math.ceil(total / limit) };
};

export const getTrainingById = async (id) => {
  const t = await prisma.training.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      room:       { select: { id: true, name: true, code: true } },
      mentors: {
        include: {
          faculty: { select: { id: true, name: true, designation: true, department: { select: { name: true } } } },
          updates: { take: 3, orderBy: { createdAt: "desc" } },
        },
      },
      sections: {
        include: { section: { select: { id: true, name: true, code: true, semester: true, batch: true } } },
      },
      teamMembers: true,
      _count: { select: { enrollments: true, attendance: true, updates: true } },
    },
  });
  if (!t) throw notFound();
  return t;
};

export const createTraining = async (data, created_by) => {
  const code = data.code || `TRN-${Date.now()}`;
  return prisma.training.create({ data: { ...data, code, created_by, status: "DRAFT" } });
};

export const updateTraining = async (id, data) => {
  const t = await prisma.training.findUnique({ where: { id } });
  if (!t) throw notFound();
  if (["CANCELLED","DEACTIVATED"].includes(t.status))
    throw Object.assign(new Error("Cannot edit cancelled/deactivated training"), { status: 400 });
  return prisma.training.update({ where: { id }, data });
};

export const cancelTraining = async (id, reason, cancelled_by) => {
  const t = await prisma.training.findUnique({ where: { id } });
  if (!t) throw notFound();
  return prisma.training.update({
    where: { id },
    data: { status: "CANCELLED", cancel_reason: reason, cancelled_by, cancelled_at: new Date() },
  });
};

export const deactivateTraining = async (id, deactivated_by) =>
  prisma.training.update({ where: { id }, data: { status: "DEACTIVATED", deactivated_by, deactivated_at: new Date() } });

export const activateTraining = async (id) =>
  prisma.training.update({ where: { id }, data: { status: "ACTIVE" } });

// ── Sections ──────────────────────────────────────────────────
export const assignSections = async (training_id, section_ids, is_mandatory = true, assigned_by) => {
  const results = [];
  for (const section_id of section_ids) {
    const r = await prisma.trainingSection.upsert({
      where:  { training_id_section_id: { training_id, section_id } },
      update: { is_mandatory, assigned_by },
      create: { training_id, section_id, is_mandatory, assigned_by },
    });
    results.push(r);
  }
  return results;
};

export const removeSections = async (training_id, section_ids) =>
  prisma.trainingSection.deleteMany({ where: { training_id, section_id: { in: section_ids } } });

export const getSections = async (training_id) =>
  prisma.trainingSection.findMany({
    where: { training_id },
    include: {
      section: {
        select: {
          id: true, name: true, code: true, semester: true, batch: true,
          branch: { select: { name: true } },
          _count: { select: { students: true } },
        },
      },
    },
  });

// ── Mentors ───────────────────────────────────────────────────
export const assignMentors = async (training_id, mentors, assigned_by) => {
  const results = [];
  for (const m of mentors) {
    const r = await prisma.trainingMentor.upsert({
      where:  { training_id_faculty_id: { training_id, faculty_id: m.faculty_id } },
      update: { role: m.role || "MENTOR", is_primary: m.is_primary || false, assigned_by },
      create: { training_id, faculty_id: m.faculty_id, role: m.role || "MENTOR", is_primary: m.is_primary || false, assigned_by },
    });
    results.push(r);
  }
  return results;
};

export const removeMentor = async (training_id, faculty_id) =>
  prisma.trainingMentor.delete({ where: { training_id_faculty_id: { training_id, faculty_id } } });

// ── Enrollment ────────────────────────────────────────────────
export const enrollStudents = async (training_id, student_ids, enrolled_by) => {
  const training = await prisma.training.findUnique({ where: { id: training_id } });
  if (!training) throw notFound();
  if (training.max_enrollments) {
    const current = await prisma.trainingEnrollment.count({
      where: { training_id, status: { in: ["ENROLLED","IN_PROGRESS"] } },
    });
    if (current + student_ids.length > training.max_enrollments)
      throw Object.assign(new Error(`Max enrollment (${training.max_enrollments}) would be exceeded`), { status: 400 });
  }
  const results = [];
  for (const student_id of student_ids) {
    const r = await prisma.trainingEnrollment.upsert({
      where:  { training_id_student_id: { training_id, student_id } },
      update: { status: "ENROLLED", enrolled_by },
      create: {
        training_id, student_id, enrolled_by,
        fee_status: training.has_fee ? "PENDING" : "NOT_APPLICABLE",
        fee_amount: training.has_fee ? training.fee_amount : 0,
      },
    });
    results.push(r);
  }
  return results;
};

export const enrollBySection = async (training_id, section_id, enrolled_by) => {
  const students = await prisma.student.findMany({ where: { section_id, status: "ACTIVE" }, select: { id: true } });
  return enrollStudents(training_id, students.map(s => s.id), enrolled_by);
};

export const dropEnrollment = async (training_id, student_id, reason) =>
  prisma.trainingEnrollment.update({
    where: { training_id_student_id: { training_id, student_id } },
    data:  { status: "DROPPED", dropped_at: new Date(), drop_reason: reason },
  });

export const listEnrollments = async (training_id, { status, search, page = 1, limit = 50 } = {}) => {
  const where = { training_id };
  if (status) where.status = status;
  if (search) where.student = {
    OR: [
      { name:          { contains: search, mode: "insensitive" } },
      { roll_no:       { contains: search, mode: "insensitive" } },
      { enrollment_no: { contains: search, mode: "insensitive" } },
    ],
  };
  const skip = (page - 1) * limit;
  const [enrollments, total] = await Promise.all([
    prisma.trainingEnrollment.findMany({
      where, skip, take: +limit,
      include: {
        student: {
          select: {
            id: true, name: true, roll_no: true, enrollment_no: true,
            section: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { enrolled_at: "desc" },
    }),
    prisma.trainingEnrollment.count({ where }),
  ]);
  return { enrollments, total };
};

// ── Fee ───────────────────────────────────────────────────────
export const updateFeeStatus = async (training_id, student_id, { fee_status, amount_paid, receipt_no, remarks }, recorded_by) => {
  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: { training_id_student_id: { training_id, student_id } },
  });
  if (!enrollment) throw notFound("Enrollment not found");
  const newPaid = (enrollment.fee_paid_amount || 0) + (amount_paid || 0);
  const newStatus = fee_status || (newPaid >= enrollment.fee_amount ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING");
  await prisma.trainingFeeTransaction.create({
    data: { enrollment_id: enrollment.id, type: "PAYMENT", amount: amount_paid || 0, receipt_no, remarks, recorded_by },
  });
  return prisma.trainingEnrollment.update({
    where: { id: enrollment.id },
    data:  { fee_status: newStatus, fee_paid_amount: newPaid, fee_paid_at: new Date(), fee_paid_by: recorded_by, fee_receipt_no: receipt_no },
  });
};

export const processRefund = async (enrollment_id, { refund_amount, refund_reason }, refund_by) => {
  await prisma.trainingFeeTransaction.create({
    data: { enrollment_id, type: "REFUND", amount: refund_amount, remarks: refund_reason, recorded_by: refund_by },
  });
  return prisma.trainingEnrollment.update({
    where: { id: enrollment_id },
    data:  { fee_status: "REFUNDED", refund_amount, refund_at: new Date(), refund_reason, refund_by },
  });
};

// ── Attendance ────────────────────────────────────────────────
export const markAttendance = async (training_id, records, marked_by) => {
  const results = [];
  for (const rec of records) {
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { training_id_student_id: { training_id, student_id: rec.student_id } },
    });
    if (!enrollment) continue;
    const r = await prisma.trainingAttendance.upsert({
      where: {
        training_id_student_id_date_session_label: {
          training_id, student_id: rec.student_id,
          date: new Date(rec.date), session_label: rec.session_label,
        },
      },
      update: { status: rec.status, attendance_type: rec.attendance_type || "REGULAR", marked_by, remarks: rec.remarks },
      create: {
        training_id, enrollment_id: enrollment.id, student_id: rec.student_id,
        date: new Date(rec.date), session_label: rec.session_label,
        status: rec.status, attendance_type: rec.attendance_type || "REGULAR",
        marked_by, remarks: rec.remarks,
      },
    });
    results.push(r);
  }
  const studentIds = [...new Set(records.map(r => r.student_id))];
  for (const student_id of studentIds) {
    const [total, attended] = await Promise.all([
      prisma.trainingAttendance.count({ where: { training_id, student_id } }),
      prisma.trainingAttendance.count({ where: { training_id, student_id, status: "PRESENT" } }),
    ]);
    await prisma.trainingEnrollment.update({
      where: { training_id_student_id: { training_id, student_id } },
      data:  { total_sessions: total, attended_sessions: attended, attendance_pct: computeAttendancePct(attended, total) },
    });
  }
  return results;
};

export const getAttendance = async (training_id, { date, student_id, session_label } = {}) => {
  const where = { training_id };
  if (date)          where.date          = new Date(date);
  if (student_id)    where.student_id    = student_id;
  if (session_label) where.session_label = session_label;
  return prisma.trainingAttendance.findMany({
    where,
    include: { student: { select: { id: true, name: true, roll_no: true, section: { select: { name: true } } } } },
    orderBy: [{ date: "asc" }, { session_label: "asc" }],
  });
};

// ── Online Course ─────────────────────────────────────────────
export const addOnlineCourseRecord = async (training_id, student_id, data) =>
  prisma.onlineCourseRecord.create({ data: { ...data, training_id, student_id } });

export const verifyOnlineCourse = async (record_id, verified_by) =>
  prisma.onlineCourseRecord.update({
    where: { id: record_id },
    data:  { is_verified: true, verified_by, verified_at: new Date() },
  });

export const creditAttendance = async (record_id, units, credited_by, session_id) => {
  const rec = await prisma.onlineCourseRecord.update({
    where: { id: record_id },
    data:  { attendance_credited: true, units_credited: units, credited_by, credited_at: new Date(), credited_to_session: session_id },
  });
  if (rec.student_id && rec.training_id) {
    await prisma.trainingEnrollment.update({
      where: { training_id_student_id: { training_id: rec.training_id, student_id: rec.student_id } },
      data:  { extra_units_granted: units, extra_units_granted_at: new Date(), extra_units_granted_by: credited_by },
    }).catch(() => {});
  }
  return rec;
};

// ── Updates ───────────────────────────────────────────────────
export const postUpdate = async (training_id, data, posted_by) =>
  prisma.trainingUpdate.create({ data: { ...data, training_id, posted_by } });

export const getUpdates = async (training_id) =>
  prisma.trainingUpdate.findMany({
    where: { training_id, deleted_at: null },
    orderBy: [{ is_pinned: "desc" }, { createdAt: "desc" }],
  });

export const deleteUpdate = async (update_id) =>
  prisma.trainingUpdate.update({ where: { id: update_id }, data: { deleted_at: new Date() } });

// ── Team ──────────────────────────────────────────────────────
export const addTeamMember = async (data, granted_by) =>
  prisma.trainingTeamMember.create({ data: { ...data, granted_by } });

export const removeTeamMember = async (id) =>
  prisma.trainingTeamMember.update({ where: { id }, data: { is_active: false } });

// ── Reports ───────────────────────────────────────────────────
export const getTrainingReport = async (training_id) => {
  const training = await getTrainingById(training_id);
  const [enrollments, attendance, feeStats] = await Promise.all([
    prisma.trainingEnrollment.findMany({
      where: { training_id },
      include: {
        student: { select: { id: true, name: true, roll_no: true, enrollment_no: true, section: { select: { name: true } }, department: { select: { name: true } } } },
        feeTransactions: true,
      },
    }),
    prisma.trainingAttendance.groupBy({ by: ["student_id","status"], where: { training_id }, _count: { id: true } }),
    prisma.trainingEnrollment.groupBy({ by: ["fee_status"], where: { training_id }, _count: { id: true }, _sum: { fee_amount: true, fee_paid_amount: true, refund_amount: true } }),
  ]);
  const attMap = {};
  attendance.forEach(a => { if (!attMap[a.student_id]) attMap[a.student_id] = {}; attMap[a.student_id][a.status] = a._count.id; });
  return {
    training,
    summary: {
      total_enrolled: enrollments.length,
      completed:      enrollments.filter(e => e.status === "COMPLETED").length,
      dropped:        enrollments.filter(e => e.status === "DROPPED").length,
      avg_attendance: enrollments.length ? Math.round(enrollments.reduce((s,e) => s + e.attendance_pct, 0) / enrollments.length) : 0,
    },
    studentReport: enrollments.map(e => ({
      student: e.student, status: e.status, fee_status: e.fee_status,
      fee_amount: e.fee_amount, fee_paid: e.fee_paid_amount, refund: e.refund_amount,
      total_sessions: e.total_sessions, attended: e.attended_sessions, attendance_pct: e.attendance_pct,
      present: attMap[e.student_id]?.PRESENT || 0, absent: attMap[e.student_id]?.ABSENT || 0,
      late: attMap[e.student_id]?.LATE || 0, extra_units: e.extra_units_granted,
    })),
    feeReport: {
      collected: feeStats.find(f => f.fee_status === "PAID")?._sum.fee_paid_amount || 0,
      pending:   feeStats.find(f => f.fee_status === "PENDING")?._sum.fee_amount   || 0,
      refunded:  feeStats.find(f => f.fee_status === "REFUNDED")?._sum.refund_amount || 0,
      by_status: feeStats,
    },
  };
};

export const getMentorReport = async (faculty_id, session_id) => {
  const mentorships = await prisma.trainingMentor.findMany({
    where: { faculty_id },
    include: {
      training: {
        where: session_id ? { session_id } : {},
        include: {
          _count: { select: { enrollments: true } },
          enrollments: { select: { status: true, attendance_pct: true, student: { select: { id: true, name: true, roll_no: true } } } },
        },
      },
    },
  });
  const trainings = mentorships.map(m => ({
    training_id: m.training.id, title: m.training.title, code: m.training.code,
    type: m.training.type, status: m.training.status, role: m.role,
    start_date: m.training.start_date, end_date: m.training.end_date,
    total_students: m.training._count.enrollments,
    completed: m.training.enrollments.filter(e => e.status === "COMPLETED").length,
    avg_attendance: m.training.enrollments.length
      ? Math.round(m.training.enrollments.reduce((s,e) => s + e.attendance_pct, 0) / m.training.enrollments.length) : 0,
    students: m.training.enrollments,
  }));
  const summary = {
    total_trainings:     trainings.length,
    active_trainings:    trainings.filter(t => ["ACTIVE","ONGOING"].includes(t.status)).length,
    completed_trainings: trainings.filter(t => t.status === "COMPLETED").length,
    total_students:      trainings.reduce((s,t) => s + t.total_students, 0),
    completed_students:  trainings.reduce((s,t) => s + t.completed, 0),
    avg_attendance_pct:  trainings.length ? Math.round(trainings.reduce((s,t) => s + t.avg_attendance, 0) / trainings.length) : 0,
  };
  await prisma.mentorTrackRecord.upsert({
    where:  { faculty_id_session_id: { faculty_id, session_id: session_id || null } },
    update: { ...summary, computed_at: new Date(), data: { trainings } },
    create: { faculty_id, session_id: session_id || null, ...summary, data: { trainings } },
  }).catch(() => {});
  return { faculty_id, trainings, summary };
};

export const getSummaryReport = async ({ session_id, dept_id, type, status } = {}) => {
  const where = {};
  if (session_id) where.session_id = session_id;
  if (dept_id)    where.dept_id    = dept_id;
  if (type)       where.type       = type;
  if (status)     where.status     = status;
  const [trainings, totalE, completedE, totalFee, collectedFee] = await Promise.all([
    prisma.training.findMany({ where, select: { id: true, title: true, code: true, type: true, mode: true, status: true, start_date: true, end_date: true, _count: { select: { enrollments: true, sections: true, mentors: true } } }, orderBy: { start_date: "desc" } }),
    prisma.trainingEnrollment.count({ where: { training: where } }),
    prisma.trainingEnrollment.count({ where: { training: where, status: "COMPLETED" } }),
    prisma.trainingEnrollment.aggregate({ where: { training: where }, _sum: { fee_amount: true } }),
    prisma.trainingEnrollment.aggregate({ where: { training: where }, _sum: { fee_paid_amount: true } }),
  ]);
  return { trainings, summary: { total_trainings: trainings.length, total_enrollments: totalE, completed_students: completedE, completion_rate: totalE ? Math.round(completedE/totalE*100) : 0, total_fee_expected: totalFee._sum.fee_amount||0, total_fee_collected: collectedFee._sum.fee_paid_amount||0 } };
};