import xlsx from "xlsx";
import prisma from "../../utils/prisma.js";

// ── Section label helper ──────────────────────────────────────
const fmtSecLabel = (sec, mode = "compact") => {
  if (!sec) return "—";
  const prog = sec.course?.program?.name || "";
  const course = sec.course?.name || "";
  const sem = sec.semester != null ? `Sem ${sec.semester}` : "";
  const name = sec.name ? `Sec ${sec.name}` : "";
  if (mode === "sheet") {
    const raw = [prog, course, sec.semester ? `${sec.semester}Sem` : "", sec.name].filter(Boolean).join(" ");
    return raw.replace(/[\[\]:*?/\\]/g, "").slice(0, 31);
  }
  if (mode === "short") return [course, sem, name].filter(Boolean).join(" ");
  return [prog, course, sem, name].filter(Boolean).join(" ");
};

const usedSheetNames = new WeakMap();
const addSheetSafe = (wb, ws, name) => {
  if (!usedSheetNames.has(wb)) usedSheetNames.set(wb, new Set());
  const used = usedSheetNames.get(wb);
  let safeName = name.slice(0, 31);
  if (used.has(safeName)) {
    let i = 2;
    while (used.has(safeName)) {
      const suffix = `(${i++})`;
      safeName = name.slice(0, 31 - suffix.length) + suffix;
    }
  }
  used.add(safeName);
  xlsx.utils.book_append_sheet(wb, ws, safeName);
};

const avgRating = (answers) => {
  const rs = answers.filter((a) => a.rating != null).map((a) => a.rating);
  return rs.length ? rs.reduce((s, v) => s + v, 0) / rs.length : null;
};
const fmtAvg = (v) => (v == null ? "—" : Number(v).toFixed(2));

// ── Snapshot helper — call ONCE per student, reuse the result ─
const getStudentSnapshot = async (student_id) => {
  const student = await prisma.student.findUnique({
    where: { id: student_id },
    include: {
      section: { select: { name: true, semester: true, batch: true } },
      department: { select: { name: true } },
      program: { select: { name: true } },
      course: { select: { name: true } },
      enrollments: {
        where: { is_current: true },
        select: { academic_year: true, semester: true },
        orderBy: { enrolled_at: "desc" },
        take: 1,
      },
    },
  });
  const enr = student?.enrollments?.[0];
  return {
    snap_section_name: student?.section?.name ?? null,
    snap_semester: enr?.semester ?? student?.section?.semester ?? null,
    snap_batch: student?.section?.batch ?? null,
    snap_dept_name: student?.department?.name ?? null,
    snap_program_name: student?.program?.name ?? null,
    snap_course_name: student?.course?.name ?? null,
    snap_academic_year: enr?.academic_year ?? null,
  };
};

// ─── CATEGORY ────────────────────────────────────────────────
export const getAllCategories = async () =>
  prisma.feedbackCategory.findMany({
    orderBy: [{ is_active: "desc" }, { name: "asc" }],
    include: { _count: { select: { questions: true, forms: true } } },
  });

export const createCategory = async ({ name, type }) =>
  prisma.feedbackCategory.create({ data: { name, type, is_active: true } });

export const updateCategory = async (id, data) => {
  const existing = await prisma.feedbackCategory.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Category not found"); e.statusCode = 404; throw e; }
  return prisma.feedbackCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.is_active !== undefined && { is_active: Boolean(data.is_active) }),
    },
  });
};

export const deleteCategory = async (id) => {
  await prisma.feedbackCategory.delete({ where: { id } });
  return { id };
};

// ─── QUESTIONS ───────────────────────────────────────────────
export const getQuestionsByCategory = async (category_id) =>
  prisma.feedbackQuestion.findMany({ where: { category_id }, orderBy: [{ order: "asc" }] });

export const createQuestion = async ({ category_id, question, type, options, is_required, order }) =>
  prisma.feedbackQuestion.create({
    data: { category_id, question, type, options: options || [], is_required: is_required ?? true, order: order ?? 0 },
  });

export const updateQuestion = async (id, data) => {
  const existing = await prisma.feedbackQuestion.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Question not found"); e.statusCode = 404; throw e; }
  return prisma.feedbackQuestion.update({
    where: { id },
    data: {
      ...(data.question !== undefined && { question: data.question }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.options !== undefined && { options: data.options }),
      ...(data.is_required !== undefined && { is_required: Boolean(data.is_required) }),
      ...(data.order !== undefined && { order: parseInt(data.order) }),
      ...(data.category_id !== undefined && { category_id: data.category_id }),
    },
  });
};

export const deleteQuestion = async (id) => {
  await prisma.feedbackQuestion.delete({ where: { id } });
  return { id };
};

