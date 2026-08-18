// backend/utils/emailService.js
import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

export const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"EIT ERP" <${process.env.SMTP_USER}>`,
    to, subject, html,
    ...(attachments && { attachments }),
  });
};

// ── Password reset ────────────────────────────────────────────
export const sendPasswordResetEmail = async (email, token) => {
  const baseUrl   = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your ERP password",
    html: `
      <body style="margin:0;padding:0;background:#f6f3ff;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ff;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">
              <tr>
                <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Password Reset</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">EIT ERP Management System</p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                    We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);
                      color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:600;font-size:15px;">
                      Reset Password
                    </a>
                  </div>
                  <p style="margin:0;background:#f3f4f6;border-radius:8px;padding:10px 14px;
                    font-family:monospace;font-size:12px;color:#7c3aed;word-break:break-all;">${resetLink}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">If you didn't request this, ignore this email.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>`,
  });
};

// ── Login OTP ─────────────────────────────────────────────────
// Sent to FACULTY, ADMIN, SUPER_ADMIN during the login flow.
export const sendLoginOtpEmail = async (email, otp, name = "") => {
  await sendEmail({
    to: email,
    subject: "Your EIT ERP login code",
    html: `
      <body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0"
              style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(59,130,246,0.10);">
              <tr>
                <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Login Verification</h1>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">EIT ERP Management System</p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;text-align:center;">
                  ${name ? `<p style="margin:0 0 20px;color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>` : ""}
                  <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                    Use the code below to complete your login. It expires in <strong>10 minutes</strong>.
                  </p>
                  <div style="display:inline-block;background:#f0f4ff;border:2px solid #2563eb;
                    border-radius:14px;padding:18px 40px;margin-bottom:24px;">
                    <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#1d4ed8;font-family:monospace;">
                      ${otp}
                    </span>
                  </div>
                  <p style="margin:0;color:#6b7280;font-size:13px;">
                    If you didn't try to log in, your password may be compromised.<br/>
                    Please reset it immediately.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    This code is single-use and expires in 10 minutes.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>`,
  });
};

// ── Temp password (for new accounts created by admin) ─────────
export const sendTempPasswordEmail = async (email, tempPassword) => {
  await sendEmail({
    to: email,
    subject: "Your EIT ERP account — temporary password",
    html: `
      <body style="font-family:'Segoe UI',sans-serif;padding:40px;background:#f6f3ff;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:36px;
          box-shadow:0 4px 24px rgba(124,58,237,0.10);">
          <h2 style="color:#7c3aed;margin-top:0;">Your EIT ERP Account</h2>
          <p style="color:#374151;">An account has been created for you. Your temporary password is:</p>
          <div style="background:#f3f4f6;border-radius:8px;padding:14px 20px;
            font-family:monospace;font-size:18px;font-weight:700;color:#7c3aed;margin:20px 0;">
            ${tempPassword}
          </div>
          <p style="color:#374151;">You will be asked to set a new password on first login.</p>
        </div>
      </body>`,
  });
};