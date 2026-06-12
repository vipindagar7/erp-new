// backend/modules/otp/otp.service.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../../utils/prisma.js";
import { getRedis } from "../../utils/redis.js";

// ── OTP purposes and their labels ────────────────────────────
export const OTP_PURPOSES = {
  SALARY_VIEW:      "salary_view",
  BANK_VIEW:        "bank_view",
  IMPERSONATE:      "impersonate",
  RESET_PASSWORD:   "reset_password",
  BULK_DELETE:      "bulk_delete",
  GRANT_ADMIN:      "grant_admin",
  SENSITIVE_EXPORT: "sensitive_export",
  DELETE_ADMIN:     "delete_admin",
};

const OTP_LABELS = {
  salary_view:      "View Salary Details",
  bank_view:        "View Bank Details",
  impersonate:      "Impersonate User",
  reset_password:   "Reset User Password",
  bulk_delete:      "Bulk Delete Records",
  grant_admin:      "Grant Admin Role",
  sensitive_export: "Export Sensitive Data",
  delete_admin:     "Delete Admin Account",
};

// ── Rate limit key ────────────────────────────────────────────
const rateLimitKey  = (userId, purpose) => `otp:ratelimit:${userId}:${purpose}`;
const lockKey       = (userId, purpose) => `otp:locked:${userId}:${purpose}`;
const actionKey     = (userId, purpose, otp) => `otp:action:${userId}:${purpose}:${otp}`;

// ── Generate and send OTP ──────────────────────────────────────
export const sendOtp = async (userId, purpose) => {
  const redis = getRedis();

  // Check if locked
  const locked = await redis.get(lockKey(userId, purpose));
  if (locked) {
    const ttl = await redis.ttl(lockKey(userId, purpose));
    throw Object.assign(
      new Error(`Too many attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`),
      { statusCode: 429 }
    );
  }

  // Rate limit: max 3 OTPs per 10 minutes
  const rl = await redis.incr(rateLimitKey(userId, purpose));
  if (rl === 1) await redis.expire(rateLimitKey(userId, purpose), 600);
  if (rl > 3) {
    await redis.set(lockKey(userId, purpose), "1", "EX", 900); // 15 min lock
    throw Object.assign(new Error("OTP rate limit exceeded. Locked for 15 minutes."), { statusCode: 429 });
  }

  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, admin: { select: { name: true } }, faculty: { select: { name: true } } },
  });
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  // Generate 6-digit OTP
  const otp     = crypto.randomInt(100000, 999999).toString();
  const hash    = await bcrypt.hash(otp, 10);
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Store in DB
  await prisma.otpToken.deleteMany({ where: { user_id: userId, purpose } }); // clear old
  await prisma.otpToken.create({
    data: { user_id: userId, purpose, otp_hash: hash, expires_at: expires },
  });

  // Also cache in Redis for fast lookup
  await redis.set(`otp:token:${userId}:${purpose}`, hash, "EX", 300);

  // Send email
  const name    = user.admin?.name || user.faculty?.name || "User";
  const label   = OTP_LABELS[purpose] || purpose;
  await sendOtpEmail(user.email, name, otp, label);

  return { email: maskEmail(user.email), expires_at: expires };
};

// ── Verify OTP ────────────────────────────────────────────────
export const verifyOtp = async (userId, purpose, otp) => {
  const redis = getRedis();

  // Check locked
  const locked = await redis.get(lockKey(userId, purpose));
  if (locked) throw Object.assign(new Error("Account locked. Too many failed attempts."), { statusCode: 429 });

  const token = await prisma.otpToken.findFirst({
    where: { user_id: userId, purpose, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!token) throw Object.assign(new Error("No active OTP found. Please request a new one."), { statusCode: 400 });
  if (new Date() > token.expires_at) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });
    throw Object.assign(new Error("OTP expired. Please request a new one."), { statusCode: 400 });
  }

  const valid = await bcrypt.compare(otp, token.otp_hash);
  if (!valid) {
    const attempts = token.attempts + 1;
    await prisma.otpToken.update({ where: { id: token.id }, data: { attempts } });
    if (attempts >= 3) {
      await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });
      await redis.set(lockKey(userId, purpose), "1", "EX", 900);
      throw Object.assign(new Error("Too many failed attempts. Locked for 15 minutes."), { statusCode: 429 });
    }
    throw Object.assign(new Error(`Invalid OTP. ${3 - attempts} attempt(s) remaining.`), { statusCode: 400 });
  }

  // Mark used
  await prisma.otpToken.update({ where: { id: token.id }, data: { used: true, attempts: token.attempts + 1 } });
  await redis.del(`otp:token:${userId}:${purpose}`);

  // Issue short-lived action token (10 min)
  const actionToken = crypto.randomBytes(32).toString("hex");
  await redis.set(actionKey(userId, purpose, actionToken), "1", "EX", 600);

  return { action_token: actionToken, valid: true };
};

// ── Verify action token (for sensitive endpoint access) ───────
export const verifyActionToken = async (userId, purpose, actionToken) => {
  if (!actionToken) return false;
  const redis = getRedis();
  const exists = await redis.get(actionKey(userId, purpose, actionToken));
  return !!exists;
};

// ── Consume action token (one-time use) ───────────────────────
export const consumeActionToken = async (userId, purpose, actionToken) => {
  const redis = getRedis();
  await redis.del(actionKey(userId, purpose, actionToken));
};

// ── Email sender (stub — wire to your email service) ─────────
const sendOtpEmail = async (email, name, otp, purpose) => {
  // TODO: Replace with your actual email service (nodemailer, resend, etc.)
  // For now, logs to console in dev
  if (process.env.NODE_ENV === "development") {
    console.log(`\n📧 OTP EMAIL TO: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Expires: 5 minutes\n`);
  }
  // Example with nodemailer:
  // await transporter.sendMail({
  //   to: email, subject: `Your OTP for ${purpose}`,
  //   html: `<p>Hi ${name},</p><p>Your OTP is: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`
  // });
};

// ── Mask email for display ────────────────────────────────────
const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(local.length - 2)}@${domain}`;
};
