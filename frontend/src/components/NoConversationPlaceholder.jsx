import { useThemeStore } from "../store/useThemeStore";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import DeveloperFooter from "./DeveloperFooter";

const NoConversationPlaceholder = () => {
  const { theme } = useThemeStore();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6 overflow-y-auto">
      <div className="size-20 sm:size-24 bg-primary/20 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-md ring-4 ring-primary/10">
        <img src={theme === "dark" ? logoDark : logoLight} alt="Logo" className="size-14 sm:size-16" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-2">Select a conversation</h3>
      <p className="text-base-content/60 max-w-md text-xs sm:text-sm">
        Choose a contact from the sidebar to start chatting or continue a previous conversation.
      </p>

      {/* DEVELOPER PROFILE & CREATIONS SHOWCASE */}
      <div className="mt-6 sm:mt-8 w-full max-w-lg">
        <DeveloperFooter variant="compact" />
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;
