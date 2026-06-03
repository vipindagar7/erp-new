import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";
const masterClient = prisma;
const replicaClient = prisma;
import bcrypt from "bcryptjs";

// ── Shared include ────────────────────────────────────────────────────────────
const studentInclude = {
  user: { select: { id: true, email: true, role: true, isBlocked: true } },
  department: { select: { id: true, name: true } },
  section: {
    select: {
      id: true, name: true, semester: true,
      course: { select: { id: true, name: true, program: { select: { id: true, name: true } } } },
    },
  },
  course: { select: { id: true, name: true } },
  program: { select: { id: true, name: true } },
  enrollments: {
    orderBy: { enrolled_at: "desc" },
    select: {
      id: true, academic_year: true, semester: true,
      status: true, is_current: true, remarks: true,
      enrolled_at: true,
      section: { select: { id: true, name: true } },
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Given a current semester, returns the next semester.
 * Odd → Even  (same year)
 * Even → Odd  (year increments)
 *   e.g. sem 1 → 2 (same year), sem 2 → 3 (next year), sem 6 → 7 (next year), sem 8 → graduated
 */
export function getNextSemester(currentSemester, academicYear) {
  const nextSem = currentSemester + 1;
  if (nextSem > 8) return null; // graduated

  // Even → Odd means year rolls over
  const yearChanges = currentSemester % 2 === 0;
  let nextYear = academicYear;

  if (yearChanges) {
    // academic_year format: "2024-2025" → "2025-2026"
    const [start, end] = academicYear.split("-").map(Number);
    nextYear = `${end}-${end + 1}`;
  }

  return { semester: nextSem, academic_year: nextYear };
}

/**
 * Returns which semester parity is currently "active" across the institution.
 * ODD  = 1,3,5,7  (typically Jul–Dec)
 * EVEN = 2,4,6,8  (typically Jan–Jun)
 */
export function getCurrentSemesterParity() {
  const month = new Date().getMonth() + 1; // 1–12
  return month >= 7 ? "ODD" : "EVEN"; // Jul-Dec = ODD, Jan-Jun = EVEN
}

// ── getAllStudents ─────────────────────────────────────────────────────────────
export const getAllStudents = async ({
  page = 1, limit = 10, search,
  // Single filters (backwards compat)
  dept_id, section_id, course_id, program_id,
  // Multi-value filters (comma-separated strings or arrays)
  dept_ids, section_ids, course_ids, program_ids,
  // Other filters
  academic_year, semester, session, gender, batch_year,
  status, is_hosteller, is_using_transport,
  isBlocked, batch,
} = {}) => {
  const _page = parseInt(page) || 1;
  const _limit = parseInt(limit) || 10;
  const skip = (_page - 1) * _limit;

  // Parse multi-value — accept comma-separated string or array
  const parseMulti = (v) => !v ? null : Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean);

  const deptFilter = parseMulti(dept_ids) || (dept_id ? [dept_id] : null);
  const sectionFilter = parseMulti(section_ids) || (section_id ? [section_id] : null);
  const courseFilter = parseMulti(course_ids) || (course_id ? [course_id] : null);
  const programFilter = parseMulti(program_ids) || (program_id ? [program_id] : null);

  const where = {
    ...(deptFilter && { dept_id: { in: deptFilter } }),
    ...(sectionFilter && { section_id: { in: sectionFilter } }),
    ...(courseFilter && { course_id: { in: courseFilter } }),
    ...(programFilter && { program_id: { in: programFilter } }),
    ...(gender && { gender }),
    ...(batch_year && { batch_year: parseInt(batch_year) }),
    ...(batch && { section: { batch } }),
    ...(is_hosteller !== undefined && { is_hosteller: is_hosteller === "true" || is_hosteller === true }),
    ...(is_using_transport !== undefined && { is_using_transport: is_using_transport === "true" || is_using_transport === true }),
    ...(isBlocked !== undefined && { user: { isBlocked: isBlocked === "true" || isBlocked === true } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { roll_no: { contains: search, mode: "insensitive" } },
        { enrollment_no: { contains: search, mode: "insensitive" } },
        { group_no: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ],
    }),
    ...((academic_year || semester || session || status) ? {
      enrollments: {
        some: {
          ...(academic_year && { academic_year }),
          ...(semester && { semester: parseInt(semester) }),
          ...(session && { session }),
          ...(status && { status }),
          is_current: true,
        },
      },
    } : {}),
  };

  const [students, total] = await Promise.all([
    replicaClient.student.findMany({
      where, skip, take: _limit,
      orderBy: { name: "asc" },
      include: studentInclude,
    }),
    replicaClient.student.count({ where }),
  ]);

  return {
    students,
    pagination: {
      total, page: _page, limit: _limit, pages: Math.ceil(total / _limit),
    },
  };
};

// ── getStudentById ────────────────────────────────────────────────────────────
export const getStudentById = async (id) =>
  replicaClient.student.findUnique({ where: { id }, include: studentInclude });

// ── createStudent ─────────────────────────────────────────────────────────────
export const createStudent = async (data) => {
  const {
    email, password,
    name, first_name, last_name, roll_number, enrollment_no,
    father_name, mother_name, contact_number, alt_contact_number, personal_email,
    dob, gender, aadhar_no, pan_no, father_mobile, mother_mobile,
    mode_of_admission, admission_year, admission_date, session,
    is_hosteller, is_using_transport, biometric_id,
    local_address, local_address_city, local_address_state, local_address_zipcode,
    permanent_address, permanent_address_city, permanent_address_state, permanent_address_zipcode,
    section_id, academic_year, semester,
    // new fields
    nick_name, category, religion, group_no, batch_year,
  } = data;

  // Auto-derive dept/course/program from section
  const section = await replicaClient.section.findUnique({
    where: { id: section_id },
    include: { course: { include: { program: { include: { department: true } } } } },
  });
  if (!section) { const e = new Error("Section not found"); e.statusCode = 404; throw e; }

  const course_id = section.course_id;
  const program_id = section.course.program_id;
  const dept_id = section.course.program.dept_id;

  // Uniqueness checks
  const [existEmail, existRoll] = await Promise.all([
    replicaClient.user.findUnique({ where: { email } }),
    replicaClient.student.findUnique({ where: { roll_no: roll_number } }),
  ]);
  if (existEmail) { const e = new Error("Email already registered"); e.statusCode = 409; throw e; }
  if (existRoll) { const e = new Error("Roll number already taken"); e.statusCode = 409; throw e; }

  const passwordHash = await bcrypt.hash(password, 10);

  return masterClient.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, role: "STUDENT", isBlocked: false },
    });

    const student = await tx.student.create({
      data: {
        user_id: user.id,
        name: name || `${first_name} ${last_name}`,
        first_name: first_name || name.split(" ")[0],
        last_name: last_name || name.split(" ").slice(1).join(" ") || "N/A",
        roll_no: roll_number,
        enrollment_no: enrollment_no || null,
        father_name: father_name || "",
        mother_name: mother_name || "",
        phone: contact_number,
        personal_email: personal_email || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        aadhar_no: aadhar_no || null,
        pan_no: pan_no || null,
        father_phone: father_mobile || null,
        mother_phone: mother_mobile || null,
        mode_of_admission: mode_of_admission || null,
        admission_year: admission_year ? parseInt(admission_year) : null,
        session: session || null,
        batch_year: batch_year ? parseInt(batch_year) : null,
        category: category || null,
        religion: religion || null,
        group_no: group_no || null,
        address: local_address || null,
        city: local_address_city || null,
        state: local_address_state || null,
        pincode: local_address_zipcode || null,
        dept_id, section_id, course_id, program_id,
      },
    });

    await tx.studentEnrollment.create({
      data: {
        student_id: student.id,
        section_id,
        academic_year,
        semester: parseInt(semester),
        dept_id, course_id, program_id,
        batch_year: 0,
        status: "ACTIVE",
        is_current: true,
      },
    });

    return tx.student.findUnique({ where: { id: student.id }, include: studentInclude });
  });
};

