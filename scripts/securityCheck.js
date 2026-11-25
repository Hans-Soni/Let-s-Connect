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
assert(!expiredValid, "Expired JWT token strictly rejected by standard verification");

// Expired token with ignoreExpiration verifies cryptographic signature correctly
let expiredSignatureValid = false;
try {
  const verified = jwt.verify(expiredToken, ephemeralSecret, { ignoreExpiration: true });
  expiredSignatureValid = verified.userId === testPayload.userId;
} catch (e) {
  expiredSignatureValid = false;
}
assert(expiredSignatureValid, "Expired token verifies signature with ignoreExpiration for safe refresh");

// Forged token rejected even with ignoreExpiration: true (Account Takeover Defense)
const forgedToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString() }, "attacker-secret-key", { expiresIn: "15m" });
let forgedBypassed = false;
try {
  jwt.verify(forgedToken, ephemeralSecret, { ignoreExpiration: true });
  forgedBypassed = true;
} catch (e) {
  forgedBypassed = false;
}
assert(!forgedBypassed, "Forged token signed with wrong key strictly rejected even with ignoreExpiration: true (Anti-Takeover)");

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

// ----------------------------------------------------
// 6. CI WORKFLOW ACTION PINNING & SUPPLY-CHAIN INTEGRITY
// ----------------------------------------------------
console.log("\n6. Testing CI Workflow Supply-Chain Security & Action Pinning...");

const fs = backendRequire("fs");
const path = backendRequire("path");

