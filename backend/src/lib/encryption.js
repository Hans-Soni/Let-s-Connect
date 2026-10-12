import crypto from "crypto";
import { ENV } from "./env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

// Load 32-byte (256-bit) encryption key from .env
const getEncryptionKey = () => {
  const rawKey = ENV.ENCRYPTION_KEY || ENV.JWT_SECRET || "lets-connect-secure-encryption-key-fallback";
  if (typeof rawKey === "string" && rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }
  return crypto.scryptSync(rawKey, "lets_connect_secure_salt_2026", 32);
};

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypts plaintext message content with AES-256-GCM.
 * Stored as: enc:<iv_hex>:<authTag_hex>:<cipher_hex>
 */
export const encryptText = (plainText) => {
  if (!plainText || typeof plainText !== "string") return plainText;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `enc:${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return plainText;
  }
};

/**
 * Decrypts AES-256-GCM encrypted message content.
 * Gracefully returns original text if not encrypted (backwards compatibility).
 */
export const decryptText = (cipherText) => {
  if (!cipherText || typeof cipherText !== "string" || !cipherText.startsWith("enc:")) {
    return cipherText;
  }
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 4) return cipherText;

    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const encrypted = parts[3];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return cipherText;
  }
};
