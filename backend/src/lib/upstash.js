import Redis from "ioredis";

import { ENV } from "./env.js";

const redis = ENV.UPSTASH_REDIS_URL
  ? new Redis(ENV.UPSTASH_REDIS_URL, {
      tls: {},
      connectTimeout: 5000,
      commandTimeout: 5000,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 250, 2000),
    })
  : null;

if (redis) {
  redis.on("error", () => {
    console.error("Upstash Redis connection failed; Arcjet rate limiting will be used as fallback.");
  });
}

export default redis;
