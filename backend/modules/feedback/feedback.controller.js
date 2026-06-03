import prisma from "../../utils/prisma.js";
import * as svc from "./feedback.service.js";

const ok = (res, data, msg, status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => { if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); };
const xlsx_res = (res, buf, name) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  return res.send(buf);
};

// ── Helper: resolve student_id from req.user ───────────────────────────────────
// req.user is a User row. Students have user_id pointing to User.id
const getStudentId = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  if (!student) { const e = new Error("Student profile not found"); e.statusCode = 404; throw e; }
  return student.id;
};

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════

// GET /feedback/categories
export const listCategories = async (req, res, next) => {
  try {
    const list = await svc.getAllCategories();
    ok(res, {
      categories: Array.isArray(list) ? list : [],
      pagination: { total: Array.isArray(list) ? list.length : 0, page: 1, limit: 200, pages: 1 },
    });
  }
  catch (e) { fail(res, e, next); }
};

// GET /feedback/categories/:id
export const getCategoryById = async (req, res, next) => {
  try {
    const r = await svc.getCategoryById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: "Category not found" });
    ok(res, r);
  } catch (e) { fail(res, e, next); }
};

// POST /feedback/categories
export const createCategory = async (req, res, next) => {
  try { ok(res, await svc.createCategory({ ...(req.validatedData ?? req.body) }), "Category created", 201); }
  catch (e) { fail(res, e, next); }
};

// PATCH /feedback/categories/:id
export const updateCategory = async (req, res, next) => {
  try { ok(res, await svc.updateCategory(req.params.id, req.validatedData), "Category updated"); }
  catch (e) { fail(res, e, next); }
};

// DELETE /feedback/categories/:id
export const deleteCategory = async (req, res, next) => {
  try { await svc.deleteCategory(req.params.id); ok(res, null, "Category deleted"); }
  catch (e) { fail(res, e, next); }
};

// ══════════════════════════════════════════════════════════════════════════════
// QUESTIONS
// ══════════════════════════════════════════════════════════════════════════════

// GET /feedback/questions  (?category_id=&page=&limit=)
export const listQuestions = async (req, res, next) => {
  try { ok(res, await svc.getAllQuestions(req.query)); }
  catch (e) { fail(res, e, next); }
};

// GET /feedback/questions/:id
export const getQuestionById = async (req, res, next) => {
  try {
    const r = await svc.getQuestionById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: "Question not found" });
    ok(res, r);
  } catch (e) { fail(res, e, next); }
};

// POST /feedback/questions
export const createQuestion = async (req, res, next) => {
  try { ok(res, await svc.createQuestion(req.validatedData ?? req.body), "Question created", 201); }
  catch (e) { fail(res, e, next); }
};

// PATCH /feedback/questions/:id
export const updateQuestion = async (req, res, next) => {
  try { ok(res, await svc.updateQuestion(req.params.id, req.validatedData ?? req.body), "Question updated"); }
  catch (e) { fail(res, e, next); }
};

// DELETE /feedback/questions/:id
export const deleteQuestion = async (req, res, next) => {
  try { await svc.deleteQuestion(req.params.id); ok(res, null, "Question deleted"); }
  catch (e) { fail(res, e, next); }
};

// GET /feedback/questions/template
export const getQuestionTemplate = async (req, res, next) => {
  try { xlsx_res(res, await svc.generateQuestionTemplate(), "questions_template.xlsx"); }
  catch (e) { next(e); }
};

// POST /feedback/questions/bulk-upload
export const bulkUploadQuestions = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const r = await svc.bulkUploadQuestions(req.file.buffer);
    ok(res, r, `${r.created.length} created, ${r.failed.length} failed`);
  } catch (e) { next(e); }
};

// ══════════════════════════════════════════════════════════════════════════════
// FORMS — admin CRUD
// ══════════════════════════════════════════════════════════════════════════════

// GET /feedback/forms
export const listForms = async (req, res, next) => {
  try {
    const r = await svc.getAllForms(req.query);
    res.json({ success: true, data: { forms: r.forms, pagination: r.pagination } });
  } catch (e) { fail(res, e, next); }
};

// POST /feedback/forms
export const createForm = async (req, res, next) => {
  try {
    const data = req.validatedData ?? req.body;
    let r;
    if (data.form_type) {
      r = await svc.createForms(data, req.user.id);
    } else {
      r = await svc.createForm(data);
    }
    res.status(201).json({ success: true, message: "Form(s) created", data: r });
  } catch (e) { fail(res, e, next); }
};

// GET /feedback/forms/:formId
export const getFormById = async (req, res, next) => {
  try {
    const r = await svc.getFormById(req.params.formId);
    if (!r) return res.status(404).json({ success: false, message: "Form not found" });
    ok(res, r);
  } catch (e) { fail(res, e, next); }
};

// PATCH /feedback/forms/:formId
export const updateForm = async (req, res, next) => {
  try { ok(res, await svc.updateForm(req.params.formId, req.validatedData ?? req.body), "Form updated"); }
  catch (e) { fail(res, e, next); }
};

// DELETE /feedback/forms/:formId
export const deleteForm = async (req, res, next) => {
  try { await svc.deleteForm(req.params.formId); ok(res, null, "Form deleted"); }
  catch (e) { fail(res, e, next); }
};

