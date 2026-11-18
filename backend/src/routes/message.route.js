import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  markMessagesAsSeen,
  getUserProfile,
  deleteChatHistory,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getConversationRetention,
  updateConversationRetention,
  getPendingCallForUser,
  waitForIncomingCall,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// Long-polling endpoint for native mobile background services to receive incoming calls instantly
// Positioned before Arcjet cloud inspection to eliminate external network roundtrip latency
router.get("/wait-for-call", waitForIncomingCall);

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/blocked", getBlockedUsers);
router.get("/user/:id", getUserProfile);
router.get("/retention/:id", getConversationRetention);
router.post("/retention/:id", updateConversationRetention);
router.post("/block/:id", blockUser);
router.post("/unblock/:id", unblockUser);
router.delete("/history/:id", deleteChatHistory);
router.get("/pending-call", getPendingCallForUser);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.put("/seen/:id", markMessagesAsSeen);

export default router;
