# Libraries (`lib`)

This directory contains external service configurations, database connection files, and reusable utility functions.

## Files

- `arcjet.js`: Configuration for Arcjet (used for rate limiting and security rules).
- `cloudinary.js`: Configuration and connection logic for the Cloudinary image storage service.
- `db.js`: Contains the MongoDB connection setup using Mongoose.
- `env.js`: Responsible for parsing and validating environment variables used across the application.
- `resend.js`: Configures the Resend email client using the API key.
- `socket.js`: Contains the WebSocket setup using `socket.io` and handles active user tracking.
- `utils.js`: Contains general utility functions (like token generation).
