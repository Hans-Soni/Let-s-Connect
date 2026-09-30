# Components

This directory contains reusable React components that make up the user interface of the application.

## Files & Explanations

Here is a detailed breakdown of every component in this folder:

### Chat Elements
- **`ChatContainer.jsx`**: The main container for an active chat session. It displays the chat header, the scrollable list of messages, and the message input field at the bottom.
- **`ChatHeader.jsx`**: The top bar of an active chat. It displays the selected user's profile picture, name, and their online status, along with a button to close the active chat.
- **`ChatsList.jsx`**: Renders the list of users you have previously chatted with in the sidebar. It displays their avatars, names, and whether they are online.
- **`MessageInput.jsx`**: The input area at the bottom of the chat container. It handles typing text, attaching images, and sending the message to the server.

### User Elements
- **`ContactList.jsx`**: Renders the full list of all available contacts/users in the application in the sidebar, allowing you to start a new chat.
- **`ProfileHeader.jsx`**: The header displayed at the top of the sidebar. It shows your own profile information, allows you to change your avatar, and contains buttons for toggling sound and logging out.

### UI States (Loaders & Empty States)
- **`MessagesLoadingSkeleton.jsx`**: A skeleton loading animation (shimmer effect) that is displayed in the chat container while messages are being fetched from the server.
- **`NoChatHistoryPlaceholder.jsx`**: A placeholder component displayed when you open a chat with someone but no messages have been sent yet. It encourages you to send the first message.
- **`NoChatsFound.jsx`**: A placeholder displayed in the sidebar's "Chats" tab if you haven't started any conversations yet.
- **`NoConversationPlaceholder.jsx`**: The default empty state displayed in the main chat area before you select a contact to chat with from the sidebar.
- **`PageLoader.jsx`**: A full-page loading spinner used when the app is initially loading or checking authentication status.
- **`UsersLoadingSkeleton.jsx`**: A skeleton loading animation displayed in the sidebar while the list of contacts or previous chats is being fetched from the backend.

### Animations & Utilities
- **`ActiveTabSwitch.jsx`**: A toggle component (usually found in the sidebar) that lets the user switch between viewing their active "Chats" and the full "Contacts" list.
- **`BorderAnimatedContainer.jsx`**: A stylized container component used primarily on the login and signup pages to provide a glowing, animated border effect around the authentication forms.
