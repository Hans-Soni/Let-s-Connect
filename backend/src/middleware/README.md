# Middleware

This directory contains custom Express middleware and socket middleware used to intercept and process requests or events.

## Files

- `arcjet.middleware.js`: Integrates Arcjet for applying security protections and request limits.
- `auth.middleware.js`: Verifies JSON Web Tokens (JWT) for protected API routes to ensure the user is authenticated.
- `socket.auth.middleware.js`: Ensures that WebSocket connections are authenticated before allowing users to join the socket namespace.
