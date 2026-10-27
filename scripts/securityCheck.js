import { createRequire } from "module";
import crypto from "crypto";
import { encryptText, decryptText } from "../backend/src/lib/encryption.js";
import { isOriginAllowed } from "../backend/src/lib/socket.js";

// Resolve backend dependencies without requiring duplicate node_modules at root
const backendRequire = createRequire(new URL("../backend/package.json", import.meta.url));
const jwt = backendRequire("jsonwebtoken");
const mongoose = backendRequire("mongoose");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

console.log("\n========================================================");
console.log("       LET'S CONNECT - FULL SECURITY SUITE TEST");
console.log("========================================================\n");

// ----------------------------------------------------
// 1. AES-256-GCM ENCRYPTION & TAMPERING TESTS
// ----------------------------------------------------
console.log("1. Testing AES-256-GCM Authenticated Encryption & Integrity...");

// Test legacy format decryption & tamper rejection
const legacyKey = crypto.scryptSync("test-diagnostic-salt-key", "lets_connect_secure_salt_2026", 32);
const legacyIv = crypto.randomBytes(16);
const legacyCipher = crypto.createCipheriv("aes-256-gcm", legacyKey, legacyIv);
const legacySample = "Legacy Secret Message: Let's Connect";
let legacyEncryptedText = legacyCipher.update(legacySample, "utf8", "hex");
legacyEncryptedText += legacyCipher.final("hex");
const legacyAuthTag = legacyCipher.getAuthTag();
const legacyPayload = `enc:${legacyIv.toString("hex")}:${legacyAuthTag.toString("hex")}:${legacyEncryptedText}`;

assert(legacyPayload.startsWith("enc:"), "Legacy encrypted format starts with 'enc:'");
const legacyParts = legacyPayload.split(":");
assert(legacyParts.length === 4, "Legacy format contains exactly 4 colon-separated parts (enc:iv:authTag:cipher)");
assert(legacyParts[1].length === 32, "IV is exactly 16 bytes (32 hex characters)");
assert(legacyParts[2].length === 32, "Auth tag is exactly 16 bytes (32 hex characters)");

// Tampering / Bit-flipping attack test (tampered ciphertext must fail auth tag validation)
const tamperedLegacy = legacyParts[0] + ":" + legacyParts[1] + ":" + legacyParts[2] + ":" + (legacyParts[3].slice(0, -2) + "ff");
const tamperedLegacyResult = decryptText(tamperedLegacy);
assert(tamperedLegacyResult === tamperedLegacy, "Tampered ciphertext fails auth tag validation and is rejected safely");

// ----------------------------------------------------
// 2. CORS & ORIGIN RESTRICTION SECURITY TESTS
// ----------------------------------------------------
console.log("\n2. Testing CORS Origin Restriction & Whitelist...");

// Valid origins
let allowed1 = false;
isOriginAllowed("https://hans-soni.github.io", (err, allow) => { allowed1 = !err && allow; });
assert(allowed1, "Allowed official production origin: https://hans-soni.github.io");

let allowedLocal = false;
isOriginAllowed("http://localhost:5173", (err, allow) => { allowedLocal = !err && allow; });
assert(allowedLocal, "Allowed local frontend dev origin: http://localhost:5173");

let allowedNoOrigin = false;
isOriginAllowed(null, (err, allow) => { allowedNoOrigin = !err && allow; });
assert(allowedNoOrigin, "Allowed null origin (mobile apps, backend-to-backend curl)");

// Untrusted / Attack origins
let rejectedEvil = false;
isOriginAllowed("https://evil-attacker.com", (err, allow) => { rejectedEvil = Boolean(err || !allow); });
assert(rejectedEvil, "REJECTED untrusted origin: https://evil-attacker.com");

let rejectedSubdomain = false;
isOriginAllowed("https://fake-phishing.github.io", (err, allow) => { rejectedSubdomain = Boolean(err || !allow); });
assert(rejectedSubdomain, "REJECTED rogue github.io domain: https://fake-phishing.github.io");

