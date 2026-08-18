// src/modules/auth/pages/ResetPasswordPage.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { resetPassword, clearError } from "../../../../redux/auth/authSlice.js";
import { resetPasswordSchema } from "../../../../validators/auth.validators.js";
import { notify } from "../../../../hooks/notify.js";

import { Eye, EyeOff, Lock, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { cn } from "../../../../lib/utils.js";

// Same header used on Login.jsx — dual light/dark logo + back link
function LogoHeader({ title, description }) {
  return (
    <CardHeader className="space-y-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <img src="/Black-Logo.webp" alt="ERP Logo" className="w-60 block dark:hidden object-contain" />
          <img src="/White-Logo.webp" alt="ERP Logo" className="w-60 hidden dark:block object-contain" />
        </div>
        <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  );
}

function StrengthBar({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const bar = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const label = ["Weak", "Fair", "Good", "Strong"];
  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i < score ? bar[score - 1] : "bg-muted")} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className={cn("text-[11px] font-medium", score >= 3 ? "text-green-600 dark:text-green-400" : score >= 2 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive")}>
          {label[score - 1] || ""}
        </p>
        <div className="flex gap-2">
          {[/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].map((rx, i) => (
            <span key={i} className={cn("text-[10px]", rx.test(password) ? "text-green-600 dark:text-green-400" : "text-muted-foreground/40")}>
              {["A-Z", "0-9", "#!"][i]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, register: reg, name, error, placeholder, watch }) {
  const [show, setShow] = useState(false);
  const value = watch ? watch(name) : "";
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          {...reg(name)}
          className={cn("pl-9 pr-10", error && "border-destructive")}
        />
        <button type="button" onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {name === "password" && watch && <StrengthBar password={value} />}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loading, error } = useSelector((s) => s.auth);
  const [done, setDone] = useState(false);

  const token = params.get("token");

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (error) notify.error(error); }, [error]);

  const onSubmit = async (data) => {
    const result = await dispatch(resetPassword({ token, password: data.password }));
    if (resetPassword.fulfilled.match(result)) setDone(true);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-sm border">
          <LogoHeader title="Invalid reset link" description="" />
          <CardContent>
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">This reset link is missing or has expired.</p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request a new link</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm border">
        {!done ? (
          <>
            <LogoHeader title="Set new password" description="Choose a strong password for your account." />
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <PasswordField label="New password" name="password" register={register} error={errors.password} placeholder="Min 8 characters" watch={watch} />
                <PasswordField label="Confirm password" name="confirmPassword" register={register} error={errors.confirmPassword} placeholder="Repeat new password" />

                <Button type="submit" disabled={loading || isSubmitting} className="w-full mt-2">
                  {loading || isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>) : "Reset password"}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <LogoHeader title="Password reset!" description="" />
            <CardContent>
              <div className="text-center py-2 space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">Your password has been updated successfully.</p>
                <Button onClick={() => navigate("/login")} className="w-full">Sign in now</Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}