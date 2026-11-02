import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanIp, isLocalOrPrivateIp, extractClientIp } from "./ipUtils.js";

describe("IP Utility Module", () => {
  describe("cleanIp", () => {
    it("strips ::ffff: prefix from IPv4-mapped IPv6", () => {
      assert.equal(cleanIp("::ffff:198.51.100.42"), "198.51.100.42");
    });

    it("normalizes ::1 to 127.0.0.1", () => {
      assert.equal(cleanIp("::1"), "127.0.0.1");
    });

    it("strips port from IPv4 string", () => {
      assert.equal(cleanIp("203.0.113.195:8080"), "203.0.113.195");
    });

    it("handles whitespace and empty input", () => {
      assert.equal(cleanIp("   203.0.113.5   "), "203.0.113.5");
      assert.equal(cleanIp(""), "");
      assert.equal(cleanIp(null), "");
    });
  });

  describe("isLocalOrPrivateIp", () => {
    it("identifies loopback addresses", () => {
      assert.equal(isLocalOrPrivateIp("127.0.0.1"), true);
      assert.equal(isLocalOrPrivateIp("::1"), true);
      assert.equal(isLocalOrPrivateIp("::ffff:127.0.0.1"), true);
    });

    it("identifies private RFC 1918 addresses", () => {
      assert.equal(isLocalOrPrivateIp("10.0.4.15"), true);
      assert.equal(isLocalOrPrivateIp("192.168.1.100"), true);
      assert.equal(isLocalOrPrivateIp("172.16.0.1"), true);
      assert.equal(isLocalOrPrivateIp("172.31.255.255"), true);
    });

    it("identifies public IP addresses as not local/private", () => {
      assert.equal(isLocalOrPrivateIp("8.8.8.8"), false);
      assert.equal(isLocalOrPrivateIp("103.212.145.22"), false);
      assert.equal(isLocalOrPrivateIp("2606:4700:4700::1111"), false);
    });
  });

  describe("extractClientIp", () => {
    it("prioritizes Cloudflare cf-connecting-ip", () => {
      const req = {
        headers: {
          "cf-connecting-ip": "103.212.145.22",
          "x-forwarded-for": "198.51.100.1, 10.0.0.1",
        },
        ip: "10.0.0.1",
      };
      assert.equal(extractClientIp(req), "103.212.145.22");
    });

    it("extracts leftmost public IP from x-forwarded-for", () => {
      const req = {
        headers: {
          "x-forwarded-for": "203.0.113.50, 10.0.0.1, 172.16.0.2",
        },
        ip: "127.0.0.1",
      };
      assert.equal(extractClientIp(req), "203.0.113.50");
    });

    it("extracts x-real-ip if present", () => {
      const req = {
        headers: {
          "x-real-ip": "198.51.100.88",
        },
        ip: "10.0.0.5",
      };
      assert.equal(extractClientIp(req), "198.51.100.88");
    });

    it("uses client-provided public IP when server sees only localhost/private", () => {
      const req = {
        headers: {},
        ip: "127.0.0.1",
        socket: { remoteAddress: "127.0.0.1" },
        body: { clientIp: "49.36.12.34" },
      };
      assert.equal(extractClientIp(req), "49.36.12.34");
    });

    it("ignores client-provided IP if it is invalid or private and falls back to socket IP", () => {
      const req = {
        headers: {},
        ip: "127.0.0.1",
        socket: { remoteAddress: "127.0.0.1" },
        body: { clientIp: "192.168.1.1" },
      };
      assert.equal(extractClientIp(req), "127.0.0.1");
    });

    it("falls back to 127.0.0.1 when req is missing or empty", () => {
      assert.equal(extractClientIp(null), "127.0.0.1");
      assert.equal(extractClientIp({}), "127.0.0.1");
    });
  });
});

