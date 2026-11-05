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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 select-none">
      <div className="relative animate-float">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <div className="relative grid h-20 w-20 place-items-center rounded-2xl border border-border bg-card/80 shadow-glow backdrop-blur-xl">
          <img
            src={dark ? emblemSilver : emblemGold}
            alt="Samवाद"
            className="h-12 w-12 object-contain"
          />
        </div>
      </div>
      <div className="max-w-xs">
        <h4 className="font-display text-lg font-bold text-foreground">No active conversations</h4>
        <p className="text-muted-foreground text-xs mt-1">
          Connect with registered members from the Contacts tab to start a private conversation.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setActiveTab("contacts")}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-full shadow-glow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
      >
        <Users className="h-3.5 w-3.5" />
        Explore Contacts
      </button>
    </div>
  );
}
export default NoChatsFound;
