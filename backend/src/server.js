import express from "express";
import dns from "dns";

try {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    console.log("Using custom DNS servers: 1.1.1.1, 8.8.8.8");
} catch (error) {
    console.warn("dns.setServers failed:", error);
}
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import feedbackRoutes from "./routes/feedback.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server, isOriginAllowed } from "./lib/socket.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.middleware.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

// Trust reverse proxies (Cloudflare, Render, Railway, AWS ALB, Nginx) so client IP is properly extracted
app.set("trust proxy", true);

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(mongoSanitize());
app.use(xss());

app.use("/api", rateLimitMiddleware);
app.use(cors({ origin: isOriginAllowed, credentials: true }));
app.use(cookieParser());

// Discovery & Compliance: RFC 9116 security.txt & LLM discovery manifests
const getDiscoveryPath = (relPath) => {
  const p1 = path.join(__dirname, "../frontend/public", relPath);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(__dirname, "frontend/public", relPath);
  if (fs.existsSync(p2)) return p2;
  const p3 = path.join(__dirname, "../frontend/dist", relPath);
  if (fs.existsSync(p3)) return p3;
  return null;
};

app.get(["/.well-known/security.txt", "/security.txt"], (req, res) => {
  const file = getDiscoveryPath(".well-known/security.txt") || getDiscoveryPath("security.txt");
  res.type("text/plain; charset=utf-8");
  if (file) {
    return res.sendFile(file);
  }
  return res.send(
    "Contact: mailto:samvada.real.time.chat@gmail.com\n" +
    "Expires: 2027-12-31T23:59:59.000Z\n" +
    "Preferred-Languages: en, hi\n" +
    "Canonical: https://hans-soni.github.io/Let-s-Connect/.well-known/security.txt\n" +
    "Policy: https://github.com/Hans-Soni/Let-s-Connect#security--privacy-architecture\n"
  );
});

app.get(["/llm.txt", "/llms.txt"], (req, res) => {
  const file = getDiscoveryPath("llm.txt") || getDiscoveryPath("llms.txt");
  if (file) {
    res.type("text/plain; charset=utf-8");
    return res.sendFile(file);
  }
  return res.status(404).send("llm.txt not found");
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/feedback", feedbackRoutes);

// make ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Connect to DB first, then initialise key rotation, then start listening.
// Key rotation needs Mongoose to be connected (it reads/writes the KeySet collection).
(async () => {
  try {
    await connectDB();

    // Import here (after connectDB) to avoid a circular import during module evaluation.
    const keys = await import("./lib/keyRotation.js");
    await keys.initKeyRotation();
    console.log("[keys] Key rotation initialised successfully.");

    server.listen(PORT, () => {
      console.log("Server running on port: " + PORT);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();
