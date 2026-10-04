export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<SendEmailResult> {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #0d0d0f; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="color: #27ff9a; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">SmartSplit <span style="color: #ffffff;">Pro</span></h1>
        <p style="color: #88888e; font-size: 14px; margin-top: 8px;">Secure Password Reset</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6; color: #d0d0d5;">
        Hello,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #d0d0d5;">
        We received a request to reset the password for your SmartSplit account (<strong>${toEmail}</strong>). Please use the verification code below to set a new password:
      </p>

      <div style="background-color: rgba(39, 255, 154, 0.08); border: 1px solid rgba(39, 255, 154, 0.25); border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #27ff9a; font-family: 'Courier New', Courier, monospace;">${otp}</span>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">Expires in 10 minutes</p>
      </div>

      <p style="font-size: 13px; color: #88888e; line-height: 1.5;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>

      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 28px 0 20px 0;" />
      
      <p style="font-size: 12px; color: #55555e; text-align: center; margin: 0;">
        SmartSplit Pro — AI Expense Splitting & Debt Minimization
      </p>
    </div>
  `;

  // ── 1. Resend API (HTTP Port 443 - Instant & Never Blocked by Render) ─────
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM || "SmartSplit Pro <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `Your SmartSplit Reset Code: ${otp}`,
          html: htmlContent,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[EMAIL SERVICE] Successfully sent email via Resend to ${toEmail}`);
        return { success: true };
      } else {
        const errorMsg = resData?.message || "Resend email delivery failed";
        console.error("[EMAIL SERVICE] Resend API error:", errorMsg);
        return { success: false, error: `Resend: ${errorMsg}` };
      }
    } catch (err: any) {
      console.error("[EMAIL SERVICE] Resend request failed:", err);
      return { success: false, error: `Resend request failed: ${err.message}` };
    }
  }

  // ── 2. Brevo / Sendinblue API (HTTP Port 443 - Also Never Blocked) ────────
  const brevoApiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)?.trim();
  if (brevoApiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "SmartSplit Pro", email: process.env.BREVO_SENDER || "noreply@smartsplit.app" },
          to: [{ email: toEmail }],
          subject: `Your SmartSplit Reset Code: ${otp}`,
          htmlContent: htmlContent,
        }),
      });

      if (res.ok) {
        console.log(`[EMAIL SERVICE] Successfully dispatched email via Brevo to ${toEmail}`);
        return { success: true };
      }
    } catch (err) {
      console.error("[EMAIL SERVICE] Brevo request failed:", err);
    }
  }

  // ── 3. SMTP (Gmail Nodemailer - Fails with timeout on Render Free tier) ─────
  const smtpUser = (
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.SMTP_EMAIL ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER ||
    ""
  ).trim();

  const smtpPass = (
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.MAIL_PASS ||
    process.env.MAIL_PASSWORD ||
    process.env.GMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    ""
  ).replace(/\s+/g, "").trim();

  if (!smtpUser || !smtpPass) {
    const errorMsg = `No email provider configured. Add RESEND_API_KEY (recommended for Render) or SMTP_USER & SMTP_PASS in Render Environment.`;
    console.error(`[EMAIL SERVICE] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const nodemailerModule = await import("nodemailer");
    const nodemailer = (nodemailerModule as any).default || nodemailerModule;

    // Use tight timeouts (4s) so it doesn't hang if Render drops outbound SMTP traffic
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 6000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"SmartSplit Pro" <${smtpUser}>`,
      to: toEmail,
      subject: `Your SmartSplit Reset Code: ${otp}`,
      text: `Your SmartSplit password reset code is: ${otp}. It expires in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[EMAIL SERVICE] Successfully dispatched OTP email to ${toEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL SERVICE] Failed to send email via SMTP:", error);
    const detail = error?.message || String(error);

    if (detail.toLowerCase().includes("timeout") || detail.toLowerCase().includes("timedout")) {
      return {
        success: false,
        error: `Render Free Tier blocks outbound SMTP traffic (ports 25, 465, 587) causing connection timeouts. Please use Resend (add RESEND_API_KEY to Render) which sends instantly over HTTPS port 443.`,
      };
    }

    return {
      success: false,
      error: `Gmail SMTP Error: ${detail}`,
    };
  }
}
