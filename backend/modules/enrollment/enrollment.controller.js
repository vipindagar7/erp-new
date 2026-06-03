// backend/modules/student/enrollment.controller.js
import {
  getEnrollmentHistoryService,
  addEnrollmentService,
  updateEnrollmentService,
  setCurrentEnrollmentService,
} from "./enrollment.service.js";

export const getEnrollmentHistory = async (req, res) => {
  try {
    const data = await getEnrollmentHistoryService(req.params.id);
    if (!data) return res.status(404).json({ message: "Student not found" });
    res.json(data);
  } catch (error) {
    console.error("[Enrollment] getEnrollmentHistory:", error);
    res.status(500).json({ message: "Failed to fetch enrollment history" });
  }
};

export const addEnrollment = async (req, res) => {
  try {
    const result = await addEnrollmentService(req.params.id, req.body);
    if (result.error) return res.status(404).json({ message: result.error });
    res.status(201).json(result.enrollment);
  } catch (error) {
    console.error("[Enrollment] addEnrollment:", error);
    res.status(500).json({ message: "Failed to add enrollment" });
  }
};

export const updateEnrollment = async (req, res) => {
  try {
    const updated = await updateEnrollmentService(req.params.id, req.params.enrollId, req.body);
    if (!updated) return res.status(404).json({ message: "Enrollment record not found" });
    res.json(updated);
  } catch (error) {
    console.error("[Enrollment] updateEnrollment:", error);
    res.status(500).json({ message: "Failed to update enrollment" });
  }
};

export const setCurrentEnrollment = async (req, res) => {
  try {
    const result = await setCurrentEnrollmentService(req.params.id, req.params.enrollId);
    if (!result) return res.status(404).json({ message: "Enrollment record not found" });
    res.json({ message: "Current enrollment updated" });
  } catch (error) {
    console.error("[Enrollment] setCurrentEnrollment:", error);
    res.status(500).json({ message: "Failed to set current enrollment" });
  }
};
