import { createRequire } from "module";
import http from "http";

const backendRequire = createRequire(new URL("../backend/package.json", import.meta.url));
const frontendRequire = createRequire(new URL("../frontend/package.json", import.meta.url));

const { Server } = backendRequire("socket.io");
const { io: Client } = frontendRequire("socket.io-client");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("       WEBRTC & SOCKET.IO SIGNALING PIPELINE TEST");
  console.log("========================================================\n");

  const server = http.createServer();
  const io = new Server(server, { cors: { origin: "*" } });

  const userSocketMap = {};
  const userActiveCallMap = {};

  io.use((socket, next) => {
    socket.userId = socket.handshake.query.userId;
    socket.user = {
      _id: socket.userId,
      fullName: `User_${socket.userId}`,
      profilePic: `https://example.com/pic_${socket.userId}.jpg`,
    };
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    userSocketMap[userId] = socket.id;

    socket.on("call:initiate", ({ receiverId, callType, caller }) => {
      const targetUserId = receiverId?.toString();
      if (!targetUserId) return;
      const targetSocketId = userSocketMap[targetUserId];

      if (userActiveCallMap[targetUserId]) {
        socket.emit("call:busy", { receiverId: targetUserId, message: "User is currently on another call" });
        return;
      }

      if (targetSocketId) {
        userActiveCallMap[socket.userId.toString()] = targetUserId;
        io.to(targetSocketId).emit("call:incoming", {
          callerId: socket.userId.toString(),
          caller: caller || socket.user,
          callType: callType || "audio",
        });
      } else {
        socket.emit("call:user-offline", {
          receiverId: targetUserId,
          message: "User is currently offline",
        });
      }
    });

    socket.on("call:accept", ({ callerId, receiver }) => {
      const callerSocketId = userSocketMap[callerId?.toString()];
      if (callerSocketId) {
        userActiveCallMap[callerId.toString()] = socket.userId.toString();
        userActiveCallMap[socket.userId.toString()] = callerId.toString();
        io.to(callerSocketId).emit("call:accepted", {
          receiverId: socket.userId.toString(),
          receiver: receiver || socket.user,
        });
      }
    });

    socket.on("call:reject", ({ targetUserId, reason }) => {
      delete userActiveCallMap[socket.userId.toString()];
      if (targetUserId) delete userActiveCallMap[targetUserId.toString()];
      const targetSocketId = userSocketMap[targetUserId?.toString()];
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:rejected", {
          by: socket.userId.toString(),
          reason: reason || "declined",
        });
      }
    });

    socket.on("call:end", ({ targetUserId }) => {
      delete userActiveCallMap[socket.userId.toString()];
      if (targetUserId) delete userActiveCallMap[targetUserId.toString()];
      const targetSocketId = userSocketMap[targetUserId?.toString()];
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:ended", {
          by: socket.userId.toString(),
        });
      }
    });

    socket.on("call:busy", ({ callerId }) => {
      const callerSocketId = userSocketMap[callerId?.toString()];
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:busy", {
          by: socket.userId.toString(),
        });
      }
    });

    socket.on("webrtc:signal", ({ targetUserId, signalData }) => {
      const targetSocketId = userSocketMap[targetUserId?.toString()];
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:signal", {
          senderId: socket.userId.toString(),
          signalData,
        });
      }
    });

    socket.on("disconnect", () => {
      const partnerId = userActiveCallMap[userId];
      if (partnerId) {
        const partnerSocketId = userSocketMap[partnerId];
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
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const serverUrl = `http://localhost:${port}`;

  console.log("1. Testing Client Connections & Handshake Authentication...");
  const alice = Client(serverUrl, { query: { userId: "user_alice" } });
  const bob = Client(serverUrl, { query: { userId: "user_bob" } });

  await Promise.all([
    new Promise((resolve) => alice.on("connect", resolve)),
    new Promise((resolve) => bob.on("connect", resolve)),
  ]);

  assert(alice.connected, "Alice socket connected successfully");
  assert(bob.connected, "Bob socket connected successfully");

  console.log("\n2. Testing Call Initiation & Offline Routing...");
  // Test offline user handling
  const offlinePromise = new Promise((resolve) => {
    alice.once("call:user-offline", (data) => {
      assert(data.receiverId === "user_offline", "Offline user triggers 'call:user-offline'");
      resolve();
    });
  });
  alice.emit("call:initiate", { receiverId: "user_offline", callType: "video" });
  await offlinePromise;

  console.log("\n3. Testing Full Call Initiation & Incoming Notification...");
  const incomingPromise = new Promise((resolve) => {
    bob.once("call:incoming", (data) => {
      assert(data.callerId === "user_alice", "Bob received 'call:incoming' from Alice");
      assert(data.callType === "video", "Call type correctly propagated as 'video'");
      assert(data.caller.fullName === "User_user_alice", "Caller metadata attached");
      resolve();
    });
  });
  alice.emit("call:initiate", {
    receiverId: "user_bob",
    callType: "video",
    caller: { _id: "user_alice", fullName: "User_user_alice" },
  });
  await incomingPromise;

  console.log("\n4. Testing Call Acceptance Flow...");
  const acceptedPromise = new Promise((resolve) => {
    alice.once("call:accepted", (data) => {
      assert(data.receiverId === "user_bob", "Alice received 'call:accepted' from Bob");
      resolve();
    });
  });
  bob.emit("call:accept", { callerId: "user_alice" });
  await acceptedPromise;

  console.log("\n5. Testing WebRTC SDP Offer / Answer Exchange Pipeline...");
  const sdpOfferData = { type: "offer", sdp: "v=0\r\no=alice 12345 2 IN IP4 127.0.0.1..." };
  const sdpAnswerData = { type: "answer", sdp: "v=0\r\no=bob 67890 2 IN IP4 127.0.0.1..." };

  const offerReceivedPromise = new Promise((resolve) => {
    bob.once("webrtc:signal", ({ senderId, signalData }) => {
      assert(senderId === "user_alice", "Bob received WebRTC signal from Alice");
      assert(signalData.type === "offer", "Signal payload is SDP 'offer'");
      assert(signalData.sdp === sdpOfferData.sdp, "SDP offer body matches exactly");
      resolve();
    });
  });
  alice.emit("webrtc:signal", { targetUserId: "user_bob", signalData: sdpOfferData });
  await offerReceivedPromise;

  const answerReceivedPromise = new Promise((resolve) => {
    alice.once("webrtc:signal", ({ senderId, signalData }) => {
      assert(senderId === "user_bob", "Alice received WebRTC signal from Bob");
      assert(signalData.type === "answer", "Signal payload is SDP 'answer'");
      assert(signalData.sdp === sdpAnswerData.sdp, "SDP answer body matches exactly");
      resolve();
    });
  });
  bob.emit("webrtc:signal", { targetUserId: "user_alice", signalData: sdpAnswerData });
  await answerReceivedPromise;

  console.log("\n6. Testing High-Frequency ICE Candidates Relay Pipeline...");
  const candidatePacket = { type: "candidate", candidate: { candidate: "candidate:1 1 UDP 2122260223 192.168.1.10 50000 typ host", sdpMid: "0" } };

  const iceRelayPromise = new Promise((resolve) => {
    bob.once("webrtc:signal", ({ signalData }) => {
      assert(signalData.type === "candidate", "ICE candidate packet relayed successfully");
      assert(signalData.candidate.sdpMid === "0", "ICE candidate structure intact");
      resolve();
    });
  });
  alice.emit("webrtc:signal", { targetUserId: "user_bob", signalData: candidatePacket });
  await iceRelayPromise;

  console.log("\n7. Testing Server-Side Active Call Busy Guard...");
  const charlie = Client(serverUrl, { query: { userId: "user_charlie" } });
  await new Promise((resolve) => charlie.on("connect", resolve));

  const busyPromise = new Promise((resolve) => {
    charlie.once("call:busy", (data) => {
      assert(data.receiverId === "user_bob", "Charlie calling Bob is immediately blocked with 'call:busy'");
      resolve();
    });
  });
  charlie.emit("call:initiate", { receiverId: "user_bob", callType: "audio" });
  await busyPromise;
  charlie.disconnect();

  console.log("\n8. Testing Normal Call Termination Flow...");
  const endCallPromise = new Promise((resolve) => {
    alice.once("call:ended", (data) => {
      assert(data.by === "user_bob", "Alice receives 'call:ended' when Bob hangs up");
      resolve();
    });
  });
  bob.emit("call:end", { targetUserId: "user_alice" });
  await endCallPromise;

  console.log("\n9. Testing Call Rejection / Cancellation Flow...");
  const rejectInitiatePromise = new Promise((resolve) => {
    bob.once("call:incoming", resolve);
  });
  alice.emit("call:initiate", { receiverId: "user_bob", callType: "audio" });
  await rejectInitiatePromise;

  const rejectedPromise = new Promise((resolve) => {
    alice.once("call:rejected", (data) => {
      assert(data.by === "user_bob", "Alice receives 'call:rejected'");
      assert(data.reason === "declined", "Rejection reason 'declined' matches");
      resolve();
    });
  });
  bob.emit("call:reject", { targetUserId: "user_alice", reason: "declined" });
  await rejectedPromise;

  console.log("\n10. Testing Abrupt Socket Disconnection Mid-Call Safeguard...");
  // Initiate call again between Alice & Bob
  const reconnectInitiate = new Promise((resolve) => bob.once("call:incoming", resolve));
  alice.emit("call:initiate", { receiverId: "user_bob", callType: "video" });
  await reconnectInitiate;

  const reconnectAccept = new Promise((resolve) => alice.once("call:accepted", resolve));
  bob.emit("call:accept", { callerId: "user_alice" });
  await reconnectAccept;

  // Now simulate Alice abruptly losing connection / closing tab
  const abruptDisconnectPromise = new Promise((resolve) => {
    bob.once("call:ended", (data) => {
      assert(data.by === "user_alice", "Bob notified that call ended when Alice disconnected");
      assert(data.reason === "disconnected", "Reason correctly identified as 'disconnected'");
      resolve();
    });
  });
  alice.disconnect();
  await abruptDisconnectPromise;

  bob.disconnect();
  server.close();

  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("========================================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

