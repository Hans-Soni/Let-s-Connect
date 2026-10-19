import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import UserProfilePage from "./UserProfilePage";
import DeveloperFooter from "../components/DeveloperFooter";

import { useEffect } from "react";

function ChatPage() {
  const {
    activeTab,
    selectedUser,
    setSelectedUser,
    viewingProfileUser,
    setViewingProfileUser,
    subscribeToMessages,
  } = useChatStore();

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
    <div className="w-full max-w-6xl flex flex-col items-center gap-4 py-0 md:py-4">
      {/* MAIN CHAT APPLICATION CONTAINER */}
      <div className="relative w-full h-[100dvh] md:h-[800px] flex overflow-hidden">
        <BorderAnimatedContainer>
          {viewingProfileUser ? (
            <UserProfilePage
              profileUser={viewingProfileUser}
              onClose={() => setViewingProfileUser(null)}
            />
          ) : (
            <>
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

                {/* DEVELOPER SIDEBAR FOOTER BAR */}
                <DeveloperFooter variant="sidebar" />
              </div>

              {/* RIGHT SIDE - ACTIVE CONVERSATION OR PLACEHOLDER */}
              <div className={`flex-1 flex flex-col bg-base-300/50 backdrop-blur-sm h-full min-h-0 overflow-hidden ${selectedUser ? "flex" : "hidden md:flex"}`}>
                {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
              </div>
            </>
          )}
        </BorderAnimatedContainer>
      </div>

      {/* DEVELOPER DESCRIPTION & PROJECTS FOOTER UNDER CHAT CARD (DESKTOP) */}
      <div className="hidden md:block w-full">
        <DeveloperFooter variant="card" />
      </div>
    </div>
  );
}
export default ChatPage;
