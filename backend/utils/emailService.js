import nodemailer from "nodemailer";

const createTransporter = () =>
    nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

export const sendEmail = async ({ to, subject, html }) => {
    const transporter = createTransporter();
    await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ERP System" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
};

export const sendPasswordResetEmail = async (email, token) => {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await sendEmail({
        to: email,
        subject: "Reset your ERP password",
        html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin:0;padding:0;background:#f6f3ff;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ff;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#fff;border-radius:16px;overflow:hidden;
                     box-shadow:0 4px 24px rgba(124,58,237,0.10);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;">
                  <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);
                    border-radius:12px;display:inline-flex;align-items:center;justify-content:center;
                    font-size:20px;font-weight:900;color:#fff;margin-bottom:12px;">E</div>
                  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Password Reset</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">ERP Management System</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                    We received a request to reset your password. Click the button below to set a new one.
                  </p>
                  <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
                    This link will expire in <strong>1 hour</strong>.
                  </p>
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${resetLink}"
                      style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);
                        color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;
                        font-weight:600;font-size:15px;">
                      Reset Password
                    </a>
                  </div>
                  <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                    Or copy and paste this URL into your browser:
                  </p>
                  <p style="margin:0;background:#f3f4f6;border-radius:8px;padding:10px 14px;
                    font-family:monospace;font-size:12px;color:#7c3aed;word-break:break-all;">
                    ${resetLink}
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    If you didn't request this, you can safely ignore this email.
                    <br/>Your password will not change.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
    });
};