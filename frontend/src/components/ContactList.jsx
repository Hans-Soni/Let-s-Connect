import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, subscribeToUsers, unsubscribeFromUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
    subscribeToUsers();
    return () => unsubscribeFromUsers();
  }, [getAllContacts, subscribeToUsers, unsubscribeFromUsers]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-primary/10 p-3 sm:p-4 rounded-xl cursor-pointer hover:bg-primary/20 transition-all hover:scale-[1.01]"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"} shrink-0`}>
              <div className="size-11 sm:size-12 rounded-full ring-1 ring-base-content/10">
                <img src={contact.profilePic || "./avatar.png"} alt={contact.fullName} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base-content font-medium truncate text-sm sm:text-base">{contact.fullName}</h4>
              <p className="text-xs text-base-content/60 truncate font-mono">{contact.email}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
