// src/components/shared/LockCountdown.jsx
// ─────────────────────────────────────────────────────────────
// Shows a live countdown in the topbar to when the session will
// auto-lock from inactivity. Timeout value comes from ERP Settings
// (per-role override > global default), fetched once on mount.
// Resets visually on any mousemove/keydown/click — mirrors what
// the backend's touchSession() does server-side on every request.
// If the timer hits 0, it just shows "Locking…" — the actual lock
// is enforced by the backend on the next API call (423 response),
// which triggers the global LockScreen via the axios interceptor.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { cn } from "../../lib/utils.js";

export default function LockCountdown() {
  const [timeoutMinutes, setTimeoutMinutes] = useState(null); // null = disabled or not loaded
  const [secondsLeft, setSecondsLeft] = useState(null);
  const lastActivityRef = useRef(Date.now());

  // Fetch the effective timeout once on mount
  useEffect(() => {
    axiosInstance.get(EP.auth.lockTimeout)
      .then((r) => {
        const minutes = r.data?.data?.minutes;
        if (minutes && minutes > 0) {
          setTimeoutMinutes(minutes);
          setSecondsLeft(minutes * 60);
        }
      })
      .catch(() => {}); // silent — if this fails, just don't show the timer
  }, []);

  // Reset the visual countdown on any user activity
  useEffect(() => {
    if (!timeoutMinutes) return;
    const reset = () => { lastActivityRef.current = Date.now(); };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, reset));
  }, [timeoutMinutes]);

  // Tick every second
  useEffect(() => {
    if (!timeoutMinutes) return;
    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = timeoutMinutes * 60 - elapsedSec;
      setSecondsLeft(Math.max(0, remaining));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeoutMinutes]);

  if (!timeoutMinutes || secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isWarning = secondsLeft <= 60; // last minute — highlight in amber/red

  return (
    <div
      title="Session auto-locks after inactivity. Move your mouse or type to stay active."
      className={cn(
        "flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-xs font-mono font-medium select-none transition-colors",
        isWarning ? "bg-destructive/10 text-destructive" : "text-muted-foreground"
      )}
    >
      <Lock size={13} className={isWarning ? "animate-pulse" : ""} />
      <span>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
    </div>
  );
}
