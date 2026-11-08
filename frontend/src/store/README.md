# Samvād State Management Stores (`frontend/src/store`)

The `frontend/src/store` directory contains the centralized client-side state management layer for **Samvād (Samवाद)**, built with [Zustand](https://github.com/pmndrs/zustand). Zustand was chosen for its minimalist footprint, zero-boilerplate ergonomics, high performance without unnecessary re-renders, and effortless integration with asynchronous operations (WebSockets, REST APIs, and WebRTC peer connections).

---

## Directory Layout

```
frontend/src/store/
├── useAuthStore.js    # Authentication, user session, and Socket.io lifecycle
├── useCallStore.js    # WebRTC peer connections, audio/video streaming & signaling
├── useChatStore.js    # Messaging, conversation history, receipts & ephemeral timers
├── useThemeStore.js   # UI themes & persistent localStorage synchronization
└── README.md          # This architecture and documentation file
```

---

## Detailed File-by-File Breakdown

### 1. `useAuthStore.js`
* **Purpose**: Manages authentication lifecycles, user identity state, authorization tokens, profile updates, and real-time Socket.io socket initialization.
* **State Variables**:
  * `authUser`: The currently authenticated user object (`_id`, `fullName`, `email`, `profilePic`, `createdAt`), or `null` if unauthenticated.
  * `isCheckingAuth`: Boolean flag indicating whether initial token verification (`/api/auth/check`) is in progress.
  * `isSigningUp`: Loading flag for registration API requests.
  * `isLoggingIn`: Loading flag for credential verification API requests.
  * `isUpdatingProfile`: Loading flag for profile/avatar updates.
  * `onlineUsers`: Array of user IDs currently connected to the server via Socket.io.
  * `socket`: The active Socket.io client instance.
* **Core Actions**:
  * `checkAuth()`: Hits `/api/auth/check` on application mount to validate session cookies. Automatically triggers `connectSocket()` if a valid session is returned.
  * `signup(formData)`: Dispatches new user registration to `/api/auth/signup`, sets `authUser`, and connects the WebSocket.
  * `login(credentials)`: Dispatches login credentials to `/api/auth/login`, persists the session, and initializes the socket.
  * `logout()`: Terminates backend session via `/api/auth/logout`, disconnects the socket, and clears client state.
  * `updateProfile(data)`: Transmits profile changes (including Base64 avatar uploads) to `/api/auth/update-profile`.
  * `connectSocket()`: Instantiates the Socket.io client targeting the backend server, registers user identity query parameters, and binds listeners for `getOnlineUsers`.
  * `disconnectSocket()`: Gracefully tears down the socket connection on logout or page unload.

---

### 2. `useCallStore.js`
* **Purpose**: Orchestrates end-to-end WebRTC peer-to-peer audio and video calling between Samvād users, handling signaling via Socket.io, STUN/TURN ICE candidate negotiations, and local/remote media stream management.
* **Architecture & ICE Configuration**:
  * Employs multi-tiered STUN and TURN fallback servers (Google STUN, Cloudflare STUN, and Metered Canada TURN servers over UDP and TCP ports 80 and 443) to guarantee NAT traversal even across strict corporate firewalls and mobile carrier networks.
  * Maintains candidate queues (`pendingCandidates`) to reliably stage ICE candidates received before the remote session description (`setRemoteDescription`) has resolved.
* **State Variables**:
  * `callState`: Current call status enum (`"idle"`, `"calling"`, `"incoming"`, `"connected"`, `"ended"`).
  * `callType`: Type of active call (`"audio"` or `"video"`).
  * `partnerUser`: The contact object with whom the call is being conducted.
  * `localStream`: The local user's `MediaStream` containing mic and camera tracks.
  * `remoteStream`: The peer's `MediaStream` received over the WebRTC data channel.
  * `isMuted`: Boolean toggle indicating whether the local microphone track is muted.
  * `isVideoOff`: Boolean toggle indicating whether the local camera track is disabled.
  * `callDuration`: Elapsed call duration in seconds.
* **Core Actions**:
  * `startCall(targetUser, type)`: Requests `navigator.mediaDevices.getUserMedia`, creates an `RTCPeerConnection`, adds local tracks, creates an SDP offer, plays the outgoing ringtone, and emits `call:initiate` over Socket.io.
  * `handleIncomingCall(offerData)`: Triggered by socket event `call:incoming`. Prepares local state, displays the incoming call modal, and plays the incoming ringtone.
  * `acceptCall()`: Acquires local media stream, instantiates peer connection, sets remote description from offer SDP, creates and sends SDP answer via `call:accept`, flushes pending ICE candidates, and starts the call timer.
  * `rejectCall()`: Rejects incoming call, stops ringtone, and emits `call:rejected` to notifying the caller.
  * `endCall()`: Stops all local and remote media tracks, closes the `RTCPeerConnection`, clears call timers, stops ringtones, plays call ended sound, and resets state to `"idle"`.
  * `toggleMute()`: Mutes or unmutes local audio tracks.
  * `toggleVideo()`: Enables or disables local camera tracks.

---

### 3. `useChatStore.js`
* **Purpose**: Centralizes the chat workspace state, conversation selection, real-time message sending and receiving, message delivery receipts, unread badge counters, and ephemeral message expiration.
* **State Variables**:
  * `messages`: Array of message objects for the currently selected conversation.
  * `users`: List of all available contacts/users for the sidebar.
  * `selectedUser`: The contact currently open in the active chat view.
  * `isUsersLoading`: Boolean loading flag when fetching the contact directory.
  * `isMessagesLoading`: Boolean loading flag when loading conversation message history.
  * `unreadMessages`: Dictionary of unread message counts keyed by sender user ID.
  * `soundEnabled`: User preference toggle for incoming and outgoing sound effects (persisted in `localStorage`).
* **Core Actions**:
  * `getUsers()`: Queries `/api/messages/users` to populate the sidebar contact list.
  * `getMessages(userId)`: Fetches historical messages from `/api/messages/:id`, resets unread count for this user, and emits `markMessagesAsSeen`.
  * `sendMessage(messageData)`: Sends a new message payload (text, image, or audio) to `/api/messages/send/:id` with optimistic local UI updating.
  * `subscribeToMessages()`: Hooks into Socket.io events:
    * `newMessage`: Ingests incoming messages, plays notification sound (if enabled), updates thread if sender is currently selected, or increments unread badge.
    * `messageDelivered`: Updates status ticks to double gray checks.
    * `messageSeen`: Updates status ticks to double blue checks.
    * `messageExpired`: Removes ephemeral self-destructed messages from the active thread in real time.
  * `unsubscribeFromMessages()`: Cleanly unbinds all chat-related socket event listeners to prevent memory leaks.
  * `setSelectedUser(user)`: Selects a contact, fetches their message history, and marks unread messages as read.
  * `toggleSound()`: Toggles audible sound effects on/off.

---

### 4. `useThemeStore.js`
* **Purpose**: Controls the dynamic DaisyUI styling theme across the entire application with persistent browser storage.
* **State Variables**:
  * `theme`: Current active theme name (e.g., `"synthwave"`, `"dark"`, `"light"`, `"cupcake"`, `"cyberpunk"`, `"forest"`, `"luxury"`). Defaults to `"synthwave"`.
* **Core Actions**:
  * `setTheme(themeName)`: Updates state, persists the chosen theme to `localStorage`, and updates the root HTML element's `data-theme` attribute to instantly re-skin the UI without requiring a reload.

---

## State Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │            useAuthStore              │
                      │  - authUser, session, tokens         │
                      │  - Socket.io connection lifecycle    │
                      └──────────────────┬───────────────────┘
                                         │ exposes socket
                ┌────────────────────────┼────────────────────────┐
                ▼                        ▼                        ▼
     ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
     │    useChatStore     │  │    useCallStore     │  │    useThemeStore    │
     │ - Conversations     │  │ - WebRTC Peer Conn  │  │ - DaisyUI Theme     │
     │ - Messages & media  │  │ - Audio/Video media │  │ - LocalStorage sync │
     │ - Read receipts     │  │ - ICE negotiation   │  └─────────────────────┘
     │ - Unread badges     │  │ - Call duration     │
     └─────────────────────┘  └─────────────────────┘
```
