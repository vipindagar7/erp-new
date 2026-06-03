// backend/modules/settings/settings.controller.js
import {
  getMyProfileService,
  updateStudentProfileService,
  updateFacultyProfileService,
} from "./settings.service.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = await getMyProfileService(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("[Settings] getMyProfile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await updateStudentProfileService(req.user.id, req.body);
    if (!updated) return res.status(404).json({ message: "Student not found" });
    res.json(updated);
  } catch (error) {
    console.error("[Settings] updateStudentProfile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const updateFacultyProfile = async (req, res) => {
  try {
    if (req.user.role !== "FACULTY") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await updateFacultyProfileService(req.user.id, req.body);
    if (!updated) return res.status(404).json({ message: "Faculty not found" });
    res.json(updated);
  } catch (error) {
    console.error("[Settings] updateFacultyProfile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
