// backend/modules/feedback/feedback.controller.js
import * as feedbackService from "./feedback.service.js";

// ── Categories ────────────────────────────────────────────────────────────────

export async function listCategories(req, res) {
  try {
    const data = await feedbackService.getAllCategories();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createCategory(req, res) {
  try {
    const data = await feedbackService.createCategory(req.validatedData ?? req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateCategory(req, res) {
  try {
    const data = await feedbackService.updateCategory(req.params.id, req.validatedData ?? req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteCategory(req, res) {
  try {
    await feedbackService.deleteCategory(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function listQuestions(req, res) {
  try {
    const data = await feedbackService.getAllQuestions(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createQuestion(req, res) {
  try {
    const data = await feedbackService.createQuestion(req.validatedData ?? req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateQuestion(req, res) {
  try {
    const data = await feedbackService.updateQuestion(req.params.id, req.validatedData ?? req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteQuestion(req, res) {
  try {
    await feedbackService.deleteQuestion(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function bulkUploadQuestions(req, res) {
  try {
    const result = await feedbackService.bulkUploadQuestions(req.file?.buffer);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getQuestionsTemplate(req, res) {
  try {
    const buffer = await feedbackService.getQuestionsTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="questions-template.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── Forms ─────────────────────────────────────────────────────────────────────

export async function listForms(req, res) {
  try {
    const result = await feedbackService.getAllForms(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getForm(req, res) {
  try {
    const data = await feedbackService.getFormById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createForm(req, res) {
  try {
    const data = await feedbackService.createForms(req.validatedData ?? req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateForm(req, res) {
  try {
    const data = await feedbackService.updateForm(req.params.id, req.validatedData ?? req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteForm(req, res) {
  try {
    await feedbackService.deleteForm(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function toggleForm(req, res) {
  try {
    const data = await feedbackService.toggleForm(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function setFormAction(req, res) {
  try {
    const data = await feedbackService.setActionTaken(req.params.id, req.body?.action_taken);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getFormResults(req, res) {
  try {
    const data = await feedbackService.getFormResults(req.params.id, req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportFormResults(req, res) {
  try {
    const buffer = await feedbackService.exportFormResults(req.params.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="feedback-${req.params.id}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getFormTemplate(req, res) {
  try {
    const buffer = await feedbackService.getBulkSubmitTemplate(req.params.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="feedback-template-${req.params.id}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitFeedback(req, res) {
  try {
    const data = await feedbackService.submitFeedback(
      req.params.id,
      req.user.id,
      req.body?.answers
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function bulkSubmit(req, res) {
  try {
    const result = await feedbackService.bulkSubmitFeedback(req.params.id, req.file?.buffer);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteFormResponses(req, res) {
  try {
    await feedbackService.deleteFormResponses(req.params.id);
    res.json({ success: true, message: "Responses deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function listGroups(req, res) {
  try {
    const data = await feedbackService.getAllGroups(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getGroup(req, res) {
  try {
    const data = await feedbackService.getGroupById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateGroup(req, res) {
  try {
    const data = await feedbackService.updateGroup(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteGroup(req, res) {
  try {
    await feedbackService.deleteGroup(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getGroupTemplate(req, res) {
  try {
    const buffer = await feedbackService.getGroupBulkTemplate(req.params.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="group-template-${req.params.id}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function bulkSubmitGroup(req, res) {
  try {
    const result = await feedbackService.bulkSubmitGroupResponses(req.params.id, req.file?.buffer);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function exportGroupResults(req, res) {
  try {
    const buffer = await feedbackService.exportGroupResults(req.params.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="group-results-${req.params.id}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getTeachingReport(req, res) {
  try {
    const data = await feedbackService.getTeachingReport(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportTeachingReport(req, res) {
  try {
    const { level, id } = req.params;
    const buffer = await feedbackService.exportTeachingReport(level, id, req.query);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="teaching-report-${level}-${id}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── Student: my forms ─────────────────────────────────────────────────────────

export async function getMyForms(req, res) {
  try {
    const data = await feedbackService.getActiveFormsForStudent(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}