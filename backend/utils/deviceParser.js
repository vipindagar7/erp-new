// backend/utils/deviceParser.js
import { UAParser } from "ua-parser-js";

export const parseDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  const ip = (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const deviceType = result.device.type || "desktop";
  const browser = [result.browser.name, result.browser.version?.split(".")[0]].filter(Boolean).join(" ") || "Unknown";
  const os = [result.os.name, result.os.version].filter(Boolean).join(" ") || "Unknown";

  return { ip, userAgent, deviceType, browser, os, location: null };
};