// ── updateStudent ─────────────────────────────────────────────────────────────
export const updateStudent = async (id, data) => {
  const existing = await replicaClient.student.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }

  // Build update payload using ONLY valid DB field names
  // (schema uses roll_no, phone, father_phone, mother_phone, address, city, state, pincode)
  const u = {};

  // Name fields
  if (data.first_name !== undefined) u.first_name = data.first_name;
  if (data.last_name !== undefined) u.last_name = data.last_name;
  if (data.name !== undefined) u.name = data.name;
  else if (data.first_name || data.last_name)
    u.name = `${data.first_name ?? existing.first_name} ${data.last_name ?? existing.last_name}`;

  // Identity — map frontend field names → DB field names
  if (data.roll_number !== undefined) u.roll_no = data.roll_number || null;
  if (data.enrollment_no !== undefined) u.enrollment_no = data.enrollment_no || null;
  if (data.biometric_id !== undefined) u.biometric_id = data.biometric_id || null;
  if (data.group_no !== undefined) u.group_no = data.group_no || null;

  // Contact
  if (data.contact_number !== undefined) u.phone = data.contact_number || null;
  if (data.alt_contact_number !== undefined) u.alt_contact_number = data.alt_contact_number || null;
  if (data.personal_email !== undefined) u.personal_email = data.personal_email || null;

  // Parents
  if (data.father_name !== undefined) u.father_name = data.father_name || null;
  if (data.father_mobile !== undefined) u.father_phone = data.father_mobile || null;
  if (data.mother_name !== undefined) u.mother_name = data.mother_name || null;
  if (data.mother_mobile !== undefined) u.mother_phone = data.mother_mobile || null;

  // Personal
  if (data.gender !== undefined) u.gender = data.gender || null;
  if (data.dob !== undefined) u.dob = data.dob ? new Date(data.dob) : null;
  if (data.aadhar_no !== undefined) u.aadhar_no = data.aadhar_no || null;
  if (data.pan_no !== undefined) u.pan_no = data.pan_no || null;
  if (data.religion !== undefined) u.religion = data.religion || null;
  if (data.category !== undefined) u.category = data.category || null;

  // Admission
  if (data.mode_of_admission !== undefined) u.mode_of_admission = data.mode_of_admission || null;
  if (data.admission_year !== undefined) u.admission_year = data.admission_year ? parseInt(data.admission_year) : null;
  if (data.batch_year !== undefined) u.batch_year = data.batch_year ? parseInt(data.batch_year) : null;
  if (data.session !== undefined) u.session = data.session || null;
  if (data.is_hosteller !== undefined) u.is_hosteller = Boolean(data.is_hosteller);
  if (data.is_using_transport !== undefined) u.is_using_transport = Boolean(data.is_using_transport);

  // Address — map local_address_* → address, city, state, pincode
  if (data.local_address !== undefined) u.address = data.local_address || null;
  if (data.local_address_city !== undefined) u.city = data.local_address_city || null;
  if (data.local_address_state !== undefined) u.state = data.local_address_state || null;
  if (data.local_address_zipcode !== undefined) u.pincode = data.local_address_zipcode || null;
  // Also accept direct DB field names
  if (data.address !== undefined) u.address = data.address || null;
  if (data.city !== undefined) u.city = data.city || null;
  if (data.state !== undefined) u.state = data.state || null;
  if (data.pincode !== undefined) u.pincode = data.pincode || null;

  // Permanent address (schema doesn't have these — skip silently)
  // If section changes, re-derive dept/course/program
  if (data.section_id && data.section_id !== existing.section_id) {
    const section = await replicaClient.section.findUnique({
      where: { id: data.section_id },
      include: { course: { include: { program: { include: { department: true } } } } },
    });
    if (!section) { const e = new Error("Section not found"); e.statusCode = 404; throw e; }
    u.section_id = data.section_id;
    u.course_id = section.course_id;
    u.program_id = section.course.program_id;
    u.dept_id = section.course.program.dept_id;
  }

  return masterClient.student.update({
    where: { id },
    data: u,
    include: studentInclude,
  });
};