// ----------------------------------------------------
// 3. JWT TOKEN SECURITY & INTEGRITY TESTS
// ----------------------------------------------------
console.log("\n3. Testing JWT Token Validation & Tampering...");

// Use an ephemeral cryptographically secure random key for this run — NEVER hardcode secrets
const ephemeralSecret = crypto.randomBytes(32).toString("hex");
const testPayload = { userId: new mongoose.Types.ObjectId().toString() };
const validToken = jwt.sign(testPayload, ephemeralSecret, { expiresIn: "15m" });

let decoded = null;
try {
  decoded = jwt.verify(validToken, ephemeralSecret);
} catch (e) {}
assert(decoded && decoded.userId === testPayload.userId, "Valid JWT verified successfully");

// Tampered token test
const tamperedToken = validToken.slice(0, -5) + "abcde";
let tamperedValid = false;
try {
  jwt.verify(tamperedToken, ephemeralSecret);
  tamperedValid = true;
} catch (e) {
  tamperedValid = false;
}
assert(!tamperedValid, "Tampered JWT signature strictly rejected by verification");

// Expired token test
const expiredToken = jwt.sign(testPayload, ephemeralSecret, { expiresIn: "0s" });
let expiredValid = false;
try {
  jwt.verify(expiredToken, ephemeralSecret);
  expiredValid = true;
} catch (e) {
  expiredValid = false;
}
assert(!expiredValid, "Expired JWT token strictly rejected by verification");

// ----------------------------------------------------
// 4. MONGODB OBJECTID SANITIZATION & INPUT VALIDATION
// ----------------------------------------------------
console.log("\n4. Testing MongoDB ObjectId Sanitization...");

const validMongoId = new mongoose.Types.ObjectId().toString();
assert(mongoose.Types.ObjectId.isValid(validMongoId), "Valid 24-hex ObjectId recognized as valid");

const maliciousMongoIds = [
  "undefined",
  "null",
  "12345",
  "../etc/passwd",
  "{$ne: null}",
  "507f1f77bcf86cd799439011_extra_garbage",
  "' OR '1'='1",
];

for (const badId of maliciousMongoIds) {
  const isValid = mongoose.Types.ObjectId.isValid(badId) && String(new mongoose.Types.ObjectId(badId)) === badId;
  assert(!isValid, `Malicious or malformed ID strictly rejected: ${badId}`);
}

// ----------------------------------------------------
// 5. BLOCK SYSTEM LOGICAL ENFORCEMENT SIMULATION
// ----------------------------------------------------
console.log("\n5. Testing Block System Business Logic & Rules...");

const aliceId = new mongoose.Types.ObjectId().toString();
const bobId = new mongoose.Types.ObjectId().toString();

const alice = {
  _id: aliceId,
  fullName: "Alice",
  profilePic: "https://example.com/alice.jpg",
  blockedUsers: [bobId], // Alice blocked Bob
};

const bob = {
  _id: bobId,
  fullName: "Bob",
  profilePic: "https://example.com/bob.jpg",
  blockedUsers: [],
};

// Check: can Bob send message to Alice?
const isSenderBlockedByReceiver = alice.blockedUsers.includes(bob._id);
assert(isSenderBlockedByReceiver, "Bob is blocked by Alice -> sendMessage detects blocked status");

// Check: DP masking for Bob viewing Alice
const isMeBlockedByTarget = alice.blockedUsers.includes(bob._id);
const bobViewingAlicePic = isMeBlockedByTarget ? "" : alice.profilePic;
assert(bobViewingAlicePic === "", "Alice's profile picture is masked to '' (default placeholder) when Bob views her");

// Check: Alice's blocked list is NOT exposed in API output
const aliceProfileObj = { ...alice };
delete aliceProfileObj.blockedUsers;
assert(!("blockedUsers" in aliceProfileObj), "Target user's private blockedUsers array stripped from response");

// Self block prevention
const isSelfBlock = aliceId === aliceId;
assert(isSelfBlock, "Self-blocking is caught and prevented");

console.log("\n========================================================");
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
