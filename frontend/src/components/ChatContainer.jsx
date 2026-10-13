import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    markMessagesAsSeen,
    messages,
    isMessagesLoading,
    subscribeToMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messagesContainerRef = useRef(null);
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessagesByUserId(selectedUser._id);
    markMessagesAsSeen(selectedUser._id);
    subscribeToMessages();
  }, [selectedUser, getMessagesByUserId, markMessagesAsSeen, subscribeToMessages]);

  useEffect(() => {
    const handleActive = () => {
      if (document.visibilityState === "visible" && selectedUser?._id) {
        markMessagesAsSeen(selectedUser._id);
      }
    };
    window.addEventListener("focus", handleActive);
    document.addEventListener("visibilitychange", handleActive);
    return () => {
      window.removeEventListener("focus", handleActive);
      document.removeEventListener("visibilitychange", handleActive);
    };
  }, [selectedUser, markMessagesAsSeen]);

  const scrollToBottom = (behavior = "auto") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    } else if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [selectedUser]);

  useEffect(() => {
    if (!isMessagesLoading && messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, isMessagesLoading]);

  if (!selectedUser || !authUser) return null;

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      <ChatHeader />

      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 px-3 sm:px-6 overflow-y-auto overscroll-contain py-4 md:py-6 touch-pan-y"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              >
                <div
                  className={`chat-bubble relative max-w-[85%] sm:max-w-[75%] break-words whitespace-pre-wrap shadow-sm text-sm sm:text-base ${
                    msg.senderId === authUser._id
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  }`}
                >
                  {msg.image && (
                    <img src={msg.image} alt="Shared" className="rounded-lg max-h-52 w-auto object-cover mb-1.5" />
                  )}
                  {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                  <div className="flex items-center justify-between mt-1 gap-3 pt-0.5 min-w-[72px]">
                    {/* Bottom Left Corner: Status Dot (Blue = Delivered, Green = Seen) */}
                    <div
                      className="flex items-center gap-1.5 select-none shrink-0"
                      title={msg.isSeen ? "Seen" : "Delivered"}
                    >
                      <span
                        className={`size-2.5 rounded-full inline-block transition-all duration-300 ${
                          msg.isSeen
                            ? "bg-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                            : "bg-blue-400 ring-2 ring-blue-400/50 shadow-[0_0_8px_rgba(96,165,250,0.9)]"
                        }`}
                      />
                    </div>

                    {/* Bottom Right Corner: Timestamp */}
                    <p className="text-[10px] sm:text-xs opacity-75 whitespace-nowrap ml-auto">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* 👇 scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;
