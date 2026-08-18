// src/components/shared/ConfirmModal.jsx
// ─────────────────────────────────────────────────────────────
// Reusable confirmation modals.
//
// Usage:
//   <ConfirmModal
//     open={open}
//     title="Delete Student"
//     message="This will permanently delete John Doe and their login account."
//     confirmLabel="Delete"
//     variant="danger"
//     loading={loading}
//     onConfirm={handleDelete}
//     onClose={() => setOpen(false)}
//   />
//
//   <OtpConfirmModal
//     open={open}
//     purpose="salary_view"
//     title="View Salary"
//     description="An OTP will be sent to your registered email."
//     onVerified={(actionToken) => handleViewSalary(actionToken)}
//     onClose={() => setOpen(false)}
//   />
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { AlertTriangle, ShieldCheck, Loader2, X, Mail, Eye, EyeOff } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { notify } from "../../hooks/notify.js";
import { cn } from "../../lib/utils.js";

// ── ConfirmModal ──────────────────────────────────────────────
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  variant      = "danger",   // danger | warning | info
  loading      = false,
  onConfirm,
  onClose,
  children,
}) {
  if (!open) return null;

  const VARIANTS = {
    danger:  { icon: AlertTriangle, iconBg: "bg-red-100 text-red-600",    btn: "bg-destructive hover:bg-destructive/90 text-destructive-foreground" },
    warning: { icon: AlertTriangle, iconBg: "bg-amber-100 text-amber-600",btn: "bg-amber-600 hover:bg-amber-700 text-white" },
    info:    { icon: ShieldCheck,   iconBg: "bg-blue-100 text-blue-600",  btn: "bg-primary hover:bg-primary/90 text-primary-foreground" },
  };
  const v = VARIANTS[variant] || VARIANTS.danger;
  const Icon = v.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.iconBg}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {message && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{message}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        {/* Optional extra content */}
        {children && <div className="px-6 pb-4">{children}</div>}

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} disabled={loading}
            className="flex-1 h-10 rounded-xl border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${v.btn}`}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── OtpConfirmModal ───────────────────────────────────────────
export function OtpConfirmModal({
  open,
  purpose,
  title,
  description,
  onVerified,   // called with action_token on success
  onClose,
}) {
  const [step, setStep]         = useState("init");   // init | sent | verifying
  const [otp, setOtp]           = useState(["","","","","",""]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const timerRef  = useRef(null);

  useEffect(() => {
    if (open) { setStep("init"); setOtp(["","","","","",""]); setError(""); setCountdown(0); }
    return () => clearInterval(timerRef.current);
  }, [open]);

  const startCountdown = () => {
    setCountdown(300);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timerRef.current); return 0; } return c - 1; });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setLoading(true); setError("");
    try {
      const r = await axiosInstance.post("/api/otp/send", { purpose });
      setMaskedEmail(r.data.data.email);
      setStep("sent");
      startCountdown();
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Enter all 6 digits");
    setLoading(true); setError(""); setStep("verifying");
    try {
      const r = await axiosInstance.post("/api/otp/verify", { purpose, otp: code });
      notify.success("OTP verified");
      onVerified?.(r.data.data.action_token);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
      setStep("sent");
      setOtp(["","","","","",""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const fmtCountdown = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">OTP Verification Required</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Step: Init */}
          {step === "init" && (
            <>
              <p className="text-sm text-muted-foreground">{description}</p>
              <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={13} />
                An OTP will be sent to your registered email address. Valid for 5 minutes.
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button onClick={handleSendOtp} disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Send OTP
                </button>
              </div>
            </>
          )}

          {/* Step: Sent */}
          {(step === "sent" || step === "verifying") && (
            <>
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to</p>
                <p className="text-sm font-semibold text-foreground">{maskedEmail}</p>
              </div>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={cn(
                      "w-11 h-12 text-center text-lg font-bold rounded-xl border-2 bg-background outline-none transition-all",
                      digit ? "border-primary text-primary" : "border-input text-foreground",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20"
                    )}
                  />
                ))}
              </div>

              {error && <p className="text-xs text-destructive text-center">{error}</p>}

              {/* Countdown */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-muted-foreground">OTP expires in <span className="font-semibold text-foreground">{fmtCountdown(countdown)}</span></p>
                ) : (
                  <button onClick={handleSendOtp} disabled={loading} className="text-xs text-primary hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button onClick={handleVerify} disabled={loading || otp.join("").length < 6}
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Verify
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SensitiveField — shows masked value with OTP reveal ───────
export function SensitiveField({ label, value, purpose, title, description }) {
  const [revealed, setRevealed]   = useState(false);
  const [otpOpen, setOtpOpen]     = useState(false);
  const [displayVal, setDisplayVal] = useState(null);
  const hideTimer = useRef(null);

  const handleVerified = async (actionToken) => {
    try {
      const r = await axiosInstance.get(`/api/faculty/sensitive/${purpose}`, {
        headers: { "X-Action-Token": actionToken },
      });
      setDisplayVal(r.data.data.value);
      setRevealed(true);
      // Auto-hide after 30 seconds
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => { setRevealed(false); setDisplayVal(null); }, 30000);
    } catch {
      notify.error("Failed to retrieve sensitive data");
    }
  };

  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {revealed && displayVal
          ? <p className="text-sm font-medium font-mono text-foreground">{displayVal}</p>
          : <p className="text-sm font-medium text-muted-foreground">{"•".repeat(12)}</p>
        }
        {value && (
          <button
            onClick={() => revealed ? (setRevealed(false), setDisplayVal(null)) : setOtpOpen(true)}
            className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
            title={revealed ? "Hide" : "View (requires OTP)"}
          >
            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
        {!value && <span className="text-xs text-muted-foreground">Not set</span>}
      </div>
      {revealed && <p className="text-[10px] text-amber-600">Auto-hides in 30 seconds</p>}
      <OtpConfirmModal
        open={otpOpen}
        purpose={purpose}
        title={title}
        description={description}
        onVerified={handleVerified}
        onClose={() => setOtpOpen(false)}
      />
    </div>
  );
}
