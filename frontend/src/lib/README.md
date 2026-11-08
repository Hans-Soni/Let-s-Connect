# Libraries Directory (`frontend/src/lib`)

**Client-side networking, audio synthesis, IP detection, and policy constants.**

---

## 🌟 Overview

The `frontend/src/lib/` directory contains client-side helper libraries, the configured Axios HTTP instance, the Web Audio API synthesizer for phone ringtones, and terms version constants.

---

## 📂 File Directory & Complete Details

### 1. `axios.js`
* **Purpose:** The central Axios HTTP client for all REST communication with the backend.
* **Why it's here:** Centralizes base URL configuration, request authorization, and token refreshing.
* **Key Features:**
  - `baseURL`: Automatically selects the backend endpoint:
    - In Capacitor native mobile apps and production web, uses `https://let-s-connect-backend.onrender.com/api`.
    - In local development mode, uses `http://localhost:5002/api`.
  - `withCredentials: true`: Automatically passes the signed `jwt` httpOnly cookie on every request.
  - **Request Interceptor:** Automatically extracts any token stored in `sessionStorage` or `localStorage` and injects it into `config.headers.Authorization = "Bearer <token>"`.
  - **Response Interceptor (Silent 401 Refresh):**
    - Intercepts HTTP 401 Unauthorized responses.
    - Queues in-flight requests and calls `/auth/refresh` using the httpOnly cookie.
    - If refresh succeeds, updates the bearer token and replays the original requests transparently without logging the user out.

---

### 2. `callSounds.js`
* **Purpose:** Real-time audio synthesizer for phone calling sound effects.
* **Why it's here:** Generates authentic telephone ringtones and call tones using the browser's native **Web Audio API** (`AudioContext`), requiring zero external audio files.
* **Key Exports:**
  - `playRingSound()` — Starts continuous UK/international standard double-ring tone during outgoing calls.
  - `playIncomingSound()` — Starts upbeat melodic incoming call chime.
  - `playEndCallSound()` — Plays quick descending tone when a call terminates.
  - `stopAllCallSounds()` — Instantly halts all active audio oscillators.

---

### 3. `detectClientIp.js`
* **Purpose:** Fallback utility for detecting client IP address on the frontend.
* **Why it's here:** Provides client metadata during feedback submission or diagnostics.

---

### 4. `terms.js`
* **Purpose:** Version constants and legal text for Samवाद Terms of Service and Privacy Policy.
* **Key Exports:**
  - `CURRENT_TERMS_VERSION`: Current legal version string (e.g. `"2026.1"`).
  - `TERMS_LAST_UPDATED`: Date string of last policy revision.
  - Policy descriptions for AES-256-GCM encryption and 24-hour ephemeral auto-purge.
