import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,       // legacy – used only by security_check.js test
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  EMAIL_WEBHOOK_URL: process.env.EMAIL_WEBHOOK_URL,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || "samvada.real.time.chat@gmail.com",
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "Samवाद",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER || "samvada.real.time.chat@gmail.com",
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  SMTP_SERVICE: process.env.SMTP_SERVICE || "gmail",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY: process.env.ARCJET_KEY,
  ARCJET_ENV: process.env.ARCJET_ENV,
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY, // legacy – used only for decrypting old enc:... messages
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "624896610383-ng9rkc9ocnqgk03npkkg4c12e8b24pkl.apps.googleusercontent.com",
  // KEY_MASTER_KEY is read directly by keyRotation.js via process.env to avoid it being logged accidentally
};
