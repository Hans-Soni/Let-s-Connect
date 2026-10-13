import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

import { useEffect } from "react";

function ChatPage() {
  const { activeTab, selectedUser, setSelectedUser } = useChatStore();

  // Support mobile system back button/swipe gesture
  useEffect(() => {
    if (!selectedUser) return;

    if (!window.history.state?.inChat) {
      window.history.pushState({ inChat: true }, "");
    }

    const onPopState = () => {
      setSelectedUser(null);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [selectedUser, setSelectedUser]);

  return (
    <div className="relative w-full max-w-6xl h-[100dvh] md:h-[800px] flex overflow-hidden">
      <BorderAnimatedContainer>
        {/* LEFT SIDE - CONTACTS & CHATS LIST */}
        <div className={`w-full md:w-80 md:min-w-[320px] bg-base-200/50 backdrop-blur-sm flex flex-col h-full border-r border-base-100/50 ${selectedUser ? "hidden md:flex" : "flex"}`}>
          <ProfileHeader />
          <ActiveTabSwitch />

          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 md:p-4 space-y-2 touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE - ACTIVE CONVERSATION OR PLACEHOLDER */}
        <div className={`flex-1 flex flex-col bg-base-300/50 backdrop-blur-sm h-full min-h-0 overflow-hidden ${selectedUser ? "flex" : "hidden md:flex"}`}>
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;