// DELETE /feedback/forms/:formId/responses
export const deleteFormResponses = async (req, res, next) => {
  try { ok(res, await svc.deleteFormResponses(req.params.formId), "Responses deleted"); }
  catch (e) { fail(res, e, next); }
};

// PATCH /feedback/forms/:formId/toggle
export const toggleFormActive = async (req, res, next) => {
  try { ok(res, await svc.toggleFormActive(req.params.formId), "Form toggled"); }
  catch (e) { fail(res, e, next); }
};

// PATCH /feedback/forms/:formId/action
export const updateActionTaken = async (req, res, next) => {
  try {
    const { action_taken } = req.body;
    ok(res, await svc.updateActionTaken(req.params.formId, action_taken), "Action updated");
  } catch (e) { fail(res, e, next); }
};

// ══════════════════════════════════════════════════════════════════════════════
// FORMS — bulk (admin)
// ══════════════════════════════════════════════════════════════════════════════

// GET /feedback/forms/:formId/bulk-template
export const getBulkTemplate = async (req, res, next) => {
  try {
    const { buffer, formTitle } = await svc.generateFeedbackTemplate(req.params.formId);
    const name = `feedback_template_${formTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.xlsx`;
    xlsx_res(res, buffer, name);
  } catch (e) { fail(res, e, next); }
};

// POST /feedback/forms/:formId/bulk-submit  (file upload)
export const bulkSubmit = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const r = await svc.bulkSubmitFeedback(req.params.formId, req.file.buffer);
    ok(res, r, `${r.success.length} submitted, ${r.failed.length} failed`);
  } catch (e) { fail(res, e, next); }
};

// ══════════════════════════════════════════════════════════════════════════════
// FORMS — results (admin + faculty)
// ══════════════════════════════════════════════════════════════════════════════

// GET /feedback/forms/:formId/results
export const getFormResults = async (req, res, next) => {
  try { ok(res, await svc.getFormResults(req.params.formId)); }
  catch (e) { fail(res, e, next); }
};

// GET /feedback/forms/:formId/export
export const exportFormResults = async (req, res, next) => {
  try {
    const { buffer, filename } = await svc.exportFormResults(req.params.formId);
    xlsx_res(res, buffer, filename);
  } catch (e) { fail(res, e, next); }
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT-FACING
// ══════════════════════════════════════════════════════════════════════════════

// GET /feedback/my-forms
export const getMyForms = async (req, res, next) => {
  try {
    const student_id = await getStudentId(req.user.id);
    ok(res, await svc.getActiveFormsForStudent(student_id));
  } catch (e) { fail(res, e, next); }
};

// GET /feedback/forms/:formId/questions
export const getFormQuestions = async (req, res, next) => {
  try { ok(res, await svc.getFormQuestions(req.params.formId)); }
  catch (e) { fail(res, e, next); }
};

// POST /feedback/forms/:formId/submit
export const submitFeedback = async (req, res, next) => {
  try {
    const student_id = await getStudentId(req.user.id);
    const answers = req.validatedData?.answers ?? req.body?.answers;
    if (!answers || !answers.length) {
      return res.status(422).json({ success: false, message: "answers array is required" });
    }
    ok(res, await svc.submitFeedback(req.params.formId, student_id, answers), "Feedback submitted", 201);
  } catch (e) { fail(res, e, next); }
};

// GET /feedback/teaching-report
export const getTeachingReport = async (req, res, next) => {
  try { ok(res, await svc.getTeachingReport({ category_id: req.query.category_id })); }
  catch (e) { fail(res, e, next); }
};

// GET /feedback/export-level?level=dept|course|section&id=X&category_id=Y
export const exportLevelReport = async (req, res, next) => {
  try {
    const { level, id, category_id } = req.query;
    if (!level || !id) return res.status(400).json({ success: false, message: "level and id are required" });
    const { buffer, filename } = await svc.exportLevelReport({ level, id, category_id });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) { fail(res, e, next); }
};

// ── Form Group CRUD ──────────────────────────────────────────────────────────
export const listFormGroups = async (req, res, next) => { try { ok(res, await svc.listFormGroups(req.query)); } catch (e) { fail(res, e, next); } };
export const getFormGroup = async (req, res, next) => { try { ok(res, await svc.getFormGroup(req.params.groupId)); } catch (e) { fail(res, e, next); } };
export const updateFormGroup = async (req, res, next) => { try { ok(res, await svc.updateFormGroup(req.params.groupId, req.body)); } catch (e) { fail(res, e, next); } };
export const deleteFormGroup = async (req, res, next) => { try { ok(res, await svc.deleteFormGroup(req.params.groupId)); } catch (e) { fail(res, e, next); } };
export const exportGroupResults = async (req, res, next) => {
  try {
    const { buffer, filename } = await svc.exportGroupResults(req.params.groupId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) { fail(res, e, next); }
};

// ── Group bulk template download ─────────────────────────────
export const getGroupBulkTemplate = async (req, res, next) => {
  try {
    const { buffer, filename } = await svc.getGroupBulkTemplate(req.params.groupId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) { fail(res, e, next); }
};

// ── Group bulk submit responses ───────────────────────────────
export const bulkSubmitGroupResponses = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Excel file required" });
    const results = await svc.bulkSubmitGroupResponses(req.params.groupId, req.file.buffer);
    ok(res, results, `${results.submitted} submitted, ${results.updated} updated, ${results.failed.length} failed`);
  } catch (e) { fail(res, e, next); }
};