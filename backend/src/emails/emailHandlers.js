import nodemailer from "nodemailer";
import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate, createOtpEmailTemplate } from "../emails/emailTemplates.js";
import { ENV } from "../lib/env.js";

// Helper to instantiate an SMTP transporter if credentials are provided
const getSmtpTransporter = () => {
  const user = (ENV.SMTP_USER || "").trim();
  const pass = (ENV.SMTP_PASS || "").replace(/\s+/g, "");

  if (!user || !pass) return null;

  if (ENV.SMTP_SERVICE === "gmail" || (!ENV.SMTP_HOST && user.includes("@gmail.com"))) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
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
    });
  }

  return null;
};

export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    const smtpTransporter = getSmtpTransporter();
    if (smtpTransporter) {
      await smtpTransporter.sendMail({
        from: `"${ENV.EMAIL_FROM_NAME || sender.name || "Samवाद"}" <${ENV.SMTP_USER || sender.email}>`,
        to: email,
        subject: "Welcome to Samवाद!",
        html: createWelcomeEmailTemplate(name, clientURL),
      });
      console.log("[Email] Welcome Email delivered via SMTP to:", email);
      return;
    }

    if (ENV.RESEND_API_KEY && !ENV.RESEND_API_KEY.startsWith("re_123")) {
      const { data, error } = await resendClient.emails.send({
        from: `${sender.name} <${sender.email}>`,
        to: email,
        subject: "Welcome to Samवाद!",
        html: createWelcomeEmailTemplate(name, clientURL),
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

  // 1. Try Nodemailer SMTP if configured
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
      return {
        success: false,
        error: `Failed to deliver email via SMTP (${smtpErr.message}). Please check SMTP settings.`,
      };
    }
  }

  // 2. Try Resend API if a real API key is configured
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
        return {
          success: false,
          error: error.message || "Email delivery failed with Resend. Ensure domain or recipient is verified.",
        };
      }

      console.log("[Email] Real OTP delivered successfully via Resend:", data);
      return { success: true, provider: "resend", data };
    } catch (resendErr) {
      console.error("[Email] Exception in Resend delivery:", resendErr.message);
      return { success: false, error: resendErr.message };
    }
  }

  // 3. Neither real SMTP nor real Resend key is configured in .env
  const configError =
    "Email service not configured: Please provide real email credentials in backend/.env (EMAIL_USER & EMAIL_PASS for Gmail/SMTP, or a valid RESEND_API_KEY) so emails can be sent to your inbox.";
  console.error(`[Email Config Missing] ${configError}`);
  return {
    success: false,
    error: configError,
  };
};
