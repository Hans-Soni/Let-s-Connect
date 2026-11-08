# Components Directory (`frontend/src/components`)

**Reusable UI components, real-time overlays, and interactive dialogs.**

---

## 🌟 Overview

Components in this directory encapsulate presentation, state, and interaction patterns used across multiple views of Samवाद. Every component is designed to be fully responsive across mobile phones, tablets, and desktop displays.

---

## 📂 File Directory & Complete Details

### 1. `InstallAppBanner.jsx`
* **Purpose:** The 1-click Progressive Web App (PWA) installation system.
* **Why it's here:** Gives users on mobile phones (Android, iPhone) and laptops (Windows, macOS) an effortless way to install Samवाद onto their home screen or desktop with no browser URL bar.
* **Exports:**
  - `default (InstallAppBanner)` — Luxury glassmorphic install card with Samवाद emblem, 4.9 rating badge, feature checklist, and "Install to Home Screen" button.
    - If dismissed, minimizes into a docked floating pill in the bottom corner with an animated ping ring.
    - Includes `showGuideModal` with step-by-step 2-tap instructions for Chrome/Edge (⋮ ➔ *Install app*).
    - Includes `showIOSModal` with visual iPhone Safari guidance (Share 📤 ➔ *Add to Home Screen* ➕).
    - Includes `showApkModal` providing direct options for 1-click install, GitHub Releases, and GitHub Actions build artifacts.
  - `InstallAppButton` — Inline reusable 1-click install button embedded into headers, navbars, hero sections, and the chat sidebar.
  - `isStandaloneApp()` — Utility function detecting if the application is currently running as an installed PWA or native app.

---

### 2. `CallModal.jsx`
* **Purpose:** WebRTC real-time voice, video, and screen-sharing calling overlay.
* **Why it's here:** Mounts globally in `App.jsx` and activates whenever an incoming or outgoing call is established via `useCallStore`.
* **Features:**
  - Displays local camera preview and remote video feed with picture-in-picture layout.
  - Live call duration timer (`MM:SS`).
  - Mute/unmute microphone button.
  - Video toggle (switch between camera, avatar placeholder, or screen share).
  - Screen sharing toggle using `navigator.mediaDevices.getDisplayMedia()`.
  - Audio output selection and end call button.
  - Synthesizes ringtones and hangup tones via `callSounds.js`.

---

### 3. `PageLoader.jsx`
* **Purpose:** Full-screen luxury loading indicator.
* **Why it's here:** Displayed during initial session check (`isCheckingAuth`) and as the `<Suspense>` fallback while React dynamically loads code-split page chunks (`lazy()`).

---

### 4. `TermsContent.jsx`
* **Purpose:** Standardized Privacy Policy and Terms of Service document.
* **Why it's here:** Shared across user registration, login consent modals, and the Profile & Settings security tab. Documents the 24-hour ephemeral auto-purge policy and AES-256-GCM encryption guarantees.

---

### 5. `GlobalThemeToggle.jsx`
* **Purpose:** High-contrast animated Sun/Moon toggle button.
* **Why it's here:** Switches between Dark Luxury and Light modes, persisting state in `useThemeStore` and `localStorage`.

---

### 6. `BorderAnimatedContainer.jsx`
* **Purpose:** Stylized visual card container with a smooth rotating gradient border.
* **Why it's here:** Adds visual depth and luxury polish to authentication forms and profile modals.

---

### 7. `NotificationToast.jsx`
* **Purpose:** Custom interactive notification toast with contact avatar, name, and message preview.
* **Why it's here:** Displays non-intrusive message notifications when chatting or receiving calls.

---

### 8. `DeveloperFooter.jsx`
* **Purpose:** Developer signature footer presenting attribution, GitHub repository links, and technology credits.
