// backend/utils/fileStorage.js
// ─────────────────────────────────────────────────────────────
// Centralized file storage utility.
// Currently: local disk storage under /uploads/
// Future: swap saveFile() to use S3/Cloudinary by changing this one file.
// ─────────────────────────────────────────────────────────────
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Storage root ─────────────────────────────────────────────
const STORAGE_ROOT = path.resolve(__dirname, "../../uploads");

// ── Sub-folders per entity ────────────────────────────────────
export const STORAGE_PATHS = {
  faculty:  "faculty/photos",
  student:  "student/photos",
  admin:    "admin/photos",
  documents:"documents",
  temp:     "temp",
};

// ── Ensure directory exists ───────────────────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ── Save a file buffer to disk ────────────────────────────────
// Returns: { url, filename, path, size }
export const saveFile = async (buffer, originalName, folder = "temp") => {
  const ext      = path.extname(originalName).toLowerCase();
  const filename = `${crypto.randomUUID()}${ext}`;
  const subDir   = STORAGE_PATHS[folder] || folder;
  const dir      = path.join(STORAGE_ROOT, subDir);
  ensureDir(dir);

  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);

  // Public URL path (served by Express static)
  const url = `/uploads/${subDir}/${filename}`;

  return { url, filename, path: filePath, size: buffer.length };
};

// ── Delete a file ──────────────────────────────────────────────
export const deleteFile = (url) => {
  if (!url) return;
  try {
    const relative = url.replace(/^\/uploads\//, "");
    const filePath = path.join(STORAGE_ROOT, relative);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn("File delete failed:", err.message);
  }
};

// ── Validate image upload ──────────────────────────────────────
export const validateImage = (file, maxSizeMb = 5) => {
  const ALLOWED = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    throw Object.assign(new Error("Only JPG, PNG, WEBP images allowed"), { statusCode: 400 });
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw Object.assign(new Error(`File too large. Max ${maxSizeMb}MB`), { statusCode: 400 });
  }
};

// ── Register Express static serving ───────────────────────────
// Call this in index.js: app.use('/uploads', serveUploads())
import express from "express";
export const serveUploads = () => {
  ensureDir(STORAGE_ROOT);
  return express.static(STORAGE_ROOT);
};
