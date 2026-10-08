import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();
  const { theme } = useThemeStore();

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <img src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"} alt="Logo" className="w-8 h-8" />
      </div>
      <div>
        <h4 className="text-base-content font-medium mb-1">No conversations yet</h4>
        <p className="text-base-content/60 text-sm px-6">
          Start a new chat by selecting a contact from the contacts tab
        </p>
      </div>
      <button
        onClick={() => setActiveTab("contacts")}
        className="px-4 py-2 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
      >
        Find contacts
      </button>
    </div>
  );
}
export default NoChatsFound;