// ─── FORMS ───────────────────────────────────────────────────
export const getAllForms = async ({ page = 1, limit = 20, is_active, form_type, category_type, search } = {}) => {
  const _page = parseInt(page) || 1;
  const _limit = parseInt(limit) || 20;
  const skip = (_page - 1) * _limit;
  const where = {
    ...(is_active !== undefined && { is_active: is_active === "true" || is_active === true }),
    ...((form_type || category_type) && { category: { type: form_type || category_type } }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
  };
  const [forms, total] = await Promise.all([
    prisma.feedbackForm.findMany({
      where, skip, take: _limit,
      orderBy: [{ is_active: "desc" }, { start_date: "desc" }],
      include: {
        category: { select: { id: true, name: true, type: true } },
        faculty: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        specialGroup: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
    }),
    prisma.feedbackForm.count({ where }),
  ]);
  return { forms, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

export const getFormById = async (id) =>
  prisma.feedbackForm.findUnique({
    where: { id },
    include: {
      category: { include: { questions: { orderBy: { order: "asc" } } } },
      faculty: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      section: { select: { id: true, name: true } },
    },
  });

export const createForm = async (data) => {
  return prisma.feedbackForm.create({
    data: {
      title: data.title,
      category_id: data.category_id,
      is_active: data.is_active ?? true,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      section_id: data.section_id || null,
      faculty_id: data.faculty_id || null,
      subject_id: data.subject_id || null,
      specialGroupId: data.group_id || data.specialGroupId || null,
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

export const createForms = async (data) => {
  const { form_type, title, category_id, start_date, end_date, is_active, section_ids, group_id, specialGroupId } = data;
  const base = {
    category_id,
    is_active: is_active ?? true,
    start_date: new Date(start_date),
    end_date: new Date(end_date),
  };

  if (form_type === "TEACHING") {
    const ids = section_ids || [];
    if (!ids.length) throw Object.assign(new Error("At least one section required"), { statusCode: 400 });

    const sectionSubjects = await prisma.sectionSubject.findMany({
      where: {
        section_id: { in: ids },
        faculty_id: { not: null },
        status: { notIn: ["REMOVED", "COMPLETED"] },
      },
      include: {
        section: {
          select: {
            id: true, name: true, semester: true, batch: true,
            course: { select: { id: true, name: true, program: { select: { id: true, name: true, department: { select: { id: true, name: true } } } } } }
          }
        },
        subject: { select: { id: true, name: true, code: true, nickname: true } },
        faculty: { select: { id: true, name: true } },
      },
    });

    if (!sectionSubjects.length)
      throw Object.assign(new Error("No faculty-subject assignments found in selected sections."), { statusCode: 400 });

    const group = await prisma.feedbackFormGroup.create({
      data: {
        name: title,
        description: data.description || null,
        category_id,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_active: base.is_active,
      },
    });

    const forms = await Promise.all(sectionSubjects.map((ss) =>
      prisma.feedbackForm.create({
        data: {
          ...base,
          title: `${title} — ${ss.faculty.name} · ${ss.subject.code}`,
          section_id: ss.section_id,
          faculty_id: ss.faculty_id,
          subject_id: ss.subject_id,
          feedbackFormGroupId: group.id,
        },
        include: {
          category: { select: { id: true, name: true } },
          faculty: { select: { id: true, name: true, nick_name: true } },
          subject: { select: { id: true, name: true, code: true, nickname: true } },
          section: {
            select: {
              id: true, name: true, semester: true, batch: true,
              course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } }
            }
          },
        },
      })
    ));
    return { count: forms.length, forms, group };
  }

  if (form_type === "GROUP") {
    const sgId = group_id || specialGroupId;
    if (!sgId) throw Object.assign(new Error("Group required"), { statusCode: 400 });
    const form = await prisma.feedbackForm.create({
      data: { ...base, title, specialGroupId: sgId },
      include: { category: { select: { id: true, name: true } } },
    });
    return { count: 1, forms: [form] };
  }

  const form = await prisma.feedbackForm.create({
    data: { ...base, title },
    include: { category: { select: { id: true, name: true } } },
  });
  return { count: 1, forms: [form] };
};

export const updateForm = async (id, data) => {
  const existing = await prisma.feedbackForm.findUnique({ where: { id } });
  if (!existing) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  const u = {};
  if (data.title !== undefined) u.title = data.title;
  if (data.category_id !== undefined) u.category_id = data.category_id;
  if (data.is_active !== undefined) u.is_active = Boolean(data.is_active);
  if (data.all_students !== undefined) u.all_students = Boolean(data.all_students);
  if (data.batch_year !== undefined) u.batch_year = data.batch_year ? parseInt(data.batch_year) : null;
  if (data.department_id !== undefined) u.department_id = data.department_id || null;
  if (data.course_id !== undefined) u.course_id = data.course_id || null;
  if (data.faculty_id !== undefined) u.faculty_id = data.faculty_id || null;
  if (data.subject_id !== undefined) u.subject_id = data.subject_id || null;
  if (data.section_id !== undefined) u.section_id = data.section_id || null;
  if (data.group_id !== undefined) u.specialGroupId = data.group_id || null;
  if (data.specialGroupId !== undefined) u.specialGroupId = data.specialGroupId || null;
  if (data.start_date !== undefined) u.start_date = data.start_date ? new Date(data.start_date) : existing.start_date;
  if (data.end_date !== undefined) u.end_date = data.end_date ? new Date(data.end_date) : existing.end_date;
  return prisma.feedbackForm.update({
    where: { id }, data: u,
    include: { category: { select: { id: true, name: true } } },
  });
};

export const deleteForm = async (id) => {
  await prisma.feedbackForm.delete({ where: { id } });
  return { id };
};

// ─── STUDENT — get active forms ──────────────────────────────
export const getActiveFormsForStudent = async (student_id) => {
  const now = new Date();
  const student = await prisma.student.findUnique({
    where: { id: student_id },
    select: { id: true, section_id: true, specialGroupMembers: { select: { group_id: true } } },
  });
  if (!student) { const e = new Error("Student not found"); e.statusCode = 404; throw e; }

  const sectionSubjects = student.section_id
    ? await prisma.sectionSubject.findMany({
      where: { section_id: student.section_id, faculty_id: { not: null } },
      select: { faculty_id: true },
    })
    : [];
  const facultyIdsInSection = [...new Set(sectionSubjects.map((s) => s.faculty_id).filter(Boolean))];
  const studentGroupIds = student.specialGroupMembers.map((g) => g.group_id);

  const allForms = await prisma.feedbackForm.findMany({
    where: { is_active: true, start_date: { lte: now }, end_date: { gte: now } },
    include: {
      category: { include: { questions: { orderBy: { order: "asc" } } } },
      faculty: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      section: { select: { id: true, name: true } },
      responses: { where: { student_id }, select: { id: true } },
    },
  });

  const visible = allForms.filter((form) => {
    if (form.section_id && form.section_id !== student.section_id) return false;
    if (form.faculty_id && !facultyIdsInSection.includes(form.faculty_id)) return false;
    if (form.specialGroupId && !studentGroupIds.includes(form.specialGroupId)) return false;
    return true;
  });

  return visible.map((f) => ({ ...f, submitted: f.responses.length > 0, responses: undefined }));
};

// ─── SUBMIT — single form ─────────────────────────────────────
export const submitFeedback = async (form_id, student_id, answers) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id }, include: { category: { include: { questions: true } } },
  });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  if (!form.is_active) { const e = new Error("Form is not active"); e.statusCode = 400; throw e; }
  const now = new Date();
  if (now < form.start_date || now > form.end_date) {
    const e = new Error("Form is not in the submission window"); e.statusCode = 400; throw e;
  }
  const existing = await prisma.feedbackResponse.findUnique({
    where: { form_id_student_id: { form_id, student_id } },
  });
  if (existing) { const e = new Error("You have already submitted this feedback"); e.statusCode = 409; throw e; }

  const snapshot = await getStudentSnapshot(student_id);

  return prisma.feedbackResponse.create({
    data: {
      form_id,
      student_id,
      ...snapshot,
      answers: {
        create: answers.map(({ question_id, answer_text, rating, selected }) =>
          ({ question_id, answer_text, rating, selected })
        ),
      },
    },
    include: { answers: true },
  });
};

// ─── ADMIN — form results ─────────────────────────────────────
export const getFormResults = async (form_id) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id },
    include: {
      responses: {
        include: {
          student: {
            select: {
              id: true, name: true, roll_no: true, enrollment_no: true, batch_year: true,
              user: { select: { email: true } },
            },
          },
          answers: { include: { question: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
      category: { include: { questions: { orderBy: { order: "asc" } } } },
      faculty: { select: { id: true, name: true, nick_name: true, department: { select: { id: true, name: true } } } },
      subject: { select: { id: true, name: true, code: true, nickname: true } },
      section: { select: { id: true, name: true, course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } } } },
      specialGroup: { select: { id: true, name: true } },
      _count: { select: { responses: true } },
    },
  });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  return form;
};

