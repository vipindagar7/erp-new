// src/lib/axios.js
import axios from "axios";
import { API_BASE, EP } from "../config/api.config.js";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach impersonation token if present ──
axiosInstance.interceptors.request.use((config) => {
  try {
    const state = window.__REDUX_STORE__?.getState?.();
    const token = state?.auth?.impersonationToken;
    if (token) config.headers["X-Impersonate-Token"] = token;
  } catch {}
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve());
  failedQueue = [];
};

const SKIP_RETRY_PATHS = ["/auth/refresh", "/auth/login"];

// Paths that must never trigger the lock screen themselves —
// the unlock/login flows hit these while the session IS locked,
// and would otherwise re-trigger the lock screen in a loop.
const SKIP_LOCK_PATHS = [
  "/auth/login", "/auth/logout", "/auth/refresh",
  "/auth/unlock/pin", "/auth/unlock/otp",
  "/auth/first-login", "/auth/setup-2fa", "/auth/verify-2fa", "/auth/lock-timeout",
];

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ── 423 Locked — broadcast a global event; App.jsx listens and
    // mounts the LockScreen overlay. Without this listener actually
    // existing in App.jsx, this event was firing into nothing.
    const skipLock = SKIP_LOCK_PATHS.some((path) => originalRequest?.url?.includes(path));
    if (status === 423 && !skipLock) {
      window.dispatchEvent(new CustomEvent("erp:session-locked"));
      return Promise.reject(error);
    }

    const skipRetry = SKIP_RETRY_PATHS.some((path) => originalRequest?.url?.includes(path));

    if (status === 401 && !originalRequest._retry && !skipRetry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(EP.auth.refresh, {}, { withCredentials: true });
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // If refresh failed because the session is locked (423), surface
        // the lock screen instead of just logging out silently.
        if (refreshError.response?.status === 423) {
          window.dispatchEvent(new CustomEvent("erp:session-locked"));
        } else {
          try {
            window.__REDUX_STORE__?.dispatch?.({ type: "auth/logout/fulfilled" });
          } catch {}
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalise: attach a clean .friendlyMessage so any catch block
    // can read it without importing extractError.
    // err.response.data.message is already set by our backend.
    // If it's missing (network error, unexpected shape) fall back gracefully.
    if (error && !error._normalised) {
      const data = error.response?.data;
      error._normalised    = true;
      error.friendlyMessage =
        data?.message ||
        data?.error   ||
        (data?.errors && !Array.isArray(data.errors)
          ? Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(" · ")
          : null) ||
        error.message ||
        "Something went wrong";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;