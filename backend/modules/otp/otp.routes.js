// backend/modules/otp/otp.routes.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { sendOtp, verifyOtp } from "./otp.service.js";

const router = Router();

// POST /api/otp/send   { purpose }
router.post("/send", authenticate, async (req, res) => {
  try {
    const { purpose } = req.body;
    if (!purpose) return res.status(400).json({ success: false, message: "Purpose required" });
    const result = await sendOtp(req.user.id, purpose);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// POST /api/otp/verify   { purpose, otp }
router.post("/verify", authenticate, async (req, res) => {
  try {
    const { purpose, otp } = req.body;
    if (!purpose || !otp) return res.status(400).json({ success: false, message: "Purpose and OTP required" });
    const result = await verifyOtp(req.user.id, purpose, otp);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

export default router;
