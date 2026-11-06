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
} from "lucide-react";
import toast from "react-hot-toast";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useCallStore } from "../store/useCallStore";

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

// Animated theme toggle button
function ThemeToggle({ dark, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
      title={dark ? "Light mode" : "Dark mode"}
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

  const { authUser, logout, onlineUsers, updateProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { startOutgoingCall, callState } = useCallStore();

  const dark = theme === "dark";

  // State matching Lovable ChatWorkspace
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState(null); // null | 'contacts' | 'profile'
  const [showDetails, setShowDetails] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null); // file
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Profile modal edit states
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
    localStorage.setItem("samvaad-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextDark);
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
    return chats.filter((c) =>
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

  // Start a new conversation from contacts
  const handleOpenContactChat = (contact) => {
    setSelectedUser(contact);
    setActiveModal(null);
    setSearchQuery("");
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

  // Save profile
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: editName.trim() || authUser?.fullName,
        designation: editDesignation.trim() || "Samvād member",
      });
      setActiveModal(null);
      toast.success("Profile saved.");
    } catch {
      toast.error("Profile could not be saved.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Profile photo upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      toast.error("Choose an image smaller than 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateProfile({ profilePic: reader.result });
        toast.success("Profile photo updated.");
      } catch {
        toast.error("Profile photo could not be saved.");
      }
    };
    reader.readAsDataURL(file);
  };

  const isOnline = selectedUser?._id ? onlineUsers.includes(selectedUser._id) : false;

  // Shared files in current conversation
  const sharedFiles = messages.filter((m) => m.image || m.video || m.audio);

  return (
    <div className="chat-app bg-background text-foreground">
      {/* 1. Chat Rail (Leftmost navigation icon bar) */}
      <nav className="chat-rail flex flex-col items-center gap-5 border-r border-border bg-card py-6 select-none z-10">
        <Link to="/" aria-label="Samvād messages" title="Samvād home">
          <img
            src={dark ? emblemSilver : emblemGold}
            alt="Samvād"
            className="h-9 w-auto transition-transform hover:scale-105"
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
            variant="ghost"
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
            title="Profile settings"
            aria-label="Profile settings"
            onClick={() => {
              setEditName(authUser?.fullName || "");
              setEditDesignation(authUser?.designation || "");
              setActiveModal("profile");
            }}
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

          <label className="flex h-11 items-center gap-3 rounded-lg bg-secondary px-3 text-muted-foreground focus-within:ring-1 focus-within:ring-primary/40">
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

        {/* Filter Bar */}
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
                  isSelected ? "bg-accent text-accent-foreground" : "hover:bg-secondary/50 text-foreground"
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
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
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

        {/* Sidebar Footer: Current User Status Bar */}
        <div className="flex items-center gap-3 border-t border-border px-6 py-5 select-none bg-card/50">
          <Avatar user={authUser} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{authUser?.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {authUser?.designation || "Available"}
            </p>
          </div>
          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-online" title="Online" />
        </div>
      </aside>

      {/* 3. Chat Main Area */}
      <main className={`chat-main flex min-h-0 min-w-0 flex-col ${selectedUser ? "" : "hidden md:flex"}`}>
        {selectedUser ? (
          <>
            {/* Header */}
            <header className="flex h-24 shrink-0 items-center gap-3 border-b border-border bg-card/70 px-5 md:px-8 select-none">
              <button
                type="button"
                aria-label="Back to conversations"
                className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft size={18} />
              </button>

              <Avatar user={selectedUser} />

              <div className="min-w-0">
                <h2 className="truncate font-semibold text-foreground text-base sm:text-lg">
                  {selectedUser.fullName}
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {selectedUser.designation || (isOnline ? "Online" : "Offline")}
                </p>
              </div>

              {/* Call buttons (preserves real WebRTC audio/video call) */}
              <div className="ml-auto flex items-center gap-1">
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
                          className={`mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground select-none ${
                            isMe ? "justify-end" : ""
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
                              <Check size={13} />
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
            <div className="shrink-0 border-t border-border bg-card/60 px-5 pb-5 pt-4 md:px-8">
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
              className="mb-8 w-28 animate-float object-contain"
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
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition cursor-pointer"
            >
              <Trash2 size={14} /> Clear chat history
            </button>
          </div>
        </aside>
      )}

      {/* 5. Accessible Modals (Contacts & Profile Settings) matching Lovable */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl max-h-[85dvh] overflow-y-auto animate-rise">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {activeModal === "profile" ? "Your profile" : "A new conversation"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeModal === "profile"
                ? "Your name and designation are visible to other members."
                : "Find a Samvād member."}
            </p>

            {/* Modal Body */}
            {activeModal === "contacts" ? (
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
                      <MessageCircle size={18} className="text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                    </button>
                  ))}

                  {filteredContacts.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No other members found.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Profile Modal */
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-5">
                  <Avatar user={authUser} large={true} />
                  <div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-sm font-semibold text-foreground transition cursor-pointer"
                    >
                      <Camera size={16} />
                      Change photo
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
                  <span className="font-medium">Full name</span>
                  <input
                    type="text"
                    value={editName}
                    maxLength={80}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-11 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="Your name"
                  />
                </label>

                <label className="block space-y-2 text-sm text-foreground">
                  <span className="font-medium">Designation</span>
                  <input
                    type="text"
                    value={editDesignation}
                    maxLength={100}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="h-11 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="e.g. Software Architect, Designer"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  <Check size={16} />
                  {isSavingProfile ? "Saving…" : "Save profile"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
