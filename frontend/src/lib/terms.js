export const CURRENT_TERMS_VERSION = "1.1";

export const TERMS_SECTIONS = [
  {
    title: "Data use and service providers",
    text: "You authorize Let's Connect to collect, store, and process your account details, messages, and any images, audio, or video you share to provide the chat service. Service providers, including MongoDB, Cloudinary, Arcjet, and Upstash, may process data as needed for storage, media delivery, and service security.",
  },
  {
    title: "Chat retention",
    text: "Chat text and attached media are scheduled for deletion after 24 hours. Cleanup depends on service availability, and provider logs, backups, or cached copies may have separate retention periods; exact deletion from every provider or backup cannot be guaranteed by this app.",
  },
  {
    title: "Account and security data",
    text: "Account information is retained while your account is active and is not covered by the 24-hour chat-message cleanup. For the consent record, we store your signup IP address, email address, account ID, acceptance time, and terms version with your account. Security and operational providers may retain request or diagnostic data according to their own policies.",
  },
];
