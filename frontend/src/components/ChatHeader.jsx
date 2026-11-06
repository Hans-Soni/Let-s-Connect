import { XIcon, ArrowLeftIcon, Sun, Moon, Phone, Video } from "lucide-react";
import { useNavigate } from "react-router";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useCallStore } from "../store/useCallStore";

function ChatHeader() {
  const navigate = useNavigate();
  const {
    selectedUser,
    setSelectedUser,
    setViewingProfileUser,
    getUserDisplayPic,
    isUserBlocked,
    isBlockedByUser,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { startOutgoingCall, callState } = useCallStore();

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  if (!selectedUser) return null;

  const isOnline = selectedUser._id ? onlineUsers.includes(selectedUser._id) : false;
  const isBlocked = isUserBlocked(selectedUser._id);
  const isBlockedBy = isBlockedByUser(selectedUser._id);

  const handleBack = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.history.state?.inChat) {
      window.history.back();
    }
    setSelectedUser(null);
  };

  const handleOpenProfile = () => {
    if (selectedUser) {
      setViewingProfileUser(selectedUser);
      navigate(`/profile/${selectedUser._id}`);
    }
  };

  return (
    <div className="flex justify-between items-center bg-card border-b border-border h-16 md:h-18 px-3 sm:px-5 shrink-0 z-20 w-full relative select-none">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="md:hidden p-2 -ml-1 rounded-full border border-border/60 bg-secondary/70 hover:border-primary/60 text-foreground transition-all cursor-pointer flex items-center justify-center shrink-0 z-30"
          aria-label="Back to conversations"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>

        {/* User DP / Avatar - Click to open profile */}
        <div
          className="relative shrink-0 cursor-pointer group/avatar"
          onClick={handleOpenProfile}
          title={`View ${selectedUser.fullName}'s profile`}
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden ring-2 ring-primary/40 group-hover/avatar:ring-primary group-hover/avatar:scale-105 transition-all">
            <img
              src={getUserDisplayPic(selectedUser)}
              alt={selectedUser.fullName}
              className="h-full w-full object-cover"
            />
          </div>
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card shadow-xs transition-colors duration-300 ${
              isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
          />
        </div>

        <div
          className="min-w-0 cursor-pointer select-none"
          onClick={handleOpenProfile}
          title={`View ${selectedUser.fullName}'s profile`}
        >
          <h3 className="font-display font-bold text-foreground text-sm sm:text-base truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs hover:text-primary transition-colors">
            {selectedUser.fullName}
          </h3>
          <p className="text-muted-foreground text-xs flex items-center gap-1.5 truncate">
            {isBlocked ? (
              <span className="text-destructive font-medium">Blocked</span>
            ) : isBlockedBy ? (
              <span className="text-muted-foreground/60">Unavailable</span>
            ) : (
              <>
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                    isOnline ? "bg-emerald-500 shadow-glow" : "bg-muted-foreground/40"
                  }`}
                />
                {selectedUser.designation && (
                  <span className="text-primary font-medium truncate max-w-[130px]">
                    {selectedUser.designation} •{" "}
                  </span>
                )}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Voice call button */}
        <button
          type="button"
          onClick={() => startOutgoingCall(selectedUser, "audio")}
          disabled={isBlocked || isBlockedBy || callState !== "idle"}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Start voice call"
          aria-label="Start voice call"
        >
          <Phone className="h-4 w-4" />
        </button>

        {/* Video call button */}
        <button
          type="button"
          onClick={() => startOutgoingCall(selectedUser, "video")}
          disabled={isBlocked || isBlockedBy || callState !== "idle"}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          title="Start video call"
          aria-label="Start video call"
        >
          <Video className="h-4 w-4" />
        </button>

        {/* Desktop close button */}
        <button
          type="button"
          onClick={handleBack}
          className="hidden md:grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
          title="Close conversation"
          aria-label="Close conversation"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
