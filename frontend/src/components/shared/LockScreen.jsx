// src/components/shared/LockScreen.jsx
// ─────────────────────────────────────────────────────────────
// Full-screen overlay shown when the session is auto-locked
// after 15 minutes of inactivity. Unlock via PIN, TOTP code,
// or full re-login.
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { logout } from "../../redux/auth/authSlice.js";
import { notify } from "../../hooks/notify.js";
import { Lock, KeyRound, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "../../lib/utils.js";

export default function LockScreen({ onUnlocked }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [mode, setMode] = useState("pin"); // "pin" | "otp"
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async () => {
    if (!/^\d{6}$/.test(value)) return setError("Enter the 6-digit code");
    setLoading(true); setError("");
    try {
      const endpoint = mode === "pin" ? (EP.auth.unlockPin ?? "/api/auth/unlock/pin") : (EP.auth.unlockOtp ?? "/api/auth/unlock/otp");
      const payload  = mode === "pin" ? { pin: value } : { code: value };
      await axiosInstance.post(endpoint, payload);
      notify.success("Session unlocked");
      onUnlocked?.();
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect code");
    } finally { setLoading(false); }
  };

  const handleRelogin = async () => {
    await dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[hsl(267,28%,6%)]/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-[380px] animate-[cardIn_0.3s_ease-out_both]">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
            <Lock size={22} className="text-amber-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Session Locked</h1>
          <p className="text-white/45 text-sm mt-1.5 mb-1">
            {user?.email || "Your session"} was locked due to 15 minutes of inactivity.
          </p>

          <div className="flex gap-2 mt-6 mb-5 bg-white/5 rounded-xl p-1">
            <button onClick={() => { setMode("pin"); setValue(""); setError(""); }}
              className={cn("flex-1 h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                mode === "pin" ? "bg-violet-600 text-white" : "text-white/50 hover:text-white/80")}>
              <KeyRound size={13} /> PIN
            </button>
            <button onClick={() => { setMode("otp"); setValue(""); setError(""); }}
              className={cn("flex-1 h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                mode === "otp" ? "bg-violet-600 text-white" : "text-white/50 hover:text-white/80")}>
              <ShieldCheck size={13} /> Authenticator
            </button>
          </div>

          <Input
            inputMode="numeric" maxLength={6} value={value} autoFocus
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="••••••"
            className="h-12 rounded-xl bg-white/8 border-white/10 text-white text-center text-lg tracking-[0.4em] font-mono focus:bg-white/10 focus:border-violet-500/60"
          />
          {error && <p className="text-red-400 text-xs mt-2">⚠ {error}</p>}

          <Button onClick={handleUnlock} disabled={loading} className="w-full h-11 mt-4 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
            {loading ? <><Loader2 size={14} className="mr-2 animate-spin" /> Unlocking…</> : "Unlock"}
          </Button>

          <button onClick={handleRelogin} className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors">
            <LogOut size={12} /> Sign in with a different account
          </button>
        </div>
      </div>
      <style>{`@keyframes cardIn { from { opacity:0; transform: translateY(10px) scale(0.98); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}
