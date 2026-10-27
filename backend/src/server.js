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
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server, isOriginAllowed } from "./lib/socket.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.middleware.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

app.use("/api", rateLimitMiddleware);

app.use(express.json({ limit: "5mb" })); // req.body
app.use(cors({ origin: isOriginAllowed, credentials: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

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
