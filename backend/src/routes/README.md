# Routes Directory (`backend/src/routes`)

**Express endpoint declarations and router middleware chains.**

---

## 🌟 Overview

The `backend/src/routes/` directory maps incoming HTTP request paths to their corresponding controller functions and attaches authentication and rate-limiting middleware guards.

---

## 📂 File Directory & Complete Details

### 1. `auth.route.js`
* **Base Path:** `/api/auth`
* **Purpose:** Handles authentication, token renewal, Google OAuth, profile updates, and account deletion.
* **Endpoints:**
  - `POST /signup` — Public. Creates account, saves GDPR consent record, sets JWT cookie.
  - `POST /login` — Public. Verifies credentials and issues JWT session.
  - `POST /google` — Public. Google OAuth 2.0 token verification and login.
  - `POST /logout` — Protected (`protectRoute`). Clears session cookie.
  - `GET /refresh` — Public / Cookie. Silent refresh for 15-minute access tokens.
  - `GET /check` — Protected (`protectRoute`). Validates active session on app boot.
  - `PUT /update-profile` — Protected (`protectRoute`). Uploads profile picture.
  - `POST /delete-account` — Protected (`protectRoute`). Permanently wipes user account.

---

### 2. `message.route.js`
* **Base Path:** `/api/messages`
* **Purpose:** Handles encrypted message history, contact lists, and Cloudinary media uploads.
* **Endpoints:**
  - `GET /users` — Protected (`protectRoute`). Retrieves conversation contacts with profile masking.
  - `GET /:id` — Protected (`protectRoute`). Retrieves and decrypts conversation messages.
  - `POST /send/:id` — Protected (`protectRoute`). Encrypts and transmits text, image, audio, or video messages.

---

### 3. `feedback.route.js`
* **Base Path:** `/api/feedback`
* **Purpose:** Receives user ratings, suggestions, and bug reports.
* **Endpoints:**
  - `POST /submit` — Public. Validates and records user feedback with client metadata.
