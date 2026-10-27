'use strict';
/**
 * keyRotation.js  (MERN backend: Node + Express + MongoDB/Mongoose)
 *
 * Environment:
 *   KEY_MASTER_KEY = 64 hex chars (32 bytes). Generate once with:
 *     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *   Keep it in your host's secret manager / env, NEVER in MongoDB or git.
 *   The rotating keys are stored in MongoDB only in encrypted form (sealed with this master key).
 *
 * Usage in server.js:
 *   import * as keys from './lib/keyRotation.js';
 *   await mongoose.connect(process.env.MONGO_URI);
 *   await keys.initKeyRotation();               // loads keys, rotates 00:00 and 12:00 IST
 *
 *   // login route
 *   const token = keys.signJwt({ id: user._id });
 *   // auth middleware
 *   const payload = keys.verifyJwt(token);
 *   // chat messages
 *   const cipher = keys.encryptMessage('hello');   // store this in MongoDB
 *   const plain  = keys.decryptMessage(cipher);    // works for messages from ANY older key version
 *   // sender service endpoint
 *   app.post('/api/send', keys.requireSenderApiKey, handler);
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import { generateSecret, CHARSETS } from './secretGenerator.js';

/* ------------------------------ config ------------------------------ */
const CONFIG = {
  schedule: '0 0,12 * * *',          // 2 times a day: 00:00 and 12:00
  timezone: 'Asia/Kolkata',
  length: 26,
  maxRun: 4,                          // reject any char repeated more than 4 times side by side
  jwtCharset: CHARSETS.ascii,         // 0-9 a-z A-Z + printable ASCII symbols
  encryptionCharset: CHARSETS.ascii,
  apiKeyCharset: CHARSETS.alnum,      // symbols can break HTTP headers/URLs, so alnum only for API key
  graceVersions: 1,                   // how many OLD versions JWT / API key still verify with
  refreshMs: 60 * 1000,               // other server instances re-read keys every minute
  jwtExpiresIn: '15m',                // keep shorter than the rotation window
};

/* --------------------- master key (protects DB copy) ---------------------- */
function getMasterKey() {
  const key = Buffer.from(process.env.KEY_MASTER_KEY || '', 'hex');
  if (key.length !== 32) throw new Error('KEY_MASTER_KEY must be 64 hex characters (32 bytes)');
  return key;
}

function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString('base64')).join('.');
}

