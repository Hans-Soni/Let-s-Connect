import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
    <div className="space-y-1">
      {chats.map((chat) => {
        const isSelected = String(selectedUser?._id) === String(chat._id);
        const isOnline = onlineUsers.includes(chat._id);
        const unread = Number(chat.unreadCount) || 0;
        const profilePic = getUserDisplayPic(chat);

        return (
          <div
            key={chat._id}
            onClick={() => setSelectedUser(chat)}
            className={`group relative p-2.5 sm:p-3 rounded-2xl transition-all duration-150 cursor-pointer ${
              isSelected
                ? "bg-secondary text-foreground ring-1 ring-border shadow-xs"
                : "hover:bg-secondary/50 text-foreground"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar with initials fallback matching SignUpPage */}
              <div
                className="relative shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setViewingProfileUser(chat);
                  navigate(`/profile/${chat._id}`);
                }}
                title={`View ${chat.fullName}'s profile`}
              >
                {profilePic ? (
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden ring-1 ring-border">
                    <img
                      src={profilePic}
                      alt={chat.fullName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground text-xs sm:text-sm">
                    {getInitials(chat.fullName)}
                  </div>
                )}

                {/* Status Dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card transition-colors ${
                    isOnline ? "bg-online" : "bg-muted-foreground/30"
                  }`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>

              {/* User Name & Designation / Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h4
                    className={`font-semibold text-sm truncate transition-colors ${
                      isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {chat.fullName}
                  </h4>

                  {unread > 0 && !isSelected && (
                    <span className="shrink-0 h-4 min-w-[18px] px-1.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground inline-flex items-center justify-center">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {chat.designation ? (
                    <span>{chat.designation}</span>
                  ) : (
                    <span>{isOnline ? "Active now" : "Offline"}</span>
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
