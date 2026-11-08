# Backend Source Directory (`backend/src`)

**The primary source root for the Samवाद REST API, WebSocket server, and cryptographic services.**

---

## 🌟 Overview

The `backend/src` directory contains the complete backend application code. The server initializes Express 4, sets up a Node.js HTTP server, mounts the Socket.io WebSocket server, validates environment schemas, connects to MongoDB, starts the encryption key rotation subsystem, and registers all middleware pipelines.

---

## 📂 Subdirectories in `src/`

* **[`controllers/`](file:///c:/Users/Asus/Desktop/chat%20app/backend/src/controllers/README.md)** — HTTP request controllers:
  - `auth.controller.js` — User authentication, JWT issuance, profile updates, Google OAuth, and account deletion.
  - `message.controller.js` — Encrypted message handling, contact lists, and Cloudinary media uploads.
  - `feedback.controller.js` — Feedback processing and ratings.
* **[`emails/`](file:///c:/Users/Asus/Desktop/chat%20app/backend/src/emails/README.md)** — Transactional email handlers and HTML templates:
  - `emailHandlers.js` — Welcome email sender via Resend.
  - `emailTemplates.js` — Branded responsive HTML templates.
* **[`lib/`](file:///c:/Users/Asus/Desktop/chat%20app/backend/src/lib/README.md)** — Core cryptographic, network, and database libraries:
  - `encryption.js` — AES-256-GCM encryption/decryption with authTag verification.
  - `keyRotation.js` — Twice-daily automated key rotation engine.
  - `messageRetention.js` — 24-hour ephemeral auto-purge worker.
  - `socket.js` — Socket.io server and WebRTC peer-to-peer call signaling.
  - `db.js` — Resilient MongoDB connection manager.
  - `env.js` — Schema-validated environment variable loader.
* **[`middleware/`](file:///c:/Users/Asus/Desktop/chat%20app/backend/src/middleware/README.md)** — Request interceptors and guards:
  - `auth.middleware.js` — JWT verification for Express REST routes.
  - `socket.auth.middleware.js` — JWT verification for WebSocket handshakes.
  - `rateLimit.middleware.js` — Multi-tier Upstash Redis & Arcjet rate limiters.
* **[`models/`](file:///c:/Users/Asus/Desktop/chat%20app/backend/src/models/README.md)** — Mongoose data models:
  - `User.js`, `Message.js`, `Consent.js`, `Feedback.js`.
* **[`routes/`](file:///c:/Users/Asus/Desktop/chat%20app/backend/src/routes/README.md)** — Express route mapping:
  - `auth.route.js`, `message.route.js`, `feedback.route.js`.

---

## 📄 Key File: `server.js`

* **Role:** Application entry point and server orchestrator.
* **Lifecycle:**
  1. **Custom DNS Fallback:** Injects `dns.setServers(["1.1.1.1", "8.8.8.8"])` to guarantee resilient DNS resolution on cloud environments.
  2. **Security Headers:** Mounts `helmet()` to enforce secure response headers.
  3. **Body Parsers:** Mounts `express.json({ limit: "50mb" })` and `express.urlencoded` for large media uploads (voice notes, videos, photos).
  4. **Data Sanitization:** Mounts `mongoSanitize()` and `xss()` to protect against query injection and script injection attacks.
  5. **Distributed Rate Limiting:** Applies `rateLimitMiddleware` to `/api` routes.
  6. **CORS:** Applies CORS policy with dynamic origin whitelist from `socket.js`.
  7. **Cookie Parser:** Parses signed HTTP-only cookies.
  8. **Route Mounts:** Registers `/api/auth`, `/api/messages`, and `/api/feedback`.
  9. **Production Static Serving:** Serves compiled frontend assets from `../frontend/dist` when `NODE_ENV === "production"`.
  10. **Startup Sequence:** Establishes MongoDB connection, initializes the key rotation subsystem, and begins listening on `ENV.PORT || 3000`.
