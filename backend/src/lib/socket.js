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
    (origin.startsWith("http://localhost:") && ENV.NODE_ENV !== "production") ||
    (origin.startsWith("http://127.0.0.1:") && ENV.NODE_ENV !== "production")
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

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  if (!userId) return null;
  return userSocketMap[String(userId)];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}
const userActiveCallMap = {}; // {userId:partnerUserId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

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

      const senderSocketId = getReceiverSocketId(senderId?.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          chatPartnerId: receiverId.toString(),
          seenBy: receiverId.toString(),
        });
      }
    } catch (err) {
      console.log("Error in markMessagesSeen socket event:", err);
    }
  });

  socket.on("blockUser", ({ targetUserId }) => {
    try {
      const targetSocketId = getReceiverSocketId(targetUserId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("userBlocked", {
          blockerId: socket.userId.toString(),
        });
      }
    } catch (err) {
      console.log("Error in blockUser socket event:", err);
    }
  });

  socket.on("unblockUser", ({ targetUserId }) => {
    try {
      const targetSocketId = getReceiverSocketId(targetUserId?.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("userUnblocked", {
          blockerId: socket.userId.toString(),
        });
      }
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
    console.log("A user disconnected", socket.user.fullName);

    const partnerId = userActiveCallMap[userId];
    if (partnerId) {
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
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
