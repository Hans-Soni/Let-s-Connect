# Backend Source (`src`)

This folder contains the primary source code for the backend API and server.

## Directory Structure

- **`controllers/`**: Contains the route handlers (controller logic) for different API endpoints.
- **`emails/`**: Stores email templates and handlers used for sending transactional emails (like welcome emails).
- **`lib/`**: Contains library configurations, utility functions, and connections to external services (like database, cloudinary).
- **`middleware/`**: Contains custom Express middleware for processing requests (e.g., authentication checks, error handling).
- **`models/`**: Contains Mongoose schemas and models defining the data structure for MongoDB.
- **`routes/`**: Defines the API route endpoints and maps them to their respective controllers.

## Key Files

- `server.js`: The main entry point for the backend server. It configures the Express application, applies global middleware, sets up routes, and initializes the HTTP server with WebSockets.
- `arcjet.middleware.js`: Specific middleware configuration for Arcjet (used for security and rate limiting).
