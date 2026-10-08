import { useThemeStore } from "../store/useThemeStore";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";

const NoConversationPlaceholder = () => {
  const { theme } = useThemeStore();
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
        <img src={theme === "dark" ? logoDark : logoLight} alt="Logo" className="size-10" />
      </div>
      <h3 className="text-xl font-semibold text-base-content mb-2">Select a conversation</h3>
      <p className="text-base-content/60 max-w-md">
        Choose a contact from the sidebar to start chatting or continue a previous conversation.
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;
