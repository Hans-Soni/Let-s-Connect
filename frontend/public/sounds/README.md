# Public Audio Assets (`frontend/public/sounds`)

The `frontend/public/sounds` directory stores standalone audio assets used for user feedback, call ringers, and notification alerts across the **Samvād** client application.

---

## Directory Contents

| File | Format | Purpose | How It's Used |
| :--- | :--- | :--- | :--- |
| `notification.mp3` | MPEG Audio Layer 3 (MP3) | Incoming message ping | Played via `new Audio("/sounds/notification.mp3")` whenever a new chat message arrives while the window is inactive or if the user is in a different conversation thread (controlled by the user's `soundEnabled` preference in `useChatStore`). |

---

## Technical Details

- **Audio Specs**: Optimized low-latency MP3 sample (< 50KB) designed for swift decoding across mobile browsers and native WebViews.
- **Service Worker Pre-caching**: Automatically pre-cached by `sw.js` upon initial service worker registration, ensuring instant playback even in offline or poor-connectivity environments.
- **Web Audio Fallbacks**: In addition to static MP3 playback, real-time synthesized audio tones (such as WebRTC ringback, dialing, incoming ringtone, and call end beeps) are procedurally generated at runtime via the Web Audio API in [`callSounds.js`](file:///c:/Users/Asus/Desktop/chat%20app/frontend/src/lib/callSounds.js) to reduce network payload and guarantee zero-latency response.
