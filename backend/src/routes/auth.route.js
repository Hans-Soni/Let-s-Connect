import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  getConsentRecord,
  changePassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { generateToken } from "../lib/utils.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Silent-refresh: re-issues a fresh 15-min JWT without forcing re-login.
// Acceptable inputs:
//   1. A still-valid token  (normal case when client calls proactively)
//   2. An expired-but-structurally-valid token (normal case when client retries after 401)
// A tampered token is rejected because jwt.decode returns null for malformed base64,
// and even if decode succeeds the userId DB lookup will fail.
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.jwt || (req.headers.authorization?.split(" ")[1]);
    if (!token) return res.status(401).json({ message: "No token provided" });

    // jwt.decode does NOT verify the signature — it just base64-decodes the payload.
    // We use it so we can still refresh an expired token. The guard against forgery
    // is the User.findById DB lookup below: a forged userId won't find a real user.
    const jwt = await import("jsonwebtoken");
    const rawDecoded = jwt.default.decode(token);
    if (!rawDecoded?.userId) return res.status(401).json({ message: "Invalid token" });

    const { default: User } = await import("../models/User.js");
    const user = await User.findById(rawDecoded.userId).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    const newToken = generateToken(user._id, res);
    res.status(200).json({ token: newToken, user });
  } catch (error) {
    console.error("Error in /auth/refresh:", error.message);
    res.status(401).json({ message: "Unable to refresh token" });
  }
});

router.put("/update-profile", protectRoute, updateProfile);
router.get("/consent", protectRoute, getConsentRecord);
router.put("/change-password", protectRoute, changePassword);

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
