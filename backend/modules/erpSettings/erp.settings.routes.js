// backend/modules/settings/erp.settings.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getAllSettings, updateSettings, getSettingsByCategory } from "./erp.settings.service.js";

const router = Router();

// GET /api/settings/erp — get all settings (admin+)
router.get("/erp", authenticate, async (req, res) => {
  try {
    if (!["ADMIN","SUPER_ADMIN"].includes(req.user.role))
      return res.status(403).json({ success: false, message: "Forbidden" });
    const data = await getAllSettings();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/settings/erp/:category
router.get("/erp/:category", authenticate, async (req, res) => {
  try {
    const data = await getSettingsByCategory(req.params.category);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/settings/erp — update settings (SUPER_ADMIN only)
router.patch("/erp", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN")
      return res.status(403).json({ success: false, message: "Only Super Admin can update settings" });
    const { updates } = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ success: false, message: "updates must be an array" });
    const data = await updateSettings(updates, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
