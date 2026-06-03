import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validator.js";
import * as authCtrl from "./auth.controller.js";


const router = Router();

// ── Core auth ──────────────────────────────────────────────────
// POST /api/auth/login
router.post("/login", validate(loginSchema), authCtrl.login);

// POST /api/auth/logout
router.post("/logout", authCtrl.logout);

// GET  /api/auth/me      (requires valid access_token cookie)
router.get("/me", authenticate, authCtrl.me);

// POST /api/auth/refresh (uses refresh_token cookie)
router.post("/refresh", authCtrl.refresh);

// ── Password: change (must be logged in) ──────────────────────
// POST /api/auth/change-password
router.post(
  "/change-password",
  authenticate,
  // validate(changePasswordSchema),
  authCtrl.changePassword
);

// ── Password: forgot / reset ──────────────────────────────────
// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authCtrl.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authCtrl.resetPassword
);

export default router;