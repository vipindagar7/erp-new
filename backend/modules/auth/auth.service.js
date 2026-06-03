import jwt     from "jsonwebtoken";
import bcrypt  from "bcrypt";
import  prisma  from "../../utils/prisma.js";
import crypto   from "crypto";
import { sendPasswordResetEmail } from "../../utils/emailService.js";

// ─── Cookie config ────────────────────────────────────────────
const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  secure:   process.env.NODE_ENV === "production",
  path:     "/",
};

// ─── Token helpers ────────────────────────────────────────────
export const generateTokens = (userId) => ({
  access:  jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET,         { expiresIn: "15s" }),
  refresh: jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d"  }),
});

export const setTokenCookies = (res, tokens) => {
  res.cookie("access_token",  tokens.access,  { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", tokens.refresh, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const clearTokenCookies = (res) => {
  res.clearCookie("access_token",  COOKIE_BASE);
  res.clearCookie("refresh_token", COOKIE_BASE);
};

const getPasswordHash = (user) => user.password ?? user.passwordHash;

// ─── User with nested profile ─────────────────────────────────
export const getUserWithProfile = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:          true,
      email:       true,
      role:        true,
      permissions: true,
      isBlocked:   true,
      createdAt:   true,
      admin: {
        select: { id: true, name: true },
      },
      faculty: {
        select: {
          id: true, name: true, emp_id: true, designation: true, phone: true,
          department: { select: { id: true, name: true } },
          subjects:   { select: { subject: { select: { id: true, name: true, code: true } } } },
        },
      },
      student: {
        select: {
          id: true, name: true, roll_no: true, batch_year: true,
          section:    { select: { id: true, name: true, semester: true, batch: true } },
          course:     { select: { id: true, name: true } },
          program:    { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

// ─── Login ────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  if (user.isBlocked) throw Object.assign(new Error("Your account has been blocked. Contact admin."), { status: 403 });

  const storedHash = getPasswordHash(user);
  const valid = await bcrypt.compare(password, storedHash);
  if (!valid) throw Object.assign(new Error("Invalid email or password"), { status: 401 });

  return user;
};

// ─── Refresh ──────────────────────────────────────────────────
export const refreshTokens = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.isBlocked) {
    throw Object.assign(new Error("Invalid refresh token"), { status: 401 });
  }

  return generateTokens(user.id);
};




const getPasswordField = (user) => "password" in user ? "password" : "passwordHash";

// ─── Change Password ──────────────────────────────────────────
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const storedHash = getPasswordHash(user);
  if (!storedHash) throw Object.assign(new Error("Account configuration error"), { status: 500 });

  const valid = await bcrypt.compare(currentPassword, storedHash);
  if (!valid) throw Object.assign(new Error("Current password is incorrect"), { status: 400 });

  const newHash     = await bcrypt.hash(newPassword, 12);
  const passwordField = getPasswordField(user);

  await prisma.user.update({
    where: { id: userId },
    data:  { [passwordField]: newHash },
  });
};

// ─── Forgot Password ──────────────────────────────────────────
export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always succeed — never reveal whether email exists
  if (!user) return;

  // Invalidate existing unused tokens
  await prisma.passwordResetToken.updateMany({
    where: { user_id: user.id, used: false },
    data:  { used: true },
  });

  const token   = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, user_id: user.id, expires },
  });

  await sendPasswordResetEmail(email, token);
};

// ─── Reset Password ───────────────────────────────────────────
export const resetPassword = async (token, newPassword) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record)      throw Object.assign(new Error("Invalid or expired reset link"),            { status: 400 });
  if (record.used)  throw Object.assign(new Error("This reset link has already been used"),    { status: 400 });
  if (record.expires < new Date()) throw Object.assign(new Error("Reset link has expired. Request a new one."), { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: record.user_id } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const newHash     = await bcrypt.hash(newPassword, 12);
  const passwordField = getPasswordField(user);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.user_id }, data: { [passwordField]: newHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);
};
