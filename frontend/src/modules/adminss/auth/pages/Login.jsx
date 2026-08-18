// src/modules/auth/pages/Login.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  login, completeFirstLogin, verifyOtp, resendOtp,
  getRoleHome, clearError, resetLoginFlow,
} from "../../../../redux/auth/authSlice.js";
import { loginSchema } from "../../../../validators/auth.validators.js";
import { notify } from "../../../../hooks/notify.js";

import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { Button }                                   from "@/components/ui/button";
import { Input }                                    from "@/components/ui/input";
import { Label }                                    from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "../../../../lib/utils.js";

// ── Shared header ─────────────────────────────────────────────
function LogoHeader({ title, description, onBack }) {
  return (
    <CardHeader className="space-y-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <img src="/Black-Logo.webp" alt="EIT ERP" className="w-60 block dark:hidden object-contain" />
          <img src="/White-Logo.webp" alt="EIT ERP" className="w-60 hidden dark:block object-contain" />
        </div>
        {onBack && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
      </div>
      <div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  );
}

// ── Step 1: Credentials ───────────────────────────────────────
function CredentialsStep({ onDone }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (error) notify.error(error); }, [error]);

  const onSubmit = async (data) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      const payload = result.payload;
      // Only navigate away if fully logged in (has a role, no pending step).
      // FIRST_LOGIN and VERIFY_OTP are handled by the parent via loginStep.
      if (payload?.role && !payload.step) onDone(payload);
    }
  };

  return (
    <>
      <LogoHeader title="Sign in" description="Enter your credentials to continue" />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="you@college.edu" autoComplete="email" {...register("email")}
                className={cn("pl-9", errors.email && "border-destructive")} />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password"
                {...register("password")} className={cn("pl-9 pr-10", errors.password && "border-destructive")} />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={loading || isSubmitting} className="w-full">
            {loading || isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign in"}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-6">
          Contact administrator if you cannot access your account.
        </p>
      </CardContent>
    </>
  );
}

// ── Step 2: First login — new password + 6-digit PIN ──────────
function FirstLoginStep({ userId, onNext, onBack }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "", pin: "", confirmPin: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => { if (error) notify.error(error); }, [error]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (form.newPassword.length < 8)                       e.newPassword     = "Min 8 characters";
    if (form.newPassword !== form.confirmPassword)          e.confirmPassword = "Passwords don't match";
    if (!/^\d{6}$/.test(form.pin))                         e.pin             = "Must be exactly 6 digits";
    if (form.pin !== form.confirmPin)                       e.confirmPin      = "PINs don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const result = await dispatch(completeFirstLogin({ userId, ...form }));
    if (completeFirstLogin.fulfilled.match(result)) {
      const payload = result.payload;
      // If VERIFY_OTP step is next, the reducer already set loginStep —
      // parent re-renders automatically. Only call onNext if fully done.
      if (payload?.role && !payload.step) onNext(payload);
    }
  };

  return (
    <>
      <LogoHeader title="Secure your account"
        description="Set a new password and a 6-digit PIN for your account."
        onBack={onBack} />
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={show ? "text" : "password"} value={form.newPassword} onChange={set("newPassword")}
                placeholder="Min 8 characters" className={cn("pl-9 pr-10", errors.newPassword && "border-destructive")} />
              <button type="button" onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={show ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")}
                placeholder="Repeat password" className={cn("pl-9", errors.confirmPassword && "border-destructive")} />
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>6-digit PIN</Label>
              <Input inputMode="numeric" maxLength={6} value={form.pin} onChange={set("pin")} placeholder="••••••"
                className={cn("text-center tracking-widest font-mono", errors.pin && "border-destructive")} />
              {errors.pin && <p className="text-sm text-destructive">{errors.pin}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm PIN</Label>
              <Input inputMode="numeric" maxLength={6} value={form.confirmPin} onChange={set("confirmPin")} placeholder="••••••"
                className={cn("text-center tracking-widest font-mono", errors.confirmPin && "border-destructive")} />
              {errors.confirmPin && <p className="text-sm text-destructive">{errors.confirmPin}</p>}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Continue"}
          </Button>
        </form>
      </CardContent>
    </>
  );
}

// ── Step 3: Verify email OTP ──────────────────────────────────
function VerifyOtpStep({ userId, email, onDone, onBack }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [otp, setOtp] = useState("");
  const [localError, setLocalError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => { if (error) { setLocalError(error); } }, [error]);

  const handleVerify = async (ev) => {
    ev.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setLocalError("Enter the 6-digit code from your email");
    setLocalError("");
    const result = await dispatch(verifyOtp({ userId, otp }));
    if (verifyOtp.fulfilled.match(result)) onDone(result.payload);
    else setLocalError(result.payload || "Invalid or expired code.");
  };

  const handleResend = async () => {
    setResending(true);
    setLocalError("");
    setResent(false);
    const result = await dispatch(resendOtp({ userId }));
    setResending(false);
    if (!resendOtp.rejected.match(result)) {
      setResent(true);
      setOtp("");
      notify.success("A new code has been sent to your email");
    }
  };

  return (
    <>
      <LogoHeader title="Check your email"
        description={`Enter the 6-digit code sent to ${email || "your email address"}.`}
        onBack={onBack} />
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <Label>Verification code</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                inputMode="numeric" maxLength={6} autoFocus
                value={otp} onChange={(e) => { setOtp(e.target.value); setLocalError(""); }}
                placeholder="••••••"
                className={cn("pl-9 text-center text-lg tracking-[0.4em] font-mono", localError && "border-destructive")}
              />
            </div>
            {localError && <p className="text-sm text-destructive text-center">{localError}</p>}
            {resent && <p className="text-sm text-emerald-600 text-center">New code sent — check your inbox.</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify"}
          </Button>

          <div className="text-center">
            <button type="button" onClick={handleResend} disabled={resending}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <RefreshCw className={cn("h-3 w-3", resending && "animate-spin")} />
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Code expires in 10 minutes. Check your spam folder if you don't see it.
          </p>
        </form>
      </CardContent>
    </>
  );
}

// ── Orchestrator ──────────────────────────────────────────────
export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { loginStep, loginUserId, loginEmail } = useSelector((s) => s.auth);

  const from = location.state?.from?.pathname;

  useEffect(() => { dispatch(resetLoginFlow()); }, []);

  const greet = (user) => {
    const name = user?.student?.name || user?.faculty?.name || user?.admin?.name;
    notify.success(`Welcome back${name ? ", " + name.split(" ")[0] : ""}!`);
  };

  const handleDone = (user) => {
    greet(user);
    const dest = from && from !== "/login" ? from : getRoleHome(user.role);
    navigate(dest, { replace: true });
  };

  const handleBack = () => dispatch(resetLoginFlow());

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm border">
        {!loginStep && <CredentialsStep onDone={handleDone} />}
        {loginStep === "FIRST_LOGIN" && (
          <FirstLoginStep userId={loginUserId} onNext={handleDone} onBack={handleBack} />
        )}
        {loginStep === "VERIFY_OTP" && (
          <VerifyOtpStep userId={loginUserId} email={loginEmail} onDone={handleDone} onBack={handleBack} />
        )}
      </Card>
    </div>
  );
}