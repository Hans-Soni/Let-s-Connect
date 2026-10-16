import { XIcon, ArrowLeftIcon, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

function ChatHeader() {
  const navigate = useNavigate();
  const { selectedUser, setSelectedUser, setViewingProfileUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

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
    <div className="flex justify-between items-center bg-base-200/80 backdrop-blur-md border-b border-base-100/50 h-16 md:h-20 px-2 sm:px-4 md:px-6 shrink-0 z-20 w-full relative">
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button 
          type="button"
          onClick={handleBack}
          className="md:hidden p-2.5 -ml-1 rounded-full hover:bg-base-300/80 active:bg-base-300 active:scale-95 transition-all text-base-content hover:text-primary flex items-center justify-center shrink-0 cursor-pointer z-30"
          aria-label="Back to conversations"
        >
          <ArrowLeftIcon className="size-6 stroke-[2.5]" />
        </button>

        {/* User DP / Avatar - Click to open profile */}
        <div
          className={`avatar ${isOnline ? "online" : "offline"} shrink-0 cursor-pointer group/avatar`}
          onClick={handleOpenProfile}
          title={`View ${selectedUser.fullName}'s profile`}
        >
          <div className="size-10 sm:size-11 rounded-full ring-1 ring-base-content/10 group-hover/avatar:ring-2 group-hover/avatar:ring-primary group-hover/avatar:scale-105 transition-all">
            <img src={selectedUser.profilePic || `${import.meta.env.BASE_URL}avatar.png`} alt={selectedUser.fullName} />
          </div>
        </div>

        <div
          className="min-w-0 cursor-pointer select-none"
          onClick={handleOpenProfile}
          title={`View ${selectedUser.fullName}'s profile`}
        >
          <h3 className="text-base-content font-semibold text-sm sm:text-base truncate max-w-[140px] xs:max-w-[190px] sm:max-w-xs hover:text-primary transition-colors">
            {selectedUser.fullName}
          </h3>
          <p className="text-base-content/60 text-xs flex items-center gap-1.5">
            <span className={`inline-block size-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-base-content/40"}`} />
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle directly inside header */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Desktop close button */}
        <button 
          type="button"
          onClick={handleBack} 
          className="hidden md:flex btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content transition-colors cursor-pointer"
          title="Close conversation"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
