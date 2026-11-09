import express from "express";
import {
  sendSignupOtp,
  signup,
  login,
  googleAuth,
  logout,
  updateProfile,
  getConsentRecord,
  changePassword,
  deleteAccount,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { generateToken } from "../lib/utils.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/send-signup-otp", sendSignupOtp);
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/logout", logout);

// Silent-refresh: re-issues a fresh 15-min JWT without forcing re-login.
// Cryptographically verifies the signature (using { ignoreExpiration: true })
// to ensure forged tokens cannot hijack arbitrary user accounts.
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.jwt || (req.headers.authorization?.split(" ")[1]);
    if (!token) return res.status(401).json({ message: "No token provided" });

    const keys = await import("../lib/keyRotation.js");
    let decoded;
    try {
      decoded = keys.verifyJwt(token, { ignoreExpiration: true });
    } catch {
      return res.status(401).json({ message: "Invalid or forged token signature" });
    }

    if (!decoded?.userId) return res.status(401).json({ message: "Invalid token payload" });

    const { default: User } = await import("../models/User.js");
    const user = await User.findById(decoded.userId).select("-password");
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
router.delete("/delete-account", protectRoute, deleteAccount);

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