// ─── EXPORT — use snap_* everywhere, no FK lookups ───────────
export const exportFormResults = async (form_id) => {
  const form = await getFormResults(form_id);
  const responses = form.responses || [];
  const questions = form.category?.questions || [];
  const isTeaching = !!(form.faculty_id || form.subject_id);
  const wb = xlsx.utils.book_new();

  const addSheet = (name, data, cols) => {
    const ws = xlsx.utils.aoa_to_sheet(data);
    if (cols) ws["!cols"] = cols;
    addSheetSafe(wb, ws, name);
  };

  // ── 1. Overview ───────────────────────────────────────────────
  const overviewData = [
    ["Form Title", form.title],
    ["Category", form.category?.name || "—"],
    ["Status", form.is_active ? "Active" : "Inactive"],
    ["Period", `${new Date(form.start_date).toLocaleDateString("en-IN")} → ${new Date(form.end_date).toLocaleDateString("en-IN")}`],
    ["Total Responses", responses.length],
    [],
  ];
  if (isTeaching) {
    overviewData.push(["Faculty", form.faculty?.name || "—"]);
    overviewData.push(["Subject", `${form.subject?.name || "—"} (${form.subject?.code || ""})`]);
    overviewData.push(["Section", form.section?.name || "—"]);
    overviewData.push(["Dept", form.section?.course?.program?.department?.name || form.faculty?.department?.name || "—"]);
  }
  if (form.specialGroup) overviewData.push(["Group", form.specialGroup.name]);
  const allAnswers = responses.flatMap((r) => r.answers);
  const overallAvg = avgRating(allAnswers);
  if (overallAvg != null) overviewData.push([], ["Overall Avg Rating", fmtAvg(overallAvg)]);
  overviewData.push(["Action Taken", form.action_taken || "(none)"]);
  addSheet("Overview", overviewData, [{ wch: 24 }, { wch: 50 }]);

  // ── 2. Responses — ALL columns from snap_* ───────────────────
  // Never use student FK relations — always use snap fields
  const rHeaders = [
    "#", "Student Name", "Roll No", "Email",
    "Department",   // ← snap_dept_name
    "Program",      // ← snap_program_name
    "Course",       // ← snap_course_name
    "Section",      // ← snap_section_name
    "Semester",     // ← snap_semester
    "Batch",        // ← snap_batch
    "Academic Year",// ← snap_academic_year
    "Submitted At",
    ...questions.map((q, i) => `Q${i + 1}: ${q.question.slice(0, 40)}`),
  ];
  const rRows = responses.map((r, idx) => {
    const am = {};
    r.answers.forEach((a) => { am[a.question_id] = a.rating ?? a.answer_text ?? a.selected ?? ""; });
    return [
      idx + 1,
      r.student?.name || "",
      r.student?.roll_no || "",
      r.student?.user?.email || "",
      // ── SNAP fields — what the student's context WAS at submission time ──
      r.snap_dept_name || "",
      r.snap_program_name || "",
      r.snap_course_name || "",
      r.snap_section_name || "",
      r.snap_semester ?? "",
      r.snap_batch || "",
      r.snap_academic_year || "",
      new Date(r.submittedAt).toLocaleString("en-IN"),
      ...questions.map((q) => am[q.id] ?? ""),
    ];
  });
  const avgFooter = ["", "AVERAGE", "", "", "", "", "", "", "", "", "", ""];
  questions.forEach((q) => {
    if (q.type === "RATING") {
      const rs = responses.flatMap((r) => r.answers)
        .filter((a) => a.question_id === q.id && a.rating != null).map((a) => a.rating);
      avgFooter.push(rs.length ? fmtAvg(rs.reduce((a, b) => a + b, 0) / rs.length) : "—");
    } else { avgFooter.push("—"); }
  });
  addSheet("Responses", [rHeaders, ...rRows, [], avgFooter],
    [{ wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 28 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
    { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
    ...questions.map(() => ({ wch: 30 }))]);

  // ── 3. Question Analysis ──────────────────────────────────────
  const qaData = [["Question", "Type", "Responses", "Avg Rating", "1★", "2★", "3★", "4★", "5★", "Top MCQ / Text Count"]];
  questions.forEach((q, i) => {
    const qAnswers = allAnswers.filter((a) => a.question_id === q.id);
    if (q.type === "RATING") {
      const ratings = qAnswers.filter((a) => a.rating != null).map((a) => a.rating);
      const dist = [1, 2, 3, 4, 5].map((s) => ratings.filter((r) => r === s).length);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      qaData.push([`Q${i + 1}: ${q.question}`, "RATING", ratings.length, fmtAvg(avg), ...dist, ""]);
    } else if (q.type === "MCQ") {
      const counts = {};
      qAnswers.filter((a) => a.selected).forEach((a) => { counts[a.selected] = (counts[a.selected] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      qaData.push([`Q${i + 1}: ${q.question}`, "MCQ", qAnswers.length, "—", "—", "—", "—", "—", "—", top ? `${top[0]} (${top[1]})` : "—"]);
      Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([opt, cnt]) => {
        const pct = qAnswers.length ? Math.round(cnt / qAnswers.length * 100) : 0;
        qaData.push(["", `  ${opt}`, cnt, "", "", "", "", "", "", `${pct}%`]);
      });
    } else {
      const texts = qAnswers.filter((a) => a.answer_text).map((a) => a.answer_text);
      qaData.push([`Q${i + 1}: ${q.question}`, "TEXT", texts.length, "—", "—", "—", "—", "—", "—", `${texts.length} text answers`]);
      texts.forEach((t) => qaData.push(["", `  "${t.slice(0, 100)}"`, "", "", "", "", "", "", "", ""]));
    }
    qaData.push([]);
  });
  addSheet("Question Analysis", qaData,
    [{ wch: 50 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 30 }]);

  // ── 4. Section-wise — group by snap_section_name ─────────────
  // Use snap_section_name instead of student.section FK
  const bySec = {};
  responses.forEach((r) => {
    const key = r.snap_section_name || "Unknown";
    if (!bySec[key]) bySec[key] = [];
    bySec[key].push(r);
  });

  if (isTeaching) {
    const swData = [
      ["Section", form.section?.name || "—"],
      ["Course", form.section?.course?.name || "—"],
      ["Faculty", form.faculty?.name || "—"],
      ["Subject", form.subject?.name || "—"],
      ["Responses", responses.length],
      [],
      ["Question", "Type", "Avg Rating / Summary"],
    ];
    questions.forEach((q, i) => {
      const qA = allAnswers.filter((a) => a.question_id === q.id);
      if (q.type === "RATING") {
        const rs = qA.filter((a) => a.rating != null).map((a) => a.rating);
        swData.push([`Q${i + 1}: ${q.question}`, "RATING", rs.length ? fmtAvg(rs.reduce((a, b) => a + b, 0) / rs.length) : "—"]);
      } else if (q.type === "MCQ") {
        const counts = {};
        qA.forEach((a) => { if (a.selected) counts[a.selected] = (counts[a.selected] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        swData.push([`Q${i + 1}: ${q.question}`, "MCQ", top ? `${top[0]} (${top[1]})` : "—"]);
      } else {
        swData.push([`Q${i + 1}: ${q.question}`, "TEXT", `${qA.filter(a => a.answer_text).length} answers`]);
      }
    });
    addSheet("Section-wise", swData, [{ wch: 28 }, { wch: 50 }, { wch: 30 }]);
  } else {
    // Use snap_dept_name for dept grouping
    const swHeaders = ["Section (snap)", "Dept (snap)", "Program (snap)", "Course (snap)", "Responses", "Avg Rating"];
    const swRows = Object.entries(bySec).map(([sec, rs]) => {
      const first = rs[0];
      return [sec, first?.snap_dept_name || "—", first?.snap_program_name || "—", first?.snap_course_name || "—", rs.length, fmtAvg(avgRating(rs.flatMap((r) => r.answers)))];
    });
    swRows.push(["TOTAL / AVERAGE", "", "", "", responses.length, fmtAvg(avgRating(responses.flatMap((r) => r.answers)))]);
    addSheet("Section-wise", [swHeaders, ...swRows],
      [{ wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 12 }, { wch: 14 }]);
  }

  // ── 5. Dept-wise — group by snap_dept_name ────────────────────
  const byDept = {};
  responses.forEach((r) => {
    const key = r.snap_dept_name || "Unknown";
    if (!byDept[key]) byDept[key] = [];
    byDept[key].push(r);
  });
  const ratingQs = questions.filter((q) => q.type === "RATING");
  const dwHeaders = ["Department (snap)", "Responses", "Avg Rating", ...ratingQs.map((q, i) => `Q${i + 1} Avg`)];
  const dwRows = Object.entries(byDept).map(([dept, rs]) => {
    const qAvgs = ratingQs.map((q) => {
      const vals = rs.flatMap(r => r.answers).filter(a => a.question_id === q.id && a.rating != null).map(a => a.rating);
      return vals.length ? fmtAvg(vals.reduce((a, b) => a + b, 0) / vals.length) : "—";
    });
    return [dept, rs.length, fmtAvg(avgRating(rs.flatMap(r => r.answers))), ...qAvgs];
  });
  dwRows.push(["TOTAL / AVERAGE", responses.length, fmtAvg(avgRating(allAnswers)),
    ...ratingQs.map((q) => {
      const vals = allAnswers.filter(a => a.question_id === q.id && a.rating != null).map(a => a.rating);
      return vals.length ? fmtAvg(vals.reduce((a, b) => a + b, 0) / vals.length) : "—";
    })]);
  addSheet("Dept-wise", [dwHeaders, ...dwRows]);

  // ── 6. Teaching siblings, Faculty/Course/Program-wise ────────
  if (isTeaching) {
    const siblingForms = await prisma.feedbackForm.findMany({
      where: { section_id: form.section_id || undefined, category_id: form.category_id, NOT: { faculty_id: null } },
      include: {
        faculty: { select: { id: true, name: true, nick_name: true, department: { select: { name: true } } } },
        subject: { select: { id: true, name: true, code: true, nickname: true } },
        section: { select: { id: true, name: true, course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } } } },
        responses: { include: { answers: { select: { question_id: true, rating: true } } } },
        _count: { select: { responses: true } },
      },
    });

    const fwData = [
      ["Faculty-wise Teaching Feedback"],
      ["Section:", form.section?.name || "—"],
      [],
      ["Faculty", "Nick", "Subject", "Code", "Responses", "Overall Avg", ...ratingQs.map((q, i) => `Q${i + 1}`)],
    ];
    siblingForms.forEach((sf) => {
      const sfAnswers = sf.responses.flatMap((r) => r.answers);
      const qAvgs = ratingQs.map((q) => {
        const vals = sfAnswers.filter(a => a.question_id === q.id && a.rating != null).map(a => a.rating);
        return vals.length ? fmtAvg(vals.reduce((a, b) => a + b, 0) / vals.length) : "—";
      });
      fwData.push([sf.faculty?.name || "—", sf.faculty?.nick_name || "—", sf.subject?.name || "—", sf.subject?.code || "—", sf._count.responses, fmtAvg(avgRating(sfAnswers)), ...qAvgs]);
    });
    addSheet("Faculty-wise", fwData);
  }

  // ── 7. Group sheet ────────────────────────────────────────────
  if (form.specialGroup) {
    const gwData = [
      [`Group: ${form.specialGroup.name}`], ["Responses", responses.length], [],
      ["Student", "Roll No", "Dept (snap)", "Section (snap)", "Semester (snap)", "Submitted At", ...questions.map((q, i) => `Q${i + 1}`)],
    ];
    responses.forEach((r) => {
      const am = {}; r.answers.forEach((a) => { am[a.question_id] = a.rating ?? a.answer_text ?? a.selected ?? ""; });
      gwData.push([r.student?.name || "—", r.student?.roll_no || "—",
      r.snap_dept_name || "—", r.snap_section_name || "—", r.snap_semester ?? "—",
      new Date(r.submittedAt).toLocaleDateString("en-IN"),
      ...questions.map((q) => am[q.id] ?? "")]);
    });
    addSheet("Group-wise", gwData);
  }

  const filename = `feedback_${form.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.xlsx`;
  return { buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }), filename };
};

export const toggleFormActive = async (id) => {
  const form = await prisma.feedbackForm.findUnique({ where: { id }, select: { is_active: true } });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  return prisma.feedbackForm.update({
    where: { id }, data: { is_active: !form.is_active },
    include: { category: { select: { id: true, name: true } }, _count: { select: { responses: true } } },
  });
};

export const updateActionTaken = async (id, action_taken) =>
  prisma.feedbackForm.update({ where: { id }, data: { action_taken: action_taken || null } });

export const deleteFormResponses = async (form_id) => {
  const result = await prisma.feedbackResponse.deleteMany({ where: { form_id } });
  return { deleted: result.count };
};

export const getFormQuestions = async (form_id) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id },
    select: { id: true, title: true, category_id: true, category: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  return { form_id: form.id, title: form.title, questions: form.category.questions };
};

export const getCategoryById = async (id) =>
  prisma.feedbackCategory.findUnique({ where: { id }, include: { _count: { select: { questions: true, forms: true } } } });

export const getAllQuestions = async ({ category_id, page = 1, limit = 100 } = {}) => {
  const _page = parseInt(page) || 1; const _limit = parseInt(limit) || 100;
  const where = category_id ? { category_id } : {};
  const [questions, total] = await Promise.all([
    prisma.feedbackQuestion.findMany({
      where, orderBy: [{ category_id: "asc" }, { order: "asc" }],
      skip: (_page - 1) * _limit, take: _limit,
      include: { category: { select: { id: true, name: true, type: true } } },
    }),
    prisma.feedbackQuestion.count({ where }),
  ]);
  return { questions, pagination: { total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) } };
};

export const getQuestionById = async (id) =>
  prisma.feedbackQuestion.findUnique({ where: { id }, include: { category: { select: { id: true, name: true, type: true } } } });

export const generateFeedbackTemplate = async (form_id) => {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id }, include: { category: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!form) { const e = new Error("Form not found"); e.statusCode = 404; throw e; }
  const questions = form.category?.questions || [];
  const headers = ["student_email", "submitted_at", ...questions.map((q, i) => `Q${i + 1}_${q.type}: ${q.question}`)];
  const example = ["student@college.edu", "2026-04-15", ...questions.map((q) => {
    if (q.type === "TEXT") return "Write your answer here";
    if (q.type === "RATING") return "4";
    if (q.type === "MCQ") return q.options?.[0] || "Option1";
    return "";
  })];
  const ws = xlsx.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 24) }));
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Feedback");
  return { buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }), formTitle: form.title };
};

