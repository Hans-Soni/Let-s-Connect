import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

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
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
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

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      const sortedContacts = [...res.data].sort(compareByDictionary);
      set({ allContacts: sortedContacts });
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
      set({ chats: sortedChats });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    if (!selectedUser?._id || !authUser?._id) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    // immediately update the ui by adding the optimistic message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({
        messages: state.messages.map((m) => (m._id === tempId ? res.data : m)),
      }));
    } catch (error) {
      // remove optimistic message on failure
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId),
      }));
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set((state) => {
        if (state.messages.some((m) => m._id === newMessage._id)) return state;
        return { messages: [...state.messages, newMessage] };
      });

      if (isSoundEnabled) {
        const soundPath = `${import.meta.env.BASE_URL}sounds/notification.mp3`;
        const notificationSound = new Audio(soundPath);

        notificationSound.currentTime = 0; // reset to start
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },

  subscribeToUsers: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newUser");
    socket.on("newUser", (newUser) => {
      const { authUser } = useAuthStore.getState();
      if (!newUser || (authUser && newUser._id === authUser._id)) return;

      const currentContacts = get().allContacts;
      const updatedContacts = insertInDictionaryOrder(currentContacts, newUser);
      set({ allContacts: updatedContacts });
    });
  },

  unsubscribeFromUsers: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newUser");
  },
}));
