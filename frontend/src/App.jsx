import { Navigate, Route, Routes, useLocation } from "react-router";
import { useEffect, lazy, Suspense } from "react";
import { useAuthStore } from "./store/useAuthStore";
import PageLoader from "./components/PageLoader";
import GlobalThemeToggle from "./components/GlobalThemeToggle";
import { useThemeStore } from "./store/useThemeStore";
import CallModal from "./components/CallModal";
import toast, { Toaster } from "react-hot-toast";

// Code-split pages for smaller initial bundle and faster load performance
const ChatPage = lazy(() => import("./pages/ChatPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));

function App() {
  const { checkAuth, isCheckingAuth, authUser, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Automatically logout if user leaves device unattended (15 min inactivity)
  useEffect(() => {
    if (!authUser) return;

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

  if (isCheckingAuth) return <PageLoader />;

  const isWelcomePage = (!authUser && location.pathname === "/") || location.pathname === "/welcome";

  if (isWelcomePage) {
    return (
      <div className="min-h-screen w-full relative">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={authUser ? <ChatPage /> : <WelcomePage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/profile/:id" element={authUser ? <UserProfilePage /> : <Navigate to={"/login"} />} />
            <Route path="/user/:id" element={authUser ? <UserProfilePage /> : <Navigate to={"/login"} />} />
            <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
            <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
          </Routes>
        </Suspense>
        <CallModal />
        <Toaster position="top-right" containerClassName="z-[99999]" toastOptions={{ duration: 4000 }} />
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      className={`min-h-[100dvh] w-full bg-base-300 relative flex items-center justify-center p-0 md:p-4 ${
        authUser
          ? "h-[100dvh] md:h-auto md:min-h-screen overflow-hidden md:overflow-y-auto"
          : "overflow-y-auto"
      }`}
    >
      {/* DECORATORS - GRID BG & GLOW SHAPES (Only on chat / auth pages) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 -left-4 size-96 bg-primary opacity-20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 -right-4 size-96 bg-secondary opacity-20 blur-[100px] pointer-events-none" />

      {/* Global theme toggle visible on login/signup or desktop chat */}
      <div className={authUser ? "hidden md:block" : "block"}>
        <GlobalThemeToggle />
      </div>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <WelcomePage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/profile/:id" element={authUser ? <UserProfilePage /> : <Navigate to={"/login"} />} />
          <Route path="/user/:id" element={authUser ? <UserProfilePage /> : <Navigate to={"/login"} />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
        </Routes>
      </Suspense>

      <CallModal />
      <Toaster position="top-right" containerClassName="z-[99999]" toastOptions={{ duration: 4000 }} />
    </div>
  );
}
export default App;
