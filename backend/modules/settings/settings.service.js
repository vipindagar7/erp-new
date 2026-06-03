// backend/modules/settings/settings.service.js
import prisma from "../../utils/prisma.js";

export const getMyProfileService = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      email:     true,
      role:      true,
      isBlocked: true,
      createdAt: true,
      student: {
        select: {
          id:            true,
          name:          true,
          first_name:    true,
          last_name:     true,
          roll_no:       true,
          enrollment_no: true,
          phone:         true,
          address:       true,
          gender:        true,
          dob:           true,
          department: { select: { id: true, name: true } },
          section:    { select: { id: true, name: true } },
          course:     { select: { id: true, name: true } },
          program:    { select: { id: true, name: true } },
        },
      },
      faculty: {
        select: {
          id:           true,
          name:         true,
          emp_id:       true,
          designation:  true,
          phone:        true,
          gender:       true,
          dob:          true,
          joining_date: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });
};

export const updateStudentProfileService = async (userId, data) => {
  const student = await prisma.student.findFirst({ where: { user_id: userId } });
  if (!student) return null;

  const { first_name, last_name, phone, address, gender, dob } = data;

  // Build composite name if first/last provided
  const name =
    first_name && last_name ? `${first_name} ${last_name}` :
    first_name              ? first_name                   : undefined;

  return prisma.student.update({
    where: { id: student.id },
    data: {
      ...(first_name !== undefined && { first_name }),
      ...(last_name  !== undefined && { last_name  }),
      ...(name       !== undefined && { name       }),
      ...(phone      !== undefined && { phone      }),
      ...(address    !== undefined && { address    }),
      ...(gender     !== undefined && { gender     }),
      ...(dob        !== undefined && { dob        }),
    },
    select: {
      id: true, name: true, first_name: true, last_name: true,
      phone: true, address: true, gender: true, dob: true,
    },
  });
};

export const updateFacultyProfileService = async (userId, data) => {
  const faculty = await prisma.faculty.findFirst({ where: { user_id: userId } });
  if (!faculty) return null;

  const { name, phone, designation, gender, dob } = data;

  return prisma.faculty.update({
    where: { id: faculty.id },
    data: {
      ...(name        !== undefined && { name        }),
      ...(phone       !== undefined && { phone       }),
      ...(designation !== undefined && { designation }),
      ...(gender      !== undefined && { gender      }),
      ...(dob         !== undefined && { dob         }),
    },
    select: {
      id: true, name: true, phone: true,
      designation: true, gender: true, dob: true,
    },
  });
};
