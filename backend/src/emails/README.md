# Emails Directory (`backend/src/emails`)

**Transactional email dispatchers and HTML templates powered by Resend.**

---

## 🌟 Overview

This directory contains the email infrastructure for **Samवाद**. When a user creates an account or takes an important security action, the system sends beautifully styled, branded transactional notifications via the **Resend API**.

---

## 📂 File Directory & Contents

### 1. `emailHandlers.js`
* **Purpose:** Manages the integration with the Resend client to dispatch outgoing emails.
* **Why it's here:** Decouples email sending logic from the HTTP controllers, ensuring non-blocking asynchronous email delivery.
* **Key Exports:**
  - `sendWelcomeEmail(email, name, clientUrl)`:
    - Constructs the welcome message payload using `createWelcomeEmailTemplate`.
    - Sends the email from `ENV.EMAIL_FROM || "onboarding@resend.dev"` via `resendClient.emails.send()`.
    - Logs delivery status or gracefully handles network errors without breaking user registration.

---

### 2. `emailTemplates.js`
* **Purpose:** Contains HTML and inline CSS templates for responsive, accessible emails.
* **Why it's here:** Ensures consistent brand presentation across email clients (Gmail, Apple Mail, Outlook).
* **Key Exports:**
  - `createWelcomeEmailTemplate(name, clientUrl)`:
    - Returns a responsive, dark-mode-compatible HTML string featuring the Samवाद branding, personalized greeting, privacy assurance, and a direct CTA button leading to the application.
