import Aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetprotection = async (req, res, next) => {
  try {
    if (!Aj) {
      return next();
    }

    const decision = await Aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
      }

      if (decision.reason.isBot()) {
        return res.status(403).json({ message: "Bot activity detected." });
      }

      return res.status(403).json({ message: "Request blocked by security policy." });
    }

    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({ message: "Suspicious bot activity detected." });
    }

    next();
  } catch (error) {
    console.error("Arcjet protection error:", error);
    next();
  }
};