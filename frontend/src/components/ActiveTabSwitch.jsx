import { useChatStore } from "../store/useChatStore";
import { MessageSquare, Users } from "lucide-react";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab, chats, allContacts, selectedUser } = useChatStore();

  const totalUnread = chats.reduce((acc, chat) => {
    if (String(selectedUser?._id) === String(chat._id)) return acc;
    return acc + (Number(chat.unreadCount) || 0);
  }, 0);

  return (
    <div className="mx-3.5 my-2.5 p-1 rounded-full border border-border/80 bg-secondary/80 flex items-center gap-1 backdrop-blur-sm shadow-xs select-none">
      <button
        type="button"
        onClick={() => setActiveTab("chats")}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
          activeTab === "chats"
            ? "bg-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span>Chats</span>
        {totalUnread > 0 && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight ${
              activeTab === "chats"
                ? "bg-primary-foreground text-primary"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("contacts")}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
          activeTab === "contacts"
            ? "bg-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        <span>Contacts</span>
        {allContacts?.length > 0 && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight opacity-80 ${
              activeTab === "contacts"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {allContacts.length}
          </span>
        )}
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
