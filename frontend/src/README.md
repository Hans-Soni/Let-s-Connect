# Frontend Source Directory (`frontend/src`)

**The primary React 19 source tree for the Samवाद client application.**

---

## 🌟 Overview

The `frontend/src` directory contains the complete React 19 application. It manages client-side routing, WebSockets, WebRTC calling, Zustand state management, authenticated API communication, and the adaptive dark/light luxury theme system.

---

## 📂 Subdirectories in `src/`

* **[`assets/`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/assets/README.md)** — Brand assets: dark/light logos and royal gold/silver seal emblems.
* **[`components/`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/components/README.md)** — Reusable UI components: `CallModal.jsx`, `InstallAppBanner.jsx`, `PageLoader.jsx`, `GlobalThemeToggle.jsx`, `TermsContent.jsx`.
* **[`hooks/`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/hooks/README.md)** — Custom React hooks for media queries and browser events.
* **[`lib/`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/lib/README.md)** — Utilities: Axios HTTP client (`axios.js`), Web Audio API call synthesizer (`callSounds.js`), and terms versions (`terms.js`).
* **[`pages/`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/pages/README.md)** — Routed view components: `WelcomePage.jsx`, `ChatPage.jsx`, `LoginPage.jsx`, `SignUpPage.jsx`, `UserProfilePage.jsx`, `NotFoundPage.jsx`.
* **[`store/`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/store/README.md)** — Zustand global state stores: `useAuthStore`, `useChatStore`, `useCallStore`, `useThemeStore`.

---

## 📄 Key Root Files

### 1. `main.jsx`
* **Role:** Application bootstrap and DOM mounting.
* **Responsibilities:**
  - Mounts React 19 root into `#root` element with `<StrictMode>`.
  - Wraps the application in `<GoogleOAuthProvider>` configured with Google Client ID from `.env`.
  - Initializes `<HashRouter>` to guarantee client-side route resolution on GitHub Pages and Android WebViews without server URL rewriting.
  - Registers the PWA Service Worker (`sw.js`) upon window load in production.

---

### 2. `App.jsx`
* **Role:** Root application orchestrator and global layout manager.
* **Responsibilities:**
  - **Authentication Check:** Triggers `checkAuth()` on mount to rehydrate session from JWT.
  - **Inactivity Auto-Logout:** Listens to user interactions (`mousedown`, `keydown`, `touchstart`, `scroll`). Automatically logs out unattended users after 15 minutes of inactivity to protect privacy.
  - **Theme Synchronization:** Binds `useThemeStore` to `<html class="dark">`, `data-theme`, `localStorage`, and native Capacitor status bar colors (`#0f172a` in dark mode, `#f8fafc` in light mode).
  - **Android Hardware Back Button:** Uses `@capacitor/app` to intercept the native Android hardware back button: closes open dialogs/modals first, navigates backward in history, or exits at the root screen.
  - **Route Code-Splitting:** Lazily loads page components (`lazy()`) with `<Suspense>` and `<PageLoader />` for instant initial page loads.
  - **Global Modals:** Mounts `<CallModal />`, `<InstallAppBanner />`, and `<Toaster />`.

---

### 3. Stylesheets
* **`index.css`** — Core Tailwind CSS directives, DaisyUI setup, mobile notch/gesture safe-area insets (`--sat`, `--sab`), `-webkit-tap-highlight-color: transparent`, and `overscroll-behavior-y: none`.
* **`welcome.css`** — Tailwind CSS v4 design system for the Welcome landing page: glassmorphism, glowing gradients, animations (`animate-float`, `animate-pop`, `animate-bloom`, `text-shine`).
* **`auth.css`** — Specialized styles for authentication forms, Google OAuth countdown timers, and input focus rings.
