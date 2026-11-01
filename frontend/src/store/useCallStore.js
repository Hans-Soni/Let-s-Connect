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

let callTimerInterval = null;

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

    try {
      // Request microphone and camera (if video call)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
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

      // If socket is available, notify the receiver
      if (socket && socket.connected) {
        socket.emit("call:initiate", {
          receiverId: partner._id,
          callType: type,
          caller: {
            _id: authUser._id,
            fullName: authUser.fullName,
            profilePic: authUser.profilePic,
          },
        });
      }
    } catch (err) {
      console.error("Error accessing media devices for call:", err);
      let errorMsg = "Unable to access microphone/camera";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Microphone/Camera permission was denied. Please allow permissions in your browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No microphone or camera device found on this system.";
      }
      toast.error(errorMsg);
      get().resetCallState();
    }
  },

  handleIncomingCall: (data) => {
    // Only accept incoming if currently idle
    if (get().callState !== "idle") {
      // If already on a call, emit busy to the caller
      const { socket } = useAuthStore.getState();
      if (socket && socket.connected && data?.caller?._id) {
        socket.emit("call:busy", { callerId: data.caller._id });
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
        },
        video: callType === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
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

  setConnected: () => {
    stopOutgoingRingtone();
    stopIncomingRingtone();
    playCallConnectedSound();
    set({ callState: "connected" });
    get().startCallTimer();
  },

  setRemoteStream: (stream) => {
    set({ remoteStream: stream });
  },

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
      // Revert to user camera
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

        // Listen for browser "Stop Sharing" floating button
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

