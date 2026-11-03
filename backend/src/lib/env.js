import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,       // legacy – used only by security_check.js test
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
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
