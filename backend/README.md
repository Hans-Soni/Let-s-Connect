<div align="center">
  
# ⚙️ Let's Connect - Backend

**The secure, scalable, and real-time Node.js engine powering Let's Connect.**

[![Node.js](https://img.shields.io/badge/Runtime-Node.js-success)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express.js-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-green)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-black)](https://socket.io/)
[![Security](https://img.shields.io/badge/Security-Helmet%20%7C%20Arcjet%20%7C%20JWT-red)](#)

</div>

---

## 🌟 Overview
This directory contains the **backend** architecture for Let's Connect. Built on Node.js and Express, it provides secure RESTful API endpoints for user management and authentication, while heavily utilizing Socket.io for bi-directional, real-time messaging.

Security and performance are a massive priority here. The backend employs strict rate limiting, XSS protection, NoSQL injection sanitization, and robust password hashing to keep user data completely safe.

---

## 📂 Folder Structure

- **`src/`** - The core source code for the server.
  - **`controllers/`** - Contains the core business logic (e.g., handling what happens when a user logs in, sends a message, or updates their profile).
  - **`models/`** - Mongoose schemas defining the structure of our MongoDB database collections (Users, Messages, etc.).
  - **`routes/`** - Express route definitions mapping HTTP endpoints (like `/api/auth/login`) to their respective controllers.
  - **`middleware/`** - Functions that run before controllers (e.g., verifying JWT tokens, checking arcjet rules, handling file uploads).
  - **`config/`** - Database connection setups, environment variable loaders, and third-party configuration logic.
  - **`utils/`** - Helper functions like JWT token generators and custom error handlers.
  - **`server.js`** - The main entry point of the backend application that initializes Express and Socket.io.

- **`.env`** - Environment variables (e.g., MongoDB URI, JWT Secrets, Cloudinary keys). *Not committed to version control.*

---

## 🛠️ Key Technologies & Security

- **Express & Node.js:** The backbone HTTP server.
- **MongoDB & Mongoose:** NoSQL database storage and object data modeling.
- **Socket.io:** Handles all real-time messaging, typing indicators, and online status events.
- **Authentication:** JWT (JSON Web Tokens) stored securely in HTTP-only cookies, combined with `bcryptjs` for password hashing.
- **Cloudinary:** Cloud storage service for handling profile pictures, image messages, voice notes, and video messages.
- **Message retention:** Chat text and attached image/audio/video assets are removed after 24 hours. The backend first deletes associated Cloudinary assets, then removes the MongoDB message; failed Cloudinary deletions are logged and retried.
- **Top-Tier Security Stack:**
  - `helmet`: Sets secure HTTP headers.
  - `cors`: Protects API from unauthorized cross-origin requests.
  - `express-mongo-sanitize`: Prevents NoSQL injection attacks.
  - `xss-clean`: Sanitizes user input to prevent Cross-Site Scripting.
  - Upstash Redis is the primary shared API rate limiter (100 requests per IP per 15 minutes). If it denies a request or is unavailable, Arcjet's rate limiter is used as the fallback. Arcjet shield and bot checks remain enabled on protected routes. Requests denied by both providers receive HTTP 429; if both providers are unavailable, the API returns HTTP 503.

Arcjet is used for request security decisions, not as the message/media store. This app has no API to purge Arcjet provider-side security telemetry or control MongoDB/Cloudinary backups; manage provider telemetry and backup retention in their respective dashboards.

---

## 🚀 Development Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   - Create a `.env` file based on `.env.example` and fill in your MongoDB URI, JWT secret, Cloudinary credentials, Arcjet key, and `UPSTASH_REDIS_URL`.
   - Set `UPSTASH_REDIS_URL` to your Upstash Redis connection URL. Keep the credential private, configure it in your deployment provider's secret/environment settings, and rotate it if it has been exposed.
4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *(This uses `nodemon` to automatically restart the server when you make code changes).*
