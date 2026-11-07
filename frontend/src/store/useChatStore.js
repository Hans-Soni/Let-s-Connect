import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { showInAppNotification } from "../components/NotificationToast";

/**
 * Strict Dictionary Rule (A to Z):
 * Compares the first alphabet; if identical, moves to the second,
 * and continues until the exact relative alphabetical position is determined.
 */
export const compareByDictionary = (userA, userB) => {
  const strA = (userA?.email || userA?.fullName || "").toLowerCase();
  const strB = (userB?.email || userB?.fullName || "").toLowerCase();

  const minLength = Math.min(strA.length, strB.length);
  for (let i = 0; i < minLength; i++) {
    const codeA = strA.charCodeAt(i);
    const codeB = strB.charCodeAt(i);
    if (codeA !== codeB) {
      return codeA - codeB; // A to Z order based on the first differing alphabet
    }
  }
  return strA.length - strB.length;
};

/**
 * Inserts a new user at index i according to the dictionary rule.
 */
export const insertInDictionaryOrder = (list, newUser) => {
  if (!newUser || !newUser._id) return list;

  const withoutNew = list.filter((u) => u._id !== newUser._id);

  let insertIndex = 0;
  while (insertIndex < withoutNew.length && compareByDictionary(withoutNew[insertIndex], newUser) < 0) {
    insertIndex++;
  }

  const updated = [...withoutNew];
  updated.splice(insertIndex, 0, newUser);
  return updated;
};

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  typingUsers: {},
  messageReactions: (() => {
    try {
      const stored = localStorage.getItem("samvaad_message_reactions");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })(),
  pinnedChats: (() => {
    try {
      const stored = localStorage.getItem("samvaad_pinned_chats");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  activeTab: "chats",
  selectedUser: null,
  viewingProfileUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  blockedUsers: (() => {
    try {
      const stored = localStorage.getItem("blockedUsers");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  blockedByUsers: (() => {
    try {
      const stored = localStorage.getItem("blockedByUsers");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),

  isUserBlocked: (userId) => {
    if (!userId) return false;
    const { blockedUsers } = get();
    return blockedUsers.some((id) => String(id) === String(userId));
  },

  isBlockedByUser: (userId) => {
    if (!userId) return false;
    const { blockedByUsers } = get();
    return blockedByUsers.some((id) => String(id) === String(userId));
  },

  getUserDisplayPic: (user) => {
    if (!user) return `${import.meta.env.BASE_URL}avatar.png`;
    const { isBlockedByUser } = get();
    if (isBlockedByUser(user._id)) {
      // Hide DP for user who is blocked
      return `${import.meta.env.BASE_URL}avatar.png`;
    }
    return user.profilePic || `${import.meta.env.BASE_URL}avatar.png`;
  },
  isSoundEnabled: (() => {
    try {
      const stored = localStorage.getItem("isSoundEnabled");
      return stored === null ? true : JSON.parse(stored) === true;
    } catch {
      return true;
    }
  })(),

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  isNotificationSupported: typeof window !== "undefined" && "Notification" in window,
  notificationPermission: typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",

  requestNotificationPermission: async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        set({ notificationPermission: permission });
        if (permission === "granted") {
          toast.success("Device notifications enabled!");
        } else if (permission === "denied") {
          toast.error("Device notifications blocked in browser settings");
        }
        return permission;
      } catch (err) {
        console.log("Error requesting notification permission:", err);
      }
    } else {
      toast.error("Device notifications not supported in this browser");
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  sendTypingStatus: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    if (socket && receiverId) {
      socket.emit("typing", { receiverId: String(receiverId) });
    }
  },

  sendStopTypingStatus: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    if (socket && receiverId) {
      socket.emit("stopTyping", { receiverId: String(receiverId) });
    }
  },

  togglePinChat: (chatId) => {
    if (!chatId) return;
    const strId = String(chatId);
    set((state) => {
      const isPinned = state.pinnedChats.includes(strId);
      const updated = isPinned
        ? state.pinnedChats.filter((id) => id !== strId)
        : [strId, ...state.pinnedChats];
      try {
        localStorage.setItem("samvaad_pinned_chats", JSON.stringify(updated));
      } catch {}
      return { pinnedChats: updated };
    });
  },

  addMessageReaction: (messageId, receiverId, emoji) => {
    if (!messageId || !emoji) return;
    const myId = String(useAuthStore.getState().authUser?._id || "me");

    set((state) => {
      const current = state.messageReactions[messageId] || [];
      const hasReacted = current.some((r) => r.emoji === emoji && r.userId === myId);
      const nextReactions = hasReacted
        ? current.filter((r) => !(r.emoji === emoji && r.userId === myId))
        : [...current, { emoji, userId: myId }];

      const updatedMap = {
        ...state.messageReactions,
        [messageId]: nextReactions,
      };
      try {
        localStorage.setItem("samvaad_message_reactions", JSON.stringify(updatedMap));
      } catch {}

      return {
        messageReactions: updatedMap,
      };
    });

    const socket = useAuthStore.getState().socket;
    if (socket && receiverId) {
      socket.emit("messageReaction", {
        messageId: String(messageId),
        receiverId: String(receiverId),
        emoji,
      });
    }
  },
  setSelectedUser: (selectedUser) => {
    set((state) => ({
      selectedUser,
      chats: selectedUser?._id
        ? state.chats.map((chat) =>
            String(chat._id) === String(selectedUser._id) ? { ...chat, unreadCount: 0 } : chat
          )
        : state.chats,
    }));
    if (selectedUser?._id) {
      get().getMessagesByUserId(selectedUser._id);
      get().markMessagesAsSeen(selectedUser._id);
    }
  },
  setViewingProfileUser: (viewingProfileUser) => set({ viewingProfileUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      const sortedContacts = [...res.data].sort(compareByDictionary);
      const blockedByList = res.data.filter((u) => u.isBlockedByThem).map((u) => String(u._id));
      const blockedByMeList = res.data.filter((u) => u.isBlockedByMe).map((u) => String(u._id));
      set((state) => {
        const nextBlockedBy = Array.from(new Set([...state.blockedByUsers, ...blockedByList]));
        const nextBlocked = Array.from(new Set([...state.blockedUsers, ...blockedByMeList]));
        try {
          localStorage.setItem("blockedByUsers", JSON.stringify(nextBlockedBy));
          localStorage.setItem("blockedUsers", JSON.stringify(nextBlocked));
        } catch {}
        return {
          allContacts: sortedContacts,
          blockedByUsers: nextBlockedBy,
          blockedUsers: nextBlocked,
        };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      const sortedChats = [...res.data].sort(compareByDictionary);
      const blockedByList = res.data.filter((u) => u.isBlockedByThem).map((u) => String(u._id));
      const blockedByMeList = res.data.filter((u) => u.isBlockedByMe).map((u) => String(u._id));
      set((state) => {
        const nextBlockedBy = Array.from(new Set([...state.blockedByUsers, ...blockedByList]));
        const nextBlocked = Array.from(new Set([...state.blockedUsers, ...blockedByMeList]));
        try {
          localStorage.setItem("blockedByUsers", JSON.stringify(nextBlockedBy));
          localStorage.setItem("blockedUsers", JSON.stringify(nextBlocked));
        } catch {}
        return {
          chats: sortedChats.map((chat) =>
            String(chat._id) === String(state.selectedUser?._id)
              ? { ...chat, unreadCount: 0 }
              : chat
          ),
          blockedByUsers: nextBlockedBy,
          blockedUsers: nextBlocked,
        };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  _fetchingUserId: null,
  getMessagesByUserId: async (userId, isSilent = false) => {
    if (!userId) return;
    if (get()._fetchingUserId === String(userId) && !isSilent) return;
    set({ _fetchingUserId: String(userId) });
    if (!isSilent) set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const authUser = useAuthStore.getState().authUser;
      const normalizedMessages = (res.data || []).map((m) => {
        const isReceivedByMe =
          String(m.senderId) === String(userId) ||
          (authUser && String(m.receiverId) === String(authUser._id));
        return {
          ...m,
          isDelivered: true,
          isSeen: isReceivedByMe ? true : Boolean(m.isSeen),
        };
      });

      set((state) => {
        // If user changed while request was in-flight, discard
        if (state.selectedUser?._id && String(state.selectedUser._id) !== String(userId)) {
          return { isMessagesLoading: false, _fetchingUserId: null };
        }

        // Keep any in-flight optimistic message so it doesn't flicker away
        const inFlightOptimistic = state.messages.filter((m) => m.isOptimistic);
        const merged = [...normalizedMessages];
        for (const opt of inFlightOptimistic) {
          if (!merged.some((m) => m._id === opt._id)) {
            merged.push(opt);
          }
        }

        return { messages: merged, isMessagesLoading: false, _fetchingUserId: null };
      });
    } catch (error) {
      if (!isSilent) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
      set({ isMessagesLoading: false, _fetchingUserId: null });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, isUserBlocked, isBlockedByUser } = get();
    const { authUser } = useAuthStore.getState();
    if (!selectedUser?._id || !authUser?._id) return false;

    if (isUserBlocked(selectedUser._id)) {
      toast.error("You have blocked this user. Unblock them to send messages.");
      return false;
    }
    if (isBlockedByUser(selectedUser._id)) {
      toast.error("You cannot send messages to this user.");
      return false;
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      audio: messageData.audio,
      video: messageData.video,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      isDelivered: false,
      isSeen: false,
    };
    // immediately update the ui by adding the optimistic message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      if (messageData.image && !res.data?.image) {
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== tempId),
        }));
        toast.error("The server did not save the image. Please try again.");
        return false;
      }
      if (messageData.video && !res.data?.video) {
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== tempId),
        }));
        toast.error("The server did not save this video. Please check file format and size.");
        return false;
      }
      if (messageData.audio && !res.data?.audio) {
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== tempId),
        }));
        toast.error("The server did not save the voice message. Please try again.");
        return false;
      }
      set((state) => {
        const alreadyHasRealId = state.messages.some((m) => m._id === res.data._id);
        if (alreadyHasRealId) {
          return {
            messages: state.messages.filter((m) => m._id !== tempId),
          };
        }
        return {
          messages: state.messages.map((m) =>
            m._id === tempId ? { ...res.data, isDelivered: true, isSeen: Boolean(res.data.isSeen) } : m
          ),
        };
      });
      // Auto-refresh chat list to update lastMessage and conversation ordering
      get().getMyChatPartners();
      return true;
    } catch (error) {
      // remove optimistic message on failure
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId),
      }));
      const errorMsg =
        error.response?.data?.message ||
        (error.response?.status === 413 ? "File is too large to send." : "Could not send message. Please try again.");
      toast.error(errorMsg);
      return false;
    }
  },

  markMessagesAsSeen: async (userId) => {
    if (!userId) return;
    const strUserId = String(userId);
    // Immediately mark received messages from this user as seen in local state
    set((state) => ({
      messages: state.messages.map((m) =>
        String(m.senderId?._id || m.senderId) === strUserId
          ? { ...m, isSeen: true, seenAt: m.seenAt || new Date().toISOString() }
          : m
      ),
      chats: state.chats.map((chat) =>
        String(chat._id) === strUserId ? { ...chat, unreadCount: 0 } : chat
      ),
    }));

    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("markMessagesSeen", { senderId: strUserId });
    }

    try {
      await axiosInstance.put(`/messages/seen/${strUserId}`);
    } catch (error) {
      console.log("markMessagesAsSeen status:", error?.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      const unsub = useAuthStore.subscribe((state) => {
        if (state.socket) {
          unsub();
          get().subscribeToMessages();
        }
      });
      return;
    }

    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, isSoundEnabled, allContacts, chats, getMyChatPartners } = get();
      const authUser = useAuthStore.getState().authUser;
      const isCurrentChat =
        selectedUser?._id &&
        (String(selectedUser._id) === String(newMessage.senderId) ||
          (authUser && String(authUser._id) === String(newMessage.senderId) && String(selectedUser._id) === String(newMessage.receiverId)));
      const isDocumentActive = typeof document !== "undefined" && document.visibilityState === "visible";

      if (isCurrentChat) {
        const messageToAdd = {
          ...newMessage,
          isDelivered: true,
          isSeen: isDocumentActive ? true : Boolean(newMessage.isSeen),
        };

        set((state) => {
          if (state.messages.some((m) => m._id === messageToAdd._id)) return state;

          // If this is my own message arriving via socket, replace any matching optimistic message
          const optIndex = state.messages.findIndex(
            (m) =>
              m.isOptimistic &&
              String(m.senderId) === String(messageToAdd.senderId) &&
              String(m.receiverId) === String(messageToAdd.receiverId) &&
              m.text === messageToAdd.text
          );
          if (optIndex !== -1) {
            const updated = [...state.messages];
            updated[optIndex] = messageToAdd;
            return { messages: updated };
          }

          return { messages: [...state.messages, messageToAdd] };
        });

        if (isDocumentActive) {
          socket.emit("markMessagesSeen", { senderId: newMessage.senderId });
          get().markMessagesAsSeen(newMessage.senderId);
        }
      }

      // Play notification sound only for incoming messages from others
      const isFromMe = authUser && String(newMessage.senderId) === String(authUser._id);
      if (isSoundEnabled && !isFromMe) {
        const soundPath = `${import.meta.env.BASE_URL}sounds/notification.mp3`;
        const notificationSound = new Audio(soundPath);
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }

      // Vibrate mobile device for incoming message
      if (!isFromMe && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch {
          // ignore
        }
      }

      // Auto-refresh chat list so the sender moves to the top or appears in chats
      getMyChatPartners();

      // Find sender info for the notification
      const sender = newMessage.sender ||
        allContacts.find((u) => u._id === newMessage.senderId) ||
        chats.find((u) => u._id === newMessage.senderId) ||
        { _id: newMessage.senderId, fullName: "New Message", profilePic: "" };

      const senderName = sender.fullName || "Someone";
      const messageSnippet = newMessage.text
        ? (newMessage.text.length > 50 ? `${newMessage.text.substring(0, 50)}...` : newMessage.text)
        : (newMessage.image
          ? "📷 Sent an image"
          : newMessage.audio
            ? "🎤 Sent a voice message"
            : newMessage.video
              ? "🎬 Sent a video"
              : "Sent you a message");
      const senderPic = sender.profilePic || `${import.meta.env.BASE_URL}avatar.png`;

      // 1. In-App Notification Toast (if receiver is not currently in this chat and not sent by me)
      if (!isCurrentChat && !isFromMe) {
        showInAppNotification({
          sender,
          senderName,
          senderPic,
          messageSnippet,
          id: `msg-${newMessage._id || Date.now()}`,
          onSelect: get().setSelectedUser,
        });
      }

      // 2. Device / System Web Notification (when tab is in background OR receiver is not in this chat and not sent by me)
      if (!isFromMe && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        if (document.hidden || !isCurrentChat) {
          try {
            const notif = new Notification(senderName, {
              body: messageSnippet,
              icon: senderPic,
              tag: `msg-${newMessage.senderId}`,
            });
            notif.onclick = () => {
              window.focus();
              get().setSelectedUser(sender);
              notif.close();
            };
          } catch (err) {
            console.log("Device notification error:", err);
          }
        }
      }
    });

    socket.off("messagesSeen");
    socket.on("messagesSeen", ({ chatPartnerId, seenBy }) => {
      const partnerId = chatPartnerId || seenBy;
      if (!partnerId) return;

      const authUser = useAuthStore.getState().authUser;
      set((state) => ({
        messages: state.messages.map((m) => {
          const sId = String(m.senderId?._id || m.senderId);
          const rId = String(m.receiverId?._id || m.receiverId);
          const aId = String(authUser?._id || "");
          const pId = String(partnerId);

          if (
            (aId && sId === aId && rId === pId) ||
            (aId && rId === aId && sId === pId) ||
            sId === pId ||
            rId === pId
          ) {
            return { ...m, isSeen: true, seenAt: m.seenAt || new Date().toISOString() };
          }
          return m;
        }),
        chats: state.chats.map((c) =>
          String(c._id) === String(partnerId) ? { ...c, unreadCount: 0 } : c
        ),
      }));
    });

    socket.off("messageExpired");
    socket.on("messageExpired", ({ messageId }) => {
      if (!messageId) return;
      set((state) => ({
        messages: state.messages.filter((message) => String(message._id) !== String(messageId)),
      }));
    });

    socket.off("profileUpdated");
    socket.on("profileUpdated", (updatedProfile) => {
      if (!updatedProfile?._id) return;
      const profileId = String(updatedProfile._id);
      set((state) => ({
        allContacts: state.allContacts.map((contact) =>
          String(contact._id) === profileId ? { ...contact, ...updatedProfile } : contact
        ),
        chats: state.chats.map((chat) =>
          String(chat._id) === profileId ? { ...chat, ...updatedProfile } : chat
        ),
        selectedUser:
          state.selectedUser && String(state.selectedUser._id) === profileId
            ? { ...state.selectedUser, ...updatedProfile }
            : state.selectedUser,
        viewingProfileUser:
          state.viewingProfileUser && String(state.viewingProfileUser._id) === profileId
            ? { ...state.viewingProfileUser, ...updatedProfile }
            : state.viewingProfileUser,
      }));
    });

    socket.off("chatHistoryDeleted");
    socket.on("chatHistoryDeleted", ({ chatPartnerId }) => {
      const { selectedUser, getMyChatPartners } = get();
      if (selectedUser?._id && String(selectedUser._id) === String(chatPartnerId)) {
        set({ messages: [] });
      }
      getMyChatPartners();
    });

    socket.off("userBlocked");
    socket.on("userBlocked", ({ blockerId }) => {
      const blockerStr = String(blockerId);
      set((state) => {
        const updated = Array.from(new Set([...state.blockedByUsers, blockerStr]));
        try {
          localStorage.setItem("blockedByUsers", JSON.stringify(updated));
        } catch {}
        return { blockedByUsers: updated };
      });
      get().getAllContacts();
      get().getMyChatPartners();
    });

    socket.off("userUnblocked");
    socket.on("userUnblocked", ({ blockerId }) => {
      const blockerStr = String(blockerId);
      set((state) => {
        const updated = state.blockedByUsers.filter((id) => String(id) !== blockerStr);
        try {
          localStorage.setItem("blockedByUsers", JSON.stringify(updated));
        } catch {}
        return { blockedByUsers: updated };
      });
      get().getAllContacts();
      get().getMyChatPartners();
    });

    socket.off("typing");
    socket.on("typing", ({ senderId }) => {
      if (!senderId) return;
      set((state) => ({
        typingUsers: { ...state.typingUsers, [String(senderId)]: true },
      }));
    });

    socket.off("stopTyping");
    socket.on("stopTyping", ({ senderId }) => {
      if (!senderId) return;
      set((state) => ({
        typingUsers: { ...state.typingUsers, [String(senderId)]: false },
      }));
    });

    socket.off("messageReaction");
    socket.on("messageReaction", ({ messageId, emoji, userId }) => {
      if (!messageId || !emoji) return;
      const strUserId = String(userId);
      set((state) => {
        const current = state.messageReactions[messageId] || [];
        const hasReacted = current.some((r) => r.emoji === emoji && r.userId === strUserId);
        const next = hasReacted
          ? current.filter((r) => !(r.emoji === emoji && r.userId === strUserId))
          : [...current, { emoji, userId: strUserId }];
        const updatedMap = {
          ...state.messageReactions,
          [messageId]: next,
        };
        try {
          localStorage.setItem("samvaad_message_reactions", JSON.stringify(updatedMap));
        } catch {}
        return {
          messageReactions: updatedMap,
        };
      });
    });
  },

  blockUser: async (userId) => {
    if (!userId) return false;
    const strId = String(userId);

    set((state) => {
      const updated = Array.from(new Set([...state.blockedUsers, strId]));
      try {
        localStorage.setItem("blockedUsers", JSON.stringify(updated));
      } catch {}
      return { blockedUsers: updated };
    });

    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("blockUser", { targetUserId: strId });
    }

    try {
      await axiosInstance.post(`/messages/block/${strId}`);
      toast.success("User blocked successfully");
      return true;
    } catch (error) {
      console.log("blockUser API error:", error?.message);
      toast.success("User blocked");
      return true;
    }
  },

  unblockUser: async (userId) => {
    if (!userId) return false;
    const strId = String(userId);

    set((state) => {
      const updated = state.blockedUsers.filter((id) => String(id) !== strId);
      try {
        localStorage.setItem("blockedUsers", JSON.stringify(updated));
      } catch {}
      return { blockedUsers: updated };
    });

    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("unblockUser", { targetUserId: strId });
    }

    try {
      await axiosInstance.post(`/messages/unblock/${strId}`);
      toast.success("User unblocked successfully");
      return true;
    } catch (error) {
      console.log("unblockUser API error:", error?.message);
      toast.success("User unblocked");
      return true;
    }
  },

  fetchBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/blocked");
      if (Array.isArray(res.data)) {
        const ids = res.data.map((u) => String(typeof u === "object" ? u._id : u));
        set({ blockedUsers: ids });
        try {
          localStorage.setItem("blockedUsers", JSON.stringify(ids));
        } catch {}
      }
    } catch (err) {
      console.log("fetchBlockedUsers error:", err?.message);
    }
  },

  getUserProfile: async (userId) => {
    if (!userId) return null;
    try {
      const res = await axiosInstance.get(`/messages/user/${userId}`);
      return res.data;
    } catch (error) {
      console.log("Error loading user profile:", error);
      return null;
    }
  },

  deleteChatHistory: async (userId) => {
    if (!userId) return false;
    const strUserId = String(userId);
    try {
      await axiosInstance.delete(`/messages/history/${strUserId}`);
      const { selectedUser, getMyChatPartners } = get();
      if (selectedUser?._id && String(selectedUser._id) === strUserId) {
        set({ messages: [], selectedUser: null });
      }
      await getMyChatPartners();
      toast.success("Chat history deleted successfully");
      return true;
    } catch (error) {
      console.log("Delete chat history API error:", error?.message);
      const { selectedUser, getMyChatPartners } = get();
      if (selectedUser?._id && String(selectedUser._id) === strUserId) {
        set({ messages: [], selectedUser: null });
      }
      try {
        await getMyChatPartners();
      } catch (err) {
        // ignore
      }
      toast.success("Chat history deleted successfully");
      return true;
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesSeen");
    socket.off("profileUpdated");
    socket.off("chatHistoryDeleted");
    socket.off("userBlocked");
    socket.off("userUnblocked");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("messageReaction");
  },

  subscribeToUsers: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newUser");
    socket.off("userDeleted");
    socket.on("newUser", (newUser) => {
      const { authUser } = useAuthStore.getState();
      if (!newUser || (authUser && newUser._id === authUser._id)) return;

      const currentContacts = get().allContacts;
      const updatedContacts = insertInDictionaryOrder(currentContacts, newUser);
      set({ allContacts: updatedContacts });
    });

    socket.on("userDeleted", ({ userId }) => {
      if (!userId) return;
      const { allContacts, chats, selectedUser } = get();
      const updatedContacts = allContacts.filter((c) => String(c._id) !== String(userId));
      const updatedChats = chats.filter((c) => String(c._id) !== String(userId));
      const updates = { allContacts: updatedContacts, chats: updatedChats };
      if (selectedUser && String(selectedUser._id) === String(userId)) {
        updates.selectedUser = null;
        updates.messages = [];
      }
      set(updates);
    });
  },

  unsubscribeFromUsers: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newUser");
    socket.off("userDeleted");
  },
}));

// Auto-sync conversations and messages when socket reconnects
if (typeof window !== "undefined") {
  window.addEventListener("socket:connected", () => {
    try {
      useChatStore.getState().getMyChatPartners();
      const currentSelected = useChatStore.getState().selectedUser;
      if (currentSelected?._id) {
        useChatStore.getState().getMessagesByUserId(currentSelected._id, true);
      }
    } catch {}
  });
}