// ─── BULK SUBMIT — single form ────────────────────────────────
// Captures full snapshot for every student — no FK for section/dept
export const bulkSubmitFeedback = async (form_id, buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length) throw Object.assign(new Error("File is empty"), { statusCode: 400 });

  const form = await prisma.feedbackForm.findUnique({
    where: { id: form_id }, include: { category: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!form) throw Object.assign(new Error("Form not found"), { statusCode: 404 });
  if (!form.is_active) throw Object.assign(new Error("Form is not active"), { statusCode: 400 });

  const questions = form.category?.questions || [];
  if (!questions.length) throw Object.assign(new Error("Form has no questions"), { statusCode: 400 });

  const headers = Object.keys(rows[0] || {}).filter((h) => h !== "student_email" && h !== "submitted_at");
  const questionMap = {};
  headers.forEach((header) => {
    const match = header.match(/^Q(\d+)_/);
    if (match) { const idx = parseInt(match[1]) - 1; if (questions[idx]) questionMap[header] = questions[idx]; }
  });

  const results = { success: [], failed: [], total: rows.length };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const email = row.student_email?.toString().trim();
    if (!email) { results.failed.push({ row: rowNum, email: "—", reason: "student_email required" }); continue; }

    try {
      const user = await prisma.user.findUnique({
        where: { email }, include: { student: { select: { id: true, name: true } } },
      });
      if (!user?.student) { results.failed.push({ row: rowNum, email, reason: "Student not found" }); continue; }

      const student_id = user.student.id;
      const existing = await prisma.feedbackResponse.findUnique({
        where: { form_id_student_id: { form_id, student_id } },
      });
      if (existing) { results.failed.push({ row: rowNum, email, reason: "Already submitted" }); continue; }

      let submittedAt = new Date();
      if (row.submitted_at?.toString().trim()) {
        const p = new Date(row.submitted_at); if (!isNaN(p)) submittedAt = p;
      }

      const answers = [];
      for (const [header, question] of Object.entries(questionMap)) {
        const raw = row[header]?.toString().trim(); if (!raw) continue;
        if (question.type === "TEXT") answers.push({ question_id: question.id, answer_text: raw });
        else if (question.type === "RATING") { const r = parseInt(raw); if (!isNaN(r) && r >= 1 && r <= 5) answers.push({ question_id: question.id, rating: r }); }
        else if (question.type === "MCQ") answers.push({ question_id: question.id, selected: raw });
      }

      // Capture snapshot at upload time
      const snapshot = await getStudentSnapshot(student_id);

      await prisma.feedbackResponse.create({
        data: {
          form_id,
          student_id,
          submittedAt,
          ...snapshot,
          answers: { create: answers },
        },
      });
      results.success.push({ row: rowNum, email, name: user.student.name });
    } catch (err) { results.failed.push({ row: rowNum, email, reason: err.message }); }
  }
  return results;
};

