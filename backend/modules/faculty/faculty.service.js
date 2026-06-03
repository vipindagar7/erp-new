import bcrypt from "bcrypt";
import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";

// ── Include ────────────────────────────────────────────────────
const facultyInclude = {
  user: { select: { id: true, email: true, role: true, isBlocked: true } },
  department: { select: { id: true, name: true } },
  subjects: { include: { subject: { select: { id: true, name: true, code: true, category: true } } } },
  coordinating_sections: {
    select: {
      id: true, name: true, semester: true, batch: true,
      course: { select: { id: true, name: true } }
    },
  },
  sectionSubjects: {
    include: {
      section: {
        select: {
          id: true, name: true, semester: true, batch: true,
          course: { select: { id: true, name: true } }
        }
      },
      subject: { select: { id: true, name: true, code: true } },
    },
    where: { status: "ACTIVE" },
  },
};

// ══════════════════════════════════════════════════════════════
// GET ALL
// ══════════════════════════════════════════════════════════════
export const getAllFaculty = async ({ limit = 200, page = 1, search, dept_id } = {}) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (dept_id) where.dept_id = dept_id;
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { emp_id: { contains: search, mode: "insensitive" } },
    { user: { email: { contains: search, mode: "insensitive" } } },
  ];
  const [faculty, total] = await Promise.all([
    prisma.faculty.findMany({ where, skip, take: limit, orderBy: [{ name: "asc" }], include: facultyInclude }),
    prisma.faculty.count({ where }),
  ]);
  return { faculty, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};


// ══════════════════════════════════════════════════════════════
// GET BY ID
// ══════════════════════════════════════════════════════════════
export const getFacultyById = (id) =>
  prisma.faculty.findUnique({ where: { id }, include: facultyInclude });

export const getFacultyByUserId = (user_id) =>
  prisma.faculty.findUnique({ where: { user_id }, include: facultyInclude });

// ══════════════════════════════════════════════════════════════
// CREATE
// ══════════════════════════════════════════════════════════════
export const createFaculty = async (data) => {
  // Email uniqueness check
  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) throw Object.assign(new Error(`Email "${data.email}" is already registered`), { status: 409 });

  // Emp ID uniqueness check
  if (data.emp_id) {
    const dupEmp = await prisma.faculty.findUnique({ where: { emp_id: data.emp_id }, select: { id: true } });
    if (dupEmp) throw Object.assign(new Error(`Employee ID "${data.emp_id}" is already in use`), { status: 409 });
  }

  const hash = await bcrypt.hash(data.password || "Faculty@123", 12);

  return prisma.$transaction(async (tx) => {
    const p = (v) => (v && v !== "" ? v : undefined);
    const faculty = await tx.faculty.create({
      data: {
        name: data.name,
        ...(p(data.first_name) && { first_name: data.first_name }),
        ...(p(data.last_name) && { last_name: data.last_name }),
        ...(p(data.nick_name) && { nick_name: data.nick_name }),
        ...(p(data.emp_id) && { emp_id: data.emp_id }),
        ...(p(data.designation) && { designation: data.designation }),
        ...(p(data.employee_type) && { employee_type: data.employee_type }),
        ...(p(data.phone) && { phone: data.phone }),
        ...(p(data.personal_email) && { personal_email: data.personal_email }),
        ...(p(data.gender) && { gender: data.gender }),
        ...(data.dob && { dob: data.dob }),
        ...(data.joining_date && { joining_date: data.joining_date }),
        ...(p(data.religion) && { religion: data.religion }),
        ...(p(data.category) && { category: data.category }),
        ...(p(data.aadhar_no) && { aadhar_no: data.aadhar_no }),
        ...(p(data.pan_no) && { pan_no: data.pan_no }),
        status: data.status || "ACTIVE",
        ...(data.dept_id && { department: { connect: { id: data.dept_id } } }),
        user: { create: { email: data.email, passwordHash: hash, role: "FACULTY" } },
        ...(data.subject_ids?.length && {
          subjects: { create: data.subject_ids.map((subject_id) => ({ subject_id })) },
        }),
      },
      include: facultyInclude,
    });
    return faculty;
  });
};

