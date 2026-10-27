/**
 * migrateMessageEncryption.js  —  ONE-TIME migration script
 *
 * Re-encrypts all legacy-format messages (enc:<iv>:<tag>:<cipher>) with the
 * current rotating key version, and leaves already-migrated messages untouched.
 *
 * Run MANUALLY from the project root after making sure KEY_MASTER_KEY and
 * ENCRYPTION_KEY are set in backend/.env:
 *
 *   node --env-file=backend/.env scripts/migrateMessageEncryption.js
 *
 * Safe to run more than once (idempotent: already-migrated messages are skipped).
 * Do NOT run while the app server is under heavy load; each batch holds a short
 * write lock on the updated documents only.
 */

'use strict';

// --- Bootstrap dotenv so process.env is populated --------------------------
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });
// ---------------------------------------------------------------------------

import mongoose from 'mongoose';
import crypto from 'crypto';

// ── Legacy static key (same derivation as encryption.js) ───────────────────
const _LEGACY_RAW = process.env.ENCRYPTION_KEY || 'lets-connect-secure-encryption-key-fallback';
const LEGACY_KEY =
  typeof _LEGACY_RAW === 'string' && _LEGACY_RAW.length === 64 && /^[0-9a-fA-F]+$/.test(_LEGACY_RAW)
    ? Buffer.from(_LEGACY_RAW, 'hex')
    : crypto.scryptSync(_LEGACY_RAW, 'lets_connect_secure_salt_2026', 32);

function legacyDecrypt(cipherText) {
  const parts = cipherText.split(':');
  if (parts.length !== 4 || parts[0] !== 'enc') throw new Error('Not a legacy enc:... value');
  const iv = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', LEGACY_KEY, iv);
  decipher.setAuthTag(authTag);
  let out = decipher.update(parts[3], 'hex', 'utf8');
  out += decipher.final('utf8');
  return out;
}

// ── Rotating key ring setup ─────────────────────────────────────────────────
const keySetSchema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true },
  jwtSecret: { type: String, required: true },
  encryptionKey: { type: String, required: true },
  senderApiKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
let KeySet;

function getMasterKey() {
  const key = Buffer.from(process.env.KEY_MASTER_KEY || '', 'hex');
  if (key.length !== 32) throw new Error('KEY_MASTER_KEY must be 64 hex characters (32 bytes)');
  return key;
}

function unseal(blob) {
  const [iv, tag, ct] = blob.split('.').map((p) => Buffer.from(p, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

const deriveKey = (secret) =>
  Buffer.from(crypto.hkdfSync('sha256', secret, '', 'chat-message-encryption', 32));

function newEncrypt(plainText, encryptionKey) {
  const v = currentVersion;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', deriveKey(encryptionKey), iv);
  const ct = Buffer.concat([c.update(plainText, 'utf8'), c.final()]);
  return [v, iv, c.getAuthTag(), ct]
    .map((p) => (Buffer.isBuffer(p) ? p.toString('base64url') : String(p)))
    .join('.');
}

let currentVersion = 0;
let currentEncKey = '';

// ── Message model ───────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    text: { type: String },
  },
  { strict: false, collection: 'messages' }
);
let Message;

// ── Main ────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 200;

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error('MONGO_URI not set');

  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);

  KeySet = mongoose.models.KeySet || mongoose.model('KeySet', keySetSchema);
  Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

  // Load the latest key set
  const latest = await KeySet.findOne().sort({ version: -1 }).lean();
  if (!latest) throw new Error('No key sets found in DB. Run the server at least once to create the first set.');

  currentVersion = latest.version;
  currentEncKey = unseal(latest.encryptionKey);

  console.log(`Using key version ${currentVersion} for re-encryption.`);

  let totalProcessed = 0;
  let totalMigrated = 0;
  let lastId = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = lastId ? { _id: { $gt: lastId }, text: /^enc:/ } : { text: /^enc:/ };
    const batch = await Message.find(query).sort({ _id: 1 }).limit(BATCH_SIZE).lean();

    if (batch.length === 0) break;

    lastId = batch[batch.length - 1]._id;
    totalProcessed += batch.length;

    const ops = [];
    for (const msg of batch) {
      try {
        const plain = legacyDecrypt(msg.text);
        const newCipher = newEncrypt(plain, currentEncKey);
        ops.push({
          updateOne: {
            filter: { _id: msg._id, text: msg.text }, // optimistic lock: only update if text hasn't changed
            update: { $set: { text: newCipher } },
          },
        });
      } catch (err) {
        console.error(`  [SKIP] message ${msg._id}: ${err.message}`);
      }
    }

    if (ops.length) {
      const result = await Message.bulkWrite(ops, { ordered: false });
      totalMigrated += result.modifiedCount;
    }

    console.log(`  Processed ${totalProcessed} messages, migrated ${totalMigrated} so far…`);
  }

  console.log(`\nDone. Total legacy messages processed: ${totalProcessed}, re-encrypted: ${totalMigrated}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
