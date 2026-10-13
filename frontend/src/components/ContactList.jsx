import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, subscribeToUsers, unsubscribeFromUsers, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    if (!selectedUser) {
      getAllContacts();
    }
    subscribeToUsers();
    return () => unsubscribeFromUsers();
  }, [getAllContacts, subscribeToUsers, unsubscribeFromUsers, selectedUser]);

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
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-primary/10 p-3 sm:p-4 rounded-xl cursor-pointer hover:bg-primary/20 transition-all hover:scale-[1.01]"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"} shrink-0`}>
              <div className="size-11 sm:size-12 rounded-full ring-1 ring-base-content/10">
                <img src={contact.profilePic || `${import.meta.env.BASE_URL}avatar.png`} alt={contact.fullName} />
              </div>
            </div>
            <h4 className="text-base-content font-medium truncate text-sm sm:text-base">{contact.fullName}</h4>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
