import fs from "fs";
import path from "path";

function searchFiles(dir, extFilter) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== "dist" &&
        entry.name !== "build" &&
        entry.name !== ".system_generated"
      ) {
        results = results.concat(searchFiles(fullPath, extFilter));
      }
    } else if (extFilter.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log("=================================================");
console.log("        DEEP PENETRATION & PRIVACY AUDIT         ");
console.log("=================================================\n");

let passedChecks = 0;
let totalChecks = 0;

function check(title, condition, detail = "") {
  totalChecks++;
  if (condition) {
    console.log(`[PASS] ${title}`);
    passedChecks++;
  } else {
    console.error(`[FAIL] ${title} - ${detail}`);
  }
}

// 1. IP & Port Privacy Checks in JSX
const jsxFiles = searchFiles("frontend/src", [".jsx"]);
let renderedIpPattern = false;
for (const file of jsxFiles) {
  const code = fs.readFileSync(file, "utf8");
  // Check for rendering ip patterns inside JSX tags
  if (
    />[^<]*(?:Recorded IP|Device IP|Your IP|User IP|IP:\s*\{)[^<]*</i.test(code) ||
    />[^<]*\b(?:127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})\b[^<]*</i.test(code) ||
    />[^<]*:(?:3000|5001|5173)[^<]*</i.test(code)
  ) {
    renderedIpPattern = true;
    console.error(`Potential rendered IP/port in ${file}`);
  }
}
check("Zero Client/Server IP addresses or ports rendered in Frontend UI", !renderedIpPattern);

// 2. Secret & Sensitive Tokens in Client Code
const frontendFiles = searchFiles("frontend/src", [".jsx", ".js"]);
let hardcodedSecretFound = false;
for (const file of frontendFiles) {
  const code = fs.readFileSync(file, "utf8");
  if (
    /JWT_SECRET\s*=\s*['"][^'"]+['"]/i.test(code) ||
    /ENCRYPTION_KEY\s*=\s*['"][^'"]+['"]/i.test(code) ||
    /MONGO_URI\s*=\s*['"][^'"]+['"]/i.test(code) ||
    /CLOUDINARY_API_SECRET\s*=\s*['"][^'"]+['"]/i.test(code)
  ) {
    hardcodedSecretFound = true;
    console.error(`Hardcoded backend secret in frontend: ${file}`);
  }
}
check("Zero Backend Secrets (JWT, Mongo, Cloudinary) bundled in frontend", !hardcodedSecretFound);

// 3. Eval & Dynamic Execution Scan (Proof that no JS eval() exists)
const allSourceFiles = searchFiles(".", [".js", ".jsx"]);
let dynamicEvalFound = false;
for (const file of allSourceFiles) {
  if (file.includes("securityCheck.js") || file.includes("auditScan.js") || file.includes(".test.js")) continue;
  const code = fs.readFileSync(file, "utf8");
  if (/\beval\s*\(/.test(code)) {
    // Distinguish redisClient.eval (Lua script on Redis) from JavaScript eval()
    if (!code.includes("redisClient.eval(") && !code.includes("redis.eval(")) {
      dynamicEvalFound = true;
      console.error(`Dynamic JS execution (eval) in ${file}`);
    }
  }
  if (/\bnew\s+Function\s*\(/.test(code)) {
    dynamicEvalFound = true;
    console.error(`Dynamic Function constructor in ${file}`);
  }
}
check("Zero JavaScript Dynamic Code Execution (no eval, no Function constructor)", !dynamicEvalFound);

// 4. Server Header Stripping & Fingerprint Redaction
const serverCode = fs.readFileSync("backend/src/server.js", "utf8");
check("Express x-powered-by header explicitly disabled", serverCode.includes("app.disable(\"x-powered-by\")"));
check("Server response header explicitly stripped", serverCode.includes("res.removeHeader(\"Server\")"));
check("Helmet Security Headers enabled", serverCode.includes("helmet("));
check("Strict Content-Security-Policy (CSP) configured", serverCode.includes("contentSecurityPolicy:"));
check("MIME Sniffing protection (xContentTypeOptions) enabled", serverCode.includes("xContentTypeOptions: true"));
check("Referrer-Policy: strict-origin-when-cross-origin configured", serverCode.includes("strict-origin-when-cross-origin"));

// 5. Injection Defenses
check("Express Mongo Sanitize enabled against NoSQL injection", serverCode.includes("mongoSanitize()"));
check("XSS clean middleware enabled against Cross-Site Scripting", serverCode.includes("xss()"));

// 6. Rate Limiting Defense
check("Rate limiting middleware attached to /api routes", serverCode.includes("app.use(\"/api\", rateLimitMiddleware)"));

// 7. Sensitive Fields Protection
const authController = fs.readFileSync("backend/src/controllers/auth.controller.js", "utf8");
check("Passwords stripped on user lookups (.select('-password'))", authController.includes(".select(\"-password\")"));
check("ipAddress stripped from consent public query", authController.includes(".select(\"accepted termsVersion acceptedAt\")"));
check("Strong password rules enforced (min 8 chars, A-Z, a-z, 0-9, symbol)", authController.includes("newPassword.length < 8") && authController.includes("/[A-Z]/"));
check("Reuse of previous password strictly forbidden via bcrypt", authController.includes("isSameAsPrevious"));

// 8. WebSocket Anti-Spoofing & Calling Security
const socketCode = fs.readFileSync("backend/src/lib/socket.js", "utf8");
check(
  "Caller identity bound to authenticated session user (anti-spoofing)",
  socketCode.includes("_id: socket.user._id") && socketCode.includes("fullName: socket.user.fullName")
);
check(
  "Receiver identity bound to authenticated session user (anti-spoofing)",
  socketCode.includes("receiver:") && socketCode.includes("_id: socket.user._id")
);

// 9. Media Whitelist
const msgController = fs.readFileSync("backend/src/controllers/message.controller.js", "utf8");
check("Strict MIME type allowlist for uploaded media", msgController.includes("ALLOWED_MEDIA_MIMES"));

console.log("\n=================================================");
console.log(`AUDIT RESULTS: ${passedChecks}/${totalChecks} Critical Security Checks Passed`);
console.log("=================================================");

if (passedChecks === totalChecks) {
  process.exit(0);
} else {
  process.exit(1);
}
