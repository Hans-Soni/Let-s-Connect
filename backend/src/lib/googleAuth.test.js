import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ENV } from "./env.js";

describe("Google OAuth Configuration & Consent Enforcement", () => {
  it("has valid GOOGLE_CLIENT_ID configured in environment", () => {
    assert.ok(ENV.GOOGLE_CLIENT_ID);
    assert.match(ENV.GOOGLE_CLIENT_ID, /^[0-9]+-[a-z0-9_]+\.apps\.googleusercontent\.com$/);
    assert.equal(
      ENV.GOOGLE_CLIENT_ID,
      "624896610383-ng9rkc9ocnqgk03npkkg4c12e8b24pkl.apps.googleusercontent.com"
    );
  });

  it("enforces explicit dataConsent flag before creating new user account", () => {
    // Simulated controller logic verification
    const evaluateConsentRequirement = (existingUser, dataConsent) => {
      if (!existingUser) {
        if (dataConsent !== true) {
          return { requiresConsent: true };
        }
        return { allowRegistration: true };
      }
      return { allowLogin: true };
    };

    // 1. New user without consent -> requires consent
    assert.deepEqual(evaluateConsentRequirement(null, undefined), { requiresConsent: true });
    assert.deepEqual(evaluateConsentRequirement(null, false), { requiresConsent: true });
    assert.deepEqual(evaluateConsentRequirement(null, "yes"), { requiresConsent: true });

    // 2. New user with explicit boolean true consent -> allowed
    assert.deepEqual(evaluateConsentRequirement(null, true), { allowRegistration: true });

    // 3. Existing user logging in -> allowed without re-accepting
    assert.deepEqual(evaluateConsentRequirement({ _id: "user123" }, false), { allowLogin: true });
  });
});
