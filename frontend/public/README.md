# Public Assets Directory (`frontend/public`)

**Static assets, PWA configuration, SEO metadata, and media resources served directly at the root.**

---

## 🌟 Overview

Files placed in `frontend/public` are copied as-is into the root of the production `dist/` directory during Vite compilation. They bypass the JavaScript asset bundling pipeline and are directly accessible at the root URL (e.g., `https://hans-soni.github.io/Let-s-Connect/sitemap.xml`).

---

## 📂 File Directory & Complete Details

### 1. `manifest.webmanifest`
* **Purpose:** Web App Manifest defining the Progressive Web App (PWA) configuration.
* **Why it's here:** Required by Chrome, Edge, Safari, and Android to enable the native "Install App" / "Add to Home screen" behavior.
* **Key Configuration:**
  - `name`: "Samवाद — Private Real-Time Chat & HD Calling"
  - `short_name`: "Samवाद"
  - `display`: `"standalone"` — Removes browser address bars, navigation buttons, and tabs for a native app feel like WhatsApp or Instagram.
  - `icons`: Declares true square icons (`192x192` and `512x512`) with explicit `"purpose": "any"` and `"purpose": "maskable"`.

---

### 2. `sw.js`
* **Purpose:** Service Worker script for offline caching and PWA installation.
* **Why it's here:** Chromium browsers require an active Service Worker with a `fetch` handler to trigger the `beforeinstallprompt` event for 1-click home screen installation.
* **Behavior:**
  - Implements cache-first strategy for static assets (`index.html`, icons, manifest).
  - Automatically invalidates stale caches on new version activations via `clients.claim()`.
  - Passes through API endpoints (`/api/`) and WebSocket traffic directly to the network.

---

### 3. `sitemap.xml`
* **Purpose:** XML Sitemap compliant with sitemaps.org standards for Google Search Console and web crawlers.
* **Why it's here:** Allows search engines (Google, Bing) to discover, crawl, and index all primary landing sections, feature pages, and application routes.
* **URL:** `https://hans-soni.github.io/Let-s-Connect/sitemap.xml`

---

### 4. `robots.txt`
* **Purpose:** Robot Exclusion Protocol file for search engine web crawlers.
* **Why it's here:** Informs web spiders (Googlebot, Bingbot) that all public pages are indexable and directs them directly to `sitemap.xml`.
* **URL:** `https://hans-soni.github.io/Let-s-Connect/robots.txt`

---

### 5. App Icons (High-DPI Square PNGs)
* **`icon-192.png`** — Exactly 192 × 192 px square icon for mobile home screens and Windows taskbar shortcuts (`purpose: any`).
* **`icon-512.png`** — Exactly 512 × 512 px square icon for high-resolution splash screens and desktop installation dialogs (`purpose: any`).
* **`icon-maskable-192.png`** & **`icon-maskable-512.png`** — Adaptive square icons with safe-zone margins for Android circular/squircle launcher crops (`purpose: maskable`).
* **`apple-touch-icon.png`** — Exactly 180 × 180 px icon for iOS Safari "Add to Home Screen".
* **`favicon.png`** — Exactly 64 × 64 px browser tab icon.
* **`avatar.png`** — Default fallback placeholder avatar for users without a custom profile photo.

---

### 6. `sounds/` Subdirectory
* **Purpose:** Audio sound effects for the communication platform.
* **Contains:**
  - Message sent and received sound effects.
  - Incoming call ringtones.
  - Call disconnect and error sounds.

