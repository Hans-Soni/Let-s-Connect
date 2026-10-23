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
  ip: "203.0.113.8",
  socket: { remoteAddress: "203.0.113.8" },
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
