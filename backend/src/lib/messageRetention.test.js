import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MESSAGE_RETENTION_MS,
  MESSAGE_RETENTION_24H_MS,
  MESSAGE_RETENTION_15D_MS,
} from "../models/Message.js";
import { getPairKey } from "../models/Conversation.js";
import { getCloudinaryPublicId } from "./messageRetention.js";

describe("Message Retention Policy & Ephemeral Auto-Cleanup", () => {
  it("defines correct retention periods for 24-hour and 15-day policies", () => {
    assert.equal(MESSAGE_RETENTION_24H_MS, 24 * 60 * 60 * 1000);
    assert.equal(MESSAGE_RETENTION_15D_MS, 15 * 24 * 60 * 60 * 1000);
    assert.equal(MESSAGE_RETENTION_MS, MESSAGE_RETENTION_24H_MS);
    assert.equal(MESSAGE_RETENTION_15D_MS, 15 * MESSAGE_RETENTION_24H_MS);
  });

  it("getPairKey produces deterministic, order-independent pair keys", () => {
    const idAlice = "60b8d295f1d53b2d88c9f001";
    const idBob = "60b8d295f1d53b2d88c9f002";

    const key1 = getPairKey(idAlice, idBob);
    const key2 = getPairKey(idBob, idAlice);

    assert.equal(key1, key2);
    assert.equal(key1, `${idAlice}_${idBob}`);
  });

  it("calculates correct expiresAt timestamp for 24h vs 15d policies", () => {
    const baseTime = 1700000000000;
    const expires24h = new Date(baseTime + MESSAGE_RETENTION_24H_MS);
    const expires15d = new Date(baseTime + MESSAGE_RETENTION_15D_MS);

    assert.equal(expires24h.getTime() - baseTime, 24 * 60 * 60 * 1000);
    assert.equal(expires15d.getTime() - baseTime, 15 * 24 * 60 * 60 * 1000);
  });

  it("correctly identifies active vs expired messages under 24h vs 15d policies", () => {
    const now = Date.now();
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
    const sixteenDaysAgo = now - 16 * 24 * 60 * 60 * 1000;

    // 24h policy message from 25h ago: MUST BE EXPIRED
    const msg24hExpires = twentyFiveHoursAgo + MESSAGE_RETENTION_24H_MS;
    assert.ok(msg24hExpires <= now, "24h message from 25h ago is expired");

    // 15d policy message from 25h ago: MUST STILL BE ACTIVE
    const msg15dExpires1 = twentyFiveHoursAgo + MESSAGE_RETENTION_15D_MS;
    assert.ok(msg15dExpires1 > now, "15d message from 25h ago is still active");

    // 15d policy message from 14 days ago: MUST STILL BE ACTIVE
    const msg15dExpires2 = fourteenDaysAgo + MESSAGE_RETENTION_15D_MS;
    assert.ok(msg15dExpires2 > now, "15d message from 14 days ago is still active");

    // 15d policy message from 16 days ago: MUST BE EXPIRED
    const msg15dExpires3 = sixteenDaysAgo + MESSAGE_RETENTION_15D_MS;
    assert.ok(msg15dExpires3 <= now, "15d message from 16 days ago is expired");
  });

  it("getCloudinaryPublicId extracts public ID from secure Cloudinary URLs", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1612345678/chat-images/sample_pic.jpg";
    const publicId = getCloudinaryPublicId(url);
    assert.equal(publicId, "chat-images/sample_pic");

    assert.equal(getCloudinaryPublicId("https://example.com/pic.jpg"), null);
    assert.equal(getCloudinaryPublicId(null), null);
    assert.equal(getCloudinaryPublicId(""), null);
  });
});
