import { useThemeStore } from "../store/useThemeStore";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";

const NoChatHistoryPlaceholder = ({ name }) => {
  const { theme } = useThemeStore();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-5">
        <img src={theme === "dark" ? logoDark : logoLight} alt="Logo" className="size-12" />
      </div>
      <h3 className="text-lg font-medium text-base-content mb-3">
        Start your conversation with {name}
      </h3>
      <div className="flex flex-col space-y-3 max-w-md mb-5">
        <p className="text-base-content/60 text-sm">
          This is the beginning of your conversation. Send a message to start chatting!
        </p>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto"></div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button className="px-4 py-2 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">
          👋 Say Hello
        </button>
        <button className="px-4 py-2 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">
          🤝 How are you?
        </button>
        <button className="px-4 py-2 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">
          📅 Meet up soon?
        </button>
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
