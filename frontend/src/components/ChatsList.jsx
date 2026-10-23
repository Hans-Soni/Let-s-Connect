import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

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
    <>
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="bg-primary/10 p-3 sm:p-4 rounded-xl cursor-pointer hover:bg-primary/20 transition-all hover:scale-[1.01]"
          onClick={() => setSelectedUser(chat)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* User DP / Avatar - Click to open profile page */}
            <div
              className={`avatar ${onlineUsers.includes(chat._id) ? "online" : "offline"} shrink-0 cursor-pointer group/avatar`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setViewingProfileUser(chat);
                navigate(`/profile/${chat._id}`);
              }}
              title={`View ${chat.fullName}'s profile`}
            >
              <div className="size-11 sm:size-12 rounded-full ring-1 ring-base-content/10 group-hover/avatar:ring-2 group-hover/avatar:ring-primary group-hover/avatar:scale-105 transition-all">
                <img src={getUserDisplayPic(chat)} alt={chat.fullName} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
              <h4 className="text-base-content font-medium truncate text-sm sm:text-base">{chat.fullName}</h4>
              {Number(chat.unreadCount) > 0 && String(selectedUser?._id) !== String(chat._id) && (
                <span
                  className="shrink-0 text-lg leading-none"
                  role="img"
                  aria-label={`${chat.unreadCount} unread message${chat.unreadCount === 1 ? "" : "s"}`}
                  title={`${chat.unreadCount} unread message${chat.unreadCount === 1 ? "" : "s"}`}
                >
                  {chat.unreadCount > 5 ? "😠" : "😊"}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ChatsList;