// ── deleteStudent ─────────────────────────────────────────────────────────────
export const deleteStudent = async (id) => {
  const existing = await replicaClient.student.findUnique({
    where: { id },
    select: { user_id: true },
  });
  if (!existing) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }
  // Deleting user cascades to student + enrollments + feedback responses
  await masterClient.user.delete({ where: { id: existing.user_id } });
  return { id };
};

// ── toggleStudentBlock ────────────────────────────────────────────────────────
export const toggleStudentBlock = async (id, isBlocked) => {
  const student = await replicaClient.student.findUnique({ where: { id }, select: { user_id: true } });
  if (!student) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }
  return masterClient.user.update({
    where: { id: student.user_id },
    data: { isBlocked },
    select: { id: true, email: true, isBlocked: true },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMOTE — individual student to next semester
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Promotes a single student to the next semester.
 *
 * Rules:
 *  - Odd → Even: same academic year, semester +1
 *  - Even → Odd: next academic year, semester +1
 *  - Semester 8 → cannot promote (graduated)
 *  - Deactivates current enrollment, creates new ACTIVE one
 *  - Section stays the SAME (section belongs to a sem, but student keeps their group)
 */
export const promoteStudent = async (id) => {
  const student = await replicaClient.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        where: { is_current: true },
        orderBy: { enrolled_at: "desc" },
        take: 1,
      },
    },
  });
  if (!student) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }

  const activeEnrollment = student.enrollments[0];
  if (!activeEnrollment) { const e = new Error("No active enrollment found"); e.statusCode = 400; throw e; }
  if (activeEnrollment.semester >= 8) {
    const e = new Error("Student has completed maximum semesters (8). Cannot promote.");
    e.statusCode = 400; throw e;
  }

  const next = getNextSemester(activeEnrollment.semester, activeEnrollment.academic_year);
  if (!next) { const e = new Error("Cannot promote — student is at max semester"); e.statusCode = 400; throw e; }

  return masterClient.$transaction(async (tx) => {
    // Deactivate current enrollment
    await tx.studentEnrollment.update({
      where: { id: activeEnrollment.id },
      data: { status: "COMPLETED", is_current: false },
    });

    // Create new enrollment — same section, next sem/year
    await tx.studentEnrollment.create({
      data: {
        student_id: student.id,
        section_id: student.section_id,
        dept_id: activeEnrollment.dept_id,
        course_id: activeEnrollment.course_id,
        program_id: activeEnrollment.program_id,
        academic_year: next.academic_year,
        semester: next.semester,
        batch_year: activeEnrollment.batch_year ?? 0,
        status: "ACTIVE",
        is_current: true,
      },
    });
    // Mark old enrollment as not current
    await tx.studentEnrollment.update({
      where: { id: activeEnrollment.id },
      data: { is_current: false },
    });

    return tx.student.findUnique({ where: { id }, include: studentInclude });
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// BULK PROMOTE — promote all students of a section at once
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bulk promote all students in a section.
 *
 * @param {string} section_id  — which section to promote
 * @param {string} parity      — "ODD" | "EVEN" — only promotes students currently on this parity
 *                               (prevents double-promoting if someone runs it twice)
 */
export const bulkPromoteSection = async (section_id, parity) => {
  // Get all students in the section with their active enrollment
  const students = await replicaClient.student.findMany({
    where: { section_id },
    include: {
      enrollments: {
        where: { is_current: true },
        orderBy: { enrolled_at: "desc" },
        take: 1,
      },
    },
  });

  if (!students.length) {
    const e = new Error("No students found in this section"); e.statusCode = 404; throw e;
  }

  const results = { promoted: [], skipped: [], failed: [], total: students.length };

  for (const student of students) {
    const activeEnrollment = student.enrollments[0];

    if (!activeEnrollment) {
      results.skipped.push({ id: student.id, name: student.name, reason: "No active enrollment" });
      continue;
    }

    // Parity check — only promote students currently on the expected semester type
    const currentParity = activeEnrollment.semester % 2 === 1 ? "ODD" : "EVEN";
    if (parity && currentParity !== parity) {
      results.skipped.push({
        id: student.id, name: student.name,
        reason: `Semester ${activeEnrollment.semester} is ${currentParity}, expected ${parity}`,
      });
      continue;
    }

    if (activeEnrollment.semester >= 8) {
      results.skipped.push({ id: student.id, name: student.name, reason: "Already at max semester (8)" });
      continue;
    }

    const next = getNextSemester(activeEnrollment.semester, activeEnrollment.academic_year);
    if (!next) {
      results.skipped.push({ id: student.id, name: student.name, reason: "Cannot determine next semester" });
      continue;
    }

    try {
      await masterClient.$transaction(async (tx) => {
        await tx.studentEnrollment.update({
          where: { id: activeEnrollment.id },
          data: { status: "COMPLETED", is_current: false },
        });
        await tx.studentEnrollment.create({
          data: {
            student_id: student.id,
            section_id: student.section_id,
            dept_id: activeEnrollment.dept_id,
            course_id: activeEnrollment.course_id,
            program_id: activeEnrollment.program_id,
            academic_year: next.academic_year,
            semester: next.semester,
            batch_year: activeEnrollment.batch_year ?? 0,
            status: "ACTIVE",
            is_current: true,
          },
        });
      });

      results.promoted.push({
        id: student.id, name: student.name,
        roll_number: student.roll_no,
        from: { semester: activeEnrollment.semester, academic_year: activeEnrollment.academic_year },
        to: { semester: next.semester, academic_year: next.academic_year },
      });
    } catch (err) {
      results.failed.push({ id: student.id, name: student.name, reason: err.message });
    }
  }

  // Update the Section's semester to match the promoted semester
  if (results.promoted.length > 0) {
    const nextSem = results.promoted[0]?.to?.semester;
    const nextYear = results.promoted[0]?.to?.academic_year;
    if (nextSem) {
      try {
        await masterClient.section.update({
          where: { id: section_id },
          data: { semester: nextSem },
        });
        results.section_updated = { semester: nextSem, academic_year: nextYear };
      } catch (e) {
        results.section_update_error = e.message;
      }
    }
  }

  return results;
};

// ═══════════════════════════════════════════════════════════════════════════════
// BULK PROMOTE — multiple sections at once (institution-wide semester push)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Institution-wide bulk promote.
 * Promotes ALL students whose current active enrollment semester matches `fromParity`.
 * Optionally filter to specific section IDs.
 *
 * @param {string}   fromParity    — "ODD" | "EVEN"
 * @param {string[]} section_ids   — optional list of section IDs; if empty, promotes all sections
 */
export const bulkPromoteInstitution = async (fromParity, section_ids = []) => {
  const semesterFilter = fromParity === "ODD"
    ? { in: [1, 3, 5, 7] }
    : { in: [2, 4, 6, 8] };

  const where = {
    status: "ACTIVE",
    semester: semesterFilter,
    ...(section_ids.length > 0 && { section_id: { in: section_ids } }),
  };

  const enrollments = await replicaClient.studentEnrollment.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, roll_no: true, section_id: true } },
    },
  });

  const results = { promoted: [], skipped: [], failed: [], total: enrollments.length };

  for (const enrollment of enrollments) {
    if (enrollment.semester >= 8) {
      results.skipped.push({
        id: enrollment.student.id,
        name: enrollment.student.name,
        reason: "Already at max semester (8) — graduated",
      });
      continue;
    }

    const next = getNextSemester(enrollment.semester, enrollment.academic_year);
    if (!next) {
      results.skipped.push({ id: enrollment.student.id, name: enrollment.student.name, reason: "No next semester" });
      continue;
    }

    try {
      await masterClient.$transaction(async (tx) => {
        await tx.studentEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "COMPLETED" },
        });
        await tx.studentEnrollment.create({
          data: {
            student_id: enrollment.student.id,
            section_id: enrollment.student.section_id,
            academic_year: next.academic_year,
            semester: next.semester,
            session: `${next.academic_year} SEM ${next.semester}`,
            status: "ACTIVE",
          },
        });
      });

      results.promoted.push({
        id: enrollment.student.id,
        name: enrollment.student.name,
        roll_number: enrollment.student.roll_no,
        from: { semester: enrollment.semester, academic_year: enrollment.academic_year },
        to: { semester: next.semester, academic_year: next.academic_year },
      });
    } catch (err) {
      results.failed.push({ id: enrollment.student.id, name: enrollment.student.name, reason: err.message });
    }
  }

  return results;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE SECTION — move student(s) to a different section (NOT promote)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Change a single student's section.
 * Updates: student.section_id, student.course_id, student.program_id, student.dept_id
 * Also updates their current active enrollment's section_id.
 */
