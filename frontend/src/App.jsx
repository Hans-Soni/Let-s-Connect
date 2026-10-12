import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import GlobalThemeToggle from "./components/GlobalThemeToggle";
import { useThemeStore } from "./store/useThemeStore";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const { theme } = useThemeStore();

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div data-theme={theme} className="h-[100dvh] md:min-h-screen w-full bg-base-300 relative flex items-center justify-center p-0 md:p-4 overflow-hidden">
      {/* DECORATORS - GRID BG & GLOW SHAPES */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 -left-4 size-96 bg-primary opacity-20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 -right-4 size-96 bg-secondary opacity-20 blur-[100px] pointer-events-none" />

      {/* Global theme toggle visible on desktop or on login/signup pages */}
      <div className={authUser ? "hidden md:block" : "block"}>
        <GlobalThemeToggle />
      </div>

      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
      </Routes>

      <Toaster />
    </div>
  );
}
export default App;
