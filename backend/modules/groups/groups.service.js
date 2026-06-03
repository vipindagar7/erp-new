import prisma from "../../utils/prisma.js";

// ── Includes ───────────────────────────────────────────────────
const groupInclude = {
  _count: { select: { members: true } },
};
const groupDetailInclude = {
  members: {
    include: {
      student: {
        select: {
          id: true, name: true, roll_no: true, enrollment_no: true,
          user: { select: { email: true } },
          department: { select: { id: true, name: true } },
          section: { select: { id: true, name: true, semester: true } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  },
  _count: { select: { members: true } },
};
const fgDetailInclude = {
  members: {
    include: {
      faculty: {
        select: {
          id: true, name: true, emp_id: true, designation: true,
          user: { select: { email: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  },
  _count: { select: { members: true } },
};

// ══════════════════════════════════════════════════════════════
// SPECIAL STUDENT GROUPS
// ══════════════════════════════════════════════════════════════

export const getAllGroups = async ({ page = 1, limit = 20, search, type } = {}) => {
  const where = {
    ...(type && { type }),
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };
  const [groups, total] = await Promise.all([
    prisma.specialGroup.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: groupInclude,
    }),
    prisma.specialGroup.count({ where }),
  ]);
  return { groups, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getGroupById = (id) =>
  prisma.specialGroup.findUnique({ where: { id }, include: groupDetailInclude });

export const createGroup = (data, userId) =>
  prisma.specialGroup.create({
    data: {
      name: data.name,
      description: data.description || null,
      type: data.type || "OTHER",
      created_by: userId,
    },
    include: groupInclude,
  });

export const updateGroup = (id, data) =>
  prisma.specialGroup.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.type !== undefined && { type: data.type }),
    },
    include: groupInclude,
  });

export const deleteGroup = async (id) => {
  return prisma.specialGroup.delete({ where: { id } });
};

// ── Group members ──────────────────────────────────────────────

/** Add students by array of student IDs */
export const addStudentsById = async (group_id, student_ids, remarks) => {
  const results = { added: [], skipped: [], failed: [] };
  for (const student_id of student_ids) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: student_id }, select: { id: true, name: true },
      });
      if (!student) { results.failed.push({ student_id, reason: "Student not found" }); continue; }

      const existing = await prisma.specialGroupMember.findUnique({
        where: { group_id_student_id: { group_id, student_id } },
      });
      if (existing) { results.skipped.push({ student_id, name: student.name, reason: "Already in group" }); continue; }

      await prisma.specialGroupMember.create({
        data: { group_id, student_id },
      });
      results.added.push({ student_id, name: student.name });
    } catch (e) { results.failed.push({ student_id, reason: e.message }); }
  }
  return results;
};

/** Add students by array of emails */
export const addStudentsByEmail = async (group_id, emails, remarks) => {
  const results = { added: [], skipped: [], failed: [], not_found: [] };
  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) continue;
    try {
      const user = await prisma.user.findUnique({
        where: { email: trimmed },
        include: { student: { select: { id: true, name: true } } },
      });
      if (!user || !user.student) { results.not_found.push({ email: trimmed, reason: "No student found with this email" }); continue; }

      const student_id = user.student.id;
      const existing = await prisma.specialGroupMember.findUnique({
        where: { group_id_student_id: { group_id, student_id } },
      });
      if (existing) { results.skipped.push({ email: trimmed, name: user.student.name, reason: "Already in group" }); continue; }

      await prisma.specialGroupMember.create({
        data: { group_id, student_id },
      });
      results.added.push({ email: trimmed, name: user.student.name });
    } catch (e) { results.failed.push({ email: trimmed, reason: e.message }); }
  }
  return results;
};

/** Add ALL students from a section */
export const addStudentsBySection = async (group_id, section_ids, remarks) => {
  const students = await prisma.student.findMany({
    where: { section_id: { in: section_ids } },
    select: { id: true, name: true },
  });
  const ids = students.map((s) => s.id);
  return addStudentsById(group_id, ids, remarks);
};

