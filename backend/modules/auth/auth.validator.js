import { z } from "zod";

/** Generic validate middleware — attaches parsed data to req.validatedData */
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(source === "body" ? req.body : req.query);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: result.error.errors.map((e) => ({
        field:   e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validatedData = result.data;
  next();
};

// ─── Login ────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

// ─── Change Password ──────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword:     z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path:    ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must differ from current password",
    path:    ["newPassword"],
  });

// ─── Forgot Password ──────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email required"),
});

// ─── Reset Password ───────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    token:           z.string().min(1, "Reset token is required"),
    password:        z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path:    ["confirmPassword"],
  });