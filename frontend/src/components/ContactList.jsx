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
      <div className="sticky -top-3 md:-top-4 z-10 bg-card/95 backdrop-blur-md pt-1 pb-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
            placeholder="Search contacts by name or role..."
            className="h-10 w-full pl-9 pr-9 rounded-full border border-border bg-secondary text-xs sm:text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/25"
            aria-label="Search contacts by name or designation"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-muted-foreground">
            <span>
              {filteredContacts.length} {filteredContacts.length === 1 ? "contact" : "contacts"} found
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-primary hover:underline transition cursor-pointer font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filtered Results or Empty State */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4 space-y-3 bg-secondary/30 rounded-2xl border border-dashed border-border mt-1">
          <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No matching contacts</p>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              No contacts found for &ldquo;<span className="text-primary font-medium">{searchQuery}</span>&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="px-3 py-1 rounded-full text-xs font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredContacts.map((contact) => {
            const isSelected = String(selectedUser?._id) === String(contact._id);
            const isOnline = onlineUsers.includes(contact._id);

            return (
              <div
                key={contact._id}
                onClick={() => setSelectedUser(contact)}
                className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-primary/80 bg-primary/15 shadow-glow"
                    : "border-border/60 bg-secondary/40 hover:bg-secondary/85 hover:border-primary/40 hover:-translate-y-0.5 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* User DP / Avatar */}
                  <div
                    className="relative shrink-0 cursor-pointer group/avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setViewingProfileUser(contact);
                      navigate(`/profile/${contact._id}`);
                    }}
                    title={`View ${contact.fullName}'s profile`}
                  >
                    <div
                      className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden transition-all duration-200 ring-2 ${
                        isSelected
                          ? "ring-primary"
                          : "ring-border/60 group-hover/avatar:ring-primary/80 group-hover/avatar:scale-105"
                      }`}
                    >
                      <img
                        src={getUserDisplayPic(contact)}
                        alt={contact.fullName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Status Dot */}
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card shadow-xs transition-colors duration-300 ${
                        isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                      }`}
                      title={isOnline ? "Online" : "Offline"}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-semibold text-sm sm:text-base truncate transition-colors ${
                        isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                      }`}
                    >
                      <HighlightMatch text={contact.fullName} query={searchQuery} />
                    </h4>
                    {contact.designation ? (
                      <p className="text-muted-foreground text-xs truncate max-w-[200px] flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="h-3 w-3 shrink-0 text-primary/70" />
                        <span className="truncate">
                          <HighlightMatch text={contact.designation} query={searchQuery} />
                        </span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground/70 text-xs truncate mt-0.5">
                        {isOnline ? "Active now" : "Offline"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default ContactList;
