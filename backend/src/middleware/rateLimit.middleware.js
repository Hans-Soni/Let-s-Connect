import { createHash } from "crypto";

import { arcjetRateLimitFallback } from "../lib/arcjet.js";
import redis from "../lib/upstash.js";

const MAX_REQUESTS = 100;
const WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_SCRIPT = `
  local count = redis.call("INCR", KEYS[1])
  if count == 1 then
    redis.call("PEXPIRE", KEYS[1], ARGV[1])
  end
  return count
`;

export const createRateLimitMiddleware = ({
  redisClient,
  fallbackRateLimiter,
  maxRequests = MAX_REQUESTS,
  windowMs = WINDOW_MS,
  logger = console,
}) => {
  let missingRedisConfigurationReported = false;

  const useArcjetFallback = async (req, res, next) => {
    try {
      const decision = await fallbackRateLimiter.protect(req);

      if (decision.isDenied()) {
        return res.status(429).json({ message: "Rate limit exceeded. Please try again later." });
      }

      return next();
    } catch (error) {
      logger.error("Upstash and Arcjet rate limiting are both unavailable.", error);
      return res.status(503).json({
        message: "Rate limiting is temporarily unavailable. Please try again later.",
      });
    }
  };

  return async (req, res, next) => {
    if (!redisClient) {
      if (!missingRedisConfigurationReported) {
        logger.warn("UPSTASH_REDIS_URL is not configured; using Arcjet rate limiting fallback.");
        missingRedisConfigurationReported = true;
      }
      return useArcjetFallback(req, res, next);
    }

    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const ipHash = createHash("sha256").update(ip).digest("hex");
      const count = Number(
        await redisClient.eval(
          RATE_LIMIT_SCRIPT,
          1,
          `let-connect:api-rate-limit:${ipHash}`,
          windowMs,
        ),
      );

      if (!Number.isSafeInteger(count) || count < 1) {
        throw new Error("Upstash returned an invalid rate-limit count.");
      }

      if (count > maxRequests) {
        return useArcjetFallback(req, res, next);
      }

      return next();
    } catch (error) {
      logger.error("Upstash rate limiting failed; using Arcjet fallback.", error);
      return useArcjetFallback(req, res, next);
    }
  };
};

export const rateLimitMiddleware = createRateLimitMiddleware({
  redisClient: redis,
  fallbackRateLimiter: arcjetRateLimitFallback,
});
