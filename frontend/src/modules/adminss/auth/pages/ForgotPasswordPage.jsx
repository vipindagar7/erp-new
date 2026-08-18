// src/modules/auth/pages/ForgotPasswordPage.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgotPassword, clearError } from "../../../../redux/auth/authSlice.js";
import { forgotPasswordSchema } from "../../../../validators/auth.validators.js";
import { notify } from "../../../../hooks/notify.js";

import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

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

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (error) notify.error(error); }, [error]);

  const onSubmit = async (data) => {
    const result = await dispatch(forgotPassword(data));
    if (forgotPassword.fulfilled.match(result)) {
      setSentTo(data.email);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm border">
        {!sent ? (
          <>
            <LogoHeader title="Forgot password?" description="Enter your registered email and we'll send you a reset link." />
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@college.edu"
                      autoComplete="email"
                      {...register("email")}
                      className={cn("pl-9", errors.email && "border-destructive")}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" disabled={loading || isSubmitting} className="w-full">
                  {loading || isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>) : "Send reset link"}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-6">
                <Link to="/login" className="hover:text-foreground transition-colors">Back to sign in</Link>
              </p>
            </CardContent>
          </>
        ) : (
          <>
            <LogoHeader title="Check your inbox" description="" />
            <CardContent>
              <div className="text-center py-2 space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a password reset link to{" "}
                  <span className="text-foreground font-medium">{sentTo}</span>.
                  <br />The link expires in 1 hour.
                </p>
                <p className="text-xs text-muted-foreground">
                  Didn't receive it?{" "}
                  <button onClick={() => setSent(false)} className="text-foreground underline underline-offset-2 hover:no-underline">
                    Try again
                  </button>
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}