export const changeStudentSection = async (student_id, new_section_id) => {
  const [student, newSection] = await Promise.all([
    replicaClient.student.findUnique({
      where: { id: student_id },
      include: {
        enrollments: { where: { status: "ACTIVE" }, take: 1 },
      },
    }),
    replicaClient.section.findUnique({
      where: { id: new_section_id },
      include: { course: { include: { program: { include: { department: true } } } } },
    }),
  ]);

  if (!student) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }
  if (!newSection) { const e = new Error("Section not found"); e.statusCode = 404; throw e; }

  const course_id = newSection.course_id;
  const program_id = newSection.course.program_id;
  const dept_id = newSection.course.program.dept_id;

  return masterClient.$transaction(async (tx) => {
    // Update student
    await tx.student.update({
      where: { id: student_id },
      data: { section_id: new_section_id, course_id, program_id, dept_id },
    });

    // Update active enrollment's section
    if (student.enrollments[0]) {
      await tx.studentEnrollment.update({
        where: { id: student.enrollments[0].id },
        data: { section_id: new_section_id },
      });
    }

    return tx.student.findUnique({ where: { id: student_id }, include: studentInclude });
  });
};

/**
 * Bulk change section for multiple students.
 * @param {string[]} student_ids
 * @param {string}   new_section_id
 */
