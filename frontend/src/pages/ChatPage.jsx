import { useEffect } from "react";
import { Link } from "react-router";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import UserProfilePage from "./UserProfilePage";
import DeveloperFooter from "../components/DeveloperFooter";

import logoLight from "../assets/samvaad_logo_light.png";
import logoDark from "../assets/samvaad_logo_dark.png";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";
import { ShieldCheck, Sparkles } from "lucide-react";

import "../auth.css";

// Dual-theme lotus emblem component (gold in light mode, silver in dark mode)
function LotusEmblem({ dark, className = "" }) {
  return (
    <img
      src={dark ? emblemSilver : emblemGold}
      alt="Lotus flower"
      className={`transition-all duration-300 ${className}`}
    />
  );
}

// Brand logo link to welcome page
function LogoLink({ dark }) {
  return (
    <Link to="/" title="Back to welcome page" className="block transition hover:scale-[1.03]">
      <img
        src={dark ? logoDark : logoLight}
        alt="Samवाद"
        className="h-8 sm:h-9 w-auto transition-opacity duration-300"
      />
    </Link>
  );
}

// Animated theme toggle button matching Login & Signup
function ThemeToggle({ dark, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-card/80 backdrop-blur transition hover:border-primary/60 cursor-pointer shadow-xs"
    >
      <span
        className={`absolute transition-all duration-500 ${
          dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span
        className={`absolute transition-all duration-500 ${
          dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </span>
    </button>
  );
}

function ChatPage() {
  const {
    activeTab,
    selectedUser,
    setSelectedUser,
    viewingProfileUser,
    setViewingProfileUser,
    subscribeToMessages,
  } = useChatStore();

  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();
  const dark = theme === "dark";

  // Sync theme with HTML class and localStorage
  useEffect(() => {
    const saved = localStorage.getItem("samvad-theme");
    if (saved === "light" || saved === "dark") {
      if (saved !== theme) setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      document.documentElement.classList.toggle("dark", dark);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    const nextTheme = nextDark ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("samvad-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  useEffect(() => {
    subscribeToMessages();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [subscribeToMessages]);

  // Support mobile system back button/swipe gesture
  useEffect(() => {
    if (!selectedUser && !viewingProfileUser) return;

    if (!window.history.state?.inChat && !window.history.state?.inProfile) {
      window.history.pushState({ inChat: Boolean(selectedUser), inProfile: Boolean(viewingProfileUser) }, "");
    }

    const onPopState = () => {
      if (viewingProfileUser) {
        setViewingProfileUser(null);
      } else if (selectedUser) {
        setSelectedUser(null);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [selectedUser, setSelectedUser, viewingProfileUser, setViewingProfileUser]);

  return (
    <div className="auth-page relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-background text-foreground">
      {/* Ambient Gradient Blobs */}
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-[28rem] w-[28rem] rounded-full bg-primary-glow/20 blur-3xl animate-blob [animation-delay:-7s]" />

      {/* Orbit Rings with Satellites */}
      <div className="pointer-events-none absolute -top-72 left-1/2 h-[640px] w-[640px] orbit animate-orbit opacity-50">
        <span className="absolute bottom-6 left-1/2 h-3 w-3 rounded-full bg-primary shadow-glow" />
        <span className="absolute right-10 top-1/2 h-2 w-2 rounded-full bg-primary-glow" />
      </div>
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full border border-primary/25 shadow-glow opacity-50" />

      {/* Floating Lotus Emblems */}
      <LotusEmblem dark={dark} className="pointer-events-none absolute left-6 top-16 w-24 opacity-30 animate-float" />
      <LotusEmblem dark={dark} className="pointer-events-none absolute right-10 bottom-8 w-32 -rotate-12 opacity-25 animate-float [animation-delay:-4s]" />

      {/* Top Application Header Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <LogoLink dark={dark} />
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-online" />
            Live WebRTC Direct
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            P2P Ephemeral
          </span>
          <ThemeToggle dark={dark} toggle={toggleTheme} />
          {authUser && (
            <button
              type="button"
              onClick={() => setViewingProfileUser(authUser)}
              className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border border-border bg-card/60 hover:border-primary/50 transition cursor-pointer backdrop-blur-sm"
              title="Open profile settings"
            >
              <img
                src={authUser.profilePic || `${import.meta.env.BASE_URL}avatar.png`}
                alt={authUser.fullName}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
              />
              <span className="text-xs font-medium text-foreground max-w-[90px] sm:max-w-[130px] truncate">
                {authUser.fullName}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CHAT APPLICATION CONTAINER */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-2 sm:px-4 md:px-6 py-1 sm:py-2 flex flex-col min-h-0">
        <div className="relative w-full flex-1 flex overflow-hidden min-h-[560px] h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)]">
          <BorderAnimatedContainer>
            {viewingProfileUser ? (
              <UserProfilePage
                profileUser={viewingProfileUser}
                onClose={() => setViewingProfileUser(null)}
              />
            ) : (
              <>
                {/* LEFT SIDE - CONTACTS & CHATS LIST */}
                <div
                  className={`w-full md:w-80 md:min-w-[320px] bg-card/50 backdrop-blur-xl flex flex-col h-full border-r border-border ${
                    selectedUser ? "hidden md:flex" : "flex"
                  }`}
                >
                  <ProfileHeader />
                  <ActiveTabSwitch />

                  <div
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 sm:p-3 space-y-1 touch-pan-y"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {activeTab === "chats" ? <ChatsList /> : <ContactList />}
                  </div>
                </div>

                {/* RIGHT SIDE - ACTIVE CONVERSATION OR PLACEHOLDER */}
                <div
                  className={`flex-1 flex flex-col bg-card/30 backdrop-blur-sm h-full min-h-0 overflow-hidden ${
                    selectedUser ? "flex" : "hidden md:flex"
                  }`}
                >
                  {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
                </div>
              </>
            )}
          </BorderAnimatedContainer>
        </div>
      </main>

      {/* DEVELOPER DESCRIPTION FOOTER UNDER CHAT CARD (DESKTOP) */}
      <footer className="hidden md:block relative z-10 mx-auto w-full max-w-7xl px-4 py-1.5 text-center shrink-0">
        <DeveloperFooter variant="card" />
      </footer>
    </div>
  );
}
export default ChatPage;
