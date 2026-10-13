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
  const allowed = [
    ENV.CLIENT_URL,
    "https://hans-soni.github.io",
    "http://localhost:5173",
    "http://localhost:5002",
  ].filter(Boolean);

  if (
    allowed.includes(origin) ||
    origin.endsWith(".github.io") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  ) {
    return callback(null, true);
  }
  return callback(null, true);
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
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

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

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
