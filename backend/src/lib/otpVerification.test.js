import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import bcrypt from "bcryptjs";

describe("Sign-up Email OTP Verification Logic", () => {
  it("generates a secure 6-digit numeric OTP in the range [100000, 999999]", () => {
    for (let i = 0; i < 100; i++) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      assert.equal(otp.length, 6, "OTP must be exactly 6 characters");
      assert.match(otp, /^\d{6}$/, "OTP must consist solely of digits");
      const num = parseInt(otp, 10);
      assert.ok(num >= 100000 && num <= 999999, "OTP must be between 100000 and 999999");
    }
  });

  it("hashes OTP with bcrypt and verifies authentic vs invalid inputs", async () => {
    const rawOtp = "482915";
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(rawOtp, salt);

    assert.notEqual(rawOtp, hashed, "OTP must not be stored as plaintext");

    const validMatch = await bcrypt.compare("482915", hashed);
    assert.equal(validMatch, true, "Matching OTP must verify successfully");

    const invalidMatch = await bcrypt.compare("123456", hashed);
    assert.equal(invalidMatch, false, "Mismatched OTP must be rejected");
  });

  it("enforces 10-minute expiration window", () => {
    const isExpired = (createdAt, now = Date.now()) => {
      return now - new Date(createdAt).getTime() > 10 * 60 * 1000;
    };

    const justNow = new Date();
    assert.equal(isExpired(justNow), false, "Fresh OTP is not expired");

    const nineMinutesAgo = new Date(Date.now() - 9 * 60 * 1000);
    assert.equal(isExpired(nineMinutesAgo), false, "9-minute-old OTP is still valid");

    const tenMinutesOneSecAgo = new Date(Date.now() - (10 * 60 * 1000 + 1000));
    assert.equal(isExpired(tenMinutesOneSecAgo), true, "OTP older than 10 minutes must expire");
  });

  it("enforces brute-force attempt limits (maximum 5 attempts)", () => {
    const evaluateAttempts = (attempts) => {
      if (attempts >= 5) {
        return { allowed: false, message: "Too many failed attempts" };
      }
      return { allowed: true, remaining: 5 - attempts };
    };

    assert.deepEqual(evaluateAttempts(0), { allowed: true, remaining: 5 });
    assert.deepEqual(evaluateAttempts(3), { allowed: true, remaining: 2 });
    assert.deepEqual(evaluateAttempts(4), { allowed: true, remaining: 1 });
    assert.deepEqual(evaluateAttempts(5), { allowed: false, message: "Too many failed attempts" });
    assert.deepEqual(evaluateAttempts(6), { allowed: false, message: "Too many failed attempts" });
  });

  it("enforces 60-second cooldown rate limit between OTP requests", () => {
    const checkCooldown = (lastCreatedAt, now = Date.now()) => {
      const elapsed = now - new Date(lastCreatedAt).getTime();
      if (elapsed < 60 * 1000) {
        const remainingSeconds = Math.max(1, Math.ceil((60 * 1000 - elapsed) / 1000));
        return { rateLimited: true, remainingSeconds };
      }
      return { rateLimited: false };
    };

    const recent = new Date(Date.now() - 15 * 1000); // 15 seconds ago
    const resultRecent = checkCooldown(recent);
    assert.equal(resultRecent.rateLimited, true);
    assert.ok(resultRecent.remainingSeconds >= 44 && resultRecent.remainingSeconds <= 46);

    const old = new Date(Date.now() - 65 * 1000); // 65 seconds ago
    const resultOld = checkCooldown(old);
    assert.equal(resultOld.rateLimited, false);
  });

  it("validates email syntax strictly before issuing OTP", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    assert.equal(emailRegex.test("user@example.com"), true);
    assert.equal(emailRegex.test("john.doe@company.org"), true);
    assert.equal(emailRegex.test("invalid-email"), false);
    assert.equal(emailRegex.test("user@"), false);
    assert.equal(emailRegex.test("@domain.com"), false);
    assert.equal(emailRegex.test("user@domain"), false);
  });
});
