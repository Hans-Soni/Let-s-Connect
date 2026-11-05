import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import toast from "react-hot-toast";

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
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior,
        });
      } else if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior });
      }
    });
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
        className="flex-1 min-h-0 px-3 sm:px-6 overflow-y-auto overscroll-contain py-4 md:py-6 touch-pan-y bg-gradient-to-b from-card/30 via-card/50 to-card/80"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === authUser._id;

              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} animate-rise`}
                >
                  <div
                    className={`relative max-w-[85%] sm:max-w-[75%] p-3 sm:p-3.5 break-words whitespace-pre-wrap text-sm sm:text-base transition-all ${
                      isMe
                        ? "rounded-2xl rounded-br-xs bg-primary text-primary-foreground shadow-glow"
                        : "rounded-2xl rounded-bl-xs bg-secondary/85 text-foreground border border-border/80 shadow-xs"
                    }`}
                  >
                    {msg.image && (
                      <div className="overflow-hidden rounded-xl mb-2 border border-black/10">
                        <img
                          src={msg.image}
                          alt="Shared"
                          loading="lazy"
                          decoding="async"
                          className="max-h-60 w-auto object-cover hover:scale-[1.02] transition-transform duration-300"
                        />
                      </div>
                    )}
                    {msg.video && (
                      <video
                        controls
                        preload="metadata"
                        src={msg.video}
                        className="block max-w-full max-h-72 rounded-xl mb-2 overflow-hidden shadow-sm"
                        aria-label="Shared video"
                        onError={() => {
                          toast.error("This video could not be played.");
                        }}
                      >
                        Your browser does not support video playback.
                      </video>
                    )}
                    {msg.audio && (
                      <audio
                        controls
                        preload="metadata"
                        src={msg.audio}
                        className="block w-64 max-w-full h-10 mb-2 rounded-lg"
                        aria-label="Voice message"
                        onError={() => {
                          toast.error("This voice message could not be played.");
                        }}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    )}
                    {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                    {/* Status Dot & Time */}
                    <div className="flex items-center justify-between mt-1 gap-2.5 pt-0.5 min-w-[70px]">
                      {isMe ? (
                        <div
                          className="flex items-center gap-1.5 select-none shrink-0"
                          title={msg.isSeen ? "Seen by recipient" : "Delivered"}
                        >
                          <span
                            className="h-2 w-2 rounded-full transition-all duration-300 inline-block"
                            style={{
                              backgroundColor: msg.isSeen ? "#10b981" : "#38bdf8",
                              boxShadow: msg.isSeen
                                ? "0 0 8px rgba(16, 185, 129, 0.9)"
                                : "0 0 8px rgba(56, 189, 248, 0.9)",
                            }}
                          />
                        </div>
                      ) : (
                        <span />
                      )}

                      <p
                        className={`text-[10px] sm:text-xs font-mono ml-auto ${
                          isMe ? "text-primary-foreground/75" : "text-muted-foreground"
                        }`}
                      >
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
              );
            })}
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
