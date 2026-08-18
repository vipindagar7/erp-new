// backend/modules/totp/totp.service.js
import prisma from "../../utils/prisma.js";
import { generateTotpSecret, encryptSecret, verifyTotpCode } from "../../utils/totp.js";

// ── Start 2FA setup — generate secret + QR, store encrypted ───
export const startSetup = async (userId, email) => {
  const { secret, qrDataUrl } = await generateTotpSecret(email);
  const encrypted = encryptSecret(secret);

  await prisma.userTotp.upsert({
    where:  { user_id: userId },
    update: { secret: encrypted, is_enabled: false, verified: false },
    create: { user_id: userId, secret: encrypted, is_enabled: false, verified: false },
  });

  // Return the PLAIN secret so the frontend can show it as a
  // manual-entry fallback alongside the QR code.
  return { secret, qrDataUrl };
};

// ── Confirm setup — verify the first code the user enters ──────
// Returns true and marks 2FA enabled only if the code is valid.
export const confirmSetup = async (userId, code) => {
  const totp = await prisma.userTotp.findUnique({ where: { user_id: userId } });
  if (!totp) return false;

  // verifyTotpCode decrypts the stored secret then checks the code.
  // It is now synchronous (authenticator.verify is sync in otplib).
  const valid = verifyTotpCode(totp.secret, code);
  if (!valid) return false;

  await prisma.userTotp.update({
    where: { user_id: userId },
    data:  { is_enabled: true, verified: true },
  });
  return true;
};

export const disable2fa = (userId) =>
  prisma.userTotp.update({
    where: { user_id: userId },
    data:  { is_enabled: false, verified: false },
  });

export const getStatus = async (userId) => {
  const totp = await prisma.userTotp.findUnique({ where: { user_id: userId } });
  return { isEnabled: !!totp?.is_enabled, isVerified: !!totp?.verified };
};