import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router";
import {
  MessageCircle,
  Users,
  Settings,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  ArrowLeft,
  Info,
  CheckCheck,
  Check,
  Trash2,
  X,
  ImagePlus,
  Smile,
  Square,
  Mic,
  Send,
  Phone,
  Video,
  Download,
  Camera,
  KeyRound,
  FileText,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
  User,
  ShieldAlert,
  UserX,
  Ban,
  UserCheck,
  Play,
  Pause,
  Maximize2,
  ExternalLink,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useCallStore } from "../store/useCallStore";
import TermsContent from "../components/TermsContent";
import { CURRENT_TERMS_VERSION, TERMS_LAST_UPDATED } from "../lib/terms";

import logoLight from "../assets/samvaad_logo_light.png";
import logoDark from "../assets/samvaad_logo_dark.png";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";

import "../auth.css";

// Helper for user initials
function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Avatar component matching Lovable's exact .chat-avatar
function Avatar({ user, large = false }) {
  const pic = user?.profilePic;
  const name = user?.fullName || "Member";

  return (
    <span
      className={`chat-avatar select-none ${
        large ? "h-20 w-20 text-2xl font-bold" : "h-11 w-11 text-sm font-semibold"
      }`}
    >
      {pic ? (
        <img src={pic} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

// Logo link matching Lovable's header
function LogoLink({ dark, className = "" }) {
  return (
    <Link to="/" title="Back to welcome page" className={`block transition hover:scale-[1.03] ${className}`}>
      <img
        src={dark ? logoDark : logoLight}
        alt="Samvād"
        className="h-9 sm:h-10 w-auto transition-opacity duration-300"
      />
    </Link>
  );
}

// Animated theme toggle button matching Lovable
function ThemeToggle({ dark, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className={`absolute transition-all duration-500 ${
          dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span
        className={`absolute transition-all duration-500 ${
          dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </span>
    </button>
  );
}

// Formatted text message renderer with auto-link detection
function FormattedMessageText({ text, isMe }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-6">
      {parts.map((part, i) => {
        if (urlRegex.test(part)) {
          const href = part.startsWith("http") ? part : `https://${part}`;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className={`underline underline-offset-2 break-all ${
                isMe
                  ? "text-primary-foreground font-semibold hover:opacity-85"
                  : "text-primary font-semibold hover:underline"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
}

// Custom interactive audio player for voice notes & recordings
function AudioMessagePlayer({ src, isMe }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-xl mb-1.5 min-w-[220px] max-w-[320px] sm:min-w-[260px] ${
        isMe
          ? "bg-black/15 text-primary-foreground"
          : "bg-card border border-border text-foreground"
      }`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          toast.error("Audio could not be played.");
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`grid h-8 w-8 place-items-center rounded-full shrink-0 transition cursor-pointer shadow-xs ${
          isMe
            ? "bg-primary-foreground text-primary hover:opacity-90"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
        title={isPlaying ? "Pause" : "Play"}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={onSeek}
          className="w-full h-1 bg-current opacity-30 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex items-center justify-between text-[10px] opacity-80 font-mono select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <a
        href={src}
        download="voice-note"
        target="_blank"
        rel="noreferrer"
        className="p-1 rounded-lg opacity-70 hover:opacity-100 transition shrink-0 cursor-pointer"
        title="Download audio"
      >
        <Download size={13} />
      </a>
    </div>
  );
}

// Media renderer for images, videos, and audios
function AttachmentPreview({ msg, onOpenImage, isMe }) {
  if (msg.image) {
    return (
      <div className="relative group mb-1.5 overflow-hidden rounded-xl">
        <img
          src={msg.image}
          alt="Shared"
          loading="lazy"
          onClick={() => onOpenImage && onOpenImage(msg.image)}
          className="max-h-72 max-w-full rounded-xl object-cover hover:opacity-95 transition cursor-pointer shadow-xs"
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onOpenImage && onOpenImage(msg.image)}
            className="p-1 rounded text-white hover:bg-white/20 transition cursor-pointer"
            title="Expand image"
          >
            <Maximize2 size={13} />
          </button>
          <a
            href={msg.image}
            download="shared-image"
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded text-white hover:bg-white/20 transition cursor-pointer"
            title="Download image"
          >
            <Download size={13} />
          </a>
        </div>
      </div>
    );
  }

  if (msg.video) {
    return (
      <div className="relative group mb-1.5 overflow-hidden rounded-xl max-w-sm">
        <video
          controls
          playsInline
          preload="metadata"
          src={msg.video}
          className="max-h-72 w-full rounded-xl bg-black shadow-xs"
          onError={() => toast.error("Video failed to play.")}
        />
        <div className="flex items-center justify-end gap-2 mt-1">
          <a
            href={msg.video}
            download="shared-video"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] opacity-75 hover:opacity-100 transition"
          >
            <Download size={12} />
            <span>Download video</span>
          </a>
        </div>
      </div>
    );
  }

  if (msg.audio) {
    return <AudioMessagePlayer src={msg.audio} isMe={isMe} />;
  }

  return null;
}

export default function ChatPage() {
  const {
    chats,
    allContacts,
    selectedUser,
    setSelectedUser,
    messages,
    sendMessage,
    getMessagesByUserId,
    isMessagesLoading,
    deleteChatHistory,
    markMessagesAsSeen,
    getMyChatPartners,
    getAllContacts,
    subscribeToMessages,
    unsubscribeFromMessages,
    blockUser,
    unblockUser,
    isUserBlocked,
    isBlockedByUser,
    blockedUsers,
  } = useChatStore();

  const {
    authUser,
    logout,
    onlineUsers,
    updateProfile,
    changePassword,
    getConsentRecord,
    deleteAccount,
    isDeletingAccount,
  } = useAuthStore();

  const { theme, setTheme } = useThemeStore();
  const { startOutgoingCall, callState } = useCallStore();

  const dark = theme === "dark";

  // State matching Lovable ChatWorkspace + Full Profile Details
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState(null); // null | 'contacts' | 'profile' | 'terms'
  const [profileTab, setProfileTab] = useState("profile"); // 'profile' | 'security' | 'privacy' | 'danger'
  const [showDetails, setShowDetails] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [viewingImage, setViewingImage] = useState(null);
  const [mediaFilter, setMediaFilter] = useState("all");
  const recordingTimerRef = useRef(null);

  // Clear attachment helper
  const clearAttachment = () => {
    setAttachment(null);
    if (attachmentPreviewUrl) {
      try {
        URL.revokeObjectURL(attachmentPreviewUrl);
      } catch {}
    }
    setAttachmentPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Detect attachment type
  const attachmentType = useMemo(() => {
    if (!attachment) return null;
    const name = attachment.name || "";
    if (attachment.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i.test(name)) return "image";
    if (attachment.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/i.test(name)) return "video";
    if (attachment.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|webm|flac|wma|opus)$/i.test(name)) return "audio";
    return "image";
  }, [attachment]);

  // Profile modal edit states
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [selectedProfileImage, setSelectedProfileImage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Consent & Terms record state
  const [consentRecord, setConsentRecord] = useState(null);
  const [isLoadingConsent, setIsLoadingConsent] = useState(false);

  // Delete account safety state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteAckChecked, setDeleteAckChecked] = useState(false);

  // Block contact safety state
  const [confirmBlockTarget, setConfirmBlockTarget] = useState(null);
  const [isBlockingAction, setIsBlockingAction] = useState(false);

  const handleConfirmBlock = async () => {
    if (!confirmBlockTarget?._id) return;
    setIsBlockingAction(true);
    try {
      await blockUser(confirmBlockTarget._id);
      setConfirmBlockTarget(null);
    } catch (err) {
      console.error("Block error:", err);
    } finally {
      setIsBlockingAction(false);
    }
  };

  const handleUnblock = async (targetId) => {
    try {
      await unblockUser(targetId);
    } catch (err) {
      console.error("Unblock error:", err);
    }
  };

  // Refs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Sync theme
  const toggleTheme = () => {
    const nextDark = !dark;
    const nextTheme = nextDark ? "dark" : "light";
    setTheme(nextTheme);
  };

  useEffect(() => {
    getMyChatPartners();
    getAllContacts();
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [getMyChatPartners, getAllContacts, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessagesByUserId(selectedUser._id);
      markMessagesAsSeen(selectedUser._id);
      setText("");
      clearAttachment();
      setShowDetails(false);
      textareaRef.current?.focus();
    }
  }, [selectedUser?._id, getMessagesByUserId, markMessagesAsSeen]);

  // Window focus & active tab synchronization with backend
  useEffect(() => {
    const handleActive = () => {
      if (document.visibilityState === "visible" && selectedUser?._id) {
        markMessagesAsSeen(selectedUser._id);
      }
    };
    window.addEventListener("focus", handleActive);
    document.addEventListener("visibilitychange", handleActive);
    return () => {
      window.removeEventListener("focus", handleActive);
      document.removeEventListener("visibilitychange", handleActive);
    };
  }, [selectedUser?._id, markMessagesAsSeen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedUser?._id]);

  // Clean up media streams
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Filter conversations matching search
  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        (c.fullName || "").toLowerCase().includes(q) ||
        (c.designation || "").toLowerCase().includes(q)
    );
  }, [chats, searchQuery]);

  // Filter contacts matching search
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allContacts.filter((c) => c._id !== authUser?._id);
    return allContacts.filter(
      (c) =>
        c._id !== authUser?._id &&
        ((c.fullName || "").toLowerCase().includes(q) ||
          (c.designation || "").toLowerCase().includes(q))
    );
  }, [allContacts, authUser, searchQuery]);

  // Open conversation from contacts
  const handleOpenContactChat = (contact) => {
    setSelectedUser(contact);
    setActiveModal(null);
    setSearchQuery("");
  };

  // Open profile modal with initial values
  const handleOpenProfileModal = () => {
    setEditName(authUser?.fullName || "");
    setEditDesignation(authUser?.designation || "");
    setSelectedProfileImage("");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setDeleteConfirmationText("");
    setDeleteAckChecked(false);
    setProfileTab("profile");
    setActiveModal("profile");

    // Fetch consent record
    setIsLoadingConsent(true);
    getConsentRecord()
      .then((record) => setConsentRecord(record))
      .catch(() => {})
      .finally(() => setIsLoadingConsent(false));
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser || isSending || (!text.trim() && !attachment)) return;

    setIsSending(true);
    try {
      let imageBase64 = null;
      let videoBase64 = null;
      let audioBase64 = null;

      if (attachment) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(attachment);
        let dataUrl = await base64Promise;

        const name = attachment.name || "";
        const isAudio =
          attachment.type.startsWith("audio/") ||
          /\.(mp3|wav|ogg|m4a|aac|webm|flac|wma|opus)$/i.test(name);
        const isVideo =
          attachment.type.startsWith("video/") ||
          /\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/i.test(name);

        if (isAudio) {
          if (dataUrl.startsWith("data:application/octet-stream") || !dataUrl.startsWith("data:audio/")) {
            dataUrl = dataUrl.replace(/^data:[^;]+;/, "data:audio/webm;");
          }
          audioBase64 = dataUrl;
        } else if (isVideo) {
          if (dataUrl.startsWith("data:application/octet-stream") || !dataUrl.startsWith("data:video/")) {
            dataUrl = dataUrl.replace(/^data:[^;]+;/, "data:video/mp4;");
          }
          videoBase64 = dataUrl;
        } else {
          imageBase64 = dataUrl;
        }
      }

      const success = await sendMessage({
        text: text.trim(),
        image: imageBase64,
        video: videoBase64,
        audio: audioBase64,
      });

      if (success) {
        setText("");
        clearAttachment();
        textareaRef.current?.focus();
      }
    } catch {
      toast.error("Message not sent. Your draft is still here—try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Voice note toggle
  const handleStartVoiceNote = async () => {
    if (isRecording) {
      handleStopVoiceNote();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
      });
      mediaStreamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ];
      const supportedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const recorder = supportedMime ? new MediaRecorder(stream, { mimeType: supportedMime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) {
          toast.error("No audio recorded. Please try again.");
        } else if (blob.size > 20 * 1024 * 1024) {
          toast.error("Voice note is larger than 20 MB. Please record a shorter note.");
        } else {
          const extension = mimeType.includes("mp4") ? "mp4" : "webm";
          const file = new File([blob], `voice-note-${Date.now()}.${extension}`, { type: mimeType });
          clearAttachment();
          setAttachment(file);
          setAttachmentPreviewUrl(URL.createObjectURL(blob));
        }
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 120) {
            handleStopVoiceNote();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access unavailable. Check browser permissions.");
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const handleStopVoiceNote = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelVoiceNote = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
    setRecordingSeconds(0);
    toast("Voice note cancelled", { icon: "🗑️" });
  };

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const name = file.name || "";
      const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|webm|flac|wma|opus)$/i.test(name);
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/i.test(name);
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i.test(name);

      if (isImage && file.size > 15 * 1024 * 1024) {
        toast.error("Choose an image smaller than 15 MB.");
        return;
      }
      if (isAudio && file.size > 20 * 1024 * 1024) {
        toast.error("Choose an audio file smaller than 20 MB.");
        return;
      }
      if (isVideo && file.size > 25 * 1024 * 1024) {
        toast.error("Choose a video smaller than 25 MB.");
        return;
      }
      if (!isImage && !isAudio && !isVideo) {
        toast.error("Unsupported file type. Please choose an image, video, or audio file.");
        return;
      }
      clearAttachment();
      setAttachment(file);
      setAttachmentPreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  // Clipboard paste support (e.g. screenshot paste Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > 15 * 1024 * 1024) {
            toast.error("Pasted image is too large (max 15 MB).");
            return;
          }
          clearAttachment();
          setAttachment(file);
          setAttachmentPreviewUrl(URL.createObjectURL(file));
          toast.success("Image attached from clipboard!");
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Save profile details
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const normalizedName = editName.trim();
    if (!normalizedName) {
      toast.error("Your name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: normalizedName,
        designation: editDesignation.trim() || "Samvād member",
        ...(selectedProfileImage ? { profilePic: selectedProfileImage } : {}),
      });
      setSelectedProfileImage("");
      toast.success("Profile saved.");
    } catch {
      toast.error("Profile could not be saved.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Profile photo upload
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Choose an image smaller than 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedProfileImage(reader.result);
      toast.success("New photo selected! Click 'Save Profile' to apply.");
    };
    reader.readAsDataURL(file);
  };

  // Password change submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error("Choose a new password different from your current one.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);
    const changed = await changePassword(passwordForm);
    setIsChangingPassword(false);
    if (changed) {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  // Permanent account deletion
  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE" || !deleteAckChecked || isDeletingAccount) {
      return;
    }
    const success = await deleteAccount();
    if (success) {
      setActiveModal(null);
    }
  };

  const isOnline = selectedUser?._id ? onlineUsers.includes(selectedUser._id) : false;
  const sharedFiles = messages.filter((m) => m.image || m.video || m.audio);

  return (
    <div className="chat-app bg-background text-foreground">
      {/* 1. Chat Rail (Leftmost navigation bar) */}
      <nav className="chat-rail flex flex-col items-center gap-5 border-r border-border bg-card py-6 select-none z-10 shadow-xs">
        <Link to="/" aria-label="Samvād messages" title="Samvād home">
          <img
            src={dark ? emblemSilver : emblemGold}
            alt="Samvād"
            className="h-9 w-auto transition-transform hover:scale-105 drop-shadow-sm dark:drop-shadow-none"
          />
        </Link>

        {/* Primary nav buttons */}
        <div className="mt-7 flex flex-col gap-4">
          <button
            type="button"
            title="Messages"
            aria-label="Messages"
            onClick={() => setSelectedUser(null)}
            className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs cursor-pointer hover:opacity-90 transition"
          >
            <MessageCircle size={20} />
          </button>

          <button
            type="button"
            title="Contacts"
            aria-label="Contacts"
            onClick={() => setActiveModal("contacts")}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
          >
            <Users size={20} />
          </button>
        </div>

        {/* Bottom rail actions */}
        <div className="mt-auto flex flex-col items-center gap-4">
          <ThemeToggle dark={dark} toggle={toggleTheme} />

          <button
            type="button"
            title="Profile & Settings"
            aria-label="Profile & Settings"
            onClick={handleOpenProfileModal}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
          >
            <Settings size={20} />
          </button>

          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={logout}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition cursor-pointer"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* 2. Chat Sidebar (Conversations list & Search) */}
      <aside
        className={`chat-sidebar flex min-h-0 flex-col border-r border-border bg-card ${
          selectedUser ? "hidden md:flex" : ""
        }`}
      >
        <header className="px-6 pb-5 pt-7 select-none">
          <LogoLink dark={dark} />

          <div className="mb-5 mt-9 flex items-center justify-between">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Conversations<span className="text-primary">.</span>
            </h1>
            <button
              type="button"
              onClick={() => setActiveModal("contacts")}
              aria-label="New conversation"
              title="New conversation"
              className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground hover:opacity-90 transition cursor-pointer shadow-xs"
            >
              <Plus size={18} />
            </button>
          </div>

          <label className="flex h-11 items-center gap-3 rounded-lg bg-secondary px-3 text-muted-foreground border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/40 transition">
            <Search size={16} />
            <input
              aria-label="Search conversations"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </header>

        {/* Filter Strip */}
        <div className="flex items-center gap-5 border-b border-border px-6 pb-4 text-sm select-none">
          <span className="font-semibold text-primary">
            All chats <span className="ml-1 text-xs">({filteredChats.length})</span>
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck size={13} className="text-emerald-500" /> Members only
          </span>
        </div>

        {/* Conversation Items List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {filteredChats.map((chat) => {
            const isSelected = selectedUser?._id === chat._id;
            const unread = Number(chat.unreadCount) || 0;
            const lastMsg = chat.lastMessage;

            return (
              <button
                key={chat._id}
                type="button"
                onClick={() => setSelectedUser(chat)}
                className={`mb-1 w-full justify-start whitespace-normal rounded-lg px-3 py-4 flex items-center gap-3 transition cursor-pointer text-left ${
                  isSelected
                    ? "bg-accent text-accent-foreground border-l-2 border-primary"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                <Avatar user={chat} />
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex justify-between gap-2">
                    <span className="truncate font-semibold text-sm">{chat.fullName}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {lastMsg?.createdAt
                        ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Active"}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {lastMsg?.text || (lastMsg?.image ? "📷 Photo" : lastMsg?.video ? "🎬 Video" : lastMsg?.audio ? "🎤 Voice note" : "Start a conversation")}
                  </span>
                </span>
                {unread > 0 && (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold shadow-xs">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}

          {filteredChats.length === 0 && (
            <div className="px-3 py-12 text-center select-none">
              <MessageCircle className="mx-auto mb-4 text-primary" size={32} />
              <p className="font-display text-xl text-foreground">Your conversations start here.</p>
              <button
                type="button"
                onClick={() => setActiveModal("contacts")}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Find someone to chat with <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Click to open full Profile & Settings */}
        <button
          type="button"
          onClick={handleOpenProfileModal}
          className="flex items-center gap-3 border-t border-border px-6 py-5 select-none bg-card hover:bg-secondary transition cursor-pointer text-left group"
          title="Open Profile & Settings"
        >
          <Avatar user={authUser} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {authUser?.fullName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {authUser?.designation || "Available"}
            </p>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full bg-online" title="Online" />
        </button>
      </aside>

      {/* 3. Chat Main Area */}
      <main className={`chat-main flex min-h-0 min-w-0 flex-col ${selectedUser ? "" : "hidden md:flex"}`}>
        {selectedUser ? (
          <>
            {/* Header */}
            <header className="flex h-20 shrink-0 items-center gap-3 border-b border-border bg-card px-5 md:px-8 select-none">
              <button
                type="button"
                aria-label="Back to conversations"
                className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft size={18} />
              </button>

              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer group"
                onClick={() => setShowDetails(!showDetails)}
                title="Conversation settings & info"
              >
                <Avatar user={selectedUser} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors">
                      {selectedUser.fullName}
                    </h2>
                    {isUserBlocked(selectedUser._id) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                        Blocked
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {isUserBlocked(selectedUser._id)
                      ? "Contact is blocked"
                      : isBlockedByUser(selectedUser._id)
                      ? "Contact is unavailable"
                      : selectedUser.designation || (isOnline ? "Online" : "Offline")}
                  </p>
                </div>
              </div>

              {/* Call buttons (preserves WebRTC calling) */}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startOutgoingCall(selectedUser, "audio")}
                  disabled={isUserBlocked(selectedUser._id) || isBlockedByUser(selectedUser._id) || callState !== "idle"}
                  aria-label="Voice call"
                  title={isUserBlocked(selectedUser._id) ? "Unblock contact to call" : "Voice call"}
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Phone size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => startOutgoingCall(selectedUser, "video")}
                  disabled={isUserBlocked(selectedUser._id) || isBlockedByUser(selectedUser._id) || callState !== "idle"}
                  aria-label="Video call"
                  title={isUserBlocked(selectedUser._id) ? "Unblock contact to call" : "Video call"}
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Video size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  aria-label="Conversation settings"
                  title="Conversation settings"
                  className={`grid h-9 w-9 place-items-center rounded-lg transition cursor-pointer ${
                    showDetails
                      ? "bg-secondary text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Settings size={18} />
                </button>
              </div>
            </header>

            {/* Messages Transcript */}
            <div className="chat-transcript min-h-0 flex-1 overflow-y-auto px-5 py-7 md:px-10">
              <div className="mb-8 flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground select-none">
                <span className="h-px w-10 bg-border" />
                The start of something good
                <span className="h-px w-10 bg-border" />
              </div>

              {isMessagesLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-muted-foreground animate-rise">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <p className="text-xs">Loading conversation…</p>
                </div>
              ) : messages.length === 0 ? (
                <p className="py-12 text-center font-display text-xl text-muted-foreground select-none">
                  Say hello to {selectedUser.fullName}.
                </p>
              ) : null}

              {messages.map((msg, index) => {
                const isMe = msg.senderId === authUser?._id;
                const prevMsg = messages[index - 1];
                const msgDate = new Date(msg.createdAt).toDateString();
                const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
                const isNewDay = msgDate !== prevDate;

                return (
                  <div key={msg._id || index}>
                    {isNewDay && (
                      <p className="my-6 text-center text-xs text-muted-foreground select-none">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}

                    <div className={`group mb-5 flex items-end gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                      {!isMe && <Avatar user={selectedUser} />}

                      <div className={`max-w-[82%] md:max-w-[70%] ${isMe ? "text-right" : ""}`}>
                        <div
                          className={`chat-bubble text-left ${
                            isMe ? "chat-bubble-own" : "chat-bubble-peer"
                          } ${msg.image && !msg.text ? "!p-1.5 overflow-hidden" : ""}`}
                        >
                          <AttachmentPreview
                            msg={msg}
                            onOpenImage={(imgUrl) => setViewingImage(imgUrl)}
                            isMe={isMe}
                          />
                          {msg.text && (
                            <FormattedMessageText text={msg.text} isMe={isMe} />
                          )}
                        </div>

                        <div
                          className={`mt-2 flex items-center gap-1.5 text-[10px] select-none ${
                            isMe ? "justify-end text-muted-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe &&
                            (msg.isSeen ? (
                              <CheckCheck size={13} className="text-primary" />
                            ) : (
                              <Check size={13} className="text-muted-foreground" />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Composer Box */}
            <div className="shrink-0 border-t border-border bg-card px-5 pb-5 pt-4 md:px-8">
              {isUserBlocked(selectedUser._id) ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive animate-rise">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert size={18} />
                    <span className="text-xs sm:text-sm font-medium">
                      You have blocked {selectedUser.fullName}. Unblock this contact to send messages or start calls.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblock(selectedUser._id)}
                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    Unblock Contact
                  </button>
                </div>
              ) : isBlockedByUser(selectedUser._id) ? (
                <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border bg-secondary text-muted-foreground text-xs sm:text-sm animate-rise">
                  <Shield size={16} />
                  <span>You cannot send messages to this contact.</span>
                </div>
              ) : (
                <>
                  {/* Attachment Preview Card */}
                  {attachment && (
                    <div className="mb-3 rounded-xl border border-border bg-card p-3 shadow-md animate-rise">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {attachmentType === "image" && (
                            <img
                              src={attachmentPreviewUrl}
                              alt="Attachment preview"
                              className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover border border-border shrink-0 shadow-xs"
                            />
                          )}
                          {attachmentType === "video" && (
                            <video
                              src={attachmentPreviewUrl}
                              controls
                              preload="metadata"
                              className="h-20 max-w-44 rounded-lg border border-border bg-black object-cover shrink-0 shadow-xs"
                            />
                          )}
                          {attachmentType === "audio" && (
                            <div className="flex-1 min-w-0">
                              <audio
                                controls
                                preload="metadata"
                                src={attachmentPreviewUrl}
                                className="w-full h-9"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">{attachment.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {(attachment.size / (1024 * 1024)).toFixed(2)} MB • {attachmentType?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearAttachment}
                          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
                          title="Remove attachment"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Live Voice Recording Status Bar */}
                  {isRecording && (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs text-foreground animate-rise">
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                        </span>
                        <span className="font-semibold text-destructive">
                          Recording {`0${Math.floor(recordingSeconds / 60)}`.slice(-2)}:
                          {`0${recordingSeconds % 60}`.slice(-2)}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">• Max 02:00</span>
                        <div className="flex items-center gap-0.5 ml-2 h-4">
                          {[10, 16, 8, 20, 14, 18, 12, 16].map((h, i) => (
                            <span
                              key={i}
                              className="w-0.5 bg-destructive rounded-full animate-pulse"
                              style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelVoiceNote}
                          className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleStopVoiceNote}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
                        >
                          <Square size={11} fill="currentColor" />
                          Stop &amp; Review
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Emoji bar */}
                  {showEmojiPicker && (
                    <div className="mb-2 flex gap-1 animate-rise">
                      {["😊", "❤️", "👋", "🙌", "👍", "✨", "🔥", "🎉", "👏"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setText((t) => t + emoji);
                            setShowEmojiPicker(false);
                            textareaRef.current?.focus();
                          }}
                          className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary transition cursor-pointer text-base"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input Form */}
                  <form
                    className="flex items-end gap-1 rounded-lg border border-border bg-secondary p-2 transition focus-within:border-primary/50"
                    onSubmit={handleSendMessage}
                  >
                    <button
                      type="button"
                      aria-label="Attach file"
                      title="Attach photo, video or audio file"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending || isRecording}
                      className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-card transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                        attachment ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ImagePlus size={18} />
                    </button>

                    <textarea
                      ref={textareaRef}
                      aria-label="Message"
                      placeholder={
                        isSending
                          ? "Uploading media and sending…"
                          : attachment
                          ? "Add a caption… (or press Send)"
                          : "Write a message… (or paste screenshot Ctrl+V)"
                      }
                      rows={1}
                      maxLength={2000}
                      disabled={isSending}
                      onPaste={handlePaste}
                      className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />

                    <button
                      type="button"
                      aria-label="Choose emoji"
                      title="Emoji"
                      disabled={isSending}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-card transition cursor-pointer shrink-0 disabled:opacity-40 ${
                        showEmojiPicker ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Smile size={18} />
                    </button>

                    <button
                      type="button"
                      aria-label={isRecording ? "Stop recording" : "Record voice note"}
                      title={isRecording ? "Stop recording" : "Record voice note"}
                      onClick={handleStartVoiceNote}
                      disabled={isSending || Boolean(attachment)}
                      className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-card transition cursor-pointer shrink-0 disabled:opacity-40 ${
                        isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isRecording ? <Square size={18} /> : <Mic size={18} />}
                    </button>

                    <button
                      type="submit"
                      aria-label="Send message"
                      title="Send message"
                      disabled={isSending || isRecording || (!text.trim() && !attachment)}
                      className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0 shadow-xs"
                    >
                      {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </>
              )}

              {/* Subtext info */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground select-none">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Only conversation members can read messages
                </span>
                <span>{isRecording ? "Recording…" : "Samvād · संवाद"}</span>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </>
        ) : (
          /* Empty State matching Lovable .chat-empty */
          <div className="chat-empty flex flex-1 flex-col items-center justify-center p-8 text-center select-none">
            <img
              src={dark ? emblemSilver : emblemGold}
              alt="Samvād"
              className="mb-8 w-28 animate-float object-contain drop-shadow-sm dark:drop-shadow-none"
            />
            <p className="mb-3 font-deva text-xl text-muted-foreground">संवाद</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-foreground">
              A little hello.
              <br />
              <em className="text-primary not-italic">A real connection.</em>
            </h2>
            <p className="mt-5 text-sm text-muted-foreground">No conversation selected.</p>

            <button
              type="button"
              onClick={() => setActiveModal("contacts")}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <Plus size={16} />
              New conversation
            </button>

            <div className="mt-16 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={15} className="text-emerald-500" />
              Your email stays private.
            </div>
          </div>
        )}
      </main>

      {/* 4. Conversation & Contact Settings Drawer (.chat-info) */}
      {showDetails && selectedUser && (
        <aside className="chat-info flex flex-col border-l border-border bg-card select-none animate-rise">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Conversation Settings</h3>
            </div>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setShowDetails(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Contact Profile Summary Card */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border border-border bg-secondary">
              <div className="relative">
                <Avatar user={selectedUser} large={true} />
                <span
                  className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${
                    isOnline ? "bg-online" : "bg-muted-foreground/40"
                  }`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>

              <h4 className="mt-3 font-display text-xl font-semibold text-foreground">
                {selectedUser.fullName}
              </h4>
              <p className="text-xs text-primary font-medium mt-0.5">
                {selectedUser.designation || "Available"}
              </p>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {isOnline ? "Active now" : "Offline"}
              </span>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-card px-2.5 py-1 rounded-full border border-border">
                <Lock size={11} />
                <span>Email 100% hidden &amp; private</span>
              </div>
            </div>

            {/* Quick Actions (Call, Video) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => startOutgoingCall(selectedUser, "audio")}
                disabled={isUserBlocked(selectedUser._id) || isBlockedByUser(selectedUser._id) || callState !== "idle"}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-border bg-secondary hover:bg-card text-xs font-semibold text-foreground transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                <Phone size={14} className="text-primary" /> Voice Call
              </button>
              <button
                type="button"
                onClick={() => startOutgoingCall(selectedUser, "video")}
                disabled={isUserBlocked(selectedUser._id) || isBlockedByUser(selectedUser._id) || callState !== "idle"}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-border bg-secondary hover:bg-card text-xs font-semibold text-foreground transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                <Video size={14} className="text-primary" /> Video Call
              </button>
            </div>

            {/* Safety & Block Settings (User Request 2) */}
            <div className="p-4 rounded-xl border border-border bg-secondary space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                <Shield size={14} className="text-primary" />
                <span>Contact Safety &amp; Blocking</span>
              </div>

              {isUserBlocked(selectedUser._id) ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <ShieldAlert size={14} /> Contact Blocked
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      You have blocked {selectedUser.fullName}. They cannot send you messages or start audio/video calls.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnblock(selectedUser._id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition cursor-pointer shadow-xs"
                  >
                    <ShieldCheck size={14} /> Unblock Contact
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Block this user to immediately prevent them from sending messages or calling you.
                  </p>

                  <button
                    type="button"
                    onClick={() => setConfirmBlockTarget(selectedUser)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-destructive/30 bg-card hover:bg-destructive hover:text-destructive-foreground text-xs font-semibold text-destructive transition cursor-pointer"
                  >
                    <UserX size={14} /> Block Contact
                  </button>
                </div>
              )}
            </div>

            {/* Shared Files & Media Gallery */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground uppercase tracking-wider">
                <span>Shared Media ({sharedFiles.length})</span>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border text-[11px]">
                {[
                  { id: "all", label: `All (${sharedFiles.length})` },
                  { id: "photos", label: `Photos (${sharedFiles.filter((m) => m.image).length})` },
                  { id: "videos", label: `Videos (${sharedFiles.filter((m) => m.video).length})` },
                  { id: "audio", label: `Audio (${sharedFiles.filter((m) => m.audio).length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMediaFilter(tab.id)}
                    className={`flex-1 py-1 rounded-md text-center transition cursor-pointer font-medium ${
                      mediaFilter === tab.id
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sharedFiles
                  .filter((m) => {
                    if (mediaFilter === "photos") return Boolean(m.image);
                    if (mediaFilter === "videos") return Boolean(m.video);
                    if (mediaFilter === "audio") return Boolean(m.audio);
                    return true;
                  })
                  .map((m) => (
                    <div
                      key={m._id}
                      className="p-2 rounded-xl border border-border bg-card shadow-xs transition hover:border-primary/40"
                    >
                      <AttachmentPreview
                        msg={m}
                        onOpenImage={(imgUrl) => setViewingImage(imgUrl)}
                        isMe={m.senderId === authUser?._id}
                      />
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                        </span>
                        <span className="font-mono">
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                  ))}

                {sharedFiles.length === 0 && (
                  <p className="p-3 rounded-lg border border-border bg-secondary text-xs text-muted-foreground text-center">
                    No files or photos shared yet.
                  </p>
                )}
              </div>
            </div>

            {/* Conversation Data & Privacy */}
            <div className="p-4 rounded-xl border border-border bg-secondary space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Clock size={13} className="text-primary" />
                <span>24-Hour Ephemeral Chat</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Messages, voice notes, and photos in this conversation automatically vanish 24 hours after being sent.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Clear all conversation history with ${selectedUser.fullName}?`)) {
                    deleteChatHistory(selectedUser._id);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-destructive/30 bg-card hover:bg-destructive/10 text-xs font-semibold text-destructive transition cursor-pointer"
              >
                <Trash2 size={13} /> Clear Chat History Now
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 5. A New Conversation / Contacts Modal */}
      {activeModal === "contacts" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 bg-slate-900/40 dark:bg-black/75">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[85dvh] flex flex-col overflow-hidden animate-rise">
            <div className="flex items-center justify-between pb-4 border-b border-border select-none">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  New Conversation
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Connect privately with any verified Samvād member.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 opacity-70 hover:opacity-100 hover:bg-secondary transition text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary px-3.5 py-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition">
                <Search size={16} className="text-muted-foreground" />
                <input
                  aria-label="Search members"
                  placeholder="Search by name or designation…"
                  className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </label>

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {filteredContacts.map((contact) => {
                  const isBlocked = isUserBlocked(contact._id);
                  return (
                    <div
                      key={contact._id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary hover:bg-card text-left transition group"
                    >
                      <Avatar user={contact} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="block truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {contact.fullName}
                          </span>
                          {isBlocked && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-destructive/15 text-destructive border border-destructive/30">
                              Blocked
                            </span>
                          )}
                        </div>
                        <span className="block truncate text-xs text-muted-foreground">
                          {contact.designation || "Available"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isBlocked ? (
                          <button
                            type="button"
                            onClick={() => handleUnblock(contact._id)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-primary transition cursor-pointer"
                            title="Unblock this user"
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenContactChat(contact)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
                          >
                            <MessageCircle size={14} />
                            <span>Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredContacts.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No members found matching &ldquo;{searchQuery}&rdquo;.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Profile & Settings Modal */}
      {activeModal === "profile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 bg-slate-900/40 dark:bg-black/75">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-rise">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border select-none">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Profile &amp; Settings
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage your identity, security, terms consent, and private data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 opacity-70 hover:opacity-100 hover:bg-secondary transition text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-border p-1 bg-secondary select-none overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProfileTab("profile")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition cursor-pointer shrink-0 ${
                  profileTab === "profile"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User size={13} />
                Profile &amp; Photo
              </button>

              <button
                type="button"
                onClick={() => setProfileTab("security")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition cursor-pointer shrink-0 ${
                  profileTab === "security"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <KeyRound size={13} />
                Security &amp; Password
              </button>

              <button
                type="button"
                onClick={() => setProfileTab("terms")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition cursor-pointer shrink-0 ${
                  profileTab === "terms"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText size={13} />
                Terms &amp; Consent
              </button>

              <button
                type="button"
                onClick={() => setProfileTab("danger")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition cursor-pointer shrink-0 text-destructive ${
                  profileTab === "danger"
                    ? "bg-destructive/15 font-bold shadow-xs"
                    : "hover:bg-destructive/10"
                }`}
              >
                <AlertTriangle size={13} />
                Danger Zone
              </button>
            </div>

            {/* Modal Body with Scrollable View */}
            <div className="flex-1 overflow-y-auto py-5 px-1 space-y-6">
              {/* TAB 1: Profile & Identity */}
              {profileTab === "profile" && (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="flex items-center gap-5 p-4 rounded-xl bg-secondary border border-border">
                    <div className="relative">
                      {selectedProfileImage ? (
                        <span className="chat-avatar h-20 w-20 text-2xl font-bold">
                          <img
                            src={selectedProfileImage}
                            alt="Preview"
                            className="h-full w-full rounded-full object-cover"
                          />
                        </span>
                      ) : (
                        <Avatar user={authUser} large={true} />
                      )}
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-online" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Profile Picture</p>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                        Upload a photo up to 3 MB.
                      </p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition cursor-pointer shadow-xs"
                      >
                        <Camera size={14} />
                        {selectedProfileImage ? "Choose a different photo" : "Change photo"}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                  <label className="block space-y-2 text-sm text-foreground">
                    <span className="font-medium">Full Name</span>
                    <input
                      type="text"
                      value={editName}
                      maxLength={80}
                      required
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-secondary px-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      placeholder="Your full name"
                    />
                  </label>

                  <label className="block space-y-2 text-sm text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Designation / Role</span>
                      <span className="text-[11px] text-primary font-medium">
                        Replaces email ID publicly
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editDesignation}
                      maxLength={100}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-secondary px-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      placeholder="e.g. Software Architect, Designer, Student"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Your designation is visible to other members across chats and directory instead of your email.
                    </p>
                  </label>

                  <label className="block space-y-2 text-sm text-foreground opacity-80">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Registered Email</span>
                      <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                        <Lock size={11} /> 100% Private
                      </span>
                    </div>
                    <input
                      type="email"
                      value={authUser?.email || ""}
                      readOnly
                      disabled
                      className="h-11 w-full rounded-lg border border-border bg-secondary px-3.5 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {isSavingProfile ? "Saving changes…" : "Save Profile"}
                  </button>

                  {/* Direct Shortcuts to Other Settings */}
                  <div className="pt-4 border-t border-border space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Account &amp; Privacy Controls
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setProfileTab("security")}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition cursor-pointer"
                      >
                        <KeyRound size={13} className="text-primary" />
                        <span>Security &amp; Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileTab("terms")}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition cursor-pointer"
                      >
                        <FileText size={13} className="text-primary" />
                        <span>Terms &amp; Consent</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileTab("danger")}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-xs font-medium text-destructive transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Danger Zone</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: Security & Password */}
              {profileTab === "security" && (
                <div className="space-y-6">
                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-4 p-4 rounded-xl border border-border bg-secondary">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                      <KeyRound size={16} className="text-primary" />
                      <span>Change Password</span>
                    </div>

                    <label className="block space-y-1.5 text-sm text-foreground">
                      <span className="text-xs font-medium text-muted-foreground">Current Password</span>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          required
                          onChange={(e) =>
                            setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                          }
                          className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-10 text-sm text-foreground outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((s) => ({ ...s, current: !s.current }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword.current ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </label>

                    <label className="block space-y-1.5 text-sm text-foreground">
                      <span className="text-xs font-medium text-muted-foreground">New Password</span>
                      <div className="relative">
                        <input
                          type={showPassword.next ? "text" : "password"}
                          value={passwordForm.newPassword}
                          required
                          minLength={6}
                          onChange={(e) =>
                            setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                          }
                          className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-10 text-sm text-foreground outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((s) => ({ ...s, next: !s.next }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword.next ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </label>

                    <label className="block space-y-1.5 text-sm text-foreground">
                      <span className="text-xs font-medium text-muted-foreground">Confirm New Password</span>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          required
                          minLength={6}
                          onChange={(e) =>
                            setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                          }
                          className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-10 text-sm text-foreground outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((s) => ({ ...s, confirm: !s.confirm }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                    >
                      {isChangingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      {isChangingPassword ? "Updating password…" : "Update Password"}
                    </button>
                  </form>

                  {/* Session & Privacy info */}
                  <div className="p-4 rounded-xl border border-border bg-secondary space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" /> Session Security &amp; Auto-Logout
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sessions automatically expire after 15 minutes of inactivity on unattended devices. Tokens are stored in secure session memory.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: Terms & Consent Status */}
              {profileTab === "terms" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border border-border bg-secondary space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-emerald-500" /> Terms &amp; Data Consent
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Version {CURRENT_TERMS_VERSION} • {TERMS_LAST_UPDATED}
                      </span>
                    </div>

                    {isLoadingConsent ? (
                      <p className="text-xs text-muted-foreground">Loading consent status…</p>
                    ) : consentRecord?.accepted ? (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1 text-emerald-500 font-medium">
                          <CheckCircle2 size={13} /> You accepted Terms Version {consentRecord.termsVersion}
                        </p>
                        {consentRecord.acceptedAt && (
                          <p>Consent timestamp: {new Date(consentRecord.acceptedAt).toLocaleString()}</p>
                        )}
                        {consentRecord.ipAddress && (
                          <p className="font-mono text-[11px]">
                            Recorded IP: <span className="text-foreground">{consentRecord.ipAddress}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Your account operates under Samvād Version {CURRENT_TERMS_VERSION} Terms &amp; Conditions.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveModal("terms_view")}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition cursor-pointer shadow-xs"
                    >
                      <FileText size={14} className="text-primary" />
                      View Full Terms &amp; Data Authorization
                    </button>
                  </div>

                  {/* 24h Ephemeral Policy */}
                  <div className="p-4 rounded-xl border border-border bg-secondary space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" /> 24-Hour Ephemeral Message Sweep
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every minute, an automated background job sweeps and permanently deletes all messages, voice notes, video clips, and images older than 24 hours. No historical chat logs are archived.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: Danger Zone (Delete Account, Blocked Users & Clear History) */}
              {profileTab === "danger" && (
                <div className="space-y-6">
                  {/* Blocked Contacts Management */}
                  <div className="p-4 rounded-xl border border-border bg-secondary space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UserX size={16} className="text-destructive" />
                        <span>Blocked Contacts ({blockedUsers?.length || 0})</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Contacts you have blocked cannot send you messages or start audio/video calls with you.
                    </p>

                    {blockedUsers && blockedUsers.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {blockedUsers.map((blockedId) => {
                          const contact = allContacts.find((c) => String(c._id) === String(blockedId)) || {
                            _id: blockedId,
                            fullName: "Blocked Contact",
                            designation: "",
                          };
                          return (
                            <div
                              key={blockedId}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar user={contact} />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-foreground">
                                    {contact.fullName}
                                  </p>
                                  {contact.designation && (
                                    <p className="truncate text-[11px] text-muted-foreground">
                                      {contact.designation}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUnblock(blockedId)}
                                className="px-3 py-1 rounded-lg border border-border bg-secondary hover:bg-card text-xs font-semibold text-primary transition cursor-pointer shadow-xs"
                              >
                                Unblock
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No contacts currently blocked.
                      </p>
                    )}
                  </div>

                  {/* Clear History */}
                  <div className="p-4 rounded-xl border border-border bg-secondary space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Clear Conversation History</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Purge all messages in your active conversations right now without deleting your account.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to clear conversation history?")) {
                          if (selectedUser?._id) deleteChatHistory(selectedUser._id);
                          else toast.success("Select a conversation from the sidebar to clear its history.");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition cursor-pointer"
                    >
                      <Trash2 size={14} className="text-primary" />
                      Clear Current Chat History
                    </button>
                  </div>

                  {/* Permanent Account Deletion */}
                  <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 space-y-4">
                    <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                      <AlertTriangle size={16} />
                      <span>Delete My Account Permanently</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Permanently delete your account, authentication credentials, contacts, and personal profile. This action is irreversible.
                    </p>

                    <label className="flex items-start gap-2 text-xs text-foreground select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deleteAckChecked}
                        onChange={(e) => setDeleteAckChecked(e.target.checked)}
                        className="mt-0.5 rounded border-border"
                      />
                      <span>I understand that this action is permanent and cannot be undone.</span>
                    </label>

                    {deleteAckChecked && (
                      <div className="space-y-2 animate-rise">
                        <p className="text-xs font-semibold text-foreground">
                          Type <span className="font-mono text-destructive">DELETE</span> to confirm:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmationText}
                          onChange={(e) => setDeleteConfirmationText(e.target.value)}
                          placeholder="DELETE"
                          className="h-10 w-full rounded-lg border border-destructive/40 bg-card px-3 text-sm text-foreground outline-none uppercase font-mono"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={
                        !deleteAckChecked ||
                        deleteConfirmationText.trim().toUpperCase() !== "DELETE" ||
                        isDeletingAccount
                      }
                      onClick={handleConfirmDeleteAccount}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-destructive py-2.5 text-xs font-semibold text-destructive-foreground hover:opacity-90 transition cursor-pointer disabled:opacity-40"
                    >
                      {isDeletingAccount ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      {isDeletingAccount ? "Deleting account…" : "Permanently Delete Account"}
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-2.5 text-xs font-semibold text-foreground hover:bg-card transition cursor-pointer shadow-xs"
                    >
                      <LogOut size={14} />
                      Sign out of Samvād
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Dedicated Full Terms & Data Authorization Viewer Modal */}
      {activeModal === "terms_view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 bg-slate-900/40 dark:bg-black/75">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-rise">
            <div className="flex items-center justify-between pb-4 border-b border-border select-none">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal("profile")}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Back to profile settings"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Terms &amp; Conditions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Version {CURRENT_TERMS_VERSION} • {TERMS_LAST_UPDATED}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 opacity-70 hover:opacity-100 hover:bg-secondary transition text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 pr-2">
              <TermsContent />
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal("profile")}
                className="px-5 py-2 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition cursor-pointer"
              >
                Back to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Block Contact Confirmation Modal */}
      {confirmBlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 bg-slate-900/40 dark:bg-black/75">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-rise space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground">
                  Block {confirmBlockTarget.fullName}?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  They will not be able to send you messages or start calls.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              When you block this user, your profile picture will be concealed from them, your active call requests will be rejected, and they cannot reach you. You can unblock them at any time from conversation settings or profile danger zone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmBlockTarget(null)}
                disabled={isBlockingAction}
                className="px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-card text-xs font-semibold text-foreground transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={isBlockingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
              >
                {isBlockingAction ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                <span>{isBlockingAction ? "Blocking…" : "Yes, Block Contact"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Image Lightbox Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in-0"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92dvh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-2">
              <a
                href={viewingImage}
                download="shared-photo"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Download full image"
              >
                <Download size={18} />
              </a>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={viewingImage}
              alt="Shared preview"
              className="max-h-[85dvh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
