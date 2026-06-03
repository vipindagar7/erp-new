import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword, clearError } from "../../redux/auth/authSlice.js";
import { changePasswordSchema } from "../../validators/auth.validators.js";
import { notify } from "../../hooks/notify.js";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils.js";

function PasswordField({ id, label, registration, error, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</Label>
      <div className="relative">
        <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          {...registration}
          className={cn("pl-9 pr-10", error && "border-destructive focus-visible:ring-destructive/30")}
        />
        <button type="button" onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      {error && <p className="text-destructive text-xs mt-0.5">⚠ {error.message}</p>}
    </div>
  );
}

function StrengthBar({ password }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score  = checks.filter(Boolean).length;
  const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return (
    <div className="space-y-1 px-1">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i < score ? colors[score-1] : "bg-border")} />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", score >= 3 ? "text-green-600 dark:text-green-400" : score >= 2 ? "text-yellow-600" : "text-destructive")}>
        {labels[score-1] || ""}
      </p>
    </div>
  );
}

export default function ChangePasswordModal({ open, onClose }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const {
    register, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const newPw = watch("newPassword", "");

  useEffect(() => {
    if (open) { reset(); dispatch(clearError()); }
  }, [open]);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  const onSubmit = async (data) => {
    const result = await dispatch(changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }));
    if (changePassword.fulfilled.match(result)) {
      notify.success("Password changed successfully");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={15} className="text-primary" />
            </div>
            Change Password
          </DialogTitle>
          <DialogDescription>
            Enter your current password then choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-1">
          <PasswordField
            id="currentPassword" label="Current password"
            registration={register("currentPassword")}
            error={errors.currentPassword}
            placeholder="Your current password"
          />

          <div className="space-y-2">
            <PasswordField
              id="newPassword" label="New password"
              registration={register("newPassword")}
              error={errors.newPassword}
              placeholder="Min 8 characters"
            />
            <StrengthBar password={newPw} />
          </div>

          <PasswordField
            id="confirmPassword" label="Confirm new password"
            registration={register("confirmPassword")}
            error={errors.confirmPassword}
            placeholder="Repeat new password"
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 size={13} className="mr-2 animate-spin" />}
              Update Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
