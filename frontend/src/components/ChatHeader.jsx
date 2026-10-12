import { XIcon, ArrowLeftIcon, Sun, Moon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="flex justify-between items-center bg-base-200/80 backdrop-blur-md border-b border-base-100/50 h-16 md:h-20 px-2.5 sm:px-4 md:px-6 shrink-0 z-10 w-full">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button 
          onClick={() => setSelectedUser(null)}
          className="md:hidden p-2 -ml-1 rounded-full hover:bg-base-300/70 active:scale-95 transition-all text-base-content/80 hover:text-base-content flex items-center justify-center shrink-0"
          aria-label="Back to conversations"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className={`avatar ${isOnline ? "online" : "offline"} shrink-0`}>
          <div className="size-10 sm:size-11 rounded-full ring-1 ring-base-content/10">
            <img src={selectedUser.profilePic || "./avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-base-content font-semibold text-sm sm:text-base truncate max-w-[140px] xs:max-w-[190px] sm:max-w-xs">
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
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Desktop close button */}
        <button 
          onClick={() => setSelectedUser(null)} 
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
