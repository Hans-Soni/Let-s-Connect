<div align="center">

# 💬 Samवाद (Let's Connect)

**Private Real-Time Chat, HD Calling & Ephemeral Communication Platform**

[![Live Web Application](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://hans-soni.github.io/Let-s-Connect/)
[![Android APK Release](https://img.shields.io/badge/Android-APK%20v1.0.0-blue.svg)](https://github.com/Hans-Soni/Let-s-Connect/releases)
[![Security Suite](https://img.shields.io/badge/Security-27%2F27%20Passed-success.svg)](#)
[![Backend Tests](https://img.shields.io/badge/Tests-39%2F39%20Passed-success.svg)](#)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Capacitor](https://img.shields.io/badge/Mobile-Capacitor%208-119EFF.svg)](https://capacitorjs.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101.svg)](https://socket.io/)

</div>

---

## 🌟 Executive Overview

**Samवाद** is a private, zero-knowledge, real-time communication platform engineered for modern web, desktop, and mobile devices. Built on the principle of *uncluttered, dignified human dialogue*, Samवाद ensures personal identity (phone numbers and email addresses) is never exposed to other participants.

Conversations are secured with **AES-256-GCM authenticated encryption**, protected by **twice-daily automated server key rotation**, automatically purged after **24 hours of ephemeral retention**, and delivered with sub-millisecond latency via **WebSockets** and **peer-to-peer WebRTC**.

The application offers a **1-click installation experience** that installs as a borderless native app on Android, iOS, Windows, and macOS, alongside a compiled native **Android APK** powered by Capacitor.

---

## 🎯 Key Application Features

| Feature | Description |
| :--- | :--- |
| 📲 **1-Click App Installation** | PWA WebAPK and Capacitor native wrapper that installs to phone home screen or laptop desktop with zero address bars, custom splash screens, and native status bar coloring. |
| 🎙️ **WebRTC HD Voice & Video** | Crystal-clear peer-to-peer audio/video calls with instant screen sharing mid-call and stun/turn fallback. |
| 🔐 **AES-256-GCM Encryption** | Every message payload is encrypted at rest using AES-256-GCM with unique initialization vectors (IV) and 16-byte authentication tags to prevent tampering. |
| 🔄 **Twice-Daily Key Rotation** | Encryption keys automatically cycle at 00:00 and 12:00 IST using an active/historical KeySet collection in MongoDB. |
| ⏳ **24h Ephemeral Auto-Cleanup** | A background cron worker runs every minute, permanently purging chat text and destroying associated Cloudinary audio/video/image assets after 24 hours. |
| 🛡️ **Zero Identity Leakage** | Email addresses and phone numbers remain strictly confidential. Only your display name and professional designation (e.g. *Lead Designer*, *Software Architect*) are visible. |
| ⏱️ **Session Safety & Timers** | 15-minute unattended device inactivity auto-logout, paired with a 120-second session countdown timer during Google OAuth authentication. |
| 🌓 **Adaptive Luxury Theme** | High-contrast Dark Luxury and Light themes synchronized globally with system status bars and persistent local storage. |
| 🔍 **Quick Contact Search** | Instant modal search triggered with `Ctrl+K` / `Cmd+K` keyboard shortcuts. |

---

## 📂 Repository Architecture & Folder Map

This full-stack repository is organized into distinct, modular subsystems:

```
chat app/
├── .github/                      # GitHub automation workflows & CI/CD
│   └── workflows/                # Android APK build and continuous release pipelines
├── backend/                      # Node.js, Express, MongoDB & Socket.io server
│   ├── src/                      # Backend source code
│   │   ├── controllers/          # Request handlers (auth, messages, feedback)
│   │   ├── emails/               # Transactional email handlers & HTML templates
│   │   ├── lib/                  # Cryptography, socket server, DB & key rotation
│   │   ├── middleware/           # JWT verification, Arcjet & Upstash rate limiters
│   │   ├── models/               # Mongoose schemas (User, Message, Consent, Feedback)
│   │   ├── routes/               # Express REST endpoint declarations
│   │   └── server.js             # Server bootstrap, middleware chain & DNS setup
│   └── package.json              # Backend dependencies and test runners
├── frontend/                     # React 19 + Vite + Tailwind CSS frontend
│   ├── public/                   # Static assets, Web App Manifest, Service Worker & Sitemap
│   ├── src/                      # Frontend source code
│   │   ├── assets/               # Brand logos, gold/silver seal emblems & favicons
│   │   ├── components/           # UI components (CallModal, InstallAppBanner, PageLoader)
│   │   ├── hooks/                # Custom React lifecycle hooks
│   │   ├── lib/                  # Axios HTTP client, terms, and audio synthesizer
│   │   ├── pages/                # Routed views (WelcomePage, ChatPage, LoginPage, etc.)
│   │   └── store/                # Zustand state management stores
│   ├── android/                  # Native Android Capacitor wrapper project
│   ├── capacitor.config.json     # Capacitor mobile application configuration
│   ├── vite.config.js            # Vite build configuration with relative base (./)
│   └── package.json              # Frontend dependencies and mobile build scripts
└── scripts/                      # System administration, database & security test scripts
    ├── securityCheck.js          # 27-assertion security test suite
    └── sortUsersInDB.js          # Database index and record maintenance script
```

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS, DaisyUI, Lucide React, Zustand, React Router 7, Axios, React Hot Toast.
- **Mobile Engine:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/keyboard`).
- **Backend:** Node.js 20+, Express.js 4, Socket.io 4, Mongoose 8, MongoDB Atlas.
- **Security & Cryptography:** Node.js native `crypto` (AES-256-GCM), Helmet, Arcjet bot detection, Upstash Redis distributed rate limiting, xss-clean, express-mongo-sanitize, bcryptjs, jsonwebtoken.
- **Media & Infrastructure:** Cloudinary SDK (media storage & secure auto-destruction), Resend (transactional email alerts), GitHub Pages (frontend hosting), Render (backend web service hosting).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB instance (local or MongoDB Atlas connection URI)

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hans-Soni/Let-s-Connect.git
   cd "chat app"
   ```

2. **Install all dependencies:**
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

3. **Configure Environment Variables:**
   - Create `backend/.env` based on `backend/.env.example`.
   - Ensure `frontend/.env` contains your backend endpoint:
     ```env
     VITE_BACKEND_URL=https://let-s-connect-backend.onrender.com
     VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
     ```

4. **Run Frontend & Backend Simultaneously:**
   ```bash
   npm run dev
   ```

5. **Run the Full Test Suite:**
   ```bash
   npm test
   ```
   *(Executes the 27-assertion cryptographic security check followed by all 39 backend test suites).*

---

## 📱 Mobile App & Android APK

- **1-Click Web App:** Visit the live URL on Android or iPhone to install to your home screen with zero browser bars.
- **Android Studio Native Build:**
  ```bash
  npm run cap: open
  ```
  *(Launches Android Studio with pre-configured camera, microphone, and audio settings permissions).*
- **Sync Native Assets:**
  ```bash
  npm run cap: build
  ```

---

## 📄 License & Attribution

Developed with craftsmanship by **Hans Soni**. Distributed under the ISC License. All rights reserved.
