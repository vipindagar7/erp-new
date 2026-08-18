// backend/modules/faculty/faculty.service.new.js
// QUALIFICATION + PRIMARY/SECONDARY ROLE methods
// Merge these into existing faculty.service.js
import prisma from "../../utils/prisma.js";

const QUAL_LEVELS = ["TENTH","TWELFTH","DIPLOMA","BACHELOR","MASTER","PHD","OTHER"];
const MANDATORY_TEACHING = ["TENTH","TWELFTH"];

// ── Get qualifications ─────────────────────────────────────────
export const getQualifications = (faculty_id) =>
  prisma.facultyQualification.findMany({
    where:   { faculty_id },
    orderBy: [
      { level: "asc" },
    ],
  });

// ── Add or update qualification ───────────────────────────────
export const upsertQualification = async (faculty_id, data) => {
  const { level, ...rest } = data;
  if (!QUAL_LEVELS.includes(level))
    throw Object.assign(new Error(`Invalid level. Use: ${QUAL_LEVELS.join(", ")}`), { status: 400 });

  return prisma.facultyQualification.upsert({
    where:  { faculty_id_level: { faculty_id, level } },
    create: { faculty_id, level, ...rest },
    update: rest,
  });
};

// ── Delete qualification ──────────────────────────────────────
export const deleteQualification = async (faculty_id, level) => {
  const faculty = await prisma.faculty.findUnique({ where: { id: faculty_id }, select: { is_teaching: true } });
  if (faculty?.is_teaching && MANDATORY_TEACHING.includes(level))
    throw Object.assign(new Error(`${level} is mandatory for teaching faculty`), { status: 400 });

  return prisma.facultyQualification.delete({
    where: { faculty_id_level: { faculty_id, level } },
  });
};

// ── Validate teaching faculty has mandatory qualifications ─────
export const validateTeachingQualifications = async (faculty_id) => {
  const quals = await getQualifications(faculty_id);
  const levels = quals.map(q => q.level);
  const missing = MANDATORY_TEACHING.filter(l => !levels.includes(l));
  if (missing.length)
    throw Object.assign(
      new Error(`Teaching faculty must have: ${missing.join(", ")} qualifications`),
      { status: 400 }
    );
  return { valid: true, qualifications: quals };
};

// ── Set primary/secondary roles ───────────────────────────────
export const setFacultyRoles = async (faculty_id, { primary_role_id, secondary_role_id }) => {
  const update = {};
  if (primary_role_id   !== undefined) update.primary_role_id   = primary_role_id   || null;
  if (secondary_role_id !== undefined) update.secondary_role_id = secondary_role_id || null;

  const faculty = await prisma.faculty.update({
    where:   { id: faculty_id },
    data:    update,
    include: {
      primaryRole:   { select: { id: true, label: true, name: true } },
      secondaryRole: { select: { id: true, label: true, name: true } },
    },
  });

  // Also create UserRole entries for these roles
  if (primary_role_id && faculty.user_id) {
    await prisma.userRole.upsert({
      where:  { user_id_role_id_dept_id_section_id: { user_id: faculty.user_id, role_id: primary_role_id, dept_id: "", section_id: "" } },
      create: { user_id: faculty.user_id, role_id: primary_role_id, is_active: true },
      update: { is_active: true },
    }).catch(() => {});
  }

  return faculty;
};

// ── Bulk create faculty (with qualifications) ─────────────────
export const bulkCreateFaculty = async (records, created_by) => {
  const results = { created: [], failed: [] };

  for (const rec of records) {
    try {
      const { qualifications = [], primary_role_id, secondary_role_id, ...facultyData } = rec;

      // Hash password
      const { hashPassword } = await import("../../utils/hash.js");
      const passwordHash = await hashPassword(facultyData.password || facultyData.emp_id || "Faculty@123");

      // Create user
      const email = facultyData.email || `${facultyData.emp_id}@eitfaridabad.co.in`;
      const user  = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "FACULTY",
          must_change_password: true,
        },
      });

      // Create faculty
      const faculty = await prisma.faculty.create({
        data: {
          user_id: user.id,
          name:    facultyData.name,
          emp_id:  facultyData.emp_id,
          designation:    facultyData.designation,
          dept_id:        facultyData.dept_id     || null,
          is_teaching:    facultyData.is_teaching !== false,
          employee_type:  facultyData.employee_type || "REGULAR",
          joining_date:   facultyData.joining_date ? new Date(facultyData.joining_date) : null,
          phone:          facultyData.phone        || null,
          gender:         facultyData.gender       || null,
          primary_role_id:   primary_role_id   || null,
          secondary_role_id: secondary_role_id || null,
        },
      });

      // Add qualifications (if teaching faculty)
      if (faculty.is_teaching && qualifications.length) {
        for (const q of qualifications) {
          await prisma.facultyQualification.create({
            data: { faculty_id: faculty.id, ...q },
          }).catch(() => {});
        }
      }

      // Assign UserRole if primary role given
      if (primary_role_id) {
        await prisma.userRole.upsert({
          where:  { user_id_role_id_dept_id_section_id: { user_id: user.id, role_id: primary_role_id, dept_id: "", section_id: "" } },
          create: { user_id: user.id, role_id: primary_role_id, granted_by: created_by, is_active: true },
          update: { is_active: true },
        }).catch(() => {});
      }

      results.created.push({ faculty_id: faculty.id, name: faculty.name, emp_id: faculty.emp_id });
    } catch (e) {
      results.failed.push({ record: rec.name || rec.emp_id, reason: e.message });
    }
  }

  return results;
};
