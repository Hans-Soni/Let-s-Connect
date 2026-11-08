# Samvād Frontend Pages (`frontend/src/pages`)

The `frontend/src/pages` directory houses all route-level page components for the **Samvād (Samवाद)** web application. Each component represents a distinct screen within the client application, mapped to routes configured in [`App.jsx`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/App.jsx) via React Router (`HashRouter`).

---

## Architecture & Directory Layout

```
frontend/src/pages/
├── ChatPage.jsx          # Main authenticated chat hub & WebRTC workspace
├── LoginPage.jsx         # Sign-in page with 120s Google OAuth watchdog
├── SignUpPage.jsx        # Registration page with 120s Google OAuth watchdog
├── UserProfilePage.jsx   # Profile management, avatar upload & privacy controls
├── WelcomePage.jsx       # Public landing page, FAQ accordion, features & PWA install
├── NotFoundPage.jsx      # Styled 404 fallback page with recovery actions
└── README.md             # This architecture and documentation file
```

---

## Detailed File-by-File Breakdown

### 1. `WelcomePage.jsx`
* **Purpose**: Serves as the high-converting, public landing page for new visitors and prospective users. Introduces Samvād's core philosophy (privacy, ephemeral messaging, WebRTC peer-to-peer communication) and provides one-click onboarding.
* **Key Features**:
  * **Hero Section**: Catchy headlines with brand gradient typography, dynamic CTA buttons (*"Get Started"*, *"Login"*, *"Live Chat"*).
  * **PWA & Native APK Prompts**: Detects device capabilities (`beforeinstallprompt` event) and surfaces an instant one-click PWA home screen installation pill, as well as direct GitHub Release APK download links.
  * **Interactive Feature Showcase**: Highlights end-to-end security, zero data retention, real-time WebRTC audio/video calls, and rich media sharing.
  * **Interactive FAQ Accordion**: Expandable questions and answers addressing user privacy, browser permissions, mobile installation, and ephemeral lifespans. Carefully animated to ensure questions expand seamlessly without collapsing unexpectedly.
  * **Social Proof & Testimonials**: User reviews demonstrating the utility of ephemeral messaging and seamless calling.
  * **Footer & Legal Navigation**: Direct links to Privacy, Terms, and GitHub source code repository.

---

### 2. `ChatPage.jsx`
* **Purpose**: The central workspace and real-time messaging hub of Samvād. Coordinates contacts, conversations, chat history, live message composition, voice recordings, attachments, and WebRTC calling.
* **Key Features**:
  * **Split-Pane Layout**: Responsive dual-column design featuring a searchable contacts sidebar on the left and the active conversation view on the right (with auto-collapsing drawer on mobile screens).
  * **Real-Time Online Presence**: Live Socket.io subscriptions displaying green online badges and last-seen statuses for all mutual contacts.
  * **Conversation Search**: Instant client-side filtering across contact names and recent message previews.
  * **Message Thread & Delivery Receipts**: Chronological message stream with auto-scroll-to-bottom, timestamp headers, and WhatsApp-style status checkmarks:
    * Single check: Sent to server.
    * Double check: Delivered to recipient.
    * Blue double check: Seen / read by recipient.
  * **Ephemeral Expiration Badges**: Displays visual countdown badges on messages scheduled for self-destruction.
  * **Rich Media Lightbox**: High-resolution image preview modal with zoom, pan, and download capabilities for shared photos.
  * **Voice Note Recorder**: Integrated Web Audio API voice recorder allowing users to record, pause, playback, and transmit crystal-clear voice notes directly into the conversation.
  * **Emoji & Attachment Pickers**: Native emoji selector and image file picker with instant client-side thumbnail previews.
  * **WebRTC Calling Bridge**: Dedicated header action buttons initiating 1-on-1 audio and video calls, seamlessly mounting the call modal overlay powered by `useCallStore`.

---

### 3. `LoginPage.jsx`
* **Purpose**: Provides secure user authentication for returning members, verifying credentials against the backend API and establishing JWT session tokens.
* **Key Features**:
  * **Email & Password Authentication**: Controlled form inputs with client-side syntax validation and password visibility toggle.
  * **Google OAuth 2.0 Integration**: Direct Google Sign-In button that launches the Google authentication flow.
  * **120-Second Watchdog Timer**: Implements a dedicated 2-minute safety watchdog timer for Google authentication. If an external OAuth popup or redirect stalls or is abandoned, the timer triggers an automatic clean refresh/reset to prevent the application from hanging in an indeterminate loading state.
  * **Auto-Redirect Logic**: Seamlessly redirects authenticated users to `/` (Chat Hub) upon successful token acquisition.
  * **Navigation Links**: Quick links to the registration page (`/signup`) for new users.

---

### 4. `SignUpPage.jsx`
* **Purpose**: User onboarding and registration interface for creating new Samvād accounts.
* **Key Features**:
  * **Comprehensive Registration Form**: Fields for Full Name, Email Address, Password, and Password Confirmation.
  * **Client-Side Validation**: Enforces strong password rules (minimum 6 characters, mixed case, numbers) with visual validation cues before submitting.
  * **Avatar Upload**: Allows new users to select and preview a custom profile image during sign-up, securely uploaded to Cloudinary via the backend.
  * **120-Second Google OAuth Watchdog**: Mirrors the 2-minute watchdog mechanism from `LoginPage.jsx` to ensure reliable fallback during social sign-up.
  * **Instant Session Transition**: Automatically logs the user in upon successful registration and navigates directly to the chat environment.

---

### 5. `UserProfilePage.jsx`
* **Purpose**: Self-service profile management, security settings, and user privacy configurations.
* **Key Features**:
  * **Profile Information Management**: Edit display name, bio, and contact information.
  * **Avatar Management**: Upload new profile photos with real-time preview, compression, and Cloudinary synchronization.
  * **Account Metadata**: Displays account registration date, last login timestamp, and unique user identifier.
  * **Security & Privacy Controls**:
    * Configure default ephemeral message expiration times.
    * Manage audio/video calling permissions and microphone/camera device preferences.
    * Session termination and logout action.

---

### 6. `NotFoundPage.jsx`
* **Purpose**: Elegant 404 error page displayed when users navigate to non-existent or expired routes.
* **Key Features**:
  * **Branded Visuals**: Consistent with Samvād's dark/light modern aesthetic.
  * **Actionable Navigation**: Provides one-click buttons to *"Return to Chat"*, *"Go to Home/Welcome"*, or *"Go Back"*.
  * **Safe Hash-Routing Handling**: Detects malformed URL fragments and guides users back to safe canonical paths.

---

## State & Hook Integration Matrix

| Page Component | Primary Zustand Store(s) | Key Custom Hooks | Real-Time Events |
| :--- | :--- | :--- | :--- |
| `WelcomePage.jsx` | `useThemeStore`, `useAuthStore` | N/A | PWA `beforeinstallprompt` |
| `ChatPage.jsx` | `useChatStore`, `useAuthStore`, `useCallStore` | `useSound` | `newMessage`, `messageDelivered`, `messageSeen`, `userOnline`, `call:incoming` |
| `LoginPage.jsx` | `useAuthStore` | `useGoogleAuthTimer` | OAuth redirect / callback |
| `SignUpPage.jsx` | `useAuthStore` | `useGoogleAuthTimer` | OAuth redirect / callback |
| `UserProfilePage.jsx`| `useAuthStore`, `useThemeStore` | N/A | Avatar update sync |
| `NotFoundPage.jsx`| `useThemeStore` | N/A | N/A |
