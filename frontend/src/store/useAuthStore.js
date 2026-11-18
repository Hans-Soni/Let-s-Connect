import { create } from "zustand";
import { Capacitor } from "@capacitor/core";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useCallStore } from "./useCallStore";
import { enableMobileBackgroundMode } from "../lib/nativeCall";

const registerCurrentDevice = () => {
  try {
    const isNative = Capacitor.isNativePlatform();
    const isPwa = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
    const isMobile = isNative || isPwa || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || "");
    const platform = isNative ? "android" : (isPwa ? "pwa" : (isMobile ? "mobile" : "web"));
    axiosInstance.post("/auth/register-device", { platform }).catch(() => {});
  } catch (e) {}
};

const PRODUCTION_BACKEND_URL = "https://let-s-connect-backend.onrender.com";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.MODE === "development" 
  ? "http://localhost:5002" 
  : PRODUCTION_BACKEND_URL);

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isSendingOtp: false,
  isLoggingIn: false,
  isDeletingAccount: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    const token = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");
    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      return;
    }
    sessionStorage.setItem("jwt", token);
    localStorage.setItem("jwt", token);

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      registerCurrentDevice();
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

  sendSignupOtp: async (data) => {
    set({ isSendingOtp: true });
    try {
      const res = await axiosInstance.post("/auth/send-signup-otp", data);
      toast.success(res.data?.message || "Verification code sent to your email!");
      return { success: true, email: res.data?.email };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to send verification code";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        retryAfter: error.response?.data?.retryAfter,
      };
    } finally {
      set({ isSendingOtp: false });
    }
  },

  sendPasswordResetOtp: async (email) => {
    try {
      const res = await axiosInstance.post("/auth/send-reset-otp", { email });
      toast.success(res.data?.message || "Verification code sent to your email!");
      return { success: true, email: res.data?.email };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to send reset code";
      toast.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        retryAfter: error.response?.data?.retryAfter,
      };
    }
  },

  verifyPasswordResetOtp: async (email, otp) => {
    try {
      const res = await axiosInstance.post("/auth/verify-reset-otp", { email, otp });
      toast.success(res.data?.message || "Verification code confirmed!");
      return { success: true, resetToken: res.data?.resetToken };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Invalid or expired code";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  },

  resetPassword: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/reset-password", data);
      toast.success(res.data?.message || "Password changed successfully!");
      return { success: true, message: res.data?.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to reset password";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      sessionStorage.setItem("jwt", res.data.token);
      localStorage.setItem("jwt", res.data.token);
      set({ authUser: res.data });
      registerCurrentDevice();

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
      localStorage.setItem("jwt", res.data.token);
      set({ authUser: res.data });
      registerCurrentDevice();

      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleLogin: async ({ credential, accessToken, clientIp, dataConsent = false }) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/google", { credential, accessToken, clientIp, dataConsent });

      if (res.data?.requiresConsent) {
        return { requiresConsent: true, userDetails: res.data };
      }

      sessionStorage.setItem("jwt", res.data.token);
      localStorage.setItem("jwt", res.data.token);
      set({ authUser: res.data });
      registerCurrentDevice();

      toast.success(
        res.data.isNewUser
          ? `Account created! Welcome, ${res.data.fullName}`
          : `Welcome back, ${res.data.fullName}!`
      );

      get().connectSocket();
      return { success: true, authUser: res.data };
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Google Sign-In failed");
      return { success: false, error: error.response?.data?.message || error.message };
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

  deleteAccount: async () => {
    set({ isDeletingAccount: true });
    try {
      await axiosInstance.delete("/auth/delete-account");
      sessionStorage.removeItem("jwt");
      localStorage.removeItem("jwt");
      set({ authUser: null });
      toast.success("Your account and data have been permanently deleted.");
      get().disconnectSocket();
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to delete account");
      return false;
    } finally {
      set({ isDeletingAccount: false });
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
    const { authUser, socket: existingSocket } = get();
    if (!authUser) return;
    if (existingSocket?.connected) return;

    const token = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");

    const isNative = Capacitor.isNativePlatform();
    const isPwa = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
    const clientPlatform = isNative ? "android" : (isPwa ? "pwa" : "web");

    if (existingSocket && !existingSocket.connected) {
      existingSocket.auth = { token };
      existingSocket.io.opts.query = { token, platform: clientPlatform };
      existingSocket.connect();
      return;
    }

    const socket = io(BASE_URL, {
      auth: (cb) => {
        cb({ token: sessionStorage.getItem("jwt") || localStorage.getItem("jwt") });
      },
      query: { token, platform: clientPlatform },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.connect();

    socket.on("connect", () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("socket:connected"));
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection warning:", err.message);
    });

    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Initialize WebRTC calling listeners
    useCallStore.getState().initSocketListeners(socket);
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      useCallStore.getState().cleanupSocketListeners(socket);
      if (socket.connected) socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));

// Listen for custom events dispatched by the axios interceptor
if (typeof window !== "undefined") {
  window.addEventListener("auth:session-expired", () => {
    useAuthStore.getState().handleSessionExpired();
  });
  window.addEventListener("auth:token-refreshed", (e) => {
    const { socket, authUser } = useAuthStore.getState();
    if (socket && e.detail?.token) {
      socket.auth = { token: e.detail.token };
      if (!socket.connected) {
        socket.connect();
      }
    }
    if (e.detail?.token && authUser?._id) {
      enableMobileBackgroundMode({
        serverUrl: axiosInstance.defaults.baseURL,
        userId: String(authUser._id),
        token: e.detail.token,
      });
    }
  });
}
