import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";
import { Users, Sparkles } from "lucide-react";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();
  const { theme } = useThemeStore();
  const dark = theme === "dark";

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 select-none">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card shadow-xs">
        <img
          src={dark ? emblemSilver : emblemGold}
          alt="Samवाद"
          className="h-8 w-8 object-contain"
        />
      </div>
      <div className="max-w-xs">
        <h4 className="font-semibold text-sm text-foreground">No conversations yet</h4>
        <p className="text-muted-foreground text-xs mt-0.5">
          Choose a contact from the directory to start a private conversation.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setActiveTab("contacts")}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/30 rounded-full hover:bg-primary hover:text-primary-foreground transition cursor-pointer"
      >
        <Users className="h-3.5 w-3.5" />
        Open Directory
      </button>
    </div>
  );
}
export default NoChatsFound;
