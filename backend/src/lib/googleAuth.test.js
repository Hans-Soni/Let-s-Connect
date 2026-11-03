import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ENV } from "./env.js";

describe("Google OAuth Configuration", () => {
  it("has valid GOOGLE_CLIENT_ID configured in environment", () => {
    assert.ok(ENV.GOOGLE_CLIENT_ID);
    assert.match(ENV.GOOGLE_CLIENT_ID, /^[0-9]+-[a-z0-9_]+\.apps\.googleusercontent\.com$/);
    assert.equal(
      ENV.GOOGLE_CLIENT_ID,
      "624896610383-ng9rkc9ocnqgk03npkkg4c12e8b24pkl.apps.googleusercontent.com"
    );
  });
});
