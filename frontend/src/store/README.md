# Store

This directory contains the global state management configuration using Zustand. 

## Files

- `useAuthStore.js`: Manages authentication state (current user, tokens, login/signup/logout, socket connection, online users list).
- `useChatStore.js`: Manages chat state (active chats, contacts, selected conversation, unread counts, sound toggles, notifications, message delivery & seen status).
- `useThemeStore.js`: Manages UI color themes with persistent localStorage backing.
