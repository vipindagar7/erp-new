// src/hooks/useCurrentSession.js
// ────────────────────────────────
// Fetches and caches the current active AcademicSession.
// Other pages use this to know which session is active
// without each making their own API call.
//
// Usage:
//   const { session, loading } = useCurrentSession();
//   if (session) console.log(session.name); // "2024-2025"
// ────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../lib/axios.js";
import { EP } from "../config/api.config.js";

let _cache    = null;   // module-level cache — shared across all hook instances
let _listeners = [];    // components to notify on invalidate

export const invalidateSessionCache = () => {
  _cache = null;
  _listeners.forEach((fn) => fn());
};

export function useCurrentSession() {
  const [session, setSession] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (_cache) { setSession(_cache); setLoading(false); return; }
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.sessions.current);
      _cache = r.data?.data || null;
      setSession(_cache);
      setError(null);
    } catch (e) {
      // No current session set — not an error, just null
      setSession(null);
      setError(e.response?.status === 404 ? null : e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    // Register as listener so invalidateSessionCache() triggers re-fetch
    _listeners.push(fetch);
    return () => { _listeners = _listeners.filter((fn) => fn !== fetch); };
  }, [fetch]);

  return { session, loading, error, refetch: fetch };
}
