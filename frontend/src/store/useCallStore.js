import { create } from "zustand";
import toast from "react-hot-toast";
import {
  playOutgoingRingtone,
  stopOutgoingRingtone,
  playIncomingRingtone,
  stopIncomingRingtone,
  playCallConnectedSound,
  playCallEndedSound,
} from "../lib/callSounds";
import { useAuthStore } from "./useAuthStore";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:openrelay.metered.ca:80" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection = null;
let pendingCandidates = [];
let callTimerInterval = null;
let callRingingTimeout = null;
let boundSocket = null;

const safelyAddCandidate = async (pc, candidateData) => {
  if (!pc || !candidateData) return;
  // If candidate is empty string or null, it's an end-of-candidate signal
  if (candidateData.candidate === "" || candidateData.candidate === null) {
    return;
  }
  try {
    const candidateObj =
      candidateData instanceof RTCIceCandidate
        ? candidateData
        : new RTCIceCandidate(candidateData);
    await pc.addIceCandidate(candidateObj);
  } catch (err) {
    console.warn("[Call] Error adding ICE candidate:", err);
  }
};

export const useCallStore = create((set, get) => ({
  callState: "idle", // 'idle' | 'outgoing' | 'incoming' | 'connected'
  callType: "video", // 'audio' | 'video'
  callPartner: null, // { _id, fullName, profilePic, ... }
  localStream: null,
  remoteStream: null,
  isMicMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  callDuration: 0,
  isFullscreen: false,

  // =========================================================================
  // SOCKET.IO SIGNALING LISTENERS REGISTRATION
  // =========================================================================
  initSocketListeners: (socket) => {
    if (!socket) return;
    if (boundSocket === socket) return;
    boundSocket = socket;

    console.log("[Call] Attaching WebRTC call signaling listeners to socket:", socket.id);

    // Incoming call from a peer
    socket.on("call:incoming", (data) => {
      console.log("[Call] Received call:incoming event:", data);
      get().handleIncomingCall(data);
    });

    // Remote peer accepted our call
    socket.on("call:accepted", (data) => {
      console.log("[Call] Received call:accepted event:", data);
      get().handleCallAccepted(data);
    });

    // Remote peer rejected or cancelled
    socket.on("call:rejected", ({ reason }) => {
      console.log("[Call] Received call:rejected event:", reason);
      toast(reason === "declined" ? "Call was declined" : "Call cancelled", { icon: "📵" });
      get().endCall(false);
    });

    // Call was ended by remote peer
    socket.on("call:ended", () => {
      console.log("[Call] Received call:ended event");
      toast("Call ended", { icon: "📞" });
      get().endCall(false);
    });

    // Remote peer is on another call
    socket.on("call:busy", () => {
      console.log("[Call] Received call:busy event");
      toast.error("User is currently on another call");
      get().endCall(false);
    });

    // Target user is offline
    socket.on("call:user-offline", ({ message }) => {
      console.log("[Call] Received call:user-offline event:", message);
      toast.error(message || "User is currently offline");
      get().endCall(false);
    });

    // WebRTC P2P signaling message (offer, answer, candidate)
    socket.on("webrtc:signal", async ({ senderId, signalData }) => {
      console.log("[Call] Received webrtc:signal event from:", senderId, signalData?.type);
      await get().handleWebRTCSignal(senderId, signalData);
    });
  },

  cleanupSocketListeners: (socket) => {
    const s = socket || boundSocket;
    if (s) {
      console.log("[Call] Detaching WebRTC call signaling listeners");
      s.off("call:incoming");
      s.off("call:accepted");
      s.off("call:rejected");
      s.off("call:ended");
      s.off("call:busy");
      s.off("call:user-offline");
      s.off("webrtc:signal");
    }
    boundSocket = null;
  },

  // =========================================================================
  // CALL LIFECYCLE HANDLERS
  // =========================================================================

  startOutgoingCall: async (partner, type = "audio") => {
    if (!partner || !partner._id) {
      toast.error("Please select a user to call");
      return;
    }

    const { authUser, socket } = useAuthStore.getState();
    if (!authUser) {
      toast.error("You must be logged in to make a call");
      return;
    }

    if (!socket || !socket.connected) {
      toast.error("Real-time network connection is unavailable. Please refresh the page.");
      return;
    }

    const partnerId = String(partner._id);
    console.log(`[Call] Initiating outgoing ${type} call to:`, partner.fullName, partnerId);

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            type === "video"
              ? {
                  width: { ideal: 1280, max: 1920 },
                  height: { ideal: 720, max: 1080 },
                  frameRate: { ideal: 30, max: 30 },
                  facingMode: "user",
                }
              : false,
        });
      } catch (mediaErr) {
        // Graceful fallback to voice if camera is busy or not found
        if (
          type === "video" &&
          (mediaErr.name === "NotFoundError" || mediaErr.name === "NotReadableError")
        ) {
          console.warn("[Call] Camera not accessible, falling back to voice only");
          toast("Camera not accessible. Starting voice call instead.", { icon: "🎙️" });
          type = "audio";
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
          });
        } else {
          throw mediaErr;
        }
      }

      set({
        callState: "outgoing",
        callType: type,
        callPartner: partner,
        localStream: stream,
        remoteStream: null,
        isMicMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        callDuration: 0,
      });

      playOutgoingRingtone();

      // 45s ringing timeout if no answer
      if (callRingingTimeout) clearTimeout(callRingingTimeout);
      callRingingTimeout = setTimeout(() => {
        if (get().callState === "outgoing") {
          toast("No answer", { icon: "⏳" });
          get().endCall(true);
        }
      }, 45000);

      socket.emit("call:initiate", {
        receiverId: partnerId,
        callType: type,
        caller: {
          _id: String(authUser._id),
          fullName: authUser.fullName,
          profilePic: authUser.profilePic,
        },
      });
    } catch (err) {
      console.error("[Call] Error accessing media devices:", err);
      let errorMsg = "Unable to access microphone/camera";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Microphone/Camera permission denied. Please allow permissions in browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No microphone device found on this computer.";
      }
      toast.error(errorMsg);
      get().resetCallState();
    }
  },

  handleIncomingCall: (data) => {
    const { socket } = useAuthStore.getState();

    // If currently busy in a call, reject with busy signal
    if (get().callState !== "idle") {
      console.log("[Call] Already busy, rejecting incoming call from:", data?.callerId);
      if (socket && socket.connected && data?.callerId) {
        socket.emit("call:busy", { callerId: String(data.callerId) });
      }
      return;
    }

    console.log("[Call] Presenting incoming call UI from:", data?.caller?.fullName);

    set({
      callState: "incoming",
      callType: data.callType || "audio",
      callPartner: data.caller,
      localStream: null,
      remoteStream: null,
      isMicMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      callDuration: 0,
    });

    playIncomingRingtone();

    // 45s auto timeout on incoming call
    if (callRingingTimeout) clearTimeout(callRingingTimeout);
    callRingingTimeout = setTimeout(() => {
      if (get().callState === "incoming") {
        get().rejectCall();
      }
    }, 45000);
  },

  acceptCall: async () => {
    if (callRingingTimeout) clearTimeout(callRingingTimeout);
    stopIncomingRingtone();

    let { callType, callPartner } = get();
    const { socket, authUser } = useAuthStore.getState();

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            callType === "video"
              ? {
                  width: { ideal: 1280, max: 1920 },
                  height: { ideal: 720, max: 1080 },
                  frameRate: { ideal: 30, max: 30 },
                  facingMode: "user",
                }
              : false,
        });
      } catch (mediaErr) {
        // Fallback to voice if camera cannot be opened
        if (
          callType === "video" &&
          (mediaErr.name === "NotFoundError" || mediaErr.name === "NotReadableError")
        ) {
          console.warn("[Call] Receiver camera not accessible, accepting as voice only");
          toast("Camera not accessible. Connecting with audio only.", { icon: "🎙️" });
          callType = "audio";
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
          });
        } else {
          throw mediaErr;
        }
      }

      set({
        callState: "connected",
        callType,
        localStream: stream,
      });

      playCallConnectedSound();
      get().startCallTimer();

      if (socket && socket.connected && callPartner?._id) {
        console.log("[Call] Emitting call:accept to caller:", callPartner._id);
        socket.emit("call:accept", {
          callerId: String(callPartner._id),
          receiver: {
            _id: String(authUser._id),
            fullName: authUser.fullName,
            profilePic: authUser.profilePic,
          },
        });
      }
    } catch (err) {
      console.error("[Call] Error accessing media devices on accept:", err);
      toast.error("Unable to access microphone/camera to accept the call.");
      get().rejectCall();
    }
  },

  handleCallAccepted: async (data) => {
    if (callRingingTimeout) clearTimeout(callRingingTimeout);
    stopOutgoingRingtone();
    stopIncomingRingtone();
    playCallConnectedSound();

    set({ callState: "connected" });
    get().startCallTimer();

    const { callPartner, callType } = get();
    const { socket } = useAuthStore.getState();

    if (!callPartner || !socket) return;
    const partnerId = String(callPartner._id);

    try {
      console.log("[Call] Initializing WebRTC Peer Connection and creating offer for:", partnerId);
      const pc = get().createPeerConnection(partnerId);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);
      console.log("[Call] Local SDP offer set successfully. Dispatching to partner...");

      socket.emit("webrtc:signal", {
        targetUserId: partnerId,
        signalData: {
          type: "offer",
          sdp: pc.localDescription.sdp,
        },
      });
    } catch (err) {
      console.error("[Call] Error creating WebRTC offer:", err);
      toast.error("Failed to establish peer media connection");
      get().endCall(true);
    }
  },

  rejectCall: () => {
    if (callRingingTimeout) clearTimeout(callRingingTimeout);
    const { callPartner, callState } = get();
    const { socket } = useAuthStore.getState();

    stopIncomingRingtone();
    stopOutgoingRingtone();
    playCallEndedSound();

    if (socket && socket.connected && callPartner?._id) {
      socket.emit("call:reject", {
        targetUserId: String(callPartner._id),
        reason: callState === "incoming" ? "declined" : "cancelled",
      });
    }

    get().resetCallState();
  },

  endCall: (notifyRemote = true) => {
    if (callRingingTimeout) clearTimeout(callRingingTimeout);
    const { callPartner } = get();
    const { socket } = useAuthStore.getState();

    stopIncomingRingtone();
    stopOutgoingRingtone();
    playCallEndedSound();

    if (notifyRemote && socket && socket.connected && callPartner?._id) {
      socket.emit("call:end", { targetUserId: String(callPartner._id) });
    }

    get().resetCallState();
  },

  // =========================================================================
  // WEBRTC PEER CONNECTION & SIGNALING LOGIC
  // =========================================================================

  createPeerConnection: (targetUserId) => {
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch (e) {}
      peerConnection = null;
    }

    const { localStream } = get();
    const { socket } = useAuthStore.getState();

    console.log("[Call] Creating RTCPeerConnection for target:", targetUserId);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection = pc;

    // Add local tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log(`[Call] Attaching local track (${track.kind}) to PC, enabled: ${track.enabled}`);
        pc.addTrack(track, localStream);
      });
    } else {
      console.warn("[Call] Local stream was not present when creating peer connection!");
    }

    // ICE Candidate generation -> send to peer via Socket.io
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && socket.connected) {
        socket.emit("webrtc:signal", {
          targetUserId: String(targetUserId),
          signalData: {
            type: "candidate",
            candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
          },
        });
      }
    };

    // Remote Track received -> display in UI
    pc.ontrack = (event) => {
      console.log(
        `[Call] Remote track received: kind=${event.track.kind}, id=${event.track.id}, readyState=${event.track.readyState}, enabled=${event.track.enabled}`
      );

      let incomingStream = event.streams && event.streams[0];
      let newStream;
      if (incomingStream) {
        newStream = new MediaStream(incomingStream.getTracks());
      } else {
        const existing = get().remoteStream;
        newStream = existing ? new MediaStream(existing.getTracks()) : new MediaStream();
        newStream.addTrack(event.track);
      }

      // Explicitly verify track enabled state
      newStream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });

      set({ remoteStream: newStream });
    };

    // ICE Connection state monitor
    pc.oniceconnectionstatechange = () => {
      console.log("[Call] ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.warn("[Call] ICE connection failed, attempting ICE restart...");
        if (typeof pc.restartIce === "function") {
          pc.restartIce();
        }
      }
    };

    // Overall WebRTC connection state monitor
    pc.onconnectionstatechange = () => {
      console.log("[Call] WebRTC connection state:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        console.warn("[Call] WebRTC connection dropped or failed");
      }
    };

    pc.onsignalingstatechange = () => {
      console.log("[Call] WebRTC signaling state:", pc.signalingState);
    };

    pc.onicegatheringstatechange = () => {
      console.log("[Call] WebRTC ICE gathering state:", pc.iceGatheringState);
    };

    return pc;
  },

  handleWebRTCSignal: async (senderId, signalData) => {
    const { socket } = useAuthStore.getState();
    if (!signalData) return;

    try {
      // 1. RECEIVER receives OFFER from caller
      if (signalData.type === "offer") {
        console.log("[Call] Receiver handling SDP offer from caller:", senderId);
        const pc = get().createPeerConnection(senderId);

        const sdpString = typeof signalData.sdp === "string" ? signalData.sdp : signalData.sdp?.sdp;
        await pc.setRemoteDescription(
          new RTCSessionDescription({
            type: "offer",
            sdp: sdpString,
          })
        );
        console.log("[Call] Remote description set for offer successfully");

        // Drain any pending ICE candidates buffered before the offer
        while (pendingCandidates.length > 0) {
          const cand = pendingCandidates.shift();
          await safelyAddCandidate(pc, cand);
        }

        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: get().callType === "video",
        });
        await pc.setLocalDescription(answer);
        console.log("[Call] Local SDP answer set, sending to caller:", senderId);

        if (socket && socket.connected) {
          socket.emit("webrtc:signal", {
            targetUserId: String(senderId),
            signalData: {
              type: "answer",
              sdp: pc.localDescription.sdp,
            },
          });
        }
      }

      // 2. CALLER receives ANSWER from receiver
      else if (signalData.type === "answer") {
        console.log("[Call] Caller handling SDP answer from receiver:", senderId);
        if (peerConnection) {
          const sdpString =
            typeof signalData.sdp === "string" ? signalData.sdp : signalData.sdp?.sdp;
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription({
              type: "answer",
              sdp: sdpString,
            })
          );
          console.log("[Call] Remote description set for answer successfully");

          // Drain any pending ICE candidates buffered before the answer
          while (pendingCandidates.length > 0) {
            const cand = pendingCandidates.shift();
            await safelyAddCandidate(peerConnection, cand);
          }
        }
      }

      // 3. Either peer receives ICE candidate
      else if (signalData.type === "candidate" && signalData.candidate) {
        if (
          peerConnection &&
          peerConnection.remoteDescription &&
          peerConnection.remoteDescription.type
        ) {
          await safelyAddCandidate(peerConnection, signalData.candidate);
        } else {
          // Buffer candidate until setRemoteDescription completes
          pendingCandidates.push(signalData.candidate);
        }
      }
    } catch (err) {
      console.error("[Call] Error processing WebRTC signal:", err);
    }
  },

  // =========================================================================
  // HARDWARE & MEDIA TOGGLES
  // =========================================================================

  toggleMic: () => {
    const { localStream, isMicMuted } = get();
    if (!localStream) return;

    const newMutedState = !isMicMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !newMutedState;
    });
    set({ isMicMuted: newMutedState });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff, callType } = get();
    if (!localStream || callType !== "video") return;

    const newCameraState = !isCameraOff;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !newCameraState;
    });
    set({ isCameraOff: newCameraState });
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, localStream } = get();

    if (isScreenSharing) {
      // Revert from screen share back to user camera
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        const newVideoTrack = cameraStream.getVideoTracks()[0];

        if (localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStream.removeTrack(oldTrack);
          }
          localStream.addTrack(newVideoTrack);
        }

        // Live replace track on the peer connection sender without renegotiation
        if (peerConnection) {
          const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(newVideoTrack).catch(console.error);
          }
        }

        set({ isScreenSharing: false, isCameraOff: false });
        toast("Screen sharing stopped", { icon: "💻" });
      } catch (e) {
        console.error("Failed to restore camera stream:", e);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          get().toggleScreenShare();
        };

        if (localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStream.removeTrack(oldTrack);
          }
          localStream.addTrack(screenTrack);
        }

        if (peerConnection) {
          const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack).catch(console.error);
          }
        }

        set({ isScreenSharing: true });
        toast("Screen sharing started", { icon: "🖥️" });
      } catch (err) {
        if (err.name !== "NotAllowedError") {
          console.error("Error starting screen share:", err);
          toast.error("Failed to share screen");
        }
      }
    }
  },

  toggleFullscreen: () => {
    set((state) => ({ isFullscreen: !state.isFullscreen }));
  },

  startCallTimer: () => {
    if (callTimerInterval) clearInterval(callTimerInterval);
    set({ callDuration: 0 });
    callTimerInterval = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
  },

  stopCallTimer: () => {
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
    }
  },

  resetCallState: () => {
    if (callRingingTimeout) {
      clearTimeout(callRingingTimeout);
      callRingingTimeout = null;
    }
    get().stopCallTimer();
    stopIncomingRingtone();
    stopOutgoingRingtone();

    // Close and nullify WebRTC Peer Connection
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch (e) {}
      peerConnection = null;
    }
    pendingCandidates = [];

    // Stop all local tracks (turns off hardware indicator light & mic)
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    set({
      callState: "idle",
      callPartner: null,
      localStream: null,
      remoteStream: null,
      isMicMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      callDuration: 0,
      isFullscreen: false,
    });
  },
}));
