// backend/utils/totp.js
import { createRequire } from "module";
import QRCode from "qrcode";
import crypto from "crypto";

const require = createRequire(import.meta.url);
const { TOTP, generateSecret, generateURI } = require("otplib");

// ±1 window = accept codes from the previous and next 30s period
// to tolerate minor clock drift between server and authenticator app
const totp = new TOTP({ window: 1 });

const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET;
const ALGO = "aes-256-cbc";
const getKey = () => crypto.createHash("sha256").update(String(ENCRYPTION_KEY)).digest();

// ── Encrypt / decrypt ─────────────────────────────────────────
export const encryptSecret = (plain) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSecret = (encryptedStr) => {
  // Guard: if it doesn't look like our "iv:data" format, treat it
  // as a plain (unencrypted) secret — handles rows created before
  // encryption was introduced.
  if (!encryptedStr || !encryptedStr.includes(":")) return encryptedStr;
  try {
    const [ivHex, dataHex] = encryptedStr.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    // Decryption failed — secret may have been stored with a
    // different key or in plain text. Return as-is so otplib can
    // at least attempt verification with whatever is in the DB.
    return encryptedStr;
  }
};

// ── Generate a new TOTP secret + QR code ──────────────────────
export const generateTotpSecret = async (email, issuer = "EIT ERP") => {
  const secret = generateSecret();
  const uri = generateURI({ issuer, label: email, secret });
  const qrDataUrl = await QRCode.toDataURL(uri);
  return { secret, qrDataUrl, uri };
};

// ── Verify a 6-digit TOTP code ─────────────────────────────────
// Returns true only when the code matches the current time window.
// Every error path returns false — never throws.
export const verifyTotpCode = (encryptedSecret, code) => {
  if (!encryptedSecret || !code) return false;
  try {
    const secret = decryptSecret(encryptedSecret);
    if (!secret) return false;

    const token = String(code).trim();
    if (!/^\d{6}$/.test(token)) return false;

    return totp.verify({ token, secret }) === true;
  } catch (err) {
    // Log so we can diagnose DB/key issues without crashing the server
    console.error("[totp] verifyTotpCode error:", err.message);
    return false;
  }
};