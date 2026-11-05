import { useChatStore } from "../store/useChatStore";
import { MessageSquare, Users } from "lucide-react";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab, chats, allContacts, selectedUser } = useChatStore();

  const totalUnread = chats.reduce((acc, chat) => {
    if (String(selectedUser?._id) === String(chat._id)) return acc;
    return acc + (Number(chat.unreadCount) || 0);
  }, 0);

  return (
    <div className="mx-3 my-2 p-1 rounded-full border border-border bg-secondary/50 flex items-center gap-1 select-none">
      <button
        type="button"
        onClick={() => setActiveTab("chats")}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
          activeTab === "chats"
            ? "bg-card text-foreground shadow-xs border border-border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5 opacity-80" />
        <span>Messages</span>
        {totalUnread > 0 && (
          <span className="h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center bg-primary text-primary-foreground">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("contacts")}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
          activeTab === "contacts"
            ? "bg-card text-foreground shadow-xs border border-border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="h-3.5 w-3.5 opacity-80" />
        <span>Directory</span>
        {allContacts?.length > 0 && (
          <span className="h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center bg-secondary text-muted-foreground">
            {allContacts.length}
          </span>
        )}
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
