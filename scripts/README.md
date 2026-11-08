<div align="center">

# 📜 Samवाद — Automation & Security Scripts

**Cryptographic validation, database maintenance, and security verification tools.**

</div>

---

## 🌟 Overview

The `scripts/` directory houses standalone automation and system verification tools that operate independently of the running HTTP servers. These scripts are invoked via the root `package.json` test pipeline and maintenance workflows to verify data integrity, test security assertions, and maintain database indexes.

---

## 📂 File Directory & Contents

### 1. `securityCheck.js`
* **Purpose:** The official 27-point automated cryptographic and authorization security test suite.
* **Why it's here:** Guarantees that no deployment or pull request can break encryption, token validation, NoSQL injection defenses, or CORS access controls.
* **What it tests:**
  1. **AES-256-GCM Authenticated Encryption & Integrity:**
     - Verifies encrypted string format `enc:iv:authTag:ciphertext`.
     - Validates that IV and authentication tags are exactly 16 bytes (32 hex characters).
     - Confirms that tampered ciphertext or altered auth tags fail decryption and are rejected safely without crashing.
  2. **CORS Origin Restriction & Whitelist:**
     - Asserts that production domain `https://hans-soni.github.io` and dev servers (`http://localhost:5173`) are allowed.
     - Asserts that mobile native app origins (`http://localhost`, `capacitor://localhost`) and null origins (curl, mobile apps) are permitted.
     - Confirms that unauthorized domains (e.g. `https://evil-attacker.com`, rogue `.github.io` subdomains) are strictly rejected.
  3. **JWT Token Validation & Anti-Tampering:**
     - Validates signing, expiration handling, and signature tampering prevention.
     - Confirms that expired tokens can be safely verified during token refresh with `ignoreExpiration: true`.
     - Confirms that forged tokens signed with attacker keys are strictly rejected even if `ignoreExpiration: true` is passed (Anti-Takeover protection).
  4. **MongoDB ObjectId Sanitization:**
     - Asserts that valid 24-character hexadecimal IDs pass validation.
     - Asserts that malicious injections (`undefined`, `null`, `../etc/passwd`, `{$ne: null}`, SQL injection `' OR '1'='1`) are rejected before touching the database.
  5. **Block System Business Logic:**
     - Confirms that messaging is rejected when a user is blocked.
     - Confirms that blocked users receive a masked profile picture (`''`).
     - Verifies that private `blockedUsers` arrays are stripped from API responses to protect user privacy.
     - Confirms that self-blocking is prohibited.
* **How to run:**
  ```bash
  npm run security-check
  # or
  node scripts/securityCheck.js
  ```

---

### 2. `sortUsersInDB.js`
* **Purpose:** Database maintenance and indexing script.
* **Why it's here:** Connects directly to the MongoDB cluster and organizes or re-indexes user collections to optimize alphabetical search performance and query response times.
* **How to run:**
  ```bash
  npm run sort-db
  # or
  node scripts/sortUsersInDB.js
  ```

---

## 🚀 Running All Scripts

All verification scripts are automatically triggered as part of the unified repository test suite:
```bash
npm test
```