export const bulkUploadQuestions = async (buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Data"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const results = { created: [], failed: [] };
  for (const row of rows) {
    const category_id = String(row["Category ID*"] || row.category_id || "").trim();
    const question = String(row["Question*"] || row.question || "").trim();
    const type = String(row["Type*"] || row.type || "RATING").trim().toUpperCase();
    const is_required = String(row["Required"] || "true").toLowerCase() !== "false";
    const order = parseInt(row["Order"] || 0) || 0;
    const options_raw = String(row["Options (MCQ, comma-separated)"] || row.options || "").trim();
    const options = type === "MCQ" ? options_raw.split(",").map((o) => o.trim()).filter(Boolean) : [];
    if (!category_id) { results.failed.push({ row: question, reason: "Category ID required" }); continue; }
    if (!question) { results.failed.push({ row: question, reason: "Question text required" }); continue; }
    try {
      const q = await prisma.feedbackQuestion.create({ data: { category_id, question, type, options, is_required, order } });
      results.created.push({ id: q.id, question: q.question });
    } catch (e) { results.failed.push({ row: question, reason: e.message }); }
  }
  return results;
};

export const generateQuestionTemplate = async () => {
  const categories = await prisma.feedbackCategory.findMany({ select: { id: true, name: true, type: true }, orderBy: { name: "asc" } });
  const headers = ["Category ID*", "Category Name (ref)", "Question*", "Type* (RATING/TEXT/MCQ)", "Required (true/false)", "Order", "Options (MCQ, comma-separated)"];
  const sampleRows = categories.slice(0, 3).map((c, i) => [
    c.id, c.name,
    i === 0 ? "How would you rate the teaching quality?" : i === 1 ? "Any suggestions?" : "Overall experience?",
    i === 0 ? "RATING" : i === 1 ? "TEXT" : "MCQ", "true", i + 1, i === 2 ? "Excellent,Good,Average,Poor" : "",
  ]);
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));
  xlsx.utils.book_append_sheet(wb, ws, "Data");
  const refSheet = xlsx.utils.aoa_to_sheet([["Category ID", "Name", "Type"], ...categories.map((c) => [c.id, c.name, c.type])]);
  refSheet["!cols"] = [{ wch: 40 }, { wch: 30 }, { wch: 16 }];
  xlsx.utils.book_append_sheet(wb, refSheet, "Categories");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ─── GROUP BULK TEMPLATE ──────────────────────────────────────
