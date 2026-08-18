// backend/modules/auth/auth.service.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../../utils/prisma.js";
import { sendPasswordResetEmail } from "../../utils/emailService.js";
import { generateTotpSecret, verifyTotpCode } from "../../utils/totp.js";
import { parseDeviceInfo } from "../../utils/deviceParser.js";

// ─── Cookie config ────────────────────────────────────────────
const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const ROLES_REQUIRING_2FA = ["FACULTY", "ADMIN", "SUPER_ADMIN"];
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const SESSION_LOCK_AFTER_MS = 15 * 60 * 1000; // 15 minutes inactivity

// ─── Token helpers ────────────────────────────────────────────
export const generateTokens = (userId, jti) => ({
  access: jwt.sign({ id: userId, jti }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL }),
  refresh: jwt.sign({ id: userId, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL }),
});

export const setTokenCookies = (res, tokens) => {
  res.cookie("access_token", tokens.access, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", tokens.refresh, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const clearTokenCookies = (res) => {
  res.clearCookie("access_token", COOKIE_BASE);
  res.clearCookie("refresh_token", COOKIE_BASE);
};

const getPasswordHash = (user) => user.password ?? user.passwordHash;
const getPasswordField = (user) => "password" in user ? "password" : "passwordHash";

// ─── User with nested profile ─────────────────────────────────
export const getUserWithProfile = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, role: true, permissions: true, extra_roles: true,
      isBlocked: true, is_root: true, must_change_password: true,
      first_login_completed: true, requires_2fa: true, createdAt: true,
      admin: { select: { id: true, name: true } },
      faculty: {
        select: {
          id: true, name: true, emp_id: true, designation: true, phone: true,
          department: { select: { id: true, name: true } },
          subjects: { select: { subject: { select: { id: true, name: true, code: true } } } },
        },
      },
      student: {
        select: {
          id: true, name: true, roll_no: true, batch_year: true,
          section: { select: { id: true, name: true, semester: true, batch: true } },
          branch: { select: { id: true, name: true } },
          program: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
      userTotp: { select: { is_enabled: true, verified: true } },
    },
  });

// ─── Step 1: Validate credentials ──────────────────────────────
// Returns { user, needsTwoFactor, needsFirstLogin }
// Does NOT issue tokens yet if 2FA is required — caller must
// call completeTwoFactorLogin() after OTP verification.
export const validateCredentials = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { userTotp: true },
  });

  if (!user) throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  if (user.isBlocked) throw Object.assign(new Error("Your account has been blocked. Contact admin."), { status: 403 });

  const storedHash = getPasswordHash(user);
  const valid = await bcrypt.compare(password, storedHash);
  if (!valid) {
    await prisma.loginHistory.create({
      data: { email, status: "FAILED", fail_reason: "Invalid password" },
    });
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const needsFirstLogin = user.must_change_password || !user.first_login_completed;
  const needsTwoFactor = !needsFirstLogin && (user.requires_2fa || ROLES_REQUIRING_2FA.includes(user.role));

  return { user, needsFirstLogin, needsTwoFactor };
};