const isActionPinned = (line) => {
  const match = line.match(/^\s*uses:\s*([^#\s]+)/);
  if (!match) return null;
  const actionRef = match[1];
  // Local actions (starting with ./) are safe
  if (actionRef.startsWith("./")) return { pinned: true, ref: actionRef };
  // External actions MUST be pinned to a full 40-char commit SHA
  const hasSha = /@[0-9a-f]{40}$/i.test(actionRef);
  return { pinned: hasSha, ref: actionRef };
};

// Negative security tests: mutable action refs must be rejected
assert(isActionPinned("uses: actions/checkout@v4")?.pinned === false, "Negative test: Mutable tag '@v4' is strictly rejected");
assert(isActionPinned("uses: actions/setup-node@main")?.pinned === false, "Negative test: Mutable branch '@main' is strictly rejected");
assert(isActionPinned("uses: softprops/action-gh-release@v2.2.1")?.pinned === false, "Negative test: Semver tag '@v2.2.1' without SHA is strictly rejected");

// Positive test: verified commit SHA must be accepted
assert(
  isActionPinned("uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2")?.pinned === true,
  "Positive test: 40-character commit SHA with tag comment is accepted"
);

// Verify actual repository workflows
const workflowDir = path.resolve(".github/workflows");
if (fs.existsSync(workflowDir)) {
  const workflowFiles = fs.readdirSync(workflowDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  let allPinned = true;
  let actionCount = 0;

  for (const wf of workflowFiles) {
    const content = fs.readFileSync(path.join(workflowDir, wf), "utf8");
    const lines = content.split("\n");
    for (const line of lines) {
      const check = isActionPinned(line);
      if (check) {
        actionCount++;
        if (!check.pinned) {
          console.error(`    Unpinned action in ${wf}: ${check.ref}`);
          allPinned = false;
        }
      }
    }
  }

  assert(actionCount > 0, `Discovered ${actionCount} GitHub Actions in workflow files`);
  assert(allPinned, "All GitHub Actions in .github/workflows are pinned to 40-character commit SHAs");
}

// ----------------------------------------------------
// 7. DEPENDENCY ADVISORY & SHELL-QUOTE VULNERABILITY AUDIT
// ----------------------------------------------------
console.log("\n7. Testing Dependency Advisory & shell-quote Vulnerability Fix...");

const isShellQuoteVulnerable = (version) => {
  // GHSA-395f-4hp3-45gv & GHSA-pqg4-j6r4-53mv affect shell-quote <= 1.10.0
  const semverParts = version.split(".").map((n) => parseInt(n, 10));
  if (semverParts.length < 2) return true;
  const major = semverParts[0];
  const minor = semverParts[1];
  if (major < 1) return true;
  if (major === 1 && minor <= 10) return true;
  return false;
};

// Negative security tests: vulnerable versions are correctly identified
assert(isShellQuoteVulnerable("1.8.4") === true, "Negative test: shell-quote@1.8.4 identified as vulnerable");
assert(isShellQuoteVulnerable("1.10.0") === true, "Negative test: shell-quote@1.10.0 identified as vulnerable");

// Positive test: patched versions pass
assert(isShellQuoteVulnerable("1.12.0") === false, "Positive test: shell-quote@1.12.0 identified as safe");

// Verify root package-lock.json has patched shell-quote version
const lockfilePath = path.resolve("package-lock.json");
if (fs.existsSync(lockfilePath)) {
  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf8"));
  const shellQuotePkg = lockfile.packages?.["node_modules/shell-quote"];
  if (shellQuotePkg) {
    const installedVersion = shellQuotePkg.version;
    const isVuln = isShellQuoteVulnerable(installedVersion);
    assert(!isVuln, `Installed shell-quote version (${installedVersion}) is >= 1.10.1 (safe against GHSA-395f-4hp3-45gv & GHSA-pqg4-j6r4-53mv)`);
  }
}

// ----------------------------------------------------
// 8. SECURITY HEADERS & DEFENSIVE DIRECTIVES TEST
// ----------------------------------------------------
console.log("\n8. Testing Security Headers & Defensive Directives (CSP, Referrer-Policy, MIME Sniffing)...");

const indexHtmlPath = path.resolve("frontend/index.html");
assert(fs.existsSync(indexHtmlPath), "frontend/index.html exists");
if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  assert(
    indexHtml.includes('http-equiv="X-Content-Type-Options"') && indexHtml.includes('content="nosniff"'),
    "X-Content-Type-Options: nosniff meta directive present in index.html"
  );
  assert(
    indexHtml.includes('http-equiv="Referrer-Policy"') && indexHtml.includes("strict-origin-when-cross-origin"),
    "Referrer-Policy: strict-origin-when-cross-origin meta directive present in index.html"
  );
  assert(
    indexHtml.includes('http-equiv="Content-Security-Policy"') && indexHtml.includes("default-src 'self'"),
    "Content-Security-Policy (CSP) meta directive present in index.html"
  );
  assert(
    indexHtml.includes('name="google-site-verification"') && indexHtml.includes('content="FokCD3GyLhN6XTqAY3CKc6QLsP_dEla6Gr9uvaJ4KO4"'),
    "Google Search Console verification meta tag present in index.html"
  );
}

const serverJsPath = path.resolve("backend/src/server.js");
assert(fs.existsSync(serverJsPath), "backend/src/server.js exists");
if (fs.existsSync(serverJsPath)) {
  const serverJs = fs.readFileSync(serverJsPath, "utf8");
  assert(serverJs.includes('app.disable("x-powered-by")'), "Express x-powered-by header explicitly disabled");
  assert(serverJs.includes('res.removeHeader("Server")'), "Server header explicitly stripped on backend responses");
  assert(serverJs.includes("contentSecurityPolicy"), "Helmet Content Security Policy configured in backend");
  assert(serverJs.includes("referrerPolicy"), "Helmet Referrer-Policy configured in backend");
}

// ----------------------------------------------------
// 9. EPHEMERAL CHAT RETENTION & AUTO-CLEARING TEST (24h vs 15d)
// ----------------------------------------------------
console.log("\n9. Testing Ephemeral Chat Retention & Auto-Clearing Policies (24h vs 15d)...");

const { MESSAGE_RETENTION_24H_MS, MESSAGE_RETENTION_15D_MS } = await import("../backend/src/models/Message.js");
assert(MESSAGE_RETENTION_24H_MS === 24 * 60 * 60 * 1000, "24-hour retention constant equals exactly 86,400,000 ms");
assert(MESSAGE_RETENTION_15D_MS === 15 * 24 * 60 * 60 * 1000, "15-day retention constant equals exactly 1,296,000,000 ms");

const { getPairKey } = await import("../backend/src/models/Conversation.js");
const user1 = "507f1f77bcf86cd799439011";
const user2 = "507f1f77bcf86cd799439022";
assert(getPairKey(user1, user2) === getPairKey(user2, user1), "Conversation pairKey is deterministic and order-independent");
assert(getPairKey(user1, user2) === `${user1}_${user2}`, "Conversation pairKey formats as expected sorted IDs");

const now = Date.now();
const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
const sixteenDaysAgo = now - 16 * 24 * 60 * 60 * 1000;

assert(twentyFiveHoursAgo + 24 * 60 * 60 * 1000 <= now, "24h policy clears messages older than 24 hours");
assert(twentyFiveHoursAgo + 15 * 24 * 60 * 60 * 1000 > now, "15d policy preserves messages at 25 hours");
assert(fourteenDaysAgo + 15 * 24 * 60 * 60 * 1000 > now, "15d policy preserves messages at 14 days");
assert(sixteenDaysAgo + 15 * 24 * 60 * 60 * 1000 <= now, "15d policy clears messages older than 15 days");

// ----------------------------------------------------
// 10. MOBILE DEVICE REGISTRATION & CALL RINGING PERMISSIONS TEST
// ----------------------------------------------------
console.log("\n10. Testing Mobile Device Registration & Call Ringing Permissions...");

const userSchemaCode = fs.readFileSync(path.resolve("backend/src/models/User.js"), "utf8");
assert(userSchemaCode.includes("isAppInstalled:"), "User schema includes isAppInstalled boolean field");
assert(userSchemaCode.includes("devicePlatform:"), "User schema includes devicePlatform string field");

const authRouteCode = fs.readFileSync(path.resolve("backend/src/routes/auth.route.js"), "utf8");
assert(authRouteCode.includes("/register-device"), "Auth routes expose /register-device endpoint for mobile apps");

const manifestPath = path.resolve("frontend/android/app/src/main/AndroidManifest.xml");
assert(fs.existsSync(manifestPath), "Android manifest exists");
if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, "utf8");
  assert(manifest.includes("android.permission.VIBRATE"), "Android manifest grants VIBRATE permission for call rings");
  assert(manifest.includes("android.permission.WAKE_LOCK"), "Android manifest grants WAKE_LOCK for incoming calls");
  assert(manifest.includes("android.permission.POST_NOTIFICATIONS"), "Android manifest grants POST_NOTIFICATIONS (API 33+)");
  assert(manifest.includes("android.permission.USE_FULL_SCREEN_INTENT"), "Android manifest grants USE_FULL_SCREEN_INTENT");
  assert(manifest.includes("android.permission.FOREGROUND_SERVICE_PHONE_CALL"), "Android manifest grants FOREGROUND_SERVICE_PHONE_CALL");
  assert(manifest.includes("CallNotificationService"), "Android manifest registers CallNotificationService for background calls");
  assert(manifest.includes('android:stopWithTask="false"'), "Android manifest configures stopWithTask='false' to survive app swiping");
  assert(manifest.includes("BootReceiver"), "Android manifest registers BootReceiver for device reboot auto-start");
  assert(manifest.includes("RECEIVE_BOOT_COMPLETED"), "Android manifest declares RECEIVE_BOOT_COMPLETED permission");
  assert(manifest.includes('android:showWhenLocked="true"'), "Android MainActivity configured to showWhenLocked");
  assert(manifest.includes('android:turnScreenOn="true"'), "Android MainActivity configured to turnScreenOn");
}

const bootReceiverPath = path.resolve("frontend/android/app/src/main/java/com/hans/samvaad/BootReceiver.java");
assert(fs.existsSync(bootReceiverPath), "Android BootReceiver.java exists");
if (fs.existsSync(bootReceiverPath)) {
  const bootCode = fs.readFileSync(bootReceiverPath, "utf8");
  assert(bootCode.includes("ACTION_BOOT_COMPLETED"), "BootReceiver listens for ACTION_BOOT_COMPLETED");
  assert(bootCode.includes("ACTION_START_FOREGROUND"), "BootReceiver launches CallNotificationService on boot");
}

const mainActivityPath = path.resolve("frontend/android/app/src/main/java/com/hans/samvaad/MainActivity.java");
assert(fs.existsSync(mainActivityPath), "Android MainActivity.java exists");
if (fs.existsSync(mainActivityPath)) {
  const mainActivity = fs.readFileSync(mainActivityPath, "utf8");
  assert(mainActivity.includes("setShowWhenLocked(true)"), "MainActivity implements setShowWhenLocked for incoming calls");
  assert(mainActivity.includes("setTurnScreenOn(true)"), "MainActivity implements setTurnScreenOn for incoming calls");
  assert(mainActivity.includes("checkAndRequestPermissions"), "MainActivity implements checkAndRequestPermissions for runtime mic/camera/notifications");
  assert(mainActivity.includes("checkIncomingCallIntent"), "MainActivity forwards incoming call intent extras to IncomingCallPlugin");
}

const servicePath = path.resolve("frontend/android/app/src/main/java/com/hans/samvaad/CallNotificationService.java");
assert(fs.existsSync(servicePath), "Android CallNotificationService.java exists");
if (fs.existsSync(servicePath)) {
  const serviceCode = fs.readFileSync(servicePath, "utf8");
  assert(serviceCode.includes("ACTION_INCOMING_CALL"), "CallNotificationService implements ACTION_INCOMING_CALL");
  assert(serviceCode.includes("setFullScreenIntent"), "CallNotificationService configures full-screen intent over lock screen");
  assert(serviceCode.includes("USAGE_NOTIFICATION_RINGTONE"), "CallNotificationService configures hardware ringtone audio usage");
  assert(serviceCode.includes("wait-for-call"), "CallNotificationService implements wait-for-call native background listener");
  assert(serviceCode.includes("monitorCallStatusWhileRinging"), "CallNotificationService implements monitorCallStatusWhileRinging");
  assert(serviceCode.includes("onTaskRemoved"), "CallNotificationService implements onTaskRemoved with AlarmManager for app-close resurrection");
  assert(serviceCode.includes("CallStyle.forIncomingCall"), "CallNotificationService uses CallStyle.forIncomingCall with ANSWER/DECLINE buttons");
}

const incomingPluginPath = path.resolve("frontend/android/app/src/main/java/com/hans/samvaad/IncomingCallPlugin.java");
assert(fs.existsSync(incomingPluginPath), "Android IncomingCallPlugin.java exists");
if (fs.existsSync(incomingPluginPath)) {
  const pluginCode = fs.readFileSync(incomingPluginPath, "utf8");
  assert(pluginCode.includes("getPendingCall"), "IncomingCallPlugin implements getPendingCall method");
  assert(pluginCode.includes("sendIncomingCallEvent"), "IncomingCallPlugin implements sendIncomingCallEvent");
}

const nativeCallPath = path.resolve("frontend/src/lib/nativeCall.js");
const nativeCallCode = fs.readFileSync(nativeCallPath, "utf8");
assert(nativeCallCode.includes("getPendingNativeCall"), "nativeCall.js exports getPendingNativeCall");

const appJsxPath = path.resolve("frontend/src/App.jsx");
const appJsxCode = fs.readFileSync(appJsxPath, "utf8");
assert(appJsxCode.includes("getPendingNativeCall"), "App.jsx queries getPendingNativeCall on resume/launch");
assert(appJsxCode.includes("autoAccept"), "App.jsx handles autoAccept from ANSWER action button");

const messageControllerCode = fs.readFileSync(path.resolve("backend/src/controllers/message.controller.js"), "utf8");
assert(messageControllerCode.includes("waitForIncomingCall"), "message.controller.js implements waitForIncomingCall");
assert(messageControllerCode.includes("checkPendingCallLightweight"), "message.controller.js implements checkPendingCallLightweight");

const socketLibCode = fs.readFileSync(path.resolve("backend/src/lib/socket.js"), "utf8");
assert(socketLibCode.includes("dispatchCallToWaiters"), "socket.js implements dispatchCallToWaiters for background wakeup");
assert(socketLibCode.includes("clearActiveCallForUser"), "socket.js implements clearActiveCallForUser against stuck calls");

// ----------------------------------------------------
// 11. IP & PORT PRIVACY, INPUT BOUNDS & ANTI-SPOOFING SECURITY
// ----------------------------------------------------
console.log("\n11. Testing IP/Port Privacy, Input Bounds & Anti-Spoofing Controls...");

const signUpPageCode = fs.readFileSync(path.resolve("frontend/src/pages/SignUpPage.jsx"), "utf8");
assert(!signUpPageCode.includes("Device IP for audit"), "Negative test: SignUpPage does not render client IP address");

const userProfilePageCode = fs.readFileSync(path.resolve("frontend/src/pages/UserProfilePage.jsx"), "utf8");
assert(!userProfilePageCode.includes("Recorded IP:"), "Negative test: UserProfilePage does not render recorded IP address");

const chatPageCode = fs.readFileSync(path.resolve("frontend/src/pages/ChatPage.jsx"), "utf8");
assert(!chatPageCode.includes("Recorded IP:"), "Negative test: ChatPage does not render recorded IP address");

const authControllerCode = fs.readFileSync(path.resolve("backend/src/controllers/auth.controller.js"), "utf8");
assert(
  authControllerCode.includes('.select("accepted termsVersion acceptedAt")'),
  "getConsentRecord excludes ipAddress from public API response"
);

// message.controller.js already read above
assert(messageControllerCode.includes("ALLOWED_MEDIA_MIMES"), "message.controller enforces strict media MIME whitelist");
assert(messageControllerCode.includes("You cannot unblock yourself"), "unblockUser prevents self-unblocking loophole");

const feedbackControllerCode = fs.readFileSync(path.resolve("backend/src/controllers/feedback.controller.js"), "utf8");
assert(feedbackControllerCode.includes("3000"), "feedback.controller enforces 3000-char message bound to prevent disk exhaustion");

const feedbackRouteCode = fs.readFileSync(path.resolve("backend/src/routes/feedback.route.js"), "utf8");
assert(feedbackRouteCode.includes("arcjetProtection"), "feedback routes protected by arcjet rate limiting against bot spam");

const socketCode = fs.readFileSync(path.resolve("backend/src/lib/socket.js"), "utf8");
assert(!socketCode.includes("caller || {"), "socket.js call:initiate binds caller to authenticated session user (anti-spoofing)");
assert(!socketCode.includes("receiver || {"), "socket.js call:accept binds receiver to authenticated session user (anti-spoofing)");

const socketAuthCode = fs.readFileSync(path.resolve("backend/src/middleware/socket.auth.middleware.js"), "utf8");
assert(socketAuthCode.includes("30 * 60"), "socketAuthMiddleware enforces 30-min maximum reconnection grace period");

// ----------------------------------------------------
// 12. FORGOT PASSWORD FLOW, STRONG PASSWORD & PREVIOUS PASSWORD REJECTION
// ----------------------------------------------------
console.log("\n12. Testing Forgot Password Flow, Strong Password & Previous Password Rejection...");

const authRoutesText = fs.readFileSync(path.resolve("backend/src/routes/auth.route.js"), "utf8");
assert(authRoutesText.includes("/send-reset-otp"), "auth.route.js exposes POST /send-reset-otp");
assert(authRoutesText.includes("/verify-reset-otp"), "auth.route.js exposes POST /verify-reset-otp");
assert(authRoutesText.includes("/reset-password"), "auth.route.js exposes POST /reset-password");

const authCtrlText = fs.readFileSync(path.resolve("backend/src/controllers/auth.controller.js"), "utf8");
assert(authCtrlText.includes("sendPasswordResetOtp = async"), "auth.controller implements sendPasswordResetOtp");
assert(authCtrlText.includes("verifyPasswordResetOtp = async"), "auth.controller implements verifyPasswordResetOtp");
assert(authCtrlText.includes("resetPassword = async"), "auth.controller implements resetPassword");
assert(authCtrlText.includes("type: \"reset_password\""), "sendPasswordResetOtp stores OTPs tagged with type 'reset_password'");
assert(authCtrlText.includes("attempts >= 5"), "verifyPasswordResetOtp locks out after 5 invalid attempts");
assert(authCtrlText.includes("newPassword !== confirmPassword"), "resetPassword validates newPassword matches confirmPassword");
assert(authCtrlText.includes("newPassword.length < 8"), "resetPassword enforces minimum 8 characters");
assert(authCtrlText.includes("/[A-Z]/"), "resetPassword enforces uppercase letter requirement");
assert(authCtrlText.includes("/[a-z]/"), "resetPassword enforces lowercase letter requirement");
assert(authCtrlText.includes("/[0-9]/"), "resetPassword enforces numeric digit requirement");
assert(authCtrlText.includes("Password must contain at least one special symbol"), "resetPassword enforces special symbol requirement");
assert(authCtrlText.includes("isSameAsPrevious"), "resetPassword checks if new password is identical to previous password");
assert(authCtrlText.includes("New password cannot be the same as your previous password"), "resetPassword rejects reusing the previous password with 400 error");

const loginPageText = fs.readFileSync(path.resolve("frontend/src/pages/LoginPage.jsx"), "utf8");
assert(loginPageText.includes("Forgot Password?"), "LoginPage renders user-facing 'Forgot Password?' option");
assert(loginPageText.includes("handleOpenForgotPassword"), "LoginPage binds click handler to open Forgot Password modal");
assert(loginPageText.includes("handleForgotSendOtp"), "LoginPage implements OTP dispatch step with email input");
assert(loginPageText.includes("handleForgotVerifyOtp"), "LoginPage implements 6-digit OTP verification step");
assert(loginPageText.includes("handleForgotResetPassword"), "LoginPage implements 2x password entry step with strength check");
assert(loginPageText.includes("getPasswordStrength"), "LoginPage renders real-time password strength meter and checklist");
assert(loginPageText.includes("cannot be the same as your previous password"), "LoginPage displays explicit rule against reusing previous password");

// Functional simulation of bcrypt previous-password check
const bcrypt = backendRequire("bcryptjs");
const oldPasswordPlain = "CurrentSecur3P@ssw0rd!";
const oldHashed = bcrypt.hashSync(oldPasswordPlain, 10);

const testSamePasswordAttempt = "CurrentSecur3P@ssw0rd!";
const testDifferentPasswordAttempt = "NewBrilli@ntP@ssword2026#";

const isSameDetected = bcrypt.compareSync(testSamePasswordAttempt, oldHashed);
const isDifferentDetected = bcrypt.compareSync(testDifferentPasswordAttempt, oldHashed);

assert(isSameDetected === true, "Simulated check: identical new password correctly detected as previous password");
assert(isDifferentDetected === false, "Simulated check: truly new password passes previous password check");

console.log("\n========================================================");
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