export const getGroupBulkTemplate = async (groupId) => {
  const group = await prisma.feedbackFormGroup.findUnique({
    where: { id: groupId },
    include: {
      feedbackForms: {
        where: { is_active: true },
        include: {
          faculty: { select: { id: true, name: true, nick_name: true } },
          subject: { select: { id: true, name: true, code: true, nickname: true } },
          section: {
            select: {
              id: true, name: true, semester: true, batch: true,
              course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } }
            }
          },
          category: { include: { questions: { orderBy: { order: "asc" } } } },
        },
        orderBy: [{ section: { name: "asc" } }, { faculty: { name: "asc" } }],
      },
    },
  });
  if (!group) throw Object.assign(new Error("Group not found"), { statusCode: 404 });
  if (!group.feedbackForms.length) throw Object.assign(new Error("No active forms in this group"), { statusCode: 404 });

  const wb = xlsx.utils.book_new();
  const usedNames = new Set();
  const safeSheet = (sec) => {
    const prog = sec?.course?.program?.name || "";
    const course = sec?.course?.name || "";
    const base = `${prog} ${course}–${sec.name} Sem${sec.semester}`.replace(/[\[\]:*?/\\]/g, "").trim().slice(0, 31);
    let n = base;
    if (usedNames.has(n)) { let i = 2; while (usedNames.has(n)) { const s = `(${i++})`; n = base.slice(0, 31 - s.length) + s; } }
    usedNames.add(n); return n;
  };

  const bySec = {};
  for (const f of group.feedbackForms) {
    const sid = f.section?.id || "unknown";
    if (!bySec[sid]) bySec[sid] = { section: f.section, forms: [] };
    bySec[sid].forms.push(f);
  }

  for (const { section, forms } of Object.values(bySec)) {
    const sheetName = safeSheet(section);
    const fixedHeaders = ["student_email *", "student_name (info)", "roll_no (info)"];
    const formHeaders = [];
    const formColMap = [];

    for (let fi = 0; fi < forms.length; fi++) {
      const f = forms[fi];
      const nick = f.faculty?.nick_name || f.faculty?.name || `F${fi + 1}`;
      const sub = f.subject?.nickname || f.subject?.code || `S${fi + 1}`;
      const rqs = f.category?.questions.filter((q) => q.type === "RATING") || [];
      const tqs = f.category?.questions.filter((q) => q.type === "TEXT") || [];
      rqs.forEach((q, qi) => {
        const key = `F${fi + 1}_${nick}_${sub}_Q${qi + 1}`;
        formHeaders.push(key);
        formColMap.push({ form_id: f.id, question_id: q.id, colKey: key, label: q.question.slice(0, 40), type: "RATING" });
      });
      tqs.forEach((q, qi) => {
        const key = `F${fi + 1}_${nick}_${sub}_T${qi + 1}`;
        formHeaders.push(key);
        formColMap.push({ form_id: f.id, question_id: q.id, colKey: key, label: q.question.slice(0, 40), type: "TEXT" });
      });
    }

    const allHeaders = [...fixedHeaders, ...formHeaders];
    const students = await prisma.student.findMany({
      where: { section_id: section.id },
      select: { id: true, name: true, roll_no: true, user: { select: { email: true } } },
      orderBy: { roll_no: "asc" },
    });

    const existingResps = await prisma.feedbackResponse.findMany({
      where: { form_id: { in: forms.map(f => f.id) } },
      select: { form_id: true, student_id: true, answers: { select: { question_id: true, rating: true, answer_text: true } } },
    });
    const respMap = {};
    for (const r of existingResps) {
      if (!respMap[r.student_id]) respMap[r.student_id] = {};
      respMap[r.student_id][r.form_id] = Object.fromEntries(r.answers.map(a => [a.question_id, a.rating ?? a.answer_text ?? ""]));
    }

    const infoRows = [
      ["TEACHING FEEDBACK BULK SUBMISSION"],
      [`Group: ${group.name}`, `Section: ${section.name}`, `Course: ${section.course?.name}`, `Sem: ${section.semester}`, `Batch: ${section.batch || ""}`],
      [`Group ID (do not edit): ${groupId}`],
      [`Section ID (do not edit): ${section.id}`],
      [],
      ["", "", "", ...forms.flatMap((f, fi) => {
        const nick = f.faculty?.nick_name || f.faculty?.name || `F${fi + 1}`;
        const sub = f.subject?.nickname || f.subject?.code || `S${fi + 1}`;
        return (f.category?.questions || []).map(() => `${nick} · ${sub} (Form ${fi + 1})`);
      })],
      ["", "", "", ...formColMap.map((c) => c.label)],
      allHeaders,
    ];

    const dataRows = students.map((st) => {
      const fixed = [st.user?.email || "", st.name, st.roll_no || ""];
      const vals = formColMap.map(({ form_id, question_id }) =>
        respMap[st.id]?.[form_id]?.[question_id] ?? ""
      );
      return [...fixed, ...vals];
    });

    const guideRow = ["RATING: 1=Poor 2=Fair 3=Good 4=Very Good 5=Excellent", "", "",
      ...formColMap.map((c) => c.type === "RATING" ? "1–5" : "text")];

    const ws = xlsx.utils.aoa_to_sheet([...infoRows, guideRow, ...dataRows]);
    ws["!cols"] = allHeaders.map((h, i) => ({ wch: i < 3 ? 32 : Math.max(h.length + 2, 12) }));
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Reference + Instructions
  const facWs = xlsx.utils.aoa_to_sheet([
    ["Form#", "Faculty", "Nick", "Subject", "Code", "Section"],
    ...group.feedbackForms.map((f, i) => [`Form ${i + 1}`, f.faculty?.name || "—", f.faculty?.nick_name || "—", f.subject?.name || "—", f.subject?.code || "—", f.section?.name || "—"]),
  ]);
  facWs["!cols"] = [{ wch: 8 }, { wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 12 }];
  xlsx.utils.book_append_sheet(wb, facWs, "Forms (Reference)");

  const instrWs = xlsx.utils.aoa_to_sheet([
    ["HOW TO USE THIS BULK SUBMISSION TEMPLATE"], [],
    ["1. Each sheet = one section. Rows = students."],
    ["2. Columns after roll_no = one column per question per form (Faculty × Subject)."],
    ["3. Column header: F1_FacultyNick_SubjectCode_Q1 = Form 1, Question 1."],
    ["4. RATING: enter 1–5. TEXT: enter free text."],
    ["5. student_email must match login email exactly."],
    ["6. Pre-filled = already submitted. Leave blank to skip."],
    ["7. Do NOT edit rows 1-4 (metadata) or column headers."],
  ]);
  instrWs["!cols"] = [{ wch: 80 }];
  xlsx.utils.book_append_sheet(wb, instrWs, "Instructions");

  return {
    buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }),
    filename: `${group.name.replace(/[^a-z0-9]/gi, "_")}_bulk_responses_${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
};

// ─── GROUP BULK SUBMIT — capture full snapshot for every student ─
export const bulkSubmitGroupResponses = async (groupId, buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer", cellFormula: false, cellNF: false, raw: true });

  const group = await prisma.feedbackFormGroup.findUnique({
    where: { id: groupId },
    include: {
      feedbackForms: {
        where: { is_active: true },
        include: {
          category: { include: { questions: { orderBy: { order: "asc" } } } },
          section: { select: { id: true } },
        },
        orderBy: [{ section: { name: "asc" } }, { faculty: { name: "asc" } }],
      },
    },
  });
  if (!group) throw Object.assign(new Error("Group not found"), { statusCode: 404 });

  const SKIP = new Set(["forms (reference)", "instructions"]);
  const results = { submitted: 0, updated: 0, skipped: 0, failed: [], sheets_processed: 0 };

  for (const sheetName of wb.SheetNames) {
    if (SKIP.has(sheetName.toLowerCase())) continue;

    const ws = wb.Sheets[sheetName];
    const allRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true, blankrows: false });

    const gRow = String(allRows[2]?.[0] || "");
    const sRow = String(allRows[3]?.[0] || "");
    const gId = gRow.includes(":") ? gRow.split(":").slice(1).join(":").trim() : "";
    const sId = sRow.includes(":") ? sRow.split(":").slice(1).join(":").trim() : "";

    if (!gId || !sId) { results.failed.push({ sheet: sheetName, reason: "Could not read Group/Section ID from metadata" }); continue; }
    if (gId !== groupId) { results.failed.push({ sheet: sheetName, reason: "Group ID mismatch" }); continue; }

    results.sheets_processed++;

    const hIdx = allRows.findIndex((r) => r.some((c) => String(c).toLowerCase().includes("student_email")));
    if (hIdx === -1) { results.failed.push({ sheet: sheetName, reason: "Column header row not found" }); continue; }

    const headers = allRows[hIdx].map(h => String(h).trim());
    const dataRows = allRows.slice(hIdx + 1).filter(r => r.some(c => c !== ""));

    // Only forms for this section
    const sectionForms = group.feedbackForms.filter(
      f => (f.section?.id || f.section_id) === sId
    );

    // Build col → { form_id, question_id, type }
    const colMap = [];
    for (let ci = 3; ci < headers.length; ci++) {
      const h = headers[ci]; if (!h) continue;
      const m = h.match(/^F(\d+)_/); if (!m) continue;
      const formIdx = parseInt(m[1]) - 1;
      const form = sectionForms[formIdx];
      if (!form) continue;
      const qm = h.match(/_Q(\d+)$/);
      const tm = h.match(/_T(\d+)$/);
      const qs = form.category?.questions || [];
      const rqs = qs.filter(q => q.type === "RATING");
      const tqs = qs.filter(q => q.type === "TEXT");
      let question = null;
      if (qm) question = rqs[parseInt(qm[1]) - 1] || null;
      if (tm) question = tqs[parseInt(tm[1]) - 1] || null;
      if (question) colMap.push({ colIdx: ci, form_id: form.id, question_id: question.id, type: question.type });
    }

    for (const row of dataRows) {
      const emailIdx = headers.findIndex(h => h && String(h).toLowerCase().includes("student_email"));
      const email = String(row[emailIdx >= 0 ? emailIdx : 0] || "").trim();
      if (!email || email.startsWith("RATING:")) continue;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { student: { select: { id: true, name: true } } },
      });
      if (!user?.student) { results.failed.push({ sheet: sheetName, email, reason: "Student not found" }); continue; }

      const student_id = user.student.id;

      // Capture snapshot ONCE per student (not per form)
      const snapshot = await getStudentSnapshot(student_id);

      // Group answers by form
      const byForm = {};
      for (const { colIdx, form_id, question_id, type } of colMap) {
        const raw = String(row[colIdx] ?? "").trim();
        if (!raw) continue;
        if (!byForm[form_id]) byForm[form_id] = [];
        if (type === "RATING") {
          const r = parseInt(raw);
          if (!isNaN(r) && r >= 1 && r <= 5) byForm[form_id].push({ question_id, rating: r });
        } else {
          byForm[form_id].push({ question_id, answer_text: raw });
        }
      }

      for (const [form_id, answers] of Object.entries(byForm)) {
        if (!answers.length) continue;
        try {
          const existing = await prisma.feedbackResponse.findUnique({
            where: { form_id_student_id: { form_id, student_id } },
          });

          if (existing) {
            // Update answers only — snapshot was already captured at first submission
            for (const ans of answers) {
              await prisma.feedbackAnswer.upsert({
                where: { response_id_question_id: { response_id: existing.id, question_id: ans.question_id } },
                create: { response_id: existing.id, ...ans },
                update: ans.rating != null ? { rating: ans.rating } : { answer_text: ans.answer_text },
              });
            }
            results.updated++;
          } else {
            // New response — store snapshot
            await prisma.feedbackResponse.create({
              data: {
                form_id,
                student_id,
                ...snapshot,   // all 7 snap_* fields
                answers: { create: answers },
              },
            });
            results.submitted++;
          }
        } catch (e) { results.failed.push({ sheet: sheetName, email, form_id, reason: e.message }); }
      }
    }
  }

  return results;
};

// ─── TEACHING REPORT ─────────────────────────────────────────
export const getTeachingReport = async ({ category_id } = {}) => {
  const forms = await prisma.feedbackForm.findMany({
    where: { faculty_id: { not: null }, ...(category_id && { category_id }) },
    include: {
      faculty: { select: { id: true, name: true, nick_name: true, dept_id: true, department: { select: { id: true, name: true } } } },
      subject: { select: { id: true, name: true, code: true, nickname: true } },
      section: { select: { id: true, name: true, semester: true, batch: true, course: { select: { id: true, name: true, program: { select: { id: true, name: true, department: { select: { id: true, name: true } } } } } } } },
      category: { select: { id: true, name: true } },
      responses: { include: { answers: { select: { rating: true, question_id: true } } } },
      _count: { select: { responses: true } },
    },
    orderBy: [{ section: { course: { program: { department: { name: "asc" } } } } }, { section: { name: "asc" } }],
  });

  const avg = (answers) => {
    const rs = answers.filter(a => a.rating != null).map(a => a.rating);
    return rs.length ? parseFloat((rs.reduce((s, v) => s + v, 0) / rs.length).toFixed(2)) : null;
  };

  const tree = {};
  forms.forEach((f) => {
    const dept = f.section?.course?.program?.department || f.faculty?.department || { id: "unknown", name: "Unknown" };
    const course = f.section?.course || { id: "unknown", name: "Unknown" };
    const section = f.section || { id: "unknown", name: "Unknown", semester: null, batch: null };
    const allA = f.responses.flatMap(r => r.answers);
    const dKey = dept.id;
    const cKey = `${dept.id}::${course.id}`;
    const sKey = `${dept.id}::${course.id}::${section.id}`;
    if (!tree[dKey]) tree[dKey] = { id: dept.id, name: dept.name, courses: {} };
    if (!tree[dKey].courses[cKey]) tree[dKey].courses[cKey] = { id: course.id, name: course.name, sections: {} };
    if (!tree[dKey].courses[cKey].sections[sKey])
      tree[dKey].courses[cKey].sections[sKey] = { id: section.id, name: section.name, semester: section.semester, batch: section.batch, forms: [] };
    tree[dKey].courses[cKey].sections[sKey].forms.push({
      id: f.id, title: f.title, is_active: f.is_active, start_date: f.start_date, end_date: f.end_date,
      responses: f._count.responses, avg_rating: avg(allA),
      faculty: { id: f.faculty?.id, name: f.faculty?.name, nick_name: f.faculty?.nick_name },
      subject: { id: f.subject?.id, name: f.subject?.name, code: f.subject?.code, nickname: f.subject?.nickname },
      category: { id: f.category?.id, name: f.category?.name },
    });
  });

  return Object.values(tree).map((dept) => ({
    ...dept,
    courses: Object.values(dept.courses).map((course) => ({
      ...course,
      sections: Object.values(course.sections).map((section) => {
        const allAvgs = section.forms.map(f => f.avg_rating).filter(v => v != null);
        return { ...section, avg_rating: allAvgs.length ? parseFloat((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2)) : null, total_responses: section.forms.reduce((s, f) => s + f.responses, 0) };
      }),
    })),
  }));
};

// ─── LEVEL EXPORT ─────────────────────────────────────────────
export const exportLevelReport = async ({ level, id, category_id }) => {
  const where = {
    faculty_id: { not: null },
    ...(category_id && { category_id }),
    ...(level === "dept" && { section: { course: { program: { department: { id } } } } }),
    ...(level === "course" && { section: { course: { id } } }),
    ...(level === "section" && { section_id: id }),
  };

  const forms = await prisma.feedbackForm.findMany({
    where,
    include: {
      faculty: { select: { id: true, name: true, nick_name: true } },
      subject: { select: { id: true, name: true, code: true, nickname: true } },
      section: { select: { id: true, name: true, semester: true, batch: true, course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } } } },
      category: { select: { id: true, name: true, questions: { orderBy: { order: "asc" } } } },
      responses: {
        include: {
          answers: { include: { question: { select: { id: true, type: true, question: true } } } },
          student: { select: { name: true, roll_no: true, enrollment_no: true, user: { select: { email: true } } } },
        },
      },
      _count: { select: { responses: true } },
    },
    orderBy: [{ section: { name: "asc" } }, { faculty: { name: "asc" } }],
  });
  if (!forms.length) throw Object.assign(new Error("No teaching forms found for this level"), { statusCode: 404 });

  const wb = xlsx.utils.book_new();
  const addSheet = (name, data, cols) => { const ws = xlsx.utils.aoa_to_sheet(data); if (cols) ws["!cols"] = cols; addSheetSafe(wb, ws, name); };
  const calcAvg = (answers) => { const rs = answers.filter(a => a.rating != null).map(a => a.rating); return rs.length ? rs.reduce((s, v) => s + v, 0) / rs.length : null; };
  const ratingQs = forms[0]?.category?.questions?.filter(q => q.type === "RATING") || [];

  const summaryHeaders = ["Dept", "Course", "Section", "Sem", "Faculty", "Nick", "Subject", "Code", "Responses", "Avg Rating", ...ratingQs.map((q, i) => `Q${i + 1}`)];
  const summaryRows = forms.map((f) => {
    const allA = f.responses.flatMap(r => r.answers);
    const qAvgs = ratingQs.map((q) => {
      const vals = allA.filter(a => a.question_id === q.id && a.rating != null).map(a => a.rating);
      return vals.length ? fmtAvg(vals.reduce((a, b) => a + b, 0) / vals.length) : "—";
    });
    return [f.section?.course?.program?.department?.name || "—", f.section?.course?.name || "—", f.section?.name || "—", f.section?.semester || "—", f.faculty?.name || "—", f.faculty?.nick_name || "—", f.subject?.name || "—", f.subject?.code || "—", f._count.responses, fmtAvg(calcAvg(allA)), ...qAvgs];
  });
  addSheet("Summary", [summaryHeaders, ...summaryRows]);

  // All responses — use snap_* for student context
  const questions = forms[0]?.category?.questions || [];
  const rHeaders = ["Section", "Faculty", "Subject", "Code", "Student", "Roll No", "Enroll No", "Email",
    "Dept (snap)", "Program (snap)", "Course (snap)", "Section (snap)", "Semester (snap)", "Batch (snap)", "Acad Year (snap)", "Submitted",
    ...questions.map((q, i) => `Q${i + 1}`)];
  const rRows = forms.flatMap((f) => f.responses.map((r) => {
    const am = {}; r.answers.forEach(a => { am[a.question_id] = a.rating ?? a.answer_text ?? ""; });
    return [
      f.section?.name || "—", f.faculty?.name || "—", f.subject?.name || "—", f.subject?.code || "—",
      r.student?.name || "—", r.student?.roll_no || "—", r.student?.enrollment_no || "—", r.student?.user?.email || "—",
      r.snap_dept_name || "—", r.snap_program_name || "—", r.snap_course_name || "—",
      r.snap_section_name || "—", r.snap_semester ?? "—", r.snap_batch || "—", r.snap_academic_year || "—",
      new Date(r.submittedAt).toLocaleString("en-IN"),
      ...questions.map(q => am[q.id] ?? ""),
    ];
  }));
  addSheet("All Responses", [rHeaders, ...rRows]);

  const levelLabel = level === "dept" ? forms[0]?.section?.course?.program?.department?.name
    : level === "course" ? forms[0]?.section?.course?.name : forms[0]?.section?.name;
  return {
    buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }),
    filename: `teaching_report_${level}_${(levelLabel || "report").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.xlsx`,
  };
};

// ─── FORM GROUP CRUD ──────────────────────────────────────────
export const listFormGroups = async ({ page = 1, limit = 20, search, category_id } = {}) => {
  page = parseInt(page) || 1; limit = parseInt(limit) || 20;
  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" } }),
    ...(category_id && { category_id }),
  };
  const [total, groups] = await Promise.all([
    prisma.feedbackFormGroup.count({ where }),
    prisma.feedbackFormGroup.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        feedbackForms: {
          include: {
            faculty: { select: { id: true, name: true, nick_name: true } },
            subject: { select: { id: true, name: true, code: true, nickname: true } },
            section: { select: { id: true, name: true, semester: true, batch: true, course: { select: { id: true, name: true, program: { select: { id: true, name: true, department: { select: { id: true, name: true } } } } } } } },
            _count: { select: { responses: true } },
          },
        },
        _count: { select: { feedbackForms: true } },
      },
    }),
  ]);
  return { total, page, limit, groups: groups.map(g => ({ ...g, forms: g.feedbackForms || [], feedbackForms: undefined })) };
};

export const getFormGroup = async (id) => {
  const g = await prisma.feedbackFormGroup.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      feedbackForms: {
        include: {
          faculty: { select: { id: true, name: true, nick_name: true } },
          subject: { select: { id: true, name: true, code: true, nickname: true } },
          section: { select: { id: true, name: true, semester: true, batch: true, course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } } } },
          responses: { select: { id: true } },
          _count: { select: { responses: true } },
        },
        orderBy: [{ section: { name: "asc" } }, { faculty: { name: "asc" } }],
      },
      _count: { select: { feedbackForms: true } },
    },
  });
  if (!g) throw Object.assign(new Error("Form group not found"), { statusCode: 404 });
  return { ...g, forms: g.feedbackForms || [], feedbackForms: undefined };
};

export const updateFormGroup = async (id, data) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.start_date !== undefined) updateData.start_date = new Date(data.start_date);
  if (data.end_date !== undefined) updateData.end_date = new Date(data.end_date);
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.category_id !== undefined) updateData.category_id = data.category_id;
  updateData.updatedAt = new Date();

  const group = await prisma.feedbackFormGroup.update({ where: { id }, data: updateData });
  if (data.is_active !== undefined || data.start_date !== undefined || data.end_date !== undefined) {
    const formUpdate = {};
    if (data.is_active !== undefined) formUpdate.is_active = data.is_active;
    if (data.start_date !== undefined) formUpdate.start_date = new Date(data.start_date);
    if (data.end_date !== undefined) formUpdate.end_date = new Date(data.end_date);
    await prisma.feedbackForm.updateMany({ where: { feedbackFormGroupId: id }, data: formUpdate });
  }
  return group;
};

export const deleteFormGroup = async (id) => {
  await prisma.feedbackForm.deleteMany({ where: { feedbackFormGroupId: id } });
  await prisma.feedbackFormGroup.delete({ where: { id } });
  return { deleted: true };
};

export const exportGroupResults = async (groupId) => {
  const group = await prisma.feedbackFormGroup.findUnique({
    where: { id: groupId },
    include: {
      feedbackForms: {
        where: { is_active: true },
        include: {
          faculty: { select: { id: true, name: true, nick_name: true } },
          subject: { select: { id: true, name: true, code: true, nickname: true } },
          section: { select: { id: true, name: true, semester: true, batch: true, course: { select: { name: true, program: { select: { name: true, department: { select: { name: true } } } } } } } },
          category: { select: { id: true, name: true, questions: { orderBy: { order: "asc" } } } },
          responses: {
            include: {
              answers: { include: { question: { select: { id: true, type: true } } } },
              student: { select: { name: true, roll_no: true, enrollment_no: true, user: { select: { email: true } } } },
            },
          },
          _count: { select: { responses: true } },
        },
        orderBy: [{ section: { name: "asc" } }, { faculty: { name: "asc" } }],
      },
    },
  });
  if (!group) throw Object.assign(new Error("Group not found"), { statusCode: 404 });
  const groupForms = group.feedbackForms || [];
  if (!groupForms.length) throw Object.assign(new Error("No active forms in this group"), { statusCode: 404 });

  const wb = xlsx.utils.book_new();
  const calcAvg = (answers) => { const rs = answers.filter(a => a.rating != null).map(a => a.rating); return rs.length ? rs.reduce((s, v) => s + v, 0) / rs.length : null; };
  const questions = groupForms[0]?.category?.questions?.filter(q => q.type === "RATING") || [];

  const sumHeaders = ["Section", "Dept", "Faculty", "Nick", "Subject", "Code", "Responses", "Avg Rating", ...questions.map((_, i) => `Q${i + 1}`)];
  const sumRows = groupForms.map((f) => {
    const allA = f.responses.flatMap(r => r.answers);
    const qAvgs = questions.map((q) => { const vs = allA.filter(a => a.question_id === q.id && a.rating != null).map(a => a.rating); return vs.length ? fmtAvg(vs.reduce((a, b) => a + b, 0) / vs.length) : "—"; });
    return [fmtSecLabel(f.section, "compact"), f.section?.course?.program?.department?.name || "—", f.faculty?.name || "—", f.faculty?.nick_name || "—", f.subject?.name || "—", f.subject?.code || "—", f._count.responses, fmtAvg(calcAvg(allA)), ...qAvgs];
  });
  const ws1 = xlsx.utils.aoa_to_sheet([sumHeaders, ...sumRows]);
  ws1["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 24 }, { wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
  xlsx.utils.book_append_sheet(wb, ws1, "Summary");

  // All responses — snap_* fields
  const respHeaders = ["Section", "Faculty", "Subject", "Student", "Roll No", "Email",
    "Dept (snap)", "Program (snap)", "Course (snap)", "Section (snap)", "Semester (snap)", "Batch (snap)", "Acad Year (snap)", "Submitted",
    ...questions.map((q, i) => `Q${i + 1}: ${q.question.slice(0, 25)}`)];
  const respRows = groupForms.flatMap(f => f.responses.map(r => {
    const am = {}; r.answers.forEach(a => { am[a.question_id] = a.rating ?? a.answer_text ?? ""; });
    return [
      fmtSecLabel(f.section, "short"), f.faculty?.name || "—", f.subject?.name || "—",
      r.student?.name || "—", r.student?.roll_no || "—", r.student?.user?.email || "—",
      r.snap_dept_name || "—", r.snap_program_name || "—", r.snap_course_name || "—",
      r.snap_section_name || "—", r.snap_semester ?? "—", r.snap_batch || "—", r.snap_academic_year || "—",
      new Date(r.submittedAt).toLocaleString("en-IN"),
      ...questions.map(q => am[q.id] ?? ""),
    ];
  }));
  const ws3 = xlsx.utils.aoa_to_sheet([respHeaders, ...respRows]);
  xlsx.utils.book_append_sheet(wb, ws3, "All Responses");

  return {
    buffer: xlsx.write(wb, { type: "buffer", bookType: "xlsx" }),
    filename: `group_${group.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_results.xlsx`,
  };
};