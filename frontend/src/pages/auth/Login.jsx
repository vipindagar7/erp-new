import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { login, getRoleHome, clearError } from "../../redux/auth/authSlice.js";
import { loginSchema } from "../../validators/auth.validators.js";
import { notify } from "../../hooks/notify.js";

import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

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

import { cn } from "../../lib/utils.js";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useSelector((s) => s.auth);

  const [showPw, setShowPw] = useState(false);

  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    dispatch(clearError());
  }, []);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  const onSubmit = async (data) => {
    const result = await dispatch(login(data));

    if (login.fulfilled.match(result)) {
      const user = result.payload;

      const dest =
        from && from !== "/login"
          ? from
          : getRoleHome(user.role);

      navigate(dest, { replace: true });

      notify.success(
        `Welcome back${user.student?.name ||
          user.faculty?.name ||
          user.admin?.name
          ? ", " +
          (
            user.student?.name ||
            user.faculty?.name ||
            user.admin?.name
          ).split(" ")[0]
          : ""
        }!`
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm border">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center">
              {/* Light Theme Logo */}
              <img
                src="/Black-Logo.webp"
                alt="ERP Logo"
                className=" w-60 block dark:hidden object-contain"
              />

              {/* Dark Theme Logo */}
              <img
                src="/White-Logo.webp"
                alt="ERP Logo"
                className="w-60 hidden dark:block object-contain"
              />
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl">
              Sign in
            </CardTitle>

            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div className="space-y-2">
              <Label>Email</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  type="email"
                  placeholder="you@college.edu"
                  autoComplete="email"
                  {...register("email")}
                  className={cn(
                    "pl-9",
                    errors.email && "border-destructive"
                  )}
                />
              </div>

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Password</Label>

                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className={cn(
                    "pl-9 pr-10",
                    errors.password && "border-destructive"
                  )}
                />

                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full"
            >
              {loading || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Contact administrator if you cannot access your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}