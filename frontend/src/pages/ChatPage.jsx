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

// Attachment media renderer matching Lovable
function AttachmentPreview({ msg }) {
  if (msg.image) {
    return (
      <a href={msg.image} target="_blank" rel="noreferrer" className="block mb-2">
        <img
          src={msg.image}
          alt="Shared"
          className="max-h-64 max-w-full rounded-md object-cover hover:opacity-95 transition"
        />
      </a>
    );
  }
  if (msg.video) {
    return (
      <video
        controls
        preload="metadata"
        src={msg.video}
        className="mb-2 max-h-64 max-w-full rounded-md"
      />
    );
  }
  if (msg.audio) {
    return (
      <audio controls preload="metadata" src={msg.audio} className="mb-2 w-full max-w-64" />
    );
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
    deleteChatHistory,
    markMessagesAsSeen,
    getMyChatPartners,
    getAllContacts,
    subscribeToMessages,
    unsubscribeFromMessages,
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
      markMessagesAsSeen(selectedUser._id);
      setText("");
      setAttachment(null);
      setAttachmentPreviewUrl(null);
      setShowDetails(false);
      textareaRef.current?.focus();
    }
  }, [selectedUser, markMessagesAsSeen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedUser]);

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
        const dataUrl = await base64Promise;

        if (attachment.type.startsWith("image/")) imageBase64 = dataUrl;
        else if (attachment.type.startsWith("video/")) videoBase64 = dataUrl;
        else if (attachment.type.startsWith("audio/")) audioBase64 = dataUrl;
        else imageBase64 = dataUrl;
      }

      await sendMessage({
        text: text.trim(),
        image: imageBase64,
        video: videoBase64,
        audio: audioBase64,
      });

      setText("");
      setAttachment(null);
      if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
      setAttachmentPreviewUrl(null);
      textareaRef.current?.focus();
    } catch {
      toast.error("Message not sent. Your message is still here—try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Voice note toggle
  const handleVoiceNote = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 10 * 1024 * 1024) {
          toast.error("Recording is too large. Please record a shorter note.");
        } else {
          const file = new File([blob], "voice-note.webm", { type: blob.type });
          setAttachment(file);
          setAttachmentPreviewUrl(URL.createObjectURL(blob));
        }
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access is unavailable. Check your browser permissions.");
    }
  };

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Choose a file smaller than 10 MB.");
        return;
      }
      setAttachment(file);
      setAttachmentPreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = "";
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
              className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition cursor-pointer shadow-xs"
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
                    : "hover:bg-secondary/60 text-foreground"
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
                    {lastMsg?.text || (lastMsg?.image ? "📷 Photo" : "Start a conversation")}
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
          className="flex items-center gap-3 border-t border-border px-6 py-5 select-none bg-card/70 hover:bg-secondary/60 transition cursor-pointer text-left group"
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
            <header className="flex h-24 shrink-0 items-center gap-3 border-b border-border bg-card/85 px-5 md:px-8 select-none">
              <button
                type="button"
                aria-label="Back to conversations"
                className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft size={18} />
              </button>

              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer group"
                onClick={() => setShowDetails(!showDetails)}
                title="View details"
              >
                <Avatar user={selectedUser} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors">
                    {selectedUser.fullName}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {selectedUser.designation || (isOnline ? "Online" : "Offline")}
                  </p>
                </div>
              </div>

              {/* Call buttons (preserves WebRTC calling) */}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startOutgoingCall(selectedUser, "audio")}
                  disabled={callState !== "idle"}
                  aria-label="Voice call"
                  title="Voice call"
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-40"
                >
                  <Phone size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => startOutgoingCall(selectedUser, "video")}
                  disabled={callState !== "idle"}
                  aria-label="Video call"
                  title="Video call"
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-40"
                >
                  <Video size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  aria-label="Conversation details"
                  title="Conversation details"
                  className={`grid h-9 w-9 place-items-center rounded-lg transition cursor-pointer ${
                    showDetails
                      ? "bg-secondary text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Info size={18} />
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

              {messages.length === 0 && (
                <p className="py-12 text-center font-display text-xl text-muted-foreground select-none">
                  Say hello to {selectedUser.fullName}.
                </p>
              )}

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
                        <div className={`chat-bubble text-left ${isMe ? "chat-bubble-own" : "chat-bubble-peer"}`}>
                          <AttachmentPreview msg={msg} />
                          {msg.text && (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {msg.text}
                            </p>
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
            <div className="shrink-0 border-t border-border bg-card/85 px-5 pb-5 pt-4 md:px-8">
              {/* Attachment Preview Banner */}
              {attachment && (
                <div className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary animate-rise">
                  <span className="truncate font-medium">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
                      setAttachmentPreviewUrl(null);
                    }}
                    className="cursor-pointer hover:opacity-80 p-0.5"
                    title="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Emoji bar */}
              {showEmojiPicker && (
                <div className="mb-2 flex gap-1 animate-rise">
                  {["😊", "❤️", "👋", "🙌", "👍", "✨"].map((emoji) => (
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
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
                >
                  <ImagePlus size={18} />
                </button>

                <textarea
                  ref={textareaRef}
                  aria-label="Message"
                  placeholder="Write a message…"
                  rows={1}
                  maxLength={10000}
                  className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground"
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
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-card transition cursor-pointer shrink-0 ${
                    showEmojiPicker ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smile size={18} />
                </button>

                <button
                  type="button"
                  aria-label={isRecording ? "Stop recording" : "Record voice note"}
                  title={isRecording ? "Stop recording" : "Voice note"}
                  onClick={handleVoiceNote}
                  className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-card transition cursor-pointer shrink-0 ${
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
                  <Send size={18} />
                </button>
              </form>

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

      {/* 4. Conversation Details Drawer (.chat-info) */}
      {showDetails && selectedUser && (
        <aside className="chat-info flex flex-col items-center border-l border-border bg-card px-6 py-8 select-none animate-rise">
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setShowDetails(false)}
            className="self-end p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="mt-4">
            <Avatar user={selectedUser} large={true} />
          </div>

          <h3 className="mt-5 text-center font-display text-2xl font-semibold text-foreground">
            {selectedUser.fullName}
          </h3>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {selectedUser.designation || (isOnline ? "Online" : "Offline")}
          </p>

          <div className="mt-10 w-full border-t border-border pt-6">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Shared files
            </h4>
            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
              {sharedFiles.map((m) => (
                <div key={m._id} className="text-sm">
                  <AttachmentPreview msg={m} />
                </div>
              ))}
              {sharedFiles.length === 0 && (
                <p className="text-sm text-muted-foreground">No shared files yet.</p>
              )}
            </div>
          </div>

          <div className="mt-8 w-full border-t border-border pt-6">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear chat history with this user?")) {
                  deleteChatHistory(selectedUser._id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer border border-destructive/20"
            >
              <Trash2 size={14} /> Clear chat history
            </button>
          </div>
        </aside>
      )}

      {/* 5. A New Conversation Modal */}
      {activeModal === "contacts" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[85dvh] overflow-y-auto animate-rise">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-2xl font-semibold text-foreground">
              A new conversation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Find a Samvād member to connect privately.
            </p>

            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 p-3">
                <Search size={16} className="text-muted-foreground" />
                <input
                  aria-label="Search members"
                  placeholder="Search by name or designation"
                  className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </label>

              <div className="space-y-1 max-h-80 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact._id}
                    type="button"
                    onClick={() => handleOpenContactChat(contact)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-left transition cursor-pointer group"
                  >
                    <Avatar user={contact} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {contact.fullName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {contact.designation || "Available"}
                      </span>
                    </span>
                    <MessageCircle
                      size={18}
                      className="text-muted-foreground group-hover:text-primary transition-colors ml-auto"
                    />
                  </button>
                ))}

                {filteredContacts.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No members found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Profile & Settings Modal */}
      {activeModal === "profile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in-0">
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
            <div className="flex items-center gap-1 border-b border-border p-1 bg-secondary/40 select-none overflow-x-auto text-xs font-semibold">
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
                  <div className="flex items-center gap-5 p-4 rounded-xl bg-secondary/40 border border-border/60">
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
                      className="h-11 w-full rounded-lg border border-border bg-secondary/50 px-3.5 text-sm text-muted-foreground cursor-not-allowed"
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
                  <form onSubmit={handleChangePassword} className="space-y-4 p-4 rounded-xl border border-border bg-secondary/30">
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
                  <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
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
                  <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
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
                  <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" /> 24-Hour Ephemeral Message Sweep
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every minute, an automated background job sweeps and permanently deletes all messages, voice notes, video clips, and images older than 24 hours. No historical chat logs are archived.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: Danger Zone (Delete Account & Clear History) */}
              {profileTab === "danger" && (
                <div className="space-y-6">
                  {/* Clear History */}
                  <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
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
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/80 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in-0">
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
    </div>
  );
}
