# Let's Connect - Backend

This folder contains the Node.js / Express backend server for the Let's Connect application.

## Directory Structure

- **`src/`**: The main source code directory containing all backend logic.
- **`node_modules/`**: Dependencies installed via npm.

## Key Files

- `package.json` / `package-lock.json`: Defines the backend dependencies (Express, Mongoose, Socket.io, etc.) and run scripts.
- `.env`: Contains environment variables required for running the backend (e.g., MongoDB URI, API keys for Resend, Cloudinary, etc.).

## Main Functionality

This backend handles:
- RESTful API routing and endpoints for users and messages.
- Authentication and session management.
- Real-time bi-directional communication using WebSockets via `socket.io`.
- Email dispatching using Resend.
- Database connections to MongoDB using Mongoose.
