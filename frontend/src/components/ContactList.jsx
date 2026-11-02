import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { Search, X, Briefcase } from "lucide-react";

/**
 * Helper component that highlights matching search tokens in text.
 */
function HighlightMatch({ text, query }) {
  if (!text) return null;
  const trimmed = query?.trim();
  if (!trimmed) return <span>{text}</span>;

  const words = Array.from(
    new Set(
      trimmed
        .split(/\s+/)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .filter(Boolean)
    )
  );

  if (words.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        words.some((w) => new RegExp(`^${w}$`, "i").test(part)) ? (
          <span
            key={index}
            className="text-primary font-bold underline decoration-primary/50 underline-offset-2"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}

function ContactList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    getAllContacts,
    allContacts,
    setSelectedUser,
    setViewingProfileUser,
    isUsersLoading,
    subscribeToUsers,
    unsubscribeFromUsers,
    selectedUser,
    getUserDisplayPic,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    if (!selectedUser) {
      getAllContacts();
    }
    subscribeToUsers();
    return () => unsubscribeFromUsers();
  }, [getAllContacts, subscribeToUsers, unsubscribeFromUsers, selectedUser]);

  // Real-time filtering matching by name and designation
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allContacts;

    const queryWords = q.split(/\s+/).filter(Boolean);

    return allContacts.filter((contact) => {
      const name = (contact.fullName || "").toLowerCase();
      const designation = (contact.designation || "").toLowerCase();

      // Check full phrase match
      if (name.includes(q) || designation.includes(q)) return true;

      // Check all query words match either name or designation
      return queryWords.every((word) => name.includes(word) || designation.includes(word));
    });
  }, [allContacts, searchQuery]);

  if (isUsersLoading && allContacts.length === 0) return <UsersLoadingSkeleton />;

  if (allContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
        <p className="text-base-content/60 text-sm">No contacts found</p>
      </div>
    );
  }

  return (
    <>
      {/* Sticky Search Header */}
      <div className="sticky -top-3 md:-top-4 z-10 bg-base-200/95 backdrop-blur-md pt-1 pb-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-base-content/40 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
            placeholder="Search by name or designation..."
            className="input input-sm sm:input-md w-full pl-9 pr-9 bg-base-100/90 border border-base-content/15 focus:border-primary focus:outline-none rounded-xl text-xs sm:text-sm placeholder:text-base-content/40 transition-all shadow-xs"
            aria-label="Search contacts by name or designation"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-base-content/10 text-base-content/50 hover:text-base-content transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] text-base-content/60">
            <span>
              {filteredContacts.length} {filteredContacts.length === 1 ? "contact" : "contacts"} found
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="hover:text-primary transition-colors cursor-pointer underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filtered Results or Empty State */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4 space-y-3 bg-base-100/40 rounded-2xl border border-dashed border-base-content/15 mt-1">
          <div className="size-11 rounded-full bg-base-200/80 flex items-center justify-center text-base-content/40">
            <Search className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-base-content">No matching contacts</p>
            <p className="text-xs text-base-content/60 max-w-[220px]">
              No contacts found for &ldquo;<span className="text-primary font-medium">{searchQuery}</span>&rdquo; by name or designation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="btn btn-xs btn-outline btn-primary rounded-lg font-normal cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : (
        filteredContacts.map((contact) => (
          <div
            key={contact._id}
            className="bg-primary/10 p-3 sm:p-4 rounded-xl cursor-pointer hover:bg-primary/20 transition-all hover:scale-[1.01]"
            onClick={() => setSelectedUser(contact)}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* User DP / Avatar - Click to open profile page */}
              <div
                className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"} shrink-0 cursor-pointer group/avatar`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setViewingProfileUser(contact);
                  navigate(`/profile/${contact._id}`);
                }}
                title={`View ${contact.fullName}'s profile`}
              >
                <div className="size-11 sm:size-12 rounded-full ring-1 ring-base-content/10 group-hover/avatar:ring-2 group-hover/avatar:ring-primary group-hover/avatar:scale-105 transition-all">
                  <img src={getUserDisplayPic(contact)} alt={contact.fullName} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base-content font-medium truncate text-sm sm:text-base">
                  <HighlightMatch text={contact.fullName} query={searchQuery} />
                </h4>
                {contact.designation && (
                  <p className="text-base-content/60 text-xs truncate max-w-[200px] flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="size-3 shrink-0 text-primary/70" />
                    <span className="truncate">
                      <HighlightMatch text={contact.designation} query={searchQuery} />
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}

export default ContactList;
