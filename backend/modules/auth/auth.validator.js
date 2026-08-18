// backend/modules/auth/auth.validator.js
import { z } from "zod";

export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(source === "body" ? req.body : req.query);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors:  result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }
  req.validatedData = result.data;
  next();
};

export const loginSchema = z.object({
  email:    z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

export const firstLoginSchema = z.object({
  userId:          z.string().uuid("Invalid session"),
  newPassword:     z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  pin:             z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
  confirmPin:      z.string().regex(/^\d{6}$/, "Please confirm your PIN"),
})
.refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })
.refine((d) => d.pin === d.confirmPin,              { message: "PINs don't match",      path: ["confirmPin"] });

export const verifyOtpSchema = z.object({
  userId: z.string().uuid("Invalid session"),
  otp:    z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword:     z.string().min(8, "Password must be at least 8 characters"),
}).refine((d) => d.newPassword !== d.currentPassword, {
  message: "New password must differ from current", path: ["newPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email required"),
});

export const resetPasswordSchema = z.object({
  token:    z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});