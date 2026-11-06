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

  const allowedOrigins = [
    ENV.CLIENT_URL,
    "https://hans-soni.github.io",
    "http://localhost:5173",
    "http://localhost:5002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5002",
  ].filter(Boolean);

  if (
    allowedOrigins.includes(origin) ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.endsWith(".github.io") ||
    origin.endsWith(".onrender.com")
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

  // =========================================================================
  // WEBRTC CALL SIGNALING EVENTS
  // =========================================================================

  socket.on("call:initiate", ({ receiverId, callType, caller }) => {
    try {
      const targetUserId = receiverId?.toString();
      if (!targetUserId) return;

      const targetSocketId = getReceiverSocketId(targetUserId);

      // Fast check: If receiver is already in a call, inform caller immediately
      if (userActiveCallMap[targetUserId]) {
        socket.emit("call:busy", { receiverId: targetUserId, message: "User is currently on another call" });
        return;
      }

      if (targetSocketId) {
        io.to(targetSocketId).emit("call:incoming", {
          callerId: socket.userId.toString(),
          caller: caller || {
            _id: socket.user._id,
            fullName: socket.user.fullName,
            profilePic: socket.user.profilePic,
          },
          callType: callType || "audio",
        });
      } else {
        socket.emit("call:user-offline", {
          receiverId: targetUserId,
          message: "User is currently offline",
        });
      }
    } catch (err) {
      console.error("Error in call:initiate socket event:", err);
    }
  });

  socket.on("call:accept", ({ callerId, receiver }) => {
    try {
      const callerSocketId = getReceiverSocketId(callerId?.toString());
      if (callerSocketId) {
        userActiveCallMap[callerId.toString()] = socket.userId.toString();
        userActiveCallMap[socket.userId.toString()] = callerId.toString();
        io.to(callerSocketId).emit("call:accepted", {
          receiverId: socket.userId.toString(),
          receiver: receiver || {
            _id: socket.user._id,
            fullName: socket.user.fullName,
            profilePic: socket.user.profilePic,
          },
        });
      }
    } catch (err) {
      console.error("Error in call:accept socket event:", err);
    }
  });

  socket.on("call:reject", ({ targetUserId, reason }) => {
    try {
      delete userActiveCallMap[socket.userId.toString()];
      if (targetUserId) delete userActiveCallMap[targetUserId.toString()];

      const targetSocketId = getReceiverSocketId(targetUserId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:rejected", {
          by: socket.userId.toString(),
          reason: reason || "declined",
        });
      }
    } catch (err) {
      console.error("Error in call:reject socket event:", err);
    }
  });

  socket.on("call:end", ({ targetUserId }) => {
    try {
      delete userActiveCallMap[socket.userId.toString()];
      if (targetUserId) delete userActiveCallMap[targetUserId.toString()];

      const targetSocketId = getReceiverSocketId(targetUserId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:ended", {
          by: socket.userId.toString(),
        });
      }
    } catch (err) {
      console.error("Error in call:end socket event:", err);
    }
  });

  socket.on("call:busy", ({ callerId }) => {
    try {
      const callerSocketId = getReceiverSocketId(callerId?.toString());
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:busy", {
          by: socket.userId.toString(),
        });
      }
    } catch (err) {
      console.error("Error in call:busy socket event:", err);
    }
  });

  socket.on("webrtc:signal", ({ targetUserId, signalData }) => {
    try {
      const targetSocketId = getReceiverSocketId(targetUserId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:signal", {
          senderId: socket.userId.toString(),
          signalData,
        });
      }
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
      const partnerSocketId = getReceiverSocketId(partnerId);
      if (partnerSocketId) {
        io.to(partnerSocketId).emit("call:ended", {
          by: userId,
          reason: "disconnected",
        });
      }
      delete userActiveCallMap[userId];
      delete userActiveCallMap[partnerId];
    }

    io.emit("getOnlineUsers", Array.from(userSocketsMap.keys()));
  });
});

export { io, app, server };