function unseal(blob) {
  const [iv, tag, ct] = blob.split('.').map((p) => Buffer.from(p, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

/* ------------------------------- storage ------------------------------- */
const keySetSchema = new mongoose.Schema({
  version: { type: Number, required: true, unique: true }, // unique => 2 servers can't both create the same version
  jwtSecret: { type: String, required: true },
  encryptionKey: { type: String, required: true },
  senderApiKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const KeySet = mongoose.models.KeySet || mongoose.model('KeySet', keySetSchema);

/* ------------------------------ in-memory ring ------------------------------ */
let ring = new Map();       // version -> { jwtSecret, encryptionKey, senderApiKey }
let currentVersion = 0;

async function loadKeys() {
  const docs = await KeySet.find().sort({ version: 1 }).lean();
  const next = new Map();
  for (const d of docs) {
    next.set(d.version, {
      jwtSecret: unseal(d.jwtSecret),
      encryptionKey: unseal(d.encryptionKey),
      senderApiKey: unseal(d.senderApiKey),
    });
  }
  ring = next;
  currentVersion = docs.length ? docs[docs.length - 1].version : 0;
}

/**
 * Generate three secrets that are pairwise distinct.
 * Collision probability is ~1/2^155 per pair, so the loop exits on the
 * first iteration in every practical run, but the check is free and
 * guarantees the three values are never accidentally equal.
 */
function generateDistinctSecrets(base) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const jwtSecret     = generateSecret({ ...base, charset: CONFIG.jwtCharset });
    const encryptionKey = generateSecret({ ...base, charset: CONFIG.encryptionCharset });
    const senderApiKey  = generateSecret({ ...base, charset: CONFIG.apiKeyCharset });
    if (jwtSecret !== encryptionKey && jwtSecret !== senderApiKey && encryptionKey !== senderApiKey) {
      return { jwtSecret, encryptionKey, senderApiKey };
    }
  }
  throw new Error('Could not generate three distinct secrets in 100 attempts'); // unreachable
}

/** Create a brand-new key set (the "change keys" algorithm). */
async function rotateKeys() {
  const latest = await KeySet.findOne().sort({ version: -1 }).lean();
  const version = latest ? latest.version + 1 : 1;
  const base = { length: CONFIG.length, maxRun: CONFIG.maxRun };

  const fresh = generateDistinctSecrets(base);

  try {
    await KeySet.create({
      version,
      jwtSecret: seal(fresh.jwtSecret),
      encryptionKey: seal(fresh.encryptionKey),
      senderApiKey: seal(fresh.senderApiKey),
    });
  } catch (err) {
    if (err.code === 11000) return loadKeys(); // another instance already rotated
    throw err;
  }
  await loadKeys();
  console.log(`[keys] rotated to version ${version} at ${new Date().toISOString()}`);
}

async function initKeyRotation() {
  getMasterKey(); // fail fast if env is missing
  await loadKeys();
  if (!ring.size) await rotateKeys();

  cron.schedule(CONFIG.schedule, () => rotateKeys().catch((e) => console.error('[keys] rotation failed', e)), {
    timezone: CONFIG.timezone,
  });
  setInterval(() => loadKeys().catch((e) => console.error('[keys] refresh failed', e)), CONFIG.refreshMs).unref();
}

const isAcceptable = (v) => ring.has(v) && v >= currentVersion - CONFIG.graceVersions;

/* ---------------------------------- JWT ---------------------------------- */
function signJwt(payload, options = {}) {
  const v = currentVersion;
  return jwt.sign(payload, ring.get(v).jwtSecret, {
    algorithm: 'HS256',
    expiresIn: CONFIG.jwtExpiresIn,
    keyid: String(v), // tells verifyJwt which secret to use
    ...options,
  });
}

function verifyJwt(token) {
  const decoded = jwt.decode(token, { complete: true });
  const v = Number(decoded && decoded.header && decoded.header.kid);
  if (!isAcceptable(v)) throw new Error('JWT key version expired or unknown');
  return jwt.verify(token, ring.get(v).jwtSecret, { algorithms: ['HS256'] });
}

/* ------------------------- message encryption (AES-256-GCM) ------------------------- */
// A 26-char secret is not a raw 32-byte key, so stretch it with HKDF into one.
const deriveKey = (secret) =>
  Buffer.from(crypto.hkdfSync('sha256', secret, '', 'chat-message-encryption', 32));

function encryptMessage(plainText) {
  const v = currentVersion;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', deriveKey(ring.get(v).encryptionKey), iv);
  const ct = Buffer.concat([c.update(plainText, 'utf8'), c.final()]);
  return [v, iv, c.getAuthTag(), ct].map((p) => (Buffer.isBuffer(p) ? p.toString('base64url') : String(p))).join('.');
}

// Old messages stay readable because every old encryption key is kept (sealed) in MongoDB.
function decryptMessage(payload) {
  const [v, iv, tag, ct] = payload.split('.');
  const entry = ring.get(Number(v));
  if (!entry) throw new Error(`Unknown key version ${v}`);
  const d = crypto.createDecipheriv('aes-256-gcm', deriveKey(entry.encryptionKey), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8');
}

/* ------------------------------ sender API key ------------------------------ */
const sha = (s) => crypto.createHash('sha256').update(s).digest();

function requireSenderApiKey(req, res, next) {
  const provided = sha(req.get('x-api-key') || '');
  for (const [v, entry] of ring) {
    if (isAcceptable(v) && crypto.timingSafeEqual(provided, sha(entry.senderApiKey))) return next();
  }
  return res.status(401).json({ error: 'Invalid API key' });
}

// Your trusted sender service calls this (over a protected channel) to fetch the new key after each rotation.
const getCurrentSenderApiKey = () => ring.get(currentVersion).senderApiKey;

export {
  initKeyRotation, rotateKeys,
  signJwt, verifyJwt,
  encryptMessage, decryptMessage,
  requireSenderApiKey, getCurrentSenderApiKey,
};