/** Remove members */
export const removeStudentsFromGroup = async (group_id, student_ids) => {
  const result = await prisma.specialGroupMember.deleteMany({
    where: { group_id, student_id: { in: student_ids } },
  });
  return { removed: result.count };
};

/** Remove single member */
export const removeStudentFromGroup = async (group_id, student_id) => {
  return prisma.specialGroupMember.delete({
    where: { group_id_student_id: { group_id, student_id } },
  });
};

// ══════════════════════════════════════════════════════════════
// FACULTY GROUPS
// ══════════════════════════════════════════════════════════════

export const getAllFacultyGroups = async ({ page = 1, limit = 20, search, type } = {}) => {
  const where = {
    ...(type && { type }),
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };
  const [groups, total] = await Promise.all([
    prisma.facultyGroup.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    prisma.facultyGroup.count({ where }),
  ]);
  return { groups, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const getFacultyGroupById = (id) =>
  prisma.facultyGroup.findUnique({ where: { id }, include: fgDetailInclude });

export const createFacultyGroup = (data, userId) =>
  prisma.facultyGroup.create({
    data: {
      name: data.name,
      description: data.description || null,
      type: data.type || "OTHER",
      created_by: userId,
    },
    include: { _count: { select: { members: true } } },
  });

export const updateFacultyGroup = (id, data) =>
  prisma.facultyGroup.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.type !== undefined && { type: data.type }),
    },
    include: { _count: { select: { members: true } } },
  });

export const deleteFacultyGroup = (id) =>
  prisma.facultyGroup.delete({ where: { id } });

export const addFacultyById = async (group_id, faculty_ids, remarks) => {
  const results = { added: [], skipped: [], failed: [] };
  for (const faculty_id of faculty_ids) {
    try {
      const faculty = await prisma.faculty.findUnique({
        where: { id: faculty_id }, select: { id: true, name: true },
      });
      if (!faculty) { results.failed.push({ faculty_id, reason: "Faculty not found" }); continue; }

      const existing = await prisma.facultyGroupMember.findUnique({
        where: { group_id_faculty_id: { group_id, faculty_id } },
      });
      if (existing) { results.skipped.push({ faculty_id, name: faculty.name, reason: "Already in group" }); continue; }

      await prisma.facultyGroupMember.create({ data: { group_id, faculty_id } });
      results.added.push({ faculty_id, name: faculty.name });
    } catch (e) { results.failed.push({ faculty_id, reason: e.message }); }
  }
  return results;
};

export const addFacultyByEmail = async (group_id, emails, remarks) => {
  const results = { added: [], skipped: [], not_found: [], failed: [] };
  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) continue;
    try {
      const user = await prisma.user.findUnique({
        where: { email: trimmed },
        include: { faculty: { select: { id: true, name: true } } },
      });
      if (!user || !user.faculty) { results.not_found.push({ email: trimmed, reason: "No faculty found with this email" }); continue; }

      const faculty_id = user.faculty.id;
      const existing = await prisma.facultyGroupMember.findUnique({
        where: { group_id_faculty_id: { group_id, faculty_id } },
      });
      if (existing) { results.skipped.push({ email: trimmed, name: user.faculty.name }); continue; }

      await prisma.facultyGroupMember.create({ data: { group_id, faculty_id } });
      results.added.push({ email: trimmed, name: user.faculty.name });
    } catch (e) { results.failed.push({ email: trimmed, reason: e.message }); }
  }
  return results;
};

export const removeFacultyFromGroup = async (group_id, faculty_id) =>
  prisma.facultyGroupMember.delete({
    where: { group_id_faculty_id: { group_id, faculty_id } },
  });

export const removeFacultyBulk = async (group_id, faculty_ids) => {
  const r = await prisma.facultyGroupMember.deleteMany({
    where: { group_id, faculty_id: { in: faculty_ids } },
  });
  return { removed: r.count };
};