// ─── Step 2a: First login — set new password + PIN ────────────
export const completeFirstLogin = async (userId, newPassword, pin) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  if (!/^\d{6}$/.test(pin)) {
    throw Object.assign(new Error("PIN must be exactly 6 digits"), { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  const pinHash = await bcrypt.hash(pin, 10);
  const passwordField = getPasswordField(user);

  await prisma.user.update({
    where: { id: userId },
    data: {
      [passwordField]: newHash,
      pin_hash: pinHash,
      pin_set_at: new Date(),
      must_change_password: false,
      first_login_completed: true,
    },
  });

  // After first login, FACULTY/ADMIN/SUPER_ADMIN must set up 2FA next
  const needsTwoFactorSetup = ROLES_REQUIRING_2FA.includes(user.role) && !user.requires_2fa;
  if (needsTwoFactorSetup) {
    await prisma.user.update({ where: { id: userId }, data: { requires_2fa: true } });
  }

  return { needsTwoFactorSetup };
};

// ─── Step 2b: Issue session + tokens (after 2FA passed or not required) ──
export const issueSession = async (user, req) => {
  const jti = crypto.randomUUID();
  const tokens = generateTokens(user.id, jti);
  const device = parseDeviceInfo(req);

  const refreshHash = crypto.createHash("sha256").update(tokens.refresh).digest("hex");

  await prisma.userSession.create({
    data: {
      user_id: user.id,
      jti,
      refresh_token_hash: refreshHash,
      ip_address: device.ip,
      user_agent: device.userAgent,
      device_type: device.deviceType,
      browser: device.browser,
      os: device.os,
      location: device.location,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      refresh_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.loginHistory.create({
    data: {
      user_id: user.id, email: user.email, status: "SUCCESS",
      ip_address: device.ip, user_agent: device.userAgent,
      device_type: device.deviceType, browser: device.browser,
      os: device.os, location: device.location,
    },
  });

  return { tokens, jti };
};

// ─── Refresh ──────────────────────────────────────────────────
export const refreshTokens = async (refreshToken) => {
  let payload;
  try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
  catch { throw Object.assign(new Error("Invalid or expired refresh token"), { status: 401 }); }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.isBlocked) throw Object.assign(new Error("Invalid refresh token"), { status: 401 });

  const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const session = await prisma.userSession.findUnique({ where: { refresh_token_hash: refreshHash } });
  if (!session || !session.is_active) throw Object.assign(new Error("Session revoked"), { status: 401 });
  if (session.is_locked) throw Object.assign(new Error("Session is locked. Unlock to continue."), { status: 423 });

  const newJti = crypto.randomUUID();
  const tokens = generateTokens(user.id, newJti);
  const newRefreshHash = crypto.createHash("sha256").update(tokens.refresh).digest("hex");

  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      jti: newJti,
      refresh_token_hash: newRefreshHash,
      last_active_at: new Date(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      refresh_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return tokens;
};

// ─── Logout ─────────────────────────────────────────────────────
export const logoutSession = async (accessToken) => {
  if (!accessToken) return;
  try {
    const payload = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    await prisma.userSession.updateMany({
      where: { user_id: payload.id, jti: payload.jti, is_active: true },
      data: { is_active: false, revoked_at: new Date(), revoked_reason: "LOGOUT" },
    });
  } catch { /* token already invalid — nothing to revoke */ }
};

// ─── Session activity tracking (for auto-lock) ────────────────
export const touchSession = async (jti) => {
  try {
    await prisma.userSession.updateMany({
      where: { jti, is_active: true, is_locked: false },
      data: { last_active_at: new Date() },
    });
  } catch { /* non-critical */ }
};

// Find sessions inactive past the lock threshold and lock them.
// Call this from a periodic job OR inline on each authenticated request.
export const checkAndLockIfInactive = async (jti) => {
  const session = await prisma.userSession.findUnique({ where: { jti } });
  if (!session || !session.is_active || session.is_locked) return session;

  const inactiveMs = Date.now() - new Date(session.last_active_at).getTime();
  if (inactiveMs >= SESSION_LOCK_AFTER_MS) {
    return prisma.userSession.update({
      where: { id: session.id },
      data: { is_locked: true, locked_at: new Date() },
    });
  }
  return session;
};

// ─── Unlock via PIN ────────────────────────────────────────────
export const unlockWithPin = async (userId, jti, pin) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.pin_hash) throw Object.assign(new Error("No PIN configured for this account"), { status: 400 });

  const valid = await bcrypt.compare(pin, user.pin_hash);
  if (!valid) throw Object.assign(new Error("Incorrect PIN"), { status: 401 });

  await prisma.userSession.updateMany({
    where: { jti, user_id: userId },
    data: { is_locked: false, locked_at: null, last_active_at: new Date() },
  });
};

// ─── Unlock via OTP (TOTP app code) ────────────────────────────
export const unlockWithOtp = async (userId, jti, code) => {
  const totp = await prisma.userTotp.findUnique({ where: { user_id: userId } });
  if (!totp?.is_enabled) throw Object.assign(new Error("2FA is not enabled for this account"), { status: 400 });

  const valid = verifyTotpCode(totp.secret, code);
  if (!valid) throw Object.assign(new Error("Invalid or expired code"), { status: 401 });

  await prisma.userSession.updateMany({
    where: { jti, user_id: userId },
    data: { is_locked: false, locked_at: null, last_active_at: new Date() },
  });
};

// ─── List active sessions for a user ───────────────────────────
export const listUserSessions = (userId, currentJti) =>
  prisma.userSession.findMany({
    where: { user_id: userId, is_active: true },
    orderBy: { last_active_at: "desc" },
    select: {
      id: true, jti: true, device_type: true, browser: true, os: true,
      ip_address: true, location: true, is_locked: true,
      last_active_at: true, createdAt: true,
    },
  }).then((sessions) => sessions.map((s) => ({ ...s, isCurrent: s.jti === currentJti })));

// ─── Revoke a specific session (user revoking their own other device) ──
export const revokeSession = async (userId, sessionId) =>
  prisma.userSession.updateMany({
    where: { id: sessionId, user_id: userId, is_active: true },
    data: { is_active: false, revoked_at: new Date(), revoked_reason: "USER_REVOKED" },
  });

// ─── Change Password (logged-in user) ──────────────────────────
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const storedHash = getPasswordHash(user);
  if (!storedHash) throw Object.assign(new Error("Account configuration error"), { status: 500 });

  const valid = await bcrypt.compare(currentPassword, storedHash);
  if (!valid) throw Object.assign(new Error("Current password is incorrect"), { status: 400 });

  const newHash = await bcrypt.hash(newPassword, 12);
  const passwordField = getPasswordField(user);

  await prisma.user.update({ where: { id: userId }, data: { [passwordField]: newHash } });
};

// ─── Forgot Password ──────────────────────────────────────────
export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // never reveal existence

  await prisma.passwordResetToken.updateMany({
    where: { user_id: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({ data: { token, user_id: user.id, expires } });
  await sendPasswordResetEmail(email, token);
};

// ─── Reset Password ───────────────────────────────────────────
export const resetPassword = async (token, newPassword) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record) throw Object.assign(new Error("Invalid or expired reset link"), { status: 400 });
  if (record.used) throw Object.assign(new Error("This reset link has already been used"), { status: 400 });
  if (record.expires < new Date()) throw Object.assign(new Error("Reset link has expired. Request a new one."), { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: record.user_id } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const newHash = await bcrypt.hash(newPassword, 12);
  const passwordField = getPasswordField(user);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.user_id }, data: { [passwordField]: newHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);
};