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
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection = null;
let pendingCandidates = [];
let callTimerInterval = null;
let boundSocket = null;

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

    // Incoming call from a peer
    socket.on("call:incoming", (data) => {
      get().handleIncomingCall(data);
    });

    // Remote peer accepted our call
    socket.on("call:accepted", (data) => {
      get().handleCallAccepted(data);
    });

    // Remote peer rejected or cancelled
    socket.on("call:rejected", ({ reason }) => {
      toast(reason === "declined" ? "Call was declined" : "Call cancelled", { icon: "📵" });
      get().endCall(false);
    });

    // Call was ended by remote peer
    socket.on("call:ended", () => {
      toast("Call ended", { icon: "📞" });
      get().endCall(false);
    });

    // Remote peer is on another call
    socket.on("call:busy", () => {
      toast.error("User is on another call");
      get().endCall(false);
    });

    // Target user is offline
    socket.on("call:user-offline", ({ message }) => {
      toast.error(message || "User is currently offline");
      get().endCall(false);
    });

    // WebRTC P2P signaling message (offer, answer, candidate)
    socket.on("webrtc:signal", async ({ senderId, signalData }) => {
      await get().handleWebRTCSignal(senderId, signalData);
    });
  },

  cleanupSocketListeners: (socket) => {
    const s = socket || boundSocket;
    if (s) {
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
      toast.error("Real-time network connection is unavailable. Please wait a moment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: type === "video" ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: "user",
        } : false,
      });

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

      socket.emit("call:initiate", {
        receiverId: partner._id,
        callType: type,
        caller: {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic,
        },
      });
    } catch (err) {
      console.error("Error accessing media devices for call:", err);
      let errorMsg = "Unable to access microphone/camera";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Microphone/Camera permission denied. Please allow permissions in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No microphone or camera device found on this system.";
      }
      toast.error(errorMsg);
      get().resetCallState();
    }
  },

  handleIncomingCall: (data) => {
    const { socket } = useAuthStore.getState();

    // If currently busy in a call, reject with busy signal
    if (get().callState !== "idle") {
      if (socket && socket.connected && data?.callerId) {
        socket.emit("call:busy", { callerId: data.callerId });
      }
      return;
    }

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
  },

  acceptCall: async () => {
    stopIncomingRingtone();
    const { callType, callPartner } = get();
    const { socket, authUser } = useAuthStore.getState();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: callType === "video" ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: "user",
        } : false,
      });

      set({
        callState: "connected",
        localStream: stream,
      });

      playCallConnectedSound();
      get().startCallTimer();

      if (socket && socket.connected && callPartner?._id) {
        socket.emit("call:accept", {
          callerId: callPartner._id,
          receiver: {
            _id: authUser._id,
            fullName: authUser.fullName,
            profilePic: authUser.profilePic,
          },
        });
      }
    } catch (err) {
      console.error("Error accessing media devices on accept:", err);
      toast.error("Unable to access microphone/camera to accept the call.");
      get().rejectCall();
    }
  },

  handleCallAccepted: async (data) => {
    stopOutgoingRingtone();
    stopIncomingRingtone();
    playCallConnectedSound();

    set({ callState: "connected" });
    get().startCallTimer();

    const { callPartner, localStream, callType } = get();
    const { socket } = useAuthStore.getState();

    if (!callPartner || !socket) return;

    try {
      // Caller initiates the WebRTC offer
      const pc = get().createPeerConnection(callPartner._id);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);

      socket.emit("webrtc:signal", {
        targetUserId: callPartner._id,
        signalData: {
          type: "offer",
          sdp: pc.localDescription,
        },
      });
    } catch (err) {
      console.error("Error creating WebRTC offer:", err);
      toast.error("Failed to establish peer media connection");
      get().endCall(true);
    }
  },

  rejectCall: () => {
    const { callPartner, callState } = get();
    const { socket } = useAuthStore.getState();

    stopIncomingRingtone();
    stopOutgoingRingtone();
    playCallEndedSound();

    if (socket && socket.connected && callPartner?._id) {
      socket.emit("call:reject", {
        targetUserId: callPartner._id,
        reason: callState === "incoming" ? "declined" : "cancelled",
      });
    }

    get().resetCallState();
  },

  endCall: (notifyRemote = true) => {
    const { callPartner } = get();
    const { socket } = useAuthStore.getState();

    stopIncomingRingtone();
    stopOutgoingRingtone();
    playCallEndedSound();

    if (notifyRemote && socket && socket.connected && callPartner?._id) {
      socket.emit("call:end", { targetUserId: callPartner._id });
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

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection = pc;
    pendingCandidates = [];

    // Add local audio and video tracks to the peer connection with bitrate tuning
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, localStream);
        try {
          if (track.kind === "video" && sender) {
            const params = sender.getParameters();
            if (params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = 1500000; // 1.5 Mbps target
              params.encodings[0].maxFramerate = 30;
              params.degradationPreference = "maintain-framerate";
              sender.setParameters(params).catch(() => {});
            }
          } else if (track.kind === "audio" && sender) {
            const params = sender.getParameters();
            if (params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = 64000; // 64 kbps Opus target
              sender.setParameters(params).catch(() => {});
            }
          }
        } catch (e) {}
      });
    }

    // ICE Candidate generation -> send to peer via Socket.io
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && socket.connected) {
        socket.emit("webrtc:signal", {
          targetUserId,
          signalData: {
            type: "candidate",
            candidate: event.candidate,
          },
        });
      }
    };

    // Remote Track received -> display in UI
    pc.ontrack = (event) => {
      const [remoteMediaStream] = event.streams;
      if (remoteMediaStream) {
        set({ remoteStream: remoteMediaStream });
      }
    };

    // Connection state monitor
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        console.warn("WebRTC connection state:", pc.connectionState);
      }
    };

    return pc;
  },

  handleWebRTCSignal: async (senderId, signalData) => {
    const { socket } = useAuthStore.getState();
    if (!signalData) return;

    try {
      // 1. RECEIVER receives OFFER from caller
      if (signalData.type === "offer") {
        const pc = get().createPeerConnection(senderId);

        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

        // Drain any pending ICE candidates that arrived before the remote description was set
        while (pendingCandidates.length > 0) {
          const cand = pendingCandidates.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn("Error adding queued ICE candidate:", e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socket && socket.connected) {
          socket.emit("webrtc:signal", {
            targetUserId: senderId,
            signalData: {
              type: "answer",
              sdp: pc.localDescription,
            },
          });
        }
      }

      // 2. CALLER receives ANSWER from receiver
      else if (signalData.type === "answer") {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

          // Drain any pending ICE candidates
          while (pendingCandidates.length > 0) {
            const cand = pendingCandidates.shift();
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn("Error adding queued ICE candidate:", e);
            }
          }
        }
      }

      // 3. Either peer receives ICE candidate
      else if (signalData.type === "candidate" && signalData.candidate) {
        if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } catch (err) {
            console.warn("Error adding ICE candidate:", err);
          }
        } else {
          // Buffer candidate until setRemoteDescription completes
          pendingCandidates.push(signalData.candidate);
        }
      }
    } catch (err) {
      console.error("Error processing WebRTC signal:", err);
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

        // Browser built-in "Stop sharing" bar listener
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

        // Live replace track on the peer connection sender
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

    // Stop all local tracks (turns off camera indicator light & mic)
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
