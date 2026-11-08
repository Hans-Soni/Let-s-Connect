# Models Directory (`backend/src/models`)

**Mongoose schemas and MongoDB document definitions for Samवाद.**

---

## 🌟 Overview

This directory defines the data models and database schemas used by Mongoose to interact with MongoDB Atlas. Every schema enforces strict data validation, field sanitization, indexing strategies, and privacy guarantees.

---

## 📂 File Directory & Complete Details

### 1. `User.js`
* **Collection:** `users`
* **Purpose:** Stores registered user accounts, authentication credentials, and user preferences.
* **Fields:**
  - `email`: `String` (Required, unique, trimmed, lowercase). Indexed with collation `{ locale: "en", strength: 2 }` for case-insensitive lookup.
  - `fullName`: `String` (Required, trimmed).
  - `designation`: `String` (Required). Professional title (e.g., *Lead Designer*, *Software Architect*) displayed to other users instead of private contact info.
  - `password`: `String` (Required, min 6 characters). Bcrypt hash.
  - `profilePic`: `String` (Default `""`). Cloudinary secure URL for user avatar.
  - `blockedUsers`: `[ObjectId]` (References `User`). Array of user IDs blocked by this account. Never exposed in API responses.
  - `createdAt`, `updatedAt`: Automatic timestamps.

---

### 2. `Message.js`
* **Collection:** `messages`
* **Purpose:** Stores encrypted chat messages and media metadata subject to 24-hour auto-purge.
* **Fields:**
  - `senderId`: `ObjectId` (Required, references `User`).
  - `receiverId`: `ObjectId` (Required, references `User`).
  - `text`: `String` (Encrypted string format `enc:iv:authTag:ciphertext`).
  - `image`: `String`. Cloudinary URL for image attachments.
  - `imagePublicId`: `String`. Cloudinary public ID for programmatic destruction during cleanup.
  - `audio`: `String`. Cloudinary URL for voice notes.
  - `audioPublicId`: `String`. Cloudinary public ID for audio destruction.
  - `audioDuration`: `Number`. Duration in seconds for waveform player.
  - `video`: `String`. Cloudinary URL for video clips.
  - `videoPublicId`: `String`. Cloudinary public ID for video destruction.
  - `createdAt`, `updatedAt`: Timestamps used by `messageRetention.js` to determine message expiration (24h).

---

### 3. `Consent.js`
* **Collection:** `consents`
* **Purpose:** Digital privacy consent audit trail for GDPR and personal data protection compliance.
* **Why separated from `User`:** Ensures that when a user requests irreversible account deletion, their personal data is wiped while the compliance audit trail is preserved anonymously.
* **Fields:**
  - `userId`: `ObjectId` (Required, references `User`).
  - `email`: `String` (Required).
  - `accepted`: `Boolean` (Required, default `true`).
  - `termsVersion`: `String` (e.g., `"2026.1"`).
  - `acceptedAt`: `Date` (Default `Date.now`).
  - `ip`: `String`. Client IP address at time of registration.

---

### 4. `Feedback.js`
* **Collection:** `feedbacks`
* **Purpose:** Stores user feedback, experience ratings, and bug reports.
* **Fields:**
  - `userId`: `ObjectId` (Optional, references `User` if logged in).
  - `rating`: `Number` (Required, 1 to 5).
  - `message`: `String` (Required, max 2000 chars).
  - `category`: `String` (e.g., `bug`, `feature`, `calling`, `ui`, `general`).
  - `clientIp`: `String`.
  - `userAgent`: `String`.
  - `createdAt`: Automatic timestamp.
