import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { Sparkles, User } from "lucide-react";

function ChatsList() {
  const navigate = useNavigate();
  const {
    getMyChatPartners,
    chats,
    isUsersLoading,
    setSelectedUser,
    setViewingProfileUser,
    selectedUser,
    getUserDisplayPic,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    if (!selectedUser) {
      getMyChatPartners();
    }
  }, [getMyChatPartners, selectedUser]);

  if (isUsersLoading && chats.length === 0) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const isSelected = String(selectedUser?._id) === String(chat._id);
        const isOnline = onlineUsers.includes(chat._id);
        const unread = Number(chat.unreadCount) || 0;

        return (
          <div
            key={chat._id}
            onClick={() => setSelectedUser(chat)}
            className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isSelected
                ? "border-primary/80 bg-primary/15 shadow-glow"
                : "border-border/60 bg-secondary/40 hover:bg-secondary/85 hover:border-primary/40 hover:-translate-y-0.5 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* User Avatar with Online Badge */}
              <div
                className="relative shrink-0 cursor-pointer group/avatar"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setViewingProfileUser(chat);
                  navigate(`/profile/${chat._id}`);
                }}
                title={`View ${chat.fullName}'s profile`}
              >
                <div
                  className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden transition-all duration-200 ring-2 ${
                    isSelected
                      ? "ring-primary"
                      : "ring-border/60 group-hover/avatar:ring-primary/80 group-hover/avatar:scale-105"
                  }`}
                >
                  <img
                    src={getUserDisplayPic(chat)}
                    alt={chat.fullName}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Status Dot */}
                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card shadow-xs transition-colors duration-300 ${
                    isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                  }`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>

              {/* User Name & Designation / Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h4
                    className={`font-semibold text-sm sm:text-base truncate transition-colors ${
                      isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {chat.fullName}
                  </h4>

                  {unread > 0 && !isSelected && (
                    <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-glow animate-pulse">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  {chat.designation ? (
                    <span className="truncate">{chat.designation}</span>
                  ) : (
                    <span className="truncate opacity-75">{isOnline ? "Active now" : "Offline"}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default ChatsList;
