import prisma from "../../utils/prisma.js";



/**
 * When a subject is assigned to a section (with or without faculty),
 * auto-create a feedback form for that subject+faculty pair.
 * Called from section.service.js after assignSubjectToSection.
 */
export const generateFeedbackFormsForSection = async (section_id) => {
  const section = await prisma.section.findUnique({
    where:   { id: section_id },
    include: {
      course: { include: { program: { include: { department: true } } } },
      sectionSubjects: {
        where:   { status: "ACTIVE" },
        include: { subject: true, faculty: true },
      },
    },
  });
  if (!section || section.sectionSubjects.length === 0) return [];

  // Find a "TEACHING" category — create one if none exists
  let category = await prisma.feedbackCategory.findFirst({
    where: { type: "TEACHING" },
  });
  if (!category) {
    category = await prisma.feedbackCategory.create({
      data: { name: "Teaching Quality", type: "TEACHING", is_active: true },
    });
  }

  // Academic year = current
  const y   = new Date().getFullYear();
  const acYear = `${y}-${y + 1}`;

  // Default date range: today → 30 days from now
  const start = new Date();
  const end   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const created = [];

  for (const ss of section.sectionSubjects) {
    // Check if a form already exists for this section+subject+faculty combo
    const existing = await prisma.feedbackForm.findFirst({
      where: {
        section_id: section_id,
        subject_id: ss.subject_id,
        faculty_id: ss.faculty_id || null,
        category_id: category.id,
      },
    });
    if (existing) continue;

    const title = ss.faculty_id
      ? `${ss.subject.name} — ${ss.faculty.name} (${acYear})`
      : `${ss.subject.name} — ${section.name} (${acYear})`;

    const form = await prisma.feedbackForm.create({
      data: {
        title,
        category_id: category.id,
        section_id:  section_id,
        subject_id:  ss.subject_id,
        faculty_id:  ss.faculty_id || null,
        start_date:  start,
        end_date:    end,
        is_active:   true,
      },
    });
    created.push(form);
  }

  return created;
};
