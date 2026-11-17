import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

export const isOriginAllowed = (origin, callback) => {
  // Allow requests with no origin (e.g. mobile apps, curl)
  if (!origin) return callback(null, true);

  const cleanOrigin = origin.replace(/\/+$/, "");

  const allowedOrigins = [
    ENV.CLIENT_URL,
    "https://hans-soni.github.io",
    "http://localhost:5173",
    "http://localhost:5002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5002",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    "ionic://localhost",
  ]
    .filter(Boolean)
    .map((o) => o.replace(/\/+$/, ""));

  if (
    allowedOrigins.includes(cleanOrigin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin) ||
    /^capacitor:\/\/localhost(:\d+)?$/.test(cleanOrigin)
  ) {
    return callback(null, true);
  }

  return callback(new Error("CORS origin not allowed"), false);
};

const io = new Server(server, {
  cors: {
    origin: isOriginAllowed,
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// Map of userId -> Set of socket IDs (supports multiple tabs / devices per user)
const userSocketsMap = new Map();
const userActiveCallMap = {}; // {userId: partnerUserId}
// Map of targetUserId -> { callerId, caller, callType, createdAt, timeoutId }
const pendingCallInvites = new Map();

// Helper to get any active socket ID for this user (used for WebRTC signaling)
export function getReceiverSocketId(userId) {
  if (!userId) return null;
  const sockets = userSocketsMap.get(String(userId));
  if (!sockets || sockets.size === 0) return null;
  return Array.from(sockets)[0];
}

// Check if a user has at least one active connected socket
export function isUserOnline(userId) {
  if (!userId) return false;
  const sockets = userSocketsMap.get(String(userId));
  return Boolean(sockets && sockets.size > 0);
}

io.on("connection", (socket) => {
  const userId = socket.userId;
  // Automatically join private room for targeted broadcasts (delivers to all tabs of this user)
  socket.join(userId);

  if (!userSocketsMap.has(userId)) {
    userSocketsMap.set(userId, new Set());
  }
  userSocketsMap.get(userId).add(socket.id);

  console.log(`User connected: ${socket.user.fullName} (${userId}), sockets: ${userSocketsMap.get(userId).size}`);

  // Broadcast list of currently online user IDs to all clients
  io.emit("getOnlineUsers", Array.from(userSocketsMap.keys()));

  // Deliver active pending call invite if incoming call arrived while device was reconnecting
  if (pendingCallInvites.has(userId)) {
    const invite = pendingCallInvites.get(userId);
    if (Date.now() - invite.createdAt < 45000) {
      console.log(`[Call] Delivering pending call to reconnected user: ${userId}`);
      socket.emit("call:incoming", {
        callerId: invite.callerId,
        caller: invite.caller,
        callType: invite.callType,
      });
    } else {
      clearTimeout(invite.timeoutId);
      pendingCallInvites.delete(userId);
    }
  }

  // with socket.on we listen for events from clients
  socket.on("markMessagesSeen", async ({ senderId }) => {
    try {
      if (!senderId) return;
      const receiverId = socket.userId;
      const Message = (await import("../models/Message.js")).default;
      await Message.updateMany(
        { senderId, receiverId, isSeen: { $ne: true } },
        { $set: { isSeen: true, seenAt: new Date() } }
      ).catch(() => {});

      // Emit to sender's room so all sender sockets update
      io.to(senderId.toString()).emit("messagesSeen", {
        chatPartnerId: receiverId.toString(),
        seenBy: receiverId.toString(),
      });
    } catch (err) {
      console.log("Error in markMessagesSeen socket event:", err);
    }
  });

  socket.on("blockUser", ({ targetUserId }) => {
    try {
      if (!targetUserId) return;
      io.to(targetUserId.toString()).emit("userBlocked", {
        blockerId: socket.userId.toString(),
      });
    } catch (err) {
      console.log("Error in blockUser socket event:", err);
    }
  });

  socket.on("unblockUser", ({ targetUserId }) => {
    try {
      if (!targetUserId) return;
      io.to(targetUserId.toString()).emit("userUnblocked", {
        blockerId: socket.userId.toString(),
      });
    } catch (err) {
      console.log("Error in unblockUser socket event:", err);
    }
  });

  socket.on("typing", ({ receiverId }) => {
    try {
      if (!receiverId) return;
      io.to(receiverId.toString()).emit("typing", {
        senderId: socket.userId.toString(),
      });
    } catch (err) {
      console.log("Error in typing socket event:", err);
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    try {
      if (!receiverId) return;
      io.to(receiverId.toString()).emit("stopTyping", {
        senderId: socket.userId.toString(),
      });
    } catch (err) {
      console.log("Error in stopTyping socket event:", err);
    }
  });

  socket.on("messageReaction", ({ messageId, receiverId, emoji }) => {
    try {
      if (!receiverId || !messageId || !emoji) return;
      if (typeof emoji !== "string" || emoji.length > 20) return;
      io.to(receiverId.toString()).emit("messageReaction", {
        messageId: String(messageId).slice(0, 50),
        emoji: emoji.slice(0, 20),
        userId: socket.userId.toString(),
      });
    } catch (err) {
      console.log("Error in messageReaction socket event:", err);
    }
  });

  // =========================================================================
  // WEBRTC CALL SIGNALING EVENTS
  // =========================================================================

  socket.on("call:initiate", async ({ receiverId, callType, caller }) => {
    try {
      const targetUserId = receiverId?.toString();
      if (!targetUserId) return;
      const callerUserId = socket.userId.toString();

      // Fast check: If receiver is already in a call, inform caller immediately
      if (userActiveCallMap[targetUserId]) {
        socket.emit("call:busy", { receiverId: targetUserId, message: "User is currently on another call" });
        return;
      }

      // Check if user has active connected socket
      const isOnline = isUserOnline(targetUserId);

      // Check if user has installed the app (Android Capacitor / PWA)
      let isTargetAppInstalled = false;
      try {
        const User = (await import("../models/User.js")).default;
        const targetUser = await User.findById(targetUserId).select("isAppInstalled");
        if (targetUser?.isAppInstalled) {
          isTargetAppInstalled = true;
        }
      } catch (dbErr) {
        console.error("Error checking target user install status:", dbErr);
      }

      // If user is neither online nor has the app installed, report offline
      if (!isOnline && !isTargetAppInstalled) {
        socket.emit("call:user-offline", {
          receiverId: targetUserId,
          message: "User is currently offline",
        });
        return;
      }

      // User is either online or has app installed!
      // Inform caller that target device is ringing
      socket.emit("call:ringing", {
        receiverId: targetUserId,
        isAppInstalled: isTargetAppInstalled,
      });

      // Clear any previous invite for this target
      if (pendingCallInvites.has(targetUserId)) {
        clearTimeout(pendingCallInvites.get(targetUserId).timeoutId);
        pendingCallInvites.delete(targetUserId);
      }

      const incomingPayload = {
        callerId: callerUserId,
        caller: {
          _id: socket.user._id,
          fullName: socket.user.fullName,
          profilePic: socket.user.profilePic,
        },
        callType: callType === "video" ? "video" : "audio",
      };

      // Set 45s ringing timeout
      const timeoutId = setTimeout(() => {
        if (pendingCallInvites.has(targetUserId)) {
          pendingCallInvites.delete(targetUserId);
          io.to(callerUserId).emit("call:rejected", {
            by: targetUserId,
            reason: "no-answer",
          });
          io.to(targetUserId).emit("call:ended", {
            by: callerUserId,
            reason: "timeout",
          });
        }
      }, 45000);

      pendingCallInvites.set(targetUserId, {
        ...incomingPayload,
        timeoutId,
        createdAt: Date.now(),
      });

      // Deliver incoming call to all connected sockets of the target user
      io.to(targetUserId).emit("call:incoming", incomingPayload);
    } catch (err) {
      console.error("Error in call:initiate socket event:", err);
    }
  });

  socket.on("call:accept", ({ callerId, receiver }) => {
    try {
      const callerUserId = callerId?.toString();
      const receiverUserId = socket.userId.toString();

      if (pendingCallInvites.has(receiverUserId)) {
        clearTimeout(pendingCallInvites.get(receiverUserId).timeoutId);
        pendingCallInvites.delete(receiverUserId);
      }

      userActiveCallMap[callerUserId] = receiverUserId;
      userActiveCallMap[receiverUserId] = callerUserId;

      io.to(callerUserId).emit("call:accepted", {
        receiverId: receiverUserId,
        receiver: {
          _id: socket.user._id,
          fullName: socket.user.fullName,
          profilePic: socket.user.profilePic,
        },
      });
    } catch (err) {
      console.error("Error in call:accept socket event:", err);
    }
  });

  socket.on("call:reject", ({ targetUserId, reason }) => {
    try {
      const currentUserId = socket.userId.toString();
      if (pendingCallInvites.has(currentUserId)) {
        clearTimeout(pendingCallInvites.get(currentUserId).timeoutId);
        pendingCallInvites.delete(currentUserId);
      }
      if (targetUserId && pendingCallInvites.has(targetUserId.toString())) {
        clearTimeout(pendingCallInvites.get(targetUserId.toString()).timeoutId);
        pendingCallInvites.delete(targetUserId.toString());
      }

      delete userActiveCallMap[currentUserId];
      if (targetUserId) delete userActiveCallMap[targetUserId.toString()];

      if (targetUserId) {
        io.to(targetUserId.toString()).emit("call:rejected", {
          by: currentUserId,
          reason: reason || "declined",
        });
      }
    } catch (err) {
      console.error("Error in call:reject socket event:", err);
    }
  });

  socket.on("call:end", ({ targetUserId }) => {
    try {
      const currentUserId = socket.userId.toString();
      if (pendingCallInvites.has(currentUserId)) {
        clearTimeout(pendingCallInvites.get(currentUserId).timeoutId);
        pendingCallInvites.delete(currentUserId);
      }
      if (targetUserId && pendingCallInvites.has(targetUserId.toString())) {
        clearTimeout(pendingCallInvites.get(targetUserId.toString()).timeoutId);
        pendingCallInvites.delete(targetUserId.toString());
      }

      delete userActiveCallMap[currentUserId];
      if (targetUserId) delete userActiveCallMap[targetUserId.toString()];

      if (targetUserId) {
        io.to(targetUserId.toString()).emit("call:ended", {
          by: currentUserId,
        });
      }
    } catch (err) {
      console.error("Error in call:end socket event:", err);
    }
  });

  socket.on("call:busy", ({ callerId }) => {
    try {
      if (callerId) {
        io.to(callerId.toString()).emit("call:busy", {
          by: socket.userId.toString(),
        });
      }
    } catch (err) {
      console.error("Error in call:busy socket event:", err);
    }
  });

  socket.on("webrtc:signal", ({ targetUserId, signalData }) => {
    try {
      if (!targetUserId) return;
      io.to(targetUserId.toString()).emit("webrtc:signal", {
        senderId: socket.userId.toString(),
        signalData,
      });
    } catch (err) {
      console.error("Error in webrtc:signal socket event:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.user?.fullName || userId} (${socket.id})`);

    const sockets = userSocketsMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSocketsMap.delete(userId);
      }
    }

    const partnerId = userActiveCallMap[userId];
    if (partnerId && (!userSocketsMap.has(userId) || userSocketsMap.get(userId).size === 0)) {
      io.to(partnerId.toString()).emit("call:ended", {
        by: userId,
        reason: "disconnected",
      });
      delete userActiveCallMap[userId];
      delete userActiveCallMap[partnerId];
    }

    io.emit("getOnlineUsers", Array.from(userSocketsMap.keys()));
  });
});

export { io, app, server };
