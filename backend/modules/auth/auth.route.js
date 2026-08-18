// backend/modules/auth/auth.route.js
import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  validate, loginSchema, firstLoginSchema,
  verifyOtpSchema,
  changePasswordSchema, forgotPasswordSchema, resetPasswordSchema,
} from "./auth.validator.js";
import * as authCtrl from "./auth.controller.js";

const router = Router();

// ── Multi-step login ───────────────────────────────────────────
// Step 1: credentials → FIRST_LOGIN | VERIFY_OTP | DONE
router.post("/login", validate(loginSchema), authCtrl.login);
// Step 1a: first-time login — set new password + 6-digit PIN
router.post("/first-login", validate(firstLoginSchema), authCtrl.firstLogin);
// Step 2: verify email OTP (FACULTY / ADMIN / SUPER_ADMIN only)
router.post("/verify-otp", validate(verifyOtpSchema), authCtrl.verifyOtp);
// Resend OTP (if it expired or wasn't received)
router.post("/resend-otp", authCtrl.resendOtp);

// ── Session lifecycle ──────────────────────────────────────────
router.post("/logout", authCtrl.logout);
router.get("/me", authenticate, authCtrl.me);
router.post("/refresh", authCtrl.refresh);

// ── Multi-device session management ───────────────────────────
router.get("/sessions", authenticate, authCtrl.listSessions);
router.delete("/sessions/:id", authenticate, authCtrl.revokeSession);

// ── Password management ────────────────────────────────────────
router.post("/change-password", authenticate, authCtrl.changePassword);
router.post("/forgot-password", validate(forgotPasswordSchema), authCtrl.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authCtrl.resetPassword);

// ── Dashboard role switching ───────────────────────────────────

router.patch("/active-role", authenticate, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: "role required" });

    // Validate user has this role
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const allRoles = [user.role, ...(user.extra_roles || [])];
    if (!allRoles.includes(role))
      return res.status(403).json({ success: false, message: "You don't have this role" });

    // Store active role in session / return it
    // (No DB change needed — just acknowledge; frontend stores in Redux)
    return res.json({ success: true, message: "Active role updated", data: { active_role: role } });
  } catch (e) { next(e); }
});

export default router;