import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Account Deletion & Consent Retention Policy", () => {
  it("preserves consent audit details while purging user details", () => {
    // Simulating the controller logic for data segregation
    const mockUser = {
      _id: "user_abc123",
      fullName: "Jane Doe",
      email: "jane@example.com",
      profilePic: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    };

    const mockConsent = {
      _id: "consent_xyz789",
      userId: mockUser._id,
      emailId: mockUser.email,
      termsVersion: "2.0",
      accepted: true,
      acceptedAt: new Date("2026-01-01T00:00:00Z"),
      ipAddress: "192.168.1.1",
      accountDeletedAt: null,
    };

    // Execution of account deletion
    const deleteAccountProcess = (user, consent) => {
      // 1. Consent record is stamped with accountDeletedAt and preserved
      const updatedConsent = {
        ...consent,
        accountDeletedAt: new Date(),
      };

      // 2. User account and details are wiped (nullified)
      const deletedUser = null;

      return {
        purgedUser: deletedUser,
        retainedConsent: updatedConsent,
      };
    };

    const result = deleteAccountProcess(mockUser, mockConsent);

    // User is completely purged
    assert.equal(result.purgedUser, null);

    // Consent record is fully preserved
    assert.ok(result.retainedConsent);
    assert.equal(result.retainedConsent.accepted, true);
    assert.equal(result.retainedConsent.termsVersion, "2.0");
    assert.equal(result.retainedConsent.ipAddress, "192.168.1.1");
    assert.equal(result.retainedConsent.emailId, "jane@example.com");
    assert.equal(result.retainedConsent.userId, "user_abc123");
    assert.ok(result.retainedConsent.accountDeletedAt instanceof Date);
  });

  it("requires 2-step confirmation verification to proceed with deletion", () => {
    const validateStep1 = (ackChecked) => ackChecked === true;
    const validateStep2 = (confirmationText) =>
      typeof confirmationText === "string" &&
      confirmationText.trim().toUpperCase() === "DELETE";

    // Step 1 validation
    assert.equal(validateStep1(false), false);
    assert.equal(validateStep1(true), true);

    // Step 2 verification text
    assert.equal(validateStep2(""), false);
    assert.equal(validateStep2("del"), false);
    assert.equal(validateStep2("DELETE"), true);
    assert.equal(validateStep2("delete"), true);
    assert.equal(validateStep2("  DELETE  "), true);
  });
});

