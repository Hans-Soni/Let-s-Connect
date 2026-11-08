<div align="center">

# ⚙️ Samवाद — Backend Architecture

**The secure, scalable, real-time Node.js & Socket.io engine powering Samवाद.**

[![Node.js](https://img.shields.io/badge/Runtime-Node.js%2020%2B-success)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express.js%204-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas%20%2B%20Mongoose-green)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io%204-black)](https://socket.io/)
[![Cryptography](https://img.shields.io/badge/Encryption-AES--256--GCM-blue)](#)

</div>

---

## 🌟 Overview

The `backend/` directory houses the core RESTful API and WebSocket infrastructure for **Samवाद**. Built on Node.js and Express, it provides encrypted message routing, user session management, GDPR-compliant digital privacy consent logging, and WebRTC peer-to-peer audio/video call signaling.

Security and zero-knowledge privacy are baked into every layer:
- **AES-256-GCM Encryption:** Message text is encrypted at rest using authenticated cryptography before entering MongoDB.
- **Twice-Daily Key Rotation:** Server encryption keys automatically cycle every 12 hours (at 00:00 and 12:00 IST), maintaining a secure KeySet collection in the database.
- **24-Hour Auto-Purge Worker:** A cron background task runs every minute to permanently erase messages older than 24 hours and trigger Cloudinary SDK deletion for all associated voice notes, videos, and images.
- **Multi-Tier Rate Limiting:** High-speed token bucket rate limiting via Upstash Redis with automated fallback to Arcjet shield protection.

---

## 📂 Subdirectory Navigation & Module Map

| Directory | Purpose & Contents |
| :--- | :--- |
| **`src/`** | Core backend server application source code. |
| **`src/controllers/`** | HTTP request controllers handling business logic for authentication, messaging, and user feedback. |
| **`src/emails/`** | Transactional email handlers and HTML/CSS templates powered by Resend. |
| **`src/lib/`** | Core system libraries: cryptographic modules (AES-256-GCM), key rotation, database connection, Socket.io signaling, and IP extraction. |
| **`src/middleware/`** | Express and Socket.io middleware for JWT verification, distributed rate limiting, and bot defense. |
| **`src/models/`** | Mongoose schemas defining MongoDB collections: `User`, `Message`, `Consent`, and `Feedback`. |
| **`src/routes/`** | REST route definitions mapping endpoints to controller functions. |

---

## 🔌 API Endpoints Summary

### Authentication Routes (`/api/auth`)
* `POST /signup` — Register a new user with full name, email, password, professional designation, and mandatory data consent audit logging.
* `POST /login` — Authenticate credentials, set secure `jwt` httpOnly cookie, and issue bearer token.
* `POST /google` — Secure Google OAuth 2.0 authentication with token verification and automated account creation.
* `POST /logout` — Invalidate user cookie and disconnect active socket sessions.
* `GET /refresh` — Silent JWT token refresh using httpOnly cookie for seamless uninterrupted sessions.
* `GET /check` — Verify current user session and return authenticated profile data.
* `PUT /update-profile` — Update user profile picture via Cloudinary upload.
* `POST /delete-account` — Irreversible account deletion with 2-step password verification, purging personal records while retaining GDPR audit trails.

### Message Routes (`/api/messages`)
* `GET /users` — Retrieve sidebar conversation list with blocked user filtering and profile masking.
* `GET /:id` — Retrieve encrypted chat history between two users, dynamically decrypted via AES-256-GCM.
* `POST /send/:id` — Send encrypted text message and/or upload Cloudinary media attachments (images, voice notes, videos).

### Feedback Routes (`/api/feedback`)
* `POST /submit` — Submit user feedback, bug reports, and experience ratings.

---

## 📡 WebSockets & WebRTC Call Signaling

The backend runs a Socket.io server integrated directly into the Express HTTP server:
* **Online Status:** Tracks active user socket connections across multiple tabs and devices.
* **Instant Messaging:** Dispatches real-time message events (`newMessage`) directly to the recipient's active socket.
* **Typing Indicators:** Broadcasts real-time typing state to active conversation partners.
* **WebRTC Signaling:** Mediates peer-to-peer voice and video call negotiation:
  - `call:incoming` — Notifies recipient of incoming call with caller details and call type (`audio` or `video`).
  - `call:accept` — Establishes peer-to-peer session and sends WebRTC offer/answer SDP.
  - `call:reject` / `call:end` — Terminates active call session and resets media streams.
  - `call:ice-candidate` — Relays STUN/TURN ICE network candidates between peers.

---

## 🛡️ Security & Hardening Stack

1. **Helmet:** Injects secure HTTP response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
2. **CORS Origin Whitelist:** Restricts API and WebSocket traffic strictly to production domains (`https://hans-soni.github.io`), local development servers (`http://localhost:5173`), and native mobile app wrappers (`capacitor://localhost`, `http://localhost`).
3. **NoSQL Injection Defense:** `express-mongo-sanitize` strips out `$` and `.` operators from request bodies and query parameters.
4. **XSS Protection:** `xss-clean` sanitizes user input to prevent script injection.
5. **Reverse Proxy Trust:** Configured with `app.set("trust proxy", true)` and custom `ipUtils.js` to correctly resolve client IPs behind Cloudflare and Render proxies.

---

## 🚀 Running Backend Tests

Run all 39 unit and integration tests across rate limiters, secret generators, IP extractors, and authentication policies:
```bash
npm run test:all
```
