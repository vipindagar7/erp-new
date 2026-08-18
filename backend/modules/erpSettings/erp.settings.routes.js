// backend/modules/erpSettings/erp.settings.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  getAllSettings, updateSettings, getSettingsByCategory,
  getModuleBlockStates, getCampusStatus,
  BLOCKABLE_MODULES,
} from "./erp.settings.service.js";

const router = Router();

const isSuperAdminOrRoot = (user) => user.role === "SUPER_ADMIN" || user.is_root;

// GET /api/erp-settings/erp
router.get("/erp", authenticate, async (req, res) => {
  try {
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role) && !req.user.is_root)
      return res.status(403).json({ success: false, message: "Forbidden" });
    const data = await getAllSettings();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/erp-settings/erp/:category
router.get("/erp/:category", authenticate, async (req, res) => {
  try {
    const data = await getSettingsByCategory(req.params.category);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/erp-settings/erp — SUPER_ADMIN or root only
// Password format settings are additionally gated to root-only
// inside erp.settings.service.js updateSettings() via the route
// check below.
router.patch("/erp", authenticate, async (req, res) => {
  try {
    if (!isSuperAdminOrRoot(req.user))
      return res.status(403).json({ success: false, message: "Only Super Admin or root can update settings" });

    const { updates } = req.body;
    if (!Array.isArray(updates))
      return res.status(400).json({ success: false, message: "updates must be an array" });

    // Password format settings — root only
    const PASSWORD_KEYS = [
      "default_password_student", "default_password_faculty",
      "default_password_admin",   "default_password_superadmin",
    ];
    const hasPasswordUpdate = updates.some((u) => PASSWORD_KEYS.includes(u.key));
    if (hasPasswordUpdate && !req.user.is_root)
      return res.status(403).json({ success: false, message: "Only root can change default password formats" });

    const data = await updateSettings(updates, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/erp-settings/module-blocks
router.get("/module-blocks", authenticate, async (req, res) => {
  try {
    const states = await getModuleBlockStates();
    res.json({ success: true, data: { states, modules: BLOCKABLE_MODULES } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/erp-settings/campus-status
router.get("/campus-status", authenticate, async (req, res) => {
  try {
    const status = await getCampusStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;