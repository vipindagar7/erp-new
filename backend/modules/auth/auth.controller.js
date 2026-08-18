// backend/modules/auth/auth.controller.js
import jwt from "jsonwebtoken";
import * as svc from "./auth.service.js";
import prisma from "../../utils/prisma.js";

// ─── Step 1: Credentials ──────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedData;
    const { user, needsFirstLogin, needsOtp } = await svc.validateCredentials(email, password);

    if (needsFirstLogin) {
      return res.status(200).json({
        success: true,
        message: "First login — set a new password and PIN",
        data: { step: "FIRST_LOGIN", userId: user.id },
      });
    }

    if (needsOtp) {
      return res.status(200).json({
        success: true,
        message: `A 6-digit code has been sent to ${user.email}`,
        data: { step: "VERIFY_OTP", userId: user.id, email: user.email },
      });
    }

    // Student — no OTP, issue session immediately
    const { tokens } = await svc.issueSession(user, req);
    svc.setTokenCookies(res, tokens);
    const profile = await svc.getUserWithProfile(user.id);
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        step: "DONE",
        ...profile,
        effectivePermissions: req.user?.effectivePermissions || profile?.permissions || [],
        extra_roles:          req.user?.extra_roles          || profile?.extra_roles  || [],
      },
    });
  } catch (e) { next(e); }
};

// ─── Step 1a: First login ─────────────────────────────────────
export const firstLogin = async (req, res, next) => {
  try {
    const { userId, newPassword, pin } = req.validatedData;
    const { needsOtp } = await svc.completeFirstLogin(userId, newPassword, pin);

    if (needsOtp) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      return res.status(200).json({
        success: true,
        message: `Password and PIN set. A 6-digit code has been sent to ${user.email}`,
        data: { step: "VERIFY_OTP", userId, email: user.email },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const { tokens } = await svc.issueSession(user, req);
    svc.setTokenCookies(res, tokens);
    const profile = await svc.getUserWithProfile(userId);
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        step: "DONE",
        ...profile,
        effectivePermissions: req.user?.effectivePermissions || profile?.permissions || [],
        extra_roles:          req.user?.extra_roles          || profile?.extra_roles  || [],
      },
    });
  } catch (e) { next(e); }
};

// ─── Step 2: Verify OTP ───────────────────────────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.validatedData;
    await svc.verifyLoginOtp(userId, otp);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBlocked)
      return res.status(403).json({ success: false, message: "Account unavailable" });

    const { tokens } = await svc.issueSession(user, req);
    svc.setTokenCookies(res, tokens);
    const profile = await svc.getUserWithProfile(userId);
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        step: "DONE",
        ...profile,
        effectivePermissions: req.user?.effectivePermissions || profile?.permissions || [],
        extra_roles:          req.user?.extra_roles          || profile?.extra_roles  || [],
      },
    });
  } catch (e) { next(e); }
};

// ─── Resend OTP ───────────────────────────────────────────────
export const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });
    await svc.resendLoginOtp(userId);
    return res.status(200).json({ success: true, message: "A new code has been sent to your email" });
  } catch (e) { next(e); }
};

// ─── Logout ───────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    await svc.logoutSession(req.cookies?.access_token);
    svc.clearTokenCookies(res);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (e) { next(e); }
};

// ─── /api/auth/me ─────────────────────────────────────────────
// Returns profile + effectivePermissions (from auth middleware)
export const me = async (req, res, next) => {
  try {
    const profile = await svc.getUserWithProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: {
        ...profile,
        effectivePermissions: req.user?.effectivePermissions || profile?.permissions || [],
        extra_roles:          req.user?.extra_roles          || profile?.extra_roles  || [],
      },
    });
  } catch (e) { next(e); }
};

// ─── Refresh ──────────────────────────────────────────────────
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ success: false, message: "No refresh token provided" });
    const tokens = await svc.refreshTokens(token);
    svc.setTokenCookies(res, tokens);
    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (e) { next(e); }
};

// ─── Sessions ─────────────────────────────────────────────────
export const listSessions = async (req, res, next) => {
  try {
    const token    = req.cookies?.access_token;
    const payload  = token ? jwt.decode(token) : null;
    const sessions = await svc.listUserSessions(req.user.id, payload?.jti);
    return res.status(200).json({ success: true, data: sessions });
  } catch (e) { next(e); }
};

export const revokeSession = async (req, res, next) => {
  try {
    await svc.revokeSession(req.user.id, req.params.id);
    return res.status(200).json({ success: true, message: "Session revoked" });
  } catch (e) { next(e); }
};

// ─── Password ─────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await svc.changePassword(req.user.id, currentPassword, newPassword);
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (e) { next(e); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validatedData;
    await svc.forgotPassword(email);
    return res.status(200).json({ success: true, message: "If that account exists, a reset link has been sent." });
  } catch (e) { next(e); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.validatedData;
    await svc.resetPassword(token, password);
    return res.status(200).json({ success: true, message: "Password reset. You can now sign in." });
  } catch (e) { next(e); }
};

// ─── Switch role ──────────────────────────────────────────────
export const switchActiveRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const result = await svc.switchActiveRole(req.user.id, req.user.jti, role);
    return res.status(200).json({ success: true, message: "Dashboard switched", data: result });
  } catch (e) { next(e); }
};