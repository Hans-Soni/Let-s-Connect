import nodemailer from "nodemailer";
import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate, createOtpEmailTemplate } from "../emails/emailTemplates.js";
import { ENV } from "../lib/env.js";

// Helper to instantiate an SMTP transporter if credentials are provided
const getSmtpTransporter = () => {
  const user = (ENV.SMTP_USER || "").trim();
  const pass = (ENV.SMTP_PASS || "").replace(/\s+/g, "");

  if (!user || !pass) return null;

  const timeouts = {
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 5000,
  };

  if (ENV.SMTP_SERVICE === "gmail" || (!ENV.SMTP_HOST && user.includes("@gmail.com"))) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
      ...timeouts,
    });
  }

  if (ENV.SMTP_HOST) {
    return nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT || 587,
      secure: ENV.SMTP_SECURE || false,
      auth: {
        user,
        pass,
      },
      ...timeouts,
    });
  }

  return null;
};

export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    const html = createWelcomeEmailTemplate(name, clientURL);
    const subject = "Welcome to Samवाद!";

    // 1. Try HTTPS Webhook if configured
    if (ENV.EMAIL_WEBHOOK_URL) {
      try {
        const hookRes = await fetch(ENV.EMAIL_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            name: name || "Samवाद User",
            subject,
            html,
          }),
        });
        if (hookRes.ok) {
          console.log("[Email] Welcome Email delivered via HTTPS Webhook to:", email);
          return;
        }
      } catch (hookErr) {
        console.warn("[Email] Webhook welcome email warning:", hookErr.message);
      }
    }

    // 2. Try Brevo REST API if configured
    if (ENV.BREVO_API_KEY) {
      try {
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": ENV.BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: ENV.EMAIL_FROM_NAME || "Samवाद",
              email: ENV.EMAIL_FROM || "hanssureshsoni@gmail.com",
            },
            to: [{ email, name: name || "Samवाद User" }],
            subject,
            htmlContent: html,
          }),
        });
        if (brevoRes.ok) {
          console.log("[Email] Welcome Email delivered via Brevo to:", email);
          return;
        }
      } catch (brevoErr) {
        console.warn("[Email] Brevo welcome email warning:", brevoErr.message);
      }
    }

    // 3. Try SMTP Transporter
    const smtpTransporter = getSmtpTransporter();
    if (smtpTransporter) {
      try {
        await smtpTransporter.sendMail({
          from: `"${ENV.EMAIL_FROM_NAME || sender.name || "Samवाद"}" <${ENV.SMTP_USER || sender.email}>`,
          to: email,
          subject,
          html,
        });
        console.log("[Email] Welcome Email delivered via SMTP to:", email);
        return;
      } catch (smtpErr) {
        console.warn("[Email] Warning sending welcome email via SMTP:", smtpErr.message);
      }
    }

    // 4. Try Resend API
    if (ENV.RESEND_API_KEY && !ENV.RESEND_API_KEY.startsWith("re_123")) {
      const { data, error } = await resendClient.emails.send({
        from: `${sender.name} <${sender.email}>`,
        to: email,
        subject,
        html,
      });

      if (error) {
        console.warn("[Email] Warning sending welcome email via Resend:", error.message || error);
        return;
      }

      console.log("[Email] Welcome Email sent via Resend:", data);
    }
  } catch (err) {
    console.warn("[Email] Exception sending welcome email:", err.message);
  }
};

