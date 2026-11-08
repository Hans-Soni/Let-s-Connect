# Controllers Directory (`backend/src/controllers`)

**Business logic and HTTP request handlers for Samवाद.**

---

## 🌟 Overview

Controllers in this directory receive validated requests from Express route handlers, execute the necessary business logic, interface with Mongoose database models and external APIs (Cloudinary, Resend), and return structured JSON responses.

---

## 📂 File Directory & Breakdown

### 1. `auth.controller.js`
* **Purpose:** Manages the entire user lifecycle, authentication tokens, privacy consent, profile changes, and account deletion.
* **Why it's here:** Centralizes all identity verification, cryptographic hashing, and session management.
* **Key Functions:**
  - `signup(req, res)`:
    - Validates email, full name, password (minimum 6 chars), and professional designation.
    - Hashes password using `bcryptjs` with salt rounds.
    - Saves user record to MongoDB.
    - Generates separate `Consent` audit document in the `consents` collection, storing timestamp, version, and IP address for GDPR compliance.
    - Sets secure httpOnly `jwt` cookie and issues bearer token.
    - Triggers asynchronous welcome email via `sendWelcomeEmail`.
  - `login(req, res)`:
    - Verifies user email and compares password hash.
    - Issues new JWT token in signed httpOnly cookie and returns profile details.
  - `googleAuth(req, res)`:
    - Handles Google OAuth 2.0 token credential from Google Sign-In button.
    - Verifies Google token against Google's tokeninfo API.
    - Creates user account automatically if not registered, or signs into existing account.
  - `logout(req, res)`:
    - Clears the httpOnly `jwt` cookie and responds with success message.
  - `refreshToken(req, res)`:
    - Performs silent token renewal when access token expires.
    - Reads the httpOnly cookie and issues a fresh 15-minute token so the user experiences zero session dropouts.
  - `checkAuth(req, res)`:
    - Validates active session and returns authenticated user data.
  - `updateProfile(req, res)`:
    - Receives base64 image data and uploads it to Cloudinary.
    - Updates user `profilePic` URL in MongoDB.
  - `deleteAccount(req, res)`:
    - Executes 2-step verification requiring user password.
    - Permanently deletes user profile, contacts, and personal data from MongoDB.
    - Anonymizes consent records to preserve regulatory audit compliance while stripping personal information.

---

### 2. `message.controller.js`
* **Purpose:** Handles encrypted messaging, chat history retrieval, attachment uploads, and contact filtering.
* **Why it's here:** Enforces zero-knowledge message encryption and blocks unauthorized access to conversation histories.
* **Key Functions:**
  - `getUsersForSidebar(req, res)`:
    - Fetches all registered users for the active chat sidebar.
    - Filters out the logged-in user.
    - Evaluates blocking rules: if user A is blocked by user B, user B's profile picture is masked to default (`''`).
    - Strips private `blockedUsers` arrays from responses to protect user privacy.
  - `getMessages(req, res)`:
    - Fetches conversation messages between the logged-in user and the selected contact.
    - Sanitizes contact ObjectId to prevent query injection.
    - Decrypts each message payload using `decryptMessage` (AES-256-GCM) with current and historical keys.
  - `sendMessage(req, res)`:
    - Checks whether either participant has blocked the other; aborts if blocked.
    - Handles media attachments: uploads images, audio voice notes, or video clips to Cloudinary.
    - Encrypts the message body via `encryptMessage` (AES-256-GCM) with active encryption key.
    - Saves encrypted `Message` record to MongoDB with automatic 24-hour expiration TTL.
    - Broadcasts the decrypted message to the recipient's live socket via `io.to(receiverSocketId).emit("newMessage", ...)`.

---

### 3. `feedback.controller.js`
* **Purpose:** Handles user feedback submissions and bug reports.
* **Why it's here:** Allows users to submit ratings, category tags, and descriptive feedback directly from the Welcome Page and Chat Page.
* **Key Functions:**
  - `submitFeedback(req, res)`:
    - Validates rating (1–5 stars) and message content.
    - Extracts client IP address and user agent for context.
    - Saves record to MongoDB `Feedback` collection.
