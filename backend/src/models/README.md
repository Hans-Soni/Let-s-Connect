# Models

This directory contains Mongoose schemas and models which define the structure of data stored in MongoDB.

## Files

- `User.js` / `user.model.js`: Defines the schema for a user, including fields like full name, email, password, profile picture, and timestamps.
- `Message.js` / `message.model.js`: Defines the schema for chat messages, containing references to the sender and receiver, and the message content (text/image).