export const sendVerificationOtpEmail = async (email, otp, name = "") => {
  console.log(`\n=========================================`);
  console.log(`[AUTH OTP] Dispatching Verification Code to: ${email}`);
  console.log(`[AUTH OTP] CODE: ${otp}`);
  console.log(`=========================================\n`);

  let lastError = null;

  // 1. Try HTTPS Webhook (e.g. Google Apps Script Web App for Gmail delivery over HTTPS / Port 443)
  if (ENV.EMAIL_WEBHOOK_URL) {
    try {
      console.log("[Email] Dispatching OTP via HTTPS Webhook...");
      const hookRes = await fetch(ENV.EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          name: name || "Samवाद User",
          subject: `Your Samवाद Verification Code: ${otp}`,
          html: createOtpEmailTemplate(otp, name),
          otp,
        }),
      });

      if (hookRes.ok) {
        console.log("[Email] Real OTP delivered successfully via HTTPS Webhook to:", email);
        return { success: true, provider: "webhook" };
      }
      const errText = await hookRes.text().catch(() => "");
      console.warn("[Email] Webhook responded with status:", hookRes.status, errText);
      lastError = `Webhook delivery returned HTTP ${hookRes.status}`;
    } catch (hookErr) {
      console.error("[Email] Exception in HTTPS Webhook delivery:", hookErr.message);
      lastError = `Webhook error: ${hookErr.message}`;
    }
  }

  // 2. Try Brevo REST API over HTTPS (Port 443)
  if (ENV.BREVO_API_KEY) {
    try {
      console.log("[Email] Dispatching OTP via Brevo API...");
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": ENV.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: ENV.EMAIL_FROM_NAME || "Samवाद",
            email: ENV.EMAIL_FROM || "hanssureshsoni@gmail.com",
          },
          to: [{ email, name: name || "Samवाद User" }],
          subject: `Your Samवाद Verification Code: ${otp}`,
          htmlContent: createOtpEmailTemplate(otp, name),
        }),
      });

      if (brevoRes.ok) {
        const brevoData = await brevoRes.json().catch(() => ({}));
        console.log("[Email] Real OTP delivered successfully via Brevo:", brevoData);
        return { success: true, provider: "brevo", data: brevoData };
      }
      const errData = await brevoRes.json().catch(() => ({}));
      console.warn("[Email] Brevo responded with error:", errData);
      lastError = errData.message || "Brevo delivery failed";
    } catch (brevoErr) {
      console.error("[Email] Exception in Brevo delivery:", brevoErr.message);
      lastError = `Brevo error: ${brevoErr.message}`;
    }
  }

  // 3. Try Nodemailer SMTP if configured (Gmail / Custom SMTP)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `"${ENV.EMAIL_FROM_NAME || sender.name || "Samवाद"}" <${ENV.SMTP_USER || sender.email}>`,
        to: email,
        subject: `Your Samवाद Verification Code: ${otp}`,
        html: createOtpEmailTemplate(otp, name),
      });
      console.log("[Email] Real OTP delivered successfully via SMTP:", info.messageId);
      return { success: true, provider: "smtp", messageId: info.messageId };
    } catch (smtpErr) {
      console.error("[Email] SMTP delivery failed:", smtpErr.message);
      lastError = smtpErr.message.includes("timeout") || smtpErr.message.includes("ETIMEDOUT")
        ? `SMTP timed out. Note: Free cloud tiers (such as Render Free Tier) block standard SMTP ports 465/587. Please configure an HTTPS email relay or port 2525 for cloud hosting.`
        : `Failed to deliver email via SMTP (${smtpErr.message}).`;
    }
  }

  // 4. Try Resend API if configured
  const hasRealResendKey = ENV.RESEND_API_KEY && !ENV.RESEND_API_KEY.startsWith("re_123");
  if (hasRealResendKey) {
    try {
      const { data, error } = await resendClient.emails.send({
        from: `${sender.name} <${sender.email}>`,
        to: email,
        subject: `Your Samवाद Verification Code: ${otp}`,
        html: createOtpEmailTemplate(otp, name),
      });

      if (error) {
        console.error("[Email] Resend reported delivery error:", error);
        lastError = error.message || "Email delivery failed with Resend. Ensure domain or recipient is verified.";
      } else {
        console.log("[Email] Real OTP delivered successfully via Resend:", data);
        return { success: true, provider: "resend", data };
      }
    } catch (resendErr) {
      console.error("[Email] Exception in Resend delivery:", resendErr.message);
      lastError = resendErr.message;
    }
  }

  // 5. Neither succeeded or neither configured
  const configError =
    lastError ||
    "Email service not configured: Please provide real email credentials in backend/.env (EMAIL_USER & EMAIL_PASS for Gmail/SMTP, or EMAIL_WEBHOOK_URL) so emails can be sent to your inbox.";
  console.error(`[Email Config Missing/Failed] ${configError}`);
  return {
    success: false,
    error: configError,
  };
};
