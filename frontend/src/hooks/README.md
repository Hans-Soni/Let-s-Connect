# Hooks Directory (`frontend/src/hooks`)

**Custom React hooks and stateful lifecycle utilities.**

---

## 🌟 Overview

The `frontend/src/hooks/` directory provides custom React hooks for reusable behavioral logic across components.

---

## 📂 Custom Hooks Architecture

1. **`useSamvaadTheme`** (in `WelcomePage.jsx`):
   - Synchronizes `useThemeStore`, `localStorage`, and the document `<html class="dark">` attribute.
   - Provides `{ dark, toggle }` helpers for consistent theme switching.

2. **`useReveal`** (in `WelcomePage.jsx`):
   - Initializes an `IntersectionObserver` across all elements carrying the `.reveal` CSS class.
   - Triggers smooth entrance animations (`.is-visible`) when sections scroll into the viewport.

3. **`useInstallPrompt`** (in `InstallAppBanner.jsx`):
   - Listens to the window `beforeinstallprompt` event.
   - Manages deferred native install prompts and captures `appinstalled` completion events.

4. **Inactivity & Gesture Hooks** (in `App.jsx`):
   - Monitors user interaction events (`mousedown`, `mousemove`, `keydown`, `touchstart`, `scroll`).
   - Automatically logs out unattended sessions after 15 minutes to prevent unauthorized access.
