import { Navigate, Route, Routes, useLocation } from "react-router";
import { useEffect, lazy, Suspense } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useAuthStore } from "./store/useAuthStore";
import PageLoader from "./components/PageLoader";
import GlobalThemeToggle from "./components/GlobalThemeToggle";
import { useThemeStore } from "./store/useThemeStore";
import CallModal from "./components/CallModal";
import InstallAppBanner from "./components/InstallAppBanner";
import toast, { Toaster } from "react-hot-toast";
import { axiosInstance } from "./lib/axios";
import { enableMobileBackgroundMode } from "./lib/nativeCall";
import { useCallStore } from "./store/useCallStore";

// Code-split pages for smaller initial bundle and faster load performance
const ChatPage = lazy(() => import("./pages/ChatPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function App() {
  const { checkAuth, isCheckingAuth, authUser, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Request notification permission for incoming call banners
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Prime Web Audio context on initial user interaction to ensure call ringtones play freely
  useEffect(() => {
    const unlockAudio = () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const dummy = new AudioContextClass();
        dummy.resume().then(() => dummy.close()).catch(() => {});
      }
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("click", unlockAudio, { passive: true });
    return () => {
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  // Register device platform with backend and enable background call listener
  useEffect(() => {
    if (!authUser) return;
    const isNative = Capacitor.isNativePlatform();
    const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
    const isMobile = isNative || isStandalone || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || "");

    const platform = isNative ? "android" : (isStandalone ? "pwa" : (isMobile ? "mobile" : "web"));
    axiosInstance.post("/auth/register-device", { platform }).catch(() => {});

    // Enable native Android Foreground Service & wake lock so device receives calls even when kept aside
    const token = sessionStorage.getItem("jwt") || localStorage.getItem("jwt") || "";
    enableMobileBackgroundMode({
      serverUrl: axiosInstance.defaults.baseURL,
      userId: String(authUser._id),
      token,
    });
  }, [authUser]);

  // Auto-reconnect socket when app wakes up or returns to foreground
  useEffect(() => {
    if (!authUser) return;

    const handleResume = () => {
      useAuthStore.getState().connectSocket();
      const { callState, handleIncomingCall } = useCallStore.getState();
      if (callState === "idle") {
        axiosInstance
          .get("/messages/pending-call")
          .then((res) => {
            if (res.data?.hasPendingCall && res.data.call) {
              handleIncomingCall(res.data.call);
            }
          })
          .catch(() => {});
      }
    };

    let capListenerHandle = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          handleResume();
        }
      }).then((handle) => {
        capListenerHandle = handle;
      }).catch(() => {});
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleResume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (capListenerHandle) capListenerHandle.remove();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authUser]);

  // Automatically logout if web user leaves device unattended (15 min inactivity)
  // On native mobile (Capacitor) or installed PWA, do NOT log out on idle,
  // so users can receive incoming calls even after their phone has been asleep or idle.
  useEffect(() => {
    if (!authUser) return;
    const isNative = Capacitor.isNativePlatform();
    const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
    if (isNative || isStandalone) return;

    let timeoutId;
    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        toast("Logged out due to inactivity", { icon: "🔒" });
        logout();
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [authUser, logout]);

  const { theme } = useThemeStore();

  // Global theme synchronization with html class, data-theme, and localStorage
  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("chat-theme", theme);
    localStorage.setItem("samvaad-theme", theme);

    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? "#0f172a" : "#f8fafc" }).catch(() => {});
    }
  }, [theme]);

  // Handle Android native hardware back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle = null;
    CapApp.addListener("backButton", ({ canGoBack }) => {
      // If a modal or dropdown is active, try to dismiss it with Escape
      const activeModal = document.querySelector(".modal-open, dialog[open], [role='dialog']");
      if (activeModal) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        return;
      }

      const hash = window.location.hash.replace(/^#\/?/, "");
      if (!hash || hash === "" || hash === "welcome") {
        CapApp.exitApp();
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    }).then((handle) => {
      listenerHandle = handle;
    }).catch(() => {});

    return () => {
      if (listenerHandle) listenerHandle.remove();
    };
  }, []);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen w-full relative bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <WelcomePage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/features" element={<WelcomePage scrollTarget="features" />} />
          <Route path="/how" element={<WelcomePage scrollTarget="how" />} />
          <Route path="/how-it-works" element={<WelcomePage scrollTarget="how" />} />
          <Route path="/calling" element={<WelcomePage scrollTarget="calling" />} />
          <Route path="/security" element={<WelcomePage scrollTarget="security" />} />
          <Route path="/compare" element={<WelcomePage scrollTarget="compare" />} />
          <Route path="/app" element={<WelcomePage scrollTarget="app" />} />
          <Route path="/faq" element={<WelcomePage scrollTarget="faq" />} />
          <Route path="/feedback" element={<WelcomePage scrollTarget="feedback" />} />
          <Route path="/profile/:id" element={authUser ? <UserProfilePage /> : <Navigate to="/login" />} />
          <Route path="/user/:id" element={authUser ? <UserProfilePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signin" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      <CallModal />
      <InstallAppBanner />
      <Toaster position="top-right" containerClassName="z-[99999]" toastOptions={{ duration: 4000 }} />
    </div>
  );
}

export default App;
