// backend/utils/encryption.js
// AES-256-GCM encryption for sensitive fields (salary, bank account)
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX   = process.env.ENCRYPTION_KEY; // 64-char hex = 32 bytes

const getKey = () => {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string in .env");
  }
  return Buffer.from(KEY_HEX, "hex");
};

// ── Encrypt ───────────────────────────────────────────────────
// Returns: "iv:authTag:ciphertext" all base64
export const encrypt = (plaintext) => {
  if (!plaintext) return null;
  const key = getKey();
  const iv  = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const authTag   = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
};

// ── Decrypt ───────────────────────────────────────────────────
export const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  const key = getKey();
  const [ivB64, tagB64, dataB64] = ciphertext.split(":");
  const iv       = Buffer.from(ivB64, "base64");
  const authTag  = Buffer.from(tagB64, "base64");
  const data     = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};

// ── Safe encrypt (returns null on empty) ─────────────────────
export const safeEncrypt = (value) => (value ? encrypt(String(value)) : null);
export const safeDecrypt = (value) => (value ? decrypt(value) : null);

// ── Generate encryption key (run once to get your key) ───────
// node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))"
