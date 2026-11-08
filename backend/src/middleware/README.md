# Middleware Directory (`backend/src/middleware`)

**Express and Socket.io request interceptors, authorization guards, and rate limiters.**

---

## 🌟 Overview

Middleware functions in this directory intercept incoming HTTP requests and WebSocket handshakes before they reach application controllers. They enforce authentication, inspect tokens, throttle malicious traffic, and sanitize input.

---

## 📂 File Directory & Complete Details

### 1. `auth.middleware.js`
* **Purpose:** Route protection guard for private Express REST API endpoints.
* **Why it's here:** Ensures that unauthenticated requests cannot access conversation histories, user profiles, or messaging routes.
* **Execution Flow:**
  1. Checks for a signed JWT token in `req.cookies.jwt` or `req.headers.authorization` (Bearer token).
  2. If missing, immediately returns HTTP `401 Unauthorized`.
  3. Verifies token signature against `ENV.JWT_SECRET`.
  4. Fetches the authenticated user record from MongoDB, excluding the password hash (`.select("-password")`).
  5. Attaches the user object to `req.user` and calls `next()`.

---

### 2. `socket.auth.middleware.js`
* **Purpose:** Authentication guard for WebSocket connections.
* **Why it's here:** Prevents unauthorized socket connections from intercepting real-time messages, typing indicators, or WebRTC calls.
* **Execution Flow:**
  1. Intercepts the initial Socket.io connection handshake.
  2. Extracts the JWT token from handshake cookies or `handshake.auth.token`.
  3. Decodes and verifies the token.
  4. Binds `socket.userId` to the verified user's ID, or rejects the handshake with `Authentication error`.

---

### 3. `rateLimit.middleware.js`
* **Purpose:** Distributed, multi-tier rate limiting protecting API endpoints from abuse, credential stuffing, and DDoS attacks.
* **Why it's here:** Guarantees server availability and protects database resources.
* **Architecture:**
  - **Tier 1 (Upstash Redis):** Fast in-memory token bucket rate limiting. Allows up to 60 requests per minute per IP.
  - **Tier 2 (Arcjet Fallback):** If Redis is unavailable or rate exceeded, seamlessly falls back to Arcjet's sliding window rate limiter.
  - Returns HTTP `429 Too Many Requests` when limits are breached.

---

### 4. `arcjet.middleware.js`
* **Purpose:** Arcjet security shield integration for bot detection, email validation, and request shielding.

---

### 5. `rateLimit.middleware.test.js`
* **Purpose:** Comprehensive test suite for rate limiting behavior.
* **Tests:**
  - Verifies normal traffic passes through Redis.
  - Verifies fallback to Arcjet upon Redis limit exhaustion or error.
  - Verifies HTTP 429 response formatting.
