# Emails Directory (`backend/src/emails`)

**Transactional email dispatchers, SMTP/Resend providers, and responsive HTML templates.**

---

## 🌟 Overview

This directory contains the email infrastructure for **Samवाद**. It supports multi-engine delivery backends:
1. **Google Apps Script Web App** (`EMAIL_WEBHOOK_URL`): High-speed HTTPS (Port 443) dispatching via native Google APIs. Solves cloud hosting (Render Free Tier) SMTP port blocking without exposing personal accounts or requiring App Passwords.
2. **Brevo REST API** (`BREVO_API_KEY`): Transactional HTTPS delivery with 300 free emails/day.
3. **Nodemailer SMTP** (Gmail with App Password, Brevo, SendGrid, Amazon SES, or custom corporate SMTP).
4. **Resend API** (Transactional email service for verified domains).

When a user signs up, the system generates a secure 6-digit One-Time Password (OTP) and delivers a high-contrast branded email directly to their inbox, allowing the user to copy the code from their email and paste it into the application.

---

## 📂 File Directory & Contents

### 1. `emailHandlers.js`
* **Purpose:** Manages the integration with Nodemailer SMTP and Resend to dispatch outgoing transactional emails.
* **Why it's here:** Decouples email sending logic from HTTP controllers and provides automatic fallback across email delivery providers.
* **Key Exports:**
  - `sendVerificationOtpEmail(email, otp, name)`:
    - Constructs the OTP verification payload using `createOtpEmailTemplate`.
    - Attempts delivery via HTTPS Webhook (`EMAIL_WEBHOOK_URL`) if configured (Port 443, instant).
    - Attempts delivery via Brevo REST API (`BREVO_API_KEY`) if configured.
    - Attempts delivery via Nodemailer SMTP if configured (`EMAIL_USER` & `EMAIL_PASS` or `SMTP_HOST`).
    - Falls back to Resend API if `RESEND_API_KEY` is present and valid.
    - Surfaces descriptive errors if email configuration is missing or if delivery is rejected by the provider.
  - `sendWelcomeEmail(email, name, clientUrl)`:
    - Sends the onboarding welcome message after registration.

---

### 2. `emailTemplates.js`
* **Purpose:** Contains responsive HTML templates with inline styles for universal rendering across email clients (Gmail, Apple Mail, Outlook, webmail).
* **Why it's here:** Ensures consistent brand presentation and optimal readability.
* **Key Exports:**
  - `createOtpEmailTemplate(otp, name)`:
    - Returns a high-contrast HTML email highlighting the 6-digit OTP in large monospaced font (`38px`, `letter-spacing: 12px`), with a 10-minute expiration notice and security warnings.
  - `createWelcomeEmailTemplate(name, clientUrl)`:
    - Returns a welcome message introducing Samवाद's core features (WebRTC HD calls, ephemeral chat, zero tracking) and direct CTA button.
