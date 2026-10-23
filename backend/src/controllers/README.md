# Controllers

This directory contains the controller logic for the application's API endpoints. Controllers are responsible for processing incoming requests, interacting with models (database), and returning responses to the client.

## Files

- `auth.controller.js`: Handles authentication, profile edits, consent-record retrieval, and password changes that verify the current password.
- `message.controller.js`: Handles logic related to messaging, including fetching chat histories, returning per-chat unread message counts, fetching active users, and sending/receiving messages.
