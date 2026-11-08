# Libraries Directory (`backend/src/lib`)

**Core cryptographic, database, real-time networking, and infrastructure modules.**

---

## 🌟 Overview

The `backend/src/lib/` directory contains the foundational building blocks of the Samवाद backend architecture. This includes authenticated AES-256-GCM encryption, the automated twice-daily key rotation engine, MongoDB connection resiliency, WebSockets and WebRTC peer call signaling, Cloudinary asset lifecycles, and distributed Redis rate limiters.

---

## 📂 File Directory & Complete Details

### 1. `encryption.js`
* **Purpose:** Provides authenticated, tamper-proof end-to-end symmetric encryption for message text.
* **Algorithm:** **AES-256-GCM** (Advanced Encryption Standard in Galois/Counter Mode).
* **Format:** `enc:iv:authTag:ciphertext`
  - `iv`: 16-byte cryptographically secure random Initialization Vector (32 hex characters).
  - `authTag`: 16-byte GCM authentication tag (32 hex characters) that verifies message integrity and detects any tampering.
  - `ciphertext`: Encrypted message content.
* **Key Functions:**
  - `encryptMessage(text, key)` — Encrypts plain text using active key and returns formatted string.
  - `decryptMessage(encryptedText, activeKey, historicalKeys)` — Decrypts payload, verifying authentication tag. Automatically tests historical keys from the rotation keyring if the primary key does not match.

---

### 2. `keyRotation.js`
* **Purpose:** Manages automated twice-daily server encryption key rotation without downtime or decryption failure.
* **Schedule:** Automatically rotates keys at **00:00 IST** and **12:00 IST**.
* **Storage:** Stores rotated cryptographic keys in the MongoDB `KeySet` collection (`keysets`), keeping an active key and up to 30 historical keys for legacy message decryption within the 24-hour retention window.
* **Key Exports:**
  - `initKeyRotation()` — Initializes the rotation system upon server boot.
  - `getActiveKey()` — Returns the active 32-byte encryption key.
  - `getHistoricalKeys()` — Returns array of valid historical keys.

---

### 3. `messageRetention.js`
* **Purpose:** Ephemeral message lifecycle engine enforcing Samवाद's 24-hour auto-purge guarantee.
* **Schedule:** Runs every 60 seconds.
* **Execution:**
  1. Finds all messages in MongoDB where `createdAt < Date.now() - 24 hours`.
  2. For every message with media (images, audio voice notes, video clips), calls Cloudinary API `cloudinary.uploader.destroy()` to permanently wipe media from the cloud.
  3. Deletes message documents from MongoDB.
  4. Retries failed media deletions on subsequent runs to prevent orphaned cloud storage.

---

### 4. `socket.js`
* **Purpose:** Hosts the Socket.io WebSocket server, user presence engine, and WebRTC peer-to-peer call signaling.
* **Key Components:**
  - `isOriginAllowed(origin, callback)` — CORS origin verification validating official production URL (`https://hans-soni.github.io`), dev servers, and mobile native apps (`capacitor://localhost`, `http://localhost`).
  - `userSocketsMap` — Thread-safe map tracking online users and multi-device socket connections.
  - **WebRTC Call Signaling:**
    - `call:initiate` — Dispatches incoming call notification with caller name, photo, and media type (`voice` or `video`).
    - `call:accept` — Exchanges WebRTC offer/answer session descriptions.
    - `call:ice-candidate` — Relays ICE network candidates for peer connection traversal.
    - `call:reject` / `call:end` — Handles call termination and resets line status.

---

### 5. `db.js`
* **Purpose:** MongoDB Atlas connection manager using Mongoose.
* **Features:**
  - Resilient connection with automatic reconnect retries.
  - Handles legacy consent record migrations into the separate `consents` collection during startup.

---

### 6. `env.js`
* **Purpose:** Centralized, schema-validated environment variable loader.
* **Guarantees:** Halts execution early with descriptive error messages if critical variables (`MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_API_KEY`) are missing.

---

### 7. `upstash.js` & `arcjet.js`
* **Purpose:** High-performance rate limiting and security shield layers.
* **Upstash:** Connects to Upstash Redis for distributed, ultra-low-latency sliding window rate limiting.
* **Arcjet:** Connects to Arcjet shield protection for automated bot detection and fallback rate limiting.

---

### 8. `cloudinary.js`
* **Purpose:** Cloudinary SDK client configuration for secure media uploads and auto-purge deletion.

---

### 9. `resend.js`
* **Purpose:** Initializes the Resend API client for transactional email notifications.

---

### 10. `utils.js`
* **Purpose:** Utility helpers including `generateToken(userId, res)` which signs a JWT and attaches it to an httpOnly, SameSite=None, Secure cookie.

---

### 11. `ipUtils.js`
* **Purpose:** Reliable client IP address extraction and normalization across reverse proxies (Cloudflare `cf-connecting-ip`, Render `x-forwarded-for`).

---

### 12. `secretGenerator.js`
* **Purpose:** Generates cryptographically secure secrets with run-length checks to prevent character clustering.

---

## 🧪 Unit & Security Tests in `lib/`

* `accountDeletion.test.js` — Asserts that account deletion purges personal data while preserving GDPR consent records.
* `googleAuth.test.js` — Asserts Google OAuth token validation and mandatory consent enforcement.
* `ipUtils.test.js` — Validates IP extraction from Cloudflare headers, IPv6 normalization, and private IP detection.
* `secretGenerator.test.js` — Validates secret randomness, length, character set, and run-length guarantees.