// ══════════════════════════════════════════════════════════════
// UPDATE
// ══════════════════════════════════════════════════════════════
export const updateFaculty = async (id, data) => {
  const updateData = {};
  const opt = (v) => v || null;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.first_name !== undefined) updateData.first_name = opt(data.first_name);
  if (data.last_name !== undefined) updateData.last_name = opt(data.last_name);
  if (data.nick_name !== undefined) updateData.nick_name = opt(data.nick_name);
  if (data.designation !== undefined) updateData.designation = opt(data.designation);
  if (data.employee_type !== undefined) updateData.employee_type = opt(data.employee_type);
  if (data.phone !== undefined) updateData.phone = opt(data.phone);
  if (data.personal_email !== undefined) updateData.personal_email = opt(data.personal_email);
  if (data.gender !== undefined) updateData.gender = opt(data.gender);
  if (data.dob !== undefined) updateData.dob = data.dob || null;
  if (data.joining_date !== undefined) updateData.joining_date = data.joining_date || null;
  if (data.religion !== undefined) updateData.religion = opt(data.religion);
  if (data.category !== undefined) updateData.category = opt(data.category);
  if (data.aadhar_no !== undefined) updateData.aadhar_no = opt(data.aadhar_no);
  if (data.pan_no !== undefined) updateData.pan_no = opt(data.pan_no);
  if (data.status !== undefined) updateData.status = data.status || "ACTIVE";
  if (data.dept_id !== undefined) {
    if (data.dept_id) {
      updateData.department = { connect: { id: data.dept_id } };
    } else {
      updateData.department = { disconnect: true };
    }
  }

  // Emp ID — check uniqueness
  if (data.emp_id !== undefined) {
    const val = data.emp_id || null;
    if (val) {
      const dup = await prisma.faculty.findFirst({ where: { emp_id: val, NOT: { id } }, select: { id: true } });
      if (dup) throw Object.assign(new Error(`Employee ID "${val}" is already in use`), { status: 409 });
    }
    updateData.emp_id = val;
  }

  // Subjects — full replace if provided
  if (data.subject_ids !== undefined) {
    // Delete existing then re-create
    await prisma.facultySubject.deleteMany({ where: { faculty_id: id } });
    if (data.subject_ids.length > 0) {
      await prisma.facultySubject.createMany({
        data: data.subject_ids.map((subject_id) => ({ faculty_id: id, subject_id })),
        skipDuplicates: true,
      });
    }
  }

  return prisma.faculty.update({ where: { id }, data: updateData, include: facultyInclude });
};

// ══════════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════════
export const deleteFaculty = async (id) => {
  // Check active assignments
  const sections = await prisma.sectionSubject.count({
    where: {
      faculty_id: id,
      status: "ACTIVE",
    },
  });

  if (sections > 0) {
    throw Object.assign(
      new Error(
        `Cannot delete: faculty is actively teaching ${sections} section subject(s). Remove assignments first.`
      ),
      { status: 400 }
    );
  }

  // Find faculty with linked user
  const faculty = await prisma.faculty.findUnique({
    where: { id },
    select: {
      id: true,
      user_id: true,
    },
  });

  if (!faculty) {
    throw Object.assign(
      new Error("Faculty not found"),
      { status: 404 }
    );
  }

  // Delete faculty
  await prisma.faculty.delete({
    where: { id },
  });

  // Delete linked user
  if (faculty.user_id) {
    await prisma.user.delete({
      where: {
        id: faculty.user_id,
      },
    });
  }

  return {
    success: true,
    message: "Faculty and linked user deleted successfully",
  };
};
// ══════════════════════════════════════════════════════════════
// BLOCK / UNBLOCK
// ══════════════════════════════════════════════════════════════
export const toggleBlock = async (id, isBlocked) => {
  const f = await prisma.faculty.findUnique({ where: { id } });
  if (!f) throw Object.assign(new Error("Faculty not found"), { status: 404 });
  return prisma.faculty.update({
    where: { id },
    data: { user: { update: { isBlocked } } },
    include: facultyInclude,
  });
};

// ══════════════════════════════════════════════════════════════
// ASSIGN SUBJECTS
// ══════════════════════════════════════════════════════════════
export const assignSubjects = async (id, subject_ids) => {
  await prisma.facultySubject.deleteMany({ where: { faculty_id: id } });
  if (subject_ids.length > 0) {
    await prisma.facultySubject.createMany({
      data: subject_ids.map((subject_id) => ({ faculty_id: id, subject_id })),
      skipDuplicates: true,
    });
  }
  return prisma.faculty.findUnique({ where: { id }, include: facultyInclude });
};

// ══════════════════════════════════════════════════════════════
// BULK CREATE
// ══════════════════════════════════════════════════════════════
export const bulkCreateFaculty = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [], total: rows.length };

  for (const row of rows) {
    const email = String(row["Email*"] || row.email || "").trim();
    const name = String(row["Name*"] || row.name || "").trim();
    if (!email || !name) { results.failed.push({ row, reason: "Email and Name required" }); continue; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { results.failed.push({ row, reason: `Invalid email: ${email}` }); continue; }

    try {
      const f = await createFaculty({
        email, name,
        password: String(row["Password"] || "Faculty@123").trim(),
        emp_id: String(row["Emp ID"] || "").trim() || undefined,
        designation: String(row["Designation"] || "").trim() || undefined,
        phone: String(row["Phone"] || "").trim() || undefined,
      });
      results.created.push({ id: f.id, email, name: f.name });
    } catch (e) { results.failed.push({ row, reason: e.message }); }
  }
  return results;
};

// ══════════════════════════════════════════════════════════════
// TEMPLATE
// ══════════════════════════════════════════════════════════════
export const generateTemplate = () => {
  const headers = ["Email*", "Password", "Name*", "Emp ID", "Designation", "Phone"];
  const sample = ["faculty@college.edu", "Faculty@123", "Dr. John Doe", "EMP001", "Assistant Professor", "9876543210"];
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};