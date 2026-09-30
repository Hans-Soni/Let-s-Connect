# Emails

This directory contains the logic and templates for sending transactional emails to users using the Resend API.

## Files

- `emailHandlers.js`: Contains functions that trigger email dispatch via the configured email service provider (Resend). For example, it handles sending the "Welcome" email upon successful user registration.
- `emailTemplates.js`: Contains the HTML email templates used by the handlers to format the emails consistently.
