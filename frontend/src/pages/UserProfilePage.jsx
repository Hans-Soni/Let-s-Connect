import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import PageLoader from "../components/PageLoader";
import {
  ArrowLeft,
  Trash2,
  MessageSquare,
  Sun,
  Moon,
  ShieldAlert,
  Loader2,
  ZoomIn,
  X,
  Mail,
  CircleDot,
} from "lucide-react";

function UserProfilePage({ profileUser, onClose }) {
  const { id: paramId } = useParams();
  const id = profileUser?._id || paramId;
  const navigate = useNavigate();

  const {
    allContacts,
    chats,
    selectedUser,
    getAllContacts,
    getMyChatPartners,
    getUserProfile,
    deleteChatHistory,
    setSelectedUser,
    setActiveTab,
    setViewingProfileUser,
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [user, setUser] = useState(() => {
    if (profileUser) return profileUser;
    if (selectedUser && (!id || selectedUser._id === id)) return selectedUser;
    return (
      allContacts.find((u) => u._id === id) ||
      chats.find((u) => u._id === id) ||
      null
    );
  });

  const [isLoading, setIsLoading] = useState(!user);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchUser = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      // First check in-memory stores
      const foundInContacts = allContacts.find((u) => u._id === id);
      const foundInChats = chats.find((u) => u._id === id);
      if (foundInContacts || foundInChats) {
        if (isMounted) {
          setUser(foundInContacts || foundInChats);
          setIsLoading(false);
        }
        return;
      }

      // Try fetching profile from API
      try {
        const data = await getUserProfile(id);
        if (isMounted) {
          if (data) setUser(data);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [id, user, allContacts, chats, getUserProfile]);

  const isOnline = user?._id ? onlineUsers.includes(user._id) : false;
  const isMe = authUser?._id && user?._id && authUser._id === user._id;

  const handleBackToContacts = () => {
    setActiveTab("contacts");
    setSelectedUser(null);
    setViewingProfileUser(null);
    if (onClose) onClose();
    navigate("/");
  };

  const handleStartChat = () => {
    if (!user) return;
    setSelectedUser(user);
    setViewingProfileUser(null);
    if (onClose) onClose();
    navigate("/");
  };

  const handleDeleteHistory = async () => {
    if (!user?._id) return;
    setIsDeleting(true);
    await deleteChatHistory(user._id);
    setIsDeleting(false);
    setShowConfirmModal(false);

    // Send user back to the contacts list as requested
    setActiveTab("contacts");
    setSelectedUser(null);
    setViewingProfileUser(null);
    if (onClose) onClose();
    navigate("/");
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="relative w-full h-full p-4 flex flex-col items-center justify-center text-center">
        <div className="p-8 w-full max-w-md flex flex-col items-center bg-base-200/80 rounded-2xl border border-base-100/50">
          <ShieldAlert className="size-16 text-error mb-4" />
          <h2 className="text-xl font-bold text-base-content mb-2">User Not Found</h2>
          <p className="text-base-content/60 mb-6 text-sm">
            The requested user profile could not be loaded.
          </p>
          <button
            onClick={handleBackToContacts}
            className="btn btn-primary gap-2 rounded-xl"
          >
            <ArrowLeft className="size-4" />
            Back to Contacts List
          </button>
        </div>
      </div>
    );
  }

  const profileImageUrl = user.profilePic || `${import.meta.env.BASE_URL}avatar.png`;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-base-200/60 backdrop-blur-md">
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-base-100/50 shrink-0 z-10">
        <button
          onClick={handleBackToContacts}
          className="btn btn-ghost btn-sm gap-2 text-base-content/80 hover:text-base-content rounded-xl"
          title="Return to Contacts List"
        >
          <ArrowLeft className="size-4" />
          <span className="font-medium text-xs sm:text-sm">Back to Contacts</span>
        </button>

        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-base-content/60">
          User Profile
        </span>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </button>
      </div>

      {/* MAIN SCROLLABLE CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center">
        {/* AMBIENT GLOW BEHIND AVATAR */}
        <div className="relative flex flex-col items-center">
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full pointer-events-none" />

          {/* BIG DP / USER IMAGE (Placed above his name) */}
          <div
            className="relative group cursor-pointer"
            onClick={() => setShowImageLightbox(true)}
            title="Click to zoom / view full picture"
          >
            <div className="w-40 h-40 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full overflow-hidden ring-4 ring-primary/40 shadow-2xl bg-base-300 transition-all duration-300 group-hover:scale-[1.03] group-hover:ring-primary/80">
              <img
                src={profileImageUrl}
                alt={user.fullName || "User DP"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* ZOOM HINT OVERLAY ON HOVER */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <span className="text-white text-xs font-medium flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md">
                <ZoomIn className="size-3.5" /> View Photo
              </span>
            </div>

            {/* ONLINE / OFFLINE BADGE */}
            <span
              className={`absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 size-5 sm:size-6 rounded-full ring-4 ring-base-200 shadow-md ${
                isOnline ? "bg-emerald-500" : "bg-base-content/40"
              }`}
              title={isOnline ? "Online" : "Offline"}
            />
          </div>

          {/* USER'S NAME (Directly below DP) */}
          <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight text-center">
            {user.fullName || "User"}
          </h1>

          {/* USER'S EMAIL */}
          {user.email && (
            <p className="mt-1 text-sm sm:text-base text-base-content/60 flex items-center justify-center gap-1.5 text-center">
              <Mail className="size-3.5 opacity-70" />
              <span>{user.email}</span>
            </p>
          )}

          {/* ACTIVE STATUS BADGE */}
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-100/70 border border-base-100/80 text-xs font-medium shadow-sm">
            <span
              className={`size-2 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-base-content/40"
              }`}
            />
            <span className="text-base-content/80">
              {isOnline ? "Active Now" : "Offline"}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS (Under the user's name) */}
        <div className="w-full max-w-md mt-8 space-y-3.5">
          {/* PRIMARY OPTION: SEND MESSAGE */}
          {!isMe && (
            <button
              type="button"
              onClick={handleStartChat}
              className="btn btn-primary w-full gap-2.5 rounded-xl shadow-md hover:shadow-lg font-semibold text-sm sm:text-base py-3 transition-all"
            >
              <MessageSquare className="size-4.5" />
              <span>Send Message to {user.fullName ? user.fullName.split(" ")[0] : "User"}</span>
            </button>
          )}

          {/* OPTION: DELETE USER'S CHAT HISTORY */}
          {!isMe && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-error btn-outline hover:bg-error hover:text-white w-full gap-2.5 rounded-xl font-semibold text-sm sm:text-base py-3 transition-all shadow-sm group"
            >
              <Trash2 className="size-4.5 group-hover:scale-110 transition-transform" />
              <span>Delete Chat History</span>
            </button>
          )}

          {/* OPTION: SEND HIM BACK TO CONTACTS LIST */}
          <button
            type="button"
            onClick={handleBackToContacts}
            className="btn btn-ghost w-full gap-2 rounded-xl text-base-content/70 hover:text-base-content text-sm sm:text-base py-3 transition-colors"
          >
            <ArrowLeft className="size-4.5" />
            <span>Back to Contacts List</span>
          </button>
        </div>

        {/* ENCRYPTION BADGE */}
        <div className="mt-8 text-center max-w-sm">
          <div className="p-3.5 rounded-2xl bg-base-100/40 border border-base-100/60 flex items-center justify-center gap-2 text-xs text-base-content/60">
            <CircleDot className="size-3.5 text-primary" />
            <span>Messages and media are encrypted end-to-end</span>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR DELETING CHAT HISTORY */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-base-100 border border-base-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-error">
              <div className="p-3 bg-error/10 rounded-xl">
                <Trash2 className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-base-content">
                Delete Chat History?
              </h3>
            </div>

            <p className="text-sm text-base-content/70 leading-relaxed">
              Are you sure you want to permanently delete all chat history with{" "}
              <strong className="text-base-content">{user.fullName}</strong>? You will be sent back
              to the contacts list.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="btn btn-ghost btn-sm rounded-xl px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteHistory}
                disabled={isDeleting}
                className="btn btn-error btn-sm rounded-xl px-4 gap-2 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    <span>Yes, Delete History</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR BIG PROFILE PICTURE */}
      {showImageLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowImageLightbox(false)}
        >
          <div
            className="relative max-w-lg w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageLightbox(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              title="Close"
            >
              <X className="size-6" />
            </button>

            <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/20 bg-base-300">
              <img
                src={profileImageUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-4 text-center">
              <h4 className="text-lg font-bold text-white">{user.fullName}</h4>
              <p className="text-xs text-white/70">Display Picture</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;
