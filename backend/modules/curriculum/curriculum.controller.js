// backend/modules/curriculum/curriculum.controller.js
import * as curriculumService from "./curriculum.service.js";

export async function getAll(req, res) {
  try {
    const { page = 1, limit = 50, program_id, course_id, semester, session_id } = req.query;
    const result = await curriculumService.getCurriculumSubjects({
      page: Number(page), limit: Number(limit),
      program_id, course_id, semester, session_id,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function addSubject(req, res) {
  try {
    const data = await curriculumService.addCurriculumSubject(req.validatedData ?? req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function autoAssignSection(req, res) {
  try {
    const { id } = req.params;
    const result = await curriculumService.autoAssignSubjectsToSection(
      id,
      req.body?.reason ?? "Manual trigger",
      req.user?.id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function bulkAutoAssign(req, res) {
  try {
    const result = await curriculumService.bulkAutoAssign(req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function removeSubject(req, res) {
  try {
    await curriculumService.deleteCurriculumSubject(req.params.id);
    res.json({ success: true, message: "Removed" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function bulkUpload(req, res) {
  try {
    const result = await curriculumService.bulkUploadCurriculum(req.file?.buffer, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getTemplate(req, res) {
  try {
    const buffer = await curriculumService.getCurriculumTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="curriculum-template.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getHistory(req, res) {
  try {
    const data = await curriculumService.getCurriculumHistory(req.params.section_id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}