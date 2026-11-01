import { useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";

function formatDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function CallModal() {
  const {
    callState,
    callType,
    callPartner,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    isFullscreen,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleFullscreen,
  } = useCallStore();

  const { getUserDisplayPic } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach localStream to local video preview
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream, callState]);

  // Attach remoteStream to remote video and audio
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream, callState]);

  if (callState === "idle" || !callPartner) return null;

  const partnerPic = getUserDisplayPic(callPartner);

  // =========================================================================
  // 1. INCOMING CALL MODAL
  // =========================================================================
  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-base-200/95 border border-base-content/10 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center relative overflow-hidden">
          {/* Animated background ambient glow */}
          <div className="absolute -top-12 -left-12 size-40 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 size-40 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

          {/* Caller Avatar with pulsing radar animation */}
          <div className="relative mx-auto size-28 sm:size-32 mb-5">
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75" />
            <span className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse" />
            <img
              src={partnerPic}
              alt={callPartner.fullName}
              className="relative size-full rounded-full object-cover ring-4 ring-primary shadow-lg"
            />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-1 truncate px-2">
            {callPartner.fullName}
          </h3>
          <p className="text-sm font-medium text-primary flex items-center justify-center gap-1.5 mb-6">
            {callType === "video" ? (
              <>
                <Video className="size-4 animate-bounce" /> Incoming Video Call...
              </>
            ) : (
              <>
                <Phone className="size-4 animate-bounce" /> Incoming Voice Call...
              </>
            )}
          </p>

          {/* Action buttons: Accept / Reject */}
          <div className="flex items-center justify-center gap-6 pt-2">
            {/* Reject Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={rejectCall}
                className="btn btn-circle btn-error btn-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
                title="Decline"
                aria-label="Decline call"
              >
                <PhoneOff className="size-6 text-white" />
              </button>
              <span className="text-xs text-base-content/70 font-medium">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={acceptCall}
                className="btn btn-circle btn-success btn-lg shadow-lg hover:scale-105 active:scale-95 transition-all animate-pulse"
                title="Accept"
                aria-label="Accept call"
              >
                {callType === "video" ? (
                  <Video className="size-6 text-white" />
                ) : (
                  <Phone className="size-6 text-white" />
                )}
              </button>
              <span className="text-xs text-base-content/70 font-medium">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. OUTGOING CALL MODAL
  // =========================================================================
  if (callState === "outgoing") {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-base-200/95 border border-base-content/10 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center relative overflow-hidden">
          {/* Subtle camera preview for caller during video call setup */}
          {callType === "video" && localStream && (
            <div className="mb-4 relative rounded-2xl overflow-hidden aspect-video bg-neutral shadow-inner ring-1 ring-base-content/10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover transform -scale-x-100"
              />
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Your camera
              </span>
            </div>
          )}

          {/* Partner Avatar with radar pulse */}
          <div className="relative mx-auto size-24 sm:size-28 mb-4">
            <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping opacity-60" />
            <span className="absolute -inset-2 rounded-full bg-secondary/20 animate-pulse" />
            <img
              src={partnerPic}
              alt={callPartner.fullName}
              className="relative size-full rounded-full object-cover ring-4 ring-secondary shadow-lg"
            />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-base-content mb-1 truncate px-2">
            {callPartner.fullName}
          </h3>
          <p className="text-sm text-base-content/60 flex items-center justify-center gap-1.5 mb-6">
            <span className="inline-block size-2 rounded-full bg-amber-500 animate-ping" />
            Calling ({callType === "video" ? "Video" : "Voice"})...
          </p>

          {/* Cancel Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => endCall(true)}
              className="btn btn-circle btn-error btn-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
              title="Cancel Call"
              aria-label="Cancel call"
            >
              <PhoneOff className="size-6 text-white" />
            </button>
            <span className="text-xs text-base-content/70 font-medium">Cancel</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. CONNECTED CALL (AUDIO OR VIDEO)
  // =========================================================================
  return (
    <div
      className={`fixed z-[99999] bg-neutral-900 text-white flex flex-col transition-all duration-300 ${
        isFullscreen
          ? "inset-0"
          : "inset-2 sm:inset-6 md:inset-10 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
      }`}
    >
      {/* Hidden audio element for remote stream in voice calls */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 sm:p-5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <img
            src={partnerPic}
            alt={callPartner.fullName}
            className="size-10 rounded-full object-cover ring-2 ring-primary/80"
          />
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-white truncate max-w-[160px] sm:max-w-xs">
              {callPartner.fullName}
            </h4>
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-white/80">{formatDuration(callDuration)}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                {callType}
              </span>
            </div>
          </div>
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="btn btn-circle btn-sm btn-ghost text-white/80 hover:text-white hover:bg-white/10"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 size-full flex items-center justify-center bg-neutral-950 overflow-hidden">
        {callType === "video" ? (
          <>
            {/* Remote Video Stream (Main Screen) */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="size-full object-cover"
              />
            ) : (
              // Fallback / Remote Avatar when remote video hasn't attached yet
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="relative size-32 sm:size-40">
                  <span className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse" />
                  <img
                    src={partnerPic}
                    alt={callPartner.fullName}
                    className="size-full rounded-full object-cover ring-4 ring-primary/40 shadow-2xl"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{callPartner.fullName}</h3>
                  <p className="text-sm text-white/60 mt-1">Connecting video feed...</p>
                </div>
              </div>
            )}

            {/* Picture-in-Picture Local User Video Stream (Bottom-Right Corner) */}
            <div className="absolute bottom-24 right-4 sm:bottom-24 sm:right-6 z-20 w-28 sm:w-44 md:w-52 aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-neutral-900 group">
              {isCameraOff ? (
                <div className="size-full flex flex-col items-center justify-center bg-neutral-800 text-white/60 p-2 text-center">
                  <VideoOff className="size-6 mb-1 text-white/40" />
                  <span className="text-[10px] font-medium">Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`size-full object-cover ${!isScreenSharing ? "transform -scale-x-100" : ""}`}
                />
              )}
              <div className="absolute bottom-1 left-2 text-[10px] text-white/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                {isScreenSharing ? "You (Screen)" : "You"}
              </div>
            </div>
          </>
        ) : (
          // Voice Call Clean UI Screen
          <div className="flex flex-col items-center justify-center gap-6 p-6 text-center select-none">
            <div className="relative size-32 sm:size-44">
              <span className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping opacity-40" />
              <span className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
              <img
                src={partnerPic}
                alt={callPartner.fullName}
                className="size-full rounded-full object-cover ring-4 ring-emerald-500 shadow-2xl"
              />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold">{callPartner.fullName}</h3>
              <p className="text-emerald-400 font-medium text-sm mt-1 flex items-center justify-center gap-2">
                <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
                Voice Call in Progress
              </p>
              <p className="font-mono text-lg text-white/80 mt-2">{formatDuration(callDuration)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Dock (Bottom Controls Bar) */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center gap-3 sm:gap-4">
        {/* Toggle Microphone */}
        <button
          type="button"
          onClick={toggleMic}
          className={`btn btn-circle btn-md sm:btn-lg shadow-lg transition-all ${
            isMicMuted
              ? "btn-error text-white ring-2 ring-error/50"
              : "bg-white/15 hover:bg-white/25 text-white border-none backdrop-blur-md"
          }`}
          title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          aria-label={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMicMuted ? <MicOff className="size-5 sm:size-6" /> : <Mic className="size-5 sm:size-6" />}
        </button>

        {/* Toggle Camera (Only available for video calls) */}
        {callType === "video" && (
          <button
            type="button"
            onClick={toggleCamera}
            className={`btn btn-circle btn-md sm:btn-lg shadow-lg transition-all ${
              isCameraOff
                ? "btn-error text-white ring-2 ring-error/50"
                : "bg-white/15 hover:bg-white/25 text-white border-none backdrop-blur-md"
            }`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            aria-label={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? <VideoOff className="size-5 sm:size-6" /> : <Video className="size-5 sm:size-6" />}
          </button>
        )}

        {/* Toggle Screen Sharing (Video call only) */}
        {callType === "video" && (
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`btn btn-circle btn-md sm:btn-lg shadow-lg transition-all ${
              isScreenSharing
                ? "btn-primary text-white"
                : "bg-white/15 hover:bg-white/25 text-white border-none backdrop-blur-md"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            aria-label={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            {isScreenSharing ? <MonitorOff className="size-5 sm:size-6" /> : <Monitor className="size-5 sm:size-6" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={() => endCall(true)}
          className="btn btn-circle btn-error btn-md sm:btn-lg shadow-xl hover:scale-105 active:scale-95 transition-all text-white ml-2 sm:ml-4"
          title="End Call"
          aria-label="End Call"
        >
          <PhoneOff className="size-5 sm:size-6" />
        </button>
      </div>
    </div>
  );
}

