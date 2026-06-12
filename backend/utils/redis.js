// backend/utils/redis.js
// ─────────────────────────────────────────────────────────────
// Singleton Redis client using ioredis
// Works on Mac (dev) and Ubuntu (prod) identically
// ─────────────────────────────────────────────────────────────
import Redis from "ioredis";

let client = null;

const createClient = () => {
  const redis = new Redis({
    host:          process.env.REDIS_HOST     || "127.0.0.1",
    port:          parseInt(process.env.REDIS_PORT || "6379"),
    password:      process.env.REDIS_PASSWORD || undefined,
    db:            parseInt(process.env.REDIS_DB   || "0"),
    retryStrategy: (times) => {
      if (times > 10) return null; // stop retrying after 10 attempts
      return Math.min(times * 200, 3000); // wait 200ms * attempt, max 3s
    },
    lazyConnect:   true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  });

  redis.on("connect",        () => console.log("[Redis] Connected"));
  redis.on("ready",          () => console.log("[Redis] Ready"));
  redis.on("error",  (err)   => console.error("[Redis] Error:", err.message));
  redis.on("close",          () => console.warn("[Redis] Connection closed"));
  redis.on("reconnecting",   () => console.log("[Redis] Reconnecting..."));

  return redis;
};

export const getRedis = () => {
  if (!client) client = createClient();
  return client;
};

// Helper: set with expiry
export const setEx = async (key, ttlSeconds, value) => {
  const r = getRedis();
  return r.setex(key, ttlSeconds, JSON.stringify(value));
};

// Helper: get and parse JSON
export const getJson = async (key) => {
  const r = getRedis();
  const val = await r.get(key);
  if (!val) return null;
  try { return JSON.parse(val); } catch { return val; }
};

// Helper: delete key
export const del = async (key) => {
  const r = getRedis();
  return r.del(key);
};

// Helper: check if key exists
export const exists = async (key) => {
  const r = getRedis();
  return r.exists(key);
};

// Session cache helpers
export const SESSION_TTL = 840; // 14 minutes (< 15min JWT TTL)

export const cacheSession = (userId, jti, data) =>
  setEx(`session:${userId}:${jti}`, SESSION_TTL, data);

export const getSession = (userId, jti) =>
  getJson(`session:${userId}:${jti}`);

export const deleteSession = (userId, jti) =>
  del(`session:${userId}:${jti}`);

export const deleteAllUserSessions = async (userId) => {
  const r = getRedis();
  const keys = await r.keys(`session:${userId}:*`);
  if (keys.length) await r.del(...keys);
};

export default getRedis;
