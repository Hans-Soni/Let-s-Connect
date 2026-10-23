# Models

This directory contains Mongoose schemas and models which define the structure of data stored in MongoDB.

## Files

- `User.js`: Defines the schema for a user, including fields like full name, email (with A-to-Z collation index), password, profile picture, and timestamps.
- `Message.js`: Defines the schema for chat messages, containing references to sender and receiver, text (AES-256 encrypted), image, audio and video URLs, delivery/read status, and timestamps. Message records expire 24 hours after creation through a MongoDB TTL index.