export const bulkChangeSection = async (student_ids, new_section_id) => {
  const newSection = await replicaClient.section.findUnique({
    where: { id: new_section_id },
    include: { course: { include: { program: { include: { department: true } } } } },
  });
  if (!newSection) { const e = new Error("Target section not found"); e.statusCode = 404; throw e; }

  const course_id = newSection.course_id;
  const program_id = newSection.course.program_id;
  const dept_id = newSection.course.program.dept_id;

  const results = { success: [], failed: [], total: student_ids.length };

  for (const student_id of student_ids) {
    try {
      const student = await replicaClient.student.findUnique({
        where: { id: student_id },
        include: {
          enrollments: { where: { status: "ACTIVE" }, take: 1 },
        },
      });
      if (!student) { results.failed.push({ id: student_id, reason: "Student not found" }); continue; }

      await masterClient.$transaction(async (tx) => {
        await tx.student.update({
          where: { id: student_id },
          data: { section_id: new_section_id, course_id, program_id, dept_id },
        });
        if (student.enrollments[0]) {
          await tx.studentEnrollment.update({
            where: { id: student.enrollments[0].id },
            data: { section_id: new_section_id },
          });
        }
      });

      results.success.push({ id: student.id, name: student.name, roll_number: student.roll_no });
    } catch (err) {
      results.failed.push({ id: student_id, reason: err.message });
    }
  }

  return results;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE + BULK UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════


// ── Column definitions (shared between template and parser) ──────
const STUDENT_COLS = [
  { key: "email*", field: "email", required: true },
  { key: "password", field: "password", required: false },
  { key: "first_name*", field: "first_name", required: true },
  { key: "last_name*", field: "last_name", required: true },
  { key: "roll_number*", field: "roll_number", required: true },
  { key: "enrollment_no", field: "enrollment_no", required: false },
  { key: "group_no", field: "group_no", required: false },
  { key: "contact_number*", field: "contact_number", required: true },
  { key: "alt_contact_number", field: "alt_contact_number", required: false },
  { key: "personal_email", field: "personal_email", required: false },
  { key: "father_name*", field: "father_name", required: true },
  { key: "mother_name*", field: "mother_name", required: true },
  { key: "father_mobile", field: "father_mobile", required: false },
  { key: "mother_mobile", field: "mother_mobile", required: false },
  { key: "gender (MALE/FEMALE/OTHER)", field: "gender", required: false },
  { key: "dob (YYYY-MM-DD)", field: "dob", required: false },
  { key: "batch_year", field: "batch_year", required: false },
  { key: "session", field: "session", required: false },
  { key: "mode_of_admission", field: "mode_of_admission", required: false },
  { key: "admission_year", field: "admission_year", required: false },
  { key: "admission_date (YYYY-MM-DD)", field: "admission_date", required: false },
  { key: "is_hosteller (true/false)", field: "is_hosteller", required: false },
  { key: "is_using_transport (true/false)", field: "is_using_transport", required: false },
  { key: "nick_name", field: "nick_name", required: false },
  { key: "category", field: "category", required: false },
  { key: "religion", field: "religion", required: false },
  { key: "biometric_id", field: "biometric_id", required: false },
  { key: "local_address", field: "local_address", required: false },
  { key: "local_address_city", field: "local_address_city", required: false },
  { key: "local_address_state", field: "local_address_state", required: false },
  { key: "local_address_zipcode", field: "local_address_zipcode", required: false },
  { key: "permanent_address", field: "permanent_address", required: false },
  { key: "permanent_address_city", field: "permanent_address_city", required: false },
  { key: "permanent_address_state", field: "permanent_address_state", required: false },
  { key: "permanent_address_zipcode", field: "permanent_address_zipcode", required: false },
  { key: "aadhar_no", field: "aadhar_no", required: false },
  { key: "pan_no", field: "pan_no", required: false },
];

// Section-specific locked columns (not editable by user, pre-filled)
const LOCKED_COLS = ["section_id", "academic_year*", "semester*", "section_name", "course", "program", "batch"];

// Safe sheet name (Excel limit: 31 chars, no special chars)
const safeSheetName = (() => {
  const _used = new Set();
  return (s) => {
    // Format: "Program Course–Sec SemX" — consistent with subject/feedback templates
    const prog = s.course?.program?.name || "";
    const course = s.course?.name || "";
    const sem = s.semester ? `Sem${s.semester}` : "";
    const sec = s.name || "";
    let base = (`${prog} ${course}–${sec} ${sem}`).replace(/[\\/*?:[\]]/g, "").trim()
      .replace(/\s+/g, " ");
    let name = base.substring(0, 31);
    if (_used.has(name)) {
      let i = 2;
      while (_used.has(name)) {
        const suffix = `(${i++})`;
        name = base.substring(0, 31 - suffix.length) + suffix;
      }
    }
    _used.add(name);
    return name;
  };
})();


// ═══════════════════════════════════════════════════════════════════════════════
// ENROLLMENT STATUS — update status on current enrollment
// Valid statuses: ACTIVE | DETAINED | PASSED | PROMOTED | RE_DETAINED
// ═══════════════════════════════════════════════════════════════════════════════
export const updateEnrollmentStatus = async (id, { status, remarks }) => {
  const VALID = ["ACTIVE", "DETAINED", "PASSED", "PROMOTED", "RE_DETAINED"];
  if (!VALID.includes(status)) {
    const e = new Error(`Invalid status "${status}". Must be one of: ${VALID.join(", ")}`);
    e.statusCode = 400; throw e;
  }
  const student = await replicaClient.student.findUnique({
    where: { id },
    include: { enrollments: { where: { is_current: true }, orderBy: { enrolled_at: "desc" }, take: 1 } },
  });
  if (!student) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }
  const enrollment = student.enrollments[0];
  if (!enrollment) { const e = new Error("No current enrollment found"); e.statusCode = 400; throw e; }
  return masterClient.studentEnrollment.update({
    where: { id: enrollment.id },
    data: { status, ...(remarks !== undefined && { remarks }) },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMOTE — move student back one semester
// ═══════════════════════════════════════════════════════════════════════════════
export const demoteStudent = async (id) => {
  const student = await replicaClient.student.findUnique({
    where: { id },
    include: { enrollments: { where: { is_current: true }, orderBy: { enrolled_at: "desc" }, take: 1 } },
  });
  if (!student) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }
  const enrollment = student.enrollments[0];
  if (!enrollment) { const e = new Error("No current enrollment found"); e.statusCode = 400; throw e; }
  if (enrollment.semester <= 1) { const e = new Error("Already at Semester 1 — cannot demote further"); e.statusCode = 400; throw e; }

  const prevSem = enrollment.semester - 1;
  // If going from odd to even, roll back academic year
  const [y1, y2] = enrollment.academic_year.split("-").map(Number);
  const prevYear = enrollment.semester % 2 === 1 ? `${y1 - 1}-${y2 - 1}` : enrollment.academic_year;

  return masterClient.$transaction(async (tx) => {
    await tx.studentEnrollment.update({ where: { id: enrollment.id }, data: { status: "COMPLETED", is_current: false } });
    await tx.studentEnrollment.create({
      data: {
        student_id: student.id,
        section_id: student.section_id,
        dept_id: enrollment.dept_id,
        course_id: enrollment.course_id,
        program_id: enrollment.program_id,
        academic_year: prevYear,
        semester: prevSem,
        batch_year: enrollment.batch_year ?? 0,
        status: "ACTIVE",
        is_current: true,
        remarks: "Demoted by admin",
      },
    });
    return replicaClient.student.findUnique({ where: { id }, include: studentInclude });
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// BULK DEMOTE — demote multiple students
// ═══════════════════════════════════════════════════════════════════════════════
export const bulkDemoteStudents = async (ids) => {
  const results = { updated: [], skipped: [], failed: [] };
  for (const id of ids) {
    try {
      await demoteStudent(id);
      results.updated.push(id);
    } catch (e) {
      if (e.statusCode === 400) results.skipped.push({ id, reason: e.message });
      else results.failed.push({ id, reason: e.message });
    }
  }
  return results;
};

export const generateStudentTemplate = async () => {
  const sections = await prisma.section.findMany({
    select: {
      id: true, name: true, semester: true, batch: true,
      course: {
        select: {
          name: true,
          program: { select: { name: true, department: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ course: { name: "asc" } }, { semester: "asc" }, { name: "asc" }],
  });

  const wb = xlsx.utils.book_new();

  // ── One sheet per section ─────────────────────────────────────
  for (const sec of sections) {
    // Build header row: locked meta cols first, then student data cols
    const lockedHeaders = [
      "section_id",
      "academic_year* (e.g. 2024-2025)",
      "semester*",
      "section_name",
      "course",
      "program",
      "department",
      "batch",
    ];
    const dataHeaders = STUDENT_COLS.map((c) => c.key);
    const allHeaders = [...lockedHeaders, ...dataHeaders];

    // Example row — locked cols pre-filled, data cols empty
    const year = (() => {
      const now = new Date().getFullYear();
      return `${now}-${now + 1}`;
    })();
    const lockedValues = [
      sec.id,
      year,
      sec.semester,
      sec.name,
      sec.course?.name || "",
      sec.course?.program?.name || "",
      sec.course?.program?.department?.name || "",
      sec.batch || "",
    ];
    const exampleValues = [
      "student@college.edu", "Student@123",
      "Aarav", "Sharma", "RN001",
      "", "", "9876543210", "", "",
      "Mr. Raj Sharma", "Mrs. Priya Sharma", "", "",
      "MALE", "2006-05-15", year.split("-")[0], year,
      "Regular", "", "", "false", "false",
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ];

    const ws = xlsx.utils.aoa_to_sheet([allHeaders, [...lockedValues, ...exampleValues]]);

    // Column widths
    ws["!cols"] = allHeaders.map((h, i) => ({
      wch: i < lockedHeaders.length ? Math.max(h.length + 2, 20) : Math.max(h.length + 2, 16),
    }));

    // Freeze top row
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    // Lock the first 8 columns (section metadata) — grey them out via cell style hint in header
    // Mark locked cols in header with 🔒
    for (let i = 0; i < lockedHeaders.length; i++) {
      const cell = xlsx.utils.encode_cell({ r: 0, c: i });
      if (ws[cell]) ws[cell].v = `🔒 ${lockedHeaders[i]}`;
    }

    xlsx.utils.book_append_sheet(wb, ws, safeSheetName(sec));
  }

  // ── Instructions sheet ────────────────────────────────────────
  const instructions = [
    ["STUDENT BULK UPLOAD — INSTRUCTIONS"],
    [""],
    ["STRUCTURE"],
    ["  • Each sheet = one section (named: Course–Section SemX)"],
    ["  • 🔒 locked columns (first 8) are pre-filled — DO NOT edit them"],
    ["  • Add student rows starting from row 3 (row 2 is the example — delete or keep)"],
    [""],
    ["REQUIRED COLUMNS (marked with *)"],
    ["  email*, first_name*, last_name*, roll_number*, contact_number*, father_name*, mother_name*"],
    ["  academic_year* and semester* are pre-filled from the section"],
    [""],
    ["FIELD FORMATS"],
    ["  academic_year : 2024-2025"],
    ["  semester      : 1–8 (integer)"],
    ["  gender        : MALE | FEMALE | OTHER"],
    ["  dob / admission_date : YYYY-MM-DD"],
    ["  is_hosteller / is_using_transport : true | false"],
    ["  password      : defaults to Student@123 if blank"],
    ["  group_no      : optional, e.g. G1 or House-A"],
    [""],
    ["UPLOAD"],
    ["  • Upload the entire workbook — ALL section sheets will be processed"],
    ["  • Duplicate emails / roll numbers will be reported as failures"],
    ["  • section_id is taken from the locked column — do not change it"],
    [""],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [`Total sections: ${sections.length}`],
  ];
  const wsI = xlsx.utils.aoa_to_sheet(instructions);
  wsI["!cols"] = [{ wch: 75 }];
  xlsx.utils.book_append_sheet(wb, wsI, "Instructions");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

export const bulkCreateStudents = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });

  // Collect rows from ALL sheets EXCEPT Instructions
  const SKIP_SHEETS = new Set(["instructions", "readme", "ref", "reference"]);
  const allRows = [];

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName.toLowerCase())) continue;

    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (!rows.length) continue;

    // Detect if this is a section sheet by checking for section_id column (locked)
    const firstRow = rows[0];
    const sectionIdVal =
      firstRow["🔒 section_id"] || firstRow["section_id"] ||
      firstRow["section_id*"] || "";

    for (const row of rows) {
      // Skip example/header-looking rows
      const email = String(
        row["email*"] || row["email"] || ""
      ).trim().toLowerCase();
      if (!email || email === "student@college.edu" || email.includes("example.com")) continue;

      // Extract section_id — from locked col or regular col
      const section_id = String(
        row["🔒 section_id"] || row["section_id"] || sectionIdVal || ""
      ).trim();

      // Extract academic_year + semester from locked cols
      const academic_year = String(
        row["🔒 academic_year* (e.g. 2024-2025)"] ||
        row["academic_year* (e.g. 2024-2025)"] ||
        row["academic_year*"] ||
        row["academic_year"] || ""
      ).trim();

      const semester_raw = String(
        row["🔒 semester*"] || row["semester*"] || row["semester"] || ""
      ).trim();

      allRows.push({ row, sheetName, section_id, academic_year, semester_raw });
    }
  }

  const results = { created: [], failed: [], total: allRows.length };

  for (let i = 0; i < allRows.length; i++) {
    const { row, sheetName, section_id, academic_year, semester_raw } = allRows[i];

    const email = String(row["email*"] || row["email"] || "").trim();
    const first_name = String(row["first_name*"] || row["first_name"] || "").trim();
    const last_name = String(row["last_name*"] || row["last_name"] || "").trim();
    const roll_number = String(row["roll_number*"] || row["roll_number"] || "").trim();
    const contact_number = String(row["contact_number*"] || row["contact_number"] || "").trim();
    const father_name = String(row["father_name*"] || row["father_name"] || "").trim();
    const mother_name = String(row["mother_name*"] || row["mother_name"] || "").trim();

    const rowLabel = `Sheet "${sheetName}" row ${i + 2}`;

    if (!email) { results.failed.push({ row: rowLabel, reason: "email required" }); continue; }
    if (!first_name) { results.failed.push({ row: rowLabel, reason: "first_name required" }); continue; }
    if (!last_name) { results.failed.push({ row: rowLabel, reason: "last_name required" }); continue; }
    if (!roll_number) { results.failed.push({ row: rowLabel, reason: "roll_number required" }); continue; }
    if (!section_id) { results.failed.push({ row: rowLabel, reason: "section_id missing — check locked column" }); continue; }
    if (!academic_year) { results.failed.push({ row: rowLabel, reason: "academic_year missing" }); continue; }
    if (!contact_number) { results.failed.push({ row: rowLabel, reason: "contact_number required" }); continue; }
    if (!father_name) { results.failed.push({ row: rowLabel, reason: "father_name required" }); continue; }
    if (!mother_name) { results.failed.push({ row: rowLabel, reason: "mother_name required" }); continue; }

    const semester = parseInt(semester_raw);
    if (!semester || semester < 1 || semester > 8) {
      results.failed.push({ row: rowLabel, reason: `Invalid semester: "${semester_raw}"` }); continue;
    }

    const str = (keys) => {
      for (const k of keys) {
        const v = String(row[k] || "").trim();
        if (v) return v;
      }
      return null;
    };

    try {
      const student = await createStudent({
        email,
        password: str(["password"]) || "Student@123",
        first_name, last_name,
        name: `${first_name} ${last_name}`,
        roll_number, section_id, academic_year, semester,
        enrollment_no: str(["enrollment_no"]),
        group_no: str(["group_no"]),
        contact_number,
        alt_contact_number: str(["alt_contact_number"]),
        personal_email: str(["personal_email"]),
        father_name, mother_name,
        father_mobile: str(["father_mobile"]),
        mother_mobile: str(["mother_mobile"]),
        gender: str(["gender (MALE/FEMALE/OTHER)", "gender"])?.toUpperCase() || null,
        dob: str(["dob (YYYY-MM-DD)", "dob"]),
        batch_year: str(["batch_year"]),
        session: str(["session"]),
        mode_of_admission: str(["mode_of_admission"]),
        admission_year: str(["admission_year"]),
        admission_date: str(["admission_date (YYYY-MM-DD)", "admission_date"]),
        is_hosteller: str(["is_hosteller (true/false)", "is_hosteller"]) === "true",
        is_using_transport: str(["is_using_transport (true/false)", "is_using_transport"]) === "true",
        nick_name: str(["nick_name"]),
        category: str(["category"]),
        religion: str(["religion"]),
        biometric_id: str(["biometric_id"]),
        local_address: str(["local_address"]),
        local_address_city: str(["local_address_city"]),
        local_address_state: str(["local_address_state"]),
        local_address_zipcode: str(["local_address_zipcode"]),
        permanent_address: str(["permanent_address"]),
        permanent_address_city: str(["permanent_address_city"]),
        permanent_address_state: str(["permanent_address_state"]),
        permanent_address_zipcode: str(["permanent_address_zipcode"]),
        aadhar_no: str(["aadhar_no"]),
        pan_no: str(["pan_no"]),
      });
      results.created.push({ row: rowLabel, id: student.id, name: student.name, roll_number: student.roll_no });
    } catch (err) {
      results.failed.push({ row: rowLabel, email, reason: err.message });
    }
  }

  return results;
};