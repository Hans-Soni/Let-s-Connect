import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate, createOtpEmailTemplate } from "../emails/emailTemplates.js";
import { ENV } from "../lib/env.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    const { data, error } = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to Samवाद!",
      html: createWelcomeEmailTemplate(name, clientURL),
    });

    if (error) {
      console.warn("[Email] Warning sending welcome email:", error.message || error);
      return;
    }

    console.log("[Email] Welcome Email sent successfully", data);
  } catch (err) {
    console.warn("[Email] Exception sending welcome email:", err.message);
  }
};

export const sendVerificationOtpEmail = async (email, otp, name = "") => {
  const isDevOrPlaceholder =
    ENV.NODE_ENV === "development" ||
    !ENV.RESEND_API_KEY ||
    ENV.RESEND_API_KEY.startsWith("re_123");

  console.log(`\n=========================================`);
  console.log(`[AUTH OTP] Verification Code for: ${email}`);
  console.log(`[AUTH OTP] CODE: ${otp}`);
  console.log(`=========================================\n`);

  try {
    const { data, error } = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: `Your Samवाद Verification Code: ${otp}`,
      html: createOtpEmailTemplate(otp, name),
    });

    if (error) {
      console.warn("[Email] Resend API reported an issue:", error.message || error);
      if (isDevOrPlaceholder) {
        return { success: true, simulated: true };
      }
      return { success: false, error: error.message };
    }

    console.log("[Email] Verification OTP sent successfully", data);
    return { success: true, data };
  } catch (err) {
    console.warn("[Email] Exception dispatching OTP email:", err.message);
    if (isDevOrPlaceholder) {
      return { success: true, simulated: true };
    }
    return { success: false, error: err.message };
  }
};
