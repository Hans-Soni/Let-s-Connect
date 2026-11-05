import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, Ban, ShieldAlert, Mic, Square } from "lucide-react";

const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_BYTES = 3 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 60;
const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/webm",
];

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to read the selected media."));
    };
    reader.onerror = () => reject(new Error("Unable to read the selected media."));
    reader.readAsDataURL(blob);
  });

function MessageInput() {
  const navigate = useNavigate();
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const {
    sendMessage,
    isSoundEnabled,
    selectedUser,
    isUserBlocked,
    isBlockedByUser,
    setViewingProfileUser,
  } = useChatStore();

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingRecipientIdRef = useRef(null);
  const recordingStartedAtRef = useRef(0);
  const previousRecipientIdRef = useRef(selectedUser?._id);
  const selectedUserIdRef = useRef(selectedUser?._id);
  selectedUserIdRef.current = selectedUser?._id;

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const discardAudio = () => {
    recordingRecipientIdRef.current = null;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
    setRecordingSeconds(0);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setAudioBlob(null);
    setAudioPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  };

  useEffect(() => {
    if (previousRecipientIdRef.current !== selectedUser?._id) {
      previousRecipientIdRef.current = selectedUser?._id;
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAudioBlob(null);
      setAudioPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  }, [selectedUser?._id]);

  useEffect(() => {
    return () => {
      recordingRecipientIdRef.current = null;
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [selectedUser?._id]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  useEffect(() => {
    if (!isRecording) return undefined;

    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
      setRecordingSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [isRecording]);

  const isBlocked = selectedUser?._id ? isUserBlocked(selectedUser._id) : false;
  const isBlockedBy = selectedUser?._id ? isBlockedByUser(selectedUser._id) : false;

  useEffect(() => {
    if (!isBlocked && !isBlockedBy) return;
    recordingRecipientIdRef.current = null;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioBlob(null);
    setAudioPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }, [isBlocked, isBlockedBy]);

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Audio recording is not supported in this browser.");
      return;
    }

    const recipientId = selectedUser?._id;
    if (!recipientId) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
      });
      if (selectedUserIdRef.current !== recipientId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStreamRef.current = stream;
      const mimeType = RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recordingRecipientIdRef.current = recipientId;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        recordingRecipientIdRef.current = null;
        setIsRecording(false);
        setRecordingSeconds(0);
        toast.error("Recording stopped unexpectedly. Please try again.");
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        const recordedChunks = audioChunksRef.current;
        audioChunksRef.current = [];
        if (recordingRecipientIdRef.current !== selectedUserIdRef.current) return;

        const recording = new Blob(recordedChunks, {
          type: recorder.mimeType || "audio/webm",
        });
        if (recording.size === 0) {
          toast.error("No audio was recorded. Please try again.");
        } else if (recording.size > MAX_AUDIO_BYTES) {
          toast.error("Recording is larger than 3 MB. Please record a shorter audio message.");
        } else {
          setAudioBlob(recording);
          setAudioPreviewUrl(URL.createObjectURL(recording));
        }
      };

      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      recorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      if (error.name === "NotAllowedError" || error.name === "SecurityError") {
        toast.error("Microphone access was denied. Allow microphone access to record.");
      } else if (error.name === "NotFoundError") {
        toast.error("No microphone was found on this device.");
      } else {
        toast.error("Could not start recording. Please check your microphone and try again.");
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isRecording || isSending || (!text.trim() && !imagePreview && !videoFile && !audioBlob)) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    setIsSending(true);
    try {
      const audio = audioBlob ? await blobToDataUrl(audioBlob) : undefined;
      const video = videoFile ? await blobToDataUrl(videoFile) : undefined;
      const sent = await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio,
        video,
      });
      if (sent) {
        setText("");
        setImagePreview(null);
        setVideoFile(null);
        setVideoPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        discardAudio();
      }
    } catch {
      toast.error("Could not prepare the attachment. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
        toast.error("Please choose an MP4, WebM, or MOV video.");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        toast.error("Video must be 3 MB or smaller.");
        e.target.value = "";
        return;
      }
      setImagePreview(null);
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image or video file.");
      e.target.value = "";
      return;
    }

    setVideoFile(null);
    setVideoPreviewUrl(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setImagePreview(reader.result);
      else toast.error("Could not preview this image. Please try another file.");
    };
    reader.onerror = () => toast.error("Could not read this image. Please try another file.");
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isBlocked) {
    return (
      <div className="p-3.5 sm:p-4 border-t border-border/70 bg-card/80 backdrop-blur-md shrink-0 w-full text-center">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-sm text-destructive font-medium">
          <Ban className="h-4 w-4 shrink-0" />
          <span>You blocked this user.</span>
          <button
            type="button"
            onClick={() => {
              setViewingProfileUser(selectedUser);
              navigate(`/profile/${selectedUser._id}`);
            }}
            className="underline font-bold hover:opacity-80 transition-opacity ml-1 cursor-pointer"
          >
            Unblock
          </button>
        </div>
      </div>
    );
  }

  if (isBlockedBy) {
    return (
      <div className="p-3.5 sm:p-4 border-t border-border/70 bg-card/80 backdrop-blur-md shrink-0 w-full text-center">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>You cannot send messages to this contact.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 sm:p-4 border-t border-border/70 bg-card/85 backdrop-blur-xl shrink-0 w-full">
      {(imagePreview || videoPreviewUrl) && (
        <div className="max-w-3xl mx-auto mb-2 sm:mb-3 flex items-center">
          <div className="relative max-w-full">
            {videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                controls
                preload="metadata"
                aria-label="Video attachment preview"
                className="max-h-40 max-w-full rounded-2xl border border-border shadow-sm"
                onError={() => {
                  toast.error("This video cannot be previewed. Please choose another file.");
                }}
              />
            ) : (
              <img
                src={imagePreview}
                alt="Image attachment preview"
                className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-2xl border border-border shadow-sm"
              />
            )}
            <button
              onClick={videoPreviewUrl ? removeVideo : removeImage}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-card shadow-sm cursor-pointer"
              type="button"
              aria-label="Remove attachment"
              title="Remove attachment"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="max-w-3xl mx-auto mb-2.5 flex items-center justify-between gap-3 rounded-2xl bg-destructive/10 border border-destructive/30 px-3.5 py-2 text-sm text-foreground">
          <span aria-live="polite" className="flex items-center gap-2 font-mono">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-ping-soft" />
            Recording {`0${Math.floor(recordingSeconds / 60)}`.slice(-2)}:
            {`0${recordingSeconds % 60}`.slice(-2)} · Max 01:00
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold shadow-xs hover:brightness-110 cursor-pointer"
            title="Stop recording"
          >
            <Square className="h-3 w-3" />
            Stop
          </button>
        </div>
      )}

      {audioPreviewUrl && (
        <div className="max-w-3xl mx-auto mb-2.5 flex items-center gap-2">
          <audio controls preload="metadata" src={audioPreviewUrl} className="min-w-0 flex-1 h-10">
            Your browser does not support audio playback.
          </audio>
          <button
            type="button"
            onClick={discardAudio}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/70 hover:border-destructive/60 hover:text-destructive text-muted-foreground transition cursor-pointer shrink-0"
            title="Delete recording"
            aria-label="Delete recording"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="max-w-3xl mx-auto flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 p-1.5 sm:p-2 backdrop-blur-xl transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 shadow-xs"
      >
        <input
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Attach Media */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={Boolean(audioBlob || isRecording) || isSending}
          className={`grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-card transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            imagePreview ? "text-primary" : ""
          }`}
          title="Attach image or video"
          aria-label="Attach image or video"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        {/* Voice Note Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : handleStartRecording}
          disabled={Boolean(audioBlob || imagePreview || videoFile) || isSending}
          className={`grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-card transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isRecording ? "text-destructive" : ""
          }`}
          title={isRecording ? "Stop recording" : "Record voice message"}
          aria-label={isRecording ? "Stop recording" : "Record voice message"}
        >
          {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Message Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          className="flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Type your message..."
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isRecording || isSending || (!text.trim() && !imagePreview && !videoFile && !audioBlob)}
          className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs hover:opacity-90 active:scale-95 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
          title="Send message"
        >
          <SendIcon className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;
