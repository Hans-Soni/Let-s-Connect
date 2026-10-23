# Models

This directory contains Mongoose schemas and models which define the structure of data stored in MongoDB.

## Files

- `User.js`: Defines the user account schema, including full name, email (with A-to-Z collation index), password, profile picture, and account timestamps.
- `Consent.js`: Defines consent audit records in the separate MongoDB `consents` collection, linked to users by ID and recording acceptance time, terms version, signup IP, and email.
- `Message.js`: Defines the schema for chat messages, containing references to sender and receiver, text (AES-256 encrypted), image/audio/video URLs and Cloudinary public IDs, delivery/read status, and timestamps. A backend cleanup job removes messages after 24 hours once associated media is deleted.
