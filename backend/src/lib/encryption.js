/**
 * encryption.js  — thin shim that delegates to the rotating key ring (keyRotation.js).
 *
 * Legacy format (written before key rotation was introduced):
 *   enc:<iv_hex>:<authTag_hex>:<cipher_hex>          (16-byte IV, AES-256-GCM)
 *
 * New format (written by keyRotation.encryptMessage):
 *   <version>.<iv_base64url>.<authTag_base64url>.<cipher_base64url>
 *
 * decryptText detects which format is in use and falls back to the legacy static
 * key for old messages so nothing already in MongoDB becomes unreadable.
 */
import crypto from 'crypto';
import * as keys from './keyRotation.js';
import { ENV } from './env.js';

// ---------------------------------------------------------------------------
// Legacy static key — used ONLY to decrypt old messages (enc:... format).
// Do NOT use this for any new encryption.
// ---------------------------------------------------------------------------
const _LEGACY_ENCRYPTION_KEY = (() => {
  const rawKey = ENV.ENCRYPTION_KEY || 'lets-connect-secure-encryption-key-fallback';
  if (typeof rawKey === 'string' && rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }
  return crypto.scryptSync(rawKey, 'lets_connect_secure_salt_2026', 32);
})();

/**
 * Encrypts a plaintext string using the CURRENT rotating key.
 * Output format: <version>.<iv_base64url>.<authTag_base64url>.<cipher_base64url>
 */
export const encryptText = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    return keys.encryptMessage(plainText);
  } catch (error) {
    console.error('Encryption error:', error.message);
    return plainText;
  }
};

/**
 * Decrypts a ciphertext string.
 * Supports both the new rotating-key format and the old legacy enc:... format.
 * Gracefully returns the original value if it was never encrypted.
 */
export const decryptText = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;

  // ── New rotating-key format: "<number>.<base64url>.<base64url>.<base64url>" ──
  // Version number is always a plain decimal integer as the first segment.
  if (/^\d+\./.test(cipherText)) {
    try {
      return keys.decryptMessage(cipherText);
    } catch (error) {
      console.error('Decryption error (rotating key):', error.message);
      return cipherText;
    }
  }

  // ── Legacy format: "enc:<iv_hex>:<authTag_hex>:<cipher_hex>" ──
  if (cipherText.startsWith('enc:')) {
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 4) return cipherText;

      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const encrypted = parts[3];

      const decipher = crypto.createDecipheriv('aes-256-gcm', _LEGACY_ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error (legacy key):', error.message);
      return cipherText;
    }
  }

  // Plaintext — was never encrypted (very old messages before encryption was added).
  return cipherText;
};
