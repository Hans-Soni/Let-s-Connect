import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.MODE === "development" 
  ? "http://localhost:5002" 
  : "/");

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    // If user left/closed the website, sessionStorage is empty
    const token = sessionStorage.getItem("jwt");
    if (!token) {
      localStorage.removeItem("jwt");
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);
      if (error.response?.status === 401) {
        sessionStorage.removeItem("jwt");
        localStorage.removeItem("jwt");
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      sessionStorage.setItem("jwt", res.data.token);
      localStorage.removeItem("jwt");
      set({ authUser: res.data });

      toast.success("Account created successfully!");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      sessionStorage.setItem("jwt", res.data.token);
      localStorage.removeItem("jwt");
      set({ authUser: res.data });

      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      sessionStorage.removeItem("jwt");
      localStorage.removeItem("jwt");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      sessionStorage.removeItem("jwt");
      localStorage.removeItem("jwt");
      set({ authUser: null });
      toast.error("Error logging out");
      console.log("Logout error:", error);
    }
  },

  /** Called by the axios interceptor when a token refresh attempt fails. */
  handleSessionExpired: () => {
    sessionStorage.removeItem("jwt");
    localStorage.removeItem("jwt");
    set({ authUser: null });
    get().disconnectSocket();
    toast.error("Your session has expired. Please log in again.", { duration: 5000 });
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
      return res.data;
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response?.data?.message || error.message || "Update profile failed");
      return null;
    }
  },

  getConsentRecord: async () => {
    try {
      const res = await axiosInstance.get("/auth/consent");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to load consent record");
      return null;
    }
  },

  changePassword: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/change-password", data);
      toast.success(res.data.message || "Password changed successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to change password");
      return false;
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: { token: sessionStorage.getItem("jwt") },
      withCredentials: true, // this ensures cookies are sent with the connection
    });

    socket.connect();

    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));

// Listen for the custom event dispatched by the axios interceptor when
// a silent token refresh fails, so users are never silently left broken.
if (typeof window !== "undefined") {
  window.addEventListener("auth:session-expired", () => {
    useAuthStore.getState().handleSessionExpired();
  });
}

