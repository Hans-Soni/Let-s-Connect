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
- **Cloudinary:** Cloud storage service for handling profile pictures and image messages.
- **Top-Tier Security Stack:**
  - `helmet`: Sets secure HTTP headers.
  - `cors`: Protects API from unauthorized cross-origin requests.
  - `express-mongo-sanitize`: Prevents NoSQL injection attacks.
  - `xss-clean`: Sanitizes user input to prevent Cross-Site Scripting.
  - `express-rate-limit` & `@arcjet/node`: Protects against brute-force and DDoS attacks.

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
   - Create a `.env` file based on `.env.example` (if provided) and fill in your MongoDB URI, JWT secret, and Cloudinary credentials.
4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *(This uses `nodemon` to automatically restart the server when you make code changes).*
